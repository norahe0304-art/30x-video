<!--
[INPUT]: BrandTruth, ScreenshotProof, VideoProof, DesignArchetype, StoryIntent
[OUTPUT]: Evidence-driven 5-act scene constitution for launch videos
[POS]: rules/ 的叙事骨架; 负责把品牌现实和用户意图编排成可信、克制、可展示的故事
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Narrative & Story Structure

5-act structure is a FRAMEWORK, not a script. Every video must be UNIQUE to the user's story.

## Scene Constitution Inputs

Every act is determined by these inputs, in this order:

1. `BrandTruth`
2. `ScreenshotProof`
3. `VideoProof`
4. `StoryIntent`
5. `DesignArchetype`

If a scene cannot be justified by those inputs, it should not exist.

## 5-Act Framework (Adapt, Don't Copy)

Used by Stripe, Linear, Vercel, Arc for product launches. The secret: Acts 1, 3, 4 are ANIMATED PRODUCT UI MOCKUPS, not text slides.

**CRITICAL:** The structure below is fixed. The CONTENT is driven by the user's storyline (see Step 1.5 in SKILL.md). Never auto-generate headlines or feature lists — ASK the user first.

| Act | Structure (fixed) | Content (from user) |
|-----|-------------------|---------------------|
| ACT 1 Logo (0-4s) | **MANDATORY brand logo animation.** Real SVG wordmark/logo, spring entrance, glow/shimmer. MUST be the first thing viewers see. | Brand's real logo SVG (downloaded, never hand-written) |
| ACT 2 Hook (4-12s) | Product UI mockup, spring entrance, interactive animation | Which product screen? What interaction to animate? |
| ACT 3 Showcase (12-28s) | Headline → UI alternating rhythm, 2-4 vignettes | Which features? What headlines? What UIs? |
| ACT 4 Proof (28-34s) | Data visualization / social proof | What metrics? Benchmarks? Or skip for longer showcase? |
| ACT 5 Close (34-40s) | CTA lockup + brand logo + tagline | What tagline? What CTA? What URL? |

**ACT 1 is ALWAYS a logo animation.** No exceptions. The brand's real downloaded SVG logo/wordmark enters with spring physics, optional glow or shimmer sweep. This is the brand's first impression — it must feel premium.

**Anti-pattern:** Generating "It reasons. It codes. It creates." for every user. That's template slop. The user decides the story arc — the skill provides the visual framework.

**Act 4 is optional.** If the user has no metrics or social proof, extend Act 3 with an extra feature vignette instead.

## Proof Beats Spectacle

For enterprise-grade brands, Act 4 is where trust is earned. If the product sells credibility, control, or operational seriousness, a strong proof act matters more than a flashy transition package. Prefer:

- benchmarks
- workflows completing
- logs, dashboards, graphs, or scorecards
- testimonials or adoption facts

Do not starve proof just to make room for more decorative motion.

```
ACT 1 — THE LOGO (0-4s) [MANDATORY]
  Brand logo/wordmark animation. REAL SVG downloaded from site.
  Spring scale entrance (0→1), shimmer sweep across logo.
  NO TEXT under the logo — logo stands ALONE, pure and confident.
  PREMIUM BACKGROUND required — NEVER plain white/black:
    - GradientMesh with brand colors (opacity 0.05-0.08)
    - Center glow pulse (radial-gradient breathing animation)
    - Subtle conic-gradient radial lines (slow rotation)
    - These layers create depth and luxury without distracting from the logo.
  Logo ONLY appears here and in ACT 5 (Close). NOT in middle acts.

ACT 2 — THE HOOK (4-12s)
  Full-screen product UI mockup. The UI enters with spring scale.
  Interactive element animates: typing, cursor clicking, data appearing.
  WHICH UI depends on the user's product and story.
  NO floating headline overlays on UI. See "Headlines Never Overlay" below.
  Optional: capability icons row with labels (NO logo here).

ACT 3 — THE SHOWCASE (12-28s)
  NARRATIVE RHYTHM: alternate headline screens and UI demo screens.
  2-4 feature vignettes (user picks features). Each = headline intro (36f) + UI demo (80f).
  Headlines tell the user's story arc — NOT a generic "thinking → perceiving → creating".
  Each vignette is a DIFFERENT full-screen product UI.

ACT 4 — THE PROOF (28-34s) [OPTIONAL]
  Dashboard-style data visualization. NOT centered big number template.
  User provides specific metrics, benchmarks, or testimonials.
  If no proof data, skip this act and extend Act 3.

ACT 5 — THE CLOSE (34-40s)
  Logo lockup (REAL wordmark SVG) + user's tagline + CTA button + URL.
  Per-character stagger tagline. Shimmer sweep on CTA.
  Hold final frame 1s+ minimum.
```

