-- =====================================================================
-- الدوال: بحث العامل، تسجيل الوجبة، الاستيراد، محرك التنبيهات، اللوحة
-- =====================================================================

-- تاريخ اليوم حسب توقيت المحل
create or replace function public.store_today(p_store_id uuid)
returns date language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce((select timezone from public.stores where id = p_store_id), 'Asia/Baghdad'))::date
$$;

-- ------------------------------------------------------------------------
-- بحث العامل عن صنف بالباركود — لا يُرجع أي سعر إطلاقاً
-- ------------------------------------------------------------------------
create or replace function public.worker_lookup(p_barcode text)
returns table (
  found                   boolean,
  product_id              uuid,
  product_name            text,
  category_name           text,
  is_perishable           boolean,
  default_shelf_life_days integer,
  suggested_expiry        date,
  last_expiry             date
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_store uuid := public.current_store_id();
  v_today date;
begin
  if v_store is null then
    raise exception 'no_store';
  end if;
  v_today := public.store_today(v_store);

  return query
  select
    true,
    p.id,
    p.name,
    c.name,
    coalesce(c.is_perishable, true),
    c.default_shelf_life_days,
    case when c.default_shelf_life_days is not null
         then v_today + c.default_shelf_life_days
         else null end,
    (select max(b.expiry_date) from public.batches b
      where b.product_id = p.id and b.status = 'active')
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.store_id = v_store and p.barcode = btrim(p_barcode)
  limit 1;

  if not found then
    return query select false, null::uuid, null::text, null::text, true,
                        null::integer, null::date, null::date;
  end if;
end $$;

grant execute on function public.worker_lookup(text) to authenticated;

-- ------------------------------------------------------------------------
-- تسجيل وجبة — idempotent عبر client_id ليعمل مع المزامنة دون اتصال
-- ------------------------------------------------------------------------
create or replace function public.record_batch(
  p_client_id       text,
  p_barcode         text,
  p_expiry_date     date,
  p_quantity        numeric default 1,
  p_production_date date default null,
  p_date_source     text default 'manual',
  p_confidence      text default 'high',
  p_photo_url       text default null,
  p_note            text default null,
  p_received_at     timestamptz default now()
)
returns table (batch_id uuid, product_name text, was_unknown boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_store   uuid := public.current_store_id();
  v_product public.products%rowtype;
  v_id      uuid;
  v_unknown boolean := false;
begin
  if v_store is null then raise exception 'no_store'; end if;
  if p_expiry_date is null then raise exception 'expiry_required'; end if;

  select * into v_product from public.products
   where store_id = v_store and barcode = btrim(p_barcode) limit 1;

  if v_product.id is null then v_unknown := true; end if;

  insert into public.batches (
    store_id, product_id, unknown_barcode, quantity, production_date, expiry_date,
    date_source, confidence, photo_url, received_at, received_by, note, client_id
  ) values (
    v_store, v_product.id, case when v_unknown then btrim(p_barcode) end,
    coalesce(p_quantity, 1), p_production_date, p_expiry_date,
    coalesce(p_date_source, 'manual'),
    case when v_unknown then 'low' else coalesce(p_confidence, 'high') end,
    p_photo_url, coalesce(p_received_at, now()), auth.uid(), p_note, p_client_id
  )
  on conflict (store_id, client_id) where client_id is not null
  do update set expiry_date = excluded.expiry_date
  returning id into v_id;

  return query select v_id, coalesce(v_product.name, 'صنف مجهول'), v_unknown;
end $$;

grant execute on function public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz) to authenticated;

-- ------------------------------------------------------------------------
-- استيراد الأصناف من ملف المبيعات (الأدمن فقط)
-- p_rows: [{barcode,name,category,cost_price,sell_price,unit}, ...]
-- ------------------------------------------------------------------------
create or replace function public.import_products(p_rows jsonb)
returns table (inserted integer, updated integer, skipped integer, categories_created integer)
language plpgsql security definer set search_path = public as $$
declare
  v_store uuid := public.current_store_id();
  r jsonb;
  v_cat uuid;
  v_cat_name text;
  v_barcode text;
  v_name text;
  v_existing uuid;
  v_ins int := 0; v_upd int := 0; v_skip int := 0; v_newcat int := 0;
begin
  if v_store is null or not public.is_admin() then raise exception 'admin_only'; end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_barcode := nullif(btrim(coalesce(r->>'barcode','')), '');
    v_name    := nullif(btrim(coalesce(r->>'name','')), '');
    if v_barcode is null or v_name is null then
      v_skip := v_skip + 1;
      continue;
    end if;

    v_cat := null;
    v_cat_name := nullif(btrim(coalesce(r->>'category','')), '');
    if v_cat_name is not null then
      select id into v_cat from public.categories
       where store_id = v_store and lower(name) = lower(v_cat_name);
      if v_cat is null then
        insert into public.categories(store_id, name) values (v_store, v_cat_name)
        returning id into v_cat;
        v_newcat := v_newcat + 1;
      end if;
    end if;

    select id into v_existing from public.products
     where store_id = v_store and barcode = v_barcode;

    if v_existing is null then
      insert into public.products(store_id, barcode, name, category_id, cost_price, sell_price, unit, source)
      values (v_store, v_barcode, v_name, v_cat,
              nullif(r->>'cost_price','')::numeric,
              nullif(r->>'sell_price','')::numeric,
              nullif(btrim(coalesce(r->>'unit','')), ''), 'import');
      v_ins := v_ins + 1;
    else
      update public.products set
        name        = v_name,
        category_id = coalesce(v_cat, category_id),
        cost_price  = coalesce(nullif(r->>'cost_price','')::numeric, cost_price),
        sell_price  = coalesce(nullif(r->>'sell_price','')::numeric, sell_price),
        unit        = coalesce(nullif(btrim(coalesce(r->>'unit','')), ''), unit),
        updated_at  = now()
      where id = v_existing;
      v_upd := v_upd + 1;
    end if;
  end loop;

  return query select v_ins, v_upd, v_skip, v_newcat;
end $$;

grant execute on function public.import_products(jsonb) to authenticated;

-- ------------------------------------------------------------------------
-- عرض الخطورة المالية لكل وجبة نشطة
-- ------------------------------------------------------------------------
create or replace view public.v_batch_risk
with (security_invoker = true) as
select
  b.id                as batch_id,
  b.store_id,
  b.product_id,
  coalesce(p.name, 'صنف مجهول (' || coalesce(b.unknown_barcode,'—') || ')') as product_name,
  coalesce(p.barcode, b.unknown_barcode) as barcode,
  c.name              as category_name,
  b.quantity,
  b.expiry_date,
  b.production_date,
  b.status,
  b.confidence,
  b.date_source,
  b.photo_url,
  b.received_at,
  b.received_by,
  u.name              as received_by_name,
  (b.expiry_date - public.store_today(b.store_id))       as days_left,
  coalesce(c.alert_before_days, 30)                      as alert_before_days,
  coalesce(c.is_perishable, true)                        as is_perishable,
  round(b.quantity * coalesce(p.cost_price, 0), 2)       as value_at_risk,
  (p.id is null)                                         as is_unknown
from public.batches b
left join public.products p   on p.id = b.product_id
left join public.categories c on c.id = p.category_id
left join public.users u      on u.id = b.received_by;

grant select on public.v_batch_risk to authenticated;

-- ------------------------------------------------------------------------
-- محرك التنبيهات اليومي — يعمل على كل المحال
-- ------------------------------------------------------------------------

-- صياغة عربية سليمة لعدد الأصناف
create or replace function public.ar_items_title(n integer)
returns text language sql immutable set search_path = '' as $$
  select case
    when n = 1 then 'صنف واحد يحتاج انتباهك'
    when n = 2 then 'صنفان يحتاجان انتباهك'
    when n between 3 and 10 then n || ' أصناف تحتاج انتباهك'
    else n || ' صنفاً يحتاج انتباهك'
  end
$$;

create or replace function public.run_daily_alerts()
returns table (out_store_id uuid, out_item_count integer, out_total_value numeric, out_digest_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  s record;
  v_today date;
  v_count int;
  v_total numeric;
  v_digest uuid;
  v_title text;
  v_body text;
begin
  for s in select id, timezone from public.stores loop
    v_today := public.store_today(s.id);

    -- سجّل تنبيهاً لكل وجبة اقتربت من حدّ مجموعتها (مرة واحدة باليوم لكل وجبة)
    insert into public.alerts (store_id, batch_id, days_left, value_at_risk, sent_on)
    select b.store_id, b.id,
           (b.expiry_date - v_today),
           round(b.quantity * coalesce(p.cost_price, 0), 2),
           v_today
    from public.batches b
    left join public.products p   on p.id = b.product_id
    left join public.categories c on c.id = p.category_id
    where b.store_id = s.id
      and b.status = 'active'
      and coalesce(c.is_perishable, true)
      and (b.expiry_date - v_today) <= coalesce(c.alert_before_days, 30)
    on conflict (batch_id, sent_on) do nothing;

    -- الملخص اليومي: الحالة الحالية كاملة، وتُرتَّب في الواجهة حسب المبلغ
    select count(*)::int, coalesce(sum(round(b.quantity * coalesce(p.cost_price,0),2)), 0)
      into v_count, v_total
    from public.batches b
    left join public.products p   on p.id = b.product_id
    left join public.categories c on c.id = p.category_id
    where b.store_id = s.id
      and b.status = 'active'
      and coalesce(c.is_perishable, true)
      and (b.expiry_date - v_today) <= coalesce(c.alert_before_days, 30);

    if v_count = 0 then
      continue;
    end if;

    v_title := public.ar_items_title(v_count);
    v_body  := 'قيمتها ' || to_char(v_total, 'FM999,999,999,990') || ' دينار — افتح القائمة لاتخاذ القرار';

    insert into public.daily_digests as d
      (store_id, digest_date, item_count, total_value_at_risk, title, body)
    values (s.id, v_today, v_count, v_total, v_title, v_body)
    on conflict (store_id, digest_date) do update
      set item_count = excluded.item_count,
          total_value_at_risk = excluded.total_value_at_risk,
          title = excluded.title,
          body = excluded.body,
          pushed_at = case when d.item_count is distinct from excluded.item_count
                           then null else d.pushed_at end
    returning d.id into v_digest;

    out_store_id := s.id; out_item_count := v_count; out_total_value := v_total; out_digest_id := v_digest;
    return next;
  end loop;
end $$;

-- ------------------------------------------------------------------------
-- ملخص لوحة الأدمن: قيمة البضاعة المعرضة للخطر خلال ٧ / ٣٠ / ٩٠ يوم
-- ------------------------------------------------------------------------
create or replace function public.dashboard_summary()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_store uuid := public.current_store_id();
  v_today date;
  v_res jsonb;
begin
  if v_store is null or not public.is_admin() then raise exception 'admin_only'; end if;
  v_today := public.store_today(v_store);

  select jsonb_build_object(
    'expired',  jsonb_build_object('count', count(*) filter (where d < 0),
                                   'value', coalesce(sum(v) filter (where d < 0), 0)),
    'd7',       jsonb_build_object('count', count(*) filter (where d between 0 and 7),
                                   'value', coalesce(sum(v) filter (where d between 0 and 7), 0)),
    'd30',      jsonb_build_object('count', count(*) filter (where d between 0 and 30),
                                   'value', coalesce(sum(v) filter (where d between 0 and 30), 0)),
    'd90',      jsonb_build_object('count', count(*) filter (where d between 0 and 90),
                                   'value', coalesce(sum(v) filter (where d between 0 and 90), 0)),
    'unknown',  (select count(*) from public.batches b
                  where b.store_id = v_store and b.status = 'active' and b.product_id is null),
    'low_conf', (select count(*) from public.batches b
                  where b.store_id = v_store and b.status = 'active' and b.confidence = 'low'),
    'today',    to_jsonb(v_today)
  ) into v_res
  from (
    select (b.expiry_date - v_today) as d,
           round(b.quantity * coalesce(p.cost_price, 0), 2) as v
    from public.batches b
    left join public.products p   on p.id = b.product_id
    left join public.categories c on c.id = p.category_id
    where b.store_id = v_store and b.status = 'active' and coalesce(c.is_perishable, true)
  ) t;

  return v_res;
end $$;

grant execute on function public.dashboard_summary() to authenticated;

-- ------------------------------------------------------------------------
-- متابعة الالتزام: من صوّر ومن لم يصوّر
-- ------------------------------------------------------------------------
create or replace function public.compliance_report(p_days integer default 7)
returns table (user_id uuid, user_name text, user_role public.user_role,
               batches_count bigint, last_scan timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.name, u.role,
         count(b.id) filter (where b.received_at > now() - make_interval(days => p_days)),
         max(b.received_at)
  from public.users u
  left join public.batches b on b.received_by = u.id
  where u.store_id = public.current_store_id()
    and public.is_admin()
  group by u.id, u.name, u.role
  order by 4 desc
$$;

grant execute on function public.compliance_report(integer) to authenticated;

-- ------------------------------------------------------------------------
-- تسجيل قرار على وجبة (تنزيل سعر / إرجاع / نقل / إتلاف)
-- ------------------------------------------------------------------------
create or replace function public.record_action(p_batch_id uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_store uuid := public.current_store_id();
begin
  if v_store is null or not public.is_admin() then raise exception 'admin_only'; end if;
  if p_action not in ('discount','return','transfer','dispose') then raise exception 'bad_action'; end if;

  insert into public.actions_log(store_id, batch_id, action, note, created_by)
  select v_store, p_batch_id, p_action, p_note, auth.uid()
  from public.batches where id = p_batch_id and store_id = v_store;

  update public.batches set status = case p_action
      when 'discount' then 'discounted'
      when 'return'   then 'returned'
      when 'dispose'  then 'disposed'
      else status end
  where id = p_batch_id and store_id = v_store;

  update public.alerts set action_taken = p_action, action_by = auth.uid(), action_at = now()
  where batch_id = p_batch_id and action_taken is null;
end $$;

grant execute on function public.record_action(uuid, text, text) to authenticated;

-- ------------------------------------------------------------------------
-- كتالوج مختصر للعامل ليعمل البحث دون اتصال — بلا أي سعر
-- ------------------------------------------------------------------------
create or replace function public.worker_catalog()
returns table (
  barcode                 text,
  name                    text,
  category_name           text,
  default_shelf_life_days integer,
  alert_before_days       integer,
  is_perishable           boolean
)
language sql stable security definer set search_path = public as $$
  select p.barcode, p.name, c.name,
         c.default_shelf_life_days,
         coalesce(c.alert_before_days, 30),
         coalesce(c.is_perishable, true)
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.store_id = public.current_store_id()
$$;

revoke execute on function public.worker_catalog() from public, anon;
grant execute on function public.worker_catalog() to authenticated;
