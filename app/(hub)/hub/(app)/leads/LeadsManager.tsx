"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/hub/analytics";
import {
  calculateLeadValuation,
  callOutcomes,
  meetingTypes,
  getActivityBadgeColor,
  getActivityIcon,
  labelize,
} from "@/lib/hub/crm";
import type { BusinessArm, CrmActivity, Lead } from "@/lib/hub/types";
import { convertLeadToClientAction, createLeadAction } from "./actions";
import { createActivityAction, deleteActivityAction } from "../crm/actions";

interface LeadsManagerProps {
  initialLeads: Lead[];
  activities: CrmActivity[];
  arms: BusinessArm[];
}

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";

export function LeadsManager({ initialLeads, activities, arms }: LeadsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "contacted" | "uncontacted" | "diagnostic" | "direct">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadDrawerTab, setLeadDrawerTab] = useState<"history" | "log">("log");
  const [activityTab, setActivityTab] = useState<"call" | "meeting" | "note" | "email">("call");
  const [isManualLeadOpen, setIsManualLeadOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Group activities per lead
  function getLeadActivities(leadId: string): CrmActivity[] {
    return activities.filter((a) => a.lead_id === leadId);
  }

  function getLeadLastContact(leadId: string) {
    const leadActs = getLeadActivities(leadId);
    if (leadActs.length === 0) return null;
    const sorted = [...leadActs].sort(
      (a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
    );
    return sorted[0];
  }

  function getLeadNextStep(leadId: string) {
    const leadActs = getLeadActivities(leadId);
    const withNext = leadActs.find((a) => a.next_step && a.next_step.trim().length > 0);
    return withNext?.next_step ?? null;
  }

  const filteredLeads = initialLeads.filter((lead) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchEmail = lead.email.toLowerCase().includes(q);
      const matchCompany = (lead.company ?? "").toLowerCase().includes(q);
      const matchMsg = (lead.message ?? "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchCompany && !matchMsg) return false;
    }

    const leadActs = getLeadActivities(lead.id);

    if (filterType === "contacted") {
      return leadActs.length > 0;
    }
    if (filterType === "uncontacted") {
      return leadActs.length === 0;
    }
    if (filterType === "diagnostic") {
      return lead.source === "diagnostic";
    }
    if (filterType === "direct") {
      return lead.source !== "diagnostic";
    }

    return true;
  });

  const totalLeads = initialLeads.length;
  const contactedLeads = initialLeads.filter((l) => getLeadActivities(l.id).length > 0).length;
  const uncontactedLeads = totalLeads - contactedLeads;
  const diagnosticLeads = initialLeads.filter((l) => l.source === "diagnostic").length;

  function openLeadDrawer(lead: Lead, tab: "history" | "log" = "log", actType: "call" | "meeting" | "note" | "email" = "call") {
    setSelectedLead(lead);
    setLeadDrawerTab(tab);
    setActivityTab(actType);
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Leads</p>
          <p className="mt-1 font-display text-2xl text-fog-100">{totalLeads}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">Captured prospects</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs uppercase tracking-widest2 text-emerald-400">Engaged / Contacted</p>
          <p className="mt-1 font-display text-2xl text-emerald-400">{contactedLeads}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">
            {totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0}% touchpoint rate
          </p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-xs uppercase tracking-widest2 text-rose-400">Needs First Call</p>
          <p className="mt-1 font-display text-2xl text-rose-300">{uncontactedLeads}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">0 activities recorded</p>
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-4">
          <p className="text-xs uppercase tracking-widest2 text-gold">Diagnostic Inbounds</p>
          <p className="mt-1 font-display text-2xl text-gold">{diagnosticLeads}</p>
          <p className="text-[10px] text-fog-500 mt-1 font-mono">With system scores</p>
        </div>
      </div>

      {/* Control Bar: Filters, Search, Add Lead */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search leads, emails, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 sm:w-72 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-100 placeholder-fog-600 focus:border-gold/50 outline-none"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-fog-200 outline-none focus:border-gold/50 cursor-pointer"
          >
            <option value="all">All Prospects ({totalLeads})</option>
            <option value="contacted">Contacted ({contactedLeads})</option>
            <option value="uncontacted">Needs Contact ({uncontactedLeads})</option>
            <option value="diagnostic">Diagnostic Submissions ({diagnosticLeads})</option>
            <option value="direct">Direct Inbound</option>
          </select>
        </div>

        <button
          onClick={() => setIsManualLeadOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold px-3.5 py-1.5 text-xs font-semibold text-ink-950 transition hover:bg-gold-bright shadow-sm cursor-pointer"
        >
          <span>+</span> Add Lead Manually
        </button>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950/60 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-widest2 text-fog-400">
            <tr>
              <th className="px-4 py-3.5">Captured</th>
              <th className="px-4 py-3.5">Prospect</th>
              <th className="px-4 py-3.5">Score</th>
              <th className="px-4 py-3.5">Last Touchpoint</th>
              <th className="px-4 py-3.5">Next Action</th>
              <th className="px-4 py-3.5 text-center">Touchpoints</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLeads.map((lead) => {
              const leadActs = getLeadActivities(lead.id);
              const lastContact = getLeadLastContact(lead.id);
              const nextStep = getLeadNextStep(lead.id);

              return (
                <tr key={lead.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs text-fog-500 font-mono">
                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => openLeadDrawer(lead, "history")}
                      className="font-bold text-fog-100 hover:text-gold text-left cursor-pointer transition block"
                    >
                      {lead.name}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      {lead.company && <span className="text-fog-300 font-medium">{lead.company}</span>}
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-fog-500 hover:text-gold hover:underline text-[11px]"
                      >
                        {lead.email}
                      </a>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {lead.diagnostic_score !== null && lead.diagnostic_score !== undefined ? (
                      <span className="inline-flex items-center rounded-full bg-gold/10 border border-gold/25 px-2 py-0.5 text-xs font-bold text-gold font-mono">
                        {lead.diagnostic_score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-fog-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Last Contacted */}
                  <td className="px-4 py-3.5 text-xs">
                    {lastContact ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-fog-200">
                          <span>{getActivityIcon(lastContact.activity_type)}</span>
                          <span className="font-medium truncate max-w-[130px]">{lastContact.subject}</span>
                        </div>
                        <p className="text-[10px] text-fog-500 font-mono">
                          {new Date(lastContact.activity_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-block rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                        Never contacted
                      </span>
                    )}
                  </td>

                  {/* Next Step */}
                  <td className="px-4 py-3.5 text-xs">
                    {nextStep ? (
                      <div className="flex items-center gap-1 text-gold">
                        <span>⏰</span>
                        <span className="truncate max-w-[140px] text-[11px] font-medium">{nextStep}</span>
                      </div>
                    ) : (
                      <span className="text-fog-600 text-xs font-mono">—</span>
                    )}
                  </td>

                  {/* Touchpoint Count & Clickable History */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => openLeadDrawer(lead, "history")}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 hover:bg-gold/15 hover:text-gold border border-white/10 px-2.5 py-1 text-xs font-mono text-fog-300 transition cursor-pointer"
                      title="View all activities for this prospect"
                    >
                      <span>💬</span>
                      <span>{leadActs.length}</span>
                    </button>
                  </td>

                  {/* Quick Actions (Call, Note, Convert) */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openLeadDrawer(lead, "log", "call")}
                        className="flex items-center gap-1 rounded bg-white/[0.05] hover:bg-gold/20 hover:text-gold border border-white/10 px-2.5 py-1 text-xs font-medium text-fog-200 transition cursor-pointer"
                        title="Log a phone call with notes"
                      >
                        <span>📞</span> Call
                      </button>

                      <button
                        type="button"
                        onClick={() => openLeadDrawer(lead, "log", "note")}
                        className="flex items-center gap-1 rounded bg-white/[0.05] hover:bg-white/15 hover:text-white border border-white/10 px-2.5 py-1 text-xs font-medium text-fog-300 transition cursor-pointer"
                        title="Add sales note"
                      >
                        <span>📝</span> Note
                      </button>

                      <form action={convertLeadToClientAction}>
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <button
                          type="submit"
                          className="rounded border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-ink-950 cursor-pointer"
                        >
                          Convert →
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-fog-500">
                  <p className="font-display text-base text-fog-300">No leads found.</p>
                  <p className="mt-1 text-xs text-fog-500">
                    Try adjusting your search or filter options.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SALESFORCE / PIPEDRIVE STYLE LEAD ENGAGEMENT DRAWER */}
      {selectedLead && (() => {
        const leadActs = getLeadActivities(selectedLead.id);
        const valuation = calculateLeadValuation(selectedLead);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm p-0 md:p-4">
            <div className="w-full max-w-2xl h-full md:h-[94vh] rounded-none md:rounded-2xl border-l md:border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-xl text-fog-100 font-bold">{selectedLead.name}</h3>
                    {selectedLead.diagnostic_score !== null && (
                      <span className="rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono font-bold px-2.5 py-0.5">
                        Score: {selectedLead.diagnostic_score}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-fog-400">
                    {selectedLead.company && <span className="text-fog-200 font-semibold">{selectedLead.company}</span>}
                    <a href={`mailto:${selectedLead.email}`} className="text-gold hover:underline">
                      {selectedLead.email}
                    </a>
                    <span>• Source: {selectedLead.source}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-fog-400 hover:text-white text-xl font-mono cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Lead Valuation & Target Match */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 mb-4 shrink-0 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-fog-500 block">Est. Year 1 Value</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(valuation.yearOneValue)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-fog-500 block">Suggested Arm</span>
                  <span className="font-semibold text-gold text-sm truncate block">{valuation.suggestedArm}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-fog-500 block">Structure</span>
                  <span className="text-fog-300 font-mono text-xs">
                    {formatCurrency(valuation.estimatedSetup)} + {formatCurrency(valuation.estimatedMrr)}/mo
                  </span>
                </div>
              </div>

              {/* Inbound Context / Notes */}
              {selectedLead.message && (
                <div className="rounded-lg bg-black/40 border border-white/5 p-3 mb-4 shrink-0 text-xs text-fog-300">
                  <span className="text-[9px] uppercase tracking-widest text-fog-500 block mb-1">Inbound Message</span>
                  <p className="italic">&quot;{selectedLead.message}&quot;</p>
                </div>
              )}

              {/* Drawer Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setLeadDrawerTab("log")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    leadDrawerTab === "log"
                      ? "bg-gold/20 text-gold border border-gold/40 font-bold"
                      : "text-fog-400 hover:text-fog-200"
                  }`}
                >
                  <span>+</span> Log Activity (Call, Note, Meeting)
                </button>

                <button
                  type="button"
                  onClick={() => setLeadDrawerTab("history")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    leadDrawerTab === "history"
                      ? "bg-white/10 text-white border border-white/15"
                      : "text-fog-400 hover:text-fog-200"
                  }`}
                >
                  <span>Touchpoint History</span>
                  <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-mono">
                    {leadActs.length}
                  </span>
                </button>
              </div>

              {/* Scrollable Main Area */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* TAB 1: Log Activity Form */}
                {leadDrawerTab === "log" && (
                  <div className="space-y-4">
                    {/* Activity Type Selector */}
                    <div className="flex rounded-lg border border-white/10 bg-black/40 p-1">
                      <button
                        type="button"
                        onClick={() => setActivityTab("call")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          activityTab === "call" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                        }`}
                      >
                        <span>📞</span> Log Call
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab("meeting")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          activityTab === "meeting" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                        }`}
                      >
                        <span>🤝</span> Meeting
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab("note")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          activityTab === "note" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                        }`}
                      >
                        <span>📝</span> Note
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityTab("email")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                          activityTab === "email" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
                        }`}
                      >
                        <span>✉️</span> Email
                      </button>
                    </div>

                    <form
                      action={async (formData) => {
                        await createActivityAction(formData);
                        setLeadDrawerTab("history");
                      }}
                      className="space-y-3.5"
                    >
                      <input type="hidden" name="lead_id" value={selectedLead.id} />
                      <input type="hidden" name="activity_type" value={activityTab} />

                      <div>
                        <label className={labelClasses}>Subject *</label>
                        <input
                          name="subject"
                          required
                          defaultValue={
                            activityTab === "call"
                              ? `Call with ${selectedLead.name}`
                              : activityTab === "meeting"
                              ? `Meeting with ${selectedLead.name}`
                              : activityTab === "email"
                              ? `Email touchpoint with ${selectedLead.name}`
                              : `Note on ${selectedLead.name}`
                          }
                          className={inputClasses}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {activityTab === "call" && (
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

                        {activityTab === "meeting" && (
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
                            {activityTab === "call" || activityTab === "meeting" ? "Duration" : "Date"}
                          </label>
                          {activityTab === "call" || activityTab === "meeting" ? (
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

                        {(activityTab === "call" || activityTab === "meeting") && (
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
                          {activityTab === "call"
                            ? "Call Notes & Discussion Summary"
                            : activityTab === "meeting"
                            ? "Meeting Notes & Decisions"
                            : activityTab === "email"
                            ? "Email Correspondence & Summary"
                            : "Note Content"}
                        </label>
                        <textarea
                          name="notes"
                          rows={4}
                          required
                          placeholder={
                            activityTab === "call"
                              ? "Spoke about current operational bottlenecks. Contact is interested in diagnostic audit. Budget discussed..."
                              : "Enter discussion notes..."
                          }
                          className={inputClasses}
                        />
                      </div>

                      <div>
                        <label className={labelClasses}>Next Follow-up Action</label>
                        <input
                          name="next_step"
                          placeholder="e.g. Follow up on Thursday with diagnostic report"
                          className={inputClasses}
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setLeadDrawerTab("history")}
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

                {/* TAB 2: Touchpoint History */}
                {leadDrawerTab === "history" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-fog-400 font-medium">
                        Complete engagement log for this prospect:
                      </p>
                      <button
                        type="button"
                        onClick={() => setLeadDrawerTab("log")}
                        className="rounded bg-gold/10 border border-gold/30 px-2.5 py-1 text-xs text-gold font-semibold hover:bg-gold/20 transition cursor-pointer"
                      >
                        + Log Call or Note
                      </button>
                    </div>

                    {leadActs.length === 0 ? (
                      <div className="py-12 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                        <p className="text-2xl mb-1">📞</p>
                        <p className="text-sm text-fog-300 font-semibold">No touchpoints logged yet</p>
                        <p className="text-xs text-fog-500 mt-1 max-w-xs mx-auto">
                          Record your first call or discussion note to start tracking this relationship.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTab("call");
                            setLeadDrawerTab("log");
                          }}
                          className="mt-3 rounded-lg border border-gold/50 bg-gold px-4 py-1.5 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                        >
                          Log First Call
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leadActs.map((act) => {
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
                                    title="Delete activity record"
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
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0 mt-4">
                <Link
                  href="/hub/crm"
                  className="text-xs text-fog-400 hover:text-gold transition"
                >
                  View in Deal Pipeline ➔
                </Link>

                <form action={convertLeadToClientAction}>
                  <input type="hidden" name="lead_id" value={selectedLead.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-gold/50 bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                  >
                    Convert Lead to Client →
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Add Lead Modal */}
      {isManualLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-ink-950 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-base font-semibold text-fog-100">Add New Lead</h3>
              <button
                onClick={() => setIsManualLeadOpen(false)}
                className="text-fog-400 hover:text-white text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                await createLeadAction(formData);
                setIsManualLeadOpen(false);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className={labelClasses}>Full Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Marcus Aurelius"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. marcus@imperium.com"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Company / Organization</label>
                <input
                  name="company"
                  placeholder="e.g. Imperium Capital"
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClasses}>Lead Source</label>
                  <select name="source" className={inputClasses}>
                    <option value="outbound">Outbound</option>
                    <option value="referral">Referral</option>
                    <option value="partner">Partner</option>
                    <option value="direct">Direct Inbound</option>
                    <option value="event">Event / Summit</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Diagnostic Score</label>
                  <input
                    name="diagnostic_score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 74"
                    className={inputClasses}
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Message / Context</label>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="Primary challenge or outreach notes..."
                  className={inputClasses}
                />
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualLeadOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
