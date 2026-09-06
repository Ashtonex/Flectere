"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// RLS is the authoritative gate on every one of these (all require
// jwt_role() = 'internal' for writes) — a client-role session gets
// rejected at the database, not just hidden in the UI.

type JwtClaims = {
  app_metadata?: { role?: string };
};

async function requireInternalUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as JwtClaims | undefined;

  return claims?.app_metadata?.role === "internal";
}

function clientRedirect(clientId: string, status: string): never {
  redirect(`/hub/clients/${clientId}?portal=${encodeURIComponent(status)}`);
}

export async function updateClientAction(formData: FormData) {
  const supabase = await createClient();

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
  const supabase = await createClient();

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
  const supabase = await createClient();

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
    document_type: String(formData.get("document_type") || "general"),
    notes: String(formData.get("notes") || "").trim() || null,
  });

  revalidatePath(`/hub/clients/${clientId}`);
}

export async function deleteDocumentAction(formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const storagePath = String(formData.get("storage_path") || "");
  const clientId = String(formData.get("client_id") || "");
  if (!id || !storagePath) return;

  await supabase.storage.from("client-documents").remove([storagePath]);
  await supabase.from("documents").delete().eq("id", id);

  if (clientId) revalidatePath(`/hub/clients/${clientId}`);
}

export async function createClientPortalLoginAction(formData: FormData) {
  const isInternal = await requireInternalUser();
  const clientId = String(formData.get("client_id") || "");

  if (!isInternal) {
    if (clientId) clientRedirect(clientId, "unauthorized");
    return;
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!clientId || !email || password.length < 8) {
    if (clientId) clientRedirect(clientId, "invalid");
    return;
  }

  const admin = createAdminClient();
  let userId: string | null = null;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role: "client",
      client_id: clientId,
    },
  });

  if (created?.user?.id) {
    userId = created.user.id;
  } else if (createError?.message.toLowerCase().includes("already")) {
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = users.users.find((user) => user.email?.toLowerCase() === email);

    if (existingUser) {
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          app_metadata: {
            ...(existingUser.app_metadata ?? {}),
            role: "client",
            client_id: clientId,
          },
        }
      );

      if (updateError) {
        clientRedirect(clientId, "error");
      }

      if (!updated.user) {
        clientRedirect(clientId, "error");
      }

      userId = updated.user.id;
    }
  }

  if (!userId) {
    clientRedirect(clientId, "error");
  }

  await admin.from("profiles").upsert({
    id: userId,
    role: "client",
    full_name: String(formData.get("full_name") || "").trim() || null,
    client_id: clientId,
  });

  await admin
    .from("clients")
    .update({ contact_email: email })
    .eq("id", clientId)
    .is("contact_email", null);

  revalidatePath(`/hub/clients/${clientId}`);
  revalidatePath("/hub/clients");
  clientRedirect(clientId, "login-ready");
}
