"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS is the authoritative gate on every one of these (all require
// jwt_role() = 'internal' for writes) — a client-role session gets
// rejected at the database, not just hidden in the UI.

export async function updateClientAction(formData: FormData) {
  const supabase = createClient();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const contactEmail = String(formData.get("contact_email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  await supabase
    .from("clients")
    .update({ name, contact_email: contactEmail, phone, notes })
    .eq("id", id);

  revalidatePath(`/hub/clients/${id}`);
  revalidatePath("/hub/clients");
}

export async function addWithdrawalAction(formData: FormData) {
  const supabase = createClient();

  const accountId = String(formData.get("account_id") || "");
  const withdrawnOn = String(formData.get("withdrawn_on") || "");
  const amountRaw = formData.get("amount");
  if (!accountId || !withdrawnOn || !amountRaw) return;

  const notes = String(formData.get("notes") || "").trim() || null;
  const clientId = String(formData.get("client_id") || "");

  await supabase.from("withdrawals").insert({
    account_id: accountId,
    amount: Number(amountRaw),
    withdrawn_on: withdrawnOn,
    notes,
  });

  if (clientId) revalidatePath(`/hub/clients/${clientId}`);
  revalidatePath("/hub/trading");
}

export async function uploadDocumentAction(formData: FormData) {
  const supabase = createClient();

  const clientId = String(formData.get("client_id") || "");
  const label = String(formData.get("label") || "").trim();
  const file = formData.get("file");

  if (!clientId || !label || !(file instanceof File) || file.size === 0) return;

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("client-documents")
    .upload(path, file, { contentType: file.type || undefined });

  if (uploadError) {
    console.error("Document upload failed:", uploadError.message);
    return;
  }

  await supabase.from("documents").insert({
    client_id: clientId,
    storage_path: path,
    label,
  });

  revalidatePath(`/hub/clients/${clientId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const supabase = createClient();

  const id = String(formData.get("id") || "");
  const storagePath = String(formData.get("storage_path") || "");
  const clientId = String(formData.get("client_id") || "");
  if (!id || !storagePath) return;

  await supabase.storage.from("client-documents").remove([storagePath]);
  await supabase.from("documents").delete().eq("id", id);

  if (clientId) revalidatePath(`/hub/clients/${clientId}`);
}
