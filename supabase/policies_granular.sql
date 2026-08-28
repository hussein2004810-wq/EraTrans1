-- ═══════════════════════════════════════════════════════════════
--  KIUR — سياسات RLS منفصلة (SELECT / INSERT / UPDATE / DELETE)
--  لكل الجداول الـ11، مكتوبة حرفيًا للمراجعة.
--  تشغَّل من: Supabase Dashboard → SQL Editor → New query → Run
--  بديل CLI: supabase db push (ملف migrations/20260102000000_granular_policies.sql)
-- ═══════════════════════════════════════════════════════════════

-- ── امتيازات الجدول لمستوى anon (تغطي ملاحظة GRANT) ──
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;

-- ═══════════════ kiur_accounts ═══════════════
ALTER TABLE public.kiur_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_accounts ON public.kiur_accounts;
DROP POLICY IF EXISTS anon_select_kiur_accounts ON public.kiur_accounts;
DROP POLICY IF EXISTS anon_insert_kiur_accounts ON public.kiur_accounts;
DROP POLICY IF EXISTS anon_update_kiur_accounts ON public.kiur_accounts;
DROP POLICY IF EXISTS anon_delete_kiur_accounts ON public.kiur_accounts;

CREATE POLICY anon_select_kiur_accounts ON public.kiur_accounts FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_accounts ON public.kiur_accounts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_accounts ON public.kiur_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_accounts ON public.kiur_accounts FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_exams ═══════════════
ALTER TABLE public.kiur_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_exams ON public.kiur_exams;
DROP POLICY IF EXISTS anon_select_kiur_exams ON public.kiur_exams;
DROP POLICY IF EXISTS anon_insert_kiur_exams ON public.kiur_exams;
DROP POLICY IF EXISTS anon_update_kiur_exams ON public.kiur_exams;
DROP POLICY IF EXISTS anon_delete_kiur_exams ON public.kiur_exams;

CREATE POLICY anon_select_kiur_exams ON public.kiur_exams FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_exams ON public.kiur_exams FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_exams ON public.kiur_exams FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_exams ON public.kiur_exams FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_questions ═══════════════
ALTER TABLE public.kiur_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_questions ON public.kiur_questions;
DROP POLICY IF EXISTS anon_select_kiur_questions ON public.kiur_questions;
DROP POLICY IF EXISTS anon_insert_kiur_questions ON public.kiur_questions;
DROP POLICY IF EXISTS anon_update_kiur_questions ON public.kiur_questions;
DROP POLICY IF EXISTS anon_delete_kiur_questions ON public.kiur_questions;

CREATE POLICY anon_select_kiur_questions ON public.kiur_questions FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_questions ON public.kiur_questions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_questions ON public.kiur_questions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_questions ON public.kiur_questions FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_attempts ═══════════════
ALTER TABLE public.kiur_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_attempts ON public.kiur_attempts;
DROP POLICY IF EXISTS anon_select_kiur_attempts ON public.kiur_attempts;
DROP POLICY IF EXISTS anon_insert_kiur_attempts ON public.kiur_attempts;
DROP POLICY IF EXISTS anon_update_kiur_attempts ON public.kiur_attempts;
DROP POLICY IF EXISTS anon_delete_kiur_attempts ON public.kiur_attempts;

CREATE POLICY anon_select_kiur_attempts ON public.kiur_attempts FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_attempts ON public.kiur_attempts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_attempts ON public.kiur_attempts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_attempts ON public.kiur_attempts FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_shares ═══════════════
ALTER TABLE public.kiur_shares ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_shares ON public.kiur_shares;
DROP POLICY IF EXISTS anon_select_kiur_shares ON public.kiur_shares;
DROP POLICY IF EXISTS anon_insert_kiur_shares ON public.kiur_shares;
DROP POLICY IF EXISTS anon_update_kiur_shares ON public.kiur_shares;
DROP POLICY IF EXISTS anon_delete_kiur_shares ON public.kiur_shares;

CREATE POLICY anon_select_kiur_shares ON public.kiur_shares FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_shares ON public.kiur_shares FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_shares ON public.kiur_shares FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_shares ON public.kiur_shares FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_universities ═══════════════
ALTER TABLE public.kiur_universities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_universities ON public.kiur_universities;
DROP POLICY IF EXISTS anon_select_kiur_universities ON public.kiur_universities;
DROP POLICY IF EXISTS anon_insert_kiur_universities ON public.kiur_universities;
DROP POLICY IF EXISTS anon_update_kiur_universities ON public.kiur_universities;
DROP POLICY IF EXISTS anon_delete_kiur_universities ON public.kiur_universities;

