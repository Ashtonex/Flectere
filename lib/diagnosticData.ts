export type DimensionKey =
  | "strategy"
  | "operations"
  | "automation"
  | "data"
  | "alignment"
  | "adaptability";

export const dimensionLabels: Record<DimensionKey, string> = {
  strategy: "Strategic Clarity",
  operations: "Operational Efficiency",
  automation: "Automation & Systems",
  data: "Data Confidence",
  alignment: "Team Alignment",
  adaptability: "Adaptability",
};

export type ScoredOption = { label: string; value: number };
export type ScoredQuestion = {
  id: string;
  type: "scored";
  dimension: DimensionKey;
  question: string;
  options: ScoredOption[];
};

export type ContextOption = { label: string; value: string };
export type ContextQuestion = {
  id: string;
  type: "context";
  question: string;
  options: ContextOption[];
};

export type Question = ScoredQuestion | ContextQuestion;

export function isScored(q: Question): q is ScoredQuestion {
  return q.type === "scored";
}

const constraintOptions: ContextOption[] = [
  { label: "Strategy — we're not sure what we're optimizing for", value: "strategy-positioning" },
  { label: "Operations — the business is hard to run day to day", value: "business-systems-operations" },
  { label: "Technology — manual work and disconnected tools", value: "ai-automation" },
  { label: "Growth — we've plateaued and aren't sure why", value: "growth-market-expansion" },
  { label: "Data — we can't fully trust the numbers", value: "data-decision-intelligence" },
  { label: "Brand — we don't stand out or convert well", value: "brand-customer-experience" },
];

export const questions: Question[] = [
  {
    id: "constraint",
    type: "context",
    question: "What is your biggest business constraint?",
    options: constraintOptions,
  },
  {
    id: "time-waste",
    type: "scored",
    dimension: "operations",
    question: "Where is the most time being wasted?",
    options: [
      { label: "Repetitive manual tasks", value: 30 },
      { label: "Unclear decisions and approvals", value: 45 },
      { label: "Duplicate work spread across tools", value: 55 },
      { label: "Honestly, not much — we run lean", value: 90 },
    ],
  },
  {
    id: "strategy-clarity",
    type: "scored",
    dimension: "strategy",
    question: "How clear is your growth strategy?",
    options: [
      { label: "We don't have one written down", value: 20 },
      { label: "It exists but isn't shared widely", value: 45 },
      { label: "Mostly clear, not fully aligned", value: 70 },
      { label: "Crystal clear and shared company-wide", value: 95 },
    ],
  },
  {
    id: "manual-ops",
    type: "scored",
    dimension: "automation",
    question: "How much of your operation is still manual?",
    options: [
      { label: "Almost everything", value: 20 },
      { label: "More than half", value: 40 },
      { label: "Some key workflows are automated", value: 65 },
      { label: "Automation runs most of the business", value: 92 },
    ],
  },
  {
    id: "data-confidence",
    type: "scored",
    dimension: "data",
    question: "How confident are you in your data?",
    options: [
      { label: "Not confident — mostly guesswork", value: 20 },
      { label: "Somewhat — we double-check everything", value: 45 },
      { label: "Fairly confident in most reports", value: 70 },
      { label: "Fully confident — data drives every call", value: 95 },
    ],
  },
  {
    id: "alignment",
    type: "scored",
    dimension: "alignment",
    question: "How aligned are your team and systems?",
    options: [
      { label: "Everyone's rowing in different directions", value: 20 },
      { label: "Aligned on goals, not on execution", value: 45 },
      { label: "Mostly aligned, with some friction", value: 70 },
      { label: "Fully aligned — systems reinforce it", value: 95 },
    ],
  },
  {
    id: "priority-90",
    type: "context",
    question: "What would you fix first in the next 90 days?",
    options: constraintOptions,
  },
  {
    id: "adaptability",
    type: "scored",
    dimension: "adaptability",
    question: "How fast can your business adapt to change?",
    options: [
      { label: "Slowly — change takes months to land", value: 20 },
      { label: "We manage, but it's painful", value: 45 },
      { label: "Reasonably fast when we need to", value: 70 },
      { label: "Fast — we treat adaptability as an advantage", value: 95 },
    ],
  },
];
