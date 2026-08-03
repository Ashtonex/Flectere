# Flectēre — Bend before you break.

The official marketing website for Flectēre, a business transformation studio.
Built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, and
a WebGL 3D "bending lattice" hero built with react-three-fiber.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build (also type-checks)
npm run start   # run the production build locally
npm run lint    # eslint
```

Requires Node.js 18.18+ (Next.js 14 requirement).

## Project Structure

```
app/
  (marketing)/             Public site — its own root layout (fonts, Navbar,
                            Footer, noise/vignette overlays)
    layout.tsx
    page.tsx                 Home
    solutions/                Solutions
    method/                    Method
    diagnostic/                Diagnostic tool
    insights/                  Insights list + /insights/[slug] articles
    about/                      About
    contact/                    Contact
  (hub)/                    Internal dashboard + client portal — a SEPARATE
                            root layout, no public chrome. See "The Hub" below.
    layout.tsx
    hub/
      login/
      (app)/                 Authenticated shell (nav + sign-out) wrapping:
        page.tsx               /hub — redirects by role
        leads/                 /hub/leads — internal only
        trading/               /hub/trading — internal only
        portal/                /hub/portal — client only
  api/contact/route.ts     Contact form submission handler (public, no auth)

components/
  layout/                   Navbar, Footer
  brand/                    Logo (wraps the real mark image)
  ui/                        Button, Container, SectionHeading, PageHero,
                              GradientText, RevealOnScroll
  visuals/                  HeroScene, MethodScene (WebGL/R3F), WatermarkPlane,
                              BendDivider, HeroFallback, useWebGLSupported
  home/                      Homepage sections
  method/                    MethodScroller (shared scroll-driven 3D section),
                              MethodDetailGrid
  solutions/                SolutionsList
  diagnostic/               DiagnosticTool, ScoreResult, RadialGauge
  about/                     FounderStory
  contact/                   ContactForm
  hub/                       SignOutButton (hub-only components)