CREATE POLICY anon_select_kiur_universities ON public.kiur_universities FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_universities ON public.kiur_universities FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_universities ON public.kiur_universities FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_universities ON public.kiur_universities FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_colleges ═══════════════
ALTER TABLE public.kiur_colleges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_colleges ON public.kiur_colleges;
DROP POLICY IF EXISTS anon_select_kiur_colleges ON public.kiur_colleges;
DROP POLICY IF EXISTS anon_insert_kiur_colleges ON public.kiur_colleges;
DROP POLICY IF EXISTS anon_update_kiur_colleges ON public.kiur_colleges;
DROP POLICY IF EXISTS anon_delete_kiur_colleges ON public.kiur_colleges;

CREATE POLICY anon_select_kiur_colleges ON public.kiur_colleges FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_colleges ON public.kiur_colleges FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_colleges ON public.kiur_colleges FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_colleges ON public.kiur_colleges FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_depts ═══════════════
ALTER TABLE public.kiur_depts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_depts ON public.kiur_depts;
DROP POLICY IF EXISTS anon_select_kiur_depts ON public.kiur_depts;
DROP POLICY IF EXISTS anon_insert_kiur_depts ON public.kiur_depts;
DROP POLICY IF EXISTS anon_update_kiur_depts ON public.kiur_depts;
DROP POLICY IF EXISTS anon_delete_kiur_depts ON public.kiur_depts;

CREATE POLICY anon_select_kiur_depts ON public.kiur_depts FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_depts ON public.kiur_depts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_depts ON public.kiur_depts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_depts ON public.kiur_depts FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_vignettes ═══════════════
ALTER TABLE public.kiur_vignettes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_vignettes ON public.kiur_vignettes;
DROP POLICY IF EXISTS anon_select_kiur_vignettes ON public.kiur_vignettes;
DROP POLICY IF EXISTS anon_insert_kiur_vignettes ON public.kiur_vignettes;
DROP POLICY IF EXISTS anon_update_kiur_vignettes ON public.kiur_vignettes;
DROP POLICY IF EXISTS anon_delete_kiur_vignettes ON public.kiur_vignettes;

CREATE POLICY anon_select_kiur_vignettes ON public.kiur_vignettes FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_vignettes ON public.kiur_vignettes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_vignettes ON public.kiur_vignettes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_vignettes ON public.kiur_vignettes FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_vignette_audit ═══════════════
ALTER TABLE public.kiur_vignette_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_vignette_audit ON public.kiur_vignette_audit;
DROP POLICY IF EXISTS anon_select_kiur_vignette_audit ON public.kiur_vignette_audit;
DROP POLICY IF EXISTS anon_insert_kiur_vignette_audit ON public.kiur_vignette_audit;
DROP POLICY IF EXISTS anon_update_kiur_vignette_audit ON public.kiur_vignette_audit;
DROP POLICY IF EXISTS anon_delete_kiur_vignette_audit ON public.kiur_vignette_audit;

CREATE POLICY anon_select_kiur_vignette_audit ON public.kiur_vignette_audit FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_vignette_audit ON public.kiur_vignette_audit FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_vignette_audit ON public.kiur_vignette_audit FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_vignette_audit ON public.kiur_vignette_audit FOR DELETE TO anon USING (true);

-- ═══════════════ kiur_audit ═══════════════
ALTER TABLE public.kiur_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_all_kiur_audit ON public.kiur_audit;
DROP POLICY IF EXISTS anon_select_kiur_audit ON public.kiur_audit;
DROP POLICY IF EXISTS anon_insert_kiur_audit ON public.kiur_audit;
DROP POLICY IF EXISTS anon_update_kiur_audit ON public.kiur_audit;
DROP POLICY IF EXISTS anon_delete_kiur_audit ON public.kiur_audit;

CREATE POLICY anon_select_kiur_audit ON public.kiur_audit FOR SELECT TO anon USING (true);
CREATE POLICY anon_insert_kiur_audit ON public.kiur_audit FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_kiur_audit ON public.kiur_audit FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_delete_kiur_audit ON public.kiur_audit FOR DELETE TO anon USING (true);

-- ═══════════════ تحقق: يجب أن ترجع 4 سياسات لكل جدول (44 صفًا) ═══════════════
SELECT tablename AS table_name, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'kiur_%'
ORDER BY tablename, policyname;
