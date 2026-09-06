-- Flectēre Consolidated Migration Suite (Remaining Phases 2-4)

-- =====================================================
-- FILE: 0002_client_details.sql
-- =====================================================

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


-- =====================================================
-- FILE: 20260828193426_crm_operating_system.sql
-- =====================================================

-- Flectere Hub - CRM operating system.
--
-- Adds business arms, services, pipeline, activity logging, and revenue
-- records. Everything is internal-write, with RLS kept explicit so future
-- public Data API exposure does not accidentally expose CRM data.

-- ---------------------------------------------------------------------
-- business_arms - Flectere divisions/ventures/operating units
-- ---------------------------------------------------------------------

create table public.business_arms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sector text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'planned', 'paused', 'closed')),
  target_revenue numeric(14, 2),
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

alter table public.business_arms enable row level security;

create policy "internal full access to business_arms"
  on public.business_arms
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- Seed the planned product arms so the public product strategy and the
-- internal revenue dashboard start from the same operating map.
insert into public.business_arms (name, slug, sector, description, status)
values
  (
    'Flectēre Core',
    'flectere-core',
    'Shared infrastructure and capital control',
    'Parent control layer for identity, CRM, billing, documents, analytics, AI services, audit, integrations, trading, and capital governance.',
    'active'
  ),
  (
    'Intelligence & Advisory',
    'flectere-advisory',
    'Professional services',
    'Advisory, audits, research, transformation, implementation, process redesign, automation, and sector intelligence.',
    'active'
  ),
  (
    'SHIELD',
    'shield',
    'Insurance & InsurTech',
    'Policy administration, claims, risk scoring, brokers, and customer portals.',
    'planned'
  ),
  (
    'CUNICULUS',
    'cuniculus',
    'Mining',
    'Mine operations, production, equipment, compliance, and mineral intelligence.',
    'planned'
  ),
  (
    'CROPUS',
    'cropus',
    'Agriculture',
    'Farm management, crop intelligence, livestock, markets, and supply chains.',
    'planned'
  ),
  (
    'VECTURA',
    'vectura',
    'Transport & Logistics',
    'Fleet, deliveries, route optimisation, cargo, and transport operations.',
    'planned'
  ),
  (
    'FABRICA',
    'fabrica',
    'Manufacturing',
    'Production planning, inventory, quality control, and maintenance.',
    'planned'
  ),
  (
    'POTENTIA',
    'potentia',
    'Energy',
    'Energy monitoring, asset management, billing, and predictive maintenance.',
    'planned'
  ),
  (
    'SALUS',
    'salus',
    'Healthcare & Veterinary Services',
    'Patient and animal records, diagnostics support, facilities, and medicine management.',
    'planned'
  ),
  (
    'DOCTRINA',
    'doctrina',
    'Education',
    'School administration, learning platforms, assessments, and student analytics.',
    'planned'
  ),
  (
    'STIRPS',
    'stirps',
    'Wholesale & Retail',
    'Multi-tenant POS, inventory, purchasing, distribution, and customer intelligence.',
    'planned'
  ),
  (
    'AEDIFICIUM',
    'aedificium',
    'Construction & Infrastructure',
    'Projects, sites, commercial controls, procurement, plant, and workforce.',
    'planned'
  ),
  (
    'ARGENTARIA',
    'argentaria',
    'Banking & Financial Services',
    'Banks, MFIs, SACCOs, lending, collections, compliance, and financial intelligence.',
    'planned'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- services - offerings nested under business arms
-- ---------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_arm_id uuid not null references public.business_arms(id) on delete cascade,
  name text not null,
  description text,
  default_price numeric(14, 2),
  currency text not null default 'USD',
  status text not null default 'active' check (status in ('active', 'planned', 'paused', 'retired')),
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "internal full access to services"
  on public.services
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- ---------------------------------------------------------------------
-- crm_opportunities - sales pipeline across every business arm
-- ---------------------------------------------------------------------

create table public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  business_arm_id uuid references public.business_arms(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  stage text not null default 'lead' check (
    stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')
  ),
  value numeric(14, 2),
  currency text not null default 'USD',
  probability integer not null default 25 check (probability between 0 and 100),
  expected_close_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_opportunities enable row level security;

create policy "internal full access to crm_opportunities"
  on public.crm_opportunities
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- ---------------------------------------------------------------------
-- crm_activities - relationship history and follow-up log
-- ---------------------------------------------------------------------

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  business_arm_id uuid references public.business_arms(id) on delete set null,
  activity_type text not null default 'note' check (
    activity_type in ('note', 'call', 'email', 'meeting', 'proposal', 'delivery', 'follow_up')
  ),
  subject text not null,
  activity_date date not null default current_date,
  outcome text,
  next_step text,
  created_at timestamptz not null default now()
);

alter table public.crm_activities enable row level security;

create policy "internal full access to crm_activities"
  on public.crm_activities
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- ---------------------------------------------------------------------
-- revenue_records - realized and expected revenue across all services
-- ---------------------------------------------------------------------

create table public.revenue_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  business_arm_id uuid references public.business_arms(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  amount numeric(14, 2) not null,
  currency text not null default 'USD',
  category text not null default 'service_fee' check (
    category in ('service_fee', 'retainer', 'commission', 'subscription', 'other')
  ),
  status text not null default 'received' check (
    status in ('expected', 'invoiced', 'received', 'overdue', 'cancelled')
  ),
  recorded_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.revenue_records enable row level security;

create policy "internal full access to revenue_records"
  on public.revenue_records
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

-- ---------------------------------------------------------------------
-- Helpful indexes for dashboard and detail screens
-- ---------------------------------------------------------------------

create index if not exists business_arms_status_idx on public.business_arms(status);
create index if not exists services_business_arm_id_idx on public.services(business_arm_id);
create index if not exists crm_opportunities_client_id_idx on public.crm_opportunities(client_id);
create index if not exists crm_opportunities_business_arm_id_idx on public.crm_opportunities(business_arm_id);
create index if not exists crm_opportunities_stage_idx on public.crm_opportunities(stage);
create index if not exists crm_activities_client_id_idx on public.crm_activities(client_id);
create index if not exists crm_activities_business_arm_id_idx on public.crm_activities(business_arm_id);
create index if not exists crm_activities_activity_date_idx on public.crm_activities(activity_date desc);
create index if not exists revenue_records_client_id_idx on public.revenue_records(client_id);
create index if not exists revenue_records_business_arm_id_idx on public.revenue_records(business_arm_id);
create index if not exists revenue_records_recorded_on_idx on public.revenue_records(recorded_on desc);
create index if not exists revenue_records_status_idx on public.revenue_records(status);

grant select, insert, update, delete on public.business_arms to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.crm_opportunities to authenticated;
grant select, insert, update, delete on public.crm_activities to authenticated;
grant select, insert, update, delete on public.revenue_records to authenticated;


-- =====================================================
-- FILE: 20260828204202_invoicing_and_email.sql
-- =====================================================

-- Flectere Hub - invoicing, client files, and outbound email tracking.

-- ---------------------------------------------------------------------
-- Document classification for uploaded client files
-- ---------------------------------------------------------------------

alter table public.documents
  add column if not exists document_type text not null default 'general'
  check (document_type in ('general', 'contract', 'invoice', 'statement', 'report', 'identity', 'other'));

alter table public.documents
  add column if not exists notes text;

create index if not exists documents_client_type_idx on public.documents(client_id, document_type);

-- ---------------------------------------------------------------------
-- invoices - issued billing records
-- ---------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id uuid not null references public.clients(id) on delete cascade,
  business_arm_id uuid references public.business_arms(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  revenue_record_id uuid references public.revenue_records(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'paid', 'overdue', 'void')
  ),
  currency text not null default 'USD',
  subtotal numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  issued_on date not null default current_date,
  due_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "internal full access to invoices"
  on public.invoices
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read their own invoices"
  on public.invoices
  for select
  to authenticated
  using (client_id = public.jwt_client_id());

-- ---------------------------------------------------------------------
-- invoice_items - itemized service lines
-- ---------------------------------------------------------------------

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  line_total numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

create policy "internal full access to invoice_items"
  on public.invoice_items
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create policy "clients can read invoice_items for their own invoices"
  on public.invoice_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.invoices i
      where i.id = invoice_items.invoice_id
        and i.client_id = public.jwt_client_id()
    )
  );

