-- =====================================================================
-- تتبع تواريخ الصلاحية — المخطط الأساسي
-- الوحدة الأساسية في النظام هي الوجبة (batch) وليست المنتج.
-- =====================================================================

create extension if not exists pgcrypto;
create schema if not exists private;

-- ------------------------------------------------------------------ المحال
create table if not exists public.stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null default 'Asia/Baghdad',
  currency    text not null default 'IQD',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------ المستخدمون
do $$ begin
  create type public.user_role as enum ('admin', 'worker');
exception when duplicate_object then null; end $$;

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null,
  phone       text,
  role        public.user_role not null default 'worker',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists users_store_idx on public.users(store_id);
create unique index if not exists users_phone_uidx on public.users(phone) where phone is not null;

-- -------------------------------------------------------------- المجموعات
-- هنا يُخزّن العمر الافتراضي لكل مجموعة
create table if not exists public.categories (
  id                      uuid primary key default gen_random_uuid(),
  store_id                uuid not null references public.stores(id) on delete cascade,
  name                    text not null,
  default_shelf_life_days integer,
  alert_before_days       integer not null default 30,
  is_perishable           boolean not null default true,
  created_at              timestamptz not null default now()
);
create unique index if not exists categories_store_name_uidx on public.categories(store_id, lower(name));

-- ----------------------------------------------------------------- الأصناف
-- تأتي من نظام المبيعات عبر الاستيراد، لا تُدخل يدوياً
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  barcode      text not null,
  name         text not null,
  category_id  uuid references public.categories(id) on delete set null,
  cost_price   numeric(14,2),
  sell_price   numeric(14,2),
  unit         text,
  source       text not null default 'import' check (source in ('import','manual')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists products_store_barcode_uidx on public.products(store_id, barcode);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_name_idx on public.products(store_id, name);

-- ----------------------------------------------------------------- الوجبات
-- قلب النظام: المنتج الواحد قد تكون له عدة وجبات بتواريخ مختلفة
create table if not exists public.batches (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  product_id       uuid references public.products(id) on delete cascade,
  unknown_barcode  text,                       -- إذا لم يُعرف الباركود
  quantity         numeric(12,2) not null default 1,
  production_date  date,
  expiry_date      date not null,
  date_source      text not null default 'manual' check (date_source in ('ocr','calculated','manual')),
  confidence       text not null default 'high' check (confidence in ('high','low')),
  photo_url        text,
  received_at      timestamptz not null default now(),
  received_by      uuid references public.users(id) on delete set null,
  status           text not null default 'active'
                   check (status in ('active','sold_out','discounted','returned','disposed')),
  note             text,
  client_id        text,                       -- مفتاح إزالة التكرار للمزامنة دون اتصال
  created_at       timestamptz not null default now(),
  constraint batches_product_or_barcode check (product_id is not null or unknown_barcode is not null)
);
create index if not exists batches_store_status_expiry_idx on public.batches(store_id, status, expiry_date);
create index if not exists batches_product_idx on public.batches(product_id);
create index if not exists batches_received_idx on public.batches(store_id, received_at desc);
create unique index if not exists batches_client_id_uidx on public.batches(store_id, client_id) where client_id is not null;

-- --------------------------------------------------------------- التنبيهات
create table if not exists public.alerts (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  batch_id       uuid not null references public.batches(id) on delete cascade,
  days_left      integer not null,
  value_at_risk  numeric(14,2) not null default 0,
  sent_at        timestamptz not null default now(),
  sent_on        date not null default (now() at time zone 'Asia/Baghdad')::date,
  action_taken   text,
  action_by      uuid references public.users(id) on delete set null,
  action_at      timestamptz
);
create index if not exists alerts_store_sent_idx on public.alerts(store_id, sent_at desc);
create unique index if not exists alerts_batch_day_uidx on public.alerts(batch_id, sent_on);

-- ------------------------------------------------------------ سجل القرارات
create table if not exists public.actions_log (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  batch_id    uuid not null references public.batches(id) on delete cascade,
  action      text not null check (action in ('discount','return','transfer','dispose')),
  note        text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists actions_log_batch_idx on public.actions_log(batch_id);

-- ------------------------------------------------- مطابقة أعمدة الاستيراد
create table if not exists public.import_mappings (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null default 'default',
  mapping     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists import_mappings_store_name_uidx on public.import_mappings(store_id, name);

-- ------------------------------------------------------- اشتراكات الإشعارات
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth_key    text not null,
  created_at  timestamptz not null default now()
);
create index if not exists push_subscriptions_store_idx on public.push_subscriptions(store_id);

-- --------------------------------------------------- الإشعار اليومي المجمّع
create table if not exists public.daily_digests (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references public.stores(id) on delete cascade,
  digest_date         date not null,
  item_count          integer not null default 0,
  total_value_at_risk numeric(14,2) not null default 0,
  title               text not null,
  body                text not null,
  created_at          timestamptz not null default now(),
  pushed_at           timestamptz,
  push_result         text,
  opened_at           timestamptz
);
create unique index if not exists daily_digests_store_date_uidx on public.daily_digests(store_id, digest_date);

-- ------------------------------------------------------------ أسرار داخلية
create table if not exists private.app_secrets (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);
revoke all on private.app_secrets from anon, authenticated;

insert into private.app_secrets(key, value)
values ('cron_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;
