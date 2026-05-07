<!--
[INPUT]: Brand evidence (Refero screens / metadata / user assets), content tone
[OUTPUT]: Archetype inference for visual + motion temperament
[POS]: design-rules/ 的本质层; 在内容与视觉决策之间提供风格抽象
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Design Archetypes

Use archetypes to sharpen judgment, not to clone websites. Refero's screen library is a semantic reference, not a template source. Start from real evidence, then infer the archetype that explains the brand or content's temperament.

## Inference Rules

1. **Evidence beats archetype.** If real Refero screens or user assets disagree with the inferred archetype, trust the evidence.
2. **One primary, one secondary max.** More than two archetypes means hedging.
3. **Do not copy branded specifics.** Reuse logic, not Stripe purple or Linear's exact layout.
4. **Trust beats spectacle.** For B2B / fintech / data products, credibility outranks ornament.
5. **Tone overrides default.** Educational content needs reading time, not motion graphics.

## The 5 Archetypes

### 1. Financial Precision
- **Reference signals:** Stripe / Square / Mercury / Brex / Coinbase
- **Visual:** white canvas, deep navy anchors, selective color energy, refined depth, no glow spam
- **Typography:** light-to-regular display weights, sharp hierarchy, tabular numerals for proof
- **Density:** low-to-medium, conservative radius, clean segmentation, measured whitespace
- **Motion:** deliberate and luxurious; gliding reveals, confident elevation, no playful bounce
- **Use for:** fintech, payments, enterprise revenue products, trust-first launches

### 2. System Clarity
- **Reference signals:** Linear / Notion / Height / Vercel
- **Visual:** dark surfaces, cool neutrals, indigo-violet restraint, crisp interface rhythm
- **Typography:** utilitarian but elegant; precise headings, tight utility labels
- **Density:** medium-to-high information density, strong alignment, narrow waste
- **Motion:** deliberate and low-amplitude; transitions suggest responsiveness, not theater
- **Use for:** productivity tools, PM systems, ops software, structured B2B products

### 3. Editorial Minimalism
- **Reference signals:** Vercel / Apple / Aesop / Hermès Editorial
- **Visual:** monochrome precision, near-white surfaces, large negative space, restrained surfaces
- **Typography:** typography carries the emotion; weight and scale do the heavy lifting
- **Density:** sparse frames, large breathing zones, low chrome, high confidence
- **Motion:** crisp and quiet; subtle reveals, slow camera logic
- **Use for:** platform launches, brand-led announcements, products with strong positioning copy

### 4. Infra Authority
- **Reference signals:** Datadog / Snowflake / HashiCorp / OpenAI Enterprise
- **Visual:** command-center seriousness, high signal-to-noise, proof over spectacle
- **Typography:** direct, technical, readable at a glance; tabular numerals carry proof
- **Density:** denser UI, modular panes, more evidence per frame
- **Motion:** measured and verifiable; dashboards, timelines, logs, graphs hold long enough to read
- **Use for:** AI infrastructure, security, observability, developer tools, data platforms

### 5. Productive Warmth
- **Reference signals:** Notion (consumer side) / Loom / Slack / Asana
- **Visual:** humane, approachable, but ordered; warmth comes from surface tone, not decoration
- **Typography:** softer but not whimsical; warmth through tone, not cute styling
- **Density:** medium, approachable spacing, gentle surface contrast
- **Motion:** smoother, more inviting, but still purposeful; no cartoon energy
- **Use for:** collaboration tools, knowledge products, workflow software, prosumer brands

## Creator Archetypes (no-brand content)

For content without an associated brand (creator videos, personal posts), default to:

- **Educational** → System Clarity or Infra Authority
- **Inspirational** → Editorial Minimalism or Financial Precision
- **Hot-take / opinion** → Editorial Minimalism with bold typography
- **Lifestyle / vibe** → Productive Warmth
- **Tech / product reveal** → System Clarity or Editorial Minimalism

## Application

Once chosen, apply archetype to:

- **Typography:** font choice, weight range, tracking, headline scale
- **Surface logic:** card depth, border behavior, shadow tone, panel layering
- **Density:** how much fits in one frame before trust degrades
- **Motion:** spring stiffness, hold times, transition restraint, reveal style
- **Proof style:** dashboards, editor states, logs, benchmarks, testimonials, or editorial pacing

## Scene Posture Modifiers

These are not primary archetypes. Use as scene-level modifiers when evidence supports them:

- **Cinematic Product Surface:** UI fills 80-95% of frame, external chrome quiet, hold-then-snap motion
- **Proof-Led Prestige:** metrics, benchmarks, logs, testimonials grouped into controlled clusters; boardroom-ready, not social-flashy

## Rejection Test

If the generated video could be relabeled as another brand with only a logo swap, the archetype inference failed. Re-check evidence, reduce borrowed signals, restore content-specific elements.
