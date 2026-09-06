"use client";

import { computeContractExtraction, computeExpansionSuggestions } from "@/lib/hub/crm";
import { formatCurrency } from "@/lib/hub/analytics";
import type { CrmOpportunity } from "@/lib/hub/types";

export default function DealDetailModal({
  opportunity,
  clientName,
  armName,
  onClose,
}: {
  opportunity: CrmOpportunity;
  clientName: string;
  armName: string;
  onClose: () => void;
}) {
  const extraction = computeContractExtraction(opportunity);
  const suggestions = computeExpansionSuggestions(opportunity);
  const isWon = opportunity.stage === "won";
  const isNegotiation = opportunity.stage === "negotiation";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c1018] p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isWon
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : isNegotiation
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}
              >
                {opportunity.stage.toUpperCase()}
              </span>
              <span className="text-xs text-fog-500">• {armName}</span>
            </div>
            <h2 className="mt-1 font-display text-xl text-fog-100">{opportunity.title}</h2>
            <p className="text-xs text-gold font-medium">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-fog-400 hover:text-white hover:bg-white/5 transition"
          >
            ✕ Close
          </button>
        </div>

        {/* VIEW 1: CONTRACT EXTRACTION DOSSIER (STAGE = WON) */}
        {isWon && (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">Total Contract Value (TCV)</span>
                <span className="font-mono text-lg font-extrabold text-white">
                  {formatCurrency(extraction.totalContractValue, opportunity.currency)}
                </span>
              </div>
              <p className="text-[11px] text-fog-400 mt-1">
                Setup Fee: {formatCurrency(extraction.setupFee, opportunity.currency)} + ({formatCurrency(extraction.monthlyRecurring, opportunity.currency)}/mo × {extraction.contractMonths} months)
              </p>

              {/* Extraction Gauge */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-300">
                    Cash Extracted: {formatCurrency(extraction.cashExtracted, opportunity.currency)} ({extraction.extractionPercent}%)
                  </span>
                  <span className="text-fog-400">
                    Remaining: {formatCurrency(extraction.remainingValue, opportunity.currency)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-gold transition-all duration-700"
                    style={{ width: `${extraction.extractionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expansion & Renewal Recommendations */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <span className="text-xs uppercase tracking-wider text-gold font-semibold">
                Strategic Expansion & Renewal Radar
              </span>
              <ul className="space-y-1.5 text-xs text-fog-300">
                {suggestions.map((sug, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* VIEW 2: CLOSING BATTLECARD (STAGE = NEGOTIATION) */}
        {isNegotiation && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase text-fog-500 font-medium">Target TCV</span>
                <p className="mt-1 font-mono text-base font-bold text-white">
                  {formatCurrency(extraction.totalContractValue, opportunity.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase text-fog-500 font-medium">Walk-Away Floor</span>
                <p className="mt-1 font-mono text-base font-bold text-amber-400">
                  {formatCurrency(opportunity.pricing_floor ?? extraction.totalContractValue * 0.75, opportunity.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <span className="text-[10px] uppercase text-fog-500 font-medium">Closing Probability</span>
                <p className="mt-1 font-mono text-base font-bold text-emerald-400">
                  {opportunity.probability}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-2">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                Closing Battlecard Levers & Objections
              </span>
              <p className="text-xs text-fog-300">
                {opportunity.objections || "Client negotiating setup fee versus multi-year commitment. Offer 10% discount on setup in exchange for 24-month contract term."}
              </p>
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-fog-500">Next High-Leverage Move:</span>
                <span className="font-semibold text-gold">{opportunity.next_action || "Deliver revised SLA terms and security compliance pack."}</span>
              </div>
            </div>
          </div>
        )}

        {/* Default Overview for other stages */}
        {!isWon && !isNegotiation && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex justify-between text-xs">
                <span className="text-fog-400">Estimated Deal Value:</span>
                <span className="font-bold text-white">{formatCurrency(opportunity.value, opportunity.currency)}</span>
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-fog-400">Target Close Date:</span>
                <span className="text-fog-200">{opportunity.expected_close_on || "Within 30 days"}</span>
              </div>
              {opportunity.notes && (
                <p className="mt-3 pt-3 border-t border-white/5 text-xs text-fog-400 leading-relaxed">
                  {opportunity.notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs">
          <span className="text-fog-500 text-[11px]">
            Opportunity ID: <span className="font-mono">{opportunity.id.slice(0, 8)}...</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
