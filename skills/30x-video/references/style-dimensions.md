<!--
[INPUT]: Content brief, design profile from Style Hunter
[OUTPUT]: 5-dim style picks with decision heuristics
[POS]: references/ 的合成层; agent 选风格组合的查找表
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# 5-dimensional Style Composer

Pick exactly ONE option from each dimension. The combination defines the
video's expressive identity. Agent's job is to pick by content-fit, not
preference.

## Dim 1 — Visual Style (7 options)

### product-ui-mockup
Animated UI dashboards, mockup screens, product surfaces. The interface
IS the protagonist.
- **Best for:** SaaS launches, feature demos, B2B product reveals
- **Reference videos:** Linear / Stripe / Notion product films
- **Pairs well with:** medium-narrative pacing, conversational-host VO

### cinematic-luxury
Slow zooms, controlled lighting, precision typography, breathing whitespace.
Premium ad film energy.
- **Best for:** Hardware launches, brand films, premium products
- **Reference videos:** Apple Vision Pro, Aesop, Patagonia documentaries
- **Pairs well with:** slow-luxury pacing, authoritative-narrator VO, cinematic-orchestral BGM

### data-viz-driven
Numbers, charts, count-ups, comparisons as the visual hero.
- **Best for:** Annual reports, year-in-review, market analysis
- **Reference videos:** Spotify Wrapped, Stripe Annual Letter, Bloomberg Inequality
- **Pairs well with:** medium-narrative pacing, authoritative-narrator VO

### lifestyle-shot
Real-world contexts: people, environments, objects in use. Not animated,
photographic feel.
- **Best for:** Consumer products, social-first campaigns, brand mood
- **Reference videos:** Glossier, Blue Bottle, Vacation Sunscreen
- **Pairs well with:** quick-hook or medium-narrative pacing, lo-fi-warm BGM

### typography-statement
Large-scale text as the visual centerpiece. Words ARE the design.
- **Best for:** Manifestos, declarations, quote videos, hot-takes
- **Reference videos:** Nike "Dream Crazy", Apple "Think Different", Saul Bass-style work
- **Pairs well with:** medium-narrative pacing, none or character VO, silence-with-sfx BGM

### comparison-split
Side-by-side, before/after, vs panels. Conflict drives narrative.
- **Best for:** Competitive positioning, transformation stories, A/B reveals
- **Pairs well with:** quick-hook pacing, conversational-host VO

### before-after
Single subject, transformation over time. Linear narrative.
- **Best for:** Product impact, customer transformation, redesign reveals
- **Pairs well with:** medium-narrative pacing, authoritative-narrator VO

## Dim 2 — Pacing (4 options)

| Option | Total duration | Per scene | Use when |
|---|---|---|---|
| **slow-luxury** | 35-45s | 4-6s | Hardware / brand films / premium |
| **medium-narrative** | 20-35s | 2-3s | SaaS launches / product demos / explainers |
| **quick-hook** | 10-15s | 1-2s | Social ads / trailer-style / attention-first |
| **tiktok-flash** | 7-15s | 0.5-1s | TikTok / Shorts / hook-driven creator |

**Decision heuristic:** if the content has 1-2 ideas → slow-luxury. 3-4
ideas → medium-narrative. Single hook → quick-hook or tiktok-flash.

## Dim 3 — BGM Archetype (7 options)

| Option | Tempo | Mood | Pairs with |
|---|---|---|---|
| **minimalist-ambient** | 60-80 BPM | calm, spacious | slow-luxury, cinematic-luxury, editorial |
| **techno-driving** | 120-130 BPM | confident, modern | quick-hook, product-ui-mockup |
| **cinematic-orchestral** | varies | epic, sweeping | slow-luxury, cinematic-luxury |
| **hip-hop-confident** | 80-100 BPM | bold, contemporary | quick-hook, lifestyle, social |
| **lo-fi-warm** | 70-90 BPM | warm, intimate | lifestyle, creator content, tutorials |
| **silence-with-sfx** | n/a | minimal, design-led | typography-statement, slow-luxury |
| **speech-only** | n/a | VO-driven | educational, podcast clips, talking-head |

