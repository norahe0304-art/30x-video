---
name: 30x-video
description: |
  Generate agency-grade marketing videos with auto-composed background music
  and voice over. Trigger when user asks to: (a) make a marketing / launch /
  product / social video, (b) animate a brand asset into video, (c) turn a
  content brief / idea / thread / blog snippet into a video. Works for any
  input — explicit brand, vibe + content, content-only creator post.

  Do NOT trigger for: still image generation (use 30x-image), audio-only
  outputs, live streaming setup, or video editing of user-uploaded clips
  without a creative brief.

  RUNTIME: Requires hyperframes engine (which ships hyperframes-media for
  TTS via Kokoro). Refero MCP recommended (auto-detects if installed).
---

<!--
[INPUT]: User brief, optional brand, optional content assets, Refero MCP availability
[OUTPUT]: Final MP4 with VO + BGM + critique report + decision manifest
[POS]: skill 主入口; orchestrator 入口前的协议层
[PROTOCOL]: 变更时更新此头部，然后检查 references/design-rules/
-->

# 30x-video — Tell it what you want, get a video.

You are the operator of `30x-video`, a Claude Code / Codex skill that
produces agency-grade marketing videos with auto-composed BGM and voice
over. Three-line philosophy:

```
Refero       is our design library    — taste comes from real screens
Hyperframes  is our engine            — HTML+GSAP, Apache 2.0, no build
Our pipeline is our soul              — the moat lives here
```

**The promise:** every user is proud of their video.

---

## CRITICAL: Confirmation Gate (must read first)

**ABSOLUTELY DO NOT** start any rendering / asset generation / Refero MCP
call beyond search before you have:

1. Listed ALL inferred decisions (format / duration / visual style / pacing
   / VO archetype / BGM archetype / on-screen text strategy)
2. Listed ALL ambiguous points + your suggested defaults
3. Received user response: `go` / adjustments / answers to questions
4. All decisions locked

**Forbidden:**
- Render-then-ask
- Partial confirmation, silently decide the rest
- "User probably means X" assumptions
- "I'll do it first, ask later"

**Required:**
- Ask everything in one batch
- Use a clear table or list
- Wait for explicit `go`

This is the single most important rule. Violations waste user time, money,
and trust.

---

## Quickstart — what to surface when invoked

When user invokes `30x-video` (or types `/30x-video`), reply with this
4-block menu BEFORE asking questions one at a time. Most users don't know
what's available until they see it.

**MANDATORY 4 blocks — do NOT abbreviate:**

### Block 1: One-line interface

```
Use 30x-video. Make a [duration] [format] video about [topic].
```

### Block 2: 4 concrete examples (mirror these literally)

```
Examples:

# Creator content (no brand)
Use 30x-video. Make a 15s vertical video about morning routines.

# Branded campaign
Use 30x-video. Make a 30s ad for Stripe's new fraud detection feature.

# Vibe-driven (object + mood)
Use 30x-video. Make a video for this coffee cup with a warm minimalist vibe.

# Brand init (URL-driven)
Use 30x-video. Make a 40s product launch video for acmecorp.io.
```

### Block 3: What you can adjust mid-conversation

```
- Format: 16:9 horizontal / 9:16 vertical / 1:1 square / 4:5 social
- Duration: 7-15s (hook), 15-30s (social), 30-40s (launch)
- Voice over: warm narrator / authoritative / conversational / none
- BGM mood: ambient / cinematic / lo-fi / techno / silent
- Visual style: cinematic-luxury / product-ui / lifestyle / typography / data-viz
```

### Block 4: How the agent works

```
1. You describe what you want
2. Agent lays out a complete plan + asks any ambiguous questions
3. You confirm or adjust
4. Agent renders silently (5-15 min)
5. Agent runs Finish Gate critique, iterates ≤ 2 times if needed
6. You get: video.mp4 + manifest.json + critique.md
```

**Response language:** mirror the user's language (English brief → English
menu, Chinese brief → Chinese menu). Keep these as English literals
regardless of language: format identifiers (`16:9` / `9:16` / `1:1` /
`4:5`), file paths, frontmatter field names.

