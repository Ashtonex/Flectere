import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/hub/types";
import { convertLeadToClientAction, createLeadAction } from "./actions";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];
  const diagnosticLeads = leads.filter((l) => l.source === "diagnostic");
  const directLeads = leads.filter((l) => l.source !== "diagnostic");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-fog-100">Leads & Inbound Signals</h1>
          <p className="mt-1 text-sm text-fog-400">
            Prospects captured through the Business Diagnostic quiz and direct contact inquiries.
          </p>
        </div>

        <details className="group relative">
          <summary className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold/50 bg-gold px-4 py-2 text-sm font-semibold text-ink-950 shadow transition-all hover:bg-gold-light">
            <span>+ Add Lead Manually</span>
          </summary>
          <div className="absolute right-0 top-12 z-20 w-96 rounded-xl border border-white/10 bg-ink-950/95 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="font-display text-base font-semibold text-fog-100">Add New Lead</h3>
            <p className="mt-1 text-xs text-fog-400">
              Record a prospect from outbound outreach, meeting, or partner referral.
            </p>
            <form action={createLeadAction} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Full Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Marcus Aurelius"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. marcus@imperium.com"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Company / Organization
                </label>
                <input
                  name="company"
                  placeholder="e.g. Imperium Capital"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                    Lead Source
                  </label>
                  <select
                    name="source"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                  >
                    <option value="outbound">Outbound</option>
                    <option value="referral">Referral</option>
                    <option value="partner">Partner</option>
                    <option value="direct">Direct Inbound</option>
                    <option value="event">Event / Summit</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                    Diagnostic Score
                  </label>
                  <input
                    name="diagnostic_score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 74"
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-widest2 text-fog-400">
                  Message / Context
                </label>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="Primary challenge or discussion notes..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-fog-100 outline-none focus:border-gold/50"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg border border-gold/50 bg-gold py-2 text-sm font-semibold text-ink-950 hover:bg-gold-light"
              >
                Save Lead
              </button>
            </form>
          </div>
        </details>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Couldn&apos;t load leads: {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Total Leads</p>
          <p className="mt-1 font-display text-2xl text-fog-100">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Diagnostic Submissions</p>
          <p className="mt-1 font-display text-2xl text-gold">{diagnosticLeads.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-widest2 text-fog-500">Direct Inbounds</p>
          <p className="mt-1 font-display text-2xl text-fog-100">{directLeads.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-950/60 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-widest2 text-fog-400">
            <tr>
              <th className="px-5 py-3.5">Captured</th>
              <th className="px-5 py-3.5">Source</th>
              <th className="px-5 py-3.5">Prospect</th>
              <th className="px-5 py-3.5">Company</th>
              <th className="px-5 py-3.5">Score</th>
              <th className="px-5 py-3.5">Context</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-5 py-4 text-xs text-fog-500">
                  {new Date(lead.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-block rounded bg-white/[0.05] px-2 py-0.5 text-xs capitalize text-fog-300">
                    {lead.source}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-fog-100">{lead.name}</p>
                  <a href={`mailto:${lead.email}`} className="text-xs text-fog-500 hover:text-gold hover:underline">
                    {lead.email}
                  </a>
                </td>
                <td className="px-5 py-4 text-fog-300">{lead.company ?? "—"}</td>
                <td className="px-5 py-4">
                  {lead.diagnostic_score !== null && lead.diagnostic_score !== undefined ? (
                    <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-bold text-gold">
                      {lead.diagnostic_score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-fog-600">—</span>
                  )}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-xs text-fog-400">
                  {lead.message ?? lead.diagnostic_focus ?? "—"}
                </td>
                <td className="px-5 py-4 text-right">
                  <form action={convertLeadToClientAction}>
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold hover:text-ink-950"
                    >
                      Convert to Client →
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-fog-500">
                  <p className="font-display text-base text-fog-300">No leads captured yet.</p>
                  <p className="mt-1 text-xs text-fog-500">
                    Visitors submitting the Contact form or Diagnostic quiz will appear here, or you can add leads manually.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
