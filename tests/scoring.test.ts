import test from "node:test";
import assert from "node:assert/strict";
import { computeResult } from "@/lib/scoring";
import { questions, isScored } from "@/lib/diagnosticData";

test("Scoring Core: computes perfect score when all answers are 100", () => {
  const scoredQs = questions.filter(isScored);
  const answers: Record<string, number> = {};
  for (const q of scoredQs) {
    answers[q.id] = 100;
  }

  const result = computeResult(answers);
  assert.equal(result.score, 100);
  assert.equal(result.dimensionScores.length, scoredQs.length);
  assert.equal(result.strongest.score, 100);
  assert.equal(result.weakest.score, 100);
  assert.ok(result.recommendation.length > 0);
  assert.ok(result.recommendedCapabilitySlug.length > 0);
});

test("Scoring Core: computes zero score when all answers are 0", () => {
  const scoredQs = questions.filter(isScored);
  const answers: Record<string, number> = {};
  for (const q of scoredQs) {
    answers[q.id] = 0;
  }

  const result = computeResult(answers);
  assert.equal(result.score, 0);
  assert.equal(result.strongest.score, 0);
  assert.equal(result.weakest.score, 0);
});

test("Scoring Core: handles empty answers without NaN or throw", () => {
  const result = computeResult({});
  assert.equal(typeof result.score, "number");
  assert.ok(!Number.isNaN(result.score));
  assert.equal(result.score, 0);
  assert.ok(result.strongest);
  assert.ok(result.weakest);
});

test("Scoring Core: safely sanitizes non-numeric and out-of-bounds input", () => {
  const answers = {
    strategy: "invalid-string",
    operations: 150,
    automation: -20,
    data: "75",
  };

  const result = computeResult(answers as unknown as Record<string, number>);
  assert.ok(!Number.isNaN(result.score));
  assert.ok(result.score >= 0 && result.score <= 100);

  const opScore = result.dimensionScores.find((d) => d.key === "operations");
  assert.equal(opScore?.score, 100); // Clamped to 100

  const autoScore = result.dimensionScores.find((d) => d.key === "automation");
  assert.equal(autoScore?.score, 0); // Clamped to 0

  const dataScore = result.dimensionScores.find((d) => d.key === "data");
  assert.equal(dataScore?.score, 75); // Parsed cleanly from string
});

test("Scoring Core: correctly identifies strongest and weakest dimensions", () => {
  const answers = {
    strategy: 90,
    operations: 40,
    automation: 60,
    data: 30,
    alignment: 80,
    adaptability: 50,
  };

  const result = computeResult(answers);
  assert.equal(result.strongest.key, "strategy");
  assert.equal(result.strongest.score, 90);
  assert.equal(result.weakest.key, "data");
  assert.equal(result.weakest.score, 30);
  assert.equal(result.recommendedCapabilitySlug, "data-decision-intelligence");
});

test("Scoring Core: extracts context labels for constraint and 90-day priority", () => {
  const answers = {
    constraint: "business-systems-operations",
    "priority-90": "ai-automation",
  };

  const result = computeResult(answers);
  assert.ok(result.statedConstraintLabel !== undefined);
  assert.ok(result.statedConstraintLabel?.includes("Operations"));
  assert.ok(result.stated90DayLabel !== undefined);
  assert.ok(result.stated90DayLabel?.includes("Technology"));
});

test("Scoring Core: handles 100 concurrent score evaluations stably", async () => {
  const promises = Array.from({ length: 100 }, (_, i) => {
    return Promise.resolve().then(() => {
      const scoreVal = i % 101;
      return computeResult({
        strategy: scoreVal,
        operations: scoreVal,
        automation: scoreVal,
        data: scoreVal,
        alignment: scoreVal,
        adaptability: scoreVal,
      });
    });
  });

  const results = await Promise.all(promises);
  assert.equal(results.length, 100);
  for (let i = 0; i < 100; i++) {
    assert.equal(results[i].score, i % 101);
  }
});
