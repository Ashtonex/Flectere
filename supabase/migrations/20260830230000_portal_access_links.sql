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