-- ---------------------------------------------------------------------
-- email_messages - outbound mail log for invoices and client comms
-- ---------------------------------------------------------------------

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (
    status in ('draft', 'queued', 'sent', 'failed')
  ),
  provider text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.email_messages enable row level security;

create policy "internal full access to email_messages"
  on public.email_messages
  for all
  to authenticated
  using (public.jwt_role() = 'internal')
  with check (public.jwt_role() = 'internal');

create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_business_arm_id_idx on public.invoices(business_arm_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_due_on_idx on public.invoices(due_on);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists email_messages_client_id_idx on public.email_messages(client_id);
create index if not exists email_messages_invoice_id_idx on public.email_messages(invoice_id);
create index if not exists email_messages_status_idx on public.email_messages(status);

grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.email_messages to authenticated;


-- =====================================================
-- FILE: 20260830213000_contract_extraction_and_challenges.sql
-- =====================================================

-- Flectere Hub - Contract Extraction, Predictive Deal Sizing, and Challenge Accounting
--
-- Adds support for setup fees, monthly recurring run rates, pricing floors,
-- and prop firm challenge tracking on trading accounts.

-- 1. Extend crm_opportunities
alter table public.crm_opportunities
  add column if not exists setup_fee numeric(14, 2),
  add column if not exists monthly_recurring numeric(14, 2),
  add column if not exists contract_months integer default 12,
  add column if not exists total_contract_value numeric(14, 2),
  add column if not exists cash_extracted numeric(14, 2) default 0,
  add column if not exists pricing_floor numeric(14, 2),
  add column if not exists objections text,
  add column if not exists next_action text,
  add column if not exists renewal_date date;

-- 2. Extend leads with valuation suggestions
alter table public.leads
  add column if not exists estimated_value numeric(14, 2),
  add column if not exists suggested_arm_slug text;

-- 3. Extend trading_accounts with challenge accounting
alter table public.trading_accounts
  add column if not exists challenge_cost numeric(14, 2),
  add column if not exists phase text default 'phase_1' check (phase in ('phase_1', 'phase_2', 'funded', 'live', 'blown')),
  add column if not exists fee_refunded boolean default false;


-- =====================================================
-- FILE: 20260830220000_client_portal_v2.sql
-- =====================================================

-- Flectere Hub - Client Portal v2
--
-- Trading data is internal-only. Drop all client-facing SELECT policies on
-- trading tables, and add scoped read access to the CRM tables clients
-- actually need: their won opportunities, the arms they're engaged with,
-- and the services on those engagements.

-- ---------------------------------------------------------------------
-- 1. Revoke client read access on trading tables
-- ---------------------------------------------------------------------

drop policy if exists "clients can read their own trading_accounts"
  on public.trading_accounts;

drop policy if exists "clients can read performance_entries for their own accounts"
  on public.performance_entries;

drop policy if exists "clients can read expenses for their own accounts"
  on public.expenses;

drop policy if exists "clients can read withdrawals for their own accounts"
  on public.withdrawals;

-- ---------------------------------------------------------------------
-- 2. Clients can read their own won/active CRM opportunities
--    (won only — internal pipeline stages are not exposed)
-- ---------------------------------------------------------------------

create policy "clients can read their own opportunities"
  on public.crm_opportunities
  for select
  to authenticated
  using (
    client_id = public.jwt_client_id()
    and stage = 'won'
  );

-- ---------------------------------------------------------------------
-- 3. Clients can read business arms they are engaged with
-- ---------------------------------------------------------------------

create policy "clients can read their engaged business arms"
  on public.business_arms
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.crm_opportunities o
      where o.business_arm_id = business_arms.id
        and o.client_id = public.jwt_client_id()
        and o.stage = 'won'
    )
  );

