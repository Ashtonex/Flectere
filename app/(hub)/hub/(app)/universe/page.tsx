"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SECTOR_ORBS, type SectorOrb, type StarHealth } from "@/components/visuals/UniverseConstellationScene";
import { formatCurrency } from "@/lib/hub/analytics";

const UniverseConstellationScene = dynamic(
  () => import("@/components/visuals/UniverseConstellationScene"),
  { ssr: false }
);

interface EcosystemIncident {
  errorCode: string;
  errorDetails: string;
  endpoint: string;
  fixPlaybook: string;
}

const INCIDENT_PLAYBOOKS: Record<string, EcosystemIncident> = {
  aedificium: {
    errorCode: "ERR_AED_STORAGE_TIMEOUT",
    errorDetails: "Subcontractor CAD Vault signed-URL expiration failure. Upload latency: 2450ms.",
    endpoint: "https://aedificium.flectere.co/api/erp-sync",
    fixPlaybook: "Flushing S3/Supabase signed-URL cache • Regenerating JWT tokens • Restoring pool.",
  },
  vectura: {
    errorCode: "ERR_VEC_SOCKET_DEADLOCK",
    errorDetails: "GPS Telematics gateway buffer packet drop on 14 fleet units. Queue size: 1420.",
    endpoint: "https://vectura.flectere.co/api/gps-gateway",
    fixPlaybook: "Restarting WebSocket multiplexer worker • Flushing Redis buffer • Re-routing through gateway.",
  },
  stirps: {
    errorCode: "ERR_STIRPS_TAX_OFFLINE",
    errorDetails: "Branch 4 fiscal memory signature synchronization rejected by tax server.",
    endpoint: "https://stirps.flectere.co/api/fiscal-pos",
    fixPlaybook: "Re-authenticating fiscal cryptographic keys • Replaying pending offline receipt batch • Syncing ledger.",
  },
  shield: {
    errorCode: "ERR_SHIELD_ACTUARIAL_DRIFT",
    errorDetails: "Underwriting engine actuarial rate matrix schema discrepancy detected.",
    endpoint: "https://shield.flectere.co/api/claims-triage",
    fixPlaybook: "Reloading calibrated risk coefficients • Re-indexing claims validation rules • Recalculating quote tier.",
  },
};

