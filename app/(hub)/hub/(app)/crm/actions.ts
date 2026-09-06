"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/hub/crm";
import { invoiceNumber, revenueStatusToInvoiceStatus } from "@/lib/hub/invoices";

function nullableString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null;
}

function nullableNumber(formData: FormData, key: string) {
  const raw = formData.get(key);
  return raw ? Number(raw) : null;
}

async function resolveArmId(supabase: any, armIdOrSlug: string | null) {
  if (!armIdOrSlug) return null;
  if (armIdOrSlug.toLowerCase() === "custom") {
    const { data } = await supabase.from("business_arms").select("id").eq("slug", "custom").maybeSingle();
    return data?.id ?? null;
  }
  return armIdOrSlug;
}

async function resolveServiceId(supabase: any, serviceIdOrName: string | null) {
  if (!serviceIdOrName) return null;
  if (serviceIdOrName.toLowerCase() === "custom") {
    const { data } = await supabase.from("services").select("id").eq("name", "Custom").maybeSingle();
    return data?.id ?? null;
  }
  return serviceIdOrName;
}

function revalidateCrm() {
  revalidatePath("/hub");
  revalidatePath("/hub/dashboard");
  revalidatePath("/hub/crm");
  revalidatePath("/hub/invoices");
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

  const rawArmId = String(formData.get("business_arm_id") || "");
  const businessArmId = await resolveArmId(supabase, rawArmId);
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

  const businessArmId = await resolveArmId(supabase, nullableString(formData, "business_arm_id"));
  const serviceId = await resolveServiceId(supabase, nullableString(formData, "service_id"));

  await supabase.from("crm_opportunities").insert({
    title,
    client_id: nullableString(formData, "client_id"),
    lead_id: nullableString(formData, "lead_id"),
    business_arm_id: businessArmId,
    service_id: serviceId,
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

  const businessArmId = await resolveArmId(supabase, nullableString(formData, "business_arm_id"));

  await supabase.from("crm_activities").insert({
    subject,
    activity_date: activityDate,
    activity_type: String(formData.get("activity_type") || "note"),
    client_id: nullableString(formData, "client_id"),
    lead_id: nullableString(formData, "lead_id"),
    opportunity_id: nullableString(formData, "opportunity_id"),
    business_arm_id: businessArmId,
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

  let clientId = nullableString(formData, "client_id");
  const opportunityId = nullableString(formData, "opportunity_id");
  const businessArmId = await resolveArmId(supabase, nullableString(formData, "business_arm_id"));
  const serviceId = await resolveServiceId(supabase, nullableString(formData, "service_id"));
  const category = String(formData.get("category") || "service_fee");
  const status = String(formData.get("status") || "received");
  const notes = nullableString(formData, "notes");
  const amount = Number(amountRaw);

  // Auto-infer client_id from opportunity if client_id was left blank
  if (!clientId && opportunityId) {
    const { data: opp } = await supabase
      .from("crm_opportunities")
      .select("client_id")
      .eq("id", opportunityId)
      .maybeSingle();
    if (opp?.client_id) {
      clientId = opp.client_id;
    }
  }

  const { data: revenueRecord } = await supabase
    .from("revenue_records")
    .insert({
      amount,
      recorded_on: recordedOn,
      client_id: clientId,
      business_arm_id: businessArmId,
      service_id: serviceId,
      opportunity_id: opportunityId,
      category,
      status,
      notes,
    })
    .select("id")
    .single();

  // Create corresponding invoice so CRM and Invoices pages stay 100% unified
  const invStatus = revenueStatusToInvoiceStatus(status);
  let targetClientId = clientId;
  if (!targetClientId) {
    const { data: firstClient } = await supabase.from("clients").select("id").limit(1).maybeSingle();
    targetClientId = firstClient?.id ?? null;
  }

  if (targetClientId) {
    const title = notes || `Revenue Entry - ${recordedOn}`;
    const invNumMatch = notes?.match(/(INV-\d{4}-\d+|FLC-[A-Z0-9-]+)/i);
    const invNum = invNumMatch ? invNumMatch[1].toUpperCase() : invoiceNumber();

    const { data: invoice } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invNum,
        client_id: targetClientId,
        business_arm_id: businessArmId,
        service_id: serviceId,
        opportunity_id: opportunityId,
        revenue_record_id: revenueRecord?.id ?? null,
        title,
        currency: "USD",
        subtotal: amount,
        tax_amount: 0,
        total: amount,
        issued_on: recordedOn,
        due_on: recordedOn,
        notes,
        status: invStatus,
      })
      .select("id")
      .single();

    if (invoice?.id) {
      await supabase.from("invoice_items").insert({
        invoice_id: invoice.id,
        description: title,
        quantity: 1,
        unit_price: amount,
        line_total: amount,
      });
    }
  }

  revalidateCrm();
}

export async function updateOpportunityStageAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "");
  if (!id || !stage) return;

  await supabase.from("crm_opportunities").update({ stage }).eq("id", id);
  revalidateCrm();
}

export async function updateOpportunityAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return;

  const clientId = nullableString(formData, "client_id");
  const businessArmId = await resolveArmId(supabase, nullableString(formData, "business_arm_id"));
  const serviceId = await resolveServiceId(supabase, nullableString(formData, "service_id"));
  const stage = String(formData.get("stage") || "lead");
  const value = nullableNumber(formData, "value");
  const setupFee = nullableNumber(formData, "setup_fee");
  const monthlyRecurring = nullableNumber(formData, "monthly_recurring");
  const contractMonths = nullableNumber(formData, "contract_months");
  const probability = Number(formData.get("probability") || 25);
  const expectedCloseOn = nullableString(formData, "expected_close_on");
  const notes = nullableString(formData, "notes");

  // Compute total contract value if setup + monthly retainer provided
  let totalContractValue = nullableNumber(formData, "total_contract_value");
  if (!totalContractValue && (setupFee || monthlyRecurring)) {
    totalContractValue = (setupFee ?? 0) + (monthlyRecurring ?? 0) * (contractMonths ?? 12);
  } else if (!totalContractValue && value) {
    totalContractValue = value;
  }

  await supabase
    .from("crm_opportunities")
    .update({
      title,
      client_id: clientId,
      business_arm_id: businessArmId,
      service_id: serviceId,
      stage,
      value: value ?? totalContractValue,
      setup_fee: setupFee,
      monthly_recurring: monthlyRecurring,
      contract_months: contractMonths,
      total_contract_value: totalContractValue,
      probability,
      expected_close_on: expectedCloseOn,
      notes,
    })
    .eq("id", id);

  revalidateCrm();
}

export async function deleteOpportunityAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("crm_opportunities").delete().eq("id", id);
  revalidateCrm();
}

