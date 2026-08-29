-- ═══════════════════════════════════════════════════════════════
--  KIUR — تقييد اختياري: حصر الجداول على المستخدمين الموثّقين فقط
--
--  ⚠️ هذا الملف اختياري ولا يُطبَّق عبر `supabase db push`.
--  شغّله يدويًا من SQL Editor فقط إذا أردت منع الوصول المجهول تمامًا.
--
--  الأثر: بعد تطبيقه لن تعمل سياسات anon؛ سيتطلب كل قراءة/كتابة جلسة
--  Supabase Auth. تأكد أن التطبيق موصول بالمصادقة السحابية أولًا.
-- ═══════════════════════════════════════════════════════════════

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
    -- إسقاط سياسات anon المفتوحة
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I', t, t);

    -- سياسات للموثّقين فقط
    EXECUTE format('CREATE POLICY "auth_select_%s" ON %I FOR SELECT TO authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_update_%s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "auth_delete_%s" ON %I FOR DELETE TO authenticated USING (true)', t, t);
  END LOOP;
END $$;

-- الامتيازات للموثّقين
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
