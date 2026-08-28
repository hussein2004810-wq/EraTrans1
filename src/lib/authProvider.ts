import type { Account } from "../types";
import { getClient, getConfig } from "./supabaseClient";

/**
 * مزوّد المصادقة — المرحلة الثانية.
 *
 * وضعان:
 *  - السحابي (Supabase مُهيأ): كلمات المرور تُدار عبر Supabase Auth (مشفّرة bcrypt)،
 *    ولا تُخزَّن أبدًا في قاعدة البيانات. حدّ المعدل (hook) يحمي من التخمين المتكرر.
 *  - المحلي (بدون Supabase): السلوك السابق — حسابات في localStorage للتجربة الفردية.
 *
 * قاعدة التمهيد الآمنة: أول حساب يُسجَّل في الوضع السحابي يصبح «مالك المنصة»،
 * وما بعده طلاب يرقّيهم المالك من لوحة الإشراف (لا تُنشأ كلمات مرور من العميل).
 */

export type AuthOutcome =
  | { ok: true; account: Account }
  | { ok: false; error: string };

export function isCloudAuth(): boolean {
  return getConfig() !== null;
}

/** نسخة من الحساب بلا كلمة مرور — الآمنة للتخزين والمزامنة */
export function withoutPassword(acc: Account): Account {
  return { ...acc, password: "" };
}

/**
 * تسجيل حساب جديد.
 * cloud: signUp في Supabase Auth ثم حفظ الحساب (بلا كلمة مرور) في kiur_accounts.
 * إذا كانت القائمة فارغة يصبح أول حساب هو المالك (تمهيد آمن).
 */
export async function registerAccount(
  acc: Account,
  _existing: Account[]
): Promise<AuthOutcome> {
  if (!isCloudAuth()) {
    /* الوضع المحلي تُديره App مباشرة — نصل هنا فقط في السحابي */
    return { ok: true, account: acc };
  }
  const sb = getClient();
  if (!sb) return { ok: false, error: "cloud_unreachable" };

  const { data, error } = await sb.auth.signUp({
    email: acc.email,
    password: acc.password,
    options: { data: { name: acc.name } },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "signup_failed" };

  /* أول حساب حقيقي في السحابة يصبح المالك — العدّ من الجدول لا من الحالة المحلية */
  const { count } = await sb
    .from("kiur_accounts")
    .select("id", { count: "exact", head: true });
  const firstOwner = (count ?? 0) === 0;
  const stored: Account = withoutPassword({
    ...acc,
    role: firstOwner ? "owner" : acc.role,
    createdAt: Date.now(),
  });

  const { error: dbErr } = await sb
    .from("kiur_accounts")
    .upsert({ id: stored.email, data: stored }, { onConflict: "id" });
  if (dbErr) return { ok: false, error: dbErr.message };

  return { ok: true, account: stored };
}

/**
 * تسجيل الدخول.
 * cloud: signInWithPassword (يمر عبر hook حدّ المعدل) ثم جلب الحساب بالبريد.
 */
export async function loginAccount(
  email: string,
  password: string,
  directory: Account[]
): Promise<AuthOutcome> {
  if (!isCloudAuth()) return { ok: false, error: "local_mode" };
  const sb = getClient();
  if (!sb) return { ok: false, error: "cloud_unreachable" };

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    /* رسالة حدّ المعدل من الـ hook ترجع 429 — نوحّدها */
    if (error.message && /wait|moment|429/i.test(error.message))
      return { ok: false, error: "rate_limited" };
    return { ok: false, error: "wrong_creds" };
  }

  const mail = data.user?.email?.toLowerCase() ?? email.toLowerCase();
  let acc = directory.find((a) => a.email.toLowerCase() === mail);

  if (!acc) {
    /* الحساب غير محمّل بعد — اجلبه من السحابة مباشرة */
    const { data: row } = await sb
      .from("kiur_accounts")
      .select("data")
      .eq("id", mail)
      .maybeSingle();
    if (row?.data) acc = row.data as Account;
  }
  if (!acc) return { ok: false, error: "no_profile" };

  return { ok: true, account: withoutPassword(acc) };
}

/** تسجيل الخروج — ينهي جلسة Supabase إن وُجدت */
export async function logoutAccount(): Promise<void> {
  if (!isCloudAuth()) return;
  try {
    await getClient()?.auth.signOut();
  } catch {
    /* تجاهل أخطاء الشبكة عند الخروج */
  }
}

/** هل هناك جلسة سحابية نشطة؟ (لاستعادة الدخول بعد إعادة التحميل) */
export async function restoreCloudSession(
  directory: Account[]
): Promise<Account | null> {
  if (!isCloudAuth()) return null;
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    const mail = data.session?.user?.email?.toLowerCase();
    if (!mail) return null;
    const acc = directory.find((a) => a.email.toLowerCase() === mail);
    return acc ? withoutPassword(acc) : null;
  } catch {
    return null;
  }
}
