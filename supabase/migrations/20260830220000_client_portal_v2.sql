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
