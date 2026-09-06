import type {
  BusinessArm,
  Client,
  CrmActivity,
  CrmOpportunity,
  Lead,
  RevenueRecord,
  Service,
} from "./types";

export const opportunityStages: CrmOpportunity["stage"][] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const activityTypes: CrmActivity["activity_type"][] = [
  "note",
  "call",
  "email",
  "meeting",
  "proposal",
  "delivery",
  "follow_up",
];

export const revenueStatuses: RevenueRecord["status"][] = [
  "expected",
  "invoiced",
  "received",
  "overdue",
  "cancelled",
];

export function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sumRevenue(records: RevenueRecord[], statuses: RevenueRecord["status"][]) {
  return records
    .filter((record) => statuses.includes(record.status))
    .reduce((sum, record) => sum + Number(record.amount), 0);
}

export function weightedPipeline(opportunities: CrmOpportunity[]) {
  return opportunities
    .filter((opportunity) => !["won", "lost"].includes(opportunity.stage))
    .reduce((sum, opportunity) => {
      const value = Number(opportunity.value ?? 0);
      return sum + value * (opportunity.probability / 100);
    }, 0);
}

export function openPipelineValue(opportunities: CrmOpportunity[]) {
  return opportunities
    .filter((opportunity) => !["won", "lost"].includes(opportunity.stage))
    .reduce((sum, opportunity) => sum + Number(opportunity.value ?? 0), 0);
}

export function armRevenueRows(
  arms: BusinessArm[],
  services: Service[],
  clients: Client[],
  leads: Lead[],
  opportunities: CrmOpportunity[],
  activities: CrmActivity[],
  revenueRecords: RevenueRecord[]
) {
  return arms.map((arm) => {
    const armServices = services.filter((service) => service.business_arm_id === arm.id);
    const armOpportunities = opportunities.filter((opportunity) => opportunity.business_arm_id === arm.id);
    const armActivities = activities.filter((activity) => activity.business_arm_id === arm.id);
    const armRevenue = revenueRecords.filter((record) => record.business_arm_id === arm.id);
    const clientIds = new Set(
      [
        ...armOpportunities.map((opportunity) => opportunity.client_id),
        ...armRevenue.map((record) => record.client_id),
        ...armActivities.map((activity) => activity.client_id),
      ].filter(Boolean) as string[]
    );
    const leadIds = new Set(
      [
        ...armOpportunities.map((opportunity) => opportunity.lead_id),
        ...armActivities.map((activity) => activity.lead_id),
      ].filter(Boolean) as string[]
    );

    return {
      arm,
      serviceCount: armServices.length,
      clientCount: clients.filter((client) => clientIds.has(client.id)).length,
      leadCount: leads.filter((lead) => leadIds.has(lead.id)).length,
      activityCount: armActivities.length,
      pipelineValue: openPipelineValue(armOpportunities),
      weightedPipeline: weightedPipeline(armOpportunities),
      receivedRevenue: sumRevenue(armRevenue, ["received"]),
      bookedRevenue: sumRevenue(armRevenue, ["received", "invoiced"]),
      expectedRevenue: sumRevenue(armRevenue, ["expected", "invoiced"]),
      progress:
        arm.target_revenue && arm.target_revenue > 0
          ? sumRevenue(armRevenue, ["received"]) / Number(arm.target_revenue)
          : null,
    };
  });
}

export function clientName(clientId: string | null, clients: Client[]) {
  if (!clientId) return "Unassigned";
  return clients.find((client) => client.id === clientId)?.name ?? "Unknown client";
}

export function leadName(leadId: string | null, leads: Lead[]) {
  if (!leadId) return "No lead";
  const lead = leads.find((item) => item.id === leadId);
  return lead ? `${lead.name}${lead.company ? `, ${lead.company}` : ""}` : "Unknown lead";
}

export function armName(armId: string | null, arms: BusinessArm[]) {
  if (!armId) return "No arm";
  return arms.find((arm) => arm.id === armId)?.name ?? "Unknown arm";
}

export function serviceName(serviceId: string | null, services: Service[]) {
  if (!serviceId) return "No service";
  return services.find((service) => service.id === serviceId)?.name ?? "Unknown service";
}

