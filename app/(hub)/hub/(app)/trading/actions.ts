"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function nullableString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw !== null && raw !== "" ? Number(raw) : null;
}

function revalidateTrading() {
  revalidatePath("/hub/trading");
  revalidatePath("/hub/dashboard");
  revalidatePath("/hub");
}

export async function createPropAccountAction(formData: FormData) {
  const supabase = await createClient();

  const label = String(formData.get("label") || "").trim();
  if (!label) return;

  const broker = nullableString(formData, "broker_or_prop_firm");
  const accountType = String(formData.get("account_type") || "challenge");
  const phase = nullableString(formData, "phase") as "phase_1" | "phase_2" | "funded" | "live" | "blown" | null;
  const startingBalance = nullableNumber(formData, "starting_balance");
  const challengeCost = nullableNumber(formData, "challenge_cost");
  const feeRefunded = formData.get("fee_refunded") === "true";
  const status = String(formData.get("status") || "active");

  const { data: account, error } = await supabase
    .from("trading_accounts")
    .insert({
      label,
      broker_or_prop_firm: broker,
      account_type: accountType,
      starting_balance: startingBalance,
      challenge_cost: challengeCost,
      phase: phase ?? (accountType === "funded" ? "funded" : accountType === "live" ? "live" : "phase_1"),
      fee_refunded: feeRefunded,
      status,
      client_id: null, // Strictly proprietary internal desk
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create prop account:", error.message);
    return;
  }

  // If challenge cost is recorded, log expense immediately
  if (account?.id && challengeCost && challengeCost > 0) {
    await supabase.from("expenses").insert({
      account_id: account.id,
      category: accountType === "live" ? "deposit" : "prop_fee",
      amount: challengeCost,
      currency: "USD",
      incurred_on: new Date().toISOString().slice(0, 10),
      notes: `${label} initial allocation / evaluation fee`,
    });
  }

  revalidateTrading();
}

export async function updatePropAccountAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const label = String(formData.get("label") || "").trim();
  if (!id || !label) return;

  const broker = nullableString(formData, "broker_or_prop_firm");
  const accountType = String(formData.get("account_type") || "challenge");
  const phase = nullableString(formData, "phase");
  const startingBalance = nullableNumber(formData, "starting_balance");
  const challengeCost = nullableNumber(formData, "challenge_cost");
  const feeRefunded = formData.get("fee_refunded") === "true";
  const status = String(formData.get("status") || "active");

  await supabase
    .from("trading_accounts")
    .update({
      label,
      broker_or_prop_firm: broker,
      account_type: accountType,
      phase: phase ?? undefined,
      starting_balance: startingBalance,
      challenge_cost: challengeCost,
      fee_refunded: feeRefunded,
      status,
    })
    .eq("id", id);

  revalidateTrading();
}

export async function deletePropAccountAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("performance_entries").delete().eq("account_id", id);
  await supabase.from("expenses").delete().eq("account_id", id);
  await supabase.from("withdrawals").delete().eq("account_id", id);
  await supabase.from("trading_accounts").delete().eq("id", id);

  revalidateTrading();
}

export async function addPerformanceEntryAction(formData: FormData) {
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") || "");
  const entryDate = String(formData.get("entry_date") || "");
  if (!accountId || !entryDate) return;

  const balance = nullableNumber(formData, "balance");
  const equity = nullableNumber(formData, "equity");
  const pnl = nullableNumber(formData, "pnl");
  const notes = nullableString(formData, "notes");

  await supabase.from("performance_entries").insert({
    account_id: accountId,
    entry_date: entryDate,
    balance,
    equity: equity ?? balance,
    pnl,
    notes,
    source: "manual",
  });

  revalidateTrading();
}

export async function updatePerformanceEntryAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const entryDate = String(formData.get("entry_date") || "");
  if (!id || !entryDate) return;

  const balance = nullableNumber(formData, "balance");
  const equity = nullableNumber(formData, "equity");
  const pnl = nullableNumber(formData, "pnl");
  const notes = nullableString(formData, "notes");

  await supabase
    .from("performance_entries")
    .update({
      entry_date: entryDate,
      balance,
      equity: equity ?? balance,
      pnl,
      notes,
    })
    .eq("id", id);

  revalidateTrading();
}

export async function deletePerformanceEntryAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("performance_entries").delete().eq("id", id);
  revalidateTrading();
}

export async function addPropPayoutAction(formData: FormData) {
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") || "");
  const withdrawnOn = String(formData.get("withdrawn_on") || "");
  const amount = nullableNumber(formData, "amount");
  if (!accountId || !withdrawnOn || !amount || amount <= 0) return;

  const notes = nullableString(formData, "notes");

  await supabase.from("withdrawals").insert({
    account_id: accountId,
    amount,
    withdrawn_on: withdrawnOn,
    notes: notes ?? "Prop firm profit withdrawal payout",
  });

  revalidateTrading();
}

export async function deletePropPayoutAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("withdrawals").delete().eq("id", id);
  revalidateTrading();
}

export async function addDeskExpenseAction(formData: FormData) {
  const supabase = await createClient();

  const amount = nullableNumber(formData, "amount");
  const incurredOn = String(formData.get("incurred_on") || "");
  if (!amount || amount <= 0 || !incurredOn) return;

  const accountId = nullableString(formData, "account_id");
  const category = String(formData.get("category") || "prop_fee") as "prop_fee" | "deposit" | "other";
  const notes = nullableString(formData, "notes");

  await supabase.from("expenses").insert({
    account_id: accountId,
    category,
    amount,
    currency: "USD",
    incurred_on: incurredOn,
    notes,
  });

  revalidateTrading();
}

export async function deleteDeskExpenseAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("expenses").delete().eq("id", id);
  revalidateTrading();
}
