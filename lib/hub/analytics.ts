import type { Expense, PerformanceEntry, TradingAccount, Withdrawal } from "./types";

export type AccountAnalytics = {
  accountId: string;
  latestBalance: number | null;
  latestEquity: number | null;
  totalSpend: number;
  extractedValue: number;
  totalValue: number | null;
  netReturn: number | null;
  roi: number | null;
};

function latestEntry(entries: PerformanceEntry[]): PerformanceEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1))[0];
}

export function computeAccountAnalytics(
  account: TradingAccount,
  entries: PerformanceEntry[],
  expenses: Expense[],
  withdrawals: Withdrawal[] = []
): AccountAnalytics {
  const isBlown = account.phase === "blown" || account.status === "blown";
  const latest = latestEntry(entries);
  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const extractedValue = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  // If an account is blown, its liquid capital remaining on desk is $0.
  const latestValue = isBlown ? 0 : (latest?.equity ?? latest?.balance ?? null);

  // Total value is what remains liquid (0 if blown) plus what was extracted into cash
  const totalValue =
    latestValue !== null || extractedValue > 0 ? (latestValue ?? 0) + extractedValue : null;

  const netReturn =
    totalValue !== null && account.starting_balance !== null
      ? totalValue - Number(account.starting_balance)
      : null;

  const roi = netReturn !== null && totalSpend > 0 ? netReturn / totalSpend : null;

  return {
    accountId: account.id,
    latestBalance: isBlown ? 0 : (latest?.balance ?? null),
    latestEquity: isBlown ? 0 : (latest?.equity ?? null),
    totalSpend,
    extractedValue,
    totalValue,
    netReturn,
    roi,
  };
}

export function computePortfolioTotals(analytics: AccountAnalytics[]) {
  const totalSpend = analytics.reduce((sum, a) => sum + a.totalSpend, 0);
  const totalExtracted = analytics.reduce((sum, a) => sum + a.extractedValue, 0);
  const totalValue = analytics.reduce((sum, a) => sum + (a.totalValue ?? 0), 0);
  const totalReturn = analytics.reduce((sum, a) => sum + (a.netReturn ?? 0), 0);
  const roi = totalSpend > 0 ? totalReturn / totalSpend : null;
  return { totalSpend, totalExtracted, totalValue, totalReturn, roi };
}

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export type TradingDeskAccounting = {
  totalGrossPayouts: number;
  totalChallengeFeesPaid: number;
  feeRefundsRecovered: number;
  unrecoveredRiskCapital: number;
  netPortfolioCashProfit: number;
  truePortfolioRoi: number | null;
  activeChallengeCount: number;
  activeFundedCount: number;
};

export function computeTradingDeskAccounting(
  accounts: TradingAccount[],
  expenses: Expense[],
  withdrawals: Withdrawal[]
): TradingDeskAccounting {
  const totalGrossPayouts = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  const challengeExpenses = expenses
    .filter((e) => e.category === "prop_fee")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const accountChallengeCosts = accounts.reduce(
    (sum, a) => sum + Number(a.challenge_cost ?? 0),
    0
  );
  const totalChallengeFeesPaid = Math.max(challengeExpenses, accountChallengeCosts);

  const feeRefundsRecovered = accounts
    .filter((a) => a.fee_refunded)
    .reduce((sum, a) => sum + Number(a.challenge_cost ?? 0), 0);

  const unrecoveredRiskCapital = Math.max(0, totalChallengeFeesPaid - feeRefundsRecovered);
  const netPortfolioCashProfit = totalGrossPayouts - unrecoveredRiskCapital;

  const truePortfolioRoi =
    totalChallengeFeesPaid > 0 ? netPortfolioCashProfit / totalChallengeFeesPaid : null;

  const activeChallengeCount = accounts.filter(
    (a) =>
      a.account_type === "challenge" &&
      a.phase !== "blown" &&
      a.status !== "blown" &&
      a.status !== "inactive"
  ).length;

  const activeFundedCount = accounts.filter(
    (a) =>
      (a.account_type === "funded" || a.account_type === "live") &&
      a.phase !== "blown" &&
      a.status !== "blown" &&
      a.status !== "inactive"
  ).length;

  return {
    totalGrossPayouts,
    totalChallengeFeesPaid,
    feeRefundsRecovered,
    unrecoveredRiskCapital,
    netPortfolioCashProfit,
    truePortfolioRoi,
    activeChallengeCount,
    activeFundedCount,
  };
}


