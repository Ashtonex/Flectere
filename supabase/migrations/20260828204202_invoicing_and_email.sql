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
