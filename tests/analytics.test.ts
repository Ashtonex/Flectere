import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAccountAnalytics,
  computePortfolioTotals,
  computeTradingDeskAccounting,
  formatCurrency,
  formatPercent,
} from "@/lib/hub/analytics";
import {
  parsePayoutAllocation,
  formatPayoutAllocation,
  type Expense,
  type PerformanceEntry,
  type TradingAccount,
  type Withdrawal,
} from "@/lib/hub/types";


const mockAccount: TradingAccount = {
  id: "acc-1",
  client_id: "client-1",
  label: "Prop Challenge 100k",
  broker_or_prop_firm: "FTMO",
  account_type: "challenge",
  starting_balance: 100000,
  status: "active",
  created_at: new Date().toISOString(),
};

test("Analytics Core: computeAccountAnalytics with empty history", () => {
  const analytics = computeAccountAnalytics(mockAccount, [], []);
  assert.equal(analytics.accountId, "acc-1");
  assert.equal(analytics.latestBalance, null);
  assert.equal(analytics.latestEquity, null);
  assert.equal(analytics.totalSpend, 0);
  assert.equal(analytics.extractedValue, 0);
  assert.equal(analytics.totalValue, null);
  assert.equal(analytics.netReturn, null);
  assert.equal(analytics.roi, null);
});

test("Analytics Core: computeAccountAnalytics with entries and expenses", () => {
  const entries: PerformanceEntry[] = [
    {
      id: "e-1",
      account_id: "acc-1",
      entry_date: "2026-08-01",
      balance: 102000,
      equity: 103500,
      pnl: 3500,
      source: "manual",
      notes: null,
      created_at: "2026-08-01T00:00:00Z",
    },
    {
      id: "e-2",
      account_id: "acc-1",
      entry_date: "2026-08-15",
      balance: 106000,
      equity: 108000,
      pnl: 4500,
      source: "manual",
      notes: null,
      created_at: "2026-08-15T00:00:00Z",
    },
  ];

  const expenses: Expense[] = [
    {
      id: "exp-1",
      account_id: "acc-1",
      category: "prop_fee",
      amount: 540,
      currency: "USD",
      incurred_on: "2026-07-25",
      notes: null,
      created_at: "2026-07-25T00:00:00Z",
    },
  ];

  const withdrawals: Withdrawal[] = [
    {
      id: "w-1",
      account_id: "acc-1",
      amount: 4000,
      withdrawn_on: "2026-08-20",
      notes: "First payout",
      created_at: "2026-08-20T00:00:00Z",
    },
  ];

  const analytics = computeAccountAnalytics(mockAccount, entries, expenses, withdrawals);
  assert.equal(analytics.latestEquity, 108000);
  assert.equal(analytics.latestBalance, 106000);
  assert.equal(analytics.totalSpend, 540);
  assert.equal(analytics.extractedValue, 4000);
  // Total value = latest equity (108000) + extracted (4000) = 112000
  assert.equal(analytics.totalValue, 112000);
  // Net return = 112000 - 100000 = 12000
  assert.equal(analytics.netReturn, 12000);
  // ROI = 12000 / 540 = 22.2222...
  assert.ok(analytics.roi !== null && analytics.roi > 22);
});

test("Analytics Core: computePortfolioTotals aggregates multiple accounts safely", () => {
  const a1 = computeAccountAnalytics(mockAccount, [], []);
  const a2 = {
    accountId: "acc-2",
    latestBalance: 50000,
    latestEquity: 55000,
    totalSpend: 1000,
    extractedValue: 2000,
    totalValue: 57000,
    netReturn: 7000,
    roi: 7,
  };

  const totals = computePortfolioTotals([a1, a2]);
  assert.equal(totals.totalSpend, 1000);
  assert.equal(totals.totalExtracted, 2000);
  assert.equal(totals.totalValue, 57000);
  assert.equal(totals.totalReturn, 7000);
  assert.equal(totals.roi, 7);
});

