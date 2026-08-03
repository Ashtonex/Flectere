-- Flectēre Hub — Phase 1 schema
--
-- How to run this: until a Supabase CLI/MCP connection exists for this
-- project, the fastest path is pasting this whole file into the Supabase
-- Dashboard's SQL Editor and running it once. Once a CLI/MCP connection
-- exists, this can be formalized into a proper `supabase migration`
-- history entry instead.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Auth helpers
--
-- Role and client_id are authoritative in the user's app_metadata (set
-- by an internal admin via the service-role key at account-creation
-- time — never user-editable), and Supabase includes app_metadata in
-- every issued JWT automatically. These functions read that JWT rather
-- than a table, so they can't recurse into the RLS they're used inside.
-- ---------------------------------------------------------------------

create or replace function public.jwt_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

create or replace function public.jwt_client_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'client_id', '')::uuid;
$$;

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "internal full access to clients"
  on public.clients
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read their own client row"
  on public.clients
  for select
  to authenticated
  using (id = public.jwt_client_id());

-- ---------------------------------------------------------------------
-- profiles
-- Display info only (name, etc). Authorization decisions use the JWT
-- claims above, not this table, so there's no recursive-RLS risk.
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('internal', 'client')),
  full_name text,
  client_id uuid references public.clients(id),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "internal full access to profiles"
  on public.profiles
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- leads — diagnostic + contact form submissions. Internal-only.
-- ---------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('diagnostic', 'contact')),
  name text not null,
  email text not null,
  company text,
  message text,
  diagnostic_score integer,
  diagnostic_focus text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "internal full access to leads"
  on public.leads
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- ---------------------------------------------------------------------
-- trading_accounts
-- ---------------------------------------------------------------------

create table public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id),
  label text not null,
  broker_or_prop_firm text,
  account_type text not null check (account_type in ('challenge', 'funded', 'live')),
  starting_balance numeric(14, 2),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.trading_accounts enable row level security;

create policy "internal full access to trading_accounts"
  on public.trading_accounts
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read their own trading_accounts"
  on public.trading_accounts
  for select
  to authenticated
  using (client_id = public.jwt_client_id());

-- ---------------------------------------------------------------------
-- performance_entries — point-in-time balance/equity/pnl snapshots
-- ---------------------------------------------------------------------

create table public.performance_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.trading_accounts(id) on delete cascade,
  entry_date date not null,
  balance numeric(14, 2),
  equity numeric(14, 2),
  pnl numeric(14, 2),
  source text not null default 'manual' check (source in ('manual', 'csv', 'api')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.performance_entries enable row level security;

create policy "internal full access to performance_entries"
  on public.performance_entries
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read performance_entries for their own accounts"
  on public.performance_entries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trading_accounts a
      where a.id = performance_entries.account_id
        and a.client_id = public.jwt_client_id()
    )
  );

-- ---------------------------------------------------------------------
-- expenses — prop firm fees, live account deposits, etc.
-- ---------------------------------------------------------------------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.trading_accounts(id) on delete set null,
  category text not null check (category in ('prop_fee', 'deposit', 'other')),
  amount numeric(14, 2) not null,
  currency text not null default 'USD',
  incurred_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "internal full access to expenses"
  on public.expenses
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read expenses for their own accounts"
  on public.expenses
  for select
  to authenticated
  using (
    account_id is not null
    and exists (
      select 1
      from public.trading_accounts a
      where a.id = expenses.account_id
        and a.client_id = public.jwt_client_id()
    )
  );

-- ---------------------------------------------------------------------
-- Grants — RLS restricts rows, but the authenticated role still needs
-- table-level privileges to attempt the operation at all. Most fresh
-- Supabase projects grant these by default on public schema tables, but
-- being explicit avoids depending on that default.
-- ---------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.trading_accounts to authenticated;
grant select, insert, update, delete on public.performance_entries to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
