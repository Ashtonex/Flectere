"use client";

import { useState } from "react";
import {
  callOutcomes,
  meetingTypes,
  getActivityBadgeColor,
  getActivityIcon,
  labelize,
} from "@/lib/hub/crm";
import type { CrmActivity, CrmOpportunity } from "@/lib/hub/types";
import { createActivityAction, deleteActivityAction } from "../../crm/actions";

interface ClientActivitySectionProps {
  clientId: string;
  clientName: string;
  activities: CrmActivity[];
  opportunities: CrmOpportunity[];
}

const inputClasses =
  "w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-fog-100 outline-none transition-colors focus:border-gold/50";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest2 text-fog-500 font-medium";

export function ClientActivitySection({
  clientId,
  clientName,
  activities,
  opportunities,
}: ClientActivitySectionProps) {
  const [activeTab, setActiveTab] = useState<"call" | "meeting" | "note" | "email">("call");
  const [isLogging, setIsLogging] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-display text-lg text-fog-100">Client Activity & Touchpoints</h2>
          <p className="text-xs text-fog-500">
            Salesforce-style call log, relationship notes, and next follow-ups for {clientName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsLogging(!isLogging)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
            isLogging
              ? "bg-white/10 text-fog-200 border border-white/15"
              : "bg-gold text-ink-950 hover:bg-gold-bright border border-gold/50 shadow-sm"
          }`}
        >
          <span>{isLogging ? "✕ Close Form" : "📞 Log Touchpoint"}</span>
        </button>
      </div>

      {/* Touchpoint Logger Form */}
      {isLogging && (
        <div className="rounded-xl border border-gold/30 bg-black/40 p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex rounded-lg border border-white/10 bg-black/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("call")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "call" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
              }`}
            >
              <span>📞</span> Call
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("meeting")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "meeting" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
              }`}
            >
              <span>🤝</span> Meeting
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("note")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "note" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
              }`}
            >
              <span>📝</span> Note
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "email" ? "bg-gold text-ink-950 font-bold" : "text-fog-400 hover:text-white"
              }`}
            >
              <span>✉️</span> Email
            </button>
          </div>

          <form
            action={async (formData) => {
              await createActivityAction(formData);
              setIsLogging(false);
            }}
            className="space-y-3.5"
          >
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="activity_type" value={activeTab} />

            <div>
              <label className={labelClasses}>Subject *</label>
              <input
                name="subject"
                required
                defaultValue={
                  activeTab === "call"
                    ? `Call with ${clientName}`
                    : activeTab === "meeting"
                    ? `Meeting with ${clientName}`
                    : activeTab === "email"
                    ? `Email touchpoint with ${clientName}`
                    : `Note regarding ${clientName}`
                }
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {opportunities.length > 0 ? (
                <div>
                  <label className={labelClasses}>Link to Deal / Opportunity</label>
                  <select name="opportunity_id" className={inputClasses}>
                    <option value="">No deal attached</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div />
              )}

              {activeTab === "call" && (
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

              {activeTab === "meeting" && (
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
                  {activeTab === "call" || activeTab === "meeting" ? "Duration" : "Date"}
                </label>
                {activeTab === "call" || activeTab === "meeting" ? (
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

              {(activeTab === "call" || activeTab === "meeting") && (
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
                {activeTab === "call"
                  ? "Call Notes & Takeaways"
                  : activeTab === "meeting"
                  ? "Meeting Notes & Decisions"
                  : activeTab === "email"
                  ? "Email Notes & Correspondence"
                  : "Note Content"}
              </label>
              <textarea
                name="notes"
                rows={3}
                required
                className={inputClasses}
                placeholder="Record conversation points, action items, or feedback..."
              />
            </div>

            <div>
              <label className={labelClasses}>Next Follow-up Action / Milestone</label>
              <input
                name="next_step"
                placeholder="e.g. Transmit review report by Thursday"
                className={inputClasses}
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsLogging(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg border border-gold/50 bg-gold px-5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
              >
                Save Touchpoint
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-3">
        {activities.map((act) => {
          const icon = getActivityIcon(act.activity_type);
          const colors = getActivityBadgeColor(act.activity_type);
          const opp = opportunities.find((o) => o.id === act.opportunity_id);

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
                      {opp && (
                        <span className="text-[10px] text-fog-400 font-medium">
                          ({opp.title})
                        </span>
                      )}
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

                <form action={deleteActivityAction}>
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

        {activities.length === 0 && (
          <div className="py-10 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-2xl mb-1">📞</p>
            <p className="text-sm text-fog-300 font-semibold">No activity recorded for this client yet</p>
            <p className="text-xs text-fog-500 mt-1 max-w-sm mx-auto">
              Click &quot;Log Touchpoint&quot; above to log calls, strategy meetings, and notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
