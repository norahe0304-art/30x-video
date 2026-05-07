---
name: 30x-video
description: |
  Generate agency-grade marketing videos with auto-composed BGM and voice
  over. A thin stitching layer over Refero (design research) + Hyperframes
  (HTML→MP4 engine). Trigger when user asks to make a marketing / launch /
  product / social video, or turn content / a brief / a brand into video.

  Do NOT trigger for: still images (use 30x-image), audio-only outputs,
  video editing of user-uploaded clips without a creative brief.

  REQUIRED skills (this skill stitches them):
    - /refero-design — visual research + craft (typography / color / motion / anti-slop)
    - /hyperframes — HTML composition authoring
    - /hyperframes-cli — init / render / lint commands
    - /hyperframes-media — Kokoro TTS for voice over
    - /gsap — timeline animation API

  RUNTIME: hyperframes engine + yt-dlp + aubiotrack + ffmpeg in PATH.
  Refero MCP recommended (auto-detects). Without Refero, falls back to
  creator-default design profile.
---

<!--
[INPUT]: User brief, optional brand, optional content assets, Refero MCP, hyperframes
[OUTPUT]: Final MP4 with VO + BGM + critique report + decision manifest
[POS]: skill 主入口; 缝合层 — 不重复实现 Refero / Hyperframes 已有的事
[PROTOCOL]: 变更时更新此头部，然后检查 references/
-->

# 30x-video — Tell it what you want, get a video.

You are the operator of `30x-video`. **This skill is intentionally thin** —
it is the stitching layer between two world-class skills:

```
/refero-design      handles  visual research + design taste + craft
/hyperframes        handles  HTML composition + render engine + GSAP

30x-video           handles  the video-specific glue:
                              - 5-dim style picks (visual / pacing / bgm / vo / format)
                              - Confirmation Gate
                              - Script generation (brief → scene HTML)
                              - VO synthesis via /hyperframes-media
                              - BGM fetch (yt-dlp + aubiotrack + ffmpeg)
                              - Hyperframes project assembly
                              - Finish Gate (lint + inspect + reading-time audit)
```

We don't sell a tool. We sell the ability for every user to be proud of
their video.

---

## CRITICAL: Confirmation Gate (must read first)

**ABSOLUTELY DO NOT** start any rendering / asset generation / Refero MCP
heavy call before you have:

1. Listed ALL inferred decisions (format / duration / visual style / pacing
   / VO archetype / BGM archetype / on-screen text strategy)
2. Listed ALL ambiguous points + your suggested defaults
3. Received user response: `go` / adjustments / answers to questions
4. All decisions locked

**Forbidden:**
- Render-then-ask
- Partial confirmation, silently decide the rest
- "User probably means X" assumptions

See `references/confirmation-gate.md` for the full protocol.

---

## Quickstart — what to surface when invoked

```
Use 30x-video. Make a [duration] [format] video about [topic].
```

Examples:

```
Use 30x-video. Make a 15s vertical video about morning routines.
Use 30x-video. Make a 30s ad for Stripe's new fraud detection feature.
Use 30x-video. Make a video for this coffee cup with a warm minimalist vibe.
Use 30x-video. Make a 40s product launch video for acmecorp.io.
```

You describe what you want. The agent lays out a complete plan + asks any
ambiguous questions in one batch. You confirm or adjust. The agent renders
silently. You get a video + manifest + critique report.

---

## The Pipeline (9 steps)

### [1] Content Analyzer (this skill)

Read the user's brief. Extract: subject / mood / audience / length-hint
/ format-hint / tone / brand. See `scripts/content-analyzer.ts`.

### [2] Style Research — INVOKE /refero-design

**Do NOT search Refero MCP directly from this skill**. Invoke the
`/refero-design` skill, which encapsulates:

- Discovery questions
- Refero MCP search strategies (broad → narrow → leader)
- Pattern extraction from real products
- Craft references: typography, color, motion, icons, anti-AI-slop, copywriting
- The 5-tool MCP API: `refero_search_screens` / `refero_search_flows` /
  `refero_get_screen` / `refero_get_flow` / `refero_get_design_guidance`

Output of /refero-design feeds back as a `DesignProfile`:

```typescript
{
  source: "refero-research" | "creator-default",
  brand?: string,
  fonts: { heading, body, mono? },     // from real Refero brand fonts
  density: "compact" | "balanced" | "airy",
  motionMood: "precise" | "measured" | "expressive",
  archetype: "Financial Precision" | "System Clarity" | ...,
  visualReferences: ReferoScreen[],     // metadata only, NOT screenshots
  notes: string[],
}
```

**Do not embed Refero screenshots in the final video.** The metadata
(fonts / ux_patterns / ui_elements / descriptions) informs LLM scene
HTML generation; the visuals are written from scratch in HTML+CSS+SVG.

### [3] 5-dim Style Composer (this skill)

Pick ONE option from each dimension based on content + DesignProfile:

| Dim | Options |
|---|---|
| **Visual** | product-ui-mockup / cinematic-luxury / data-viz-driven / lifestyle-shot / typography-statement / comparison-split / before-after |
| **Pacing** | slow-luxury (40s, 4-6s/scene) / medium-narrative (20-30s, 2-3s/scene) / quick-hook (10-15s, 1-2s/scene) / tiktok-flash (7-15s, 0.5-1s/scene) |
| **BGM** | minimalist-ambient / techno-driving / cinematic-orchestral / hip-hop-confident / lo-fi-warm / silence-with-sfx / speech-only |
| **VO** | none / conversational-host / authoritative-narrator / character-voice / multi-speaker |
| **Format** | 16:9 / 9:16 / 1:1 / 4:5 |