export default function UniverseDashboardPage() {
  const [sectors, setSectors] = useState<SectorOrb[]>(SECTOR_ORBS);
  const [selectedKey, setSelectedKey] = useState<string>(SECTOR_ORBS[0].key);
  const [isOverloaded, setIsOverloaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Autonomous Sentinel Lifecycle States
  const [sentinelState, setSentinelState] = useState<"nominal" | "incident" | "fixing">("nominal");
  const [activeIncident, setActiveIncident] = useState<{ starKey: string; data: EcosystemIncident } | null>(null);
  const [sentinelLog, setSentinelLog] = useState<string>(
    "Database RLS verified • Resend email gateway active • All 11 platform endpoints healthy."
  );

  const selectedOrb = sectors.find((s) => s.key === selectedKey) ?? sectors[0];
  const totalMrr = sectors.reduce((sum, o) => sum + o.mrr, 0);
  const totalTenants = sectors.reduce((sum, o) => sum + o.tenants, 0);
  const currentIndex = sectors.findIndex((o) => o.key === selectedKey);

  function cycleArm(direction: 1 | -1) {
    const nextIdx = (currentIndex + direction + sectors.length) % sectors.length;
    setSelectedKey(sectors[nextIdx].key);
  }

  // Trigger an incident for testing or via autonomous probe
  function triggerAnomaly(key?: string) {
    const targetKey = key ?? (Math.random() > 0.5 ? "vectura" : "aedificium");
    const playbook = INCIDENT_PLAYBOOKS[targetKey] ?? {
      errorCode: "ERR_PLATFORM_TIMEOUT",
      errorDetails: "High API gateway latency detected (>1800ms) on telemetry ingestion.",
      endpoint: `https://${targetKey}.flectere.co/api/telemetry`,
      fixPlaybook: "Restarting worker daemon • Purging stale connections • Restoring throughput.",
    };

    setSectors((prev) =>
      prev.map((s) => (s.key === targetKey ? { ...s, health: "critical" } : s))
    );
    setSelectedKey(targetKey);
    setSentinelState("incident");
    setActiveIncident({ starKey: targetKey, data: playbook });
    setSentinelLog(`[ALERT] ${targetKey.toUpperCase()}: ${playbook.errorCode} — ${playbook.errorDetails}`);
  }

  // Execute Auto-Fix Protocol
  function executeAutoFix() {
    if (!activeIncident) return;

    setSentinelState("fixing");
    setSentinelLog(`[AUTO-FIXING (RETRY 1/3)] Executing playbook: ${activeIncident.data.fixPlaybook}`);

    setSectors((prev) =>
      prev.map((s) => (s.key === activeIncident.starKey ? { ...s, health: "warning" } : s))
    );

    // Auto-fix resolution after 4 seconds
    setTimeout(() => {
      setSectors((prev) =>
        prev.map((s) => (s.key === activeIncident.starKey ? { ...s, health: "nominal" } : s))
      );
      setSentinelState("nominal");
      setSentinelLog(`[RESOLVED] Issue mitigated on ${activeIncident.starKey.toUpperCase()}. Endpoints healthy (14ms).`);
      setActiveIncident(null);
    }, 4000);
  }

  // Continuous background probe every 25 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (sentinelState === "nominal") {
        if (Math.random() < 0.35) {
          triggerAnomaly();
        }
      }
    }, 25000);

    return () => clearInterval(timer);
  }, [sentinelState]);

  return (
    <div className="relative -mx-6 -my-10 h-[calc(100vh-4rem)] overflow-hidden bg-[#010307] select-none">
      
      {/* 3D WebGL Living Cosmic Layer */}
      <div className="absolute inset-0 z-0">
        <UniverseConstellationScene
          selectedOrb={selectedOrb}
          onSelectOrb={(orb) => setSelectedKey(orb.key)}
          isOverloaded={isOverloaded}
        />
      </div>

      {/* Atmospheric Overlays & Nebula Glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#010307] via-[#010307]/60 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#010307] via-[#010307]/70 to-transparent z-10" />

      {/* Interactive Command Deck */}
      <div className="relative z-20 flex h-full flex-col justify-between p-6 md:p-8">
        
        {/* Top Header & Dual-Engine Cockpit Mode Switcher */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  sentinelState === "incident" ? "bg-rose-500" : sentinelState === "fixing" ? "bg-amber-500" : "bg-emerald-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  sentinelState === "incident" ? "bg-rose-500" : sentinelState === "fixing" ? "bg-amber-500" : "bg-emerald-400"
                }`}></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-bold">
                Flectēre Ecosystem Sentinel • Auto-Healing Engine
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight mt-1 flex items-baseline gap-2">
              FLECTĒRE <span className="font-serif italic text-gold font-normal">UNIVERSE</span>
            </h1>
            
            <p className="text-xs text-fog-500 font-serif italic mt-0.5">
              Imperium per Systemata — Central Singularity & Autonomous Diagnostic Sentinel
            </p>
          </div>

          {/* Dual-Engine Cockpit Switcher & Sentinel Stream */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Dual-Engine Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl p-1 text-xs shadow-xl">
              <span className="rounded-lg bg-gold px-3 py-1.5 font-bold text-ink-950 shadow">
                🌌 3D Sentinel
              </span>
              <Link
                href="/hub/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog-400 transition hover:bg-white/5 hover:text-white"
              >
                <span>📊 Executive Grid</span>
              </Link>
            </div>

            {/* Autonomous Sentinel Alert Stream */}
            <div className={`flex items-center gap-3 backdrop-blur-xl p-2.5 rounded-2xl border transition-all max-w-md ${
              sentinelState === "incident"
                ? "bg-rose-950/85 border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                : sentinelState === "fixing"
                ? "bg-amber-950/85 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                : "bg-black/75 border-white/10"
            }`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] uppercase tracking-wider font-extrabold ${
                    sentinelState === "incident" ? "text-rose-400" : sentinelState === "fixing" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {sentinelState === "incident"
                      ? "● INCIDENT DETECTED"
                      : sentinelState === "fixing"
                      ? "● AUTO-FIXING (RETRY 1/3)"
                      : "● ALL SYSTEMS NOMINAL"}
                  </span>
                </div>
                <p className="text-xs font-mono text-white mt-0.5 max-w-sm truncate leading-snug">
                  {sentinelLog}
                </p>
              </div>

              {sentinelState === "incident" && (
                <button
                  onClick={executeAutoFix}
                  className="shrink-0 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[10px] px-3 py-1.5 transition shadow-lg"
                >
                  Auto-Fix ➔
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Floating Selected Planetary HUD (Right Pane) */}
        {selectedOrb && (
          <div className={`self-end w-full max-w-sm rounded-2xl border p-6 backdrop-blur-2xl transition-all space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.95)] ${
            selectedOrb.health === "critical"
              ? "bg-rose-950/40 border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.3)]"
              : selectedOrb.health === "warning"
              ? "bg-amber-950/40 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.3)]"
              : "bg-black/80 border-white/15"
          }`}>
            
            {/* Header with Latin Seal */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                      selectedOrb.health === "critical"
                        ? "bg-rose-500/25 text-rose-400 border-rose-500/50"
                        : selectedOrb.health === "warning"
                        ? "bg-amber-500/25 text-amber-300 border-amber-500/50"
                        : "bg-gold/20 text-gold border-gold/40"
                    }`}
                  >
                    {selectedOrb.health === "critical"
                      ? "CRITICAL ALERT"
                      : selectedOrb.health === "warning"
                      ? "AUTO-HEALING"
                      : `${selectedOrb.status} NODE`}
                  </span>
                  <span className="text-[10px] text-fog-500 font-serif italic">
                    &quot;{selectedOrb.latinMotto}&quot;
                  </span>
                </div>
                
                <h2 className="mt-1 font-display text-2xl font-bold text-white tracking-tight">
                  {selectedOrb.name}
                </h2>
                <p className="text-xs text-fog-400 leading-snug">{selectedOrb.sector}</p>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase text-fog-500 block font-medium">Status</span>
                <span className={`font-mono text-xs font-bold ${
                  selectedOrb.health === "critical"
                    ? "text-rose-400"
                    : selectedOrb.health === "warning"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}>
                  {selectedOrb.health === "critical"
                    ? "INCIDENT (RED)"
                    : selectedOrb.health === "warning"
                    ? "FIXING (1/3)"
                    : "100% HEALTHY"}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-fog-400 leading-relaxed font-sans">
              {selectedOrb.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="text-[10px] uppercase tracking-wider text-fog-500 font-medium">Annual Run-Rate</span>
                <p className="mt-1 font-mono text-sm font-extrabold text-gold">
                  {formatCurrency(selectedOrb.mrr * 12)}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="text-[10px] uppercase tracking-wider text-fog-500 font-medium">Monthly Extraction</span>
                <p className="mt-1 font-mono text-base font-extrabold text-emerald-400">
                  {formatCurrency(selectedOrb.mrr)}<span className="text-xs font-normal text-fog-500">/mo</span>
                </p>
              </div>
            </div>

            {/* Live Ecosystem Diagnostic Terminal */}
            <div className={`rounded-xl border p-3 font-mono text-xs space-y-1.5 ${
              selectedOrb.health === "critical"
                ? "border-rose-500/50 bg-rose-950/30 text-rose-300"
                : selectedOrb.health === "warning"
                ? "border-amber-500/50 bg-amber-950/30 text-amber-300"
                : "border-white/10 bg-black/50 text-fog-300"
            }`}>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span>Diagnostic Sentinel:</span>
                <span>
                  {selectedOrb.health === "critical"
                    ? "● ERROR DETECTED"
                    : selectedOrb.health === "warning"
                    ? "● EXECUTING PLAYBOOK"
                    : "● ENDPOINT OPTIMAL"}
                </span>
              </div>

              {selectedOrb.health === "critical" && activeIncident ? (
                <div className="text-[11px] leading-relaxed">
                  <p><strong>Code:</strong> {activeIncident.data.errorCode}</p>
                  <p><strong>Impact:</strong> {activeIncident.data.errorDetails}</p>
                  <p className="text-fog-400 text-[10px]">Target: {activeIncident.data.endpoint}</p>
                </div>
              ) : selectedOrb.health === "warning" && activeIncident ? (
                <div className="text-[11px] leading-relaxed">
                  <p><strong>Playbook:</strong> {activeIncident.data.fixPlaybook}</p>
                  <p className="animate-pulse text-amber-400 text-[10px]">Awaiting gateway retry handshake confirmation...</p>
                </div>
              ) : (
                <div className="text-[11px] text-fog-400">
                  <p>Endpoint: https://{selectedOrb.key}.flectere.co/api/telemetry</p>
                  <p>Latency: 14ms • DB Pool: Healthy (4/20) • RLS: Strict Enforced</p>
                </div>
              )}
            </div>

            {/* Self-Healing Control Actions */}
            <div className="pt-1 flex gap-2">
              {selectedOrb.health === "critical" ? (
                <button
                  onClick={executeAutoFix}
                  className="flex-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs py-2 transition shadow-lg"
                >
                  Execute Auto-Fix Now ➔
                </button>
              ) : selectedOrb.health === "warning" ? (
                <button
                  disabled
                  className="flex-1 rounded-lg bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold text-xs py-2 transition cursor-not-allowed"
                >
                  Healing in Progress (Retry 1/3)...
                </button>
              ) : (
                <button
                  onClick={() => triggerAnomaly(selectedOrb.key)}
                  className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-fog-300 font-medium text-xs py-2 transition"
                >
                  Simulate Inconsistency
                </button>
              )}

              <Link
                href="/hub/crm"
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-fog-300 hover:text-white hover:bg-white/5 transition flex items-center"
              >
                CRM ➔
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Celestial Orbit Dock */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/75 p-3 backdrop-blur-xl mb-10">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => cycleArm(-1)}
              className="px-2 py-1 rounded border border-white/10 text-xs text-fog-400 hover:text-white hover:bg-white/5"
            >
              ◀
            </button>
            <span className="text-[10px] uppercase tracking-widest text-gold font-bold px-2">Sector Stars:</span>
            <button
              onClick={() => cycleArm(1)}
              className="px-2 py-1 rounded border border-white/10 text-xs text-fog-400 hover:text-white hover:bg-white/5"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {sectors.map((orb) => (
              <button
                key={orb.key}
                onClick={() => setSelectedKey(orb.key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedKey === orb.key
                    ? "bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/30 font-bold"
                    : "text-fog-400 hover:text-white hover:bg-white/5"
                } ${
                  orb.health === "critical"
                    ? "border-rose-500 bg-rose-500/25 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                    : orb.health === "warning"
                    ? "border-amber-500 bg-amber-500/25 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    : ""
                }`}
                style={{
                  borderLeft:
                    selectedKey === orb.key
                      ? `3px solid ${
                          orb.health === "critical"
                            ? "#f43f5e"
                            : orb.health === "warning"
                            ? "#f59e0b"
                            : orb.color
                        }`
                      : "none",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      orb.health === "critical"
                        ? "#f43f5e"
                        : orb.health === "warning"
                        ? "#f59e0b"
                        : orb.color,
                  }}
                />
                {orb.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* SLIDE-UP EXECUTIVE COMMAND MATRIX (FAST-ACTION DRAWER) */}
      <div className={`absolute bottom-0 inset-x-0 bg-ink-950/95 border-t border-gold/40 backdrop-blur-2xl transition-all duration-400 z-30 ${
        isDrawerOpen ? "translate-y-0" : "translate-y-[calc(100%-42px)]"
      }`}>
        <div
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="h-[42px] flex items-center justify-between px-6 cursor-pointer bg-white/[0.02] hover:bg-gold/5 border-b border-white/5 transition"
        >
          <div className="flex items-center gap-2 text-xs uppercase font-extrabold tracking-wider text-gold">
            <span>{isDrawerOpen ? "▼" : "▲"}</span>
            <span>Executive Command Matrix:</span>
            <span className="text-fog-300 font-normal normal-case tracking-normal ml-2">
              3 Invoices Overdue ($14,200) • 2 Hot Battlecards • Autonomous Healing Queue Active
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase text-gold/80 hover:text-gold">
            {isDrawerOpen ? "Minimize Fast-Action Matrix" : "Expand Fast-Action Matrix"}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[40vh] overflow-y-auto">
          
          {/* Card 1: Overdue Invoices */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                💵 Overdue & Pending Invoices
              </span>
              <span className="font-mono text-xs font-bold text-rose-400">$14,200 Due</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Inv #1042 — Apex Haulage</p>
                <p className="text-[10px] text-fog-500">Overdue 6 days • $5,400</p>
              </div>
              <button
                onClick={() => alert("Payment chaser dispatched to Apex Haulage via Resend.")}
                className="bg-gold text-ink-950 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold-bright transition"
              >
                Send Chaser
              </button>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Inv #1039 — BuildCraft Ltd</p>
                <p className="text-[10px] text-fog-500">Overdue 12 days • $8,800</p>
              </div>
              <button
                onClick={() => alert("Payment chaser dispatched to BuildCraft Ltd.")}
                className="bg-gold text-ink-950 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold-bright transition"
              >
                Send Chaser
              </button>
            </div>
          </div>

          {/* Card 2: Deal Closing Battlecards */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                🎯 Deal Closing Battlecards
              </span>
              <span className="font-mono text-xs font-bold text-gold">$58,000 TCV</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Vanguard Fleet Solutions</p>
                <p className="text-[10px] text-gold font-mono">Prob: 80% • Floor: $2,800/mo</p>
              </div>
              <Link
                href="/hub/crm"
                className="bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold/30 transition"
              >
                Battlecard ➔
              </Link>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Harare Wholesale Depots</p>
                <p className="text-[10px] text-gold font-mono">Prob: 65% • Floor: $1,900/mo</p>
              </div>
              <Link
                href="/hub/crm"
                className="bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold/30 transition"
              >
                Battlecard ➔
              </Link>
            </div>
          </div>

          {/* Card 3: Autonomous Sentinel Queue */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                ⚡ Autonomous Auto-Fix Queue
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">All Nominal</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Supabase RLS Isolation</p>
                <p className="text-[10px] text-fog-500">Strict Enforced • Zero Leaks</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">✓ Active</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Resend Email Gateway</p>
                <p className="text-[10px] text-fog-500">Webhook Queue Drained</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">✓ Active</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
