export type Motto = {
  key: string;
  latin: string;
  translation: string;
  context: string;
};

// The three mottos inscribed on the Flectēre seal. Real brand copy, not
// invented Latin — used verbatim wherever the site draws on the seal.
export const mottos: Motto[] = [
  {
    key: "imperium",
    latin: "Imperium per Systemata",
    translation: "Mastery through systems.",
    context: "method",
  },
  {
    key: "ens-causa-sui",
    latin: "Ens Causa Sui",
    translation: "A being that is the cause of itself.",
    context: "about",
  },
  {
    key: "aude-sapere",
    latin: "Aude Sapere",
    translation: "Dare to be wise.",
    context: "diagnostic",
  },
];

export type MethodStep = {
  key: "sense" | "shape" | "shift" | "scale";
  number: string;
  title: string;
  tagline: string;
  description: string;
  details: string[];
};

export const methodSteps: MethodStep[] = [
  {
    key: "sense",
    number: "01",
    title: "Sense",
    tagline: "Find the real constraint.",
    description:
      "Before anything changes, we find out what's actually holding the business back — not the symptom the team has learned to talk about, but the constraint underneath it.",
    details: [
      "Structured diagnostic across strategy, operations, systems, and data",
      "Stakeholder interviews to separate opinion from evidence",
      "A clear, ranked map of what's actually limiting growth",
    ],
  },
  {
    key: "shape",
    number: "02",
    title: "Shape",
    tagline: "Design the system that fits.",
    description:
      "We design the strategy, operating model, or system architecture that removes the constraint — built for where the business is going, not where it's been.",
    details: [
      "Target operating model and decision architecture",
      "Prioritized roadmap sequenced by impact and effort",
      "Clear ownership: who decides, who builds, who's accountable",
    ],
  },
  {
    key: "shift",
    number: "03",
    title: "Shift",
    tagline: "Implement in the real business.",
    description:
      "Plans don't move revenue — implementation does. We work inside the business to change workflows, tools, and team structure without stalling day-to-day operations.",
    details: [
      "Embedded implementation, not a handoff binder",
      "Tooling, automation, and workflow changes shipped in weeks, not quarters",
      "Teams trained and aligned on the new operating rhythm",
    ],
  },
  {
    key: "scale",
    number: "04",
    title: "Scale",
    tagline: "Measure, automate, compound.",
    description:
      "Once the system fits, we instrument it — so the business can measure what matters, automate what's repeatable, and keep adapting long after the engagement ends.",
    details: [
      "Decision dashboards tied to the metrics that matter",
      "Automation layered onto proven workflows",
      "A cadence for reviewing and re-bending the system as the market moves",
    ],
  },
];

export type Problem = {
  title: string;
  description: string;
};

export const problems: Problem[] = [
  {
    title: "Growth has slowed.",
    description:
      "The playbook that got you here has stopped producing results, and no one is quite sure why.",
  },
  {
    title: "Teams are busy but not aligned.",
    description:
      "Everyone is working hard, in different directions, toward goals that were never quite reconciled.",
  },
  {
    title: "Operations depend on too much manual work.",
    description:
      "Growth means more headcount instead of more leverage, because the systems don't scale on their own.",
  },
  {
    title: "Marketing and positioning are unclear.",
    description:
      "The business is hard to describe in one sentence — so prospects, partners, and even employees stay unsure of what makes it different.",
  },
  {
    title: "Data exists, but decisions are still guesswork.",
    description:
      "Dashboards multiply while confidence doesn't. Reporting isn't the same as intelligence.",
  },
  {
    title: "The business becomes harder to run as it grows.",
    description:
      "Every new customer, hire, or product adds friction instead of momentum — a sign the system, not the effort, is the problem.",
  },
  {
    title: "Leadership can feel the constraint.",
    description:
      "The pressure is obvious before the source is. Leaders know something is rigid, but the system has not made the constraint visible yet.",
  },
];

export type Capability = {
  key: string;
  title: string;
  icon:
    | "compass"
    | "workflow"
    | "cpu"
    | "trending-up"
    | "bar-chart-3"
    | "sparkles";
  problem: string;
  whatWeDo: string;
  outcome: string;
};

