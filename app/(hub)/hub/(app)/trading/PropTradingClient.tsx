"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatPercent } from "@/lib/hub/analytics";
import {
  parsePayoutAllocation,
  formatPayoutAllocation,
  type Expense,
  type PerformanceEntry,
  type TradingAccount,
  type Withdrawal,
  type PayoutAllocation,
  type CapitalSource,
} from "@/lib/hub/types";
import {
  createPropAccountAction,
  updatePropAccountAction,
  deletePropAccountAction,
  addPerformanceEntryAction,
  updatePerformanceEntryAction,
  deletePerformanceEntryAction,
  addPropPayoutAction,
  deletePropPayoutAction,
  addDeskExpenseAction,
  deleteDeskExpenseAction,
  bulkImportPerformanceEntriesAction,
  updatePropPayoutAllocationAction,
} from "./actions";

interface AccountStats {
  account: TradingAccount;
  isBlown: boolean;
  capitalSource: string;
  flectereSeededCost: number;
  returnOnFlectereCapital: number | null;
  latestEquity: number;
  latestBalance: number;
  totalPayouts: number;

  totalFees: number;
  netPnl: number;
  netProfitCash: number;
  payoutRoi: number | null;
  entryCount: number;
  // Prop metrics

  startingBalance: number;
  targetPct: number;
  targetDollar: number;
  profitEarned: number;
  targetProgressPct: number;
  dailyLossLimitDollar: number;
  todayPnl: number;
  dailyBufferDollar: number;
  dailyBufferPct: number;
  maxLossFloor: number;
  overallBufferDollar: number;
  overallBufferPct: number;
  isTargetHit: boolean;
  isDailyBreached: boolean;
  isMaxBreached: boolean;
  winRate: number;
  profitFactor: number;
  bestDay: number;
  worstDay: number;
  avgWin: number;
  avgLoss: number;
}

interface PropTradingClientProps {
  accounts: TradingAccount[];
  entries: PerformanceEntry[];
  expenses: Expense[];
  withdrawals: Withdrawal[];
}

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";
const submitClasses =
  "rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-bright cursor-pointer disabled:opacity-50";

