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

export const beforeAfter = {
  before: [
    "Scattered tools that don't talk to each other",
    "Manual workflows that don't scale with headcount",
    "Slow decisions made in stale meetings",
    "Unclear ownership across teams",
    "Growth that feels inconsistent and unpredictable",
  ],
  after: [
    "One connected operating system",
    "Automated workflows that scale with demand",
    "Faster decisions backed by live data",
    "Clear ownership from strategy to execution",
    "Measurable, compounding growth",
  ],
};

// Placeholder — replace with your founder's real story, photo, and background.
export const founderStory = {
  placeholder: true as const,
  name: "Founder Name",
  role: "Founder & Managing Partner, Flectēre",
  bio: "After a decade spent inside operating roles — watching strategy decks gather dust while the actual business kept running on spreadsheets and tribal knowledge — Flectēre was built on one belief: transformation only sticks when it's implemented inside the business, not handed to it. The Sense–Shape–Shift–Scale method is the result of running that loop, in real companies, until it became repeatable.",
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
  placeholder: true;
};

// NOTE: These are clearly-marked placeholders. Replace with real client
// quotes (and remove the `placeholder` flag / badge) once available.
export const testimonials: Testimonial[] = [
  {
    quote:
      "Flectēre didn't hand us a deck. They found the actual constraint in our operations and helped us fix it in weeks, not quarters.",
    name: "Placeholder Client",
    role: "CEO, Placeholder Company",
    placeholder: true,
  },
  {
    quote:
      "For the first time, our leadership team is making decisions from the same data instead of arguing about whose numbers are right.",
    name: "Placeholder Client",
    role: "COO, Placeholder Company",
    placeholder: true,
  },
  {
    quote:
      "The Sense-Shape-Shift-Scale method gave us a shared language for change. That alone was worth the engagement.",
    name: "Placeholder Client",
    role: "Founder, Placeholder Company",
    placeholder: true,
  },
];

// Placeholder partner/tool logos — swap for real integration or client logos.
export const partnerLogos: string[] = [
  "Placeholder Partner",
  "Placeholder Platform",
  "Placeholder Tool",
  "Placeholder Partner",
  "Placeholder Platform",
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
];
