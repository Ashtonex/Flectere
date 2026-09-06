"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/hub/analytics";
import { armName, clientName, labelize } from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Invoice,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";

interface ArmRow {
  arm: BusinessArm;
  serviceCount: number;
  clientCount: number;
  leadCount: number;
  activityCount: number;
  pipelineValue: number;
  weightedPipeline: number;
  receivedRevenue: number;
  bookedRevenue: number;
  expectedRevenue: number;
  progress: number | null;
}

interface ExecutiveDashboardClientProps {
  initialClients: Client[];
  initialLeads: Lead[];
  initialArms: BusinessArm[];
  initialServices: Service[];
  initialOpportunities: CrmOpportunity[];
  initialActivities: CrmActivity[];
  initialRevenue: RevenueRecord[];
  initialInvoices: Invoice[];
  initialArmRows: ArmRow[];
  receivedRevenue: number;
  bookedRevenue: number;
  expectedRevenue: number;
  pipeline: number;
  weighted: number;
  unpaidInvoices: number;
}

type TabType = "overview" | "divisions" | "cashflow" | "pipeline" | "activity";

export function ExecutiveDashboardClient({
  initialClients,
  initialLeads,
  initialArms,
  initialServices,
  initialOpportunities,
  initialActivities,
  initialRevenue,
  initialInvoices,
  initialArmRows,
  receivedRevenue,
  bookedRevenue,
  expectedRevenue,
  pipeline,
  weighted,
  unpaidInvoices,
}: ExecutiveDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArmFilter, setSelectedArmFilter] = useState<string>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");

  // Computed metrics
  const activeOpportunities = useMemo(
    () => initialOpportunities.filter((item) => !["won", "lost"].includes(item.stage)),
    [initialOpportunities]
  );

  const overdueInvoices = useMemo(
    () => initialInvoices.filter((inv) => inv.status === "overdue"),
    [initialInvoices]
  );
  const overdueTotal = useMemo(
    () => overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    [overdueInvoices]
  );

  const pendingInvoices = useMemo(
    () => initialInvoices.filter((inv) => ["sent", "overdue", "draft"].includes(inv.status)),
    [initialInvoices]
  );

  const paidInvoices = useMemo(
    () => initialInvoices.filter((inv) => inv.status === "paid"),
    [initialInvoices]
  );

  // Cash collection efficiency
  const totalInvoicedOrCollected = receivedRevenue + unpaidInvoices;
  const collectionRate =
    totalInvoicedOrCollected > 0
      ? Math.round((receivedRevenue / totalInvoicedOrCollected) * 100)
      : 100;

  // Filtered Divisions
  const filteredArmRows = useMemo(() => {
    return initialArmRows.filter((row) => {
      const matchesSearch =
        searchQuery === "" ||
        row.arm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.arm.sector && row.arm.sector.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [initialArmRows, searchQuery]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    return initialOpportunities.filter((opp) => {
      const matchesSearch =
        searchQuery === "" ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName(opp.client_id, initialClients).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArm =
        selectedArmFilter === "all" || opp.business_arm_id === selectedArmFilter;
      const matchesStage =
        selectedStageFilter === "all" || opp.stage === selectedStageFilter;
      return matchesSearch && matchesArm && matchesStage;
    });
  }, [initialOpportunities, searchQuery, selectedArmFilter, selectedStageFilter, initialClients]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return initialInvoices.filter((inv) => {
      const matchesSearch =
        searchQuery === "" ||
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName(inv.client_id, initialClients).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArm =
        selectedArmFilter === "all" || inv.business_arm_id === selectedArmFilter;
      return matchesSearch && matchesArm;
    });
  }, [initialInvoices, searchQuery, selectedArmFilter, initialClients]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return initialActivities.filter((act) => {
      const matchesSearch =
        searchQuery === "" ||
        act.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName(act.client_id, initialClients).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArm =
        selectedArmFilter === "all" || act.business_arm_id === selectedArmFilter;
      return matchesSearch && matchesArm;
    });
  }, [initialActivities, searchQuery, selectedArmFilter, initialClients]);

  return (
    <div className="space-y-8">
      {/* Header & Quick Launchers */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl md:text-3xl text-fog-100 tracking-tight">
              Executive Cockpit
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-widest2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Synced
            </span>
          </div>
          <p className="mt-1 text-xs md:text-sm text-fog-400">
            Enterprise orchestration across 14 divisions, deal pipeline, real-time invoicing, and client liquidity.
          </p>
        </div>

        {/* Action Center Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual-Engine Mode Switcher */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs shadow-inner">
            <span className="rounded-lg bg-gold px-3 py-1.5 font-bold text-ink-950 shadow-sm flex items-center gap-1.5">
              <span>📊</span> Executive Grid
            </span>
            <Link
              href="/hub/universe"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>🌌</span> 3D Constellation
            </Link>
          </div>

          <Link
            href="/hub/invoices"
            className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-2 text-xs font-semibold text-gold transition-all hover:bg-gold hover:text-ink-950 shadow-sm"
          >
            <span>+</span> Issue Invoice
          </Link>
          <Link
            href="/hub/crm"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-fog-200 transition-all hover:border-gold/50 hover:text-gold"
          >
            <span>+</span> New Deal
          </Link>
          <Link
            href="/hub/arms"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-fog-200 transition-all hover:border-white/20 hover:text-white"
          >
            <span>🏛️</span> Arms & Sectors
          </Link>
        </div>
      </div>

      {/* Primary Executive Metric HUD */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {/* Real Cash Collected */}
        <div className="relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-white/[0.02] to-transparent p-4 md:p-5 shadow-lg shadow-gold/5">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest2 text-gold font-bold">
            <span>Cash Received</span>
            <span className="text-[10px] rounded bg-gold/20 px-1.5 py-0.5 text-gold-light border border-gold/40">
              Settled
            </span>
          </div>
          <p className="mt-2 font-display text-2xl md:text-3xl text-fog-100 font-bold tracking-tight">
            {formatCurrency(receivedRevenue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fog-400">
            <span>Efficiency:</span>
            <span className="font-mono text-emerald-400 font-semibold">{collectionRate}% collected</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-gold to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.min(100, collectionRate)}%` }}
            />
          </div>
        </div>

        {/* Overdue / Collections Alert */}
        <div
          className={`relative overflow-hidden rounded-xl border p-4 md:p-5 shadow-lg transition-all ${
            overdueTotal > 0
              ? "border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-white/[0.02] to-transparent"
              : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-widest2 font-bold">
            <span className={overdueTotal > 0 ? "text-rose-400" : "text-fog-400"}>
              Overdue Invoices
            </span>
            {overdueTotal > 0 && (
              <span className="text-[10px] rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-300 border border-rose-500/40 animate-pulse">
                Action Req.
              </span>
            )}
          </div>
          <p className="mt-2 font-display text-2xl md:text-3xl text-fog-100 font-bold tracking-tight">
            {formatCurrency(overdueTotal)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fog-400">
            <span>Total Unpaid:</span>
            <span className="font-mono text-fog-200">{formatCurrency(unpaidInvoices)}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-fog-500">
            {overdueInvoices.length} overdue out of {pendingInvoices.length} active invoices
          </div>
        </div>

        {/* Weighted Deal Pipeline */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest2 text-fog-400 font-bold">
            <span>Weighted Pipeline</span>
            <span className="text-[10px] rounded bg-white/5 px-1.5 py-0.5 text-fog-400 border border-white/10">
              Risk-Adjusted
            </span>
          </div>
          <p className="mt-2 font-display text-2xl md:text-3xl text-fog-100 font-bold tracking-tight">
            {formatCurrency(weighted)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fog-400">
            <span>Unweighted Total:</span>
            <span className="font-mono text-fog-200">{formatCurrency(pipeline)}</span>
          </div>
          <div className="mt-1.5 text-[10px] text-fog-500 font-mono">
            {activeOpportunities.length} active enterprise deals
          </div>
        </div>

        {/* Enterprise Operations Summary */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-widest2 text-fog-400 font-bold">
            <span>Portfolio Scope</span>
            <span className="text-[10px] rounded bg-white/5 px-1.5 py-0.5 text-fog-400 border border-white/10">
              Coverage
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-2xl md:text-3xl text-fog-100 font-bold tracking-tight">
              {initialClients.length}
            </span>
            <span className="text-xs text-fog-500">Clients</span>
            <span className="text-fog-700">·</span>
            <span className="font-display text-2xl md:text-3xl text-fog-100 font-bold tracking-tight">
              {initialArms.length}
            </span>
            <span className="text-xs text-fog-500">Arms</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-fog-400">
            <span>Inbound Leads:</span>
            <span className="font-mono text-fog-200">{initialLeads.length} leads</span>
          </div>
          <div className="mt-1.5 text-[10px] text-fog-500 font-mono">
            {initialServices.length} active service capabilities
          </div>
        </div>
      </div>

      {/* Control Bar: View Tabs & Omnisearch Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-gold text-ink-950 shadow"
                : "text-fog-400 hover:bg-white/5 hover:text-fog-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("divisions")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "divisions"
                ? "bg-gold text-ink-950 shadow"
                : "text-fog-400 hover:bg-white/5 hover:text-fog-200"
            }`}
          >
            Divisions & Arms
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
              {initialArms.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("cashflow")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "cashflow"
                ? "bg-gold text-ink-950 shadow"
                : "text-fog-400 hover:bg-white/5 hover:text-fog-200"
            }`}
          >
            Cashflow & Invoices
            {overdueInvoices.length > 0 && (
              <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                {overdueInvoices.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "pipeline"
                ? "bg-gold text-ink-950 shadow"
                : "text-fog-400 hover:bg-white/5 hover:text-fog-200"
            }`}
          >
            Pipeline Deals
            <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px]">
              {activeOpportunities.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "activity"
                ? "bg-gold text-ink-950 shadow"
                : "text-fog-400 hover:bg-white/5 hover:text-fog-200"
            }`}
          >
            Audit Telemetry
          </button>
        </div>

        {/* Global Omnisearch & Arm Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-fog-100 placeholder-fog-600 outline-none transition focus:border-gold/50 focus:bg-white/[0.05]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-fog-500 hover:text-fog-300"
              >
                ×
              </button>
            )}
          </div>

          {(activeTab === "pipeline" || activeTab === "cashflow" || activeTab === "activity") && (
            <select
              value={selectedArmFilter}
              onChange={(e) => setSelectedArmFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-900 px-2.5 py-1.5 text-xs text-fog-300 outline-none focus:border-gold/50"
            >
              <option value="all">All Arms</option>
              {initialArms.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === "pipeline" && (
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-900 px-2.5 py-1.5 text-xs text-fog-300 outline-none focus:border-gold/50"
            >
              <option value="all">All Stages</option>
              <option value="lead">Lead</option>
              <option value="discovery">Discovery</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          )}
        </div>
      </div>

      {/* Tab 1: Overview Cockpit */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Overdue Alert Banner if applicable */}
          {overdueInvoices.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 font-bold text-lg">
                  ⚠️
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-rose-200">
                    {overdueInvoices.length} Overdue {overdueInvoices.length === 1 ? "Invoice Requires" : "Invoices Require"} Wire Confirmation
                  </h3>
                  <p className="text-xs text-rose-400/80">
                    A total of <span className="font-mono font-bold text-white">{formatCurrency(overdueTotal)}</span> in revenue is currently past the scheduled maturity date.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("cashflow")}
                  className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-ink-950 transition hover:bg-rose-400 shadow"
                >
                  Review Overdue Now
                </button>
                <Link
                  href="/hub/invoices"
                  className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                >
                  Billing Hub ➔
                </Link>
              </div>
            </div>
          )}

          {/* Dual Split: Divisions Matrix & Quick Pipeline */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Top Division Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm uppercase tracking-wider text-fog-300 font-bold">
                    Primary Division Performance
                  </h2>
                  <p className="text-xs text-fog-500">Revenue attribution and client engagements by arm</p>
                </div>
                <button
                  onClick={() => setActiveTab("divisions")}
                  className="text-xs text-gold hover:underline font-medium"
                >
                  View All 14 Arms ➔
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                    <tr>
                      <th className="px-4 py-3">Business Arm</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3 text-center">Clients</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Pipeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {initialArmRows.slice(0, 6).map((row) => (
                      <tr key={row.arm.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-fog-100">{row.arm.name}</div>
                          <div className="text-[10px] text-fog-500 capitalize">Status: {row.arm.status}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-fog-400 border border-white/5">
                            {row.arm.sector || "Advisory"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-fog-300 font-mono">
                          {row.clientCount}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-fog-200">
                          {formatCurrency(row.receivedRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-fog-400">
                          {formatCurrency(row.pipelineValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* High Impact Deals & Recent Telemetry */}
            <div className="space-y-6">
              {/* High Probability Deals */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-xs uppercase tracking-widest2 text-fog-400 font-bold">
                    Active High-Value Deals
                  </h3>
                  <button
                    onClick={() => setActiveTab("pipeline")}
                    className="text-xs text-gold hover:underline font-medium"
                  >
                    View All ({activeOpportunities.length}) ➔
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {activeOpportunities.slice(0, 4).map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-gold/30 hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-fog-100">{opp.title}</p>
                          <p className="text-xs text-fog-500">
                            {clientName(opp.client_id, initialClients)} · {armName(opp.business_arm_id, initialArms)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-bold text-gold">
                            {formatCurrency(opp.value)}
                          </p>
                          <span className="text-[10px] text-fog-400 font-mono">
                            {opp.probability}% prob
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeOpportunities.length === 0 && (
                    <p className="py-4 text-center text-xs text-fog-600">
                      No active pipeline opportunities open.
                    </p>
                  )}
                </div>
              </div>

              {/* Audit Feed Snippet */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-xs uppercase tracking-widest2 text-fog-400 font-bold">
                    Recent Activity
                  </h3>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className="text-xs text-fog-400 hover:text-white"
                  >
                    All ➔
                  </button>
                </div>
                <ul className="mt-3 divide-y divide-white/5">
                  {initialActivities.slice(0, 4).map((act) => (
                    <li key={act.id} className="py-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-fog-200 truncate max-w-[180px]">{act.subject}</span>
                        <span className="text-[10px] text-fog-500 font-mono">
                          {new Date(act.activity_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-fog-500">
                        {labelize(act.activity_type)} · {clientName(act.client_id, initialClients)}
                      </p>
                    </li>
                  ))}
                  {initialActivities.length === 0 && (
                    <li className="py-2 text-xs text-fog-600">No activity logged.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Pending Invoices Action Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm uppercase tracking-wider text-fog-300 font-bold">
                  Pending & Overdue Invoices
                </h2>
                <p className="text-xs text-fog-500">
                  Accounts receivable awaiting corporate wire execution or settlement confirmation
                </p>
              </div>
              <Link
                href="/hub/invoices"
                className="text-xs text-gold hover:underline font-medium"
              >
                Invoices Cockpit ({initialInvoices.length}) ➔
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Division</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingInvoices.slice(0, 6).map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-fog-100">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-fog-200 font-medium">
                        {clientName(inv.client_id, initialClients)}
                      </td>
                      <td className="px-4 py-3 text-fog-400 text-xs">
                        {armName(inv.business_arm_id, initialArms)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            inv.status === "overdue"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : inv.status === "sent"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              : "bg-white/5 text-fog-400 border border-white/10"
                          }`}
                        >
                          {labelize(inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="px-4 py-3 text-fog-500 text-xs font-mono">
                        {inv.due_on ? new Date(inv.due_on).toLocaleDateString() : "Immediate"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/hub/invoices"
                          className="rounded bg-gold/10 hover:bg-gold hover:text-ink-950 text-gold text-xs font-semibold px-2.5 py-1 transition border border-gold/30"
                        >
                          Validate ➔
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {pendingInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                        All invoices are fully settled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Divisions & Arms Performance Matrix */}
      {activeTab === "divisions" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-display text-fog-100">Division Breakdown & Capacity</h2>
              <p className="text-xs text-fog-500">
                14 specialized operating arms spanning Sovereign Advisory, Defense, AI Systems, and Capital
              </p>
            </div>
            <Link
              href="/hub/arms"
              className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold hover:text-ink-950 transition"
            >
              + Add New Business Arm
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArmRows.map((row) => (
              <div
                key={row.arm.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-gold/30 hover:bg-white/[0.04] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base text-fog-100 font-semibold">
                      {row.arm.name}
                    </h3>
                    <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-fog-400 uppercase tracking-widest2">
                      {row.arm.sector || "Division"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-fog-500 capitalize">
                    Status: <span className="text-fog-300">{row.arm.status}</span>
                  </p>
                  {row.arm.description && (
                    <p className="mt-2 text-xs text-fog-400 line-clamp-2">
                      {row.arm.description}
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest2 text-fog-500 block">Revenue</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {formatCurrency(row.receivedRevenue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest2 text-fog-500 block">Pipeline</span>
                    <span className="font-mono font-semibold text-fog-200">
                      {formatCurrency(row.pipelineValue)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] uppercase tracking-widest2 text-fog-500 block">Clients</span>
                    <span className="font-mono text-fog-300">{row.clientCount} Active</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[10px] uppercase tracking-widest2 text-fog-500 block">Services</span>
                    <span className="font-mono text-fog-300">{row.serviceCount} Catalog</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cashflow & Invoicing Cockpit */}
      {activeTab === "cashflow" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-display text-fog-100">Cashflow & Receivables Intelligence</h2>
              <p className="text-xs text-fog-500">
                Direct monitoring of accounts receivable, wire statuses, and liquidity collection
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/hub/invoices"
                className="rounded-lg border border-gold/40 bg-gold px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition"
              >
                + Issue New Invoice
              </Link>
            </div>
          </div>

          {/* Quick Cash Flow Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <span className="text-xs uppercase tracking-widest2 text-emerald-400 font-bold">
                Collected Revenue
              </span>
              <p className="mt-2 font-display text-2xl text-fog-100 font-bold">
                {formatCurrency(receivedRevenue)}
              </p>
              <p className="mt-1 text-xs text-fog-500">{paidInvoices.length} settled invoices</p>
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <span className="text-xs uppercase tracking-widest2 text-rose-400 font-bold">
                Overdue Receivables
              </span>
              <p className="mt-2 font-display text-2xl text-rose-300 font-bold">
                {formatCurrency(overdueTotal)}
              </p>
              <p className="mt-1 text-xs text-fog-500">{overdueInvoices.length} invoices past due date</p>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
              <span className="text-xs uppercase tracking-widest2 text-sky-400 font-bold">
                Invoiced / In Flight
              </span>
              <p className="mt-2 font-display text-2xl text-sky-200 font-bold">
                {formatCurrency(unpaidInvoices)}
              </p>
              <p className="mt-1 text-xs text-fog-500">Pending client clearance</p>
            </div>
          </div>

          {/* Complete Invoices Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-fog-100">
                      {inv.invoice_number}
                    </td>
                    <td className="px-4 py-3 text-fog-200">
                      {clientName(inv.client_id, initialClients)}
                    </td>
                    <td className="px-4 py-3 text-fog-400 text-xs">
                      {armName(inv.business_arm_id, initialArms)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === "paid"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : inv.status === "overdue"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : inv.status === "sent"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : "bg-white/5 text-fog-400 border border-white/10"
                        }`}
                      >
                        {labelize(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-fog-500 text-xs font-mono">
                      {inv.due_on ? new Date(inv.due_on).toLocaleDateString() : "Immediate"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href="/hub/invoices"
                        className="rounded bg-white/5 hover:bg-gold hover:text-ink-950 text-fog-300 text-xs font-semibold px-2.5 py-1 transition border border-white/10"
                      >
                        Details ➔
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                      No invoices match the current query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Pipeline & Deals */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-display text-fog-100">Enterprise Opportunity Pipeline</h2>
              <p className="text-xs text-fog-500">
                Probability-weighted valuation, contract extraction metrics, and deal closing velocity
              </p>
            </div>
            <Link
              href="/hub/crm"
              className="rounded-lg border border-gold/40 bg-gold px-3 py-1.5 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition"
            >
              Open Full CRM Board ➔
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                <tr>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Arm</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Probability</th>
                  <th className="px-4 py-3">Expected Val</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-fog-100">{opp.title}</span>
                      {opp.expected_close_on && (
                        <div className="text-[10px] text-fog-500 font-mono">
                          Close: {new Date(opp.expected_close_on).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fog-300 font-medium">
                      {clientName(opp.client_id, initialClients)}
                    </td>
                    <td className="px-4 py-3 text-fog-400 text-xs">
                      {armName(opp.business_arm_id, initialArms)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fog-300">
                        {labelize(opp.stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatCurrency(opp.value)}
                    </td>
                    <td className="px-4 py-3 font-mono text-fog-400">
                      {opp.probability}%
                    </td>
                    <td className="px-4 py-3 font-mono text-gold font-semibold">
                      {formatCurrency((Number(opp.value) * Number(opp.probability)) / 100)}
                    </td>
                  </tr>
                ))}
                {filteredOpportunities.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                      No deals match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Telemetry */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-display text-fog-100">Audit & Engagement Telemetry</h2>
            <p className="text-xs text-fog-500">
              Chronological log of executive actions, client touchpoints, and system events
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.01]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Event / Action</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Division</th>
                  <th className="px-4 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-fog-500">
                      {new Date(act.activity_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-fog-100 font-medium">
                      {act.subject}
                      {act.outcome && <p className="text-xs text-fog-400 mt-0.5">Outcome: {act.outcome}</p>}
                      {act.next_step && <p className="text-xs text-gold/80 mt-0.5">Next: {act.next_step}</p>}
                    </td>
                    <td className="px-4 py-3 text-fog-300">
                      {clientName(act.client_id, initialClients)}
                    </td>
                    <td className="px-4 py-3 text-fog-400 text-xs">
                      {armName(act.business_arm_id, initialArms)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-fog-400 uppercase tracking-widest2">
                        {labelize(act.activity_type)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredActivities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-fog-600">
                      No activities match the search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
