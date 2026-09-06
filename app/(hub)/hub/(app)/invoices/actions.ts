"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/hub/email";
import { invoiceEmailHtml, invoiceEmailText, invoiceNumber } from "@/lib/hub/invoices";
import type { BusinessArm, Client, Invoice, InvoiceItem, Service } from "@/lib/hub/types";

function nullableString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null;
}

function revalidateBilling(clientId?: string) {
  revalidatePath("/hub");
  revalidatePath("/hub/dashboard");
  revalidatePath("/hub/crm");
  revalidatePath("/hub/invoices");
  revalidatePath("/hub/clients");
  if (clientId) revalidatePath(`/hub/clients/${clientId}`);
}

export async function createInvoiceAction(formData: FormData) {
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const issuedOn = String(formData.get("issued_on") || "");
  if (!clientId || !title || !description || !issuedOn) return;

  const quantity = Number(formData.get("quantity") || 1);
  const unitPrice = Number(formData.get("unit_price") || 0);
  const taxAmount = Number(formData.get("tax_amount") || 0);
  const lineTotal = quantity * unitPrice;
  const total = lineTotal + taxAmount;

  const { data: revenueRecord } = await supabase
    .from("revenue_records")
    .insert({
      client_id: clientId,
      business_arm_id: nullableString(formData, "business_arm_id"),
      service_id: nullableString(formData, "service_id"),
      opportunity_id: nullableString(formData, "opportunity_id"),
      amount: total,
      category: String(formData.get("category") || "service_fee"),
      status: "invoiced",
      recorded_on: issuedOn,
      notes: `Invoice: ${title}`,
    })
    .select("id")
    .single();

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber(),
      client_id: clientId,
      business_arm_id: nullableString(formData, "business_arm_id"),
      service_id: nullableString(formData, "service_id"),
      opportunity_id: nullableString(formData, "opportunity_id"),
      revenue_record_id: revenueRecord?.id ?? null,
      title,
      currency: String(formData.get("currency") || "USD"),
      subtotal: lineTotal,
      tax_amount: taxAmount,
      total,
      issued_on: issuedOn,
      due_on: nullableString(formData, "due_on"),
      notes: nullableString(formData, "notes"),
    })
    .select("id")
    .single();

  if (invoice?.id) {
    await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      description,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });
  }

  revalidateBilling(clientId);
}

export async function sendInvoiceEmailAction(formData: FormData) {
  const supabase = await createClient();
  const invoiceId = String(formData.get("invoice_id") || "");
  if (!invoiceId) return;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) return;

  const invoiceRecord = invoice as Invoice;

  const [
    { data: client },
    { data: items },
    { data: arm },
    { data: service },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", invoiceRecord.client_id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId),
    invoiceRecord.business_arm_id
      ? supabase.from("business_arms").select("*").eq("id", invoiceRecord.business_arm_id).maybeSingle()
      : Promise.resolve({ data: null }),
    invoiceRecord.service_id
      ? supabase.from("services").select("*").eq("id", invoiceRecord.service_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const clientRecord = client as Client | null;
  if (!clientRecord?.contact_email) return;

  const itemList = (items ?? []) as InvoiceItem[];
  const subject = `Invoice ${invoiceRecord.invoice_number} from Flectere`;
  const body = invoiceEmailText(
    invoiceRecord,
    itemList,
    clientRecord,
    arm as BusinessArm | null,
    service as Service | null
  );

  const result = await sendEmail({
    to: clientRecord.contact_email,
    subject,
    text: body,
    html: invoiceEmailHtml(body),
  });

  await supabase.from("email_messages").insert({
    client_id: clientRecord.id,
    invoice_id: invoiceRecord.id,
    opportunity_id: invoiceRecord.opportunity_id,
    to_email: clientRecord.contact_email,
    subject,
    body,
    status: result.status,
    provider: result.provider,
    provider_message_id: result.status === "sent" ? result.providerMessageId : null,
    error_message: result.status === "failed" ? result.error : null,
    sent_at: result.status === "sent" ? new Date().toISOString() : null,
  });

  if (result.status === "sent") {
    await supabase.from("invoices").update({ status: "sent" }).eq("id", invoiceId);
  }

  revalidateBilling(clientRecord.id);
}

export async function markInvoicePaidAction(formData: FormData) {
  const supabase = await createClient();
  const invoiceId = String(formData.get("invoice_id") || "");
  const revenueRecordId = nullableString(formData, "revenue_record_id");
  const clientId = nullableString(formData, "client_id");
  if (!invoiceId) return;

  await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);

  if (revenueRecordId) {
    await supabase.from("revenue_records").update({ status: "received" }).eq("id", revenueRecordId);
  }

  revalidateBilling(clientId ?? undefined);
}
