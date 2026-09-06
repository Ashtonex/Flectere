import { NextResponse } from "next/server";
import { validateContactPayload, processContactSubmission } from "@/lib/contactCore";

export async function POST(request: Request) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed or empty JSON request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const validation = validateContactPayload(rawBody);

  if (!validation.valid) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.statusCode, headers: { "Cache-Control": "no-store" } }
    );
  }

  console.log("New Flectēre contact submission validated:", {
    name: validation.data.name,
    email: validation.data.email,
    source: validation.data.source,
  });

  const result = await processContactSubmission(validation.data);

  return NextResponse.json(
    { ok: true, persisted: result.persisted },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