**Decision heuristic:** match BPM to pacing. Slow content + fast BGM
creates anxious mismatch. Match mood to brand archetype.

## Dim 4 — VO Archetype (5 options)

### none
No voice over. On-screen text + BGM carry the narrative.
- **Use for:** typography-statement videos, very short hooks, design-led brand films

### conversational-host
Warm, intimate, like a friend explaining something. Mid-range pitch,
natural pacing.
- **Use for:** creator content, tutorials, brand films with relatable tone
- **Voice models:** Kokoro `bella` / `michael`, ElevenLabs `Rachel` / `Adam`

### authoritative-narrator
Confident, measured, like a documentary narrator. Deeper pitch, deliberate
pacing.
- **Use for:** product launches, brand films, premium positioning
- **Voice models:** Kokoro `chris`, ElevenLabs `Antoni` / `Daniel`, OpenAI `onyx`

### character-voice
Distinctive personality. Could be playful, dramatic, intentionally weird.
- **Use for:** brand films with strong personality, social-first creative
- **Voice models:** ElevenLabs has best variety here

### multi-speaker
Two voices in dialogue. Interview-style or conversation.
- **Use for:** testimonials, panels, before-after dialogue
- **Note:** more complex to time and align — only when narrative requires it

## Dim 5 — Format (4 options)

| Format | Aspect | Best for | Safe zones |
|---|---|---|---|
| **16:9** | horizontal | YouTube, web hero, OOH, presentations | Standard, no major UI overlay |
| **9:16** | vertical | TikTok, Instagram Reels, YouTube Shorts | Top 12% + bottom 18% reserved for UI |
| **1:1** | square | Instagram feed, Facebook, LinkedIn | None |
| **4:5** | portrait | Instagram feed (preferred), LinkedIn | None |

**Decision heuristic:**
- Platform mentioned → use that platform's preferred format
- "Social" without specifics → 9:16 (TikTok/Reels dominant)
- "Ad" without specifics → 16:9 (YouTube + web dominant)
- "Launch" / "demo" → 16:9
- "LinkedIn" → 1:1 or 4:5

## Composing the 5 Dimensions

Some combinations are anti-patterns. Reject these:

| Visual | Pacing | Anti-pattern with |
|---|---|---|
| cinematic-luxury | tiktok-flash | Mismatch — luxury needs hold time |
| product-ui-mockup | tiktok-flash | UI unreadable at half-second per scene |
| typography-statement | tiktok-flash | Text needs reading time |
| data-viz-driven | tiktok-flash | Numbers need verification time |

| BGM | VO | Anti-pattern when |
|---|---|---|
| cinematic-orchestral | conversational-host | Tonal collision (orchestra + casual chat) |
| hip-hop-confident | authoritative-narrator | Energy mismatch |
| silence-with-sfx | any VO | Either silence OR VO, not both |

If agent wants to pick an anti-pattern, the choice must be deliberate AND
flagged in Confirmation Gate so user explicitly approves the unusual
combination.

## Default Combinations (sane starting points)

| Use case | Visual | Pacing | BGM | VO | Format |
|---|---|---|---|---|---|
| **SaaS launch** | product-ui-mockup | medium-narrative | techno-driving | authoritative-narrator | 16:9 |
| **Hardware reveal** | cinematic-luxury | slow-luxury | cinematic-orchestral | authoritative-narrator | 16:9 |
| **Creator hot-take** | typography-statement | medium-narrative | none | conversational-host | 9:16 |
| **Tutorial / explainer** | product-ui-mockup | medium-narrative | lo-fi-warm | conversational-host | 16:9 |
| **Lifestyle social** | lifestyle-shot | quick-hook | hip-hop-confident | none | 9:16 |
| **Annual report** | data-viz-driven | medium-narrative | minimalist-ambient | authoritative-narrator | 16:9 |
| **Brand manifesto** | typography-statement | slow-luxury | minimalist-ambient | authoritative-narrator | 16:9 |
| **TikTok hook** | comparison-split | tiktok-flash | hip-hop-confident | conversational-host | 9:16 |

These are starting points, not commands. Adjust per content fit.
