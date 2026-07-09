# 30x web-to-video

> One URL in. An agency-grade launch video out.

**[▶ Watch all 12 films](https://norahe0304-art.github.io/30x-video/)** · [npm](https://www.npmjs.com/package/30x-web-to-video)

A Claude Code skill that turns any brand's website into a 40-second launch video —
real brand assets, a 5-act narrative, word-aligned AI voiceover, beat-synced music,
and a **taste codex of 16 hard-won design laws** that keeps every film premium and
every brand distinct.

12 brands tested, 12 completely different visual worlds, zero templates — plus a
handful of earlier-generation films (retired from the public wall as the codex improved,
history preserved in git). Five of the current films were built end-to-end by
autonomous agents reading nothing but the rules.

## Quick start

```bash
# one-shot: harvest a brand and build the video
npx 30x-web-to-video https://your-brand.com --agent

# or: install the skill user-wide, then just talk to Claude Code
npx 30x-web-to-video --global
# → open Claude Code anywhere and say: "make a launch video for your-brand.com"
```

## Requirements & expectations

- **macOS / Linux** (Windows untested)
- **Node 20+** and **[Claude Code](https://claude.com/claude-code)** (any paid plan)
- One full run takes **~25 minutes** and a meaningful chunk of agent tokens — it is doing real work: harvesting, designing five acts, rendering proof frames, self-reviewing
- Best results with the strongest model your plan offers — the taste codex holds the floor on any model; the ceiling scales with the model
- `ELEVENLABS_API_KEY` in the project `.env` gets premium narration; without it, narration falls back to local TTS (works, sounds simpler)
- ffmpeg / yt-dlp / playwright auto-install during harvest

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

12 films are live on the public wall today. Numbering follows build order (some
earlier-generation builds were retired as the codex improved — history preserved in git,
so the numbers aren't consecutive).

| # | Brand | World |
|---|-------|-------|
| 01 | Happy Model — AI gateway | black/green routing world, global backbone |
| 02 | Caylent — AWS consulting | black/mint infra, sailboat footage, agent decision graph |
| 04 | Parker — AI banking | retro serif collage, 1940s jazz *(agent-built)* |
| 05 | Maná — yerba mate | four flavor-colored rooms *(agent-built)* |
| 07 | JetPartners — private aviation | navy old-money, night aerials |
| 10 | Corgi — startup insurance | painted skies, official mascot family *(agent-built)* |
| 11 | Orchid — iMessage assistant | paper-to-dusk, petals converge into the mark *(agent-built)* |
| 12 | TheraSun — spectral window film | warm-black amber, the spectrum splits |
| 13 | Idensia — brand passport | deep-forest engraving world |
| 14 | Laper — screenwriting software | screenplay paper, FADE IN:, film-noir jazz |
| 15 | Dusty & Co — ceramic studio | risograph print world; found the real brand behind a hosted passport page *(agent-built)* |
| 20 | Dior | cream editorial, real Atacama/Hellix fonts embedded, faithful maison grammar |

**[▶ Watch them all](https://norahe0304-art.github.io/30x-video/)**

## Philosophy

AI-generated video all looks the same because everyone writes "make it premium" in a prompt.
Premium is not an adjective. Premium is a few hundred specific *nevers* — written down,
enforced by evidence, and versioned. Every time this codex grows, the floor rises for
everyone who runs it.

## License

MIT
