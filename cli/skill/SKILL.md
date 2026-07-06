---
name: remotion-beautiful-videos
description: Use when a user gives a brand URL and wants a premium launch, demo, or marketing video. Zero-manual workflow — Claude runs the V2 orchestrator itself (scrapes brand evidence, auto-installs missing tools, generates the first-cut Remotion project). User only sees the URL and the Studio preview.
---

<!--
[INPUT]: Brand URL or name, real site assets, user-approved story intent, rules/ + references/ + scaffold/
[OUTPUT]: A Claude Code workflow for building premium brand-faithful Remotion launch videos, guarded by four evidence-based QC gates (asset audit / per-act frame evidence / critic loop / honest disclosure)
[POS]: remotion-video-skill 的主入口; 协调现象层抓取、本质层 archetype、证据层 qc-gates、哲学层 finish gate 与最终 scaffold 执行
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Remotion Beautiful Videos

Create 40-second product launch videos that look like a $50k agency produced them. The secret: build **animated product UI mockups** — real dashboards, conversation interfaces, code editors, data visualizations — all constructed in code and spring-animated.

## When to Use

User names a brand or gives a URL and wants a product launch / marketing / demo video.

**NOT for** (route elsewhere instead of stretching this skill): extracting short clips from an existing long video (that's a shorts/recut job); adding captions to existing talking-head footage; NLE-style editing of user footage (retime/recolor/reorder); a bare music track needing a beat-synced lyric video. This skill builds a launch video *from a brand's web presence* — code-built UI mockups, real scraped assets, 5-act narrative. If the input isn't a brand/product to present, this is the wrong tool.

## Tech Stack

Remotion 4.x (scaffold pinned ≥4.0.484) + React 19 + TypeScript + Zod + lucide-react + @remotion/transitions + @remotion/google-fonts + @remotion/paths + @remotion/light-leaks + @remotion/media + @remotion/effects (official gradient/checkerboard/emboss/gridlines — prefer over hand-rolled CSS equivalents)

## System Prerequisites — Handled Automatically

**DO NOT ask the user to install anything. DO NOT run a manual `command -v` check.** The orchestrator (`scripts/url-to-video.ts`) has a built-in **preflight** that detects missing tools, prints what's missing, and installs them via `brew`/`apt`/`dnf`/`pacman`/`npm` — all inside Step 1.

Required tools (all auto-installed if missing):

| Tool | Why |
|------|-----|
| `ffmpeg` | Audio trim, loudnorm, video trim, volumedetect sanity checks |
| `yt-dlp` | Scrape brand demo videos + royalty-free BGM from YouTube |
| `aubiotrack` | Degraded-mode beat fallback for `analyze-audiomap.py` + legacy `beat-sync.ts` (via `aubio` package) |
| `playwright` | Headless rendered homepage screenshot |

**Preflight flags** (pass these to `url-to-video.ts`):
- `--yes` — auto-install without prompting (use this when running as Claude, since you have no TTY)
- `--no-install` — skip installs, run in degraded mode (beats → fallback, screenshot → fetch-only)

If you hit a platform where auto-install fails (locked-down env, no sudo), the orchestrator prints the manual install command per tool and continues degraded. Never abandon the run — degraded output is still better than nothing.

The music-map analyzer (`scripts/analyze-audiomap.py`, Step 4) carries its own preflight: it pip-installs `librosa`/`numpy`/`soundfile` on first run and, if the install fails (or `--no-install` is passed), degrades to `aubiotrack` — the audiomap then carries only `bpm` + `beats_sec` with every other field `null` and `rhythmic: false` (grid untrusted downstream).

The BGM generator (`scripts/generate-bgm.py`, Step 2 tier ②) carries the same preflight shape: pip-installs `transformers`/`torch`/`soundfile`/`numpy` (plain → `--break-system-packages` → `--user`); if the install fails, it exits with the yt-dlp-fallback hint instead of blocking — BGM sourcing degrades, never dies. Generated tracks flow into `analyze-audiomap.py` exactly like any other BGM.

## URL-to-Video V2 Output Contract

Preferred path: run the V2 intake orchestrator and then refine the generated project in Remotion.

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/url-to-video.ts https://brand-site.com --out ./<brand-name>-launch-video
```

The orchestrator must emit:

- `brand-report.json`
- `scene-constitution.json`
- `asset-manifest.json`
- `story.md`
- `review.md`
- a full Remotion project directory with `public/brand/*`, optional `public/brand/beat-map.json`, `src/theme.ts`, and generated intake data for the scaffold to consume

Regression path:

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/benchmark-suite.ts --match stripe-fintech --offline --reuse-brand-dir ./public/brand --install --verify --render
```

The benchmark runner must emit per-benchmark `benchmark-result.json` files and a suite summary so V2 changes can be pressure-tested instead of argued about.

This skill does **not** optimize for one-click final renders. It optimizes for a video-team-grade first cut that Claude or a human can push the last 10-20% inside Remotion.

## Core Philosophy

1. **Build product UI mockups, not abstract graphics.** The UI IS the animation.
2. **Scrape first, design second.** Every color, font, logo comes from the real brand site.
3. **Pacing is luxury.** 40 seconds lets content breathe. Never rush features.
4. **Taste over templates.** If it looks like "AI made this," redesign.
5. **One font family, weight hierarchy.** 300-600 range only, never bold (700+).

## Three-Layer Constitution

- **Phenomenal layer:** harvest official website evidence. `ScreenshotProof` is mandatory. `VideoProof` is preferred. No visual proof, no credible video.
- **Essential layer:** infer a `DesignArchetype` from evidence. Use references to sharpen judgment, never to override the brand.
- **Philosophical layer:** reject reflex defaults before building. Taste beats convenience. Credibility beats spectacle. Product reality beats template energy.

This skill explicitly absorbs ideas from:

- `agent-browser` as the preferred phenomenal-layer harvester (headless, does not hijack screen)
- `awesome-design-md` as an enterprise design archetype reference library
- `taste-skill` as an execution-discipline source
- `Impeccable` as the finish-gate and anti-monoculture vocabulary source

None of the above are hard dependencies. Their value is embedded into this skill's thinking and gates.

## Rules

Read individual rule files for detailed explanations and code examples:

### Design System
- [rules/typography.md](rules/typography.md) - Font weights (max 600), size hierarchy (min 24px), text safety
- [rules/color.md](rules/color.md) - Brand polarity, neutral tinting, 60-30-10 rule, accent opacity levels
- [rules/layout.md](rules/layout.md) - Grid system, 4px spacing scale, safe zones, border-radius hierarchy, anti-overlap
- [rules/composition.md](rules/composition.md) - **Bespoke Composition Law**: zero-vacuum atmosphere base, full-bleed moments, editorial 200-320px type, real-assets-first, composition diversity — plus the compositional SLOP BLACKLIST (hub-and-spoke pill diagram, hollow-card triptych, centered-object void, eternal spring+shimmer open) and the thin-evidence playbook (score < 40 → grow a brand world from logo geometry, never empty cards)

### Visual Content
- [rules/ui-mockups.md](rules/ui-mockups.md) - Product UI construction, density, title bars, syntax coloring, cursor simulation, Giant Terminal bottom-rising spec (proven geometry + content contract + failure list)
- [rules/cards.md](rules/cards.md) - Staggered card grids, interior fill techniques, animated card bodies, no duplicates
- [rules/data-viz.md](rules/data-viz.md) - SVG charts, animated metrics, tabular-nums, status badges, anti-hero-metric
- [rules/artifact-catalog.md](rules/artifact-catalog.md) - **Read before designing any act**: 15 battle-tested bespoke artifact families (with source pointers) + scaffold inventory + cross-production hero rotation ledger (`~/.media/hero-ledger.jsonl`) — diversity is a gate, not a suggestion

### Motion & Production
- [rules/motion.md](rules/motion.md) - Springs, easeOutExpo, per-character stagger, timing standards, hold-then-snap, organic AE vocabulary (wiggle / overshoot / idle float / lookAt — wired from the sibling `remotion-motion` skill)
- [rules/transitions.md](rules/transitions.md) - TransitionSeries, light leaks, fluid backgrounds, noise textures, parallax
- [rules/cinematic.md](rules/cinematic.md) - Film grain, vignette, shimmer sweep, color grading, glassmorphism, render settings
- [rules/beat-sync.md](rules/beat-sync.md) - BGM-driven timing from audiomap.json: one analyzer trusted unconditionally, beat-grid snapping when `rhythmic: true`, energy-phase/silence pacing when not, hold-then-snap on energy peaks
- [rules/narration-sync.md](rules/narration-sync.md) - Voiceover/caption videos only: beat-lock visuals to whisper word timestamps, caption/brand-word cleanup, sentence-boundary cut snapping

### Strategy & Quality
- [rules/creative-moves.md](rules/creative-moves.md) - Five creative generators distilled from every "惊艳" verdict — idiom-literalism, logo-geometry growth, constraint alchemy, semantic inversion, domain-native proof
- [rules/taste.md](rules/taste.md) - AI slop blacklist, design principles, UX laws, self-review checklist, pacing
- [rules/narrative.md](rules/narrative.md) - 5-act structure, headline/UI rhythm, story arc, logo constellation
- [rules/narrative-templates.md](rules/narrative-templates.md) - Industry-specific narrative templates (AI SaaS, FinTech, DevTool, E-Commerce, Healthcare, Cybersecurity, Collaboration)
- [rules/workflow.md](rules/workflow.md) - Brand scraping, icon system, asset strategy, video embedding, file organization, BGM Variety Mandate (brand-derived mood + global ledger dedup — never the same track twice)
- [rules/media-resolve.md](rules/media-resolve.md) - Asset resolve cascade (ledger → adopt → programmatic → catalog → web) with `.media/manifest.jsonl` freeze ledger; programmatic-first: dotted-map world maps, simple-icons marks, LobeHub AI-model logos as inline tintable components
- [rules/archetypes.md](rules/archetypes.md) - Enterprise design archetypes abstracted from high-quality design references
- [rules/finish-gate.md](rules/finish-gate.md) - Impeccable-style finish protocol, anti-monoculture checks, render blocking criteria
- [rules/qc-gates.md](rules/qc-gates.md) - Four evidence-based QC gates: asset audit (Step 2.5), per-act frame evidence (Step 4), critic loop wiring (Step 7.5), honest disclosure (Step 8). Evidence-only — rendered pixels + Read, never grep

## Reference Files (Code Patterns)

- [references/animations.md](references/animations.md) - FadeIn, ScaleIn, SplitText, Typewriter, CountUp, AnimatedPath
- [references/audio.md](references/audio.md) - Audio sync, beat detection, voiceover ducking, ElevenLabs TTS `with-timestamps` VO pipeline (word timing for free, restricted-key handling, VO_CUES-derived duck)
- [references/components.md](references/components.md) - GradientMesh, GlassPanel, FilmGrain, ProductFrame, BrandIcon
- scaffold/src/components/Transitions.tsx - 7 transition families (whipPan/maskWipe/push/zoomPunch/blurDissolve/flashThrough/glitchCut) — drop-in replacements for fade(); all-fade videos are a violation
- scaffold/src/components/ShaderFX.tsx - GPU ShaderPlane (liquidWarp production-ready; silk/lens WIP) — render with --gl=angle (baked into scaffold render script)
- scaffold/src/components/Captions.tsx - word-timestamp captions, 6 styles (karaoke/scalePop/weightShift/neonGlow/kineticSlam/editorial)
- [references/lottie.md](references/lottie.md) - @remotion/lottie integration, recommended sources
- [references/visual-effects.md](references/visual-effects.md) - Tiered visual effects library reference (lottie, motion-blur, confetti, flubber, three.js)

## Remotion API Reference (Bundled)

This skill bundles the full `remotion-best-practices` reference for Remotion API patterns. Load these when you need Remotion-specific API knowledge:

- [remotion-best-practices/rules/videos.md](remotion-best-practices/rules/videos.md) - Video embedding, trimming, volume, speed, looping
- [remotion-best-practices/rules/audio.md](remotion-best-practices/rules/audio.md) - Audio importing, trimming, volume, speed, pitch
- [remotion-best-practices/rules/timing.md](remotion-best-practices/rules/timing.md) - Interpolation curves, linear, easing, spring
- [remotion-best-practices/rules/transitions.md](remotion-best-practices/rules/transitions.md) - Scene transition patterns
- [remotion-best-practices/rules/compositions.md](remotion-best-practices/rules/compositions.md) - Compositions, stills, folders, default props
- [remotion-best-practices/rules/sequencing.md](remotion-best-practices/rules/sequencing.md) - Sequence delay, trim, duration limiting
- [remotion-best-practices/rules/fonts.md](remotion-best-practices/rules/fonts.md) - Google Fonts and local font loading
- [remotion-best-practices/rules/images.md](remotion-best-practices/rules/images.md) - Img component usage
- [remotion-best-practices/rules/charts.md](remotion-best-practices/rules/charts.md) - Bar, pie, line, stock chart patterns
- [remotion-best-practices/rules/light-leaks.md](remotion-best-practices/rules/light-leaks.md) - @remotion/light-leaks overlay effects
- [remotion-best-practices/rules/lottie.md](remotion-best-practices/rules/lottie.md) - @remotion/lottie integration
- [remotion-best-practices/rules/text-animations.md](remotion-best-practices/rules/text-animations.md) - Typography animation patterns
- [remotion-best-practices/rules/calculate-metadata.md](remotion-best-practices/rules/calculate-metadata.md) - Dynamic composition metadata
- [remotion-best-practices/rules/voiceover.md](remotion-best-practices/rules/voiceover.md) - AI voiceover with ElevenLabs TTS
- [remotion-best-practices/rules/parameters.md](remotion-best-practices/rules/parameters.md) - Zod schema parametrization
- [remotion-best-practices/rules/ffmpeg.md](remotion-best-practices/rules/ffmpeg.md) - FFmpeg operations for video trimming

## Workflow (8 steps + 4 evidence gates)

Four evidence-based QC gates run inside this workflow — Asset Audit (Step 2.5), Per-Act Frame Evidence (Step 4), Critic Loop (Step 7.5), Honest Disclosure (Step 8). All four live in [rules/qc-gates.md](rules/qc-gates.md). They share one rule: verify by rendering pixels and Reading them, never by grepping source code.

### Step 1: Run the V2 Orchestrator YOURSELF (MANDATORY)

**CLAUDE runs this, not the user.** When a user gives you a brand URL, immediately invoke the orchestrator via the Bash tool. Do NOT paste the command and ask the user to run it. Do NOT manually scaffold. Do NOT manually scrape. The orchestrator handles preflight (tool install), scaffold copying, brand harvesting, evidence scoring, mode selection, scene constitution, theme generation, beat-sync, and visual-audit — all in one command.

```bash
npx tsx <installed-skill-dir>/scripts/url-to-video.ts <brand-url> --out ./<brand-name>-launch-video --yes
```

- `<brand-url>`: the actual URL (e.g. `https://stripe.com`)
- `<brand-name>`: a slug (e.g. `stripe`)
- `--yes`: **REQUIRED** — Claude has no TTY, so preflight prompts would hang forever. `--yes` pre-approves any tool installs. If the user is on a locked-down machine where installs aren't allowed, use `--no-install` instead.

**What the orchestrator produces (VERIFY ALL EXIST before continuing):**
- `brand-report.json` — full evidence package with scores
- `scene-constitution.json` — 5-act scene plan with archetype + pacing
- `asset-manifest.json` — downloaded asset inventory
- `story.md` — story intent draft
- `review.md` — human-readable review summary
- `src/theme.ts` — brand-faithful theme (real colors, fonts, radii)
- `src/generated/project-data.ts` — **CRITICAL: real brand data consumed by MainVideo.tsx**
- `public/brand/*` — logo, screenshots, hero, video, BGM

**BLOCKING GATE after orchestrator completes:**
```bash
# ALL of these must pass before continuing:
cat <project>/brand-report.json | head -5          # must show real brandName, NOT "Example Brand"
cat <project>/scene-constitution.json | head -5    # must show real sourceUrl
ls <project>/public/brand/                          # must have logo + homepage screenshot + bgm
grep brandName <project>/src/generated/project-data.ts  # must NOT say "Example Brand"
```

If `project-data.ts` still says "Example Brand", the orchestrator failed — diagnose and re-run. **NEVER proceed with placeholder data.**

**If the orchestrator fails** (network issues, missing `yt-dlp`/`ffmpeg`), fall back to manual harvesting per [rules/workflow.md](rules/workflow.md), but you MUST still write real data into `src/generated/project-data.ts` and generate `brand-report.json` + `scene-constitution.json`. The scaffold template without real data is useless.

### Step 2: Supplement Brand Assets (if orchestrator gaps exist)

Check the orchestrator's `review.md` for gaps. Download any missing assets into `public/brand/`:

| Asset | Required? | How |
|-------|-----------|-----|
| `logo.svg` | MANDATORY | Download verbatim, NEVER hand-write SVG |
| `homepage.png` | MANDATORY | Screenshot via browser tool |
| `hero.png` or `product-ui.png` | MANDATORY | og:image, product screenshot, or hero section |
| `demo.mp4` | PREFERRED | `yt-dlp` from site embed or YouTube search, trim to 8s with ffmpeg |
| `bgm.mp3` | MANDATORY | Three-tier source, in order — ① user-supplied audio (verbatim, just loudnorm) → ② **generate locally (recommended)**: `python3 <installed-skill-dir>/scripts/generate-bgm.py --brand-report brand-report.json --duration 45 --output public/brand/bgm.mp3` — mood derived from designTruth + productCategory, or pass an explicit prompt; first run downloads facebook/musicgen-small (~1.5GB), generation is minutes-scale (fast on MPS/CUDA, slow on bare CPU) → ③ degraded fallback: yt-dlp from Pixabay/Mixkit/YouTube, trim to 45s with fade. NEVER ask user |

**Gate:** `ls public/brand/` must show logo + homepage screenshot + product visual + bgm. No bgm = go generate one (tier ②) or download one (tier ③).

### Step 2.5: Asset Audit (BLOCKING)

**Read:** [rules/qc-gates.md](rules/qc-gates.md) → Gate 1

Every visual asset in `asset-manifest.json` / `public/brand/` must be LOOKED AT before any scene uses it. Collapse duplicates, build a labeled contact sheet (`montage`) or Read each image individually — extract frames from any `.mp4` first — then write `asset-audit.md`: per asset, what is actually pictured (content, not filename), quality notes (padding, orientation, real format), and USE (naming the act) or SKIP (with a real reason). This is where you catch the padded logo, the portrait photo headed for a landscape slot, and the mislabeled file — before they're animated.

**Gate:** `asset-audit.md` covers every distinct visual asset. An asset without an audit row may not appear in any scene.

### Step 3: Get Storyline from User (BLOCKING)

STOP and ask:
1. What story? (launch / feature highlight / brand intro / problem→solution)
2. Which features? (pick 2-4 from scraped list)
3. Key message / tagline?
4. Proof points? (metrics, benchmarks, testimonials — or skip Act 4)
5. Tone? (hype / calm authority / playful / technical)

Match to [rules/narrative-templates.md](rules/narrative-templates.md) as starting point. **NEVER auto-generate storyline.**

### Step 4: Build Theme + 5-Act Scenes + BGM

**Composition law (read FIRST — [rules/composition.md](rules/composition.md)):** every act must pass the four iron laws — zero vacuum (atmosphere base under every frame; the scaffold's `Atmosphere` primitive is wired at MainVideo root by default — tune per act, never strip back to bare `#000`), one full-bleed moment per act, editorial type scale (key words 200-320px, may bleed), real brand assets over code abstractions. Name each act's composition system (Law 5 menu) before writing its code — five acts on the same `eyebrow + headline + centered box` skeleton is the exact failure this rule kills.

Theme is already generated by the orchestrator. Customize if needed. Build scenes in `src/scenes/`:

| Act | Purpose | Required evidence |
|-----|---------|------------------|
| ACT 1 Logo | Brand logo spring entrance + shimmer. No text under logo. Premium background. | Real logo asset |
| ACT 2 Hook | Product reality hits screen. | ScreenshotProof or VideoProof |
| ACT 3 Showcase | Headline → UI rhythm, 2-4 vignettes. | Real screenshot/video in at least 1 scene |
| ACT 4 Proof | Metrics, trust signals, benchmarks. | Proof visuals preferred |
| ACT 5 Close | CTA lockup + brand logo. | Real logo asset |

**Rules:** Logo only in ACT 1 + 5. ACT 2-4 must use at least 2 real `staticFile("brand/...")` assets (logo doesn't count). Wire `<Audio src={staticFile("brand/bgm.mp3")}` with volume envelope into MainVideo.

**Music map (if bgm exists):** read [rules/beat-sync.md](rules/beat-sync.md) FIRST, then run the one analyzer and let `audiomap.json` drive all transition/accent timing:

```bash
python3 <installed-skill-dir>/scripts/analyze-audiomap.py public/brand/bgm.mp3 --output audiomap.json
```

`rhythmic: true` → snap cuts to `beats_sec`/`downbeats_sec`; `rhythmic: false` → pace by `energy_phases` boundaries and `silences` windows (hard-cutting to the metronome grid is forbidden); hold-then-snap resolves on `key_moments` SURGEs. Never re-measure the track with another tool once audiomap exists.

**If the video has narration/captions** (optional — most launch videos are BGM-only), read [rules/narration-sync.md](rules/narration-sync.md) FIRST: whisper-transcribe the TTS audio for word timestamps, beat-lock every visual change to them, clean caption text without touching timestamps, and snap act cuts to sentence boundaries. Never derive timing from the script's word count.

**Asset relevance:** Every asset must match its scene context + narrative + visual quality + brand alignment. Watch every clip you place. See [rules/workflow.md](rules/workflow.md).

**Print TIMING AUDIT after each scene** (element, type, delay, finish frame, breathing). Breathing < 45f = fix before continuing.

**Frame evidence after EACH act** (BLOCKING — [rules/qc-gates.md](rules/qc-gates.md) → Gate 2): render 1-3 representative stills of the act you just built (`npx remotion still MainVideo evidence/act-<N>-f<frame>.png --frame=<F>`), **Read each PNG**, and append a structured evidence block to `evidence/act-evidence.md` — what's visibly on screen, which brand assets appear, does it match `scene-constitution.json` + `story.md`, legibility, FLAGs, VERDICT. Code that compiles is not a rendered frame. Do not start the next act until the current act's verdict is PASS.

### Step 5: Polish + Finish Gate

Add film grain, vignette, color grade, shimmer sweeps per [rules/cinematic.md](rules/cinematic.md).

**Finish gate** ([rules/finish-gate.md](rules/finish-gate.md)): Name at least 3 reflex defaults you rejected (e.g. `purple reflex`, `cardocalypse`, `inter everywhere`). State the default bad solution, why it was rejected, which brand evidence overrode it, and what replaced it. If you can't explain why this doesn't look like generic AI output, it's not ready.

### Step 6: Studio Preview (BLOCKING — NO EXCEPTIONS)

```bash
npx remotion studio --port <available-port>
open http://localhost:<port>
```

**NEVER RENDER WITHOUT USER APPROVAL.** This is the most important gate in the entire workflow. Open Remotion Studio, tell the user the URL, and STOP. Wait for the user to review the preview and give explicit approval before proceeding to Step 7/8.

If running as a subagent (background task), still open the studio and report the URL back — do NOT skip to render. The user must see the video in the browser before any MP4 is produced.

### Step 7: Final Audit (BLOCKING)

Run all checks before render:

```bash
# Asset check: at least 2 real media assets in ACT 2-4 scenes (logo doesn't count)
grep -r "staticFile" src/scenes/ | grep -E "\.(mp4|png|jpg)"

# Asset DEDUP check: no non-logo image may appear twice in the rendered scenes
# (see rules/workflow.md → "Asset De-duplication"). Each brand/*.{png,jpg,mp4}
# should have exactly 1 reference except logo.* which may appear in Act1+Act5.
grep -rhoE 'staticFile\("brand/[^"]+"\)' src/ | sort | uniq -c | awk '$1 > 1 && $2 !~ /logo/ { print "DUP:", $0; exit 1 }'

# Visual classification check: MainVideo.tsx must classify visuals as demo/cover
# (see rules/workflow.md → "Visual Classification — demo/cover"). Cover images
# (og-image / hero with baked tagline) may never get an overlay headline.
grep -q 'VisualKind' src/MainVideo.tsx || { echo "MISSING: visual classification type (demo/cover)"; exit 1; }
grep -q 'kind === "cover"' src/MainVideo.tsx || { echo "MISSING: cover full-bleed branch in Act 2"; exit 1; }
grep -qE 'kind:\s*"demo"' src/MainVideo.tsx || { echo "MISSING: demo kind tag"; exit 1; }

# Brand-authored gate: MainVideo MUST NOT reference playwright self-captures
# (see rules/workflow.md → "Brand-Authored vs Self-Captured"). homepage-screenshot
# is always a playwright capture in this pipeline and is preview/debug only.
# Strip // line comments before checking so explanatory comments don't trip the gate.
sed 's|//.*||' src/MainVideo.tsx | grep -qE 'staticFile\("brand/homepage|findAsset\(\[?"homepage-screenshot' \
  && { echo "FAIL: MainVideo references playwright self-capture (homepage.png)"; exit 1; } || true

# Theme sanitization gate: theme.ts must not contain Next.js CSS vars, "inherit",
# generic font families, OR emoji/symbol/dingbat fonts (these come from CSS
# font-family fallback chains and break Remotion's @remotion/google-fonts loader).
# (see rules/workflow.md → "Theme Sanitization")
grep -E 'var\(--font-|"inherit"|"initial"|"unset"|"sans-serif"|"serif"|"monospace"' src/theme.ts \
  && { echo "FAIL: theme.ts has non-loadable font (CSS var / inherit / generic)"; exit 1; } || true
grep -iE '"[^"]*emoji[^"]*"|"[^"]*symbol[^"]*"|"webdings"|"wingdings"|"fontawesome"|"material icons"' src/theme.ts \
  && { echo "FAIL: theme.ts has emoji/symbol/dingbat font (sanitizer escaped)"; exit 1; } || true

# Act 3 UI mockup gate: category-aware. Mobile apps must render inside PhoneFrame;
# everything else must use desktop mockup components. A pure-text Act 3 fails either way.
# (see rules/workflow.md → "Act 3 Must Use Generated UI Mockups")
PRODUCT_CATEGORY=$(node -e "try{console.log(require('./brand-report.json').productCategory.category)}catch{console.log('unknown')}" 2>/dev/null || echo unknown)
if [ "$PRODUCT_CATEGORY" = "mobile-app" ]; then
  # Mobile-app: either (a) App Store gallery harvest landed ≥2 screens → use
  # AppStoreCoverSlide full-bleed, OR (b) fallback PhoneFrame with single
  # product-ui.png. Either path is acceptable. Pure text Act 3 fails.
  grep -qE 'PhoneFrame|AppStoreCoverSlide' src/MainVideo.tsx \
    || { echo "FAIL: mobile-app product but Act 3 has no PhoneFrame or AppStoreCoverSlide"; exit 1; }
else
  grep -qE 'TerminalWindow|KanbanBoard|DataTable|AnalyticsDashboard' src/MainVideo.tsx \
    || { echo "FAIL: Act 3 has no UI mockup component — must import TerminalWindow/KanbanBoard/DataTable/AnalyticsDashboard"; exit 1; }
fi

# BGM check: <Audio> with bgm.mp3 in MainVideo
grep -n "bgm" src/MainVideo.tsx

# No localhost URLs
grep -r "localhost:8888" src/

# Visual audit script (timing, font-size, font-weight, safe-zone, contrast, etc.)
cp <installed-skill-dir>/scripts/visual-audit.ts scripts/
npx tsx scripts/visual-audit.ts
```

All FAIL = fix and re-run. Only then proceed.

### Step 7.5: Critic Loop (RECOMMENDED before render)

**Read:** [rules/qc-gates.md](rules/qc-gates.md) → Gate 3

Run the generator→critic loop BEFORE the final render — `critique-scenes.ts` renders its own stills, so it needs no MP4. A vision LLM scores every act and rewrites the single weakest scene, repeating until `overallScore ≥ threshold` or rounds are exhausted. This is how the skill closes the gap between "first draft" and "fifth draft" without a human in the loop — and running it here means Step 8 renders the post-critic cut, not the pre-critic draft.

```bash
# from inside the generated project
node --experimental-strip-types <installed-skill-dir>/scripts/iterate.ts . --rounds 3 --threshold 8
```

- Each round writes `.iterate/round-N/critique.json` (per-act 5-dim scores + weakest directive), `frames/*.png` (rendered stills), and `regenerate.log`.
- `scripts/critique-scenes.ts` and `scripts/regenerate-scene.ts` can be driven standalone if you only want one half of the loop.
- The regenerator auto-rolls back MainVideo.tsx/theme.ts if `tsc --noEmit` fails after its edit.
- Read `critique.json` yourself and quote the weakest directive in your delivery message. After the loop mutates a scene, re-render one still of that act and Read it (Gate 2 discipline).
- Skipping the loop is allowed under time pressure — but the skip must appear in Step 8's "What I did NOT verify" section.

### Step 8: Render + Machine QC + Honest Disclosure

```bash
npx remotion render --codec h264 --crf 16 --image-format png
```

**Machine QC on the rendered MP4 (BLOCKING):**

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/render-qa.ts out/MainVideo.mp4 \
  --expect-duration <seconds> --json render-qa.json
```

Checks the actual output file: stream presence + dimensions + pix_fmt, duration drift, black frames (blackdetect), frozen video (freezedetect), dead audio (silencedetect), clipping (volumedetect). FAIL = fix and re-render. WARN windows are timestamps to LOOK AT — extract a frame at each listed window, Read it, and judge: intentional hold-then-snap passes, a dead frame doesn't. Paste the report summary into the disclosure below.

**Honest disclosure (REQUIRED — [rules/qc-gates.md](rules/qc-gates.md) → Gate 4):** the final delivery message must end with two sections — "**What I verified**" (one bullet per gate/check that passed, evidence cited inline) and "**What I did NOT verify (spot-check these)**" (audio by ear, full-frame-rate motion between stills, playback smoothness, any skipped gate). The NOT-verified header must appear even if the list is "None." No adjectives where numbers exist. "Looks great, ready to ship" with no disclosure is an unacceptable final summary.

## Premium vs Template

| Premium ($50k) | Template (avoid) |
|---|---|
| Logo animation opens the video | No logo or text-only logo |
| BGM with beat-synced transitions | Silent or stock music slapped on |
| Full product UI mockups | Text on gradient background |
| Real brand assets inside UI chrome | Pure code mockups, no screenshots |
| Per-character text stagger | Entire text block fades in |
| SVG chart path-drawing | Big numbers with no visualization |
| Spring physics (overshoot + settle) | Linear or basic ease |
| easeOutExpo (Apple keynote feel) | Cubic or bounce easing |
| 40s with breathing room | 30s of rushing through features |
| Film grain + vignette + color grade | Perfectly clean digital |
| One typeface, weight contrast 300-600 | Multiple fonts or bold 700+ |