export const capabilities: Capability[] = [
  {
    key: "strategy-positioning",
    title: "Strategy & Positioning",
    icon: "compass",
    problem:
      "Leadership can't agree on what the business is, who it's for, or why it wins — so every plan underneath it wobbles.",
    whatWeDo:
      "We clarify the market position, the competitive edge, and the strategic priorities the whole company can actually execute against.",
    outcome:
      "A strategy sharp enough to say no to the wrong opportunities — and fast enough to say yes to the right ones.",
  },
  {
    key: "business-systems-operations",
    title: "Business Systems & Operations",
    icon: "workflow",
    problem:
      "The operating model was built for a smaller company, and every new hire or customer adds friction instead of leverage.",
    whatWeDo:
      "We redesign workflows, ownership, and operating rhythm so the business runs on systems instead of heroics.",
    outcome:
      "An operation that gets easier to run as it grows, not harder.",
  },
  {
    key: "ai-automation",
    title: "AI & Automation",
    icon: "cpu",
    problem:
      "Manual, repetitive work is quietly consuming the team's time, budget, and accuracy — and no one has mapped where it's worst.",
    whatWeDo:
      "We identify manual bottlenecks and build intelligent workflows that save time, reduce errors, and make the business easier to run.",
    outcome:
      "Hours returned to the team every week, and fewer costly mistakes slipping through.",
  },
  {
    key: "growth-market-expansion",
    title: "Growth & Market Expansion",
    icon: "trending-up",
    problem:
      "Growth has plateaued, or the next market feels too risky to enter without a clear read on demand and economics.",
    whatWeDo:
      "We build the go-to-market model, channel strategy, and expansion plan — grounded in real unit economics, not optimism.",
    outcome:
      "A growth engine with a plan behind it, not just a bigger budget.",
  },
  {
    key: "data-decision-intelligence",
    title: "Data & Decision Intelligence",
    icon: "bar-chart-3",
    problem:
      "The business collects data everywhere, but decisions are still made on instinct because no one trusts — or understands — the numbers.",
    whatWeDo:
      "We design decision dashboards and reporting systems built around the handful of metrics that actually drive outcomes.",
    outcome:
      "Leadership making faster calls with real confidence, not competing spreadsheets.",
  },
  {
    key: "brand-customer-experience",
    title: "Brand & Customer Experience",
    icon: "sparkles",
    problem:
      "The brand doesn't reflect how good the product actually is, and the customer experience feels inconsistent across every touchpoint.",
    whatWeDo:
      "We rebuild the brand system and customer journey so every interaction reinforces trust and premium perception.",
    outcome:
      "A brand and experience that finally match the ambition of the business behind them.",
  },
];

export type ProductArm = {
  rank: number;
  key: string;
  productName: string;
  sector: string;
  positioning: string;
  aiOpportunities: string[];
  likelyCustomers: string[];
  status: "Priority" | "Planned";
};

