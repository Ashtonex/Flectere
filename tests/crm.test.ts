import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLeadValuation,
  computeContractExtraction,
  sumRevenue,
  weightedPipeline,
  openPipelineValue,
  armRevenueRows,
} from "@/lib/hub/crm";
import type { BusinessArm, CrmOpportunity, Lead, RevenueRecord, Service } from "@/lib/hub/types";

test("CRM Core: calculateLeadValuation matches sector keywords", () => {
  const constructionLead: Lead = {
    id: "lead-1",
    name: "John Builder",
    email: "john@build.com",
    company: "Continental Construction",
    message: "Need help managing multiple job sites and equipment tracking.",
    source: "contact",
    diagnostic_score: null,
    diagnostic_focus: null,
    created_at: new Date().toISOString(),
  };

  const val = calculateLeadValuation(constructionLead);
  assert.equal(val.suggestedArm, "AEDIFICIUM");
  assert.ok(val.yearOneValue > 0);

  const fleetLead: Lead = {
    ...constructionLead,
    company: "Swift Haulage",
    message: "Fleet routing and fuel loss monitoring across 50 trucks.",
  };
  assert.equal(calculateLeadValuation(fleetLead).suggestedArm, "VECTURA");

  const generalLead: Lead = {
    ...constructionLead,
    company: "General Consulting",
    message: "Review our overall strategy and operations.",
  };
  assert.equal(calculateLeadValuation(generalLead).suggestedArm, "Flectēre Advisory");
});

test("CRM Core: calculateLeadValuation scales setup and MRR by diagnostic urgency", () => {
  const urgentLead: Lead = {
    id: "lead-urgent",
    name: "Strained Founder",
    email: "founder@strain.com",
    company: null,
    diagnostic_score: 30, // Critical constraint
    diagnostic_focus: "Operations",
    message: "Our systems are breaking under growth.",
    source: "diagnostic",
    created_at: new Date().toISOString(),
  };

  const highFlexLead: Lead = {
    ...urgentLead,
    id: "lead-flex",
    diagnostic_score: 80, // Healthy flexibility
  };

  const urgentVal = calculateLeadValuation(urgentLead);
  const flexVal = calculateLeadValuation(highFlexLead);

  assert.ok(urgentVal.estimatedSetup > flexVal.estimatedSetup);
  assert.ok(urgentVal.estimatedMrr > flexVal.estimatedMrr);
  assert.ok(urgentVal.yearOneValue > flexVal.yearOneValue);
});

