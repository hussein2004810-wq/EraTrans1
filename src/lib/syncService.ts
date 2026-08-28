import { getClient } from "./supabaseClient";
import { SEED_ACCOUNT_EMAILS } from "../data/seed";

/**
 * طبقة المزامنة مع Supabase.
 * كل مجموعة بيانات تُخزَّن كصفوف {id, data(jsonb)} في جدول مستقل،
 * ما يسمح بكتابة متزامنة من عدة أجهزة دون مسح بيانات الآخرين.
 */

export type CollectionName =
  | "accounts" | "exams" | "questions" | "attempts" | "shares"
  | "universities" | "colleges" | "depts" | "vignettes" | "vignetteAudit" | "audit";

const TABLES: Record<CollectionName, string> = {
  accounts: "kiur_accounts",
  exams: "kiur_exams",
  questions: "kiur_questions",
  attempts: "kiur_attempts",
  shares: "kiur_shares",
  universities: "kiur_universities",
  colleges: "kiur_colleges",
  depts: "kiur_depts",
  vignettes: "kiur_vignettes",
  vignetteAudit: "kiur_vignette_audit",
  audit: "kiur_audit",
};

/** صف فحص صلاحية الكتابة — يُستبعد دائمًا من النتائج */
const PROBE_ID = "__kiur_probe__";

interface Row<T> {
  id: string;
  data: T;
  updated_at?: string;
}

function keyOf(item: unknown): string {
  const it = item as { id?: string; email?: string };
  return it.id ?? it.email ?? "";
}

/** نتيجة عملية كتابة مع تشخيص الخطأ */
export interface PushResult {
  ok: boolean;
  error?: string;
  code?: string;
}

/** سحب كل صفوف مجموعة من السحابة (مع استبعاد صف الفحص إن وُجد) */
export async function pull<T>(name: CollectionName): Promise<T[] | null> {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from(TABLES[name]).select("id, data, updated_at");
  if (error) return null;
  return (data as Row<T>[])
    .filter((r) => r.id !== PROBE_ID)
    .map((r) => r.data);
}

/**
 * دفع مجموعة كاملة (upsert لكل عنصر).
 * أمان: تُجرَّد كلمات المرور من الحسابات قبل إرسالها إلى السحابة —
 * المصادقة الحقيقية تعيش في Supabase Auth وليس في قاعدة البيانات.
 */
export async function push<T>(name: CollectionName, items: T[]): Promise<PushResult> {
  const sb = getClient();
  if (!sb) return { ok: false, error: "no-client" };
  if (items.length === 0) return { ok: true };

  const safe: unknown[] =
    name === "accounts"
      ? (items as { email?: string; password?: string }[])
          /* استبعاد حسابات العرض التجريبي من السحابة */
          .filter((a) => !SEED_ACCOUNT_EMAILS.has((a.email ?? "").toLowerCase()))
          .map((a) => {
            /* وتجريد كلمات المرور — المصادقة تعيش في Supabase Auth */
            const { password: _pw, ...rest } = a;
            return rest;
          })
      : items;
  if (safe.length === 0) return { ok: true };

  const rows: Row<T>[] = (safe as T[]).map((it) => ({ id: keyOf(it), data: it }));
  const { error } = await sb.from(TABLES[name]).upsert(rows, { onConflict: "id" });
  if (error) {
    return {
      ok: false,
      error: error.message,
      code: (error as { code?: string }).code,
    };
  }
  return { ok: true };
}

/** حذف صف واحد */
export async function removeRow(name: CollectionName, id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from(TABLES[name]).delete().eq("id", id);
  return !error;
}

/**
 * فحص صلاحية الكتابة إلى السحابة: محاولة upsert لصف فحص ثم حذفه.
 * يميّز بين: جداول ناقصة، سياسات RLS مانعة، أو مشكلة أخرى.
 */
export async function probeWrite(): Promise<PushResult> {
  const sb = getClient();
  if (!sb) return { ok: false, error: "no-client" };
  const { error: upErr } = await sb
    .from("kiur_accounts")
    .upsert({ id: PROBE_ID, data: { __probe: true } }, { onConflict: "id" });
  if (upErr) {
    return {
      ok: false,
      error: upErr.message,
      code: (upErr as { code?: string }).code,
    };
  }
  await sb.from("kiur_accounts").delete().eq("id", PROBE_ID);
  return { ok: true };
}

export interface FullSnapshot {
  accounts: unknown[] | null;
  exams: unknown[] | null;
  questions: unknown[] | null;
  attempts: unknown[] | null;
  shares: unknown[] | null;
  universities: unknown[] | null;
  colleges: unknown[] | null;
  depts: unknown[] | null;
  vignettes: unknown[] | null;
  vignetteAudit: unknown[] | null;
  audit: unknown[] | null;
}

/** سحب كل المجموعات دفعة واحدة */
export async function pullAll(): Promise<FullSnapshot> {
  const names = Object.keys(TABLES) as CollectionName[];
  const results = await Promise.all(names.map((n) => pull<unknown>(n)));
  const snap = {} as FullSnapshot;
  names.forEach((n, i) => {
    snap[n] = results[i];
  });
  return snap;
}

/**
 * مزامنة أولية عند الاتصال:
 * - الجدول الفارغ في السحابة ← يُملأ بالبيانات المحلية (بذر).
 * - الجدول المعمور ← تُعتمد بيانات السحابة.
 * ترجع البيانات وعدد مجموعات البذر التي فشلت كتابتها.
 */
export async function initialSync(
  local: Record<CollectionName, unknown[]>
): Promise<{ data: Partial<Record<CollectionName, unknown[]>>; failed: number }> {
  const snap = await pullAll();
  const out: Partial<Record<CollectionName, unknown[]>> = {};
  let failed = 0;
  const names = Object.keys(TABLES) as CollectionName[];
  for (const n of names) {
    const cloud = snap[n];
    if (cloud === null) continue; // خطأ قراءة — نتجاهل هذه المجموعة
    if (cloud.length === 0) {
      const r = await push(n, local[n]);
      if (!r.ok) failed++;
      out[n] = local[n];
    } else {
      out[n] = cloud;
    }
  }
  return { data: out, failed };
}
