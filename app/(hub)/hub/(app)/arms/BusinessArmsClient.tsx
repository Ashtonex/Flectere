"use client";

import { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/hub/analytics";
import { labelize } from "@/lib/hub/crm";
import { ArmDetailModal } from "@/components/hub/ArmDetailModal";
import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "@/lib/hub/types";

interface ArmRow {
  arm: BusinessArm;
  serviceCount: number;
  clientCount: number;
  leadCount: number;
  activityCount: number;
  pipelineValue: number;
  weightedPipeline: number;
  receivedRevenue: number;
  bookedRevenue: number;
  expectedRevenue: number;
  progress: number | null;
}

interface BusinessArmsClientProps {
  rows: ArmRow[];
  armList: BusinessArm[];
  serviceList: Service[];
  clientList: Client[];
  leadList: Lead[];
  opportunityList: CrmOpportunity[];
  activityList: CrmActivity[];
  revenueList: RevenueRecord[];
}

export function BusinessArmsClient({
  rows,
  armList,
  serviceList,
  clientList,
  leadList,
  opportunityList,
  revenueList,
}: BusinessArmsClientProps) {
  const [selectedArm, setSelectedArm] = useState<BusinessArm | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((row) => {
          const armServices = serviceList.filter((service) => service.business_arm_id === row.arm.id);
          return (
            <section
              key={row.arm.id}
              onClick={() => setSelectedArm(row.arm)}
              className="group relative cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:border-gold/50 hover:bg-white/[0.04] hover:shadow-[0_0_25px_rgba(207,175,99,0.1)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-widest2 text-gold font-bold">
                      {row.arm.sector || "Sector"}
                    </p>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-fog-400 border border-white/10">
                      Click for Blueprint & Subscribers
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-xl text-fog-100 group-hover:text-gold transition">
                    {row.arm.name}
                  </h2>
                  <p className="mt-1 text-sm capitalize text-fog-500">{labelize(row.arm.status)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest2 text-fog-500">Revenue</p>
                  <p className="mt-1 font-display text-xl text-fog-100">
                    {formatCurrency(row.receivedRevenue)}
                  </p>
                </div>
              </div>

              {row.arm.description && (
                <p className="mt-4 text-sm leading-6 text-fog-400 line-clamp-2">{row.arm.description}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-black/20 p-2 border border-white/5">
                  <p className="text-xs text-fog-500">Clients</p>
                  <p className="mt-1 text-fog-100 font-semibold">{row.clientCount}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-2 border border-white/5">
                  <p className="text-xs text-fog-500">Pipeline</p>
                  <p className="mt-1 text-fog-100 font-semibold">{formatCurrency(row.pipelineValue)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-2 border border-white/5">
                  <p className="text-xs text-fog-500">Booked</p>
                  <p className="mt-1 text-fog-100 font-semibold">{formatCurrency(row.bookedRevenue)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-2 border border-white/5">
                  <p className="text-xs text-fog-500">Target</p>
                  <p className="mt-1 text-fog-100 font-semibold">{formatPercent(row.progress)}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest2 text-fog-500 font-bold">
                    Services ({armServices.length})
                  </p>
                  <span className="text-xs text-gold group-hover:underline font-medium flex items-center gap-1">
                    Open Arm Blueprint ➔
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-white/5">
                  {armServices.slice(0, 3).map((service) => (
                    <li key={service.id} className="flex items-center justify-between gap-4 py-1.5">
                      <span className="text-sm text-fog-200 truncate">{service.name}</span>
                      <span className="text-xs text-fog-500 font-mono shrink-0">
                        {service.default_price ? formatCurrency(service.default_price) : labelize(service.status)}
                      </span>
                    </li>
                  ))}
                  {armServices.length > 3 && (
                    <li className="py-1 text-xs text-fog-400 italic">
                      +{armServices.length - 3} more services in catalog...
                    </li>
                  )}
                  {armServices.length === 0 && (
                    <li className="py-2 text-sm text-fog-600">No services linked yet.</li>
                  )}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      {/* Universal Interactive Arm Modal */}
      <ArmDetailModal
        arm={selectedArm}
        isOpen={Boolean(selectedArm)}
        onClose={() => setSelectedArm(null)}
        services={serviceList}
        clients={clientList}
        leads={leadList}
        opportunities={opportunityList}
        revenueRecords={revenueList}
      />
    </>
  );
}