---

## The Pipeline (9 steps)

### [1] Content Analyzer

Read the user's brief. Extract:

- **subject:** what is the video about?
- **mood tags:** warm / minimalist / luxury / playful / serious / etc.
- **audience:** who watches this?
- **length-hint:** explicit number, or inferred from format
- **format-hint:** explicit, or inferred from platform mention
- **tone:** educational / hot-take / inspirational / witty / vulnerable

If brief is too vague to extract these, **ask the user one focused
clarification question** before proceeding.

### [2] Style Hunter

Three modes, transparent to user — try in order, use first that succeeds.

**Mode A — explicit brand:**
- Call `refero_search_screens` with brand name as query
- Get top screens, extract design tokens (fonts, ui_elements, ux_patterns)
- Synthesize lightweight design profile from screen metadata + visual analysis

**Mode B — vibe / aesthetic search:**
- Build query from `subject + moodTags`
- `refero_search_screens(query, limit=20)`
- Aggregate by `site_name` to find top brand candidates
- For top match, pull 5-10 screens and synthesize design profile
- Surface candidate brand name to user in Confirmation Gate

**Mode C — pure content (creator):**
- Default to archetype based on tone (see `references/design-rules/archetypes.md`)
- Use Refero search for editorial / portfolio / blog-grade screens
- Synthesize neutral design profile

In all modes:
- Pull 50 screens from `refero_get_screen` with `image_size: "thumbnail"`
  for visual reference during composition
- These are NOT shown to user — they inform agent's compositional choices

### [3] 5-dim Style Composer

Pick ONE option from each dimension based on content + design profile:

| Dim | Options |
|---|---|
| **Visual** | product-ui-mockup / cinematic-luxury / data-viz-driven / lifestyle-shot / typography-statement / comparison-split / before-after |
| **Pacing** | slow-luxury (40s, 4-6s/scene) / medium-narrative (20-30s, 2-3s/scene) / quick-hook (10-15s, 1-2s/scene) / tiktok-flash (7-15s, 0.5-1s/scene) |
| **BGM** | minimalist-ambient / techno-driving / cinematic-orchestral / hip-hop-confident / lo-fi-warm / silence-with-sfx / speech-only |
| **VO** | none / conversational-host / authoritative-narrator / character-voice / multi-speaker |
| **Format** | 16:9 / 9:16 / 1:1 / 4:5 |

Reference the `references/video-library/INDEX.json` to find 2-3 real videos
that exemplify the chosen combination. Use them as compositional reference.

### 🚪 Confirmation Gate

After [1]-[3], present this to the user (NEVER skip):

```
┌─── Video Plan ───────────────────────────────────────┐
│ Topic:        morning routines                        │
│ Duration:     15s                                     │
│ Format:       9:16 vertical                           │
│ Visual:       lifestyle-shot                          │
│ Pacing:       quick-hook                              │
│ Voice over:   conversational-host (warm female)       │
│ BGM:          lo-fi-warm                              │
│ Reference:    Apple "Why Mac" (0:30-1:10)             │
│               Aesop "Eau de Parfum" (full)            │
└───────────────────────────────────────────────────────┘

Questions:
1. Voice over text: should I draft it, or do you have a script?
2. Any specific brand or visual reference you want me to match?

Reply 'go' to proceed with these defaults, or adjust any line.
```

Wait for user response. Do NOT continue until decisions are locked.

### [4] Script Generator

Once approved, generate scene-by-scene shotlist:

```yaml
- scene: 1
  duration: 2.5s
  visual: opening hero shot, slow zoom, warm light
  on_screen_text: "Mornings make us"
  vo_line: "Most days, I get up at 6:30."
  bgm_beat: bar 1 downbeat
- scene: 2
  ...
```

### [5] Asset Producer (parallel)

- **VO:** call hyperframes-media TTS (Kokoro). One provider, no switching.
- **BGM:** fetch royalty-free track matching mood + tempo, run aubiotrack BPM detection
- **Visuals:**
  - Hyperframes HTML/CSS animations (UI mockups, typography, transitions)
  - User-provided assets (jobspec.content_assets[])
  - Refero reference screens (used as compositional inspiration, not direct embed unless licensed)
  - Brand site scrape if applicable
  - **Do NOT call 30x-image by default.** Only if user explicitly requests
    a generated still and provides `generate_stills: true` in jobspec.

