<!--
[INPUT]: Claude Code users evaluating installation and capability fit
[OUTPUT]: High-level skill positioning, installation flow, and capability summary
[POS]: remotion-video-skill 的对外说明; 解释它是什么、为什么存在、以及它和普通模板型视频技能的差别
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Remotion Video Skill

> ⚠️ **DEPRECATED — Superseded by [30x-video](https://github.com/norahe0304-art/30x-video).**
>
> This skill is no longer actively developed. Its taste philosophy
> (`rules/taste.md`, `rules/finish-gate.md`, `rules/archetypes.md`) and
> engine-neutral scripts (beat-sync, scene-constitution, evidence-model,
> visual-audit, timing-audit, critique-scenes) have been ported to
> 30x-video, which uses **Hyperframes** (Apache 2.0, HTML+GSAP) instead
> of Remotion as the rendering engine.
>
> 30x-video adds:
> - Refero MCP integration for design-library search
> - Auto-composed voice over (multi-provider TTS) and BGM
> - Confirmation Gate before render (zero rework)
> - 5-dimensional Style Composer (replaces fixed templates)
> - 50-video real-reference library (instead of abstract rules)
>
> Use 30x-video for new work. This repo remains for reference.

---

Generate premium 40-second product launch videos with Claude Code + Remotion. Give it a brand URL, and the skill builds around real website evidence, enterprise-grade taste, and product-faithful motion instead of generic SaaS templates.

## URL-to-Video V2

The skill now includes a real URL intake orchestrator. Preferred flow:

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
npx skills add norahe0304-art/remotion-video-skill -g
```

Or project-level:

```bash
npx skills add norahe0304-art/remotion-video-skill
```

## Usage

Just tell Claude Code:

> "Make a launch video for linear.app"

The skill will scrape the brand, ask for your storyline, build animated UI mockups, add BGM, and render to MP4.
In V2, the default is stronger: it can turn one URL into a mode-aware editable first cut, choose between `product-evidence` and `editorial`, keep audio `BGM-only`, generate a beat-map when music exists, and leave the last 10-20% of polish to Claude or a human in Remotion.

## What Changed

- Added a **three-layer constitution**: phenomenal evidence, archetype inference, and finish-gate philosophy
- Added **enterprise design archetypes** abstracted from high-quality design references
- Added an **Impeccable-style finish gate** to reject monoculture defaults before render
- Upgraded the workflow so **screenshots are mandatory** and **video is preferred**
- Added a **URL-to-video orchestrator** that emits reports, scene constitution, and a Remotion-ready project from one URL
- Added an **executable benchmark suite runner** for 12+ canonical URLs across product-heavy and editorial-heavy brands
- Kept the existing `SKILL.md -> rules -> scaffold` production chain intact

## What's Inside

**3,200+ lines of rules** across 13 files, **4,100+ lines of bundled Remotion API reference**, **1,900+ lines of scaffold code**, and **5 reference files** with copy-paste components.

### Design System (rules/)
| File | What it covers |
|------|---------------|
| `layout.md` | Grid system, safe zones, nowrap rules, card padding minimums, SplitText flex-column fix |
| `typography.md` | Font weights (max 600), size hierarchy (min 28px), text safety |
| `color.md` | Brand polarity detection, neutral tinting, 60-30-10 rule |
| `ui-mockups.md` | Product UI construction, density, title bars, syntax coloring |
| `cards.md` | Staggered card grids, interior fill, animated card bodies |
| `data-viz.md` | SVG charts, animated metrics, tabular-nums, status badges |

### Motion & Production (rules/)
| File | What it covers |
|------|---------------|
| `motion.md` | Spring physics, easeOutExpo, per-character stagger, timing standards |
| `transitions.md` | TransitionSeries, light leaks, fluid backgrounds, parallax |
| `cinematic.md` | Film grain, vignette, shimmer sweep, color grading, render settings |

### Strategy & Quality (rules/)
| File | What it covers |
|------|---------------|
| `taste.md` | 23-item AI slop blacklist, cognitive UX laws, self-review checklist |
| `narrative.md` | 5-act evidence-driven structure, headline/UI rhythm, story arc |
| `narrative-templates.md` | 7 industry templates (AI SaaS, FinTech, DevTool, E-Commerce, etc.) |
| `workflow.md` | Brand scraping, yt-dlp video download, staticFile() enforcement, BGM sourcing, asset relevance checks |
| `archetypes.md` | Enterprise design archetypes distilled from great product design references |
| `finish-gate.md` | Impeccable-style finish protocol, anti-monoculture checks, render blocking criteria |

### Orchestration & QA (scripts/ + benchmarks/)
| File | What it covers |
|------|---------------|
| `scripts/url-to-video.ts` | One-URL intake, evidence scoring, mode selection, project generation |
| `scripts/benchmark-suite.ts` | Batch benchmark runner with optional install, verify, and render passes |
| `scripts/evidence-model.ts` | Evidence dimensions, report schema, manifest schema |
| `scripts/scene-constitution.ts` | Archetype inference and 5-scene constitution generation |
| `scripts/project-blueprint.ts` | Scaffold copying + generated output files |
| `scripts/beat-sync.ts` | Beat-map generation for BGM-backed scene timing |
| `benchmarks/manifest.json` | Canonical benchmark suite for regression testing |

### Code Patterns (references/)
| File | Components |
|------|-----------|
| `animations.md` | FadeIn, ScaleIn, SplitText, Typewriter, CountUp, AnimatedPath |
| `components.md` | GradientMesh, GlassPanel, FilmGrain, ProductFrame, BrandIcon |
| `audio.md` | Beat sync, voiceover ducking, audio layers |
| `visual-effects.md` | ShimmerSweep, PulseGlow, PathDraw, ParticleField |
| `lottie.md` | @remotion/lottie integration |

### Bundled Remotion API Reference (remotion-best-practices/)
37 Remotion-specific rule files covering videos, audio, timing, transitions, compositions, fonts, images, charts, captions, 3D, maps, and more. No external dependency needed.

### Scaffold (scaffold/)
Ready-to-run Remotion project template that acts as the first-cut receiver for `scene-constitution`, generated project data, and harvested brand evidence inside `public/brand/`.

## Battle-Tested

Built and validated across 8 real brand videos: Google Gemini, Linear, Mercury, Shopify, 1Password, Notion, Cursor, and Anthropic. Every rule comes from a real bug or a real design review — not theory.

## License

MIT

## Quickstart（followers 上手）

```bash
npx skills add norahe0304-art/30x-video --skill 30x-web-to-video   # 或手动放入 .claude/skills/
```

**系统依赖**（orchestrator 会自动装，锁死环境手动装）：node 20+ / ffmpeg / yt-dlp / aubio / playwright

**可选凭据（没有也能全链路跑）**：
- `ELEVENLABS_API_KEY`（项目 .env）→ 高质量配音 + 词级时间戳；没有则自动走 Kokoro 本地 TTS（零 key，见 references/audio.md）
- WebGL 渲染（ShaderFX）需要 `--gl=angle`，scaffold render script 已内置

**用法**：对 Claude 说 "用 30x-web-to-video 给 https://你的品牌.com 做个 launch video"。管线：抓站 → 素材审计 → 选型（rules/artifact-catalog.md 优先级五条）→ VO/BGM → 五幕 → 渲帧验收 → Studio 预览 → 渲染。

**质量的来源**（好好读 rules/，那是十个品牌实测淬出来的法典）：taste.md（禁令清单）、composition.md（Claim→World）、artifact-catalog.md（词汇库 + 轮换台账）、typography/layout（排版铁律）、narration-sync（旁白力学）。examples/ 有六个品牌的完整场景源码可抄结构。