test("CRM Core: computeContractExtraction operates strictly on authentic recorded data", () => {
  const wonOpp: CrmOpportunity = {
    id: "opp-1",
    client_id: null,
    lead_id: null,
    business_arm_id: null,
    service_id: null,
    title: "VECTURA Fleet Optimization",
    stage: "won",
    value: 12000,
    currency: "USD",
    probability: 100,
    expected_close_on: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // When no invoicedTotal is passed and cash_extracted is null, it should be 0 (no fake 55% mock data!)
  const extractionWithoutInvoices = computeContractExtraction(wonOpp);
  assert.equal(extractionWithoutInvoices.cashExtracted, 0);
  assert.equal(extractionWithoutInvoices.remainingValue, extractionWithoutInvoices.totalContractValue);
  assert.equal(extractionWithoutInvoices.extractionPercent, 0);

  // When invoicedTotal is supplied, it reflects true cash extracted
  const extractionWithInvoices = computeContractExtraction(wonOpp, 4500);
  assert.equal(extractionWithInvoices.cashExtracted, 4500);
  assert.equal(
    extractionWithInvoices.remainingValue,
    extractionWithInvoices.totalContractValue - 4500
  );
  assert.ok(extractionWithInvoices.extractionPercent > 0);
});

test("CRM Core: pipeline weighting and revenue summation are accurate", () => {
  const opps: CrmOpportunity[] = [
    {
      id: "o-1",
      client_id: null,
      lead_id: null,
      business_arm_id: null,
      service_id: null,
      title: "Qualified Deal",
      stage: "qualified",
      value: 10000,
      probability: 40,
      currency: "USD",
      expected_close_on: null,
      notes: null,
      created_at: "",
      updated_at: "",
    },
    {
      id: "o-2",
      client_id: null,
      lead_id: null,
      business_arm_id: null,
      service_id: null,
      title: "Negotiation Deal",
      stage: "negotiation",
      value: 20000,
      probability: 70,
      currency: "USD",
      expected_close_on: null,
      notes: null,
      created_at: "",
      updated_at: "",
    },
    {
      id: "o-3",
      client_id: null,
      lead_id: null,
      business_arm_id: null,
      service_id: null,
      title: "Won Deal",
      stage: "won",
      value: 50000,
      probability: 100,
      currency: "USD",
      expected_close_on: null,
      notes: null,
      created_at: "",
      updated_at: "",
    },
  ];

  // Open pipeline excludes won and lost deals
  const openVal = openPipelineValue(opps);
  assert.equal(openVal, 30000); // 10000 + 20000

  // Weighted pipeline: (10000 * 0.40) + (20000 * 0.70) = 4000 + 14000 = 18000
  const weighted = weightedPipeline(opps);
  assert.equal(weighted, 18000);

  const revenueRecords: RevenueRecord[] = [
    {
      id: "r-1",
      client_id: null,
      business_arm_id: null,
      service_id: null,
      opportunity_id: null,
      amount: 5000,
      currency: "USD",
      status: "received",
      category: "service_fee",
      recorded_on: "2026-08-01",
      notes: null,
      created_at: "",
    },
    {
      id: "r-2",
      client_id: null,
      business_arm_id: null,
      service_id: null,
      opportunity_id: null,
      amount: 3000,
      currency: "USD",
      status: "invoiced",
      category: "service_fee",
      recorded_on: "2026-08-10",
      notes: null,
      created_at: "",
    },
    {
      id: "r-3",
      client_id: null,
      business_arm_id: null,
      service_id: null,
      opportunity_id: null,
      amount: 2000,
      currency: "USD",
      status: "expected",
      category: "service_fee",
      recorded_on: "2026-08-20",
      notes: null,
      created_at: "",
    },
  ];

  assert.equal(sumRevenue(revenueRecords, ["received"]), 5000);
  assert.equal(sumRevenue(revenueRecords, ["received", "invoiced"]), 8000);
  assert.equal(sumRevenue(revenueRecords, ["received", "invoiced", "expected"]), 10000);
});

test("CRM Core: armRevenueRows aggregates across portfolio entities", () => {
  const arm: BusinessArm = {
    id: "arm-shield",
    name: "SHIELD",
    slug: "shield",
    sector: "Insurance",
    description: null,
    status: "active",
    target_revenue: 100000,
    currency: "USD",
    created_at: "",
  };

  const service: Service = {
    id: "svc-1",
    business_arm_id: "arm-shield",
    name: "Claims Triage Automation",
    tagline: null,
    description: null,
    default_price: null,
    currency: "USD",
    status: "active",
    access_url: null,
    created_at: "",
  };

  const revenue: RevenueRecord = {
    id: "rev-1",
    client_id: null,
    business_arm_id: "arm-shield",
    service_id: "svc-1",
    opportunity_id: null,
    amount: 25000,
    currency: "USD",
    status: "received",
    category: "service_fee",
    recorded_on: "2026-08-01",
    notes: null,
    created_at: "",
  };

  const rows = armRevenueRows([arm], [service], [], [], [], [], [revenue]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].arm.name, "SHIELD");
  assert.equal(rows[0].serviceCount, 1);
  assert.equal(rows[0].receivedRevenue, 25000);
  assert.equal(rows[0].progress, 0.25); // 25,000 / 100,000
});
