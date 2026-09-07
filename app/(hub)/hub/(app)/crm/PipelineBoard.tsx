"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  armName,
  clientName,
  computeContractExtraction,
  computeOpportunityActivityHealth,
  getActivityBadgeColor,
  getActivityIcon,
  callOutcomes,
  meetingTypes,
  labelize,
  leadName,
  opportunityStages,
  activityTypes,
  revenueStatuses,
} from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import { ArmDetailModal } from "@/components/hub/ArmDetailModal";

import {
  createOpportunityAction,
  updateOpportunityAction,
  deleteOpportunityAction,
  createActivityAction,
  deleteActivityAction,
  createRevenueRecordAction,
  updateOpportunityStageAction,
} from "./actions";

interface PipelineBoardProps {
  initialOpportunities: CrmOpportunity[];
  clients: Client[];
  leads: Lead[];
  arms: BusinessArm[];
  services: Service[];
  revenueRecords: RevenueRecord[];
  activities?: CrmActivity[];
}

const STAGE_CONFIG: Record<
  CrmOpportunity["stage"],
  { label: string; tone: string; borderTone: string; badgeTone: string }
> = {
  lead: {
    label: "Inbound / Lead",
    tone: "text-fog-300",
    borderTone: "border-white/10",
    badgeTone: "bg-white/10 text-fog-300",
  },
  qualified: {
    label: "Qualified",
    tone: "text-sky-400",
    borderTone: "border-sky-500/20",
    badgeTone: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  },
  proposal: {
    label: "Proposal Sent",
    tone: "text-amber-400",
    borderTone: "border-amber-500/20",
    badgeTone: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  negotiation: {
    label: "Negotiation",
    tone: "text-purple-400",
    borderTone: "border-purple-500/20",
    badgeTone: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  },
  won: {
    label: "Won / Active",
    tone: "text-emerald-400",
    borderTone: "border-emerald-500/20",
    badgeTone: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  },
  lost: {
    label: "Lost / Archive",
    tone: "text-rose-400",
    borderTone: "border-rose-500/20",
    badgeTone: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
  },
};

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";

export function PipelineBoard({
  initialOpportunities,
  clients,
  leads,
  arms,
  services,
  revenueRecords,
  activities = [],
}: PipelineBoardProps) {
  const [modalMode, setModalMode] = useState<"deal" | "activity" | "revenue" | null>(null);
  const [editingDeal, setEditingDeal] = useState<CrmOpportunity | null>(null);
  const [editDealTab, setEditDealTab] = useState<"details" | "activities" | "log">("details");
  const [dealLogActivityTab, setDealLogActivityTab] = useState<"call" | "meeting" | "note" | "email">("call");
  const [selectedArmFilter, setSelectedArmFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedArmForModal, setSelectedArmForModal] = useState<BusinessArm | null>(null);

  // Global activity modal states
  const [activityModalOppId, setActivityModalOppId] = useState<string>("");
  const [activityModalTypeTab, setActivityModalTypeTab] = useState<"call" | "meeting" | "note" | "email">("call");

  // Retainer interactive state in Create Deal modal
  const [isRetained, setIsRetained] = useState(false);
  const [setupFeeInput, setSetupFeeInput] = useState<string>("");
  const [monthlyRetainerInput, setMonthlyRetainerInput] = useState<string>("");
  const [retainerMonthsInput, setRetainerMonthsInput] = useState<string>("12");

  // Edit deal retainer interactive state
  const [editIsRetained, setEditIsRetained] = useState(false);
  const [editSetupFee, setEditSetupFee] = useState<string>("");
  const [editMonthlyRetainer, setEditMonthlyRetainer] = useState<string>("");
  const [editRetainerMonths, setEditRetainerMonths] = useState<string>("12");

  // Direct revenue interactive state
  const [revenueClientId, setRevenueClientId] = useState<string>("");
  const [revenueArmId, setRevenueArmId] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);

  // Calculate live actual cash extracted/recovered for each deal
  function getDealRecovery(opportunity: CrmOpportunity) {
    const linkedRevenue = revenueRecords.filter((r) => r.opportunity_id === opportunity.id);
    const actualReceived = linkedRevenue
      .filter((r) => r.status === "received")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const clientRevenue = opportunity.client_id
      ? revenueRecords
          .filter((r) => r.client_id === opportunity.client_id && r.status === "received")
          .reduce((sum, r) => sum + Number(r.amount), 0)
      : 0;

    const totalCashCollected = actualReceived > 0 ? actualReceived : clientRevenue;
    const extraction = computeContractExtraction(opportunity, totalCashCollected);

    return {
      totalCashCollected,
      extraction,
    };
  }

  const filteredOpportunities = initialOpportunities.filter((opp) => {
    if (selectedArmFilter !== "all" && opp.business_arm_id !== selectedArmFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchClient = clientName(opp.client_id, clients).toLowerCase().includes(q);
      const matchArm = armName(opp.business_arm_id, arms).toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchArm) return false;
    }
    return true;
  });

  function openEditModal(deal: CrmOpportunity, initialTab: "details" | "activities" | "log" = "details") {
    setEditingDeal(deal);
    setEditDealTab(initialTab);
    const hasRetainer = Boolean(deal.monthly_recurring && deal.monthly_recurring > 0);
    setEditIsRetained(hasRetainer);
    setEditSetupFee(deal.setup_fee ? String(deal.setup_fee) : "");
    setEditMonthlyRetainer(deal.monthly_recurring ? String(deal.monthly_recurring) : "");
    setEditRetainerMonths(deal.contract_months ? String(deal.contract_months) : "12");
  }

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & Action Modals */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter deals, clients, or arms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 sm:w-72 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-100 placeholder-fog-600 focus:border-gold/50 outline-none"
            />
          </div>

          <select
            value={selectedArmFilter}
            onChange={(e) => setSelectedArmFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-200 outline-none focus:border-gold/50 cursor-pointer"
          >
            <option value="all">All Business Arms ({arms.length})</option>
            {arms.map((arm) => (
              <option key={arm.id} value={arm.id}>
                {arm.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsRetained(false);
              setSetupFeeInput("");
              setMonthlyRetainerInput("");
              setRetainerMonthsInput("12");
              setModalMode("deal");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-gold-bright shadow-sm cursor-pointer"
          >
            <span>+</span> New Deal
          </button>
          <button
            onClick={() => setModalMode("activity")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-fog-200 transition hover:border-white/20 hover:text-white cursor-pointer"
          >
            <span>📝</span> Log Activity
          </button>
          <button
            onClick={() => setModalMode("revenue")}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 cursor-pointer"
          >
            <span>💵</span> Record Revenue
          </button>
        </div>
      </div>

      {/* Kanban Pipeline Stage Columns - Horizontal Scroll Container with Fixed Height */}
      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1500px] items-start">
          {opportunityStages.map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const stageDeals = filteredOpportunities.filter((o) => o.stage === stage);
            const stageValue = stageDeals.reduce((sum, o) => {
              const { extraction } = getDealRecovery(o);
              return sum + Number(extraction.totalContractValue || o.value || 0);
            }, 0);

            return (
              <div
                key={stage}
                className="w-72 shrink-0 flex flex-col rounded-xl border border-white/10 bg-white/[0.015] p-3 max-h-[750px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3 shrink-0">
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${cfg.tone}`}>
                      {cfg.label}
                    </h3>
                    <p className="text-[10px] font-mono text-fog-500 mt-0.5">
                      {stageDeals.length} {stageDeals.length === 1 ? "deal" : "deals"} • {formatCurrency(stageValue)}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold rounded-full bg-white/5 px-2 py-0.5 text-fog-400">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Cards Container: Independently Scrollable */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {stageDeals.map((deal) => {
                    const { totalCashCollected, extraction } = getDealRecovery(deal);
                    const isUpdating = updatingId === deal.id;

                    return (
                      <div
                        key={deal.id}
                        className={`group rounded-lg border border-white/10 bg-ink-950/70 p-3.5 space-y-2.5 transition hover:border-gold/50 hover:bg-ink-950 shadow-sm ${
                          isUpdating ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        {/* Header: Arm & Probability */}
                        <div className="flex items-start justify-between gap-1.5">
                          {(() => {
                            const dealArm = arms.find((a) => a.id === deal.business_arm_id);
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (dealArm) {
                                    setSelectedArmForModal(dealArm);
                                  }
                                }}
                                title="Click to inspect Business Arm dossier & subscribers"
                                className="rounded bg-gold/10 hover:bg-gold/25 hover:text-gold-bright border border-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold truncate max-w-[140px] text-left transition cursor-pointer"
                              >
                                {armName(deal.business_arm_id, arms)} ℹ️
                              </button>
                            );
                          })()}
                          <span className="shrink-0 text-[10px] font-mono font-bold text-fog-400">
                            {deal.probability}%
                          </span>
                        </div>


                        {/* Title & Client Link */}
                        <div>
                          <button
                            type="button"
                            onClick={() => openEditModal(deal)}
                            className="text-left font-bold text-xs text-fog-100 hover:text-gold transition leading-snug cursor-pointer group-hover:underline"
                          >
                            {deal.title}
                          </button>
                          <p className="text-[11px] text-fog-400 mt-0.5 truncate">
                            {deal.client_id
                              ? clientName(deal.client_id, clients)
                              : deal.lead_id
                              ? `Lead: ${leadName(deal.lead_id, leads)}`
                              : "Unassigned entity"}
                          </p>
                        </div>

                        {/* Retainer Badge if Applicable */}
                        {deal.monthly_recurring && deal.monthly_recurring > 0 && (
                          <div className="rounded bg-white/[0.03] border border-white/5 px-2 py-1 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-gold font-semibold">
                              {formatCurrency(deal.monthly_recurring)}/mo
                            </span>
                            <span className="text-fog-500">
                              {deal.contract_months ?? 12} mo retainer
                            </span>
                          </div>
                        )}

                        {/* Contract Value & Actual Recovery Percentage */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <div className="flex items-baseline justify-between text-xs">
                            <div>
                              <span className="text-[9px] uppercase text-fog-500 block">Total Value</span>
                              <span className="font-mono font-bold text-white">
                                {formatCurrency(extraction.totalContractValue, deal.currency)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] uppercase text-fog-500 block">Recovered</span>
                              <span
                                className={`text-[10px] font-mono font-bold ${
                                  extraction.extractionPercent > 0
                                    ? "text-emerald-400"
                                    : "text-fog-400"
                                }`}
                              >
                                {extraction.extractionPercent}% ({formatCurrency(totalCashCollected)})
                              </span>
                            </div>
                          </div>

                          {/* Progress bar visual for cash recovered */}
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gold to-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, extraction.extractionPercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expected Close Date */}
                        {deal.expected_close_on && (
                          <p className="text-[10px] text-fog-500 font-mono">
                            Target close: {new Date(deal.expected_close_on).toLocaleDateString()}
                          </p>
                        )}

                        {/* Pipedrive-Style Activity Health & Quick Logging */}
                        {(() => {
                          const health = computeOpportunityActivityHealth(deal.id, activities);
                          const dealActivities = activities.filter((a) => a.opportunity_id === deal.id);
                          return (
                            <div className="pt-2 border-t border-white/5 space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono border ${health.badgeTone}`}
                                  title={health.nextStep ? `Next: ${health.nextStep}` : health.label}
                                >
                                  {health.status === "scheduled" && "⏰"}
                                  {health.status === "overdue" && "⚠️"}
                                  {health.status === "no_activity" && "🔴"}
                                  {health.status === "completed" && "✅"}
                                  <span className="truncate max-w-[130px]">
                                    {health.nextStep ? `Next: ${health.nextStep}` : health.label}
                                  </span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => openEditModal(deal, "activities")}
                                  className="text-[10px] font-mono text-fog-400 hover:text-gold transition cursor-pointer"
                                >
                                  💬 {dealActivities.length}
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivityModalOppId(deal.id);
                                    setActivityModalTypeTab("call");
                                    setModalMode("activity");
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 rounded bg-white/[0.04] hover:bg-gold/15 hover:text-gold border border-white/10 px-2 py-1 text-[10px] font-medium text-fog-300 transition cursor-pointer"
                                >
                                  <span>📞</span> Call
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivityModalOppId(deal.id);
                                    setActivityModalTypeTab("note");
                                    setModalMode("activity");
                                  }}
                                  className="flex items-center justify-center gap-1 rounded bg-white/[0.04] hover:bg-white/10 hover:text-white border border-white/10 px-2 py-1 text-[10px] font-medium text-fog-400 transition cursor-pointer"
                                >
                                  <span>📝</span> Note
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Stage Switcher & Quick Edit Action */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(deal, "details")}
                            className="text-[10px] text-gold hover:underline cursor-pointer"
                          >
                            Edit / Expand ➔
                          </button>

                          <form
                            action={async (formData) => {
                              setUpdatingId(deal.id);
                              await updateOpportunityStageAction(formData);
                              setUpdatingId(null);
                            }}
                          >
                            <input type="hidden" name="id" value={deal.id} />
                            <select
                              name="stage"
                              defaultValue={deal.stage}
                              onChange={(e) => e.target.form?.requestSubmit()}
                              className="text-[10px] bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-fog-200 outline-none focus:border-gold/50 cursor-pointer"
                            >
                              {opportunityStages.map((st) => (
                                <option key={st} value={st}>
                                  {labelize(st)}
                                </option>
                              ))}
                            </select>
                          </form>
                        </div>
                      </div>
                    );
                  })}

                  {stageDeals.length === 0 && (
                    <div className="h-32 flex items-center justify-center rounded-lg border border-dashed border-white/5 text-[11px] text-fog-600">
                      No deals in {cfg.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog for Edit Deal / Activities Hub */}
      {editingDeal && (() => {
        const oppActivities = activities.filter((a) => a.opportunity_id === editingDeal.id);
        const activeClient = clients.find((c) => c.id === editingDeal.client_id);
        const activeLead = leads.find((l) => l.id === editingDeal.lead_id);
        const entityName = activeClient?.name ?? (activeLead ? leadName(activeLead.id, leads) : editingDeal.title);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div>
                  <h3 className="font-display text-lg text-fog-100">{editingDeal.title}</h3>
                  <p className="text-xs text-fog-500">
                    {entityName} · {armName(editingDeal.business_arm_id, arms)}
                  </p>
                </div>
                <button
                  onClick={() => setEditingDeal(null)}
                  className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Salesforce Stage Path */}
              <div className="mb-5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-fog-400 uppercase tracking-widest2 font-semibold">Deal Stage Path</span>
                  <span className="text-gold font-mono font-bold">{labelize(editingDeal.stage)}</span>
                </div>
                <div className="grid grid-cols-6 gap-1 p-1 bg-black/50 border border-white/10 rounded-lg">
                  {opportunityStages.map((st) => {
                    const isCurrent = editingDeal.stage === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={async () => {
                          const formData = new FormData();
                          formData.append("id", editingDeal.id);
                          formData.append("stage", st);
                          await updateOpportunityStageAction(formData);
                          setEditingDeal({ ...editingDeal, stage: st });
                        }}
                        className={`py-1.5 text-[10px] rounded text-center transition font-semibold truncate px-1 cursor-pointer ${
                          isCurrent
                            ? "bg-gold text-ink-950 shadow font-bold"
                            : "text-fog-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {labelize(st)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
                <button
                  type="button"
                  onClick={() => setEditDealTab("details")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    editDealTab === "details"
                      ? "bg-white/10 text-white border border-white/15"
                      : "text-fog-400 hover:text-fog-200"
                  }`}
                >
                  Deal Terms & Details
                </button>
                <button
                  type="button"
                  onClick={() => setEditDealTab("activities")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    editDealTab === "activities"
                      ? "bg-white/10 text-white border border-white/15"
                      : "text-fog-400 hover:text-fog-200"
                  }`}
                >
                  <span>Activity History</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
                    {oppActivities.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditDealTab("log")}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    editDealTab === "log"
                      ? "bg-gold/20 text-gold border border-gold/40"
                      : "text-gold/80 hover:text-gold hover:bg-gold/10"
                  }`}
                >
                  <span>+</span> Log Touchpoint
                </button>
              </div>

              {/* TAB 1: Activity History */}
              {editDealTab === "activities" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-fog-400 font-medium">
                      All logged calls, meetings, notes, and milestones for this deal:
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditDealTab("log")}
                      className="rounded bg-gold/10 border border-gold/30 px-2.5 py-1 text-xs text-gold font-semibold hover:bg-gold/20 transition cursor-pointer"
                    >
                      + Log Call or Note
                    </button>
                  </div>

                  {oppActivities.length === 0 ? (
                    <div className="py-10 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                      <p className="text-2xl mb-1">📞</p>
                      <p className="text-sm text-fog-300 font-semibold">No activity recorded yet</p>
                      <p className="text-xs text-fog-500 mt-1 max-w-sm mx-auto">
                        Log calls, discovery meetings, or sales notes just like Salesforce and Pipedrive to track this deal.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDealLogActivityTab("call");
                          setEditDealTab("log");
                        }}
                        className="mt-3 rounded-lg border border-gold/50 bg-gold px-4 py-1.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                      >
                        Log First Call
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {oppActivities.map((act) => {
                        const icon = getActivityIcon(act.activity_type);
                        const colors = getActivityBadgeColor(act.activity_type);
                        return (
                          <div
                            key={act.id}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2 hover:border-white/20 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{icon}</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-fog-100">{act.subject}</h4>
                                    <span
                                      className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}
                                    >
                                      {labelize(act.activity_type)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-fog-500 font-mono mt-0.5">
                                    {new Date(act.activity_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                </div>
                              </div>

                              <form
                                action={async (formData) => {
                                  await deleteActivityAction(formData);
                                }}
                              >
                                <input type="hidden" name="id" value={act.id} />
                                <button
                                  type="submit"
                                  title="Delete this activity log"
                                  className="text-fog-600 hover:text-rose-400 text-xs font-mono transition cursor-pointer p-1"
                                >
                                  ✕
                                </button>
                              </form>
                            </div>

                            {act.outcome && (
                              <div className="rounded bg-black/40 border-l-2 border-gold/60 p-2.5 text-xs text-fog-300 whitespace-pre-wrap">
                                {act.outcome}
                              </div>
                            )}

                            {act.next_step && (
                              <div className="flex items-center gap-1.5 text-[11px] text-gold font-medium">
                                <span className="text-xs">⏰</span>
                                <span>Next: {act.next_step}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Log Touchpoint */}
              {editDealTab === "log" && (
                <div className="space-y-4">
                  {/* Touchpoint Type Selector */}
                  <div className="flex rounded-lg border border-white/10 bg-black/40 p-1">
                    <button
                      type="button"
                      onClick={() => setDealLogActivityTab("call")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        dealLogActivityTab === "call"
                          ? "bg-gold text-ink-950 font-bold"
                          : "text-fog-400 hover:text-white"
                      }`}
                    >
                      <span>📞</span> Log Call
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealLogActivityTab("meeting")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        dealLogActivityTab === "meeting"
                          ? "bg-gold text-ink-950 font-bold"
                          : "text-fog-400 hover:text-white"
                      }`}
                    >
                      <span>🤝</span> Log Meeting
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealLogActivityTab("note")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        dealLogActivityTab === "note"
                          ? "bg-gold text-ink-950 font-bold"
                          : "text-fog-400 hover:text-white"
                      }`}
                    >
                      <span>📝</span> Add Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealLogActivityTab("email")}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        dealLogActivityTab === "email"
                          ? "bg-gold text-ink-950 font-bold"
                          : "text-fog-400 hover:text-white"
                      }`}
                    >
                      <span>✉️</span> Log Email
                    </button>
                  </div>

                  <form
                    action={async (formData) => {
                      await createActivityAction(formData);
                      setEditDealTab("activities");
                    }}
                    className="space-y-3"
                  >
                    <input type="hidden" name="opportunity_id" value={editingDeal.id} />
                    <input type="hidden" name="client_id" value={editingDeal.client_id ?? ""} />
                    <input type="hidden" name="lead_id" value={editingDeal.lead_id ?? ""} />
                    <input type="hidden" name="business_arm_id" value={editingDeal.business_arm_id ?? ""} />
                    <input type="hidden" name="activity_type" value={dealLogActivityTab} />

                    <div>
                      <label className={labelClasses}>Subject *</label>
                      <input
                        name="subject"
                        required
                        defaultValue={
                          dealLogActivityTab === "call"
                            ? `Call with ${entityName}`
                            : dealLogActivityTab === "meeting"
                            ? `Meeting with ${entityName}`
                            : dealLogActivityTab === "email"
                            ? `Email touchpoint with ${entityName}`
                            : `Note on ${editingDeal.title}`
                        }
                        className={inputClasses}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {dealLogActivityTab === "call" && (
                        <div>
                          <label className={labelClasses}>Call Result / Outcome</label>
                          <select name="call_outcome" className={inputClasses}>
                            {callOutcomes.map((co) => (
                              <option key={co.value} value={co.label}>
                                {co.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {dealLogActivityTab === "meeting" && (
                        <div>
                          <label className={labelClasses}>Meeting Type</label>
                          <select name="call_outcome" className={inputClasses}>
                            {meetingTypes.map((mt) => (
                              <option key={mt.value} value={mt.label}>
                                {mt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className={labelClasses}>
                          {dealLogActivityTab === "call" || dealLogActivityTab === "meeting"
                            ? "Duration"
                            : "Date"}
                        </label>
                        {dealLogActivityTab === "call" || dealLogActivityTab === "meeting" ? (
                          <select name="duration" defaultValue="15m" className={inputClasses}>
                            <option value="5m">5 minutes</option>
                            <option value="15m">15 minutes</option>
                            <option value="30m">30 minutes</option>
                            <option value="45m">45 minutes</option>
                            <option value="1h">1 hour</option>
                            <option value="1.5h+">1.5+ hours</option>
                          </select>
                        ) : (
                          <input
                            name="activity_date"
                            type="date"
                            defaultValue={today}
                            className={inputClasses}
                          />
                        )}
                      </div>

                      {(dealLogActivityTab === "call" || dealLogActivityTab === "meeting") && (
                        <div>
                          <label className={labelClasses}>Activity Date</label>
                          <input
                            name="activity_date"
                            type="date"
                            defaultValue={today}
                            className={inputClasses}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelClasses}>
                        {dealLogActivityTab === "call"
                          ? "Call Notes & Takeaways"
                          : dealLogActivityTab === "meeting"
                          ? "Meeting Notes & Decision Makers"
                          : dealLogActivityTab === "email"
                          ? "Email Summary & Correspondence"
                          : "Note Content"}
                      </label>
                      <textarea
                        name="notes"
                        rows={3}
                        required
                        placeholder={
                          dealLogActivityTab === "call"
                            ? "Discussed pricing, operational bottlenecks, client wants draft proposal by Friday..."
                            : "Enter notes and key takeaways..."
                        }
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>Next Action / Follow-up Milestone</label>
                      <input
                        name="next_step"
                        placeholder="e.g. Transmit formal engagement contract by Tuesday"
                        className={inputClasses}
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditDealTab("activities")}
                        className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                      >
                        Save Activity
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: Details & Terms */}
              {editDealTab === "details" && (
                <form
                  action={async (formData) => {
                    await updateOpportunityAction(formData);
                    setEditingDeal(null);
                  }}
                  className="space-y-4"
                >
                  <input type="hidden" name="id" value={editingDeal.id} />

                  <div>
                    <label className={labelClasses}>Deal Title *</label>
                    <input
                      name="title"
                      required
                      defaultValue={editingDeal.title}
                      className={inputClasses}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Client</label>
                      <select name="client_id" defaultValue={editingDeal.client_id ?? ""} className={inputClasses}>
                        <option value="">Unassigned</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Business Arm</label>
                      <select name="business_arm_id" defaultValue={editingDeal.business_arm_id ?? ""} className={inputClasses}>
                        <option value="">No arm selected</option>
                        {arms.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                        {!arms.some((a) => a.name.toLowerCase() === "custom") && (
                          <option value="custom">Custom</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Service Offering</label>
                      <select name="service_id" defaultValue={editingDeal.service_id ?? ""} className={inputClasses}>
                        <option value="">No specific service</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                        {!services.some((s) => s.name.toLowerCase() === "custom") && (
                          <option value="custom">Custom</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Pipeline Stage</label>
                      <select name="stage" defaultValue={editingDeal.stage} className={inputClasses}>
                        {opportunityStages.map((st) => (
                          <option key={st} value={st}>
                            {labelize(st)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Retainer Checkbox Switch */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-fog-100 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsRetained}
                            onChange={(e) => setEditIsRetained(e.target.checked)}
                            className="rounded border-white/20 text-gold focus:ring-gold"
                          />
                          Is this client on a monthly retainer?
                        </label>
                        <p className="text-[11px] text-fog-500 mt-0.5">
                          Flectēre will track recurring MRR, contract length, and expected vs recovered cash.
                        </p>
                      </div>
                      {editIsRetained && (
                        <span className="text-[10px] bg-gold/20 text-gold font-mono font-bold px-2 py-0.5 rounded">
                          RETAINER MODEL
                        </span>
                      )}
                    </div>

                    {editIsRetained && (
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                        <div>
                          <label className={labelClasses}>Setup / Onboarding ($)</label>
                          <input
                            name="setup_fee"
                            type="number"
                            step="0.01"
                            value={editSetupFee}
                            onChange={(e) => setEditSetupFee(e.target.value)}
                            placeholder="e.g. 5000"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>Monthly Retainer ($) *</label>
                          <input
                            name="monthly_recurring"
                            type="number"
                            step="0.01"
                            required={editIsRetained}
                            value={editMonthlyRetainer}
                            onChange={(e) => setEditMonthlyRetainer(e.target.value)}
                            placeholder="e.g. 1500"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className={labelClasses}>Duration (Months)</label>
                          <input
                            name="contract_months"
                            type="number"
                            min="1"
                            value={editRetainerMonths}
                            onChange={(e) => setEditRetainerMonths(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    )}

                    {editIsRetained && (
                      <div className="rounded-lg bg-black/40 p-2.5 text-xs text-fog-300 flex justify-between font-mono">
                        <span>Computed Total Contract Value (TCV):</span>
                        <span className="text-gold font-bold">
                          {formatCurrency(
                            Number(editSetupFee || 0) +
                              Number(editMonthlyRetainer || 0) * Number(editRetainerMonths || 12)
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClasses}>Flat / Total Deal Value ($)</label>
                      <input
                        name="value"
                        type="number"
                        step="0.01"
                        defaultValue={editingDeal.value ?? ""}
                        className={inputClasses}
                        placeholder="e.g. 18000"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Win Prob. (%)</label>
                      <input
                        name="probability"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={editingDeal.probability}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Target Close</label>
                      <input
                        name="expected_close_on"
                        type="date"
                        defaultValue={editingDeal.expected_close_on ?? ""}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Notes & Objections</label>
                    <textarea
                      name="notes"
                      rows={2}
                      defaultValue={editingDeal.notes ?? ""}
                      className={inputClasses}
                    />
                  </div>

                  <div className="pt-3 flex justify-between items-center border-t border-white/10">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this deal?")) {
                          const formData = new FormData();
                          formData.append("id", editingDeal.id);
                          await deleteOpportunityAction(formData);
                          setEditingDeal(null);
                        }
                      }}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      Delete Deal
                    </button>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingDeal(null)}
                        className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Dialog for New Deal */}
      {modalMode === "deal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg text-fog-100">Create Pipeline Deal</h3>
                <p className="text-xs text-fog-500">Configure new opportunity, setup fees, and retainer models</p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createOpportunityAction(formData);
                setModalMode(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClasses}>Deal / Opportunity Title *</label>
                <input
                  name="title"
                  required
                  className={inputClasses}
                  placeholder="e.g. Enterprise ERP Retainer & Fleet Telematics Migration"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Assign Client</label>
                  <select name="client_id" className={inputClasses}>
                    <option value="">Unassigned (New Client)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Associate Lead</label>
                  <select name="lead_id" className={inputClasses}>
                    <option value="">No Inbound Lead</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.company ? `(${l.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Business Arm</label>
                  <select name="business_arm_id" className={inputClasses}>
                    <option value="">No arm selected</option>
                    {arms.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                    {!arms.some((a) => a.name.toLowerCase() === "custom") && (
                      <option value="custom">Custom</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Service Offering</label>
                  <select name="service_id" className={inputClasses}>
                    <option value="">No specific service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    {!services.some((s) => s.name.toLowerCase() === "custom") && (
                      <option value="custom">Custom</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Retainer Selector */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-fog-100 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRetained}
                        onChange={(e) => setIsRetained(e.target.checked)}
                        className="rounded border-white/20 text-gold focus:ring-gold"
                      />
                      Is this client on a monthly retainer?
                    </label>
                    <p className="text-[11px] text-fog-500 mt-0.5">
                      Automatically records monthly recurring billing & contract value.
                    </p>
                  </div>
                  {isRetained && (
                    <span className="text-[10px] bg-gold/20 text-gold font-mono font-bold px-2 py-0.5 rounded">
                      RETAINER ON
                    </span>
                  )}
                </div>

                {isRetained && (
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                    <div>
                      <label className={labelClasses}>Setup Fee ($)</label>
                      <input
                        name="setup_fee"
                        type="number"
                        step="0.01"
                        value={setupFeeInput}
                        onChange={(e) => setSetupFeeInput(e.target.value)}
                        placeholder="e.g. 5000"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Monthly Retainer ($) *</label>
                      <input
                        name="monthly_recurring"
                        type="number"
                        step="0.01"
                        required={isRetained}
                        value={monthlyRetainerInput}
                        onChange={(e) => setMonthlyRetainerInput(e.target.value)}
                        placeholder="e.g. 1500"
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Duration (Months)</label>
                      <input
                        name="contract_months"
                        type="number"
                        min="1"
                        value={retainerMonthsInput}
                        onChange={(e) => setRetainerMonthsInput(e.target.value)}
                        className={inputClasses}
                      />
                    </div>
                  </div>
                )}

                {isRetained && (
                  <div className="rounded-lg bg-black/40 p-2.5 text-xs text-fog-300 flex justify-between font-mono">
                    <span>Expected Total Contract Value (TCV):</span>
                    <span className="text-gold font-bold">
                      {formatCurrency(
                        Number(setupFeeInput || 0) +
                          Number(monthlyRetainerInput || 0) * Number(retainerMonthsInput || 12)
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Stage</label>
                  <select name="stage" defaultValue="lead" className={inputClasses}>
                    {opportunityStages.map((st) => (
                      <option key={st} value={st}>
                        {labelize(st)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Deal / Base Value ($)</label>
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15000"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Win Prob. (%)</label>
                  <input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="30"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Target Close Date</label>
                <input name="expected_close_on" type="date" className={inputClasses} />
              </div>

              <div>
                <label className={labelClasses}>Strategic Notes & Objections</label>
                <textarea
                  name="notes"
                  rows={2}
                  className={inputClasses}
                  placeholder="Decision maker priorities, integration scope..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Log Activity */}
      {modalMode === "activity" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg text-fog-100">Log Sales Activity</h3>
                <p className="text-xs text-fog-500">Record calls, notes, meetings, and next follow-ups</p>
              </div>
              <button
                onClick={() => {
                  setModalMode(null);
                  setActivityModalOppId("");
                }}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 mb-4">
              <button
                type="button"
                onClick={() => setActivityModalTypeTab("call")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                  activityModalTypeTab === "call" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                }`}
              >
                <span>📞</span> Call
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTypeTab("meeting")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                  activityModalTypeTab === "meeting" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                }`}
              >
                <span>🤝</span> Meeting
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTypeTab("note")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                  activityModalTypeTab === "note" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                }`}
              >
                <span>📝</span> Note
              </button>
              <button
                type="button"
                onClick={() => setActivityModalTypeTab("email")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                  activityModalTypeTab === "email" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                }`}
              >
                <span>✉️</span> Email
              </button>
            </div>

            <form
              action={async (formData) => {
                await createActivityAction(formData);
                setModalMode(null);
                setActivityModalOppId("");
              }}
              className="space-y-3.5"
            >
              <input type="hidden" name="activity_type" value={activityModalTypeTab} />

              <div>
                <label className={labelClasses}>Subject *</label>
                <input
                  name="subject"
                  required
                  defaultValue={
                    activityModalOppId
                      ? `${activityModalTypeTab === "call" ? "Call" : activityModalTypeTab === "meeting" ? "Meeting" : activityModalTypeTab === "email" ? "Email" : "Note"} on ${
                          initialOpportunities.find((o) => o.id === activityModalOppId)?.title ?? "Deal"
                        }`
                      : activityModalTypeTab === "call"
                      ? "Phone Discussion"
                      : activityModalTypeTab === "meeting"
                      ? "Client Strategy Meeting"
                      : activityModalTypeTab === "email"
                      ? "Email Correspondence"
                      : "General CRM Note"
                  }
                  className={inputClasses}
                  placeholder="e.g. Discovery call with CEO"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Opportunity / Deal</label>
                  <select
                    name="opportunity_id"
                    defaultValue={activityModalOppId}
                    className={inputClasses}
                  >
                    <option value="">No deal attached</option>
                    {initialOpportunities.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Client</label>
                  <select name="client_id" className={inputClasses}>
                    <option value="">Unassigned</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {activityModalTypeTab === "call" && (
                  <div>
                    <label className={labelClasses}>Call Result / Outcome</label>
                    <select name="call_outcome" className={inputClasses}>
                      {callOutcomes.map((co) => (
                        <option key={co.value} value={co.label}>
                          {co.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activityModalTypeTab === "meeting" && (
                  <div>
                    <label className={labelClasses}>Meeting Type</label>
                    <select name="call_outcome" className={inputClasses}>
                      {meetingTypes.map((mt) => (
                        <option key={mt.value} value={mt.label}>
                          {mt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className={labelClasses}>
                    {activityModalTypeTab === "call" || activityModalTypeTab === "meeting" ? "Duration" : "Date"}
                  </label>
                  {activityModalTypeTab === "call" || activityModalTypeTab === "meeting" ? (
                    <select name="duration" defaultValue="15m" className={inputClasses}>
                      <option value="5m">5 minutes</option>
                      <option value="15m">15 minutes</option>
                      <option value="30m">30 minutes</option>
                      <option value="45m">45 minutes</option>
                      <option value="1h">1 hour</option>
                      <option value="1.5h+">1.5+ hours</option>
                    </select>
                  ) : (
                    <input
                      name="activity_date"
                      type="date"
                      defaultValue={today}
                      className={inputClasses}
                    />
                  )}
                </div>

                {(activityModalTypeTab === "call" || activityModalTypeTab === "meeting") && (
                  <div>
                    <label className={labelClasses}>Activity Date</label>
                    <input
                      name="activity_date"
                      type="date"
                      defaultValue={today}
                      className={inputClasses}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClasses}>
                  {activityModalTypeTab === "call"
                    ? "Call Notes & Discussion Summary"
                    : activityModalTypeTab === "meeting"
                    ? "Meeting Notes & Decisions"
                    : activityModalTypeTab === "email"
                    ? "Email Notes & Correspondence"
                    : "Note Content"}
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  required
                  className={inputClasses}
                  placeholder="Record discussion points, objections, pricing reaction, or requirements..."
                />
              </div>

              <div>
                <label className={labelClasses}>Next Action / Follow-up Milestone</label>
                <input
                  name="next_step"
                  className={inputClasses}
                  placeholder="e.g. Schedule Zoom demo with engineering team next Tuesday"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setActivityModalOppId("");
                  }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Record Revenue */}
      {modalMode === "revenue" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Record Direct Revenue</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createRevenueRecordAction(formData);
                setModalMode(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Amount ($) *</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5000"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Date Recorded *</label>
                  <input
                    name="recorded_on"
                    type="date"
                    required
                    defaultValue={today}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Client</label>
                  <select
                    name="client_id"
                    value={revenueClientId}
                    onChange={(e) => setRevenueClientId(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">Unassigned</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Business Arm</label>
                  <select
                    name="business_arm_id"
                    value={revenueArmId}
                    onChange={(e) => setRevenueArmId(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="">No arm</option>
                    {arms.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                    {!arms.some((a) => a.name.toLowerCase() === "custom") && (
                      <option value="custom">Custom</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClasses}>Service Offering</label>
                  <select name="service_id" className={inputClasses}>
                    <option value="">No service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    {!services.some((s) => s.name.toLowerCase() === "custom") && (
                      <option value="custom">Custom</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Category</label>
                  <select name="category" defaultValue="service_fee" className={inputClasses}>
                    <option value="service_fee">Service Fee</option>
                    <option value="retainer">Monthly Retainer</option>
                    <option value="commission">Commission</option>
                    <option value="subscription">Subscription</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Status</label>
                  <select name="status" defaultValue="received" className={inputClasses}>
                    {revenueStatuses.map((st) => (
                      <option key={st} value={st}>
                        {labelize(st)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Link to Deal (Calculates Cash Recovery %)</label>
                <select
                  name="opportunity_id"
                  className={inputClasses}
                  onChange={(e) => {
                    const opp = initialOpportunities.find((o) => o.id === e.target.value);
                    if (opp) {
                      if (opp.client_id) setRevenueClientId(opp.client_id);
                      if (opp.business_arm_id) setRevenueArmId(opp.business_arm_id);
                    }
                  }}
                >
                  <option value="">No deal linked</option>
                  {initialOpportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} ({formatCurrency(Number(o.value ?? 0))})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  className={inputClasses}
                  placeholder="Wire transfer reference, invoice ref..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500 px-5 py-2 text-xs font-bold text-ink-950 hover:bg-emerald-400 transition cursor-pointer"
                >
                  Record Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Arm Detail & Subscriber Dossier Modal */}
      <ArmDetailModal
        arm={selectedArmForModal}
        isOpen={Boolean(selectedArmForModal)}
        onClose={() => setSelectedArmForModal(null)}
        services={services}
        clients={clients}
        leads={leads}
        opportunities={initialOpportunities}
        revenueRecords={revenueRecords}
      />
    </div>
  );
}

