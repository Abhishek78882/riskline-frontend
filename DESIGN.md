# DESIGN.md — Design System & Ground Truth

**This file is the single source of truth for all visual and interaction design in `straive-frontend`.** Every screen and component must follow it. Read it before building any UI, and re-read it at the start of each session so the design does not drift back to generic defaults. If a screen would violate a rule here, stop and flag it rather than deviating.

**Context that drives every choice:** this is a **data-dense incident-monitoring tool for a card-issuer risk & operations team**, presented to both analysts and non-technical stakeholders. The aesthetic target is **Linear-style restraint with Datadog-style severity coloring** — calm, disciplined, premium, credible. It is NOT a marketing page and NOT a maximalist showpiece. Premium here comes from precision, hierarchy, and restraint, not decoration.

---

## 0. The anti-slop rules (hard constraints — never violate)

These exist because AI-generated UIs fail in recognizable ways. Forbidden, everywhere:
- No purple-to-blue gradient backgrounds. No gradient behind routine UI at all.
- No centered "badge + headline + three-card grid" hero pattern.
- No fake/decorative dashboard mockups or ornamental illustrations.
- No floating icon pills, no "BETA" stamps, no scroll-arrow gimmicks, no decorative text strips.
- No emoji in the UI.
- No thick borders on every region. No card treatment on things that aren't interactive.
- No multiple competing accent colors.
- No generic body fonts (Inter, Roboto, Open Sans, Lato, Arial, system stacks) as the design's personality.
- Solid flat backgrounds are the lazy choice — use subtle layered depth instead.

**One-sentence test:** if a panel can become plain layout without losing meaning, remove the card treatment. Spend visual boldness in exactly one place per screen; keep everything else quiet.

---

## 1. Color system (CSS variables, dark only)

Define all colors as CSS variables in `app/globals.css`. Dark theme only — no light/dark toggle.

**Surfaces (atmospheric dark, not flat black — layer by elevation):**
- `--bg`: `#0B0E14` (app background, deepest)
- `--surface`: `#141922` (raised panels, nav)
- `--card`: `#1A2029` (cards, the interactive layer)
- `--border`: `#242B36` (subtle hairline borders only)
- Add a very subtle radial or layered depth to the app background — atmosphere, not a gradient wash.

**Text:**
- `--text`: `#E6EAF0` (primary, high contrast)
- `--text-muted`: `#8A94A6` (secondary/labels)
- Never gray-on-gray with weak contrast.

**Accent — exactly ONE, for interaction only (links, active tab, primary CTA, focus):**
- `--accent`: `#5B8DEF` (calm indigo-blue). Accent is NOT a severity color and must never be used to signal status.

**Severity / status colors (semantic — used ONLY to communicate incident state, never as decoration):**
- `--sev-high`: `#F0616D` (red — broken/high severity; should read loud)
- `--sev-medium`: `#E5A54B` (amber)
- `--sev-low`: `#8A94A6` (neutral gray — investigate/low; deliberately quiet so it does NOT alarm)
- `--sev-healthy`: `#4CC38A` (green — healthy control/resolved context; use sparingly)

**Rule:** most of the interface stays neutral. Color appears only where it carries meaning. A High-severity outage card should be visually loud (red accent stripe, stronger presence); the benign promo (Investigate) should be visually quiet (neutral). This contrast is the core of the design.

---

## 2. Typography

Personality lives in type, but readability governs a data tool. So: one characterful display face, one clean workhorse for dense UI, one mono for figures. Load via `next/font`.