export const productArms: ProductArm[] = [
  {
    rank: 1,
    key: "shield",
    productName: "SHIELD",
    sector: "Insurance & InsurTech",
    positioning:
      "For insurers losing time and margin to slow claims, weak risk visibility, and fragmented broker operations.",
    aiOpportunities: [
      "Policy administration",
      "Claims triage",
      "Risk scoring",
      "Broker portals",
      "Customer portals",
      "Fraud controls",
    ],
    likelyCustomers: ["Insurers", "Brokers", "Administrators", "InsurTech teams"],
    status: "Priority",
  },
  {
    rank: 2,
    key: "cuniculus",
    productName: "CUNICULUS",
    sector: "Mining",
    positioning:
      "For mines where equipment downtime, compliance gaps, production blind spots, and contractor leakage carry real cost.",
    aiOpportunities: [
      "Mine operations",
      "Production reporting",
      "Equipment monitoring",
      "Compliance controls",
      "Mineral intelligence",
      "Contractor oversight",
    ],
    likelyCustomers: ["Mines", "Mining contractors", "Plant operators"],
    status: "Priority",
  },
  {
    rank: 3,
    key: "cropus",
    productName: "CROPUS",
    sector: "Agriculture",
    positioning:
      "For farms and aggregators that need earlier crop signals, cleaner records, stronger market access, and tighter supply control.",
    aiOpportunities: [
      "Farm management",
      "Crop intelligence",
      "Livestock records",
      "Market matching",
      "Supply chains",
      "Yield forecasting",
    ],
    likelyCustomers: ["Commercial farms", "Aggregators", "Agri-insurers", "Cooperatives"],
    status: "Priority",
  },
  {
    rank: 4,
    key: "vectura",
    productName: "VECTURA",
    sector: "Transport & Logistics",
    positioning:
      "For fleets exposed to fuel loss, poor routing, delivery disputes, maintenance surprises, and driver risk.",
    aiOpportunities: [
      "Fleet management",
      "Deliveries",
      "Route optimisation",
      "Cargo control",
      "Transport operations",
      "Fuel monitoring",
    ],
    likelyCustomers: ["Hauliers", "Distributors", "Bus operators", "Fleet owners"],
    status: "Priority",
  },
  {
    rank: 5,
    key: "fabrica",
    productName: "FABRICA",
    sector: "Manufacturing",
    positioning:
      "For manufacturers losing throughput to weak planning, inventory noise, quality failures, and unplanned downtime.",
    aiOpportunities: [
      "Production planning",
      "Inventory",
      "Quality control",
      "Maintenance",
      "Raw-material forecasting",
      "Downtime warnings",
    ],
    likelyCustomers: ["Factories", "Processors", "Industrial operators"],
    status: "Priority",
  },
  {
    rank: 6,
    key: "potentia",
    productName: "POTENTIA",
    sector: "Energy",
    positioning:
      "For energy operators that need cleaner asset visibility, fault detection, billing control, and demand intelligence.",
    aiOpportunities: [
      "Energy monitoring",
      "Asset management",
      "Billing",
      "Predictive maintenance",
      "Fault detection",
      "Demand forecasting",
    ],
    likelyCustomers: ["Solar companies", "Mines", "Factories", "Energy operators"],
    status: "Priority",
  },
  {
    rank: 7,
    key: "salus",
    productName: "SALUS",
    sector: "Healthcare & Veterinary Services",
    positioning:
      "For clinics and veterinary operators where records, medicine stock, follow-up, claims, and triage cannot remain manual.",
    aiOpportunities: [
      "Patient records",
      "Animal records",
      "Diagnostics support",
      "Facilities",
      "Medicine management",
      "Follow-up workflows",
    ],
    likelyCustomers: ["Clinics", "Pharmacies", "Vets"],
    status: "Planned",
  },
  {
    rank: 8,
    key: "doctrina",
    productName: "DOCTRINA",
    sector: "Education",
    positioning:
      "For schools that need stronger administration, assessments, learning visibility, and student performance intelligence.",
    aiOpportunities: [
      "School administration",
      "Learning platforms",
      "Assessments",
      "Student analytics",
      "Local curriculum tools",
      "Marking support",
    ],
    likelyCustomers: ["Private schools", "Colleges", "Parents", "Training providers"],
    status: "Planned",
  },
  {
    rank: 9,
    key: "stirps",
    productName: "STIRPS",
    sector: "Wholesale & Retail",
    positioning:
      "For retailers and wholesalers fighting stock gaps, shrinkage, weak purchasing, unclear margins, and fragmented customer data.",
    aiOpportunities: [
      "Multi-tenant POS",
      "Inventory",
      "Purchasing",
      "Distribution",
      "Customer intelligence",
      "Margin controls",
    ],
    likelyCustomers: ["Groceries", "Wholesalers", "Pharmacies", "Distributors"],
    status: "Planned",
  },
  {
    rank: 10,
    key: "aedificium",
    productName: "AEDIFICIUM",
    sector: "Construction & Infrastructure",
    positioning:
      "For contractors and developers exposed to cost overruns, procurement drift, site opacity, plant misuse, and workforce risk.",
    aiOpportunities: [
      "Projects",
      "Sites",
      "Commercial controls",
      "Procurement",
      "Plant",
      "Workforce",
    ],
    likelyCustomers: ["Contractors", "Developers", "QS firms", "Infrastructure operators"],
    status: "Priority",
  },
  {
    rank: 11,
    key: "argentaria",
    productName: "ARGENTARIA",
    sector: "Banking & Financial Services",
    positioning:
      "For lenders and financial institutions that need sharper credit, collections, compliance, and portfolio intelligence.",
    aiOpportunities: [
      "Banks",
      "MFIs",
      "SACCOs",
      "Lending",
      "Collections",
      "Compliance intelligence",
    ],
    likelyCustomers: ["Banks", "MFIs", "SACCOs", "Credit providers"],
    status: "Planned",
  },
];

export const beforeAfter = {
  before: [
    "Scattered tools",
    "Manual workflows",
    "Slow decisions",
    "Unclear ownership",
    "Inconsistent growth",
    "Reactive leadership",
  ],
  after: [
    "Clear systems",
    "Automated workflows",
    "Faster decisions",
    "Aligned teams",
    "Measurable growth",
    "Adaptive operating model",
  ],
};

export const founderStory = {
  name: "Ashton Mercer",
  role: "Founder & Managing Partner, Flectēre",
  bio: "After more than a decade operating across high-stakes trading, capital systems, and enterprise turnarounds, Flectēre was built on one uncompromising principle: transformation only holds when it is engineered into the operating fabric of the firm, not handed over in a presentation binder. The Sense–Shape–Shift–Scale method represents hundreds of iterations solving structural bottlenecks in live operations.",
};