See `references/style-dimensions.md` for decision heuristics + anti-pattern
combos.

Reference `references/video-library/INDEX.json` to find 2-3 real videos
that exemplify the chosen combination.

### 🚪 Confirmation Gate (this skill)

Present the locked plan. Wait for `go`. See above.

### [4] Script Generator — content-driven HTML (this skill)

For each scene, the agent writes **hyperframes-compliant HTML** using:

- Real fonts from DesignProfile (from Refero brand metadata)
- UX patterns / UI elements from Refero descriptions (as design vocabulary)
- 5-dim composition picks
- /refero-design `get_design_guidance` recommendations

NEVER reference Refero screenshots via `<img src>`. All visuals are
authored as div + CSS + SVG + animated typography. INVOKE `/gsap` for
timeline animation help if needed.

Output per scene: `htmlBody` string that goes inside the `class="clip"`
wrapper. Hard rules from `/hyperframes`:

- Every clip needs `data-start` / `data-duration` / `data-track-index`
- Timeline must be paused; registered on `window.__timelines["main"]`
- After GSAP exit tween, add `tl.set` hard-kill at clip end

### [5] Asset Producer — parallel (this skill)

- **VO**: `scripts/vo-synth.ts` calls `/hyperframes-media` Kokoro TTS
- **BGM**: `scripts/bgm-fetch.ts` runs yt-dlp from curated NCS/Lofi Girl
  queries, aubiotrack BPM, ffmpeg trim/loop to target duration

### [6] Composer (this skill)

`scripts/compose.ts` builds a Hyperframes project directory:
- `index.html` (LLM-written scene HTML wrapped in clips + GSAP timeline)
- `hyperframes.json`, `meta.json`, `assets/`

### [7] Render — INVOKE /hyperframes-cli

`scripts/render.ts` calls `npx hyperframes render <project-dir>`.

### [8] Finish Gate (this skill)

`scripts/finish-gate.ts` runs three checks:
1. `npx hyperframes lint --json` — engine-level correctness
2. `npx hyperframes inspect --json` — text/container overflow
3. Reading-time audit per `/refero-design` taste rules — every text element
   must hold long enough (taste.md table); max 12 words per scene

### [9] Iterate (this skill)

If Finish Gate fails: adjust 5-dim picks, re-render. Max 2 iterations.
After 2 fails, surface to user with explicit reasoning.

---

## Output Contract

```
output/{job-id}/
├── video.mp4              final cut (with VO + BGM)
├── manifest.json          all decisions: 5-dim choices, design profile, refs
├── critique.md            Finish Gate report
├── hyperframes-project/   the built project (re-runnable)
└── assets/
    ├── vo.wav
    └── bgm.mp3
```

---

## File Map

```
skills/30x-video/
├── SKILL.md                       this file
├── references/
│   ├── confirmation-gate.md       full Confirmation Gate protocol
│   ├── style-dimensions.md        5-dim options + decision heuristics
│   ├── anti-slop.md               video-format-specific anti-slop
│   │                              (transitions / BGM / VO / on-screen text)
│   └── video-library/
│       ├── INDEX.json             50 hand-curated reference videos
│       └── README.md
├── scripts/
│   ├── orchestrator.ts            main entry (planPhase + executePhase)
│   ├── content-analyzer.ts        [1]
│   ├── style-composer.ts          [3]
│   ├── confirmation-gate.ts       🚪
│   ├── script-generator.ts        [4] LLM HTML generation prompt + heuristic
│   ├── vo-synth.ts                [5] hyperframes-media wrapper
│   ├── bgm-fetch.ts               [5] yt-dlp + aubiotrack + ffmpeg
│   ├── beat-sync.ts               [5] BPM helper (PORTed)
│   ├── compose.ts                 [6] Hyperframes project builder
│   ├── render.ts                  [7] hyperframes render wrapper
│   ├── finish-gate.ts             [8] lint + inspect + timing audit
│   ├── video-search.ts            INDEX.json reference search
│   ├── types.ts                   shared TypeScript types
│   └── (reference: critique-scenes.ts / visual-audit.ts / timing-audit.ts —
│        Remotion-specific, kept for future LLM critique prompts)
├── examples/
└── benchmarks/
```

**Notice what's NOT here:**
- No `design-rules/taste.md` — `/refero-design` provides this
- No `design-rules/finish-gate.md` — `/refero-design` craft + our timing audit
- No `design-rules/archetypes.md` — `/refero-design` archetype work
- No `refero-search.ts` / `style-hunter.ts` / `design-synthesizer.ts` —
  agent invokes `/refero-design` directly at runtime

This is by design. **Don't reinvent what's already done.**

---

## Failure Modes (surface to user, not silent retry)

- /refero-design unavailable AND no brand specified → fall back to creator-default profile + warn user
- hyperframes-media TTS unreachable → drop VO from this run, surface to user
- BGM fetch fails after 3 retries → use silence-with-sfx archetype, warn user
- Finish Gate fails 2 consecutive iterations → surface all violations
- Hyperframes render returns non-zero → surface stderr to user

In all cases: surface failure with specific reasoning + actionable next step.

---

## When NOT to use 30x-video

- User wants a still image → `30x-image`
- User wants only audio → use a TTS skill directly
- User wants live-action footage (real camera) → out of scope
- User wants to edit existing video clips (no brief) → use a non-AI editor
