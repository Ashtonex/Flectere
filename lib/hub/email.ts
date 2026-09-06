type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendEmailResult =
  | { status: "sent"; provider: "resend"; providerMessageId: string | null }
  | { status: "failed"; provider: "resend" | null; error: string };

const resendEndpoint = "https://api.resend.com/emails";

export function canSendEmail() {
  return Boolean(process.env.RESEND_API_KEY && process.env.FLECTERE_EMAIL_FROM);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FLECTERE_EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      status: "failed",
      provider: null,
      error: "Email is not configured. Set RESEND_API_KEY and FLECTERE_EMAIL_FROM.",
    };
  }

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: string }
    | null;

  if (!response.ok) {
    return {
      status: "failed",
      provider: "resend",
      error: payload?.message ?? payload?.error ?? "Resend rejected the email request.",
    };
  }

  return {
    status: "sent",
    provider: "resend",
    providerMessageId: payload?.id ?? null,
  };
}
