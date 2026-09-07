export interface ArmDossier {
  slug: string;
  name: string;
  latinMotto: string;
  sector: string;
  tagline: string;
  mission: string;
  howItWorks: {
    step: number;
    title: string;
    description: string;
  }[];
  architecture: {
    dataIngestion: string;
    processingEngine: string;
    deliveryModel: string;
    telemetryProtocol: string;
  };
  targetMarket: string[];
  keyCapabilities: string[];
  defaultSubdomain: string;
}

export const ARM_DOSSIERS: Record<string, ArmDossier> = {
  "flectere-core": {
    slug: "flectere-core",
    name: "Flectēre Core",
    latinMotto: "Imperium per Systemata",
    sector: "Shared Infrastructure & Capital Control",
    tagline: "The central operating and capital allocation system of the conglomerate.",
    mission:
      "Acts as the sovereign nervous system across all business arms—governing identity (Auth), multi-tenant isolation, cross-division billing, centralized client records, corporate treasury, proprietary trading desk liquidity, and unified telemetry.",
    howItWorks: [
      {
        step: 1,
        title: "Sovereign Multi-Tenant Isolation",
        description:
          "Enforces Row-Level Security (RLS) and cryptographic tenant separation across all operational sectors from a single PostgreSQL ledger.",
      },
      {
        step: 2,
        title: "Unified Capital Allocation & Reinvestment",
        description:
          "Monitors cash collection across advisory, retained subscriptions, and prop trading payouts, automatically routing capital to corporate reserves, desk reinvestment, or operational buffers.",
      },
      {
        step: 3,
        title: "Omnichannel Audit & Telemetry",
        description:
          "Ingests telemetry and health heartbeats from all edge sector arms, ensuring uninterrupted uptime and automated invoice synchronization.",
      },
    ],
    architecture: {
      dataIngestion: "Next.js 16 Edge Runtime + Webhook Listeners",
      processingEngine: "PostgreSQL 15 + Realtime RLS + Distributed Supabase Vault",
      deliveryModel: "Central Hub Console (console.flectere.co)",
      telemetryProtocol: "Secure WebSocket / Server-Sent Events (SSE)",
    },
    targetMarket: [
      "Executive Holding Leadership",
      "Treasury Officers",
      "Trading Desk Operators",
      "Managing Partners",
    ],
    keyCapabilities: [
      "Global CRM, client pipeline, and contract extraction tracking",
      "Unified multi-currency invoicing with status synchronization",
      "Proprietary trading capital source lineage and profit disbursement allocation",
      "3D Universe constellation and sector orbital telemetry monitor",
    ],
    defaultSubdomain: "console.flectere.co",
  },

  "flectere-advisory": {
    slug: "flectere-advisory",
    name: "Intelligence & Advisory",
    latinMotto: "Sapientia et Actio",
    sector: "Professional Services & Executive Advisory",
    tagline: "Strategic transformation, operational audits, and systemic capability design.",
    mission:
      "Partners with sovereign enterprises, industrial conglomerates, and ambitious founders to diagnose bottleneck constraints, implement automated operating systems, and structure high-yield retainers.",
    howItWorks: [
      {
        step: 1,
        title: "Systemic Diagnostic & Bottleneck Auditing",
        description:
          "Deploys structured 6-dimensional operational audits to pinpoint margin leaks, manual drag, and constraint bottlenecks.",
      },
      {
        step: 2,
        title: "Strategic Roadmap & System Architecture",
        description:
          "Engineers tailored transformation roadmaps with milestone-gated deliverables, fixed setup fees, and monthly retainer governance.",
      },
      {
        step: 3,
        title: "Hands-On Systemic Implementation",
        description:
          "Embeds specialized software tooling, custom workflow automation, and operational SOPs directly into client organizations.",
      },
    ],
    architecture: {
      dataIngestion: "Diagnostic Intake Assessment + Automated Scoring Engine",
      processingEngine: "Valuation Estimator + Margin Leakage Telemetry",
      deliveryModel: "Executive War Room + Milestone Progress Tracking",
      telemetryProtocol: "Encrypted Document Vault + Client Portal Protocol",
    },
    targetMarket: [
      "Enterprise CEOs & Managing Directors",
      "Industrial Operators ($5M–$100M+ Revenue)",
      "Financial Institutions & Sovereign Funds",
    ],
    keyCapabilities: [
      "Operational Diagnostic & System Health Assessment",
      "Enterprise Automation & ERP Modernization Roadmaps",
      "Retainer-based Executive Advisory & Board Governance",
      "Financial Engineering & Capital Structure Optimization",
    ],
    defaultSubdomain: "advisory.flectere.co",
  },

  aedificium: {
    slug: "aedificium",
    name: "AEDIFICIUM",
    latinMotto: "Fundamenta Firma",
    sector: "Construction & Infrastructure",
    tagline: "Commercial controls, plant telematics, and multi-site project compliance.",
    mission:
      "Eliminates capital slippage, contractor disputes, and plant machinery downtime across heavy civil engineering, commercial building, and infrastructure projects.",
    howItWorks: [
      {
        step: 1,
        title: "Plant & Machinery Telematics Stream",
        description:
          "Ingests real-time GPS, engine hours, and fuel telemetry from excavators, cranes, and site generators to prevent theft and phantom hours.",
      },
      {
        step: 2,
        title: "Automated Subcontractor Compliance Ledger",
        description:
          "Validates safety certifications, payment claims, and tax clearances before certifying milestone disbursements.",
      },
      {
        step: 3,
        title: "Earned Value vs Actual Cost Analytics",
        description:
          "Reconciles site progress measurements against bill of quantities (BOQ), detecting margin erosion in real-time.",
      },
    ],
    architecture: {
      dataIngestion: "CAN-bus / OBD-II Telematics Gateways + Mobile Site App",
      processingEngine: "Automated Milestone Ledger & BOQ Reconciliation Engine",
      deliveryModel: "Site Tablet Dashboard + Head Office Central Cockpit",
      telemetryProtocol: "Cellular MQTT over TLS 1.3",
    },
    targetMarket: [
      "Civil Engineering Contractors",
      "Infrastructure Developers",
      "Plant Hire Companies",
      "Commercial General Contractors",
    ],
    keyCapabilities: [
      "Real-time machine utilization and automated fuel reconciliation",
      "Digital subcontractor payment application & milestone sign-off",
      "Site safety audit compliance and automated incident reporting",
      "BOQ cost-to-complete variance monitoring",
    ],
    defaultSubdomain: "aedificium.flectere.co",
  },

  vectura: {
    slug: "vectura",
    name: "VECTURA",
    latinMotto: "Cursus Perpetuus",
    sector: "Transport & Logistics",
    tagline: "Algorithmic route optimization, fleet telemetry, and dispatch automation.",
    mission:
      "Empowers logistics operators and long-haul carriers to maximize tonne-per-kilometer profitability with real-time fuel anti-theft sensors and automated trip settlement.",
    howItWorks: [
      {
        step: 1,
        title: "Dynamic Multi-Stop Route Sequencing",
        description:
          "Calculates optimal waypoints taking into account vehicle payload, border congestion, toll fees, and driver rest mandates.",
      },
      {
        step: 2,
        title: "Fuel Sensor Telemetry & Anomaly Detection",
        description:
          "Monitors ultrasound fuel tank level sensors continuously; triggers instant siren/SMS alarms if level drops unexpectedly.",
      },
      {
        step: 3,
        title: "Proof of Delivery & Automated Waybill Invoice",
        description:
          "Driver uploads scanned consignment note upon delivery; system immediately generates customer invoice and driver settlement sheet.",
      },
    ],
    architecture: {
      dataIngestion: "GPS Trackers + Dual Ultrasonic Fuel Probes + Driver Mobile App",
      processingEngine: "Dijkstra/OR-Tools Route Optimizer + Anomaly AI Detection",
      deliveryModel: "Live Dispatch Map + Customer Tracking Portal",
      telemetryProtocol: "High-Frequency TCP Socket + MQTT Fallback",
    },
    targetMarket: [
      "Cross-Border Hauliers",
      "Last-Mile FMCG Distributors",
      "Cold-Chain Logistics Operators",
      "Municipal Transport Fleets",
    ],
    keyCapabilities: [
      "Real-time geofenced asset tracking and speed compliance",
      "Ultrasound fuel theft and siphoning detection with instant alerts",
      "Automated electronic Proof of Delivery (e-POD)",
      "Maintenance scheduling based on actual engine run hours",
    ],
    defaultSubdomain: "vectura.flectere.co",
  },

  stirps: {
    slug: "stirps",
    name: "STIRPS",
    latinMotto: "Radix Mercatus",
    sector: "Wholesale & Retail",
    tagline: "Distributed multi-warehouse inventory, fiscal receipting, and multi-currency POS.",
    mission:
      "Connects central warehouse operations with distributed retail branches, guaranteeing instant stock visibility, preventing shrinkage, and managing multi-currency exchange rates.",
    howItWorks: [
      {
        step: 1,
        title: "Distributed Stock Ledger Synchronization",
        description:
          "Tracks pallet, carton, and unit movements across central distribution hubs and retail frontlines in sub-second intervals.",
      },
      {
        step: 2,
        title: "Multi-Currency Offline-First Point of Sale",
        description:
          "Cashiers ring sales seamlessly even during internet outages; transactions sync automatically with fiscal tax authorities upon reconnection.",
      },
      {
        step: 3,
        title: "Automated Reorder Thresholds & Purchasing",
        description:
          "Analyzes sales velocity to trigger automated supplier purchase orders before stockouts occur.",
      },
    ],
    architecture: {
      dataIngestion: "Barcode / RFID Scanners + Edge POS Terminals + EDI Connectors",
      processingEngine: "Distributed SQLite to Cloud PostgreSQL Dual-Sync Engine",
      deliveryModel: "POS Touch UI + Executive Inventory Master Cockpit",
      telemetryProtocol: "Webhooks + Offline SQLite WAL Replicator",
    },
    targetMarket: [
      "Wholesale Distributors",
      "Supermarket & Retail Chains",
      "Hardware & Building Materials Merchants",
      "FMCG Importers",
    ],
    keyCapabilities: [
      "Offline-first point-of-sale supporting multi-currency pricing",
      "Inter-branch transfer requests with double-entry inventory audit",
      "Direct integration with fiscal tax device servers (EFRIS, ESD)",
      "Gross margin protection and supplier rebate reconciliation",
    ],
    defaultSubdomain: "stirps.flectere.co",
  },

  shield: {
    slug: "shield",
    name: "SHIELD",
    latinMotto: "Tutela Invicta",
    sector: "Insurance & InsurTech",
    tagline: "Algorithmic underwriting, risk scoring, and automated claims validation.",
    mission:
      "Modernizes insurance operations by replacing weeks of manual paper underwriting with real-time risk scoring, telematics integration, and instant fraud verification.",
    howItWorks: [
      {
        step: 1,
        title: "Digital Policy Intake & Actuarial Rating",
        description:
          "Collects asset details, verifies public registries, and scores actuarial risk tables to bind policies in under 3 minutes.",
      },
      {
        step: 2,
        title: "Continuous Policy Telemetry Tracking",
        description:
          "Binds with VECTURA and AEDIFICIUM telemetry to offer dynamic pay-how-you-drive and equipment risk-adjusted premiums.",
      },
      {
        step: 3,
        title: "Instant Fraud-Resistant Claims Payout",
        description:
          "Detects duplicate claim submissions, cross-references digital photos against metadata, and auto-approves valid low-severity claims.",
      },
    ],
    architecture: {
      dataIngestion: "Broker Portal API + Mobile Photo Validation Engine",
      processingEngine: "Bayesian Actuarial Pricing Engine + Image Metadata Forensic Validator",
      deliveryModel: "Policyholder Self-Service Portal + Underwriter Command Terminal",
      telemetryProtocol: "RESTful JSON API with mTLS Authentication",
    },
    targetMarket: [
      "Underwriters & Insurers",
      "Insurance Brokers & MGAs",
      "Asset Financing Consortiums",
      "Micro-Insurance Providers",
    ],
    keyCapabilities: [
      "Automated policy rating and instant certificate issuance",
      "Telematics-based dynamic premium adjustments",
      "Forensic claims assessment and payout workflow orchestration",
      "Broker commission distribution and quota tracking",
    ],
    defaultSubdomain: "shield.flectere.co",
  },

  cuniculus: {
    slug: "cuniculus",
    name: "CUNICULUS",
    latinMotto: "Ex Terra Vis",
    sector: "Mining & Heavy Industry",
    tagline: "Crusher & mill telemetry, shaft safety monitoring, and mineral shipment audit.",
    mission:
      "Provides hard-rock and alluvial mining operators with complete digital oversight over ore grade yields, processing plant bottlenecks, conveyor downtime, and export compliance.",
    howItWorks: [
      {
        step: 1,
        title: "Processing Plant Vibration & Temperature Telemetry",
        description:
          "Sensors on ball mills, crushers, and primary pumps feed telemetry to predict bearing failures hours before costly shutdowns.",
      },
      {
        step: 2,
        title: "Weighbridge & Ore Grade Reconciliation",
        description:
          "Integrates weighbridge load-cells with assay lab samples to match excavated tonnage against recovered concentrate.",
      },
      {
        step: 3,
        title: "Mineral Shipment Manifest & Chain-of-Custody",
        description:
          "Generates tamper-evident export manifests linked with royalty calculations and customs documentation.",
      },
    ],
    architecture: {
      dataIngestion: "Modbus / RS-485 Sensors + Weighbridge Serial Bridges + SCADA Links",
      processingEngine: "Predictive Maintenance Fast-Fourier Transform (FFT) Classifier",
      deliveryModel: "On-Premise Industrial Server + Cloud Sync Bridge",
      telemetryProtocol: "Industrial MQTT / OPC-UA / Satellite Uplink",
    },
    targetMarket: [
      "Precious & Base Metal Mining Houses",
      "Aggregate Quarries",
      "Mineral Processing Plants",
      "Mining Equipment Contractors",
    ],
    keyCapabilities: [
      "Predictive vibration analysis on critical crushers and ball mills",
      "Automated weighbridge integration preventing haulage leakage",
      "Assay laboratory grade reconciliation against geological models",
      "Government royalty compliance and export manifest generation",
    ],
    defaultSubdomain: "cuniculus.flectere.co",
  },

  cropus: {
    slug: "cropus",
    name: "CROPUS",
    latinMotto: "Mensis Abundans",
    sector: "Agriculture & Cold Chain",
    tagline: "Crop yield projection, soil telemetry, and export produce cold-chain monitoring.",
    mission:
      "Connects large commercial farms and outgrower schemes with agronomic soil intelligence, cold storage temperature telemetry, and export packhouse traceability.",
    howItWorks: [
      {
        step: 1,
        title: "Soil Moisture & Microclimate Sensor Array",
        description:
          "Measures volumetric soil water content and ambient vapor pressure deficit to schedule precision irrigation cycles.",
      },
      {
        step: 2,
        title: "Packhouse Grading & Outgrower Batch Traceability",
        description:
          "Tags each crate or sack of produce with farmer ID, field block, and harvest timestamp for GLOBALG.A.P. compliance.",
      },
      {
        step: 3,
        title: "Cold Room & Reefer Container Temperature Audit",
        description:
          "Alerts packhouse managers the moment cold room temperatures drift outside the critical preservation band.",
      },
    ],
    architecture: {
      dataIngestion: "LoRaWAN Soil Nodes + BLE Cold-Chain Data Loggers",
      processingEngine: "Agronomic Degree-Day Heat Unit Accumulator + Traceability Ledger",
      deliveryModel: "Farm Operations App + Export Packhouse QA Portal",
      telemetryProtocol: "LoRaWAN 868/915 MHz Gateway + Cellular Backhaul",
    },
    targetMarket: [
      "Commercial Horticultural Exporters",
      "Coffee, Tea & Macadamia Estates",
      "Outgrower Aggregators & Cooperatives",
      "Cold-Storage Logistics Providers",
    ],
    keyCapabilities: [
      "Precision irrigation scheduling based on live root-zone moisture",
      "Cold chain temperature breach alerting during transit and storage",
      "Outgrower payment calculation based on packhouse grade quality",
      "Export certification and chemical spray withholding period tracking",
    ],
    defaultSubdomain: "cropus.flectere.co",
  },

  fabrica: {
    slug: "fabrica",
    name: "FABRICA",
    latinMotto: "Fabrilis Ars",
    sector: "Manufacturing & QC",
    tagline: "Production line cadence, batch defect detection, and raw material intake.",
    mission:
      "Brings real-time Overall Equipment Effectiveness (OEE) tracking, batch bill-of-materials reconciliation, and computer-vision quality checks to manufacturing shop floors.",
    howItWorks: [
      {
        step: 1,
        title: "Line Pulse & Machine Cycle Counting",
        description:
          "Photocell and PLC triggers log cycle times for every unit produced, measuring micro-stoppages and line pacing.",
      },
      {
        step: 2,
        title: "Bill-of-Materials (BOM) Scrap Variance Audit",
        description:
          "Compares raw material consumption against standard recipe tolerances to stop material theft and excessive wastage.",
      },
      {
        step: 3,
        title: "Quality Control Batch Hold & Clearance",
        description:
          "Enforces rigorous laboratory testing sign-offs before allowing finished goods to be released into finished inventory.",
      },
    ],
    architecture: {
      dataIngestion: "Optical Sensors + PLC Relays + QC Tablet Checklists",
      processingEngine: "Real-time OEE Engine (Availability × Performance × Quality)",
      deliveryModel: "Shop Floor Andon Screen + Plant Manager Dashboard",
      telemetryProtocol: "Ethernet IP / MQTT / Modbus TCP",
    },
    targetMarket: [
      "Food & Beverage Processors",
      "Plastics & Packaging Manufacturers",
      "Pharmaceutical Formulators",
      "Building Material Fabricators",
    ],
    keyCapabilities: [
      "Real-time shopfloor OEE measurement with instant micro-stoppage logging",
      "Recipe batch tracking and material scrap yield variance analysis",
      "Digital QC inspection hold and release governance",
      "Automated preventative maintenance triggers linked to production volume",
    ],
    defaultSubdomain: "fabrica.flectere.co",
  },

  potentia: {
    slug: "potentia",
    name: "POTENTIA",
    latinMotto: "Lux et Vigilia",
    sector: "Energy Utilities & Microgrids",
    tagline: "Peak shaving balancing, microgrid dispatch, and commercial solar telemetry.",
    mission:
      "Enables commercial facilities, solar IPPs, and microgrid operators to slash maximum demand charges, coordinate diesel-solar-battery hybrid systems, and automate energy billing.",
    howItWorks: [
      {
        step: 1,
        title: "High-Frequency Power Meter Ingestion",
        description:
          "Samples 3-phase voltage, current, power factor, and harmonics at 1-second intervals from revenue-grade meters.",
      },
      {
        step: 2,
        title: "Automated Peak Demand Shaving",
        description:
          "Monitors tariff threshold limits; automatically signals battery inverters or pauses non-critical loads before demand penalties trigger.",
      },
      {
        step: 3,
        title: "Tenant Sub-Metering & Pre-Paid Token Generation",
        description:
          "Calculates accurate energy splits among multi-tenant industrial parks, automatically generating individual utility statements.",
      },
    ],
    architecture: {
      dataIngestion: "Modbus RTU/TCP Power Meters + Solar Inverter RS-485 Gateways",
      processingEngine: "Peak Demand Predictor & Generator Synchronization Controller",
      deliveryModel: "Energy Management Cockpit + Tenant Utility Statement Portal",
      telemetryProtocol: "Modbus TCP over VPN + Secure WebSockets",
    },
    targetMarket: [
      "Commercial Real Estate & Industrial Parks",
      "Solar Independent Power Producers (IPPs)",
      "Mining & Agricultural Off-Grid Operations",
      "Municipal Water & Power Utilities",
    ],
    keyCapabilities: [
      "Maximum demand prediction and automatic load-shedding control",
      "Hybrid Solar + Battery + Diesel fuel displacement calculation",
      "Sub-tenant electrical consumption billing and automated invoice generation",
      "Power quality, voltage sag, and harmonic distortion alerting",
    ],
    defaultSubdomain: "potentia.flectere.co",
  },

  salus: {
    slug: "salus",
    name: "SALUS",
    latinMotto: "Sanitas Omnium",
    sector: "Healthcare & Veterinary Services",
    tagline: "Electronic health records, patient triage, and pharmaceutical inventory control.",
    mission:
      "Protects patient health and clinical revenue through paperless patient journey tracking, strict prescription drug batch controls, and direct medical aid claims integration.",
    howItWorks: [
      {
        step: 1,
        title: "Patient Triage & Appointment Scheduling",
        description:
          "Manages patient check-in, vital signs recording, and waiting room queue prioritization on touch tablets.",
      },
      {
        step: 2,
        title: "Clinical Consultation & Digital Prescription",
        description:
          "Doctors log clinical notes, diagnosis codes (ICD-10), and issue locked digital prescriptions directly to the in-house dispensary.",
      },
      {
        step: 3,
        title: "Dispensary Drug Batch Tracking & Claims Billing",
        description:
          "Dispenses medication against FEFO (First-Expired-First-Out) principles, logging batch numbers and submitting real-time claims.",
      },
    ],
    architecture: {
      dataIngestion: "Clinical Tablets + Vital Signs Bluetooth Monitors",
      processingEngine: "ICD-10 Diagnostic Validating Engine + Pharmacy FEFO Stock Controller",
      deliveryModel: "Clinic Reception Console + Doctor Consultation Interface",
      telemetryProtocol: "HL7 / FHIR Compliant Endpoints + HIPAA/GDPR Encrypted Vault",
    },
    targetMarket: [
      "Private Hospitals & Day Clinics",
      "Veterinary Practices & Animal Hospitals",
      "Diagnostic Laboratories & Radiology Centers",
      "Pharmacy Chains",
    ],
    keyCapabilities: [
      "Paperless Electronic Medical Records (EMR) with strict role-based privacy",
      "Pharmacy dispensary inventory with expiry date FEFO enforcement",
      "Medical aid fund pre-authorization and instant claim reconciliation",
      "Veterinary herd health and livestock vaccination schedule management",
    ],
    defaultSubdomain: "salus.flectere.co",
  },

  doctrina: {
    slug: "doctrina",
    name: "DOCTRINA",
    latinMotto: "Sapientia Suprema",
    sector: "Education & Academy Platforms",
    tagline: "School administration, fee ledger, examination intake, and student analytics.",
    mission:
      "Eliminates fee default rates and administrative gridlock for primary, secondary, and tertiary academic institutions with automated billing, SMS grade books, and digital exams.",
    howItWorks: [
      {
        step: 1,
        title: "Student Admissions & Document Verification",
        description:
          "Enrolls students digitally, automatically validating prior academic transcripts and building cumulative student dossiers.",
      },
      {
        step: 2,
        title: "Automated Fee Invoicing & Payment Gateway",
        description:
          "Issues termly tuition statements, reconciles mobile money / bank deposits automatically, and manages payment installment arrangements.",
      },
      {
        step: 3,
        title: "Academic Gradebook & Attendance Tracking",
        description:
          "Teachers log marks and daily attendance; system generates formatted terminal report cards with class percentile analytics.",
      },
    ],
    architecture: {
      dataIngestion: "Parent Portal + Teacher Gradebook App + Payment Webhooks",
      processingEngine: "Tuition Invoicing Ledger + Academic Percentile Analytics Engine",
      deliveryModel: "Parent Mobile App + Academic Registrar Command Center",
      telemetryProtocol: "REST API + Automated SMS / WhatsApp Notification Gateway",
    },
    targetMarket: [
      "Private K-12 Academies & International Schools",
      "Vocational Training Institutes & Colleges",
      "Universities & Higher Education Centers",
      "Corporate Training Centers",
    ],
    keyCapabilities: [
      "Automated termly tuition billing with bank/mobile money auto-reconciliation",
      "Terminal report card generation with subject performance distribution graphs",
      "Biometric or tablet student daily attendance logging",
      "Parent communication portal for announcements and fee balance inquiries",
    ],
    defaultSubdomain: "doctrina.flectere.co",
  },

  argentaria: {
    slug: "argentaria",
    name: "ARGENTARIA",
    latinMotto: "Fides Aurea",
    sector: "Banking & Financial Services",
    tagline: "Core banking ledger, SACCO automation, and algorithmic credit risk scoring.",
    mission:
      "Powers microfinance institutions, credit unions (SACCOs), and fintech lenders with an immutable double-entry ledger, automated loan disbursement, and non-performing loan (NPL) early warning telemetry.",
    howItWorks: [
      {
        step: 1,
        title: "KYC & Algorithmic Creditworthiness Scoring",
        description:
          "Ingests bank statements, mobile money records, and identity databases to generate instant credit limit recommendations.",
      },
      {
        step: 2,
        title: "Double-Entry Core Banking Ledger",
        description:
          "Executes loan disbursements, interest accruals, and principal repayments with cryptographic transaction integrity.",
      },
      {
        step: 3,
        title: "Automated Collections & NPL Prevention",
        description:
          "Triggers automated payment reminders, direct debit schedules, and flags delinquent repayment patterns for early intervention.",
      },
    ],
    architecture: {
      dataIngestion: "Core Banking API + Credit Bureau Gateway + Bank/Mobile Money Rails",
      processingEngine: "Immutable Double-Entry Ledger Engine + Bayesian Credit Risk Classifier",
      deliveryModel: "Loan Officer Mobile App + Treasury Risk Terminal",
      telemetryProtocol: "ISO 20022 Financial Messaging + Financial-Grade API (FAPI)",
    },
    targetMarket: [
      "Microfinance Institutions (MFIs)",
      "Savings and Credit Cooperatives (SACCOs)",
      "Asset Financing & SME Lenders",
      "Chamas & Investment Syndicates",
    ],
    keyCapabilities: [
      "Immutable double-entry core financial accounting ledger",
      "Flexible loan product structuring (reducing balance, flat rate, bullet)",
      "Automated mobile money repayment collection and instant ledger posting",
      "Central Bank regulatory reporting and IFRS 9 loan provisioning calculations",
    ],
    defaultSubdomain: "argentaria.flectere.co",
  },
};

