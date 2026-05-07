# 30x-video

> Tell it what you want, get a video.

A Claude Code / Codex skill that generates agency-grade marketing videos with
auto-composed background music and voice over — driven by a curated library
of real reference videos and on-brand design profiles.

## Three-line philosophy

```
Refero       is our design library    — taste comes from real screens
Hyperframes  is our engine            — HTML+GSAP, Apache 2.0, no build
Our pipeline is our soul              — the moat lives here
```

We don't sell a tool. We sell the ability for every user to be proud of
their video.

## How to use

```
Use 30x-video. Make a [duration] [format] video about [topic].
```

Examples:

```
Use 30x-video. Make a 15s vertical video about morning routines.
Use 30x-video. Make a 30s ad for Stripe's new fraud detection feature.
Use 30x-video. Make a video for this coffee cup with a warm minimalist vibe.
```

That's it. You describe what you want. The agent reads your brief, lays out
a complete plan (format / pacing / VO / BGM / visual style), asks any
ambiguous questions in one batch, and waits for your `go` before rendering.
No guessing. No half-baked output.

## Three gates

| Gate | When | What |
|------|------|------|
| **Confirmation Gate** | Before any rendering | Lock all decisions, align with user, zero rework |
| **Taste Discipline** | Throughout pipeline | Anti-slop blacklist enforced as hard constraint |
| **Finish Gate** | Before final delivery | Auto-critique + up to 2 iterations |

## Architecture

```
brief
  → Content Analyzer
  → Style Hunter (Refero search → VoltAgent DESIGN.md → creator preset fallback)
  → 5-dim Style Composer (visual / pacing / bgm / vo / format)
  → 🚪 Confirmation Gate
  → Script Generator
  → Asset Producer (VO synth + BGM fetch + visuals)
  → Composer (Hyperframes HTML + GSAP)
  → Render (Puppeteer + FFmpeg)
  → Finish Gate (LLM critique + iterate)
  → video.mp4
```

## Tech stack

| Layer | Choice |
|-------|--------|
| Render engine | [hyperframes](https://github.com/heygen-com/hyperframes) (Apache 2.0) |
| Design library | [Refero MCP](https://refero.design/mcp) |
| DESIGN.md source | [VoltAgent awesome-design-md](https://github.com/voltagent/awesome-design-md) via `npx getdesign` |
| TTS / VO | Kokoro (default) → ElevenLabs / OpenAI (premium) |
| BGM | Royalty-free pool + yt-dlp + aubiotrack BPM detection |
| Beat sync | aubiotrack |
| Critique | LLM (Claude / GPT) |

## Reference library

Instead of writing 1800 lines of abstract design rules, we curate **real
videos** as references. The `references/video-library/` notebook contains
50 hand-picked YouTube videos tagged across 5 dimensions, organized in
three quality tiers:

- **S — Gold standard** (20): Apple / Aesop / Patagonia / Stripe / Linear / etc.
- **A — Data + reputation** (20): 100k+ likes AND 1M+ views, 1-3 min, Cannes-grade
- **B — Creator viral** (10): top creator hooks, 5M+ views

Real examples beat abstract rules — the same philosophy Refero applies to
design.

## Status

🚧 Active development.

## License

MIT
