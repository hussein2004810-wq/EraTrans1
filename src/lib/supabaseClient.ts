import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SyncConfig {
  url: string;
  anonKey: string;
}

const CONFIG_KEY = "kiur.supabase.config";

export function getConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as SyncConfig;
    return c.url && c.anonKey ? c : null;
  } catch {
    return null;
  }
}

export function setConfig(c: SyncConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  const c = getConfig();
  if (!c) return null;
  if (!_client) {
    _client = createClient(c.url, c.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/** إعادة ضبط العميل بعد تغيير الإعدادات */
export function resetClient() {
  _client = null;
}

/** فحص الاتصال وإرجاع رسالة نجاح أو خطأ واضحة */
export async function testConnection(cfg: SyncConfig): Promise<{ ok: boolean; message: string }> {
  try {
    const client = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from("kiur_accounts").select("id").limit(1);
    if (error) {
      if (error.code === "42P01")
        return { ok: false, message: "الاتصال ناجح لكن الجداول غير موجودة — شغّل ملف supabase/schema.sql في محرر SQL أولًا." };
      return { ok: false, message: `تعذر الوصول: ${error.message}` };
    }
    return { ok: true, message: "تم الاتصال بنجاح والجداول جاهزة ✓" };
  } catch (e) {
    return { ok: false, message: "رابط أو مفتاح غير صالح — تحقق من URL و anon key." };
  }
}
