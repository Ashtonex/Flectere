"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/hub/email";
import { invoiceEmailHtml, invoiceEmailText, invoiceNumber, invoiceStatusToRevenueStatus } from "@/lib/hub/invoices";
import type { BusinessArm, Client, Invoice, InvoiceItem, Service } from "@/lib/hub/types";

function nullableString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim() || null;
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

  const rawBusinessArmId = nullableString(formData, "business_arm_id");
  const rawServiceId = nullableString(formData, "service_id");
  const businessArmId = await resolveArmId(supabase, rawBusinessArmId);
  const serviceId = await resolveServiceId(supabase, rawServiceId);
  const opportunityId = nullableString(formData, "opportunity_id");

  const quantity = Number(formData.get("quantity") || 1);
  const unitPrice = Number(formData.get("unit_price") || 0);
  const taxAmount = Number(formData.get("tax_amount") || 0);
  const lineTotal = quantity * unitPrice;
  const total = lineTotal + taxAmount;

  const { data: revenueRecord } = await supabase
    .from("revenue_records")
    .insert({
      client_id: clientId,
      business_arm_id: businessArmId,
      service_id: serviceId,
      opportunity_id: opportunityId,
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
      business_arm_id: businessArmId,
      service_id: serviceId,
      opportunity_id: opportunityId,
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
  let revenueRecordId = nullableString(formData, "revenue_record_id");
  const clientId = nullableString(formData, "client_id");
  if (!invoiceId) return;

  await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);

  if (revenueRecordId) {
    await supabase.from("revenue_records").update({ status: "received" }).eq("id", revenueRecordId);
  } else {
    const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (inv) {
      const { data: newRev } = await supabase.from("revenue_records").insert({
        client_id: inv.client_id,
        business_arm_id: inv.business_arm_id,
        service_id: inv.service_id,
        opportunity_id: inv.opportunity_id,
        amount: inv.total,
        category: "service_fee",
        status: "received",
        recorded_on: inv.issued_on || new Date().toISOString().slice(0, 10),
        notes: `Invoice: ${inv.title} (${inv.invoice_number})`,
      }).select("id").single();
      if (newRev?.id) {
        await supabase.from("invoices").update({ revenue_record_id: newRev.id }).eq("id", invoiceId);
      }
    }
  }

  revalidateBilling(clientId ?? undefined);
}

export async function uploadPaymentInvoiceAction(formData: FormData) {
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") || "");
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const rawBusinessArmId = nullableString(formData, "business_arm_id");
  const rawServiceId = nullableString(formData, "service_id");
  const businessArmId = await resolveArmId(supabase, rawBusinessArmId);
  const serviceId = await resolveServiceId(supabase, rawServiceId);
  const opportunityId = nullableString(formData, "opportunity_id");
  const dueOn = nullableString(formData, "due_on");
  const notes = nullableString(formData, "notes");
  const file = formData.get("file");

  if (!clientId || !title || amount <= 0) return;

  let storagePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `invoices/${clientId}/${Date.now()}-${safeName}`;
    const { error: uploadErr } = await supabase.storage
      .from("client-documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (!uploadErr) {
      storagePath = path;
    }
  }

  const issuedOn = new Date().toISOString().slice(0, 10);
  const invNumber = invoiceNumber();

  // Create revenue record
  const { data: revenueRecord } = await supabase
    .from("revenue_records")
    .insert({
      client_id: clientId,
      business_arm_id: businessArmId,
      service_id: serviceId,
      opportunity_id: opportunityId,
      amount,
      category: "service_fee",
      status: "invoiced",
      recorded_on: issuedOn,
      notes: `Invoice: ${title}${notes ? ` - ${notes}` : ""}`,
    })
    .select("id")
    .single();

  // Create invoice record
  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invNumber,
      client_id: clientId,
      business_arm_id: businessArmId,
      service_id: serviceId,
      opportunity_id: opportunityId,
      revenue_record_id: revenueRecord?.id ?? null,
      title,
      currency: "USD",
      subtotal: amount,
      tax_amount: 0,
      total: amount,
      issued_on: issuedOn,
      due_on: dueOn,
      notes: notes ? `${notes} (Uploaded Invoice File: ${storagePath ?? "None"})` : `Uploaded Invoice File: ${storagePath ?? "None"}`,
      status: "sent",
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

  // Also link as a client document in documents table if file was attached
  if (storagePath) {
    await supabase.from("documents").insert({
      client_id: clientId,
      storage_path: storagePath,
      label: `Invoice ${invNumber} - ${title}`,
      document_type: "invoice",
      notes: `Uploaded payable invoice: $${amount}. Due: ${dueOn ?? "On receipt"}`,
    });
  }

  revalidateBilling(clientId);
}

export async function validateInvoiceAction(formData: FormData) {
  const supabase = await createClient();

  const invoiceId = String(formData.get("invoice_id") || "");
  const status = String(formData.get("status") || "paid") as Invoice["status"];
  const clientId = nullableString(formData, "client_id");
  let revenueRecordId = nullableString(formData, "revenue_record_id");

  if (!invoiceId) return;

  await supabase.from("invoices").update({ status }).eq("id", invoiceId);

  const targetRevStatus = invoiceStatusToRevenueStatus(status);

  if (revenueRecordId) {
    await supabase.from("revenue_records").update({ status: targetRevStatus }).eq("id", revenueRecordId);
  } else {
    // If invoice didn't have a linked revenue record, auto-create and link one
    const { data: inv } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (inv) {
      const { data: newRev } = await supabase.from("revenue_records").insert({
        client_id: inv.client_id,
        business_arm_id: inv.business_arm_id,
        service_id: inv.service_id,
        opportunity_id: inv.opportunity_id,
        amount: inv.total,
        category: "service_fee",
        status: targetRevStatus,
        recorded_on: inv.issued_on || new Date().toISOString().slice(0, 10),
        notes: `Invoice: ${inv.title} (${inv.invoice_number})`,
      }).select("id").single();

      if (newRev?.id) {
        await supabase.from("invoices").update({ revenue_record_id: newRev.id }).eq("id", invoiceId);
      }
    }
  }

  revalidateBilling(clientId ?? undefined);
}