export function calculateLeadValuation(lead: Lead): {
  estimatedSetup: number;
  estimatedMrr: number;
  yearOneValue: number;
  suggestedArm: string;
} {
  const score = lead.diagnostic_score ?? 50;
  const text = `${lead.company ?? ""} ${lead.message ?? ""} ${lead.diagnostic_focus ?? ""}`.toLowerCase();

  let suggestedArm = "Flectēre Advisory";
  if (text.includes("construct") || text.includes("build") || text.includes("site") || text.includes("plant")) {
    suggestedArm = "AEDIFICIUM";
  } else if (text.includes("fleet") || text.includes("truck") || text.includes("logistics") || text.includes("cargo")) {
    suggestedArm = "VECTURA";
  } else if (text.includes("retail") || text.includes("pos") || text.includes("store") || text.includes("shop")) {
    suggestedArm = "STIRPS";
  } else if (text.includes("mine") || text.includes("mining") || text.includes("mineral")) {
    suggestedArm = "CUNICULUS";
  } else if (text.includes("farm") || text.includes("crop") || text.includes("agri")) {
    suggestedArm = "CROPUS";
  } else if (text.includes("insur") || text.includes("claim") || text.includes("risk")) {
    suggestedArm = "SHIELD";
  }

  // Lower flexibility score signifies higher constraint urgency = larger transformation engagement
  let estimatedSetup = 3500;
  let estimatedMrr = 450;
  if (score < 40) {
    estimatedSetup = 5000;
    estimatedMrr = 600;
  } else if (score > 65) {
    estimatedSetup = 2500;
    estimatedMrr = 350;
  }

  const yearOneValue = estimatedSetup + estimatedMrr * 12;
  return { estimatedSetup, estimatedMrr, yearOneValue, suggestedArm };
}

export function computeContractExtraction(
  opportunity: CrmOpportunity,
  invoicedTotal?: number
): {
  setupFee: number;
  monthlyRecurring: number;
  contractMonths: number;
  totalContractValue: number;
  cashExtracted: number;
  remainingValue: number;
  extractionPercent: number;
} {
  const setupFee =
    opportunity.setup_fee ?? (opportunity.value ? Math.round(Number(opportunity.value) * 0.3) : 3500);
  const monthlyRecurring =
    opportunity.monthly_recurring ??
    (opportunity.value ? Math.round((Number(opportunity.value) * 0.7) / 12) : 450);
  const contractMonths = opportunity.contract_months ?? 12;
  const totalContractValue =
    opportunity.total_contract_value ?? setupFee + monthlyRecurring * contractMonths;

  const cashExtracted =
    invoicedTotal !== undefined
      ? invoicedTotal
      : Number(opportunity.cash_extracted ?? 0);

  const remainingValue = Math.max(0, totalContractValue - cashExtracted);
  const extractionPercent =
    totalContractValue > 0
      ? Math.min(100, Math.round((cashExtracted / totalContractValue) * 100))
      : 0;

  return {
    setupFee,
    monthlyRecurring,
    contractMonths,
    totalContractValue,
    cashExtracted,
    remainingValue,
    extractionPercent,
  };
}

export function computeExpansionSuggestions(opportunity: CrmOpportunity): string[] {
  const suggestions: string[] = [];
  const extraction = computeContractExtraction(opportunity);

  if (extraction.extractionPercent >= 70) {
    suggestions.push(
      "Contract nearing maturity (>70% extracted). Schedule 12-month renewal review with +8% indexation."
    );
  }

  if (opportunity.title.toLowerCase().includes("construction") || opportunity.title.toLowerCase().includes("aedificium")) {
    suggestions.push("Upsell: Subcontractor & Plant Telemetry Portal expansion (+$250/mo).");
  } else if (opportunity.title.toLowerCase().includes("fleet") || opportunity.title.toLowerCase().includes("vectura")) {
    suggestions.push("Upsell: Automated Fuel Loss & GPS Sensor Integration (+$180/mo).");
  } else {
    suggestions.push("Recommend Workflow AI Automation Retainer module (+$400/mo).");
  }

  return suggestions;
}

