-- ═══════════════════════════════════════════════════════════════
--  KIUR — سياسات RLS منفصلة (SELECT/INSERT/UPDATE/DELETE) لكل جدول
--  بديل عن سياسات FOR ALL المفتوحة من الترحيل الأول.
--  supabase db push
--  نسخة SQL Editor الحرفية (للمراجعة): supabase/policies_granular.sql
-- ═══════════════════════════════════════════════════════════════

-- امتيازات الجدول لمستوى anon (تغطي احتمال missing GRANT)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

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
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I', t, t);

    EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon USING (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "anon_delete_%s" ON %I FOR DELETE TO anon USING (true)', t, t);
  END LOOP;
END $$;
