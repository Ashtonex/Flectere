-- Flectēre Hub — client details: phone, extracted value (withdrawals),
-- and document storage.
--
-- How to run this: paste the whole file into the Supabase Dashboard's
-- SQL Editor and run it once (same as 0001_hub_schema.sql).

-- ---------------------------------------------------------------------
-- clients.phone
-- ---------------------------------------------------------------------

alter table public.clients add column if not exists phone text;

-- ---------------------------------------------------------------------
-- withdrawals — money taken OUT of an account (payouts, profit splits,
-- live account withdrawals). Symmetrical to `expenses`, which tracks
-- money going in. "Extracted value" in the UI = sum of these.
-- ---------------------------------------------------------------------

create table public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts(id) on delete cascade,
  amount numeric(14, 2) not null,
  withdrawn_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.withdrawals enable row level security;

create policy "internal full access to withdrawals"
  on public.withdrawals
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read withdrawals for their own accounts"
  on public.withdrawals
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trading_accounts a
      where a.id = withdrawals.account_id
        and a.client_id = public.jwt_client_id()
    )
  );

grant select, insert, update, delete on public.withdrawals to authenticated;

-- ---------------------------------------------------------------------
-- documents — metadata for files in the `client-documents` storage
-- bucket. The bucket is private; access is gated by storage RLS below,
-- keyed on the object path being `${client_id}/${filename}`.
-- ---------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  storage_path text not null,
  label text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "internal full access to documents"
  on public.documents
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read their own documents"
  on public.documents
  for select
  to authenticated
  using (client_id = public.jwt_client_id());

grant select, insert, update, delete on public.documents to authenticated;

-- ---------------------------------------------------------------------
-- Storage bucket + RLS
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  20971520, -- 20MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "internal full access to client-documents storage"
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'client-documents' and public.jwt_role() = 'internal')
  with check (bucket_id = 'client-documents' and public.jwt_role() = 'internal');

create policy "clients can read their own documents storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'client-documents'
    and public.jwt_client_id() is not null
    and (storage.foldername(name))[1] = public.jwt_client_id()::text
  );
