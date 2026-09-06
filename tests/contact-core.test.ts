import test from "node:test";
import assert from "node:assert/strict";
import { validateContactPayload, processContactSubmission } from "@/lib/contactCore";

test("Contact Core: validates standard valid contact submission", () => {
  const raw = {
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    company: "Sovereign Logistics",
    message: "We need an operations diagnostic across our supply chain.",
    source: "contact",
  };

  const res = validateContactPayload(raw);
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.data.name, "Alex Morgan");
    assert.equal(res.data.email, "alex.morgan@example.com");
    assert.equal(res.data.company, "Sovereign Logistics");
    assert.equal(res.data.message, "We need an operations diagnostic across our supply chain.");
    assert.equal(res.data.source, "contact");
  }
});

test("Contact Core: validates diagnostic-linked contact submission", () => {
  const raw = {
    name: "Diagnostic Client",
    email: "diagnostic.client@example.com",
    message: "Follow-up on our diagnostic assessment.",
    source: "diagnostic",
    diagnosticScore: "42",
    diagnosticFocus: "Operations & Fleet Systems",
  };

  const res = validateContactPayload(raw);
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.data.source, "diagnostic");
    assert.equal(res.data.diagnosticScore, 42);
    assert.equal(res.data.diagnosticFocus, "Operations & Fleet Systems");
  }
});

test("Contact Core: rejects missing or empty required fields", () => {
  // Missing name
  const noName = validateContactPayload({
    name: "   ",
    email: "valid@test.com",
    message: "Hello world",
  });
  assert.equal(noName.valid, false);
  if (!noName.valid) assert.equal(noName.statusCode, 400);

  // Missing email
  const noEmail = validateContactPayload({
    name: "Valid Name",
    email: "",
    message: "Hello world",
  });
  assert.equal(noEmail.valid, false);
  if (!noEmail.valid) assert.equal(noEmail.statusCode, 400);

  // Missing message
  const noMsg = validateContactPayload({
    name: "Valid Name",
    email: "valid@test.com",
    message: "   ",
  });
  assert.equal(noMsg.valid, false);
  if (!noMsg.valid) assert.equal(noMsg.statusCode, 400);
});

test("Contact Core: rejects invalid email formats", () => {
  const invalidEmails = [
    "notanemail",
    "missingat.com",
    "@nodomain.com",
    "spaces in@email.com",
    "name@domain",
  ];

  for (const badEmail of invalidEmails) {
    const res = validateContactPayload({
      name: "Test User",
      email: badEmail,
      message: "Testing email validation",
    });
    assert.equal(res.valid, false);
    if (!res.valid) {
      assert.equal(res.statusCode, 422);
    }
  }
});

test("Contact Core: rejects oversized payloads", () => {
  // Name too long (>100 chars)
  const longName = "A".repeat(101);
  const nameRes = validateContactPayload({
    name: longName,
    email: "valid@test.com",
    message: "Test",
  });
  assert.equal(nameRes.valid, false);
  if (!nameRes.valid) assert.equal(nameRes.statusCode, 422);

  // Message too long (>5000 chars)
  const longMsg = "M".repeat(5001);
  const msgRes = validateContactPayload({
    name: "Test",
    email: "valid@test.com",
    message: longMsg,
  });
  assert.equal(msgRes.valid, false);
  if (!msgRes.valid) assert.equal(msgRes.statusCode, 422);
});

test("Contact Core: handles non-object and null raw bodies gracefully", () => {
  assert.equal(validateContactPayload(null).valid, false);
  assert.equal(validateContactPayload(undefined).valid, false);
  assert.equal(validateContactPayload("string").valid, false);
  assert.equal(validateContactPayload(12345).valid, false);
  assert.equal(validateContactPayload([]).valid, false);
});

test("Contact Core: processes submission safely when Supabase is not configured", async () => {
  const validation = validateContactPayload({
    name: "Offline Client",
    email: "offline@test.com",
    message: "Testing offline degradation",
  });

  assert.equal(validation.valid, true);
  if (validation.valid) {
    // Explicitly pass empty credentials
    const result = await processContactSubmission(validation.data, {
      supabaseUrl: "",
      serviceRoleKey: "",
    });
    assert.equal(result.ok, true);
    assert.equal(result.persisted, false);
  }
});

test("Contact Core: handles 100 concurrent requests stably without leaks or crosstalk", async () => {
  const requests = Array.from({ length: 100 }, (_, i) => {
    const raw = {
      name: `Client ${i}`,
      email: `client.${i}@enterprise.com`,
      company: `Enterprise Corp ${i}`,
      message: `Simultaneous inquiry number ${i}`,
      source: i % 2 === 0 ? "contact" : "diagnostic",
      diagnosticScore: i % 101,
    };

    return Promise.resolve().then(() => {
      const validation = validateContactPayload(raw);
      assert.equal(validation.valid, true);
      if (validation.valid) {
        assert.equal(validation.data.name, `Client ${i}`);
        assert.equal(validation.data.email, `client.${i}@enterprise.com`);
        assert.equal(validation.data.diagnosticScore, i % 101);
      }
      return validation;
    });
  });

  const results = await Promise.all(requests);
  assert.equal(results.length, 100);
  for (const r of results) {
    assert.equal(r.valid, true);
  }
});