export function PropTradingClient({
  accounts,
  entries,
  expenses,
  withdrawals,
}: PropTradingClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<"performance" | "analytics" | "payouts" | "expenses">("performance");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isAddPayoutOpen, setIsAddPayoutOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSizerOpen, setIsSizerOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [editingEntry, setEditingEntry] = useState<PerformanceEntry | null>(null);
  const [isAllocationsOpen, setIsAllocationsOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Withdrawal | null>(null);
  const [performanceView, setPerformanceView] = useState<"ledger" | "heatmap">("ledger");

  // Payout Allocation input states (for record payout modal)
  const [payoutAmount, setPayoutAmount] = useState<string>("5000");
  const [allocTreasury, setAllocTreasury] = useState<number>(2000);
  const [allocReinvestment, setAllocReinvestment] = useState<number>(1000);
  const [allocFounder, setAllocFounder] = useState<number>(1500);
  const [allocTax, setAllocTax] = useState<number>(500);

  // Edit payout allocation state
  const [editAllocTreasury, setEditAllocTreasury] = useState<number>(0);
  const [editAllocReinvestment, setEditAllocReinvestment] = useState<number>(0);
  const [editAllocFounder, setEditAllocFounder] = useState<number>(0);
  const [editAllocTax, setEditAllocTax] = useState<number>(0);

  // Position Sizing Calculator state
  const [sizerAsset, setSizerAsset] = useState<"forex" | "gold" | "indices" | "crypto">("forex");
  const [sizerStopLoss, setSizerStopLoss] = useState<number>(20);
  const [sizerRiskPct, setSizerRiskPct] = useState<number>(1.0);

  // Quick Log form state
  const [quickEquity, setQuickEquity] = useState<string>("");
  const [quickPnl, setQuickPnl] = useState<string>("");
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [quickNotes, setQuickNotes] = useState<string>("");

  // CSV Import state
  const [csvText, setCsvText] = useState<string>("");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // Hover chart tooltip
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    date: string;
    equity: number;
    balance: number;
    pnl: number;
    x: number;
    y: number;
  } | null>(null);

  const today = new Date().toISOString().slice(0, 10);


  // Compute stats for each individual account
  const accountStats: AccountStats[] = useMemo(() => {
    return accounts.map((account) => {
      const accEntries = entries
        .filter((e) => e.account_id === account.id)
        .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));

      const chronologicalEntries = [...accEntries].sort((a, b) =>
        a.entry_date > b.entry_date ? 1 : -1
      );

      const isBlown = account.phase === "blown" || account.status === "blown";
      const latest = accEntries[0];
      const startingBalance = Number(account.starting_balance ?? 100000);
      const latestEquity = isBlown
        ? 0
        : Number(latest?.equity ?? latest?.balance ?? startingBalance);
      const latestBalance = isBlown
        ? 0
        : Number(latest?.balance ?? startingBalance);

      const accPayouts = withdrawals
        .filter((w) => w.account_id === account.id)
        .reduce((sum, w) => sum + Number(w.amount), 0);

      const accExpenses = expenses
        .filter((e) => e.account_id === account.id)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const cost = Number(account.challenge_cost ?? 0);
      const totalFees = accExpenses > 0 ? accExpenses : cost;

      const netProfitCash = accPayouts - totalFees;
      const payoutRoi = totalFees > 0 ? netProfitCash / totalFees : null;
      const netPnl = latestEquity - startingBalance + accPayouts;

      // Target calculations
      const targetPct =
        account.account_type === "funded"
          ? 0.05
          : account.phase === "phase_2"
          ? 0.05
          : 0.10;
      const targetDollar = startingBalance * targetPct;
      const profitEarned = Math.max(0, latestEquity - startingBalance);
      const targetProgressPct = Math.min(100, Math.max(0, (profitEarned / targetDollar) * 100));

      // Drawdown calculations
      const dailyLossLimitDollar = startingBalance * 0.05; // 5% max daily loss
      const todayPnl = Number(latest?.pnl ?? 0);
      const dailyLossUsed = Math.max(0, -todayPnl);
      const dailyBufferDollar = Math.max(0, dailyLossLimitDollar - dailyLossUsed);
      const dailyBufferPct = (dailyBufferDollar / dailyLossLimitDollar) * 100;

      const maxLossFloor = startingBalance * 0.90; // 10% max total loss limit
      const overallBufferDollar = Math.max(0, latestEquity - maxLossFloor);
      const overallBufferPct = Math.min(
        100,
        Math.max(0, (overallBufferDollar / (startingBalance * 0.10)) * 100)
      );

      const isTargetHit = profitEarned >= targetDollar && account.account_type !== "funded";
      const isDailyBreached = todayPnl < -dailyLossLimitDollar;
      const rawLatestEquity = Number(latest?.equity ?? latest?.balance ?? startingBalance);
      const isMaxBreached = isBlown || rawLatestEquity <= maxLossFloor;

      // Analytics: win rate, profit factor, best/worst
      let winCount = 0;
      let lossCount = 0;
      let totalGains = 0;
      let totalLosses = 0;
      let bestDay = 0;
      let worstDay = 0;

      accEntries.forEach((entry) => {
        const val = Number(entry.pnl ?? 0);
        if (val > 0) {
          winCount++;
          totalGains += val;
          if (val > bestDay) bestDay = val;
        } else if (val < 0) {
          lossCount++;
          totalLosses += Math.abs(val);
          if (val < worstDay) worstDay = val;
        }
      });

      const totalTrades = winCount + lossCount;
      const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
      const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? 99.9 : 0;
      const avgWin = winCount > 0 ? totalGains / winCount : 0;
      const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;

      // Capital source lineage and ROI on corporate funds
      const seedExpense = expenses.find(
        (e) =>
          e.account_id === account.id &&
          (e.notes?.includes("CAPITAL_SOURCE:") || e.category === "prop_fee")
      );
      const sourceMatch = seedExpense?.notes?.match(/\[CAPITAL_SOURCE:(.*?)\]/);
      const capitalSource = (sourceMatch && sourceMatch[1]) || "flectere_treasury";
      const flectereSeededCost = Number(seedExpense?.amount ?? account.challenge_cost ?? 0);
      const returnOnFlectereCapital =
        flectereSeededCost > 0 ? accPayouts / flectereSeededCost : null;

      return {
        account,
        isBlown,
        capitalSource,
        flectereSeededCost,
        returnOnFlectereCapital,
        latestEquity,
        latestBalance,
        totalPayouts: accPayouts,

        totalFees,
        netPnl,
        netProfitCash,
        payoutRoi,
        entryCount: accEntries.length,
        startingBalance,
        targetPct,
        targetDollar,
        profitEarned,
        targetProgressPct,
        dailyLossLimitDollar,
        todayPnl,
        dailyBufferDollar,
        dailyBufferPct,
        maxLossFloor,
        overallBufferDollar,
        overallBufferPct,
        isTargetHit,
        isDailyBreached,
        isMaxBreached,
        winRate,
        profitFactor,
        bestDay,
        worstDay,
        avgWin,
        avgLoss,
      };
    });

  }, [accounts, entries, expenses, withdrawals]);

  // Filtered accounts list
  const filteredAccountStats = useMemo(() => {
    return accountStats.filter((item) => {
      if (filterType !== "all") {
        if (filterType === "blown") {
          if (!item.isBlown) return false;
        } else {
          // If viewing funded, challenge, or live, exclude blown accounts
          if (item.isBlown) return false;
          if (filterType === "funded" && item.account.account_type !== "funded") return false;
          if (filterType === "challenge" && item.account.account_type !== "challenge") return false;
          if (filterType === "live" && item.account.account_type !== "live") return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = item.account.label.toLowerCase().includes(q);
        const matchBroker = (item.account.broker_or_prop_firm ?? "").toLowerCase().includes(q);
        if (!matchLabel && !matchBroker) return false;
      }
      return true;
    });
  }, [accountStats, filterType, searchQuery]);

  const selectedStats = useMemo(() => {
    return (
      accountStats.find((s) => s.account.id === selectedAccountId) ??
      accountStats[0] ??
      null
    );
  }, [accountStats, selectedAccountId]);

  const selectedAccount = selectedStats?.account ?? null;

  // Entries, payouts, and expenses for selected account
  const selectedEntries = useMemo(() => {
    return entries
      .filter((e) => e.account_id === selectedAccountId)
      .sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  }, [entries, selectedAccountId]);

  const chronologicalEntries = useMemo(() => {
    return [...selectedEntries].sort((a, b) =>
      a.entry_date > b.entry_date ? 1 : -1
    );
  }, [selectedEntries]);

  const selectedPayouts = useMemo(() => {
    return withdrawals
      .filter((w) => w.account_id === selectedAccountId)
      .sort((a, b) => (a.withdrawn_on < b.withdrawn_on ? 1 : -1));
  }, [withdrawals, selectedAccountId]);

  const selectedExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.account_id === selectedAccountId)
      .sort((a, b) => (a.incurred_on < b.incurred_on ? 1 : -1));
  }, [expenses, selectedAccountId]);

  // Desk portfolio aggregated metrics (ONLY count active, non-blown accounts for liquid capital)
  const activeAccounts = useMemo(() => accountStats.filter((s) => !s.isBlown), [accountStats]);
  const blownAccounts = useMemo(() => accountStats.filter((s) => s.isBlown), [accountStats]);
  const totalDeskBalance = activeAccounts.reduce((sum, s) => sum + s.latestBalance, 0);
  const totalDeskEquity = activeAccounts.reduce((sum, s) => sum + s.latestEquity, 0);
  const totalDeskPayouts = accountStats.reduce((sum, s) => sum + s.totalPayouts, 0);
  const totalDeskFees = accountStats.reduce((sum, s) => sum + s.totalFees, 0);
  const netDeskCash = totalDeskPayouts - totalDeskFees;

  // Firm allocation breakdown
  const firmAllocations = useMemo(() => {
    const map = new Map<string, { firm: string; totalCapital: number; count: number; fundedCapital: number; blownCount: number }>();
    accountStats.forEach((s) => {
      const firm = s.account.broker_or_prop_firm || "Personal Capital";
      const existing = map.get(firm) || { firm, totalCapital: 0, count: 0, fundedCapital: 0, blownCount: 0 };
      existing.count += 1;
      if (s.isBlown) {
        existing.blownCount += 1;
      } else {
        existing.totalCapital += s.startingBalance;
        if (s.account.account_type === "funded") {
          existing.fundedCapital += s.startingBalance;
        }
      }
      map.set(firm, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.totalCapital - a.totalCapital);
  }, [accountStats]);

  // Cumulative Desk Payout Allocations across Treasury, Reinvestment, Founder, Tax
  const deskAllocations = useMemo(() => {
    let treasury = 0;
    let reinvestment = 0;
    let founder_draw = 0;
    let tax_reserve = 0;

    withdrawals.forEach((w) => {
      const { allocation } = parsePayoutAllocation(w.notes);
      const amt = Number(w.amount);
      const hasAlloc =
        allocation.treasury > 0 ||
        allocation.reinvestment > 0 ||
        allocation.founder_draw > 0 ||
        allocation.tax_reserve > 0;

      if (hasAlloc) {
        treasury += allocation.treasury;
        reinvestment += allocation.reinvestment;
        founder_draw += allocation.founder_draw;
        tax_reserve += allocation.tax_reserve;
      } else {
        // Default split: 40% Treasury, 20% Reinvestment, 30% Founder, 10% Tax Reserve
        treasury += amt * 0.4;
        reinvestment += amt * 0.2;
        founder_draw += amt * 0.3;
        tax_reserve += amt * 0.1;
      }
    });

    return { treasury, reinvestment, founder_draw, tax_reserve };
  }, [withdrawals]);

  // Monthly Calendar Heatmap data
  const calendarData = useMemo(() => {
    if (!selectedAccount) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthName = now.toLocaleString("default", { month: "long" });

    // Map entries by date YYYY-MM-DD
    const entryMap = new Map<string, PerformanceEntry>();
    selectedEntries.forEach((e) => {
      entryMap.set(e.entry_date, e);
    });

    // Build all days of month
    const days: { dayNumber: number; dateStr: string; entry: PerformanceEntry | null; dayOfWeek: number }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(currentYear, currentMonth, day);
      // 0 = Mon, 6 = Sun
      const dayOfWeek = (d.getDay() + 6) % 7;
      days.push({
        dayNumber: day,
        dateStr,
        entry: entryMap.get(dateStr) ?? null,
        dayOfWeek,
      });
    }

    // Group into 7-day rows (Mon to Sun)
    const weeks: typeof days[] = [];
    let currentWeek: typeof days = [];

    // Prepend blank padding for days before day 1
    const firstDayOfWeek = days[0]?.dayOfWeek ?? 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ dayNumber: 0, dateStr: "", entry: null, dayOfWeek: i });
    }

    days.forEach((dayItem) => {
      currentWeek.push(dayItem);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dayNumber: 0, dateStr: "", entry: null, dayOfWeek: currentWeek.length });
      }
      weeks.push(currentWeek);
    }

    // Month performance metrics
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthEntries = selectedEntries.filter((e) => e.entry_date.startsWith(monthPrefix));
    const monthPnl = monthEntries.reduce((sum, e) => sum + Number(e.pnl ?? 0), 0);
    const winDays = monthEntries.filter((e) => Number(e.pnl ?? 0) > 0).length;
    const lossDays = monthEntries.filter((e) => Number(e.pnl ?? 0) < 0).length;
    const totalTradingDays = monthEntries.length;
    const winRate = totalTradingDays > 0 ? (winDays / totalTradingDays) * 100 : 0;

    return {
      currentMonthName: `${monthName} ${currentYear}`,
      monthName,
      currentYear,
      weeks,
      monthPnl,
      totalMonthPnl: monthPnl,
      winDays,
      lossDays,
      totalTradingDays,
      winRate,
      monthWins: winDays,
      monthTotalSessions: totalTradingDays,
      monthWinRate: winRate,
    };
  }, [selectedAccount, selectedEntries]);



  // SVG Chart calculation
  const chartData = useMemo(() => {
    if (!selectedStats || chronologicalEntries.length === 0) return null;

    const starting = selectedStats.startingBalance;
    const targetLevel = starting + selectedStats.targetDollar;
    const maxLossFloor = selectedStats.maxLossFloor;

    const dataPoints = [
      {
        date: "Start",
        equity: starting,
        balance: starting,
        pnl: 0,
      },
      ...chronologicalEntries.map((e) => ({
        date: e.entry_date,
        equity: Number(e.equity ?? e.balance ?? starting),
        balance: Number(e.balance ?? starting),
        pnl: Number(e.pnl ?? 0),
      })),
    ];

    const values = dataPoints.flatMap((d) => [d.equity, d.balance, targetLevel, maxLossFloor]);
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const valRange = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = { top: 25, bottom: 35, left: 65, right: 25 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (index: number) =>
      padding.left + (index / (dataPoints.length - 1 || 1)) * chartW;
    const getY = (val: number) =>
      padding.top + chartH - ((val - minVal) / valRange) * chartH;

    const equityPoints = dataPoints.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(" ");
    const balancePoints = dataPoints.map((d, i) => `${getX(i)},${getY(d.balance)}`).join(" ");

    // Gradient area path
    const areaPath = `M ${getX(0)},${getY(dataPoints[0].equity)} ${dataPoints
      .map((d, i) => `L ${getX(i)},${getY(d.equity)}`)
      .join(" ")} L ${getX(dataPoints.length - 1)},${padding.top + chartH} L ${getX(
      0
    )},${padding.top + chartH} Z`;

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      minVal,
      maxVal,
      dataPoints,
      getX,
      getY,
      equityPoints,
      balancePoints,
      areaPath,
      targetY: getY(targetLevel),
      targetLevel,
      startY: getY(starting),
      starting,
      floorY: getY(maxLossFloor),
      maxLossFloor,
    };
  }, [selectedStats, chronologicalEntries]);

  // CSV Export helper
  const handleExportCsv = () => {
    if (!selectedAccount || selectedEntries.length === 0) return;
    const rows = selectedEntries.map((e) => ({
      Account: selectedAccount.label,
      Firm: selectedAccount.broker_or_prop_firm ?? "",
      Date: e.entry_date,
      Balance: e.balance ?? "",
      Equity: e.equity ?? "",
      PnL: e.pnl ?? "",
      Notes: e.notes ?? "",
    }));

    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = (row as any)[k] ?? "";
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedAccount.label.replace(/\s+/g, "_")}_journal.csv`);
    link.click();
  };

  // CSV Parse helper
  const handleParseCsv = (raw: string) => {
    setCsvText(raw);
    try {
      const lines = raw.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setCsvPreview([]);
        return;
      }
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      const dateIdx = header.findIndex((h) => h.includes("date"));
      const balIdx = header.findIndex((h) => h.includes("bal"));
      const eqIdx = header.findIndex((h) => h.includes("eq"));
      const pnlIdx = header.findIndex((h) => h.includes("pnl") || h.includes("profit"));
      const noteIdx = header.findIndex((h) => h.includes("note") || h.includes("comment"));

      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const dateVal = dateIdx >= 0 ? cols[dateIdx] : cols[0];
        if (!dateVal) continue;
        parsed.push({
          entry_date: dateVal,
          balance: balIdx >= 0 && cols[balIdx] ? Number(cols[balIdx]) : null,
          equity: eqIdx >= 0 && cols[eqIdx] ? Number(cols[eqIdx]) : null,
          pnl: pnlIdx >= 0 && cols[pnlIdx] ? Number(cols[pnlIdx]) : null,
          notes: noteIdx >= 0 ? cols[noteIdx] : null,
        });
      }
      setCsvPreview(parsed);
    } catch {
      setCsvPreview([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Top Cockpit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Total Liquid Equity</p>
            <span className="text-[10px] text-fog-400 font-mono">Live Desk</span>
          </div>
          <p className="mt-2 font-display text-2xl text-fog-100 font-mono font-bold">
            {formatCurrency(totalDeskEquity)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-fog-500 font-mono">
            <span>Balance: {formatCurrency(totalDeskBalance)} ({activeAccounts.length} active)</span>
            <button
              onClick={() => setIsHeatmapOpen(true)}
              className="text-gold hover:underline cursor-pointer"
            >
              Firm Breakdown →
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Prop Firm Payouts</p>
            <button
              onClick={() => setIsAllocationsOpen(true)}
              className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition"
            >
              Capital Allocation →
            </button>
          </div>
          <p className="mt-2 font-display text-2xl text-emerald-400 font-mono font-bold">
            {formatCurrency(totalDeskPayouts)}
          </p>
          <div className="mt-1 flex items-center justify-between text-[10px] text-fog-500 font-mono">
            <span>Treasury: {formatCurrency(deskAllocations.treasury)}</span>
            <span>Reinvest: {formatCurrency(deskAllocations.reinvestment)}</span>
          </div>
        </div>


        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Challenge Fees Spent</p>
          <p className="mt-2 font-display text-2xl text-fog-100 font-mono font-bold">
            {formatCurrency(totalDeskFees)}
          </p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Evaluation capital amortisation</p>
        </div>

        <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-widest2 text-gold font-bold">Net Cash Extracted</p>
            <span className="text-[10px] text-gold font-bold font-mono">True Net ROI</span>
          </div>
          <p className="mt-2 font-display text-2xl text-fog-100 font-bold font-mono">
            {formatCurrency(netDeskCash)}
          </p>
          <p className="text-[10px] text-gold font-mono mt-1 font-semibold">
            ROI: {totalDeskFees > 0 ? formatPercent(netDeskCash / totalDeskFees) : "—"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">Active Accounts</p>
              <button
                onClick={() => setIsSizerOpen(true)}
                className="text-[10px] bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition"
              >
                🧮 Lot Sizer
              </button>
            </div>
            <p className="mt-2 font-display text-2xl text-fog-100 font-mono font-bold">
              {activeAccounts.length}
              {blownAccounts.length > 0 && (
                <span className="text-xs text-rose-400 font-normal ml-2 font-sans">
                  ({blownAccounts.length} blown)
                </span>
              )}
            </p>
          </div>
          <p className="text-[10px] text-fog-400 mt-1 font-mono">
            {activeAccounts.filter((a) => a.account.account_type === "funded").length} Funded • {activeAccounts.filter((a) => a.account.account_type === "challenge").length} Challenge
          </p>
        </div>
      </div>

      {/* Main Master / Detail Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Left Column: Accounts Directory */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-fog-100">Trading Accounts</h2>
              <p className="text-[11px] text-fog-500">Prop accounts &amp; live capital</p>
            </div>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="rounded-lg border border-gold/50 bg-gold px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
            >
              + Add Account
            </button>
          </div>

          {/* Search & Phase Filters */}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search account label or firm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 text-xs text-fog-100 placeholder-fog-600 focus:border-gold/50 outline-none"
            />
            <div className="flex gap-1.5 text-xs">
              {["all", "funded", "challenge", "live", "blown"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex-1 rounded-md py-1 text-[11px] font-medium capitalize transition cursor-pointer ${
                    filterType === t
                      ? t === "blown"
                        ? "bg-rose-500 text-white font-bold"
                        : "bg-gold text-ink-950 font-bold"
                      : "bg-white/[0.03] text-fog-400 hover:text-white"
                  }`}
                >
                  {t === "blown" && blownAccounts.length > 0 ? `Blown (${blownAccounts.length})` : t}
                </button>
              ))}
            </div>
          </div>

          {/* Account Cards */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredAccountStats.map((item) => {
              const isSelected = item.account.id === selectedAccountId;
              return (
                <div
                  key={item.account.id}
                  onClick={() => setSelectedAccountId(item.account.id)}
                  className={`rounded-xl border p-3.5 space-y-2.5 cursor-pointer transition ${
                    isSelected
                      ? "border-gold bg-gold/5 shadow-[0_0_20px_rgba(198,161,89,0.12)]"
                      : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-xs font-bold leading-snug ${isSelected ? "text-gold" : "text-fog-100"}`}>
                        {item.account.label}
                      </h3>
                      <p className="text-[11px] text-fog-500">
                        {item.account.broker_or_prop_firm ?? "Independent Desk"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          item.isBlown
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : item.account.account_type === "funded"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : item.account.account_type === "live"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {item.isBlown
                          ? "BLOWN / INACTIVE"
                          : item.account.phase
                          ? item.account.phase.replace("_", " ")
                          : item.account.account_type}
                      </span>
                      {item.isTargetHit && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 py-0.2 rounded font-bold font-mono">
                          TARGET MET
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cushion micro indicators */}
                  {!item.isBlown && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-fog-500">Target: {item.targetProgressPct.toFixed(0)}%</span>
                        <span className={item.overallBufferPct < 30 ? "text-rose-400" : "text-emerald-400"}>
                          {formatCurrency(item.overallBufferDollar)} floor cushion
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gold h-full rounded-full transition-all duration-300"
                          style={{ width: `${item.targetProgressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-fog-500 block">Liquid Equity</span>
                      <span className={`font-mono font-bold text-xs ${item.isBlown ? "text-rose-400 line-through" : "text-white"}`}>
                        {formatCurrency(item.latestEquity)}
                      </span>
                      {item.isBlown && (
                        <span className="text-[8px] text-rose-400/80 block font-mono">
                          (liquidated)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-wider text-fog-500 block">Cash Payouts</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrency(item.totalPayouts)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}


            {filteredAccountStats.length === 0 && (
              <div className="py-8 text-center text-xs text-fog-600">
                No accounts match &quot;{searchQuery || filterType}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account Command Inspector */}
        {selectedStats ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            {/* Account Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {selectedAccount?.account_type} ACCOUNT
                  </span>
                  <span className="text-xs text-fog-400">
                    Prop Firm / Broker: <strong className="text-fog-200">{selectedAccount?.broker_or_prop_firm ?? "Independent"}</strong>
                  </span>
                  {selectedAccount?.phase && (
                    <span className="text-[10px] bg-white/5 text-fog-300 border border-white/10 px-2 py-0.5 rounded font-mono uppercase">
                      {selectedAccount.phase.replace("_", " ")}
                    </span>
                  )}
                  {selectedAccount?.fee_refunded && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                      FEE REFUNDED
                    </span>
                  )}
                  <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-fog-200 flex items-center gap-1">
                    {selectedStats.capitalSource === "flectere_treasury" && "🏛️ Flectēre Treasury"}
                    {selectedStats.capitalSource === "flectere_cashflow" && "📈 Flectēre Cashflow"}
                    {selectedStats.capitalSource === "desk_reinvestment" && "🔄 Desk Reinvestment"}
                    {selectedStats.capitalSource === "personal_capital" && "👤 Personal Capital"}
                  </span>
                </div>

                <h2 className="font-display text-2xl text-fog-100 mt-1 font-bold">
                  {selectedAccount?.label}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setQuickEquity(String(selectedStats.latestEquity));
                    setQuickPnl("");
                    setQuickTags([]);
                    setQuickNotes("");
                    setIsQuickLogOpen(true);
                  }}
                  className="rounded-lg border border-gold/50 bg-gold px-3.5 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(198,161,89,0.3)]"
                >
                  ⚡ Quick Day Log
                </button>
                <button
                  onClick={() => setIsAddEntryOpen(true)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-fog-200 hover:bg-white/[0.08] transition cursor-pointer"
                >
                  + Full Entry
                </button>
                <button
                  onClick={() => setIsAddPayoutOpen(true)}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                >
                  + Payout
                </button>
                <button
                  onClick={() => setIsCsvImportOpen(true)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-fog-300 hover:bg-white/[0.06] transition cursor-pointer"
                  title="Import CSV"
                >
                  📥 Import
                </button>
                <button
                  onClick={handleExportCsv}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-fog-300 hover:bg-white/[0.06] transition cursor-pointer"
                  title="Export Journal CSV"
                >
                  📤 Export
                </button>
                <button
                  onClick={() => setEditingAccount(selectedAccount)}
                  className="rounded-lg border border-white/10 p-1.5 text-xs text-fog-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                  title="Edit Account Settings"
                >
                  ⚙️
                </button>
              </div>
            </div>

            {/* Capital Source & Lineage Audit Trail Box */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-fog-500 uppercase text-[10px] font-bold tracking-wider">
                    Capital Origin &amp; Lineage Audit
                  </span>
                  <span className="text-gold font-mono font-bold">
                    {selectedStats.capitalSource === "flectere_treasury"
                      ? "🏛️ Flectēre Corporate Treasury (Retained Earnings)"
                      : selectedStats.capitalSource === "flectere_cashflow"
                      ? "📈 Flectēre Advisory & Diagnostic Revenue"
                      : selectedStats.capitalSource === "desk_reinvestment"
                      ? "🔄 Prop Desk Reinvestment Pool (Prior Payouts)"
                      : "👤 Founder Personal Capital"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-fog-400">
                  Initial Allocation: <strong className="text-white">{formatCurrency(selectedStats.flectereSeededCost)}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                <div>
                  <span className="text-fog-500 text-[10px] block">Capital Deployed</span>
                  <span className="text-white font-bold">{formatCurrency(selectedStats.flectereSeededCost)}</span>
                </div>
                <div>
                  <span className="text-fog-500 text-[10px] block">Cash Extracted Back</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(selectedStats.totalPayouts)}</span>
                </div>
                <div>
                  <span className="text-fog-500 text-[10px] block">Corporate Return Multiple</span>
                  <span className="text-gold font-bold">
                    {selectedStats.returnOnFlectereCapital !== null
                      ? `${selectedStats.returnOnFlectereCapital.toFixed(1)}x (+${((selectedStats.returnOnFlectereCapital - 1) * 100).toFixed(0)}% ROI)`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>


            {/* Prop Rule Breaker Sentinel Status Banner */}
            {selectedStats.isBlown ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💀</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      ACCOUNT LIQUIDATED &amp; DEACTIVATED
                    </h4>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      This account is marked as Blown. Active liquid capital is zeroed ($0.00) and excluded from desk totals.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAccount(selectedAccount)}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/20 px-3.5 py-1.5 text-xs text-rose-200 hover:bg-rose-500/30 transition cursor-pointer"
                >
                  Reset / Edit Account →
                </button>
              </div>
            ) : selectedStats.isMaxBreached ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛑</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                      CRITICAL BREACH: Maximum Drawdown Limit Hit
                    </h4>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      Account equity ({formatCurrency(selectedStats.latestEquity)}) has fallen below the liquidation threshold ({formatCurrency(selectedStats.maxLossFloor)}).
                    </p>
                  </div>
                </div>
                <form action={updatePropAccountAction}>
                  <input type="hidden" name="id" value={selectedAccount?.id} />
                  <input type="hidden" name="label" value={selectedAccount?.label} />
                  <input type="hidden" name="broker_or_prop_firm" value={selectedAccount?.broker_or_prop_firm ?? ""} />
                  <input type="hidden" name="account_type" value={selectedAccount?.account_type} />
                  <input type="hidden" name="phase" value="blown" />
                  <input type="hidden" name="status" value="blown" />
                  <input type="hidden" name="starting_balance" value={selectedAccount?.starting_balance ?? ""} />
                  <input type="hidden" name="challenge_cost" value={selectedAccount?.challenge_cost ?? ""} />
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-500 text-white font-bold px-3.5 py-1.5 text-xs hover:bg-rose-600 transition cursor-pointer shadow-lg shadow-rose-950"
                  >
                    Mark as Blown (Zero Equity) →
                  </button>
                </form>
              </div>
            ) : selectedStats.isDailyBreached ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    DAILY DRAWDOWN LIMIT BREACHED
                  </h4>
                  <p className="text-xs text-rose-200/80 mt-0.5">
                    Today&apos;s loss ({formatCurrency(selectedStats.todayPnl)}) exceeded the allowable daily loss limit ({formatCurrency(-selectedStats.dailyLossLimitDollar)}).
                  </p>
                </div>
              </div>

            ) : selectedStats.isTargetHit ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎉</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                      PROFIT TARGET ACHIEVED!
                    </h4>
                    <p className="text-xs text-emerald-200/80 mt-0.5">
                      Account has achieved +{formatCurrency(selectedStats.profitEarned)} in profit, surpassing the {formatPercent(selectedStats.targetPct)} target ceiling.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingAccount(selectedAccount)}
                  className="rounded-lg bg-emerald-400 text-ink-950 font-bold px-3 py-1.5 text-xs hover:bg-emerald-300 transition cursor-pointer"
                >
                  Advance Phase →
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sentinel Rule Guard: All prop risk limits operating safely within allowable thresholds.</span>
                </div>
                <span className="text-[11px] text-fog-400 font-mono">
                  Daily Loss Cushion: <strong className="text-emerald-300">+{formatCurrency(selectedStats.dailyBufferDollar)}</strong>
                </span>
              </div>
            )}

            {/* Visual Prop Risk & Target HUD (3 Gauges) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gauge 1: Profit Target */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-fog-500 font-medium uppercase text-[10px] tracking-wider">
                    Profit Target ({formatPercent(selectedStats.targetPct)})
                  </span>
                  <span className="font-mono text-gold font-bold">
                    {selectedStats.targetProgressPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-500"
                    style={{ width: `${selectedStats.targetProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-fog-400 pt-1">
                  <span>Earned: +{formatCurrency(selectedStats.profitEarned)}</span>
                  <span>Goal: {formatCurrency(selectedStats.targetDollar)}</span>
                </div>
              </div>

              {/* Gauge 2: Max Daily Drawdown Cushion */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-fog-500 font-medium uppercase text-[10px] tracking-wider">
                    Daily Loss Cushion (5% Max)
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      selectedStats.dailyBufferPct < 30 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    {selectedStats.dailyBufferPct.toFixed(1)}% Safe
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedStats.dailyBufferPct < 30
                        ? "bg-rose-500"
                        : selectedStats.dailyBufferPct < 60
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, selectedStats.dailyBufferPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-fog-400 pt-1">
                  <span>Remaining: {formatCurrency(selectedStats.dailyBufferDollar)}</span>
                  <span>Limit: -{formatCurrency(selectedStats.dailyLossLimitDollar)}</span>
                </div>
              </div>

              {/* Gauge 3: Max Total Drawdown Floor */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-fog-500 font-medium uppercase text-[10px] tracking-wider">
                    Max Drawdown Floor (10% Max)
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      selectedStats.overallBufferPct < 30 ? "text-rose-400" : "text-emerald-400"
                    }`}
                  >
                    +{formatCurrency(selectedStats.overallBufferDollar)}
                  </span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedStats.overallBufferPct < 30
                        ? "bg-rose-500"
                        : selectedStats.overallBufferPct < 60
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.min(100, selectedStats.overallBufferPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-fog-400 pt-1">
                  <span>Liquidation Floor: {formatCurrency(selectedStats.maxLossFloor)}</span>
                  <span>Base: {formatCurrency(selectedStats.startingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Equity & Drawdown Curve */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-fog-200">
                    Equity &amp; Balance Trajectory
                  </h3>
                  <p className="text-[10px] text-fog-500 font-mono">
                    Green dashed = Profit Target Ceiling • Red dashed = Max Drawdown Floor • White = Base
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-gold inline-block" />
                    <span className="text-fog-300">Equity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-sky-400 inline-block border-dashed" />
                    <span className="text-fog-400">Balance</span>
                  </div>
                </div>
              </div>

              {chartData && chartData.dataPoints.length > 1 ? (
                <div className="relative w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                    className="w-full h-auto max-h-[250px]"
                  >
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C6A159" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#C6A159" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal grid guide lines */}
                    {/* Target Line */}
                    <line
                      x1={chartData.padding.left}
                      y1={chartData.targetY}
                      x2={chartData.width - chartData.padding.right}
                      y2={chartData.targetY}
                      stroke="#34D399"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartData.padding.left - 8}
                      y={chartData.targetY + 4}
                      fill="#34D399"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      Target {formatCurrency(chartData.targetLevel)}
                    </text>

                    {/* Starting Line */}
                    <line
                      x1={chartData.padding.left}
                      y1={chartData.startY}
                      x2={chartData.width - chartData.padding.right}
                      y2={chartData.startY}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={chartData.padding.left - 8}
                      y={chartData.startY + 4}
                      fill="rgba(255,255,255,0.4)"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      Start {formatCurrency(chartData.starting)}
                    </text>

                    {/* Max Loss Floor */}
                    <line
                      x1={chartData.padding.left}
                      y1={chartData.floorY}
                      x2={chartData.width - chartData.padding.right}
                      y2={chartData.floorY}
                      stroke="#F43F5E"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartData.padding.left - 8}
                      y={chartData.floorY + 4}
                      fill="#F43F5E"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      Floor {formatCurrency(chartData.maxLossFloor)}
                    </text>

                    {/* Area under equity */}
                    <path d={chartData.areaPath} fill="url(#equityGradient)" />

                    {/* Balance line */}
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      points={chartData.balancePoints}
                    />

                    {/* Equity line */}
                    <polyline
                      fill="none"
                      stroke="#C6A159"
                      strokeWidth="2.5"
                      points={chartData.equityPoints}
                    />

                    {/* Data dots with tooltip trigger */}
                    {chartData.dataPoints.map((d, i) => {
                      const cx = chartData.getX(i);
                      const cy = chartData.getY(d.equity);
                      return (
                        <circle
                          key={i}
                          cx={cx}
                          cy={cy}
                          r="3.5"
                          fill="#C6A159"
                          className="hover:r-5 cursor-pointer transition-all"
                          onMouseEnter={() =>
                            setHoveredChartPoint({
                              date: d.date,
                              equity: d.equity,
                              balance: d.balance,
                              pnl: d.pnl,
                              x: cx,
                              y: cy,
                            })
                          }
                          onMouseLeave={() => setHoveredChartPoint(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip Overlay */}
                  {hoveredChartPoint && (
                    <div
                      className="absolute pointer-events-none rounded-lg border border-gold/40 bg-ink-950/95 p-2.5 shadow-xl text-xs font-mono space-y-1 z-20"
                      style={{
                        left: `${Math.min(chartData.width - 150, Math.max(70, hoveredChartPoint.x - 60))}px`,
                        top: `${Math.max(10, hoveredChartPoint.y - 70)}px`,
                      }}
                    >
                      <div className="text-[10px] text-fog-400 font-bold border-b border-white/10 pb-1">
                        {hoveredChartPoint.date}
                      </div>
                      <div className="text-white">
                        Equity: <strong className="text-gold">{formatCurrency(hoveredChartPoint.equity)}</strong>
                      </div>
                      <div className="text-fog-300">
                        Balance: {formatCurrency(hoveredChartPoint.balance)}
                      </div>
                      {hoveredChartPoint.pnl !== 0 && (
                        <div
                          className={hoveredChartPoint.pnl > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}
                        >
                          P&amp;L: {hoveredChartPoint.pnl > 0 ? "+" : ""}
                          {formatCurrency(hoveredChartPoint.pnl)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-fog-600 font-mono">
                  Not enough daily entries yet to plot trajectory curve. Use &quot;⚡ Quick Day Log&quot; to log your first trading session.
                </div>
              )}
            </div>

            {/* Payout Countdown for Funded / Live Accounts */}
            {(selectedAccount?.account_type === "funded" || selectedAccount?.account_type === "live") && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                      PAYOUT ELIGIBILITY WINDOW
                    </span>
                    <span className="text-xs text-fog-300 font-mono">Bi-Weekly Cycle (14 Days)</span>
                  </div>
                  <p className="text-xs text-fog-300">
                    Estimated Available Profit Split (80%):{" "}
                    <strong className="text-emerald-400 font-mono font-bold text-sm">
                      {formatCurrency(Math.max(0, selectedStats.profitEarned * 0.8))}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsAddPayoutOpen(true)}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition cursor-pointer"
                >
                  Record Extracted Payout
                </button>
              </div>
            )}

            {/* Tab Navigation: Performance Ledger vs Strategy Analytics vs Payouts vs Expenses */}
            <div className="border-b border-white/10 flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab("performance")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "performance"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Performance Journal ({selectedEntries.length})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "analytics"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Strategy &amp; Edge Analytics
              </button>
              <button
                onClick={() => setActiveTab("payouts")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "payouts"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Profit Payouts ({selectedPayouts.length})
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`pb-2.5 text-xs font-bold transition cursor-pointer border-b-2 -mb-[1px] ${
                  activeTab === "expenses"
                    ? "border-gold text-gold"
                    : "border-transparent text-fog-400 hover:text-white"
                }`}
              >
                Evaluation Fees &amp; Expenses ({selectedExpenses.length})
              </button>
            </div>

            {/* TAB 1: PERFORMANCE JOURNAL */}
            {activeTab === "performance" && (
              <div className="space-y-4">
                {/* View Switcher Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPerformanceView("ledger")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        performanceView === "ledger"
                          ? "bg-gold/15 text-gold border border-gold/40 shadow-sm"
                          : "text-fog-400 hover:text-white border border-transparent"
                      }`}
                    >
                      <span>☰</span> Ledger Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setPerformanceView("heatmap")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        performanceView === "heatmap"
                          ? "bg-gold/15 text-gold border border-gold/40 shadow-sm"
                          : "text-fog-400 hover:text-white border border-transparent"
                      }`}
                    >
                      <span>📅</span> Monthly Heatmap
                    </button>
                  </div>

                  {performanceView === "heatmap" && calendarData && calendarData.totalTradingDays > 0 && (
                    <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                      <span className="text-fog-400">
                        Days Traded: <strong className="text-fog-200">{calendarData.totalTradingDays}</strong>
                      </span>
                      <span className="text-fog-400">
                        Month Win Rate:{" "}
                        <strong className={calendarData.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}>
                          {calendarData.winRate.toFixed(1)}%
                        </strong>
                      </span>
                      <span className="text-fog-400">
                        Month Net P&L:{" "}
                        <strong className={calendarData.totalMonthPnl >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {calendarData.totalMonthPnl >= 0 ? "+" : ""}
                          {formatCurrency(calendarData.totalMonthPnl)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* VIEW A: LEDGER TABLE */}
                {performanceView === "ledger" && (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500 bg-white/[0.01]">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Balance</th>
                          <th className="px-4 py-3">Equity</th>
                          <th className="px-4 py-3">Day P&amp;L</th>
                          <th className="px-4 py-3">Strategy / Notes</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {selectedEntries.map((entry) => {
                          const pnlVal = Number(entry.pnl ?? 0);
                          return (
                            <tr key={entry.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 text-fog-200 font-medium whitespace-nowrap">
                                {entry.entry_date}
                              </td>
                              <td className="px-4 py-3 text-fog-300">
                                {entry.balance ? formatCurrency(Number(entry.balance)) : "—"}
                              </td>
                              <td className="px-4 py-3 text-fog-100 font-bold">
                                {entry.equity ? formatCurrency(Number(entry.equity)) : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {entry.pnl !== null && entry.pnl !== undefined ? (
                                  <span
                                    className={`font-bold ${
                                      pnlVal > 0
                                        ? "text-emerald-400"
                                        : pnlVal < 0
                                        ? "text-rose-400"
                                        : "text-fog-500"
                                    }`}
                                  >
                                    {pnlVal > 0 ? "+" : ""}
                                    {formatCurrency(pnlVal)}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3 text-fog-400 font-sans max-w-xs truncate">
                                {entry.notes ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2 font-sans">
                                  <button
                                    onClick={() => setEditingEntry(entry)}
                                    className="text-[11px] text-fog-400 hover:text-white transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <form action={deletePerformanceEntryAction}>
                                    <input type="hidden" name="id" value={entry.id} />
                                    <button
                                      type="submit"
                                      onClick={(e) => {
                                        if (!confirm("Delete this performance entry?")) e.preventDefault();
                                      }}
                                      className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {selectedEntries.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-fog-600 font-sans">
                              No performance entries logged yet. Click &quot;⚡ Quick Day Log&quot; to log your first trade day.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* VIEW B: MONTHLY HEATMAP CALENDAR */}
                {performanceView === "heatmap" && calendarData && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-display text-base font-bold text-fog-100 flex items-center gap-2">
                          <span>📅 Trading P&amp;L Heatmap</span>
                          <span className="text-xs font-mono font-normal text-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/30">
                            {calendarData.currentMonthName}
                          </span>
                        </h4>
                        <p className="text-xs text-fog-400 mt-0.5">
                          Daily performance breakdown with win rate, green/red days, and weekly sub-totals.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                          <span className="text-fog-300">Profit Day ({calendarData.winDays})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40" />
                          <span className="text-fog-300">Drawdown Day ({calendarData.lossDays})</span>
                        </div>
                      </div>
                    </div>

                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-fog-500">
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div className="text-fog-600">Sat</div>
                      <div className="text-fog-600">Sun</div>
                    </div>

                    {/* Weeks grid */}
                    <div className="space-y-2">
                      {calendarData.weeks.map((week, wIdx) => {
                        const weekPnl = week.reduce(
                          (acc, d) => acc + (d.entry ? Number(d.entry.pnl ?? 0) : 0),
                          0
                        );
                        const hasTrades = week.some((d) => d.entry !== null);

                        return (
                          <div key={wIdx} className="space-y-1">
                            <div className="grid grid-cols-7 gap-2">
                              {week.map((day, dIdx) => {
                                if (day.dayNumber === 0) {
                                  return (
                                    <div
                                      key={dIdx}
                                      className="min-h-[74px] rounded-lg border border-white/[0.03] bg-white/[0.01] opacity-25 p-2"
                                    />
                                  );
                                }

                                const entry = day.entry;
                                const pnl = entry ? Number(entry.pnl ?? 0) : null;
                                const isWin = pnl !== null && pnl > 0;
                                const isLoss = pnl !== null && pnl < 0;
                                const isBreakeven = pnl !== null && pnl === 0;

                                return (
                                  <div
                                    key={dIdx}
                                    onClick={() => {
                                      if (entry) {
                                        setEditingEntry(entry);
                                      } else if (selectedAccount) {
                                        setIsQuickLogOpen(true);
                                      }
                                    }}
                                    className={`min-h-[74px] rounded-lg border p-2 transition cursor-pointer flex flex-col justify-between ${
                                      isWin
                                        ? "border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 shadow-sm shadow-emerald-500/5"
                                        : isLoss
                                        ? "border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 shadow-sm shadow-rose-500/5"
                                        : isBreakeven
                                        ? "border-fog-500/30 bg-fog-950/20 hover:bg-fog-950/40"
                                        : "border-white/5 bg-white/[0.015] hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span
                                        className={`font-mono font-medium ${
                                          entry ? "text-fog-200 font-bold" : "text-fog-600"
                                        }`}
                                      >
                                        {day.dayNumber}
                                      </span>
                                      {entry && (
                                        <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white/5 text-fog-400">
                                          Logged
                                        </span>
                                      )}
                                    </div>

                                    <div className="font-mono text-right">
                                      {pnl !== null ? (
                                        <div>
                                          <div
                                            className={`text-xs font-bold leading-tight ${
                                              isWin
                                                ? "text-emerald-400"
                                                : isLoss
                                                ? "text-rose-400"
                                                : "text-fog-300"
                                            }`}
                                          >
                                            {pnl > 0 ? "+" : ""}
                                            {formatCurrency(pnl)}
                                          </div>
                                          {entry?.notes && (
                                            <div className="text-[9px] text-fog-500 truncate max-w-[80px] font-sans mt-0.5">
                                              {entry.notes}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-fog-700 select-none">—</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Weekly subtotal strip */}
                            {hasTrades && (
                              <div className="flex justify-end items-center gap-2 px-2 py-0.5 text-[11px] font-mono text-fog-400">
                                <span>Week #{wIdx + 1} Net:</span>
                                <span
                                  className={`font-bold ${
                                    weekPnl > 0
                                      ? "text-emerald-400"
                                      : weekPnl < 0
                                      ? "text-rose-400"
                                      : "text-fog-400"
                                  }`}
                                >
                                  {weekPnl > 0 ? "+" : ""}
                                  {formatCurrency(weekPnl)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STRATEGY & EDGE ANALYTICS */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <span className="text-[10px] uppercase text-fog-500 font-bold block">Win Rate</span>
                    <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                      {selectedStats.winRate.toFixed(1)}%
                    </p>
                    <span className="text-[10px] text-fog-500 font-mono">
                      Across {selectedStats.entryCount} trading sessions
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <span className="text-[10px] uppercase text-fog-500 font-bold block">Profit Factor</span>
                    <p className="font-mono text-2xl font-bold text-gold mt-1">
                      {selectedStats.profitFactor > 0 ? selectedStats.profitFactor.toFixed(2) : "—"}
                    </p>
                    <span className="text-[10px] text-fog-500 font-mono">Gross Gains / Gross Losses</span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <span className="text-[10px] uppercase text-fog-500 font-bold block">Best Session</span>
                    <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                      +{formatCurrency(selectedStats.bestDay)}
                    </p>
                    <span className="text-[10px] text-fog-500 font-mono">Peak daily return</span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                    <span className="text-[10px] uppercase text-fog-500 font-bold block">Worst Session</span>
                    <p className="font-mono text-2xl font-bold text-rose-400 mt-1">
                      {formatCurrency(selectedStats.worstDay)}
                    </p>
                    <span className="text-[10px] text-fog-500 font-mono">Max single-day drawdown</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-fog-200">
                      Average R:R Distribution
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-fog-400">Average Win Day:</span>
                        <span className="text-emerald-400 font-bold">+{formatCurrency(selectedStats.avgWin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fog-400">Average Loss Day:</span>
                        <span className="text-rose-400 font-bold">-{formatCurrency(selectedStats.avgLoss)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10">
                        <span className="text-fog-300">Win / Loss Ratio:</span>
                        <span className="text-gold font-bold">
                          {selectedStats.avgLoss > 0
                            ? (selectedStats.avgWin / selectedStats.avgLoss).toFixed(2)
                            : "—"}{" "}
                          R
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-fog-200">
                      Top Setup &amp; Strategy Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          selectedEntries
                            .flatMap((e) => (e.notes || "").match(/\[(.*?)\]/g) || [])
                            .map((tag) => tag.replace(/\[|\]/g, ""))
                        )
                      ).map((tag, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs text-gold font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                      {selectedEntries.filter((e) => (e.notes || "").includes("[")).length === 0 && (
                        <p className="text-xs text-fog-500">
                          Tag your entries like <code className="text-gold">[XAUUSD] [London Open]</code> in the notes field to see strategy clusters here.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PROFIT PAYOUTS */}
            {activeTab === "payouts" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-fog-400">
                    Prop firm profit disbursements extracted into cash.
                  </p>
                  <button
                    onClick={() => setIsAddPayoutOpen(true)}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    + Record Payout
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500 bg-white/[0.01]">
                      <tr>
                        <th className="px-4 py-3">Disbursement Date</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Capital Allocation Breakdown</th>
                        <th className="px-4 py-3">Wire / Notes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {selectedPayouts.map((w) => {
                        const { allocation, cleanNotes } = parsePayoutAllocation(w.notes);
                        const hasAlloc =
                          allocation.treasury > 0 ||
                          allocation.reinvestment > 0 ||
                          allocation.founder_draw > 0 ||
                          allocation.tax_reserve > 0;

                        return (
                          <tr key={w.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-fog-200 whitespace-nowrap">{w.withdrawn_on}</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">
                              {formatCurrency(Number(w.amount))}
                            </td>
                            <td className="px-4 py-3 font-sans">
                              {hasAlloc ? (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {allocation.treasury > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] text-amber-300 font-mono">
                                      <span>🏛️</span>
                                      {formatCurrency(allocation.treasury)}
                                    </span>
                                  )}
                                  {allocation.reinvestment > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 border border-sky-500/30 px-1.5 py-0.5 text-[10px] text-sky-300 font-mono">
                                      <span>🔄</span>
                                      {formatCurrency(allocation.reinvestment)}
                                    </span>
                                  )}
                                  {allocation.founder_draw > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">
                                      <span>👤</span>
                                      {formatCurrency(allocation.founder_draw)}
                                    </span>
                                  )}
                                  {allocation.tax_reserve > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-300 font-mono">
                                      <span>🛡️</span>
                                      {formatCurrency(allocation.tax_reserve)}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setEditingPayout(w)}
                                    className="text-[10px] text-fog-400 hover:text-gold transition cursor-pointer ml-1 underline underline-offset-2"
                                  >
                                    Adjust
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 font-mono text-[11px] text-fog-500">
                                  <span>Unallocated</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingPayout(w)}
                                    className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gold hover:bg-gold/10 transition cursor-pointer font-sans"
                                  >
                                    Allocate Funds
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-fog-400 font-sans max-w-xs truncate">
                              {cleanNotes || "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-sans whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingPayout(w)}
                                  className="text-[11px] text-fog-400 hover:text-white transition cursor-pointer"
                                >
                                  Edit Allocations
                                </button>
                                <form action={deletePropPayoutAction}>
                                  <input type="hidden" name="id" value={w.id} />
                                  <button
                                    type="submit"
                                    onClick={(e) => {
                                      if (!confirm("Delete this payout record?")) e.preventDefault();
                                    }}
                                    className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {selectedPayouts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-fog-600 font-sans">
                            No payouts recorded yet. Log payouts once the prop firm approves and wires your profit split.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: EVALUATION FEES & EXPENSES */}
            {activeTab === "expenses" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-fog-400">
                    Challenge fees, reset costs, and platform/data expenses tied to this account.
                  </p>
                  <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-fog-200 hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    + Add Expense
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500 bg-white/[0.01]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                      {selectedExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3 text-fog-200">{exp.incurred_on}</td>
                          <td className="px-4 py-3 capitalize text-fog-300 font-sans">
                            {exp.category.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-fog-100 font-bold">
                            {formatCurrency(Number(exp.amount))}
                          </td>
                          <td className="px-4 py-3 text-fog-400 font-sans">{exp.notes ?? "—"}</td>
                          <td className="px-4 py-3 text-right font-sans">
                            <form action={deleteDeskExpenseAction}>
                              <input type="hidden" name="id" value={exp.id} />
                              <button
                                type="submit"
                                onClick={(e) => {
                                  if (!confirm("Delete this expense?")) e.preventDefault();
                                }}
                                className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}

                      {selectedExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-fog-600 font-sans">
                            No specific expenses recorded. (Initial challenge cost is tracked in account settings).
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-fog-500">
            Select an account from the left directory or create a new account to inspect.
          </div>
        )}
      </div>

      {/* MODAL 1: QUICK 1-CLICK DAILY LOG */}
      {isQuickLogOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  ⚡ 1-Click Rapid Day Log
                </h3>
                <p className="text-xs text-fog-400">
                  {selectedAccount.label} • Prior Close: {formatCurrency(selectedStats?.latestBalance ?? 0)}
                </p>
              </div>
              <button
                onClick={() => setIsQuickLogOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                const finalNotes = [
                  quickTags.map((t) => `[${t}]`).join(" "),
                  quickNotes,
                ]
                  .filter(Boolean)
                  .join(" ");
                formData.set("notes", finalNotes);
                await addPerformanceEntryAction(formData);
                setIsQuickLogOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Session Date</label>
                  <input
                    name="entry_date"
                    type="date"
                    required
                    defaultValue={today}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Closing Balance</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    required
                    value={quickEquity}
                    onChange={(e) => {
                      setQuickEquity(e.target.value);
                      const prior = selectedStats?.latestBalance ?? selectedStats?.startingBalance ?? 0;
                      const entered = Number(e.target.value);
                      if (!isNaN(entered) && entered > 0) {
                        setQuickPnl((entered - prior).toFixed(2));
                      }
                    }}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Closing Equity</label>
                  <input
                    name="equity"
                    type="number"
                    step="0.01"
                    required
                    value={quickEquity}
                    onChange={(e) => setQuickEquity(e.target.value)}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Day P&amp;L</label>
                  <input
                    name="pnl"
                    type="number"
                    step="0.01"
                    required
                    value={quickPnl}
                    onChange={(e) => setQuickPnl(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Quick Strategy Tag Chips */}
              <div>
                <label className={labelClasses}>Strategy &amp; Asset Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["XAUUSD", "NQ", "US30", "EURUSD", "London Sweep", "NY Reversal", "FVG Breakout", "News Momentum"].map(
                    (tag) => {
                      const active = quickTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setQuickTags((prev) =>
                              active ? prev.filter((t) => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`rounded px-2 py-0.5 text-[11px] font-mono transition cursor-pointer ${
                            active
                              ? "bg-gold text-ink-950 font-bold"
                              : "bg-white/[0.04] text-fog-400 hover:text-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    }
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Additional trade commentary or execution notes..."
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Log Day Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MULTI-ACCOUNT POSITION SIZING CALCULATOR */}
      {isSizerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  🧮 Multi-Account Position &amp; Risk Sizer
                </h3>
                <p className="text-xs text-fog-400">
                  Synchronize exact lot sizes across all active prop accounts based on your stop loss.
                </p>
              </div>
              <button
                onClick={() => setIsSizerOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Instrument Class</label>
                <select
                  value={sizerAsset}
                  onChange={(e) => setSizerAsset(e.target.value as any)}
                  className={inputClasses}
                >
                  <option value="forex">Forex (1 pip = $10/lot)</option>
                  <option value="gold">Gold XAUUSD ($100/point/lot)</option>
                  <option value="indices">Indices NQ/US30 ($20/point)</option>
                  <option value="crypto">Crypto ($1/point)</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Stop Loss (Pips / Pts)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sizerStopLoss}
                  onChange={(e) => setSizerStopLoss(Number(e.target.value))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Risk Per Account (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={sizerRiskPct}
                  onChange={(e) => setSizerRiskPct(Number(e.target.value))}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Calculated Matrix Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-white/10 bg-white/[0.02] text-fog-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Account</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Live Equity</th>
                    <th className="px-4 py-2.5">Dollar Risk</th>
                    <th className="px-4 py-2.5 text-right font-bold text-gold">Lot Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accountStats.filter((item) => !item.isBlown).map((item) => {
                    const dollarRisk = item.latestEquity * (sizerRiskPct / 100);

                    let lotSize = 0;
                    if (sizerStopLoss > 0) {
                      if (sizerAsset === "forex") {
                        lotSize = dollarRisk / (sizerStopLoss * 10);
                      } else if (sizerAsset === "gold") {
                        lotSize = dollarRisk / (sizerStopLoss * 100);
                      } else if (sizerAsset === "indices") {
                        lotSize = dollarRisk / (sizerStopLoss * 20);
                      } else {
                        lotSize = dollarRisk / sizerStopLoss;
                      }
                    }

                    return (
                      <tr key={item.account.id} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-2.5 text-fog-100 font-sans font-medium">
                          {item.account.label}
                        </td>
                        <td className="px-4 py-2.5 capitalize text-fog-400">
                          {item.account.account_type}
                        </td>
                        <td className="px-4 py-2.5 text-fog-200">
                          {formatCurrency(item.latestEquity)}
                        </td>
                        <td className="px-4 py-2.5 text-rose-400">
                          -{formatCurrency(dollarRisk)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gold font-bold text-sm">
                          {lotSize > 0 ? lotSize.toFixed(2) : "0.00"} lots
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-fog-400">
                Total Portfolio Risk:{" "}
                <strong className="text-rose-400 font-mono font-bold">
                  -{formatCurrency(totalDeskEquity * (sizerRiskPct / 100))}
                </strong>
              </span>
              <button
                onClick={() => setIsSizerOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-200 hover:text-white transition cursor-pointer"
              >
                Close Calculator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FIRM ALLOCATION HEATMAP */}
      {isHeatmapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  🗺️ Capital Allocation Heatmap
                </h3>
                <p className="text-xs text-fog-400">
                  Aggregated capital exposure across proprietary trading firms.
                </p>
              </div>
              <button
                onClick={() => setIsHeatmapOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {firmAllocations.map((item, idx) => {
                const pct = totalDeskBalance > 0 ? (item.totalCapital / totalDeskBalance) * 100 : 0;
                return (
                  <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-fog-100">{item.firm}</h4>
                        <span className="text-[10px] text-fog-500 font-mono">
                          {item.count} account{item.count === 1 ? "" : "s"} • {formatCurrency(item.fundedCapital)} funded
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-gold">
                          {formatCurrency(item.totalCapital)}
                        </span>
                        <span className="text-[10px] text-fog-400 block font-mono">
                          {pct.toFixed(1)}% of desk
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gold h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHeatmapOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-200 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CSV BULK IMPORT */}
      {isCsvImportOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  📥 Bulk Import Trade History
                </h3>
                <p className="text-xs text-fog-400">
                  Import CSV journal into {selectedAccount.label}
                </p>
              </div>
              <button
                onClick={() => setIsCsvImportOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-fog-400">
                Paste your CSV rows with headers e.g.:{" "}
                <code className="text-gold font-mono text-[11px]">
                  Date, Balance, Equity, PnL, Notes
                </code>
              </p>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => handleParseCsv(e.target.value)}
                placeholder="Date,Balance,Equity,PnL,Notes&#10;2026-09-01,101500,101500,1500,[XAUUSD] London sweep&#10;2026-09-02,102800,102800,1300,[NQ] NY Breakout"
                className="w-full rounded-lg border border-white/10 bg-black/50 p-3 text-xs font-mono text-fog-100 outline-none focus:border-gold/50"
              />

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-emerald-400">
                      ✓ Ready to import {csvPreview.length} entries
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-white/5 text-fog-500">
                        <tr>
                          <th className="px-3 py-1.5">Date</th>
                          <th className="px-3 py-1.5">Balance</th>
                          <th className="px-3 py-1.5">Equity</th>
                          <th className="px-3 py-1.5">PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-fog-300">
                        {csvPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-1">{row.entry_date}</td>
                            <td className="px-3 py-1">{formatCurrency(row.balance)}</td>
                            <td className="px-3 py-1">{formatCurrency(row.equity)}</td>
                            <td className="px-3 py-1">{formatCurrency(row.pnl)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <form
              action={async (formData) => {
                await bulkImportPerformanceEntriesAction(formData);
                setIsCsvImportOpen(false);
                setCsvText("");
                setCsvPreview([]);
              }}
              className="flex justify-end gap-3 pt-2"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />
              <input type="hidden" name="entries_json" value={JSON.stringify(csvPreview)} />

              <button
                type="button"
                onClick={() => setIsCsvImportOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={csvPreview.length === 0}
                className={submitClasses}
              >
                Import {csvPreview.length} Entries
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD FULL ENTRY */}
      {isAddEntryOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-fog-100">
                Log Daily Entry for {selectedAccount.label}
              </h3>
              <button
                onClick={() => setIsAddEntryOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addPerformanceEntryAction(formData);
                setIsAddEntryOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div>
                <label className={labelClasses}>Session Date</label>
                <input
                  name="entry_date"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Balance</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={selectedStats?.latestBalance}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Equity</label>
                  <input
                    name="equity"
                    type="number"
                    step="0.01"
                    defaultValue={selectedStats?.latestEquity}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>P&amp;L</label>
                  <input
                    name="pnl"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Notes &amp; Strategy Tags</label>
                <input
                  name="notes"
                  placeholder="e.g. [XAUUSD] [London Open] Reversal setup from key 4H demand"
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddEntryOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT PERFORMANCE ENTRY */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-fog-100">
                Edit Performance Entry
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updatePerformanceEntryAction(formData);
                setEditingEntry(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingEntry.id} />

              <div>
                <label className={labelClasses}>Session Date</label>
                <input
                  name="entry_date"
                  type="date"
                  required
                  defaultValue={editingEntry.entry_date}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Balance</label>
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={editingEntry.balance ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Equity</label>
                  <input
                    name="equity"
                    type="number"
                    step="0.01"
                    defaultValue={editingEntry.equity ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>P&amp;L</label>
                  <input
                    name="pnl"
                    type="number"
                    step="0.01"
                    defaultValue={editingEntry.pnl ?? ""}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Notes &amp; Strategy Tags</label>
                <input
                  name="notes"
                  defaultValue={editingEntry.notes ?? ""}
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: RECORD PROP PAYOUT */}
      {isAddPayoutOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-emerald-400">
                Record Prop Payout ({selectedAccount.label})
              </h3>
              <button
                onClick={() => setIsAddPayoutOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addPropPayoutAction(formData);
                setIsAddPayoutOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div>
                <label className={labelClasses}>Payout Amount (USD)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4500.00"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Disbursement Date</label>
                <input
                  name="withdrawn_on"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClasses}
                />
              </div>

              {/* Capital Allocation Distribution Inputs */}
              <div className="rounded-xl border border-gold/20 bg-gold/[0.02] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gold flex items-center gap-1.5">
                      <span>⚖️</span> Payout Capital Allocation
                    </h4>
                    <p className="text-[11px] text-fog-400">
                      Distribute this extraction across treasury, reinvestment, dividends, and tax.
                    </p>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const amt = allocTreasury + allocReinvestment + allocFounder + allocTax;
                        if (amt > 0) {
                          setAllocTreasury(Math.round(amt * 0.4));
                          setAllocReinvestment(Math.round(amt * 0.2));
                          setAllocFounder(Math.round(amt * 0.3));
                          setAllocTax(amt - Math.round(amt * 0.4) - Math.round(amt * 0.2) - Math.round(amt * 0.3));
                        }
                      }}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                    >
                      40/20/30/10
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = allocTreasury + allocReinvestment + allocFounder + allocTax;
                        if (amt > 0) {
                          setAllocTreasury(Math.round(amt * 0.5));
                          setAllocReinvestment(0);
                          setAllocFounder(amt - Math.round(amt * 0.5));
                          setAllocTax(0);
                        }
                      }}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                    >
                      50/50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = allocTreasury + allocReinvestment + allocFounder + allocTax;
                        if (amt > 0) {
                          setAllocTreasury(amt);
                          setAllocReinvestment(0);
                          setAllocFounder(0);
                          setAllocTax(0);
                        }
                      }}
                      className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                    >
                      100% Corp
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[11px] text-amber-300 font-medium block mb-1">
                      🏛️ Corporate Treasury ($)
                    </label>
                    <input
                      name="alloc_treasury"
                      type="number"
                      step="0.01"
                      value={allocTreasury}
                      onChange={(e) => setAllocTreasury(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-sky-300 font-medium block mb-1">
                      🔄 Desk Reinvestment ($)
                    </label>
                    <input
                      name="alloc_reinvestment"
                      type="number"
                      step="0.01"
                      value={allocReinvestment}
                      onChange={(e) => setAllocReinvestment(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-emerald-300 font-medium block mb-1">
                      👤 Founder Dividends ($)
                    </label>
                    <input
                      name="alloc_founder"
                      type="number"
                      step="0.01"
                      value={allocFounder}
                      onChange={(e) => setAllocFounder(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-purple-300 font-medium block mb-1">
                      🛡️ Tax &amp; Reserve ($)
                    </label>
                    <input
                      name="alloc_tax"
                      type="number"
                      step="0.01"
                      value={allocTax}
                      onChange={(e) => setAllocTax(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-fog-400 border-t border-white/5 pt-2">
                  <span>Sum Allocated:</span>
                  <strong className="text-gold">
                    {formatCurrency(allocTreasury + allocReinvestment + allocFounder + allocTax)}
                  </strong>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Reference Notes / Wire Info</label>
                <input
                  name="notes"
                  placeholder="e.g. Deel Wire / Crypto USDT payout"
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPayoutOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500 px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-emerald-400 transition cursor-pointer"
                >
                  Record Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: RECORD DESK EXPENSE */}
      {isAddExpenseOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-fog-100">
                Add Desk Expense for {selectedAccount.label}
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await addDeskExpenseAction(formData);
                setIsAddExpenseOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="account_id" value={selectedAccount.id} />

              <div>
                <label className={labelClasses}>Category</label>
                <select name="category" className={inputClasses}>
                  <option value="prop_fee">Prop Firm Evaluation Fee</option>
                  <option value="deposit">Personal Live Deposit</option>
                  <option value="other">Platform / Market Data Feed</option>
                </select>
              </div>

              <div>
                <label className={labelClasses}>Amount (USD)</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 540.00"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Date Incurred</label>
                <input
                  name="incurred_on"
                  type="date"
                  required
                  defaultValue={today}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Notes</label>
                <input
                  name="notes"
                  placeholder="e.g. 100K 2-Step Challenge purchase"
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: ADD NEW PROPRIETARY ACCOUNT */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  Add Proprietary Trading Account
                </h3>
                <p className="text-xs text-fog-400">
                  Prop firm challenge, funded account, or personal live capital.
                </p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createPropAccountAction(formData);
                setIsAddAccountOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClasses}>Account Label / Designation</label>
                <input
                  name="label"
                  required
                  placeholder="e.g. FTMO 100K #2"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Broker / Prop Firm</label>
                  <input
                    name="broker_or_prop_firm"
                    placeholder="e.g. FTMO, Topstep, Apex"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Account Type</label>
                  <select name="account_type" className={inputClasses}>
                    <option value="challenge">Prop Challenge</option>
                    <option value="funded">Funded Account</option>
                    <option value="live">Personal Live Capital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Phase</label>
                  <select name="phase" className={inputClasses}>
                    <option value="phase_1">Phase 1 (Evaluation)</option>
                    <option value="phase_2">Phase 2 (Verification)</option>
                    <option value="funded">Funded (Sim/Live)</option>
                    <option value="live">Personal Live</option>
                    <option value="blown">Blown / Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Starting Balance / Allocation</label>
                  <input
                    name="starting_balance"
                    type="number"
                    step="0.01"
                    defaultValue="100000"
                    required
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Challenge Purchase Cost</label>
                  <input
                    name="challenge_cost"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 540"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Capital Funding Source</label>
                  <select name="capital_source" defaultValue="flectere_treasury" className={inputClasses}>
                    <option value="flectere_treasury">🏛️ Flectēre Corporate Treasury</option>
                    <option value="flectere_cashflow">💼 Advisory / Client Cashflow</option>
                    <option value="desk_reinvestment">🔄 Desk Reinvestment Fund</option>
                    <option value="personal_capital">👤 Personal Capital</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fee_refunded"
                  name="fee_refunded"
                  value="true"
                  className="rounded border-white/20 text-gold focus:ring-gold"
                />
                <label htmlFor="fee_refunded" className="text-xs text-fog-300">
                  Challenge fee already refunded by prop firm
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: EDIT ACCOUNT SETTINGS & PHASE ADVANCEMENT */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-lg font-bold text-fog-100">
                Account Settings: {editingAccount.label}
              </h3>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updatePropAccountAction(formData);
                setEditingAccount(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingAccount.id} />

              <div>
                <label className={labelClasses}>Label</label>
                <input
                  name="label"
                  required
                  defaultValue={editingAccount.label}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Broker / Prop Firm</label>
                  <input
                    name="broker_or_prop_firm"
                    defaultValue={editingAccount.broker_or_prop_firm ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Account Type</label>
                  <select
                    name="account_type"
                    defaultValue={editingAccount.account_type}
                    className={inputClasses}
                  >
                    <option value="challenge">Prop Challenge</option>
                    <option value="funded">Funded Account</option>
                    <option value="live">Personal Live Capital</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Phase Advancement</label>
                  <select
                    name="phase"
                    defaultValue={editingAccount.phase ?? "phase_1"}
                    className={inputClasses}
                  >
                    <option value="phase_1">Phase 1 (Evaluation)</option>
                    <option value="phase_2">Phase 2 (Verification)</option>
                    <option value="funded">Funded (Sim/Live)</option>
                    <option value="live">Personal Live</option>
                    <option value="blown">Blown / Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Starting Balance / Allocation</label>
                  <input
                    name="starting_balance"
                    type="number"
                    step="0.01"
                    defaultValue={editingAccount.starting_balance ?? ""}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Challenge Cost</label>
                  <input
                    name="challenge_cost"
                    type="number"
                    step="0.01"
                    defaultValue={editingAccount.challenge_cost ?? ""}
                    className={inputClasses}
                  />
                </div>
                <div className="flex items-center pt-6 gap-2">
                  <input
                    type="checkbox"
                    id="edit_fee_refunded"
                    name="fee_refunded"
                    value="true"
                    defaultChecked={editingAccount.fee_refunded}
                    className="rounded border-white/20 text-gold focus:ring-gold"
                  />
                  <label htmlFor="edit_fee_refunded" className="text-xs text-fog-300">
                    Challenge fee refunded
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        `Are you sure you want to permanently delete account "${editingAccount.label}" and all its history?`
                      )
                    ) {
                      const fd = new FormData();
                      fd.set("id", editingAccount.id);
                      await deletePropAccountAction(fd);
                      setEditingAccount(null);
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  Delete Account
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className={submitClasses}>
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 11: CAPITAL DISTRIBUTION ALLOCATION LEDGER */}
      {isAllocationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100 flex items-center gap-2">
                  <span>⚖️</span> Capital Allocation &amp; Distribution Ledger
                </h3>
                <p className="text-xs text-fog-400">
                  Global breakdown of extracted proprietary trading payouts across designated enterprise pools.
                </p>
              </div>
              <button
                onClick={() => setIsAllocationsOpen(false)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Aggregate Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <span className="text-[10px] uppercase text-amber-400 font-bold block">🏛️ Treasury</span>
                <p className="text-lg font-bold text-amber-300 mt-1">
                  {formatCurrency(deskAllocations.treasury)}
                </p>
                <span className="text-[10px] text-fog-400">
                  {totalDeskPayouts > 0
                    ? ((deskAllocations.treasury / totalDeskPayouts) * 100).toFixed(1)
                    : 0}
                  % of total
                </span>
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
                <span className="text-[10px] uppercase text-sky-400 font-bold block">🔄 Reinvestment</span>
                <p className="text-lg font-bold text-sky-300 mt-1">
                  {formatCurrency(deskAllocations.reinvestment)}
                </p>
                <span className="text-[10px] text-fog-400">
                  {totalDeskPayouts > 0
                    ? ((deskAllocations.reinvestment / totalDeskPayouts) * 100).toFixed(1)
                    : 0}
                  % of total
                </span>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-[10px] uppercase text-emerald-400 font-bold block">👤 Founder Draw</span>
                <p className="text-lg font-bold text-emerald-300 mt-1">
                  {formatCurrency(deskAllocations.founder_draw)}
                </p>
                <span className="text-[10px] text-fog-400">
                  {totalDeskPayouts > 0
                    ? ((deskAllocations.founder_draw / totalDeskPayouts) * 100).toFixed(1)
                    : 0}
                  % of total
                </span>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3">
                <span className="text-[10px] uppercase text-purple-400 font-bold block">🛡️ Tax Reserve</span>
                <p className="text-lg font-bold text-purple-300 mt-1">
                  {formatCurrency(deskAllocations.tax_reserve)}
                </p>
                <span className="text-[10px] text-fog-400">
                  {totalDeskPayouts > 0
                    ? ((deskAllocations.tax_reserve / totalDeskPayouts) * 100).toFixed(1)
                    : 0}
                  % of total
                </span>
              </div>
            </div>

            {/* Payout Distribution Stack Bar */}
            {totalDeskPayouts > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-fog-400">
                  <span>Allocation Distribution</span>
                  <span className="font-mono text-fog-200">
                    Total Extracted: <strong>{formatCurrency(totalDeskPayouts)}</strong>
                  </span>
                </div>
                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-amber-400 h-full transition-all"
                    style={{
                      width: `${(deskAllocations.treasury / totalDeskPayouts) * 100}%`,
                    }}
                    title={`Treasury: ${formatCurrency(deskAllocations.treasury)}`}
                  />
                  <div
                    className="bg-sky-400 h-full transition-all"
                    style={{
                      width: `${(deskAllocations.reinvestment / totalDeskPayouts) * 100}%`,
                    }}
                    title={`Reinvestment: ${formatCurrency(deskAllocations.reinvestment)}`}
                  />
                  <div
                    className="bg-emerald-400 h-full transition-all"
                    style={{
                      width: `${(deskAllocations.founder_draw / totalDeskPayouts) * 100}%`,
                    }}
                    title={`Founder Draw: ${formatCurrency(deskAllocations.founder_draw)}`}
                  />
                  <div
                    className="bg-purple-400 h-full transition-all"
                    style={{
                      width: `${(deskAllocations.tax_reserve / totalDeskPayouts) * 100}%`,
                    }}
                    title={`Tax Reserve: ${formatCurrency(deskAllocations.tax_reserve)}`}
                  />
                </div>
              </div>
            )}

            {/* Historical Disbursements Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fog-400">
                Disbursement History &amp; Pool Splits
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-fog-500 uppercase">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Account</th>
                      <th className="px-3 py-2">Total Amount</th>
                      <th className="px-3 py-2">Treasury</th>
                      <th className="px-3 py-2">Reinvest</th>
                      <th className="px-3 py-2">Founder</th>
                      <th className="px-3 py-2">Tax</th>
                      <th className="px-3 py-2 text-right font-sans">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.map((w) => {
                      const acc = accounts.find((a) => a.id === w.account_id);
                      const { allocation } = parsePayoutAllocation(w.notes);
                      return (
                        <tr key={w.id} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-fog-300">{w.withdrawn_on}</td>
                          <td className="px-3 py-2 font-sans text-fog-100">{acc?.label ?? "—"}</td>
                          <td className="px-3 py-2 text-emerald-400 font-bold">
                            {formatCurrency(Number(w.amount))}
                          </td>
                          <td className="px-3 py-2 text-amber-300">
                            {allocation.treasury > 0 ? formatCurrency(allocation.treasury) : "—"}
                          </td>
                          <td className="px-3 py-2 text-sky-300">
                            {allocation.reinvestment > 0
                              ? formatCurrency(allocation.reinvestment)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-emerald-300">
                            {allocation.founder_draw > 0
                              ? formatCurrency(allocation.founder_draw)
                              : "—"}
                          </td>
                          <td className="px-3 py-2 text-purple-300">
                            {allocation.tax_reserve > 0 ? formatCurrency(allocation.tax_reserve) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAllocationsOpen(false);
                                setEditingPayout(w);
                              }}
                              className="text-gold hover:underline text-[11px]"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-fog-600 font-sans">
                          No withdrawals recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsAllocationsOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-200 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: EDIT PAYOUT ALLOCATION */}
      {editingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-ink-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-fog-100">
                  Adjust Payout Allocation
                </h3>
                <p className="text-xs text-fog-400">
                  Disbursement of {formatCurrency(Number(editingPayout.amount))} on{" "}
                  {editingPayout.withdrawn_on}
                </p>
              </div>
              <button
                onClick={() => setEditingPayout(null)}
                className="text-fog-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await updatePropPayoutAllocationAction(formData);
                setEditingPayout(null);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="id" value={editingPayout.id} />

              {/* Preset quick buttons */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-fog-400">Quick Split Presets:</span>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const total = Number(editingPayout.amount);
                      setEditAllocTreasury(Math.round(total * 0.4));
                      setEditAllocReinvestment(Math.round(total * 0.2));
                      setEditAllocFounder(Math.round(total * 0.3));
                      setEditAllocTax(total - Math.round(total * 0.4) - Math.round(total * 0.2) - Math.round(total * 0.3));
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                  >
                    40/20/30/10
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const total = Number(editingPayout.amount);
                      setEditAllocTreasury(Math.round(total * 0.5));
                      setEditAllocReinvestment(0);
                      setEditAllocFounder(total - Math.round(total * 0.5));
                      setEditAllocTax(0);
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                  >
                    50/50
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const total = Number(editingPayout.amount);
                      setEditAllocTreasury(total);
                      setEditAllocReinvestment(0);
                      setEditAllocFounder(0);
                      setEditAllocTax(0);
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-fog-300 transition"
                  >
                    100% Corp
                  </button>
                </div>
              </div>

              {/* Four Allocation Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-amber-300 font-medium block mb-1">
                    🏛️ Flectēre Treasury ($)
                  </label>
                  <input
                    name="alloc_treasury"
                    type="number"
                    step="0.01"
                    defaultValue={
                      parsePayoutAllocation(editingPayout.notes).allocation.treasury || 0
                    }
                    value={editAllocTreasury !== 0 ? editAllocTreasury : undefined}
                    onChange={(e) => setEditAllocTreasury(Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-sky-300 font-medium block mb-1">
                    🔄 Desk Reinvestment ($)
                  </label>
                  <input
                    name="alloc_reinvestment"
                    type="number"
                    step="0.01"
                    defaultValue={
                      parsePayoutAllocation(editingPayout.notes).allocation.reinvestment || 0
                    }
                    value={editAllocReinvestment !== 0 ? editAllocReinvestment : undefined}
                    onChange={(e) => setEditAllocReinvestment(Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-300 font-medium block mb-1">
                    👤 Founder Dividends ($)
                  </label>
                  <input
                    name="alloc_founder"
                    type="number"
                    step="0.01"
                    defaultValue={
                      parsePayoutAllocation(editingPayout.notes).allocation.founder_draw || 0
                    }
                    value={editAllocFounder !== 0 ? editAllocFounder : undefined}
                    onChange={(e) => setEditAllocFounder(Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-purple-300 font-medium block mb-1">
                    🛡️ Tax &amp; Reserve ($)
                  </label>
                  <input
                    name="alloc_tax"
                    type="number"
                    step="0.01"
                    defaultValue={
                      parsePayoutAllocation(editingPayout.notes).allocation.tax_reserve || 0
                    }
                    value={editAllocTax !== 0 ? editAllocTax : undefined}
                    onChange={(e) => setEditAllocTax(Number(e.target.value))}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Reference Notes / Wire Memo</label>
                <input
                  name="notes"
                  defaultValue={parsePayoutAllocation(editingPayout.notes).cleanNotes}
                  className={inputClasses}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPayout(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-fog-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className={submitClasses}>
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
