"use client";

import { useState } from "react";
import {
  armName,
  clientName,
  leadName,
  getActivityBadgeColor,
  getActivityIcon,
  labelize,
} from "@/lib/hub/crm";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
} from "@/lib/hub/types";
import { deleteActivityAction } from "./actions";

interface ActivityTimelineFeedProps {
  activities: CrmActivity[];
  clients: Client[];
  leads: Lead[];
  arms: BusinessArm[];
  opportunities: CrmOpportunity[];
}

export function ActivityTimelineFeed({
  activities,
  clients,
  leads,
  arms,
  opportunities,
}: ActivityTimelineFeedProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = activities.filter((act) => {
    if (filterType !== "all" && act.activity_type !== filterType) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSub = act.subject.toLowerCase().includes(q);
      const matchOut = (act.outcome ?? "").toLowerCase().includes(q);
      const matchNext = (act.next_step ?? "").toLowerCase().includes(q);
      if (!matchSub && !matchOut && !matchNext) return false;
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="font-display text-lg text-fog-100">Activity Timeline & Log</h2>
          <p className="text-xs text-fog-500">Live feed of all client, deal, and lead touchpoints</p>
        </div>

        <input
          type="text"
          placeholder="Filter touchpoints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-fog-100 placeholder-fog-600 focus:border-gold/50 outline-none w-44"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { key: "all", label: "All Touchpoints" },
          { key: "call", label: "📞 Calls" },
          { key: "meeting", label: "🤝 Meetings" },
          { key: "note", label: "📝 Notes" },
          { key: "email", label: "✉️ Emails" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer shrink-0 ${
              filterType === tab.key
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-white/[0.03] text-fog-400 hover:text-white border border-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activities List */}
      <ul className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
        {filtered.slice(0, 20).map((activity) => {
          const icon = getActivityIcon(activity.activity_type);
          const colors = getActivityBadgeColor(activity.activity_type);
          const opp = opportunities.find((o) => o.id === activity.opportunity_id);

          return (
            <li key={activity.id} className="py-3.5 space-y-1.5 hover:bg-white/[0.01] transition rounded px-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base shrink-0">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-fog-100">{activity.subject}</p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {labelize(activity.activity_type)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-fog-500">
                      {activity.client_id && <span>{clientName(activity.client_id, clients)} · </span>}
                      {activity.lead_id && <span>Lead: {leadName(activity.lead_id, leads)} · </span>}
                      {opp && <span className="text-fog-300 font-medium">{opp.title} · </span>}
                      {armName(activity.business_arm_id, arms)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-fog-500 font-mono">
                    {new Date(activity.activity_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <form action={deleteActivityAction}>
                    <input type="hidden" name="id" value={activity.id} />
                    <button
                      type="submit"
                      title="Delete activity record"
                      className="text-fog-600 hover:text-rose-400 text-xs font-mono transition cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>

              {activity.outcome && (
                <div className="ml-7 rounded bg-black/40 border-l-2 border-gold/40 px-2.5 py-1.5 text-xs text-fog-300 whitespace-pre-wrap">
                  {activity.outcome}
                </div>
              )}

              {activity.next_step && (
                <p className="ml-7 text-xs text-gold flex items-center gap-1 font-medium">
                  <span>⏰</span> Next: {activity.next_step}
                </p>
              )}
            </li>
          );
        })}

        {filtered.length === 0 && (
          <li className="py-8 text-center text-sm text-fog-600">
            No touchpoints found for this filter.
          </li>
        )}
      </ul>
    </div>
  );
}
