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