middleware.ts              Refreshes the Supabase session and gates /hub/*
                            (scoped matcher — never touches the public site)

supabase/migrations/       SQL schema + RLS for the hub (see "The Hub" below)

lib/
  supabase/                 client.ts (browser), server.ts (server + admin)
  hub/                       types.ts, analytics.ts (ROI/spend calculations)
  content.ts                All editable site copy — capabilities, problems,
                              method steps, testimonials, articles, mottos, etc.
  diagnosticData.ts         The 8 diagnostic questions + scoring options
  scoring.ts                 Pure function that turns quiz answers into a
                              Business Flexibility Score + recommendation
  utils.ts                  cn() class-merge helper

public/
  brand/                    flectere-mark.png (logo), flectere-seal.png
                              (watermark seal) — the real brand assets
```

## Brand System

- **Colors**: gold (`#C6A159`, brand primary — pulled from the mark) and
  graphite/silver (`#9BA1A8`, secondary — pulled from the seal) on a
  near-black base. No blue in the palette anywhere — defined in
  `tailwind.config.ts` (`gold` / `graphite` color scales) and
  `app/globals.css` (`.text-gradient`, `.eyebrow`).
- **Logo**: `components/brand/Logo.tsx` renders the real gold labyrinth mark
  (`public/brand/flectere-mark.png`) via `next/image`, with an optional
  wordmark. Used in the Navbar and Footer.
- **Watermark**: `components/visuals/WatermarkPlane.tsx` renders the seal
  (`public/brand/flectere-seal.png`) as a low-opacity (~6%), off-axis, partly
  cropped plane inside the Hero and Method 3D scenes — deliberately never
  square to the camera or fully in frame. It loads the texture imperatively
  (not via suspense), so if the asset is ever missing, the scene just renders
  without it instead of breaking.
- **Latin mottos**: `mottos` in `lib/content.ts` — the three phrases from the
  seal (*Imperium per Systemata*, *Ens Causa Sui*, *Aude Sapere*), used
  verbatim in the Method section, About page, Diagnostic intro, and the
  footer's motto line.

### A note on the brand asset files

`public/brand/flectere-mark.png` and `flectere-seal.png` are 6250×6250px
source exports (10–22MB) — fine for print, oversized for a web texture. The
`sharp` package is a dependency specifically so Next's built-in image
optimizer (`next/image`, and the `/_next/image` endpoint `WatermarkPlane`
requests) can resize them fast and cache the result; without `sharp`, Next
falls back to a much slower WASM decoder and the first request for a new
size can take several seconds. If you ever want to trim this further, drop
a pre-resized (~1500px) copy of the seal in `public/brand/` and point
`WatermarkPlane`'s `url` prop at it.

## Editing Content

Almost all site copy lives in **`lib/content.ts`** — capabilities, problem
statements, method step descriptions, before/after lists, the founder story,
testimonials, partner logos, and insight articles. Edit that file to update
copy without touching any component markup.

The diagnostic tool's questions and scoring weights live in
**`lib/diagnosticData.ts`**; the scoring algorithm (score, strongest/weakest
dimension, recommendation) lives in **`lib/scoring.ts`**.

### Placeholder content

A few things are placeholders (no real data exists yet) and are explicitly
flagged in the code and UI with a small "Placeholder" badge:

- **Founder story** — `founderStory` in `lib/content.ts`
- **Testimonials** — `testimonials` in `lib/content.ts`
- **Partner/tool logos** — `partnerLogos` in `lib/content.ts`
- **Contact email** — `hello@flectere.com` in `app/contact/page.tsx`

Search the codebase for `Placeholder` to find every flagged spot.

## Connecting a Real Backend

**Contact form** — `components/contact/ContactForm.tsx` posts JSON to
`app/api/contact/route.ts`, which `console.log`s the submission and — if
Supabase env vars are present — also inserts it into the hub's `leads`
table (see "The Hub" below), so it shows up at `/hub/leads`. Diagnostic
completions ride the same path: the diagnostic's CTA links to
`/contact?source=diagnostic&score=..&focus=..`, the Contact page reads that
via `searchParams` into a context note, and if the visitor submits the form
from there, the lead is tagged `source: 'diagnostic'` with the score/focus
attached. An anonymous diagnostic completion that never reaches Contact
isn't persisted — there's no name/email to attach it to until they do.

An email notification (Resend, SendGrid, HubSpot, etc.) can still be added
alongside the Supabase insert — the spot is marked with a comment in
`app/api/contact/route.ts`.

## The Hub

`/hub` is a private internal dashboard + client portal, structurally
separate from the marketing site (its own root layout — see `app/(hub)/`).
It needs a Supabase project; the code degrades gracefully without one (the
public site works fine, `/hub/*` returns a clear 500 explaining what's
missing instead of doing something silently wrong).

### One-time setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine to start).
2. Copy `.env.local.example` to `.env.local` and fill in the three values
   from **Project Settings → API**: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (the
   service-role key is a secret — it's already gitignored via `.env*.local`,
   never commit it or paste it anywhere outside this file).
3. Open the Supabase Dashboard's **SQL Editor**, paste in the full contents
   of `supabase/migrations/0001_hub_schema.sql`, and run it. This creates
   every table, RLS policy, and grant the hub needs.
4. Create the first internal user — there's no signup UI (client accounts
   are created by an internal admin, and the very first internal user has
   to be bootstrapped once). In **Authentication → Users**, add a user with
   an email/password, then run this in the SQL Editor to grant them the
   `internal` role (role lives in `app_metadata`, which only the
   service-role key can set — the Dashboard's "Add user" flow doesn't
   expose this field directly):
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role": "internal"}'::jsonb
   where email = 'you@example.com';
   ```
5. `npm run dev` and sign in at `/hub/login`.

### Creating a client login

From `/hub/trading`, add a `clients` row and a `trading_accounts` row linked
to it. The client's actual *login*, though, isn't self-serve yet — creating
their `auth.users` row with `app_metadata: { role: 'client', client_id: '<uuid>' }`
currently has to go through the Supabase Admin API (`supabase.auth.admin.createUser`,
using the service-role key) or the Dashboard + the same `raw_app_meta_data`
SQL pattern above with `client_id` added. Wiring a proper "invite client"
button into `/hub/trading` that does this in one click is a natural next
step, not yet built.

### What's here vs. what's next

Phase 1 (built): auth with two roles (`internal`/`client`) enforced by
Postgres RLS — not just hidden UI — an internal dashboard for leads and
trading accounts, manual entry for performance snapshots and expenses,
basic ROI/spend analytics, and a read-only client portal.

Not built yet, deliberately:
- **Live sync from a specific broker/prop firm.** [TradeZella](https://www.tradezella.com/brokersupport)
  has no public API for pulling data out (only CSV export, or its own
  one-way sync in). Most brokers/prop firms run MetaTrader, where
  [MetaApi.cloud](https://metaapi.cloud/) is the standard way to pull live
  balance/equity/trade history — but it's billed per connected account, so
  this needs a specific platform picked before it's worth building.
- **A CMS for Insights content** — articles still live in `lib/content.ts`.

## Notes on the 3D

`components/visuals/HeroScene.tsx` and `components/visuals/MethodScene.tsx`
are WebGL scenes built with `@react-three/fiber`. Both:

- load only on the client (`next/dynamic(..., { ssr: false })`),
- fall back to a static SVG (`HeroFallback.tsx`, or the 2D progress rail in
  the method section) when `prefers-reduced-motion` is set or WebGL isn't
  available — see `components/visuals/useWebGLSupported.ts`,
- animate via `useFrame`, writing directly into `BufferGeometry` attributes
  each frame rather than triggering React re-renders.

If you change the particle/segment counts, keep an eye on frame time on
lower-end laptops — the hero currently renders ~160 points / ~280 line
segments, and the method scene ~104 points / ~190 segments.

## Security

`npm audit` currently reports high-severity advisories against Next.js 14.2.x
(server-side request smuggling / DoS / cache-poisoning classes) whose fixes
ship in Next.js 16, a breaking major version. This project intentionally
stays on Next 14 (latest 14.2.x patch) for now rather than force an
unreviewed major upgrade. Before deploying this site to production, plan a
tested upgrade to the latest Next.js major version and re-run `npm audit`.

## Deployment Notes

The public marketing site needs no environment variables to run. The hub
needs the three Supabase variables described in "The Hub" above —
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to
expose client-side (as their names say), but `SUPABASE_SERVICE_ROLE_KEY`
must only ever be set as a server-side environment variable (in Vercel:
a regular Environment Variable, not one exposed to the Edge/browser) —
never prefix it with `NEXT_PUBLIC_`, and never reference it from a Client
Component. If an email provider gets added later (e.g. `RESEND_API_KEY`),
the same rule applies: server-side only.
