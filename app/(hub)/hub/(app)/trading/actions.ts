"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS is the authoritative gate here (trading_accounts/performance_entries/
// expenses policies require jwt_role() = 'internal' for writes) — a
// client-role session hitting these actions gets rejected at the database,
// not just skipped in the UI.

export async function createClientAction(formData: FormData) {
  const supabase = createClient();

  const name = String(formData.get("name") || "").trim();
  const contactEmail = String(formData.get("contact_email") || "").trim() || null;
  if (!name) return;

  await supabase.from("clients").insert({ name, contact_email: contactEmail });
  revalidatePath("/hub/trading");
}

export async function createAccountAction(formData: FormData) {
  const supabase = createClient();

  const label = String(formData.get("label") || "").trim();
  if (!label) return;

  const broker = String(formData.get("broker_or_prop_firm") || "").trim() || null;
  const accountType = String(formData.get("account_type") || "challenge");
  const startingBalanceRaw = formData.get("starting_balance");
  const clientIdRaw = String(formData.get("client_id") || "").trim();

  await supabase.from("trading_accounts").insert({
    label,
    broker_or_prop_firm: broker,
    account_type: accountType,
    starting_balance: startingBalanceRaw ? Number(startingBalanceRaw) : null,
    client_id: clientIdRaw || null,
  });

  revalidatePath("/hub/trading");
}

export async function addPerformanceEntryAction(formData: FormData) {
  const supabase = createClient();

  const accountId = String(formData.get("account_id") || "");
  const entryDate = String(formData.get("entry_date") || "");
  if (!accountId || !entryDate) return;

  const balanceRaw = formData.get("balance");
  const equityRaw = formData.get("equity");
  const pnlRaw = formData.get("pnl");

  await supabase.from("performance_entries").insert({
    account_id: accountId,
    entry_date: entryDate,
    balance: balanceRaw ? Number(balanceRaw) : null,
    equity: equityRaw ? Number(equityRaw) : null,
    pnl: pnlRaw ? Number(pnlRaw) : null,
    source: "manual",
  });

  revalidatePath("/hub/trading");
}

export async function addExpenseAction(formData: FormData) {
  const supabase = createClient();

  const amountRaw = formData.get("amount");
  const incurredOn = String(formData.get("incurred_on") || "");
  if (!amountRaw || !incurredOn) return;

  const accountIdRaw = String(formData.get("account_id") || "");
  const category = String(formData.get("category") || "other");

  await supabase.from("expenses").insert({
    account_id: accountIdRaw || null,
    category,
    amount: Number(amountRaw),
    incurred_on: incurredOn,
  });

  revalidatePath("/hub/trading");
}
