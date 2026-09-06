-- قياس دقة القراءة على بضاعة المحل نفسها.
--
-- كل أرقام الدقة عندنا مقيسة على كراتين نرسمها نحن، وهي تخمين لشكل بضاعة
-- المحل. هذه الهجرة تجعل التطبيق يقيس نفسه على البضاعة الحقيقية: نحفظ ما
-- قرأته المحركات إلى جانب ما اعتمده العامل فعلاً، فيصير الفرق بينهما قياساً
-- مستمراً لا تخميناً — وكل وجبة صحّحها العامل هي حالة نتعلّم منها.

alter table public.batches
  add column if not exists read_expiry     date,   -- ما قرأته المحركات
  add column if not exists read_engine     text,   -- من قرأه: سحابي / محركان / محرك واحد
  add column if not exists read_product_id uuid references public.products(id) on delete set null;

comment on column public.batches.read_expiry is
  'التاريخ كما قرأته المحركات قبل أي تعديل من العامل — للقياس لا للعرض';

-- ------------------------------------------------------------- التسجيل
drop function if exists public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz,uuid,text);

create function public.record_batch(
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
  p_identified_by   text default null,
  p_read_expiry     date default null,
  p_read_engine     text default null,
  p_read_product_id uuid default null
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
  v_read_pid uuid;
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

  -- ما قرأته المحركات من اسم: يُقبل فقط إن كان صنفاً في هذا المحل
  if p_read_product_id is not null then
    select id into v_read_pid from public.products
     where id = p_read_product_id and store_id = v_store;
  end if;

  insert into public.batches (
    store_id, product_id, unknown_barcode, quantity, production_date, expiry_date,
    date_source, confidence, photo_url, received_at, received_by, note, client_id,
    identified_by, read_expiry, read_engine, read_product_id
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
    v_how, p_read_expiry, nullif(btrim(coalesce(p_read_engine, '')), ''), v_read_pid
  )
  on conflict (store_id, client_id) where client_id is not null
  do update set expiry_date = excluded.expiry_date
  returning id into v_id;

  return query select v_id, coalesce(v_product.name, 'صنف مجهول'), v_unknown;
end $$;

revoke execute on function public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz,uuid,text,date,text,uuid) from public, anon;
grant execute on function public.record_batch(text,text,date,numeric,date,text,text,text,text,timestamptz,uuid,text,date,text,uuid) to authenticated;

-- ------------------------------------------------------- القياس الحقيقي
--
-- «صحيح» = العامل اعتمد ما قرأته المحركات كما هو. «صحّحه العامل» = القراءة
-- كانت خاطئة فعلاً. «لم يُقرأ» = صُوّر الكارتون ولم تجد المحركات تاريخاً —
-- وهذا أرحم من الخطأ لكنه يكلّف العامل لمستين.
create or replace function public.reading_accuracy(p_days integer default 90)
returns table (
  since          date,
  batches_total  bigint,
  dates_read     bigint,
  dates_kept     bigint,
  dates_fixed    bigint,
  dates_missed   bigint,
  names_read     bigint,
  names_kept     bigint,
  names_fixed    bigint
)
language sql stable security definer set search_path = public as $$
  with scope as (
    select * from public.batches
     where store_id = public.current_store_id()
       and received_at >= now() - make_interval(days => greatest(coalesce(p_days, 90), 1))
  )
  select
    (now() - make_interval(days => greatest(coalesce(p_days, 90), 1)))::date,
    count(*),
    count(*) filter (where read_expiry is not null),
    count(*) filter (where read_expiry is not null and read_expiry = expiry_date),
    count(*) filter (where read_expiry is not null and read_expiry <> expiry_date),
    count(*) filter (where read_expiry is null and photo_url is not null),
    count(*) filter (where read_product_id is not null),
    count(*) filter (where read_product_id is not null and read_product_id = product_id),
    count(*) filter (where read_product_id is not null and read_product_id is distinct from product_id)
  from scope
$$;

revoke execute on function public.reading_accuracy(integer) from public, anon;
grant execute on function public.reading_accuracy(integer) to authenticated;
