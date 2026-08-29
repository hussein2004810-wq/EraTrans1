-- ═══════════════════════════════════════════════════════════════
--  KIUR — مرحلة 2 (اختيارية): حماية كلمات المرور من المحاولات المتكررة
--  Supabase Auth Hook من نوع: Password Verification Attempt
--
--  التشغيل:  supabase db push   (أو SQL Editor ← New query ← Run)
--  التفعيل:  Authentication → Hooks → Password Verification Attempt
--            → يشير إلى الدالة: public.hook_password_verification_attempt
--
--  ملاحظة معمارية: هذا الملف لا يعمل إلا بعد نقل التطبيق إلى Supabase Auth.
--  KIUR حاليًا يستخدم مفتاح anon بدون Auth، لذا يُعد هذا تهيئة مسبقة للمرحلة 2.
-- ═══════════════════════════════════════════════════════════════

-- ── 1) جدول محاولات الفشل ──
-- user_id: uuid (يطابق auth.users.id)
-- last_failed_at: timestamptz (وليس timestamp — لتطابق now() وتجنب أخطاء التحويل)
create table if not exists public.password_failed_verification_attempts (
  user_id uuid primary key,
  last_failed_at timestamptz not null default now()
);

-- ── 2) RLS مفعّل + سياسة لدور supabase_auth_admin فقط ──
-- (الدالة تُستدعى بصلاحية هذا الدور، فبدون السياسة ستفشل عمليات SELECT/UPSERT)
alter table public.password_failed_verification_attempts enable row level security;

drop policy if exists auth_admin_all on public.password_failed_verification_attempts;
create policy auth_admin_all
  on public.password_failed_verification_attempts
  for all
  to supabase_auth_admin
  using (true)
  with check (true);

-- ── 3) الامتيازات ──
grant all on table public.password_failed_verification_attempts to supabase_auth_admin;

-- ── 4) الدالة (Hook) ──
-- create or replace: لا تفشل عند إعادة التشغيل في CI
-- event->>'user_id' ثم ::uuid: استخراج نصّي أأمن من (event->'user_id')::uuid
create or replace function public.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_user_id uuid;
  v_valid boolean;
  v_last_failed_at timestamptz;
begin
  v_user_id := (event->>'user_id')::uuid;
  v_valid   := (event->>'valid')::boolean;

  -- محاولة ناجحة: صفّر العدّاد وتابع
  if v_valid is true then
    delete from public.password_failed_verification_attempts
    where user_id = v_user_id;
    return jsonb_build_object('decision', 'continue');
  end if;

  -- نافذة زمنية: منع محاولة جديدة خلال 10 ثوانٍ من آخر فشل
  select last_failed_at into v_last_failed_at
  from public.password_failed_verification_attempts
  where user_id = v_user_id;

  if v_last_failed_at is not null
     and now() - v_last_failed_at < interval '10 seconds' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 429,
        'message', 'الرجاء الانتظار لحظة قبل المحاولة مجددًا.'
      )
    );
  end if;

  -- سجّل / حدّث وقت آخر فشل
  insert into public.password_failed_verification_attempts (user_id, last_failed_at)
  values (v_user_id, now())
  on conflict (user_id)
  do update set last_failed_at = now();

  return jsonb_build_object('decision', 'continue');
end;
$$;

-- ── 5) تحقق ──
select 'password_rate_limit_ready' as status,
       count(*) as existing_rows
from public.password_failed_verification_attempts;
