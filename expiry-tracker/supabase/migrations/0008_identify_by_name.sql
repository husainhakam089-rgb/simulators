-- =====================================================================
-- التعرّف على الصنف من اسمه المقروء على العلبة، لا من الباركود وحده
-- =====================================================================

-- كيف عُرِف الصنف؟ يظهر للمدير في شاشة المراجعة
alter table public.batches
  add column if not exists identified_by text not null default 'barcode'
  check (identified_by in ('barcode', 'name', 'manual', 'unknown'));

-- علبة بلا باركود ولا مطابقة تبقى قابلة للحفظ: العامل لا يُوقَف أبداً،
-- والمدير يراجعها لاحقاً بالصورة.
alter table public.batches drop constraint if exists batches_product_or_barcode;

drop function if exists public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz);

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
  p_received_at     timestamptz default now(),
  p_product_id      uuid default null,
  p_identified_by   text default null
)
returns table (batch_id uuid, product_name text, was_unknown boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_store    uuid := public.current_store_id();
  v_product  public.products%rowtype;
  v_id       uuid;
  v_barcode  text := nullif(btrim(coalesce(p_barcode, '')), '');
  v_how      text;
  v_unknown  boolean;
begin
  if v_store is null then raise exception 'no_store'; end if;
  if p_expiry_date is null then raise exception 'expiry_required'; end if;

  -- صنف اختير بالاسم (أو يدوياً) — لا نثق بمعرّف قادم من الجهاز إلا بعد
  -- التأكد أنه فعلاً من أصناف هذا المحل
  if p_product_id is not null then
    select * into v_product from public.products
     where id = p_product_id and store_id = v_store;
  end if;

  -- وإلا نبحث بالباركود كالمعتاد
  if v_product.id is null and v_barcode is not null then
    select * into v_product from public.products
     where store_id = v_store and barcode = v_barcode limit 1;
    if v_product.id is not null then v_how := 'barcode'; end if;
  end if;

  v_unknown := v_product.id is null;
  v_how := coalesce(
    v_how,
    nullif(p_identified_by, ''),
    case when v_unknown then 'unknown' else 'name' end
  );
  if v_how not in ('barcode', 'name', 'manual', 'unknown') then v_how := 'unknown'; end if;

  insert into public.batches (
    store_id, product_id, unknown_barcode, quantity, production_date, expiry_date,
    date_source, confidence, photo_url, received_at, received_by, note, client_id,
    identified_by
  ) values (
    v_store,
    v_product.id,
    -- نحتفظ بالباركود الممسوح حتى لو طابقنا الصنف بالاسم، ليضيفه المدير للنظام
    case when v_product.id is null or v_product.barcode is distinct from v_barcode
         then v_barcode end,
    coalesce(p_quantity, 1), p_production_date, p_expiry_date,
    coalesce(p_date_source, 'manual'),
    case when v_how = 'barcode' then coalesce(p_confidence, 'high') else 'low' end,
    p_photo_url, coalesce(p_received_at, now()), auth.uid(), p_note, p_client_id,
    v_how
  )
  on conflict (store_id, client_id) where client_id is not null
  do update set expiry_date = excluded.expiry_date
  returning id into v_id;

  return query select v_id, coalesce(v_product.name, 'صنف مجهول'), v_unknown;
end $$;

revoke execute on function public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz,uuid,text) from public, anon;
grant execute on function public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz,uuid,text) to authenticated;

-- إظهار طريقة التعرّف في لوحة المراجعة
drop view if exists public.v_batch_risk;

create view public.v_batch_risk
with (security_invoker = true) as
select
  b.id                as batch_id,
  b.store_id,
  b.product_id,
  coalesce(p.name, 'صنف مجهول (' || coalesce(b.unknown_barcode, '—') || ')') as product_name,
  coalesce(p.barcode, b.unknown_barcode) as barcode,
  b.unknown_barcode   as scanned_barcode,
  c.name              as category_name,
  b.quantity,
  b.expiry_date,
  b.production_date,
  b.status,
  b.confidence,
  b.date_source,
  b.identified_by,
  b.note,
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

-- الكتالوج المحلي يحتاج معرّف الصنف ليُرسله عند المطابقة بالاسم
drop function if exists public.worker_catalog();

create function public.worker_catalog()
returns table (
  product_id              uuid,
  barcode                 text,
  name                    text,
  category_name           text,
  default_shelf_life_days integer,
  alert_before_days       integer,
  is_perishable           boolean
)
language sql stable security definer set search_path = public as $$
  select p.id, p.barcode, p.name, c.name,
         c.default_shelf_life_days,
         coalesce(c.alert_before_days, 30),
         coalesce(c.is_perishable, true)
  from public.products p
  left join public.categories c on c.id = p.category_id
  where p.store_id = public.current_store_id()
$$;

revoke execute on function public.worker_catalog() from public, anon;
grant execute on function public.worker_catalog() to authenticated;
