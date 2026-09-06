-- =====================================================================
-- الصلاحيات: كل شيء محصور بالمحل، وأسعار الكلفة محجوبة عن العامل
-- =====================================================================

-- دوال مساعدة (security definer لتفادي التكرار اللانهائي في السياسات)
create or replace function public.current_store_id()
returns uuid language sql stable security definer set search_path = public as $$
  select store_id from public.users where id = auth.uid() and is_active
$$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid() and is_active), false)
$$;

grant execute on function public.current_store_id, public.current_user_role, public.is_admin to authenticated;

alter table public.stores             enable row level security;
alter table public.users              enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.batches            enable row level security;
alter table public.alerts             enable row level security;
alter table public.actions_log        enable row level security;
alter table public.import_mappings    enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.daily_digests      enable row level security;

-- المحال: يقرأ الجميع محلّهم، ويعدّل الأدمن فقط
drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated
  using (id = public.current_store_id());
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update to authenticated
  using (id = public.current_store_id() and public.is_admin())
  with check (id = public.current_store_id());

-- المستخدمون: كل واحد يرى نفسه، والأدمن يرى ويدير طاقم محلّه
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select to authenticated
  using (id = auth.uid() or (store_id = public.current_store_id() and public.is_admin()));
drop policy if exists users_admin_write on public.users;
create policy users_admin_write on public.users for update to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id());
drop policy if exists users_admin_delete on public.users;
create policy users_admin_delete on public.users for delete to authenticated
  using (store_id = public.current_store_id() and public.is_admin() and id <> auth.uid());

-- المجموعات: الجميع يقرأ (العامل يحتاج العمر الافتراضي)، الأدمن يكتب
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to authenticated
  using (store_id = public.current_store_id());
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

-- الأصناف: الأدمن فقط. العامل يصل إليها عبر دالة لا تُرجع الأسعار إطلاقاً.
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

-- الوجبات: العامل يضيف ويرى ما سجّله هو، والأدمن يرى ويعدّل كل شيء
drop policy if exists batches_select on public.batches;
create policy batches_select on public.batches for select to authenticated
  using (store_id = public.current_store_id() and (public.is_admin() or received_by = auth.uid()));
drop policy if exists batches_insert on public.batches;
create policy batches_insert on public.batches for insert to authenticated
  with check (store_id = public.current_store_id() and received_by = auth.uid());
drop policy if exists batches_admin_update on public.batches;
create policy batches_admin_update on public.batches for update to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id());
drop policy if exists batches_admin_delete on public.batches;
create policy batches_admin_delete on public.batches for delete to authenticated
  using (store_id = public.current_store_id() and public.is_admin());

-- التنبيهات وسجل القرارات ولوحة الأدمن: للأدمن وحده
drop policy if exists alerts_admin on public.alerts;
create policy alerts_admin on public.alerts for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

drop policy if exists actions_admin on public.actions_log;
create policy actions_admin on public.actions_log for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

drop policy if exists mappings_admin on public.import_mappings;
create policy mappings_admin on public.import_mappings for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

drop policy if exists digests_admin on public.daily_digests;
create policy digests_admin on public.daily_digests for all to authenticated
  using (store_id = public.current_store_id() and public.is_admin())
  with check (store_id = public.current_store_id() and public.is_admin());

-- اشتراكات الإشعارات: كل مستخدم يدير اشتراكه
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and store_id = public.current_store_id());
