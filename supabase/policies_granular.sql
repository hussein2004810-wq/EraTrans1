-- ═══════════════════════════════════════════════════════════════
--  KIUR — استبدال سياسات FOR ALL المفتوحة بأربع سياسات منفصلة لكل جدول
--  (SELECT / INSERT / UPDATE / DELETE) — تغطي عمليات التطبيق الأربع:
--    select · upsert(onConflict:id) · delete().eq('id')
--  الصق كامل الملف في: Supabase Dashboard → SQL Editor → Run
--  أو استخدم نسخة الـ migrations للـ CLI: supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── kiur_accounts ──
DROP POLICY IF EXISTS "anon_all_kiur_accounts" ON kiur_accounts;
CREATE POLICY "anon_select_kiur_accounts" ON kiur_accounts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_accounts" ON kiur_accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_accounts" ON kiur_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_accounts" ON kiur_accounts FOR DELETE TO anon USING (true);

-- ── kiur_exams ──
DROP POLICY IF EXISTS "anon_all_kiur_exams" ON kiur_exams;
CREATE POLICY "anon_select_kiur_exams" ON kiur_exams FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_exams" ON kiur_exams FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_exams" ON kiur_exams FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_exams" ON kiur_exams FOR DELETE TO anon USING (true);

-- ── kiur_questions ──
DROP POLICY IF EXISTS "anon_all_kiur_questions" ON kiur_questions;
CREATE POLICY "anon_select_kiur_questions" ON kiur_questions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_questions" ON kiur_questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_questions" ON kiur_questions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_questions" ON kiur_questions FOR DELETE TO anon USING (true);

-- ── kiur_attempts ──
DROP POLICY IF EXISTS "anon_all_kiur_attempts" ON kiur_attempts;
CREATE POLICY "anon_select_kiur_attempts" ON kiur_attempts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_attempts" ON kiur_attempts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_attempts" ON kiur_attempts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_attempts" ON kiur_attempts FOR DELETE TO anon USING (true);

-- ── kiur_shares ──
DROP POLICY IF EXISTS "anon_all_kiur_shares" ON kiur_shares;
CREATE POLICY "anon_select_kiur_shares" ON kiur_shares FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_shares" ON kiur_shares FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_shares" ON kiur_shares FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_shares" ON kiur_shares FOR DELETE TO anon USING (true);

-- ── kiur_universities ──
DROP POLICY IF EXISTS "anon_all_kiur_universities" ON kiur_universities;
CREATE POLICY "anon_select_kiur_universities" ON kiur_universities FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_universities" ON kiur_universities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_universities" ON kiur_universities FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_universities" ON kiur_universities FOR DELETE TO anon USING (true);

-- ── kiur_colleges ──
DROP POLICY IF EXISTS "anon_all_kiur_colleges" ON kiur_colleges;
CREATE POLICY "anon_select_kiur_colleges" ON kiur_colleges FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_colleges" ON kiur_colleges FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_colleges" ON kiur_colleges FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_colleges" ON kiur_colleges FOR DELETE TO anon USING (true);

-- ── kiur_depts ──
DROP POLICY IF EXISTS "anon_all_kiur_depts" ON kiur_depts;
CREATE POLICY "anon_select_kiur_depts" ON kiur_depts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_depts" ON kiur_depts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_depts" ON kiur_depts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_depts" ON kiur_depts FOR DELETE TO anon USING (true);

-- ── kiur_vignettes ──
DROP POLICY IF EXISTS "anon_all_kiur_vignettes" ON kiur_vignettes;
CREATE POLICY "anon_select_kiur_vignettes" ON kiur_vignettes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_vignettes" ON kiur_vignettes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_vignettes" ON kiur_vignettes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_vignettes" ON kiur_vignettes FOR DELETE TO anon USING (true);

-- ── kiur_vignette_audit ──
DROP POLICY IF EXISTS "anon_all_kiur_vignette_audit" ON kiur_vignette_audit;
CREATE POLICY "anon_select_kiur_vignette_audit" ON kiur_vignette_audit FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_vignette_audit" ON kiur_vignette_audit FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_vignette_audit" ON kiur_vignette_audit FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_vignette_audit" ON kiur_vignette_audit FOR DELETE TO anon USING (true);

-- ── kiur_audit ──
DROP POLICY IF EXISTS "anon_all_kiur_audit" ON kiur_audit;
CREATE POLICY "anon_select_kiur_audit" ON kiur_audit FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_kiur_audit" ON kiur_audit FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_kiur_audit" ON kiur_audit FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_kiur_audit" ON kiur_audit FOR DELETE TO anon USING (true);

-- ═══════════════════════════════════════════════════════════════
--  تحقق: يجب أن ترجع 44 سياسة (4 × 11 جدول)
-- ═══════════════════════════════════════════════════════════════
SELECT tablename, COUNT(*) AS policies
FROM pg_policies
WHERE tablename LIKE 'kiur_%'
GROUP BY tablename
ORDER BY tablename;
