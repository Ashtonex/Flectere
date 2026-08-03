export type Lead = {
  id: string;
  source: "diagnostic" | "contact";
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  diagnostic_score: number | null;
  diagnostic_focus: string | null;
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
  uploaded_at: string;
};
