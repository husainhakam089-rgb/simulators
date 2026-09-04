-- =====================================================================
-- المهمة اليومية المجدولة
-- ٠٦:٠٠ بتوقيت بغداد = ٠٣:٠٠ UTC — قبل فتح المحل وخارج فترة الصمت (٩م–٦ص)
-- =====================================================================
create extension if not exists pg_cron;
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;  -- تنشئ سكيما net

-- غيّر هذا العنوان إذا نُقل المشروع
insert into private.app_secrets(key, value)
values ('functions_url', 'https://uvjjnxemvamwzcturyfq.supabase.co/functions/v1')
on conflict (key) do update set value = excluded.value, updated_at = now();

create or replace function private.push_daily_digests()
returns void language plpgsql security definer set search_path = private, public, net as $$
declare
  v_url    text;
  v_secret text;
begin
  select value into v_url    from private.app_secrets where key = 'functions_url';
  select value into v_secret from private.app_secrets where key = 'cron_secret';
  if v_url is null then return; end if;

  perform net.http_post(
    url     := v_url || '/send-digest-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body    := '{}'::jsonb
  );
end $$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-alerts') then
    perform cron.unschedule('daily-alerts');
  end if;
  if exists (select 1 from cron.job where jobname = 'daily-digest-push') then
    perform cron.unschedule('daily-digest-push');
  end if;
end $$;

select cron.schedule('daily-alerts',      '0 3 * * *', $x$select public.run_daily_alerts()$x$);
select cron.schedule('daily-digest-push', '2 3 * * *', $x$select private.push_daily_digests()$x$);
