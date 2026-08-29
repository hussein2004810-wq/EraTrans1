-- ═══════════════════════════════════════════════════════════════
--  KIUR — إصلاح صلاحيات الكتابة (شغّله إذا ظهر sync_failed أو منع RLS)
--  Supabase Dashboard → SQL Editor → New query → الصق → Run
--
--  يعيد بناء سياسات القراءة/الكتابة لكل جداول kiur_* بشكل صحيح،
--  ويسقط أي سياسات قديمة متضاربة أولًا. آمن لإعادة التشغيل.
-- ═══════════════════════════════════════════════════════════════

-- ١) إسقاط كل السياسات القديمة على جداول kiur_* (مهما كانت أسماؤها)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename LIKE 'kiur\_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ٢) منح الامتيازات على مستوى المخطط للدورين anon و authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

-- ٣) إنشاء 4 سياسات لكل جدول (قراءة/إدراج/تحديث/حذف)
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON public.%I FOR DELETE TO anon, authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- ٤) تحقق: يجب أن ترجع 4 سياسات لكل جدول (44 صفًا)
SELECT tablename, count(*) AS policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'kiur\_%'
GROUP BY tablename
ORDER BY tablename;
