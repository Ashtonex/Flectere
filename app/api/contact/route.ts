import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
  diagnosticScore?: string;
  diagnosticFocus?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ContactPayload>;

  if (!body.name || !body.email || !body.message) {
    return NextResponse.json(
      { ok: false, error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  console.log("New Flectēre contact submission:", body);

  // Persists into the hub's `leads` table (visible at /hub/leads) via the
  // service-role client — this route is hit by anonymous site visitors,
  // not an authenticated hub session, and `leads` intentionally has no
  // anon-write RLS policy, so a normal client here would be rejected.
  //
  // Guarded on env vars being present so the public contact form keeps
  // working even before a Supabase project is connected.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();
      const isDiagnostic = body.source === "diagnostic";
      await supabase.from("leads").insert({
        source: isDiagnostic ? "diagnostic" : "contact",
        name: body.name,
        email: body.email,
        company: body.company || null,
        message: body.message,
        diagnostic_score: body.diagnosticScore ? Number(body.diagnosticScore) : null,
        diagnostic_focus: body.diagnosticFocus || null,
      });
    } catch (err) {
      console.error("Failed to persist contact lead to Supabase:", err);
    }
  }

  // --- Further backend integration points ---
  // Also wire in an email provider (Resend, SendGrid, Postmark) or CRM
  // (HubSpot, Salesforce) here if you want notifications beyond the hub:
  //
  //   await resend.emails.send({ to: "hello@flectere.com", ... })
  //   await fetch("https://api.hubapi.com/crm/v3/objects/contacts", { ... })

  return NextResponse.json({ ok: true });
}
