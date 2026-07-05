# 30x web-to-video

> One URL in. An agency-grade launch video out.

**[▶ Watch all 13 films](https://norahe0304-art.github.io/30x-video/)** · [npm](https://www.npmjs.com/package/30x-web-to-video)

A Claude Code skill that turns any brand's website into a 40-second launch video —
real brand assets, a 5-act narrative, word-aligned AI voiceover, beat-synced music,
and a **taste codex of 16 hard-won design laws** that keeps every film premium and
every brand distinct.

13 brands tested. 13 completely different visual worlds. Zero templates.
Six of the films were built end-to-end by autonomous agents reading nothing but the rules.

## Quick start

```bash
# one-shot: harvest a brand and build the video
npx 30x-web-to-video https://your-brand.com --agent

# or: install the skill user-wide, then just talk to Claude Code
npx 30x-web-to-video --global
# → open Claude Code anywhere and say: "make a launch video for your-brand.com"
```

Requirements: **Node 20+** and **[Claude Code](https://claude.com/claude-code)**.
Everything else (ffmpeg, yt-dlp, playwright) auto-installs during harvest.
An `ELEVENLABS_API_KEY` in the project `.env` gets you premium narration;
without one it falls back to local TTS — zero keys needed.

## How it works

```
┌──────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
│   HARVEST    │ → │   TASTE CODEX    │ → │   FIVE-ACT FILM          │
│ deterministic│   │ 16 design laws   │   │ Remotion + React         │
│ colors fonts │   │ 4 evidence gates │   │ ElevenLabs word-aligned  │
│ copy logo UI │   │ Claim→World map  │   │ VO · beat-synced BGM     │
└──────────────┘   └──────────────────┘   └──────────────────────────┘
```

1. **Harvest** — a deterministic orchestrator scrapes the real brand: computed colors,
   loaded fonts, verbatim copy, logo, product screenshots, official demo video, BGM candidates.
2. **Taste** — Claude designs five acts under the codex: no expanding rings, no heartbeat
   pulses, no divider bars, no text over full-bleed motion, one world per film, real assets
   over drawn abstractions. Every rule cites the incident that created it.
3. **Evidence gates** — every asset is audited frame-by-frame before use; every act renders
   proof frames that get inspected; cuts snap to voiceover phrase onsets measured from
   word-level timestamps; downloaded music is whisper-checked for spoken watermarks.

## What's in the box

```
skills/30x-web-to-video/
├── SKILL.md                  # the workflow: 8 steps, 4 blocking gates
├── rules/                    # the taste codex — 16 laws with case law
│   ├── taste.md              #   anti-slop blacklist (rings, pulses, bars, pills…)
│   ├── composition.md        #   zero-vacuum, full-bleed moments, unity of world
│   ├── narration-sync.md     #   continuous VO, cuts snap to phrase onsets
│   ├── artifact-catalog.md   #   selection priority: semantics > real assets > rotation
│   └── …
├── scaffold/                 # Remotion project template (transitions, shaders, captions)
└── scripts/                  # orchestrator, beat-sync, audiomap, visual-audit
```

## The showcase

| # | Brand | World |
|---|-------|-------|
| 01 | Happy Model — AI gateway | black/green routing world, global backbone |
| 02 | Caylent — AWS consulting | black/mint infra, sailboat footage, agent decision graph |
| 03 | Perplexity PC | cream editorial, official 3D assets |
| 04 | Parker — AI banking | retro serif collage, 1940s jazz *(agent-built)* |
| 05 | Maná — yerba mate | four flavor-colored rooms *(agent-built)* |
| 06 | Cofounder — AI agent | pixel-pastoral; saw through a wrapper site *(agent-built)* |
| 07 | JetPartners — private aviation | navy old-money, night aerials |
| 10 | Corgi — startup insurance | painted skies, official mascot family *(agent-built)* |
| 11 | Orchid — iMessage assistant | paper-to-dusk, petals converge into the mark *(agent-built)* |
| 12 | TheraSun — spectral window film | warm-black amber, the spectrum splits |
| 13 | Idensia — brand passport | deep-forest engraving world |
| 14 | Laper — screenwriting software | screenplay paper, FADE IN:, film-noir jazz |
| 15 | Dusty & Co — ceramic studio | risograph print world; found the real brand behind a hosted passport page *(agent-built)* |

**[▶ Watch them all](https://norahe0304-art.github.io/30x-video/)**

## Philosophy

AI-generated video all looks the same because everyone writes "make it premium" in a prompt.
Premium is not an adjective. Premium is a few hundred specific *nevers* — written down,
enforced by evidence, and versioned. Every time this codex grows, the floor rises for
everyone who runs it.

## License

MIT
