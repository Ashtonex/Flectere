import { createAdminClient } from "@/lib/supabase/server";

export type RawContactPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  source?: unknown;
  diagnosticScore?: unknown;
  diagnosticFocus?: unknown;
};

export type ValidatedContactSubmission = {
  name: string;
  email: string;
  message: string;
  company: string | null;
  source: string;
  diagnosticScore: number | null;
  diagnosticFocus: string | null;
};

export type ValidationResult =
  | { valid: true; data: ValidatedContactSubmission }
  | { valid: false; error: string; statusCode: 400 | 422 };

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateContactPayload(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      valid: false,
      error: "Invalid request body: expected a JSON object.",
      statusCode: 400,
    };
  }

  const input = raw as RawContactPayload;

  // Name validation
  if (typeof input.name !== "string" || !input.name.trim()) {
    return {
      valid: false,
      error: "Name is required and cannot be blank.",
      statusCode: 400,
    };
  }
  const name = input.name.trim();
  if (name.length > 100) {
    return {
      valid: false,
      error: "Name cannot exceed 100 characters.",
      statusCode: 422,
    };
  }

  // Email validation
  if (typeof input.email !== "string" || !input.email.trim()) {
    return {
      valid: false,
      error: "Email is required and cannot be blank.",
      statusCode: 400,
    };
  }
  const email = input.email.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      error: "Please provide a valid email address.",
      statusCode: 422,
    };
  }

  // Message validation
  if (typeof input.message !== "string" || !input.message.trim()) {
    return {
      valid: false,
      error: "Message is required and cannot be blank.",
      statusCode: 400,
    };
  }
  const message = input.message.trim();
  if (message.length > 5000) {
    return {
      valid: false,
      error: "Message cannot exceed 5,000 characters.",
      statusCode: 422,
    };
  }

  // Optional company
  let company: string | null = null;
  if (typeof input.company === "string" && input.company.trim()) {
    company = input.company.trim().slice(0, 200);
  }

  // Optional source
  let source = "contact";
  if (typeof input.source === "string" && input.source.trim()) {
    source = input.source.trim().slice(0, 50);
  }

  // Optional diagnosticScore
  let diagnosticScore: number | null = null;
  if (input.diagnosticScore !== undefined && input.diagnosticScore !== null && input.diagnosticScore !== "") {
    const parsed = Number(input.diagnosticScore);
    if (Number.isFinite(parsed)) {
      diagnosticScore = Math.min(100, Math.max(0, Math.round(parsed)));
    }
  }

  // Optional diagnosticFocus
  let diagnosticFocus: string | null = null;
  if (typeof input.diagnosticFocus === "string" && input.diagnosticFocus.trim()) {
    diagnosticFocus = input.diagnosticFocus.trim().slice(0, 100);
  }

  return {
    valid: true,
    data: {
      name,
      email,
      message,
      company,
      source,
      diagnosticScore,
      diagnosticFocus,
    },
  };
}

export async function processContactSubmission(
  submission: ValidatedContactSubmission,
  envOverride?: { supabaseUrl?: string; serviceRoleKey?: string }
): Promise<{ ok: boolean; persisted: boolean; error?: string }> {
  const url = envOverride?.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = envOverride?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    try {
      const supabase = createAdminClient();
      const isDiagnostic = submission.source === "diagnostic";
      const { error } = await supabase.from("leads").insert({
        source: isDiagnostic ? "diagnostic" : "contact",
        name: submission.name,
        email: submission.email,
        company: submission.company,
        message: submission.message,
        diagnostic_score: submission.diagnosticScore,
        diagnostic_focus: submission.diagnosticFocus,
      });

      if (error) {
        console.error("Failed to persist contact lead to Supabase:", error.message);
        return { ok: true, persisted: false, error: error.message };
      }

      return { ok: true, persisted: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Exception while persisting contact lead:", errorMsg);
      return { ok: true, persisted: false, error: errorMsg };
    }
  }

  return { ok: true, persisted: false };
}