-- ---------------------------------------------------------------------
-- 4. Clients can read services on their engagements
-- ---------------------------------------------------------------------

create policy "clients can read services for their engagements"
  on public.services
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.crm_opportunities o
      where o.service_id = services.id
        and o.client_id = public.jwt_client_id()
        and o.stage = 'won'
    )
  );


-- =====================================================
-- FILE: 20260830230000_portal_access_links.sql
-- =====================================================

-- Flectere Hub - Client Portal v3: Product Catalogue & Access Links
--
-- 1. Adds access_url + tagline to services (product platform link and
--    short marketing line shown in the client portal catalogue).
-- 2. Adds client_access_url to crm_opportunities for per-client override
--    links (e.g. unique login tokens, personalised subdomains).
-- 3. Widens client RLS on business_arms and services from subscription-
--    scoped reads to full catalogue reads (active + planned arms, all
--    active services) so clients can browse the product catalogue.

-- ---------------------------------------------------------------------
-- 1. Extend services
-- ---------------------------------------------------------------------

alter table public.services
  add column if not exists tagline text,
  add column if not exists access_url text;

-- ---------------------------------------------------------------------
-- 2. Extend crm_opportunities with per-client access URL
-- ---------------------------------------------------------------------

alter table public.crm_opportunities
  add column if not exists client_access_url text;

-- ---------------------------------------------------------------------
-- 3. Replace narrow subscription-scoped catalogue RLS with open
--    catalogue policies.
--    The previous policies only returned rows tied to the client's own
--    won opportunities. These new ones open the full catalogue so
--    clients can browse what Flectere offers.
-- ---------------------------------------------------------------------

drop policy if exists "clients can read their engaged business arms"
  on public.business_arms;

drop policy if exists "clients can read services for their engagements"
  on public.services;

-- Clients can browse all active and planned business arms
create policy "clients can browse business arms catalogue"
  on public.business_arms
  for select
  to authenticated
  using (
    public.jwt_client_id() is not null
    and status in ('active', 'planned')
  );

-- Clients can browse all active services (planned arms' services
-- are still hidden until the arm goes live)
create policy "clients can browse active services"
  on public.services
  for select
  to authenticated
  using (
    public.jwt_client_id() is not null
    and status = 'active'
  );