test("Analytics Core: computeTradingDeskAccounting calculates net cash and ROI correctly", () => {
  const accounts: TradingAccount[] = [
    {
      ...mockAccount,
      id: "acc-funded",
      account_type: "funded",
      challenge_cost: 500,
      fee_refunded: true,
      status: "active",
    },
    {
      ...mockAccount,
      id: "acc-challenge",
      account_type: "challenge",
      challenge_cost: 500,
      fee_refunded: false,
      status: "active",
    },
  ];

  const withdrawals: Withdrawal[] = [
    {
      id: "w-1",
      account_id: "acc-funded",
      amount: 6500,
      withdrawn_on: "2026-08-25",
      notes: null,
      created_at: "2026-08-25T00:00:00Z",
    },
  ];

  const expenses: Expense[] = [
    {
      id: "e-1",
      account_id: "acc-funded",
      category: "prop_fee",
      amount: 500,
      currency: "USD",
      incurred_on: "2026-07-01",
      notes: null,
      created_at: "2026-07-01T00:00:00Z",
    },
    {
      id: "e-2",
      account_id: "acc-challenge",
      category: "prop_fee",
      amount: 500,
      currency: "USD",
      incurred_on: "2026-07-15",
      notes: null,
      created_at: "2026-07-15T00:00:00Z",
    },
  ];

  const desk = computeTradingDeskAccounting(accounts, expenses, withdrawals);
  assert.equal(desk.totalGrossPayouts, 6500);
  assert.equal(desk.totalChallengeFeesPaid, 1000);
  assert.equal(desk.feeRefundsRecovered, 500);
  assert.equal(desk.unrecoveredRiskCapital, 500);
  assert.equal(desk.netPortfolioCashProfit, 6000); // 6500 - 500
  assert.equal(desk.truePortfolioRoi, 6); // 6000 / 1000 = 600% ROI
  assert.equal(desk.activeChallengeCount, 1);
  assert.equal(desk.activeFundedCount, 1);
});

test("Analytics Core: formatCurrency and formatPercent handle all edge cases safely", () => {
  assert.equal(formatCurrency(null), "—");
  assert.equal(formatCurrency(undefined), "—");
  assert.equal(formatCurrency(NaN), "—");
  assert.equal(formatCurrency(Infinity), "—");
  assert.equal(formatCurrency(0), "$0.00");
  assert.equal(formatCurrency(1500), "$1,500.00");
  assert.equal(formatCurrency(-250), "-$250.00");

  assert.equal(formatPercent(null), "—");
  assert.equal(formatPercent(undefined), "—");
  assert.equal(formatPercent(NaN), "—");
  assert.equal(formatPercent(0), "0.0%");
  assert.equal(formatPercent(0.245), "24.5%");
  assert.equal(formatPercent(1.5), "150.0%");
});

test("Analytics Core: blown account liquid capital is zeroed while accounting remains accurate", () => {
  const blownAccount: TradingAccount = {
    ...mockAccount,
    id: "acc-blown",
    phase: "blown",
    status: "blown",
    starting_balance: 100000,
  };

  const entries: PerformanceEntry[] = [
    {
      id: "e-b",
      account_id: "acc-blown",
      entry_date: "2026-09-01",
      balance: 89000,
      equity: 88500,
      pnl: -11500,
      source: "manual",
      notes: null,
      created_at: "2026-09-01T00:00:00Z",
    },
  ];

  const analytics = computeAccountAnalytics(blownAccount, entries, [], []);
  // Liquid figures MUST be 0 because it is blown
  assert.equal(analytics.latestEquity, 0);
  assert.equal(analytics.latestBalance, 0);
  assert.equal(analytics.totalValue, 0);

  // Accounting counts
  const accounting = computeTradingDeskAccounting([blownAccount], [], []);
  assert.equal(accounting.activeChallengeCount, 0);
  assert.equal(accounting.activeFundedCount, 0);
});

test("Analytics Core: parsePayoutAllocation and formatPayoutAllocation handle splits roundtrip", () => {
  const alloc = {
    treasury: 4000,
    reinvestment: 2000,
    founder_draw: 3000,
    tax_reserve: 1000,
  };

  const formatted = formatPayoutAllocation(alloc, "Deel wire transfer ref #8921");
  assert.ok(formatted.includes("ALLOCATION_DATA"));
  assert.ok(formatted.includes("Treasury $4,000"));
  assert.ok(formatted.includes("Deel wire transfer"));

  const parsed = parsePayoutAllocation(formatted);
  assert.ok(parsed !== null);
  assert.equal(parsed?.allocation.treasury, 4000);
  assert.equal(parsed?.allocation.reinvestment, 2000);
  assert.equal(parsed?.allocation.founder_draw, 3000);
  assert.equal(parsed?.allocation.tax_reserve, 1000);
});