export function getArmDossier(slugOrName: string): ArmDossier {
  const normalized = slugOrName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Direct key lookup
  if (ARM_DOSSIERS[normalized]) {
    return ARM_DOSSIERS[normalized];
  }

  // Partial match by name or key
  const match = Object.values(ARM_DOSSIERS).find(
    (d) =>
      d.slug.includes(normalized) ||
      d.name.toLowerCase().includes(slugOrName.toLowerCase()) ||
      slugOrName.toLowerCase().includes(d.slug)
  );

  if (match) return match;

  // Fallback generic dossier for custom or newly registered arms
  return {
    slug: normalized,
    name: slugOrName,
    latinMotto: "Excellence per Ordinem",
    sector: "Enterprise Division",
    tagline: "Autonomous operational arm operating under Flectēre Core governance.",
    mission: `Coordinates specialized domain capabilities, client contracts, and operational execution for the ${slugOrName} sector.`,
    howItWorks: [
      {
        step: 1,
        title: "Client Intake & Scoping",
        description:
          "Evaluates sector demands and structures tailored delivery terms with dedicated milestone monitoring.",
      },
      {
        step: 2,
        title: "Operational Deployment",
        description:
          "Executes services under isolated multi-tenant architecture with centralized capital and CRM synchronization.",
      },
      {
        step: 3,
        title: "Performance & Billing Telemetry",
        description:
          "Tracks continuous delivery, invoice settlement, and client satisfaction metrics directly in Flectēre Hub.",
      },
    ],
    architecture: {
      dataIngestion: "RESTful API / Webhook Endpoints",
      processingEngine: "Cloud PostgreSQL + RLS Isolated Storage",
      deliveryModel: "Dedicated Tenant Workspace",
      telemetryProtocol: "TLS 1.3 / JSON Webhooks",
    },
    targetMarket: [
      "Commercial Sector Enterprises",
      "Government & Sovereign Bodies",
      "Institutional Partners",
    ],
    keyCapabilities: [
      "Tailored sector delivery workflows",
      "Centralized billing and revenue reporting",
      "Client contract and retainer lifecycle management",
    ],
    defaultSubdomain: `${normalized}.flectere.co`,
  };
}
