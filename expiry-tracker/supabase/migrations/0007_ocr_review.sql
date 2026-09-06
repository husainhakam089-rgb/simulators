-- =====================================================================
-- المرحلة ٢: إظهار سبب اختيار التاريخ وتاريخ الإنتاج المقروء في المراجعة
-- =====================================================================
drop view if exists public.v_batch_risk;

create view public.v_batch_risk
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
