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
