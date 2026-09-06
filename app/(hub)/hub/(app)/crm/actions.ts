"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/hub/crm";

function nullableString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw ? Number(raw) : null;
}

function revalidateCrm() {
  revalidatePath("/hub");
  revalidatePath("/hub/dashboard");
  revalidatePath("/hub/crm");
  revalidatePath("/hub/arms");
  revalidatePath("/hub/clients");
}

export async function createBusinessArmAction(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const sector = String(formData.get("sector") || "").trim();
  if (!name || !sector) return;

  const slug = slugify(nullableString(formData, "slug") ?? name);

  await supabase.from("business_arms").insert({
    name,
    slug,
    sector,
    description: nullableString(formData, "description"),
    status: String(formData.get("status") || "active"),
    target_revenue: nullableNumber(formData, "target_revenue"),
  });

  revalidateCrm();
}

export async function createServiceAction(formData: FormData) {
  const supabase = await createClient();

  const businessArmId = String(formData.get("business_arm_id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!businessArmId || !name) return;

  await supabase.from("services").insert({
    business_arm_id: businessArmId,
    name,
    description: nullableString(formData, "description"),
    default_price: nullableNumber(formData, "default_price"),
    status: String(formData.get("status") || "active"),
  });

  revalidateCrm();
}

export async function createOpportunityAction(formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  if (!title) return;

  await supabase.from("crm_opportunities").insert({
    title,
    client_id: nullableString(formData, "client_id"),
    lead_id: nullableString(formData, "lead_id"),
    business_arm_id: nullableString(formData, "business_arm_id"),
    service_id: nullableString(formData, "service_id"),
    stage: String(formData.get("stage") || "lead"),
    value: nullableNumber(formData, "value"),
    probability: Number(formData.get("probability") || 25),
    expected_close_on: nullableString(formData, "expected_close_on"),
    notes: nullableString(formData, "notes"),
  });

  revalidateCrm();
}

export async function createActivityAction(formData: FormData) {
  const supabase = await createClient();

  const subject = String(formData.get("subject") || "").trim();
  const activityDate = String(formData.get("activity_date") || "").trim();
  if (!subject || !activityDate) return;

  await supabase.from("crm_activities").insert({
    subject,
    activity_date: activityDate,
    activity_type: String(formData.get("activity_type") || "note"),
    client_id: nullableString(formData, "client_id"),
    lead_id: nullableString(formData, "lead_id"),
    opportunity_id: nullableString(formData, "opportunity_id"),
    business_arm_id: nullableString(formData, "business_arm_id"),
    outcome: nullableString(formData, "outcome"),
    next_step: nullableString(formData, "next_step"),
  });

  revalidateCrm();
}

export async function createRevenueRecordAction(formData: FormData) {
  const supabase = await createClient();

  const amountRaw = formData.get("amount");
  const recordedOn = String(formData.get("recorded_on") || "").trim();
  if (!amountRaw || !recordedOn) return;

  await supabase.from("revenue_records").insert({
    amount: Number(amountRaw),
    recorded_on: recordedOn,
    client_id: nullableString(formData, "client_id"),
    business_arm_id: nullableString(formData, "business_arm_id"),
    service_id: nullableString(formData, "service_id"),
    opportunity_id: nullableString(formData, "opportunity_id"),
    category: String(formData.get("category") || "service_fee"),
    status: String(formData.get("status") || "received"),
    notes: nullableString(formData, "notes"),
  });

  revalidateCrm();
}
