<!--
[INPUT]: Claude Code users evaluating installation and capability fit
[OUTPUT]: High-level skill positioning, installation flow, and capability summary
[POS]: 30x-web-to-video 的对外说明; 解释它是什么、为什么存在、以及它和普通模板型视频技能的差别
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# 30x-web-to-video

Generate premium 40-second product launch videos with Claude Code + Remotion. Give it a brand URL, and the skill builds around real website evidence, enterprise-grade taste, and product-faithful motion instead of generic SaaS templates.

See the [project README](https://github.com/norahe0304-art/30x-video#readme) and the [film showcase](https://norahe0304-art.github.io/30x-video/) for the full pitch, quick start, and the current 12-brand gallery. This file documents what's inside this bundled skill folder specifically.

## URL-to-Video V2

The skill includes a real URL intake orchestrator. Preferred flow:

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/url-to-video.ts https://brand.com --out ./brand-launch-video
```

It emits a **team-editable first cut project**, not a black-box final render. Every generated project includes:

- `brand-report.json`
- `scene-constitution.json`
- `asset-manifest.json`
- `story.md`
- `review.md`
- `src/generated/project-data.ts`
- `public/brand/beat-map.json` when BGM harvest succeeds

For regression coverage across canonical brands:

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/benchmark-suite.ts --match stripe-fintech --offline --reuse-brand-dir ./public/brand --install --verify --render
```

This writes per-benchmark `benchmark-result.json` files plus one suite summary.

## Installation

```bash
npx 30x-web-to-video https://your-brand.com --agent
# or, to install the skill user-wide:
npx 30x-web-to-video --global
```

## Usage

Just tell Claude Code:

> "Make a launch video for linear.app"

The skill scrapes the brand, asks for your storyline, builds animated UI mockups from real product evidence, adds BGM and word-aligned voiceover, and renders to MP4 — with evidence-frame QC gates between each act.

## What's Inside

**Rules (rules/):** the taste codex — layout, typography, color, UI mockups, cards, data-viz, motion, transitions, cinematic grading, the AI-slop blacklist, narrative structure and industry templates, workflow, archetypes, and the finish gate.

**Orchestration & QA (scripts/ + benchmarks/):** `url-to-video.ts` (one-URL intake, evidence scoring, mode selection, project generation), `benchmark-suite.ts` (batch regression runner), `evidence-model.ts`, `scene-constitution.ts`, `project-blueprint.ts`, `beat-sync.ts`, `analyze-audiomap.py`, `generate-bgm.py`.

**Code patterns (references/):** reusable Remotion components — FadeIn/ScaleIn/SplitText/Typewriter/CountUp, GradientMesh/GlassPanel/FilmGrain/ProductFrame, beat sync + voiceover ducking, ShimmerSweep/PulseGlow/PathDraw, `@remotion/lottie` integration.

**Bundled Remotion API reference (remotion-best-practices/):** 30+ rule files covering videos, audio, timing, transitions, compositions, fonts, images, charts, captions, 3D, maps, and more — no external lookup needed mid-build.

**Scaffold (scaffold/):** ready-to-run Remotion project template that acts as the first-cut receiver for `scene-constitution`, generated project data, and harvested brand evidence inside `public/brand/`.

**Examples (examples/):** full scene source for prior builds, indexed in `examples/INDEX.md` — a reusable visual-family catalog (`rules/artifact-catalog.md`) with a pointer into whichever example first proved each pattern.

## License

MIT
