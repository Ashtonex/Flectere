export type Lead = {
  id: string;
  source: "diagnostic" | "contact";
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  diagnostic_score: number | null;
  diagnostic_focus: string | null;
  estimated_value?: number | null;
  suggested_arm_slug?: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  contact_email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type TradingAccount = {
  id: string;
  client_id: string | null;
  label: string;
  broker_or_prop_firm: string | null;
  account_type: "challenge" | "funded" | "live";
  starting_balance: number | null;
  challenge_cost?: number | null;
  phase?: "phase_1" | "phase_2" | "funded" | "live" | "blown";
  fee_refunded?: boolean;
  status: string;
  created_at: string;
};

export type PerformanceEntry = {
  id: string;
  account_id: string;
  entry_date: string;
  balance: number | null;
  equity: number | null;
  pnl: number | null;
  source: "manual" | "csv" | "api";
  notes: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  account_id: string | null;
  category: "prop_fee" | "deposit" | "other";
  amount: number;
  currency: string;
  incurred_on: string;
  notes: string | null;
  created_at: string;
};

export type Withdrawal = {
  id: string;
  account_id: string;
  amount: number;
  withdrawn_on: string;
  notes: string | null;
  created_at: string;
};

export type ClientDocument = {
  id: string;
  client_id: string;
  storage_path: string;
  label: string;
  document_type: "general" | "contract" | "invoice" | "statement" | "report" | "identity" | "other";
  notes: string | null;
  uploaded_at: string;
};

export type BusinessArm = {
  id: string;
  name: string;
  slug: string;
  sector: string;
  description: string | null;
  status: "active" | "planned" | "paused" | "closed";
  target_revenue: number | null;
  currency: string;
  created_at: string;
};

export type Service = {
  id: string;
  business_arm_id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  default_price: number | null;
  currency: string;
  status: "active" | "planned" | "paused" | "retired";
  access_url: string | null;
  created_at: string;
};

export type CrmOpportunity = {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  business_arm_id: string | null;
  service_id: string | null;
  title: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  value: number | null;
  setup_fee?: number | null;
  monthly_recurring?: number | null;
  contract_months?: number | null;
  total_contract_value?: number | null;
  cash_extracted?: number | null;
  pricing_floor?: number | null;
  objections?: string | null;
  next_action?: string | null;
  renewal_date?: string | null;
  client_access_url?: string | null;
  currency: string;
  probability: number;
  expected_close_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmActivity = {
  id: string;
  client_id: string | null;
  lead_id: string | null;
  opportunity_id: string | null;
  business_arm_id: string | null;
  activity_type: "note" | "call" | "email" | "meeting" | "proposal" | "delivery" | "follow_up";
  subject: string;
  activity_date: string;
  outcome: string | null;
  next_step: string | null;
  created_at: string;
};

export type RevenueRecord = {
  id: string;
  client_id: string | null;
  business_arm_id: string | null;
  service_id: string | null;
  opportunity_id: string | null;
  amount: number;
  currency: string;
  category: "service_fee" | "retainer" | "commission" | "subscription" | "other";
  status: "expected" | "invoiced" | "received" | "overdue" | "cancelled";
  recorded_on: string;
  notes: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  client_id: string;
  business_arm_id: string | null;
  service_id: string | null;
  opportunity_id: string | null;
  revenue_record_id: string | null;
  title: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  issued_on: string;
  due_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type EmailMessage = {
  id: string;
  client_id: string | null;
  invoice_id: string | null;
  opportunity_id: string | null;
  to_email: string;
  subject: string;
  body: string;
  status: "draft" | "queued" | "sent" | "failed";
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};
