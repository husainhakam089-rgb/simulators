-- =====================================================================
-- تخزين صور الإثبات — كل محل داخل مجلد باسم معرّفه
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('batch-photos', 'batch-photos', false, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists batch_photos_insert on storage.objects;
create policy batch_photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'batch-photos'
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

drop policy if exists batch_photos_select on storage.objects;
create policy batch_photos_select on storage.objects for select to authenticated
  using (
    bucket_id = 'batch-photos'
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );
