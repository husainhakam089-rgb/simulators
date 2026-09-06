-- =====================================================================
-- أسرار تُقرأ من الدوال الطرفية فقط (service_role) + تضييق الصلاحيات
-- =====================================================================
create or replace function public.check_cron_secret(p_secret text)
returns boolean language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.app_secrets where key = 'cron_secret' and value = p_secret)
$$;

create or replace function public.get_vapid()
returns jsonb language sql stable security definer set search_path = public, private as $$
  select jsonb_build_object(
    'public',  (select value from private.app_secrets where key = 'vapid_public'),
    'private', (select value from private.app_secrets where key = 'vapid_private'),
    'subject', (select value from private.app_secrets where key = 'vapid_subject')
  )
$$;

revoke execute on function public.check_cron_secret(text) from public, anon, authenticated;
grant   execute on function public.check_cron_secret(text) to service_role;
revoke execute on function public.get_vapid() from public, anon, authenticated;
grant   execute on function public.get_vapid() to service_role;
revoke execute on function public.run_daily_alerts() from public, anon, authenticated;
grant   execute on function public.run_daily_alerts() to service_role;

-- لا شيء من دوال التطبيق يُستدعى قبل تسجيل الدخول
do $$
declare f text;
begin
  foreach f in array array[
    'public.current_store_id()',
    'public.current_user_role()',
    'public.is_admin()',
    'public.store_today(uuid)',
    'public.worker_lookup(text)',
    'public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz)',
    'public.import_products(jsonb)',
    'public.dashboard_summary()',
    'public.compliance_report(integer)',
    'public.record_action(uuid,text,text)',
    'public.ar_items_title(integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- مفاتيح VAPID تُولَّد مرة واحدة وتُحفظ هنا (المفتاح العام يوضع أيضاً في .env)
-- insert into private.app_secrets(key, value) values
--   ('vapid_public', '...'), ('vapid_private', '...'), ('vapid_subject', 'mailto:...');
