"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createLeadAction(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!name || !email) return;

  const company = String(formData.get("company") || "").trim() || null;
  const source = String(formData.get("source") || "manual").trim();
  const message = String(formData.get("message") || "").trim() || null;
  const scoreRaw = formData.get("diagnostic_score");
  const diagnosticScore = scoreRaw ? Number(scoreRaw) : null;

  await supabase.from("leads").insert({
    name,
    email,
    company,
    source,
    message,
    diagnostic_score: diagnosticScore,
  });

  revalidatePath("/hub/leads");
  revalidatePath("/hub/crm");
  revalidatePath("/hub/dashboard");
}

export async function convertLeadToClientAction(formData: FormData) {
  const supabase = await createClient();

  const leadId = String(formData.get("lead_id") || "");
  if (!leadId) return;

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return;

  const clientName = lead.company ? `${lead.company} (${lead.name})` : lead.name;

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: clientName,
      contact_email: lead.email,
      notes: `Converted from lead. Source: ${lead.source || "inbound"}. Initial message: ${lead.message || "None"}. Diagnostic score: ${lead.diagnostic_score ?? "N/A"}.`,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error converting lead to client:", error.message);
    return;
  }

  revalidatePath("/hub/leads");
  revalidatePath("/hub/clients");
  revalidatePath("/hub/crm");
  revalidatePath("/hub/dashboard");

  if (client?.id) {
    redirect(`/hub/clients/${client.id}`);
  }
}
