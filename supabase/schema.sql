-- ═══════════════════════════════════════════════════════════════
--  KIUR — مخطط قاعدة البيانات (Supabase / PostgreSQL)
--  شغّل هذا الملف كاملًا من: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- جدول عام لكل مجموعة بيانات: صفوف {id, data(jsonb)}
-- يسمح بالكتابة المتزامنة من عدة أجهزة دون مسح بيانات الآخرين.

CREATE TABLE IF NOT EXISTS kiur_accounts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS kiur_exams LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_questions LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_attempts LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_shares LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_universities LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_colleges LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_depts LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_vignettes LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_vignette_audit LIKE kiur_accounts;
CREATE TABLE IF NOT EXISTS kiur_audit LIKE kiur_accounts;

-- فهرس على وقت التحديث (اختياري، يحسّن الفرز)
CREATE INDEX IF NOT EXISTS idx_kiur_accounts_upd ON kiur_accounts (updated_at);
CREATE INDEX IF NOT EXISTS idx_kiur_attempts_upd ON kiur_attempts (updated_at);

-- ═══════════════════════════════════════════════════════════════
--  سياسات أمان الصفوف (RLS)
--  ملاحظة: النسخة الحالية تفتح الوصول لمفتاح anon لتسهيل التشغيل.
--  للإنتاج الفعلي يُفضَّل ربط Supabase Auth وتقييد السياسات لكل دور.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE kiur_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_depts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_vignettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_vignette_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiur_audit ENABLE ROW LEVEL SECURITY;

-- سياسات مفتوحة (قراءة/كتابة) لمفتاح anon — مناسبة للتجربة الداخلية
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'kiur_accounts','kiur_exams','kiur_questions','kiur_attempts','kiur_shares',
    'kiur_universities','kiur_colleges','kiur_depts','kiur_vignettes',
    'kiur_vignette_audit','kiur_audit'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "anon_all_%s" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
--  تحقق: يجب أن ترجع هذه الاستعلامات 0 صفوف في البداية
-- ═══════════════════════════════════════════════════════════════
SELECT 'kiur_accounts' AS table_name, COUNT(*) FROM kiur_accounts
UNION ALL SELECT 'kiur_exams', COUNT(*) FROM kiur_exams
UNION ALL SELECT 'kiur_questions', COUNT(*) FROM kiur_questions;