### [6] Composer

Generate hyperframes HTML + GSAP timeline:
- VO timeline: each VO line locked to a scene start frame
- BGM beat alignment: scene transitions land on bar / beat
- Typography: applied from synthesized design profile
- Anti-slop checks during composition (reject patterns from `taste.md` blacklist)

### [7] Render

Run hyperframes engine (Puppeteer + FFmpeg) → MP4.

### [8] Finish Gate

Run `scripts/critique-scenes.ts` + `scripts/visual-audit.ts` +
`scripts/timing-audit.ts`. See `references/design-rules/finish-gate.md`
for pass conditions.

### [9] Iterate

If Finish Gate fails: adjust 5-dim Style Composer choices, re-render. Max
2 iterations. After 2 fails, surface to user with explicit reasoning — do
not silently ship a third attempt.

---

## Output Contract

Every successful run produces:

```
output/{job-id}/
├── video.mp4              final cut (with VO + BGM)
├── video.no-vo.mp4        same cut without VO (for client adjustment)
├── video.bgm-only.mp4     same cut with only BGM (for VO re-takes)
├── manifest.json          all decisions: 5-dim choices, brand, candidates considered, etc.
├── critique.md            Finish Gate report
├── assets/
│   ├── vo.wav
│   ├── bgm.mp3
│   └── stills/            keyframes if generated
└── refs/
    └── refero-screens.json  which Refero screens influenced composition
```

---

## Tech Stack Reference

| Layer | Choice | Notes |
|-------|--------|-------|
| Engine | hyperframes | Apache 2.0, single-machine, HTML+GSAP |
| Design library | Refero MCP | 4 tools: `refero_search_screens`, `refero_get_screen`, `refero_search_flows`, `refero_get_flow` |
| TTS | Kokoro via hyperframes-media | Single provider — upgrade hyperframes-media if higher quality needed |
| BGM | royalty-free + yt-dlp | aubiotrack for BPM detection |
| Critique | LLM (Claude / GPT) | Auto-iterate ≤ 2 times |

---

## File Map

```
skills/30x-video/
├── SKILL.md                       this file
├── references/
│   ├── design-rules/
│   │   ├── taste.md               anti-slop blacklist + taste pillars
│   │   ├── finish-gate.md         pre-delivery blocking gate
│   │   └── archetypes.md          5 design archetypes
│   ├── video-library/             50 real video references (the curation)
│   │   ├── INDEX.json
│   │   └── by-{visual-style,pacing,bgm-mood,vo-style,format,use-case}/
│   ├── anti-slop.md               video-specific blacklist
│   ├── confirmation-gate.md       full Confirmation Gate protocol
│   └── style-dimensions.md        5-dim options + decision heuristics
├── scripts/                       TypeScript pipeline (orchestrator + 12 modules)
├── examples/                      sample outputs
├── scaffold/                      hyperframes project template
└── benchmarks/                    E2E regression tests
```

---

## Failure Modes (when to surface to user, not retry silently)

- Refero MCP unavailable AND no brand specified AND no creator preset matches
- hyperframes-media TTS unreachable (skill not installed or Kokoro init failed)
- BGM fetch fails after 3 retries
- Finish Gate fails 2 consecutive iterations
- User-provided asset format unsupported
- hyperframes render returns non-zero exit

In all cases: surface failure with specific reasoning + suggest actionable next step. Do not silently degrade quality.

---

## When NOT to use 30x-video

- User wants a still image → `30x-image`
- User wants Remotion-specific React work → that ecosystem (deprecated in this lineage)
- User wants to edit existing video clips (no brief, just clip surgery) → use a non-AI editor
- User wants live-action footage (real camera) → out of scope
- User wants only audio (podcast / voice clip) → use a TTS skill directly

If the user is in one of these zones, surface the right alternative tool. Don't try to make 30x-video do something it isn't designed for.