## Evidence Modes

### Full-Motion Mode

Use when `VideoProof` exists and matches the narrative. Show product behavior in motion, but keep the surrounding chrome and layout disciplined.

### Screenshot-First Mode

Use when screenshots exist but video is missing or weak. Prefer:

- framed reveals
- controlled pans
- masked zooms
- editorial transitions
- browser/device chrome around screenshots

Do **not** fake impossible product motion just because a launch video "should move."

## Default Duration: 40 Seconds (1200 frames @ 30fps)

Pacing is luxury. Premium videos let content BREATHE:
- Each scene holds 80-120 frames before transitioning
- Headlines visible for 36+ frames (over 1 second)
- UI demos hold 80+ frames (2.5+ seconds)
- Never rush 4 features into 12 seconds — cut a feature if needed

## Headlines Never Overlay UI Mockups

Text and UI are SEPARATE visual moments:
- **Headlines get their own screen.** Clean dark bg, radial gradient, centered text.
- **UI mockups are the hero.** Fill the frame. No overlays, no pills, no badges.
- **Scene sequencing:** headline → UI → headline → UI. Alternate, never combine.
- **If a label is needed on UI:** put it INSIDE the UI chrome (tab title, sidebar, header).

**Anti-pattern:** Glassmorphism pill overlay on dense UI = the #1 amateur tell.

## Headline Screen Style

- Centered text on `theme.color.bg`
- Optional accent radial gradient behind
- 64-72px, semi-bold (600)
- Accent color on the KEY WORD: "It **reasons**." / "It **sees** everything."
- Spring translateY entrance (20→0px)
- Per-character stagger with easeOutExpo

## Story Arc Over Feature List

The video is a JOURNEY:
1. **Act 1** creates curiosity: "look what this can do"
2. **Act 2** names the hero: "this is [Product]"
3. **Act 3** escalates wonder: each feature builds on the last
4. **Act 4** provides proof: "the numbers back it up"
5. **Act 5** calls to action: "now it's your turn"

If you remove any act and the video still works, that act wasn't contributing.

## Enterprise-Grade Rhythm

Different archetypes change how scenes should feel:

- **Financial Precision:** calmer reveals, stronger proof, controlled luxury
- **System Clarity:** tighter pacing, denser UI, cleaner editorial screens
- **Editorial Minimalism:** more whitespace, heavier text rhythm, fewer decorative layers
- **Infra Authority:** proof-first, operator reality, no playful motion
- **Productive Warmth:** slightly softer pacing, more humane transitions, still disciplined

Use archetype to tune the rhythm. Never let it overwrite the brand's actual surface language.

## Logo Constellation (Act 2)

Brand logo at center with 6 orbiting capability icons:
- Hexagonal layout clearing center content by ≥80px
- Each icon: colored glow (blur 30px, 25% opacity), spring-pop with stagger
- Gentle sin/cos float drift (8px amplitude)
- Calculate bounding box: logo + headline + tagline = center zone. Icons must clear it.