- **Display (landing hero, section/page headings ONLY):** `DM Serif Display`. *(Updated 2026-07-14 — supersedes the earlier "Geist at extreme weights" display treatment.)* An editorial serif, used deliberately and sparingly: the landing hero headline and major section/page headings. Never body copy, never dense UI, never small sizes — it only works at size and in isolation.
- **Body / UI (labels, prose, tables, in-app headings that aren't the landing hero):** `Geist` regular/medium. Clean and highly readable at small sizes for dense data. Weight extremes (300/400 against 700/800) still apply here for hierarchy within UI chrome — KPI labels, nav, card titles.
- **Numbers / metrics:** `Geist Mono` (or `JetBrains Mono`) with **tabular figures** so KPIs and table columns align. Using a mono with tabular numerals for metrics is a genuine premium signal in a data tool — do this everywhere numbers are compared.

**Scale — use extremes, this is what makes hierarchy read as designed:**
- Weight extremes: pair `300`/`400` against `700`/`800`. Never `400` vs `600` (too timid).
- Size jumps of ~3x between levels, not 1.5x. A hero headline should dwarf body text; a KPI number should dwarf its label.
- Generous line-height on prose (the diagnosis summary), tight on data.

---

## 3. Spatial composition & layout

- **Generous, deliberate whitespace.** Spacing is a design decision, not a gap. Use a consistent spacing scale (4/8-based).
- **Hierarchy over uniformity.** Do not give every element equal visual weight — that is the tell of a template. A few things loud, most things quiet.
- **Cards only when the card is the interaction.** Incident cards = interactive, so they're cards. A metric summary that's just read = plain layout with type hierarchy, not a boxed card.
- Subtle hairline borders (`--border`), never heavy boxes around every region.
- The first viewport of the landing page must read as **one composition**, not a dashboard mosaic. On the app screens, organize around: primary workspace + navigation + secondary context, one clear accent for action/state.

---

## 4. Motion (subtle, fast, purposeful — the "premium feel")

Use the Motion library (formerly Framer Motion) for React. Motion must be felt, not seen.
- **Animate only `transform` and `opacity`** (performance + smoothness). Never animate layout/color for motion effects.
- Keep durations **under ~300ms**. Use custom easing (ease-out for entrances), not linear.
- **One well-orchestrated page-load reveal with staggered timing** (e.g. KPI cards fading/sliding in with small `animation-delay` steps) beats scattered micro-interactions. Do this once per screen, on the meaningful content.
- Hover states on interactive cards: subtle lift/elevation change, fast.
- Tab transitions: quick cross-fade, not jarring swaps.
- **Always respect `prefers-reduced-motion`** — disable non-essential motion when set.
- Do NOT add parallax, scroll-jacking, or heavy scroll animation. "Premium scroll feel" here means smooth, calm, fast — restraint, not spectacle.

---

## 5. Components & primitives

- Use **shadcn/ui** primitives (Button, Card, Dialog, Tabs, Tooltip) as the base — they give a disciplined, accessible foundation. Style them with the tokens above; do not leave them at defaults.
- Icons: `lucide-react`, used only where they aid scanning, never decoratively.
- Charts/sparklines: Recharts or Tremor, themed to the tokens (dark surfaces, severity colors, muted gridlines). A metric sparkline should make an anomaly *visible at a glance* — the drop/spike should be obvious.
- Loading states must be real and specific (skeletons or a labeled spinner like "Jerry is checking the evidence…"), never a bare spinner with no context.

---

## 6. Quality floor (non-negotiable)

- Responsive down to a reasonable laptop/tablet width; the demo runs on a laptop, so desktop-first is fine, but nothing should break at ~1280px.
- Visible keyboard focus states (use the accent color).
- Sufficient contrast (WCAG AA for text).
- Tabular numbers everywhere figures are compared.

---

## 7. How to build & review (the loop that produces premium)

1. Build one screen against this file.
2. Screenshot the result.
3. Compare against the reference image for that screen (Sentry incident list / Datadog dark board / Linear). State exactly what differs in: **type size hierarchy, color usage, spacing rhythm, and composition.** Fix those specific deltas.
4. Two passes closes ~95% of the gap. Do not chase pixel-perfection past two passes — bring it to the owner for a human eye instead.

**Never respond to "make it better" with vibes.** Work from specific deltas against a reference. Specificity beats "modern/clean/premium" — those words carry no information.

---

## 8. Screen-specific notes

**Navigation architecture — updated 2026-07-14.** Diagnosis, Evidence, and Ask Jerry are no longer global top-nav tabs. The journey is a drill-down: Overview (dashboard) → click an incident tile → **Incident Detail** at `/incident/[id]`, which holds three sub-tabs (Diagnosis default, Evidence, Ask Jerry). The top nav is just the product wordmark + Overview + Architecture. This matches the real analyst journey — scan incidents, click one, read the plain-language diagnosis, then optionally dig into evidence or chat — rather than presenting three separate global destinations that only make sense in the context of a chosen incident.

- **Landing:** one bold composition. The product name/hero is the memorable signal. One display headline, calm supporting text, two clear entry cards, the pipeline strip. No hero gimmicks.
- **Overview:** KPI row where the numbers dominate their labels (mono, large, weight-heavy). Incident cards where severity color drives visual weight — High reads loud, promo reads quiet. This screen is the "it's completely different now" moment; make it the strongest. Clicking a card routes into Incident Detail.
- **Incident Detail:** a compact header (id, title, severity badge) above the three sub-tabs. The sub-tab bar is visually one level below the top nav — clearly nested, not a second global nav.
  - **Diagnosis** (default sub-tab): the layman payoff. Lead with the executive summary in large readable prose. Grounding check is calm and collapsible, never styled like an error. At least one sparkline makes the anomaly visible. Diagnosis source badge (Gemini live / fallback) lives here, not in the shared header, since it's diagnosis-specific data.
  - **Evidence:** progressive disclosure — plain layout with strong type hierarchy, not a wall of boxed cards. Dense but readable.
  - **Ask Jerry:** a real, calm chat surface. Suggested-question chips only before the first message.

**Remember:** spend boldness in one place per screen, keep the rest disciplined, and cut any decoration that doesn't serve the analyst. Before shipping a screen, "remove one accessory."
