import { questions, dimensionLabels, isScored, type DimensionKey } from "./diagnosticData";

export type Answers = Record<string, string | number>;

const dimensionRecommendations: Record<DimensionKey, string> = {
  strategy:
    "Start by clarifying strategy and positioning — a one-sentence answer to 'what are we optimizing for' that the whole company can repeat.",
  operations:
    "Start by mapping where operational time actually goes, then redesign ownership around the biggest leak.",
  automation:
    "Start by automating your highest-friction manual workflow — it compounds fastest into time saved elsewhere.",
  data:
    "Start by narrowing to the 5 metrics that actually drive decisions, and build trust in those first.",
  alignment:
    "Start by re-aligning team goals and execution to the same operating rhythm and shared metrics.",
  adaptability:
    "Start by building a lightweight review cadence so the business can re-bend as the market shifts.",
};

const dimensionToCapabilitySlug: Record<DimensionKey, string> = {
  strategy: "strategy-positioning",
  operations: "business-systems-operations",
  automation: "ai-automation",
  data: "data-decision-intelligence",
  alignment: "business-systems-operations",
  adaptability: "growth-market-expansion",
};

export type DimensionScore = { key: DimensionKey; label: string; score: number };

export type DiagnosticResult = {
  score: number;
  dimensionScores: DimensionScore[];
  strongest: DimensionScore;
  weakest: DimensionScore;
  recommendation: string;
  recommendedCapabilitySlug: string;
  statedConstraintLabel?: string;
  stated90DayLabel?: string;
};

export function computeResult(answers: Answers = {}): DiagnosticResult {
  const scoredQuestions = questions.filter(isScored);

  const dimensionScores: DimensionScore[] = scoredQuestions.map((q) => {
    const raw = Number(answers?.[q.id] ?? answers?.[q.dimension]);
    const score = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;
    return {
      key: q.dimension,
      label: dimensionLabels[q.dimension] ?? q.dimension,
      score,
    };
  });

  const totalScore = dimensionScores.reduce((sum, d) => sum + d.score, 0);
  const score = dimensionScores.length > 0 ? Math.round(totalScore / dimensionScores.length) : 0;

  const sorted = [...dimensionScores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0] ?? {
    key: "strategy" as DimensionKey,
    label: dimensionLabels.strategy,
    score: 0,
  };
  const weakest = sorted[sorted.length - 1] ?? strongest;

  const constraintQuestion = questions.find((q) => q.id === "constraint");
  const priorityQuestion = questions.find((q) => q.id === "priority-90");

  const statedConstraintLabel =
    constraintQuestion?.type === "context"
      ? constraintQuestion.options.find((o) => o.value === answers?.["constraint"])?.label
      : undefined;

  const stated90DayLabel =
    priorityQuestion?.type === "context"
      ? priorityQuestion.options.find((o) => o.value === answers?.["priority-90"])?.label
      : undefined;

  return {
    score,
    dimensionScores,
    strongest,
    weakest,
    recommendation:
      dimensionRecommendations[weakest.key] ??
      "Start by diagnosing the core constraint in your operating systems.",
    recommendedCapabilitySlug:
      dimensionToCapabilitySlug[weakest.key] ?? "strategy-positioning",
    statedConstraintLabel,
    stated90DayLabel,
  };
}
