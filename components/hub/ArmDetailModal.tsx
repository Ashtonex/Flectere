"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/hub/analytics";
import { labelize } from "@/lib/hub/crm";
import { getArmDossier } from "@/lib/hub/armsData";
import type {
  BusinessArm,
  Client,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";

interface ArmDetailModalProps {
  arm: BusinessArm | null;
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  clients: Client[];
  leads?: Lead[];
  opportunities: CrmOpportunity[];
  revenueRecords?: RevenueRecord[];
  onAddServiceClick?: (armId: string) => void;
  onAddDealClick?: (armId: string) => void;
}

type ModalTab = "overview" | "how_it_works" | "clients" | "services" | "pipeline";

export function ArmDetailModal({
  arm,
  isOpen,
  onClose,
  services,
  clients,
  leads = [],
  opportunities,
  revenueRecords = [],
  onAddServiceClick,
  onAddDealClick,
}: ArmDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>("overview");

  const dossier = useMemo(() => {
    if (!arm) return null;
    return getArmDossier(arm.slug || arm.name);
  }, [arm]);

  // Derived metrics for this arm
  const armServices = useMemo(() => {
    if (!arm) return [];
    return services.filter((s) => s.business_arm_id === arm.id);
  }, [arm, services]);

  const armOpportunities = useMemo(() => {
    if (!arm) return [];
    return opportunities.filter((o) => o.business_arm_id === arm.id);
  }, [arm, opportunities]);

  const armRevenue = useMemo(() => {
    if (!arm) return [];
    return revenueRecords.filter((r) => r.business_arm_id === arm.id);
  }, [arm, revenueRecords]);

  // Direct subscribed clients calculation
  const subscribedClientsData = useMemo(() => {
    if (!arm) return [];

    const clientMap = new Map<
      string,
      {
        client: Client;
        deals: CrmOpportunity[];
        monthlyRetainer: number;
        totalContractValue: number;
        collectedCash: number;
        status: "active" | "won" | "pipeline";
      }
    >();

    // 1. Check opportunities linked to this arm
    armOpportunities.forEach((opp) => {
      if (!opp.client_id) return;
      const c = clients.find((item) => item.id === opp.client_id);
      if (!c) return;

      const existing = clientMap.get(c.id) || {
        client: c,
        deals: [],
        monthlyRetainer: 0,
        totalContractValue: 0,
        collectedCash: 0,
        status: opp.stage === "won" ? "won" : "pipeline",
      };

      existing.deals.push(opp);
      if (opp.monthly_recurring) {
        existing.monthlyRetainer += Number(opp.monthly_recurring);
      }
      existing.totalContractValue += Number(opp.total_contract_value || opp.value || 0);
      if (opp.stage === "won" && existing.status !== "active") {
        existing.status = "won";
      }
      clientMap.set(c.id, existing);
    });

    // 2. Check direct revenue records for this arm
    armRevenue.forEach((rev) => {
      if (!rev.client_id) return;
      const c = clients.find((item) => item.id === rev.client_id);
      if (!c) return;

      const existing = clientMap.get(c.id) || {
        client: c,
        deals: [],
        monthlyRetainer: 0,
        totalContractValue: 0,
        collectedCash: 0,
        status: "active",
      };

      if (rev.status === "received") {
        existing.collectedCash += Number(rev.amount || 0);
        existing.status = "active";
      }
      clientMap.set(c.id, existing);
    });

    return Array.from(clientMap.values()).sort((a, b) => b.collectedCash - a.collectedCash);
  }, [arm, armOpportunities, armRevenue, clients]);

  // Aggregate financials
  const totalReceivedCash = useMemo(() => {
    return armRevenue
      .filter((r) => r.status === "received")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [armRevenue]);

  const totalPipelineValue = useMemo(() => {
    return armOpportunities
      .filter((o) => !["won", "lost"].includes(o.stage))
      .reduce((sum, o) => sum + Number(o.total_contract_value || o.value || 0), 0);
  }, [armOpportunities]);

  const targetRevenue = Number(arm?.target_revenue ?? 0);
  const targetProgress = targetRevenue > 0 ? (totalReceivedCash / targetRevenue) * 100 : null;

  if (!isOpen || !arm || !dossier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-gold/40 bg-ink-950 p-6 shadow-2xl space-y-6 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest2">
                  {arm.status.toUpperCase()} NODE
                </span>
                <span className="text-[11px] text-fog-500 font-serif italic">
                  &quot;{dossier.latinMotto}&quot;
                </span>
                <span className="text-[11px] font-mono text-fog-400">
                  • {dossier.defaultSubdomain}
                </span>
              </div>

              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-baseline gap-3">
                {arm.name}
                <span className="text-xs font-sans font-normal text-fog-400">
                  ({arm.sector || dossier.sector})
                </span>
              </h2>

              <p className="mt-1 text-xs text-gold/90 font-medium">
                {dossier.tagline}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 p-2 text-fog-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
              title="Close Dossier"
            >
              ✕
            </button>
          </div>

          {/* TOP QUICK METRICS STRIP */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="text-[10px] uppercase text-fog-500 font-bold block">Received Revenue</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">
                {formatCurrency(totalReceivedCash)}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="text-[10px] uppercase text-fog-500 font-bold block">Open Pipeline</span>
              <p className="text-sm font-bold text-gold mt-0.5">
                {formatCurrency(totalPipelineValue)}
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="text-[10px] uppercase text-fog-500 font-bold block">Connected Clients</span>
              <p className="text-sm font-bold text-fog-100 mt-0.5">
                {subscribedClientsData.length} Subscribed
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="text-[10px] uppercase text-fog-500 font-bold block">Service Catalog</span>
              <p className="text-sm font-bold text-fog-100 mt-0.5">
                {armServices.length} Offerings
              </p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <span className="text-[10px] uppercase text-fog-500 font-bold block">Target Progress</span>
              <p className="text-sm font-bold text-fog-200 mt-0.5">
                {targetProgress !== null ? formatPercent(targetProgress / 100) : "N/A"}
              </p>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="mt-4 border-t border-white/10 pt-3 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-gold text-ink-950 shadow-sm"
                  : "text-fog-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>🏛️</span> Overview &amp; Mandate
            </button>
            <button
              onClick={() => setActiveTab("how_it_works")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "how_it_works"
                  ? "bg-gold text-ink-950 shadow-sm"
                  : "text-fog-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>⚙️</span> How It Works (Blueprint)
            </button>
            <button
              onClick={() => setActiveTab("clients")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "clients"
                  ? "bg-gold text-ink-950 shadow-sm"
                  : "text-fog-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>👥</span> Subscribed Clients ({subscribedClientsData.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "services"
                  ? "bg-gold text-ink-950 shadow-sm"
                  : "text-fog-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>📦</span> Services Catalog ({armServices.length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pipeline"
                  ? "bg-gold text-ink-950 shadow-sm"
                  : "text-fog-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>💼</span> Active Pipeline ({armOpportunities.length})
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & MANDATE */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-gold font-bold">
                  Strategic Mission &amp; Purpose
                </h3>
                <p className="text-sm text-fog-200 leading-relaxed font-sans">
                  {arm.description || dossier.mission}
                </p>
              </div>

              {/* Key Capabilities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5">
                  <h4 className="text-xs uppercase tracking-wider text-fog-400 font-bold">
                    Key Capabilities &amp; Features
                  </h4>
                  <ul className="space-y-1.5">
                    {dossier.keyCapabilities.map((cap, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-fog-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5">
                  <h4 className="text-xs uppercase tracking-wider text-fog-400 font-bold">
                    Target Market &amp; Ideal Client Profile
                  </h4>
                  <ul className="space-y-1.5">
                    {dossier.targetMarket.map((target, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-fog-300">
                        <span className="text-gold font-bold">➔</span>
                        <span>{target}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical Specifications Strip */}
              <div className="rounded-xl border border-white/10 bg-white/[0.015] p-4 space-y-2 font-mono">
                <h4 className="text-[10px] uppercase tracking-widest text-fog-500 font-bold">
                  Architecture &amp; System Telemetry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-fog-300">
                  <div>
                    <span className="text-fog-500">Data Ingestion:</span> {dossier.architecture.dataIngestion}
                  </div>
                  <div>
                    <span className="text-fog-500">Processing Engine:</span> {dossier.architecture.processingEngine}
                  </div>
                  <div>
                    <span className="text-fog-500">Delivery Model:</span> {dossier.architecture.deliveryModel}
                  </div>
                  <div>
                    <span className="text-fog-500">Telemetry Protocol:</span> {dossier.architecture.telemetryProtocol}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HOW IT WORKS (OPERATIONAL BLUEPRINT) */}
          {activeTab === "how_it_works" && (
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-fog-100">
                  Operational Blueprint &amp; Production Flow
                </h3>
                <p className="text-fog-400 text-xs">
                  Step-by-step technical architecture and operational delivery lifecycle for {arm.name}.
                </p>
              </div>

              <div className="space-y-3">
                {dossier.howItWorks.map((step) => (
                  <div
                    key={step.step}
                    className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-black/40 p-4 transition hover:border-gold/30 hover:bg-white/[0.02]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 border border-gold/40 text-gold font-mono font-bold text-sm">
                      0{step.step}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-fog-100">{step.title}</h4>
                      <p className="text-xs text-fog-300 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gold/20 bg-gold/[0.03] p-4 text-xs text-fog-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gold block">Autonomous RLS Security Isolation</span>
                  <span className="text-fog-400">All tenant data processed by {arm.name} is cryptographically segregated under Supabase Vault.</span>
                </div>
                <span className="font-mono text-emerald-400 text-xs px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                  Active in Schema
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIBED CLIENTS & ACTIVE TENANTS */}
          {activeTab === "clients" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-fog-100">
                    Subscribers &amp; Connected Clients
                  </h3>
                  <p className="text-xs text-fog-400">
                    Organizations with active subscriptions, retainers, or historic revenue under {arm.name}.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-fog-500 uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5 font-sans font-bold">Client / Organization</th>
                      <th className="px-3.5 py-2.5">Industry</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Retainer</th>
                      <th className="px-3.5 py-2.5">Contract Total</th>
                      <th className="px-3.5 py-2.5 text-right">Cash Settled</th>
                      <th className="px-3.5 py-2.5 text-right font-sans">Profile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {subscribedClientsData.map((item) => (
                      <tr key={item.client.id} className="hover:bg-white/[0.02] transition">
                        <td className="px-3.5 py-2.5 font-sans font-medium text-fog-100">
                          <Link
                            href={`/hub/clients/${item.client.id}`}
                            className="hover:text-gold transition hover:underline"
                          >
                            {item.client.name}
                          </Link>
                          {item.client.contact_email && (
                            <span className="block text-[10px] text-fog-500 font-mono">
                              {item.client.contact_email}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-fog-400 font-sans text-xs">
                          {item.client.phone || "Corporate Client"}
                        </td>

                        <td className="px-3.5 py-2.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              item.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : item.status === "won"
                                ? "bg-gold/15 text-gold border border-gold/30"
                                : "bg-white/5 text-fog-400 border border-white/10"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-gold font-bold">
                          {item.monthlyRetainer > 0
                            ? `${formatCurrency(item.monthlyRetainer)}/mo`
                            : "Project-based"}
                        </td>
                        <td className="px-3.5 py-2.5 text-fog-200">
                          {formatCurrency(item.totalContractValue)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-emerald-400">
                          {formatCurrency(item.collectedCash)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-sans">
                          <Link
                            href={`/hub/clients/${item.client.id}`}
                            className="text-gold hover:underline text-[11px]"
                          >
                            Open ➔
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {subscribedClientsData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-fog-600 font-sans">
                          No active subscribers linked to {arm.name} yet. Create an opportunity or invoice to bind clients to this arm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SERVICES CATALOG */}
          {activeTab === "services" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-fog-100">
                    Productized Services &amp; Modules
                  </h3>
                  <p className="text-xs text-fog-400">
                    Offerings structured under {arm.name} with standard pricing.
                  </p>
                </div>
                {onAddServiceClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onAddServiceClick(arm.id);
                    }}
                    className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold hover:text-ink-950 transition cursor-pointer"
                  >
                    + Add New Service
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {armServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display text-sm font-bold text-fog-100">
                          {srv.name}
                        </h4>
                        <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] uppercase font-mono text-fog-400">
                          {srv.status}
                        </span>
                      </div>
                      {srv.description && (
                        <p className="mt-1 text-xs text-fog-400 leading-relaxed font-sans">
                          {srv.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-baseline justify-between font-mono">
                      <span className="text-[10px] text-fog-500 uppercase">Standard Rate</span>
                      <span className="text-sm font-bold text-gold">
                        {srv.default_price ? formatCurrency(Number(srv.default_price)) : "Custom Quote"}
                      </span>
                    </div>
                  </div>
                ))}

                {armServices.length === 0 && (
                  <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.01] p-8 text-center text-fog-600 font-sans">
                    No individual service modules registered under {arm.name} yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVE PIPELINE DEALS */}
          {activeTab === "pipeline" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-fog-100">
                    Deal Opportunities &amp; Pipeline
                  </h3>
                  <p className="text-xs text-fog-400">
                    Active sales cycles, proposal stages, and contract extraction for {arm.name}.
                  </p>
                </div>
                {onAddDealClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onAddDealClick(arm.id);
                    }}
                    className="rounded-lg border border-gold/40 bg-gold px-3 py-1 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition cursor-pointer"
                  >
                    + Add Opportunity
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-fog-500 uppercase">
                    <tr>
                      <th className="px-3.5 py-2.5 font-sans font-bold">Deal Title</th>
                      <th className="px-3.5 py-2.5 font-sans">Client / Entity</th>
                      <th className="px-3.5 py-2.5">Stage</th>
                      <th className="px-3.5 py-2.5">Probability</th>
                      <th className="px-3.5 py-2.5 text-right">Contract Value</th>
                      <th className="px-3.5 py-2.5 text-right">Expected Close</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {armOpportunities.map((deal) => {
                      const client = clients.find((c) => c.id === deal.client_id);
                      return (
                        <tr key={deal.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-3.5 py-2.5 font-sans font-medium text-fog-100">
                            {deal.title}
                          </td>
                          <td className="px-3.5 py-2.5 text-fog-300 font-sans">
                            {client ? (
                              <Link
                                href={`/hub/clients/${client.id}`}
                                className="hover:text-gold transition hover:underline"
                              >
                                {client.name}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="capitalize text-fog-300">{labelize(deal.stage)}</span>
                          </td>
                          <td className="px-3.5 py-2.5 font-bold text-fog-200">
                            {deal.probability}%
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-gold">
                            {formatCurrency(Number(deal.total_contract_value || deal.value || 0))}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-fog-400">
                            {deal.expected_close_on ?? "Open"}
                          </td>
                        </tr>
                      );
                    })}

                    {armOpportunities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-fog-600 font-sans">
                          No opportunities currently active in the CRM pipeline for {arm.name}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER & QUICK ACTIONS */}
        <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Link
              href="/hub/crm"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-fog-200 hover:text-white hover:bg-white/10 transition"
            >
              Open Pipeline Board ➔
            </Link>
            <Link
              href="/hub/universe"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-fog-200 hover:text-white hover:bg-white/10 transition"
            >
              View in 3D Universe 🌌
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-fog-400 hover:text-white transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
