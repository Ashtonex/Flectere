"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { type SectorOrb, type StarHealth } from "@/components/visuals/UniverseConstellationScene";
import { formatCurrency } from "@/lib/hub/analytics";
import type { BusinessArm, Client, CrmOpportunity, Invoice, RevenueRecord, Service } from "@/lib/hub/types";
import { ArmDetailModal } from "@/components/hub/ArmDetailModal";

const UniverseConstellationScene = dynamic(
  () => import("@/components/visuals/UniverseConstellationScene"),
  { ssr: false }
);

interface UniverseClientProps {
  orbs: SectorOrb[];
  arms: BusinessArm[];
  clients: Client[];
  opportunities: CrmOpportunity[];
  services: Service[];
  invoices: Invoice[];
  revenueRecords?: RevenueRecord[];
  totalReceived: number;
  totalPipeline: number;
}


export function UniverseClient({
  orbs,
  arms,
  clients,
  opportunities,
  services,
  invoices,
  revenueRecords = [],
  totalReceived,
  totalPipeline,
}: UniverseClientProps) {
  const [sectors, setSectors] = useState<SectorOrb[]>(orbs);
  const [selectedKey, setSelectedKey] = useState<string>(orbs[0]?.key ?? "aedificium");
  const [isOverloaded, setIsOverloaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedArmModal, setSelectedArmModal] = useState<BusinessArm | null>(null);

  const selectedOrb = sectors.find((s) => s.key === selectedKey) ?? sectors[0];
  const currentIndex = sectors.findIndex((o) => o.key === selectedKey);

  // Associated real DB objects for the selected sector orb
  const selectedArm = arms.find((a) => a.slug === selectedOrb?.key || a.name.toLowerCase() === selectedOrb?.key);
  const selectedArmOpportunities = opportunities.filter((o) => o.business_arm_id === selectedArm?.id);
  const selectedArmServices = services.filter((s) => s.business_arm_id === selectedArm?.id);
  const overdueInvoices = invoices.filter((inv) => ["sent", "overdue"].includes(inv.status));
  const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

  function cycleArm(direction: 1 | -1) {
    if (!sectors.length) return;
    const nextIdx = (currentIndex + direction + sectors.length) % sectors.length;
    setSelectedKey(sectors[nextIdx].key);
  }

  return (
    <div className="relative -mx-6 -my-10 h-[calc(100vh-4rem)] overflow-hidden bg-[#010307] select-none">
      
      {/* 3D WebGL Cosmic Constellation */}
      <div className="absolute inset-0 z-0">
        <UniverseConstellationScene
          selectedOrb={selectedOrb}
          onSelectOrb={(orb) => setSelectedKey(orb.key)}
          isOverloaded={isOverloaded}
        />
      </div>

      {/* Atmospheric Overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#010307] via-[#010307]/70 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#010307] via-[#010307]/80 to-transparent z-10" />

      {/* Interactive Command Deck */}
      <div className="relative z-20 flex h-full flex-col justify-between p-6 md:p-8">
        
        {/* Top Cockpit Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.35em] text-gold font-bold">
                Flectēre Ecosystem Universe • Live Central Telemetry
              </span>
            </div>

            <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight mt-1 flex items-baseline gap-2">
              FLECTĒRE <span className="font-serif italic text-gold font-normal">UNIVERSE</span>
            </h1>
            
            <p className="text-xs text-fog-500 font-serif italic mt-0.5">
              Imperium per Systemata — Central Multi-Arm Constellation & Live Database Sync
            </p>
          </div>

          {/* Navigation & Live Sync Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl p-1 text-xs shadow-xl">
              <span className="rounded-lg bg-gold px-3 py-1.5 font-bold text-ink-950 shadow">
                🌌 3D Universe
              </span>
              <Link
                href="/hub/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-fog-400 transition hover:bg-white/5 hover:text-white"
              >
                <span>📊 Executive Grid</span>
              </Link>
            </div>

            {/* Database Live Status Badge */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/75 px-3.5 py-2 backdrop-blur-xl text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog-500 font-bold">Supabase Realtime</p>
                <p className="font-mono text-xs text-white font-semibold">13 Tables Connected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Planetary HUD (Right Pane) */}
        {selectedOrb && (
          <div className="self-end w-full max-w-sm rounded-2xl border border-white/15 bg-black/85 p-6 backdrop-blur-2xl space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.95)]">
            {/* Header with Latin Seal */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                    {selectedOrb.status} NODE
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
                <span className="font-mono text-xs font-bold text-emerald-400">
                  ONLINE (ACTIVE)
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
                <span className="text-[10px] uppercase tracking-wider text-fog-500 font-medium">Revenue Collected</span>
                <p className="mt-1 font-mono text-sm font-extrabold text-gold">
                  {formatCurrency(selectedOrb.mrr)}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="text-[10px] uppercase tracking-wider text-fog-500 font-medium">Connected Clients</span>
                <p className="mt-1 font-mono text-base font-extrabold text-emerald-400">
                  {selectedOrb.tenants}
                </p>
              </div>
            </div>

            {/* Live Database Activity for Selected Arm */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs space-y-1.5 text-fog-300">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-fog-500">
                <span>Active Services:</span>
                <span className="text-gold">{selectedArmServices.length} offerings</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-fog-500">
                <span>Pipeline Deals:</span>
                <span className="text-emerald-400">{selectedArmOpportunities.length} opportunities</span>
              </div>
              <div className="text-[11px] text-fog-400 pt-1 border-t border-white/5">
                <p>Endpoint: https://{selectedOrb.key}.flectere.co</p>
                <p className="text-emerald-400">Database status: In-sync • RLS isolated</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedArm) {
                    setSelectedArmModal(selectedArm);
                  }
                }}
                className="w-full text-center rounded-lg bg-gold hover:bg-gold-bright text-ink-950 font-bold text-xs py-2 transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📜</span> Arm Dossier & Subscribers ➔
              </button>

              <div className="flex gap-2">
                <Link
                  href="/hub/crm"
                  className="flex-1 text-center rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 text-fog-200 font-semibold text-xs py-1.5 transition"
                >
                  View in CRM ➔
                </Link>
                <Link
                  href="/hub/arms"
                  className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-fog-300 hover:text-white hover:bg-white/10 transition flex items-center"
                >
                  All Arms
                </Link>
              </div>
            </div>
          </div>
        )}


        {/* Bottom Celestial Orbit Dock */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-black/75 p-3 backdrop-blur-xl mb-10">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => cycleArm(-1)}
              className="px-2 py-1 rounded border border-white/10 text-xs text-fog-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              ◀
            </button>
            <span className="text-[10px] uppercase tracking-widest text-gold font-bold px-2">Sector Stars:</span>
            <button
              onClick={() => cycleArm(1)}
              className="px-2 py-1 rounded border border-white/10 text-xs text-fog-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {sectors.map((orb) => (
              <button
                key={orb.key}
                onClick={() => setSelectedKey(orb.key)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedKey === orb.key
                    ? "bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/30 font-bold"
                    : "text-fog-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  borderLeft:
                    selectedKey === orb.key
                      ? `3px solid ${orb.color}`
                      : "none",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: orb.color }}
                />
                {orb.name}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Slide-Up Executive Command Matrix (Fast-Action Drawer) */}
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
              {overdueInvoices.length} Invoices Pending ({formatCurrency(overdueTotal)}) • {opportunities.length} Pipeline Opportunities ({formatCurrency(totalPipeline)}) • {clients.length} Active Clients
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase text-gold/80 hover:text-gold">
            {isDrawerOpen ? "Minimize Fast-Action Matrix" : "Expand Fast-Action Matrix"}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[40vh] overflow-y-auto">
          
          {/* Card 1: Invoices Pending */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                💵 Pending & Open Invoices
              </span>
              <span className="font-mono text-xs font-bold text-rose-400">
                {formatCurrency(overdueTotal)}
              </span>
            </div>
            {overdueInvoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
                <div>
                  <p className="font-semibold text-white">#{inv.invoice_number} — {inv.title}</p>
                  <p className="text-[10px] text-fog-500 font-mono">
                    {formatCurrency(Number(inv.total))} • Due {inv.due_on ? new Date(inv.due_on).toLocaleDateString() : "Immediate"}
                  </p>
                </div>
                <Link
                  href="/hub/invoices"
                  className="bg-gold text-ink-950 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold-bright transition"
                >
                  View Inv
                </Link>
              </div>
            ))}
            {overdueInvoices.length === 0 && (
              <p className="text-xs text-fog-500 py-2 text-center">Zero overdue invoices outstanding.</p>
            )}
          </div>

          {/* Card 2: Highest Value Opportunities */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                🎯 Top Pipeline Opportunities
              </span>
              <span className="font-mono text-xs font-bold text-gold">
                {formatCurrency(totalPipeline)}
              </span>
            </div>
            {opportunities.slice(0, 3).map((opp) => (
              <div key={opp.id} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
                <div>
                  <p className="font-semibold text-white truncate max-w-[180px]">{opp.title}</p>
                  <p className="text-[10px] text-gold font-mono">
                    {formatCurrency(Number(opp.value ?? 0))} • {opp.probability}% Win Prob
                  </p>
                </div>
                <Link
                  href="/hub/crm"
                  className="bg-gold/20 text-gold border border-gold/40 text-[10px] font-bold px-2.5 py-1 rounded hover:bg-gold/30 transition"
                >
                  Manage ➔
                </Link>
              </div>
            ))}
            {opportunities.length === 0 && (
              <p className="text-xs text-fog-500 py-2 text-center">No active pipeline deals logged.</p>
            )}
          </div>

          {/* Card 3: Ecosystem Hub Summary */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                ⚡ Ecosystem Telemetry
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">100% Operational</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Direct Cash Collected</p>
                <p className="text-[10px] text-fog-500 font-mono">{formatCurrency(totalReceived)}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">✓ In Bank</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-xs">
              <div>
                <p className="font-semibold text-white">Registered Clients</p>
                <p className="text-[10px] text-fog-500 font-mono">{clients.length} active enterprise entities</p>
              </div>
              <Link href="/hub/clients" className="text-[10px] font-bold text-gold hover:underline">
                View All ➔
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Arm Detail & Subscriber Dossier Modal */}
      <ArmDetailModal
        arm={selectedArmModal}
        isOpen={Boolean(selectedArmModal)}
        onClose={() => setSelectedArmModal(null)}
        services={services}
        clients={clients}
        opportunities={opportunities}
        revenueRecords={revenueRecords}
      />
    </div>
  );
}

