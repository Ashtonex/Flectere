import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/hub/types";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];

  return (
    <div>
      <h1 className="font-display text-2xl text-fog-100">Leads</h1>
      <p className="mt-1 text-sm text-fog-500">
        Diagnostic completions and contact form submissions from the site.
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-400">Couldn&apos;t load leads: {error.message}</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-widest2 text-fog-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td className="whitespace-nowrap px-4 py-3 text-fog-400">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 capitalize text-fog-300">{lead.source}</td>
                <td className="px-4 py-3 text-fog-100">{lead.name}</td>
                <td className="px-4 py-3 text-fog-400">{lead.email}</td>
                <td className="px-4 py-3 text-fog-400">{lead.company ?? "—"}</td>
                <td className="px-4 py-3 text-fog-400">{lead.diagnostic_score ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 text-fog-500">
                  {lead.message ?? lead.diagnostic_focus ?? "—"}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-fog-600">
                  No leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
