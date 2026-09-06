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
  Service,
} from "@/lib/hub/types";
import {
  createOpportunityAction,
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
}: PipelineBoardProps) {
  const [modalMode, setModalMode] = useState<"deal" | "activity" | "revenue" | null>(null);
  const [selectedArmFilter, setSelectedArmFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

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
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-200 outline-none focus:border-gold/50"
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
            onClick={() => setModalMode("deal")}
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

      {/* Kanban Pipeline Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start">
        {opportunityStages.map((stage) => {
          const cfg = STAGE_CONFIG[stage];
          const stageDeals = filteredOpportunities.filter((o) => o.stage === stage);
          const stageValue = stageDeals.reduce((sum, o) => sum + Number(o.value ?? 0), 0);

          return (
            <div
              key={stage}
              className="flex flex-col rounded-xl border border-white/10 bg-white/[0.015] p-3 min-h-[460px]"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
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

              {/* Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] pr-0.5">
                {stageDeals.map((deal) => {
                  const extraction = computeContractExtraction(deal);
                  const isUpdating = updatingId === deal.id;

                  return (
                    <div
                      key={deal.id}
                      className={`group rounded-lg border border-white/10 bg-ink-950/70 p-3.5 space-y-2.5 transition hover:border-gold/40 hover:bg-ink-950 ${
                        isUpdating ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {/* Arm & Probability */}
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="rounded bg-gold/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold truncate max-w-[140px]">
                          {armName(deal.business_arm_id, arms)}
                        </span>
                        <span className="shrink-0 text-[10px] font-mono font-bold text-fog-400">
                          {deal.probability}%
                        </span>
                      </div>

                      {/* Title & Client */}
                      <div>
                        <h4 className="text-xs font-bold text-fog-100 group-hover:text-white leading-snug">
                          {deal.title}
                        </h4>
                        <p className="text-[11px] text-fog-400 mt-0.5 truncate">
                          {deal.client_id
                            ? clientName(deal.client_id, clients)
                            : deal.lead_id
                            ? `Lead: ${leadName(deal.lead_id, leads)}`
                            : "Unassigned entity"}
                        </p>
                      </div>

                      {/* Value & Terms */}
                      <div className="pt-2 border-t border-white/5 flex items-baseline justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-fog-500 block">Deal Value</span>
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(extraction.totalContractValue, deal.currency)}
                          </span>
                        </div>
                        {deal.stage === "won" && (
                          <div className="text-right">
                            <span className="text-[9px] uppercase text-fog-500 block">Extracted</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">
                              {extraction.extractionPercent}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Expected Close Date */}
                      {deal.expected_close_on && (
                        <p className="text-[10px] text-fog-500 font-mono">
                          Target close: {new Date(deal.expected_close_on).toLocaleDateString()}
                        </p>
                      )}

                      {/* Stage Advancement Switcher */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[9px] uppercase text-fog-500">Stage:</span>
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

      {/* Modal Dialog for New Deal */}
      {modalMode === "deal" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-lg text-fog-100">Create Pipeline Deal</h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-fog-400 hover:text-white text-lg font-mono"
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
                  </select>
                </div>
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
                  <label className={labelClasses}>Deal Value ($)</label>
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
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition"
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
                className="text-fog-400 hover:text-white text-lg font-mono"
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
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition"
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
                className="text-fog-400 hover:text-white text-lg font-mono"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <label className={labelClasses}>Opportunity / Deal (Optional)</label>
                <select name="opportunity_id" className={inputClasses}>
                  <option value="">No deal linked</option>
                  {initialOpportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
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
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500 px-5 py-2 text-xs font-bold text-ink-950 hover:bg-emerald-400 transition"
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
