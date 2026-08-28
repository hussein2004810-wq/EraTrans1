import { getClient } from "./supabaseClient";

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

interface Row<T> {
  id: string;
  data: T;
  updated_at?: string;
}

function keyOf(item: unknown): string {
  const it = item as { id?: string; email?: string };
  return it.id ?? it.email ?? "";
}

/** سحب كل صفوف مجموعة من السحابة */
export async function pull<T>(name: CollectionName): Promise<T[] | null> {
  const sb = getClient();
  if (!sb) return null;
  const { data, error } = await sb.from(TABLES[name]).select("id, data, updated_at");
  if (error) return null;
  return (data as Row<T>[]).map((r) => r.data);
}

/** دفع مجموعة كاملة (upsert لكل عنصر) */
export async function push<T>(name: CollectionName, items: T[]): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  if (items.length === 0) return true;
  const rows: Row<T>[] = items.map((it) => ({ id: keyOf(it), data: it }));
  const { error } = await sb.from(TABLES[name]).upsert(rows, { onConflict: "id" });
  return !error;
}

/** حذف صف واحد */
export async function removeRow(name: CollectionName, id: string): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from(TABLES[name]).delete().eq("id", id);
  return !error;
}

/** مسح جدول كامل */
export async function clearTable(name: CollectionName): Promise<boolean> {
  const sb = getClient();
  if (!sb) return false;
  const { error } = await sb.from(TABLES[name]).delete().neq("id", "");
  return !error;
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
 */
export async function initialSync(local: Record<CollectionName, unknown[]>): Promise<Partial<Record<CollectionName, unknown[]>>> {
  const snap = await pullAll();
  const out: Partial<Record<CollectionName, unknown[]>> = {};
  const names = Object.keys(TABLES) as CollectionName[];
  for (const n of names) {
    const cloud = snap[n];
    if (cloud === null) continue; // خطأ قراءة — نتجاهل هذه المجموعة
    if (cloud.length === 0) {
      await push(n, local[n]);
      out[n] = local[n];
    } else {
      out[n] = cloud;
    }
  }
  return out;
}