export const credibilityPoints = [
  "A named, repeatable method — Sense, Shape, Shift, Scale — not a one-off engagement",
  "Cross-functional depth across strategy, operations, technology, and data",
  "Built for founder-led and growth-stage companies where change has to ship fast",
  "Engagements end with systems and ownership in place, not a slide deck",
];

export type Principle = { title: string; description: string };

export const principles: Principle[] = [
  {
    title: "Diagnose before you prescribe",
    description:
      "We don't sell a fixed package. Every engagement starts with Sense — finding the real constraint before proposing what to change.",
  },
  {
    title: "Implementation over decks",
    description:
      "A strategy that lives in a slide deck isn't a strategy yet. We stay embedded through Shift, until the change is running in the business.",
  },
  {
    title: "Systems outlast advice",
    description:
      "Advice fades. Systems — workflows, dashboards, automations, operating rhythms — keep working after the engagement ends.",
  },
  {
    title: "Flexibility, not disruption for its own sake",
    description:
      "The goal isn't to change everything. It's to make the business adaptable enough that the next change doesn't require a crisis.",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  placeholder?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Reserved for a verified client result once Flectēre has approval to publish the metric, name, and operational context.",
    name: "Client result slot",
    role: "Verified testimonial pending",
    placeholder: true,
  },
  {
    quote:
      "Reserved for a founder or operator quote about the Sense, Shape, Shift, Scale method after permission is secured.",
    name: "Operator quote slot",
    role: "Approved quote pending",
    placeholder: true,
  },
  {
    quote:
      "Reserved for a measurable transformation story covering before-state, shipped system, and after-state impact.",
    name: "Transformation proof slot",
    role: "Case study pending",
    placeholder: true,
  },
];

export const partnerLogos: string[] = [
  "Supabase Architecture",
  "PostgreSQL Engine",
  "Next.js Systems",
  "Python / FastAPI",
  "AWS Cloud Infrastructure",
  "MetaTrader 5 Protocol",
  "Docker Containerization",
  "Stripe Financial Infrastructure",
  "Tailwind CSS Design System",
  "Framer Motion",
];

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  body: string[];
};

