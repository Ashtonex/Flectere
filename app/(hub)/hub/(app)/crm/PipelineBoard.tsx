"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  armName,
  clientName,
  computeContractExtraction,
  labelize,
  leadName,
  opportunityStages,
  activityTypes,
  revenueStatuses,
} from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";
import {
  createOpportunityAction,
  updateOpportunityAction,
  deleteOpportunityAction,
  createActivityAction,
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
}: PipelineBoardProps) {
  const [modalMode, setModalMode] = useState<"deal" | "activity" | "revenue" | null>(null);
  const [editingDeal, setEditingDeal] = useState<CrmOpportunity | null>(null);
  const [selectedArmFilter, setSelectedArmFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  function openEditModal(deal: CrmOpportunity) {
    setEditingDeal(deal);
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
                          <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold truncate max-w-[140px]">
                            {armName(deal.business_arm_id, arms)}
                          </span>
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

                        {/* Stage Switcher & Quick Edit Action */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(deal)}
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

      {/* Modal Dialog for Edit Deal / Corrections */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg text-fog-100">Edit Pipeline Deal</h3>
                <p className="text-xs text-fog-500">Update deal financials, retainer structure, or contract details</p>
              </div>
              <button
                onClick={() => setEditingDeal(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

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
          </div>
        </div>
      )}

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
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Log CRM Activity</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createActivityAction(formData);
                setModalMode(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className={labelClasses}>Subject *</label>
                <input
                  name="subject"
                  required
                  className={inputClasses}
                  placeholder="e.g. Architecture review & contract negotiation call"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Activity Type</label>
                  <select name="activity_type" className={inputClasses}>
                    {activityTypes.map((t) => (
                      <option key={t} value={t}>
                        {labelize(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Date *</label>
                  <input
                    name="activity_date"
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
                  <select name="client_id" className={inputClasses}>
                    <option value="">Unassigned</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Opportunity / Deal</label>
                  <select name="opportunity_id" className={inputClasses}>
                    <option value="">No opportunity attached</option>
                    {initialOpportunities.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Business Arm</label>
                <select name="business_arm_id" className={inputClasses}>
                  <option value="">No arm</option>
                  {arms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Outcome Summary</label>
                <textarea
                  name="outcome"
                  rows={2}
                  className={inputClasses}
                  placeholder="Client approved phase 1 pricing; waiting on signoff..."
                />
              </div>

              <div>
                <label className={labelClasses}>Next Action / Milestone</label>
                <input
                  name="next_step"
                  className={inputClasses}
                  placeholder="e.g. Transmit master services agreement on Monday"
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
                  Log Activity
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
    </div>
  );
}