export const articles: Article[] = [
  {
    slug: "flexibility-over-efficiency",
    title: "Why Businesses Need Flexibility More Than Efficiency",
    excerpt:
      "Efficiency optimizes for the world as it is. Flexibility prepares you for the world as it's about to become. Most businesses are over-indexed on the former.",
    category: "Strategy",
    readTime: "6 min read",
    body: [
      "Efficiency is seductive because it's measurable. Cut the process by two steps, save four hours a week, ship the report. Flexibility rarely shows up as cleanly — it looks like slack in the system, redundancy, options you didn't need to use. In a quarterly review, efficiency wins every time.",
      "But efficiency optimizes for the world as it currently exists. It assumes the market, the customer, and the competitive set will hold still long enough for the optimization to pay off. Increasingly, that assumption doesn't survive contact with reality — pricing shifts, a competitor ships something category-defining, a channel that drove half your pipeline changes its algorithm overnight.",
      "Flexibility is the ability to absorb that kind of shock and reshape around it instead of breaking. It shows up as a team that can re-prioritize in a week instead of a quarter, a tech stack that can support a new offering without a rebuild, a data layer that can answer a new question without a six-week reporting project.",
      "The businesses that compound over decades aren't the most efficient ones — they're the ones that stayed efficient enough while remaining bendable. That's a design choice, not an accident. It means building in the capacity to sense a shift early, and the systems to shape a response quickly, before the constraint becomes existential.",
      "The practical takeaway: audit your business not just for waste, but for rigidity. Where would a 20% change in the market break something? Those are the places worth reshaping before you're forced to.",
    ],
  },
  {
    slug: "hidden-cost-of-manual-operations",
    title: "The Hidden Cost of Manual Operations",
    excerpt:
      "Manual workflows don't just cost time — they cost accuracy, morale, and the ability to scale without proportionally scaling headcount.",
    category: "Operations",
    readTime: "5 min read",
    body: [
      "The obvious cost of a manual process is time — someone doing by hand what a system could do automatically. That's the cost everyone sees. It's rarely the biggest one.",
      "The larger cost is what manual work does to accuracy and morale. Every manual handoff is a point where information degrades — a copy-paste error, a stale spreadsheet, a step someone forgot under deadline pressure. Multiply that across a growing team and the business starts making decisions on data it can't fully trust, which is its own kind of paralysis.",
      "Then there's the scaling cost. A manual process that works fine at ten customers becomes the reason you need three more hires at a hundred customers — not because the work itself requires more judgment, but because it requires more hands. That's growth turning into linear headcount instead of leverage, and it quietly caps how fast the business can expand without also expanding cost.",
      "None of this means automating everything on day one. It means being deliberate about which manual processes are load-bearing — the ones that touch customers, revenue, or compliance — and prioritizing those first. The workflows that are manual because no one has gotten around to fixing them are usually more expensive than they look.",
    ],
  },
  {
    slug: "finding-the-real-constraint",
    title: "How to Find the Real Constraint in Your Business",
    excerpt:
      "Most teams solve the symptom that's easiest to see. The constraint that's actually limiting growth is usually one layer deeper.",
    category: "Method",
    readTime: "7 min read",
    body: [
      "Ask a leadership team what's holding growth back and you'll get an honest answer — and it's usually the symptom closest to whoever's in the room. Sales says leads are weak. Marketing says the product isn't differentiated enough. Product says sales oversells what's actually built. Everyone's right about their corner and wrong about the system.",
      "The theory of constraints has a simple, uncomfortable idea at its core: a chain is only as strong as its weakest link, and strengthening any other link does nothing for overall throughput. Most businesses spend their improvement budget on links that were never the bottleneck.",
      "Finding the real constraint requires looking one layer beneath the symptom. Slow sales cycles might not be a sales problem — they might be a positioning problem that makes every deal a re-education exercise. High churn might not be a product problem — it might be an onboarding system that never set the right expectations in the first place.",
      "The method: trace the symptom backward until you hit something structural — a decision that was never made, an ownership gap, a system that was built for a smaller company. That's usually where the real constraint lives. It's rarely the department that's complaining loudest; it's usually one step upstream of them.",
      "Once you find it, resist the urge to fix everything at once. Constraints move. Fix the current one, and a new one will surface — that's not failure, that's the system working. The goal isn't a permanent fix; it's a repeatable way of finding what's actually limiting you, quarter after quarter.",
    ],
  },
  {
    slug: "growth-problems-are-systems-problems",
    title: "Why Growth Problems Are Often Systems Problems",
    excerpt:
      "When growth stalls, the instinct is to push harder on sales and marketing. Often, the real fix is upstream — in the systems supporting them.",
    category: "Systems",
    readTime: "6 min read",
    body: [
      "When revenue growth slows, the default response is to add pressure to the functions closest to revenue — more sales headcount, more ad spend, more aggressive targets. Sometimes that works. Often it just makes an already-strained system creak louder.",
      "Growth is downstream of a lot of things that don't look like growth levers: how fast decisions get made, whether teams are working from the same data, whether the operating model can support a new segment without reinventing itself. Push harder on sales without fixing those, and you get a bigger funnel pouring into the same leaky system.",
      "A useful diagnostic question: if you doubled the leads or the traffic tomorrow, what would break first? For a lot of companies, the honest answer isn't 'nothing' — it's onboarding, or support, or fulfillment, or the founder's calendar. That's the real growth ceiling, and it's a systems problem wearing a growth problem's clothes.",
      "This is why growth work and operations work can't be fully separated. The companies that grow smoothly aren't the ones with the most aggressive targets — they're the ones whose systems can absorb more volume without a proportional increase in chaos. Fix the system, and the growth levers you already have start working harder without needing to be pulled harder.",
    ],
  },
  {
    slug: "what-adaptive-businesses-do-differently",
    title: "What Adaptive Businesses Do Differently",
    excerpt:
      "Adaptive companies do not wait for pressure to become visible in revenue. They build sensing, decision, and execution loops before the market forces them to.",
    category: "Adaptability",
    readTime: "6 min read",
    body: [
      "Adaptive businesses are not simply faster. They are designed to notice change earlier, decide with less ambiguity, and move without waiting for a crisis. That difference usually comes from operating design, not personality.",
      "The first pattern is sensing. Leadership teams in adaptive companies know which signals matter and where those signals live. They do not rely only on quarterly lag indicators; they watch operational friction, customer behavior, margin drift, and team capacity while there is still time to respond.",
      "The second pattern is decision clarity. When the market changes, a rigid business has to debate who owns the response. An adaptive business already has a decision architecture: who reads the signal, who frames the choice, who approves the shift, and how quickly the new direction reaches the teams doing the work.",
      "The third pattern is modular execution. Workflows, tools, and teams are arranged so one change does not require the entire company to pause and rebuild. That is what makes flexibility practical instead of theoretical.",
      "The takeaway is simple: adaptability is not a mood. It is a system. Companies that want to bend before they break need to design the loops that let them keep reshaping while the business is still strong.",
    ],
  },
];
