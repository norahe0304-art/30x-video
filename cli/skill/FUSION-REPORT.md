<!--
[INPUT]: 四个已克隆竞品/邻品仓库的实读 (hyperframes, claude-shorts, super-video-maker-skill, video-editing-skill) + hyperframes-caylent 实测笔记; 第二轮: hyperframes music-to-video 的 analyze-beatgrid.py + 卡点创作规则
[OUTPUT]: 每个候选核心的 ADOPT/ADAPT/REJECT 判断与落点; 发布版三大杀手差异点 — 差异化说明书底稿
[POS]: skill 根目录的融合决策记录; 说明 rules/qc-gates.md、rules/narration-sync.md、scripts/render-qa.ts 从哪来、为什么要、以及什么被有意拒绝
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Fusion Report — what we took, what we refused, and why

Decision record for the pre-release fusion pass (2026-07). Principle: **fusion is not accumulation.** Every candidate got a verdict; only capabilities that raise release competitiveness were wired in — into existing workflow steps, never as parallel side-pipelines.

## Verdicts

### From hyperframes `website-to-video` (field-tested against caylent.com, see TEST-NOTES)

| Candidate | Verdict | Landing | Reason |
|---|---|---|---|
| Asset Audit gate (contact sheet + USE/SKIP per asset) | **ADOPT** | `rules/qc-gates.md` Gate 1 → SKILL Step 2.5 | In field test it caught real bugs: padded logo art, portrait-in-landscape-slot, mislabeled file formats. Kills "downloaded but never viewed." |
| Per-beat evidence blocks (read the artifact, write structured evidence) | **ADAPT** | Gate 2 → SKILL Step 4, per act | Hyperframes reads beat HTML; we verify the *rendered frame* instead (`remotion still` + Read) — pixels are the artifact TypeScript can't fake. |
| DoD + critic sub-agent | **ADAPT** | Gate 3 → SKILL Step 7.5 | We already had `iterate.ts`; the fusion move was promoting it from post-render optional to pre-render recommended path, chained after Gates 1-2. |
| Honest disclosure ("What I did NOT verify") | **ADOPT** | Gate 4 → SKILL Step 8 delivery | In field test this section carried a real pronunciation bug ("Kalent") to the user. Cheapest trust-builder in the whole pipeline. |
| `w2h-verify.mjs` static verify script | **REJECT** | — (codified as the "Evidence, Never Grep" rule in qc-gates.md) | Field-tested failure: its coverage checker only saw literal `duration: <number>`, flagged idiomatic `duration: BEAT`, and forced code changes purely to satisfy the checker. A check fooled by renaming a variable is not a check. |
| Intent routing table (route "make a video" across 11 workflow skills) | **REJECT** | — (added a slim "NOT for" scope note in SKILL.md) | Routing tables pay off for a skill *family*; remotion-video is deliberately single-purpose (brand URL → launch video). A boundary note buys the discoverability without the surface area. |
| `media-use` catalog resolver (frozen file + ledger + one-line resolve) | **REJECT** | — | Hard-depends on the HeyGen CLI + API key; our orchestrator already auto-resolves logo/screenshots/BGM, and the new `asset-audit.md` covers the review/provenance need. Field test also showed the capture side produced ~85% duplicate assets — the ledger doesn't fix that. |

### From `claude-shorts`

| Candidate | Verdict | Landing | Reason |
|---|---|---|---|
| Claude caption-cleanup layer (fix brand words + filler, timestamps untouched) | **ADOPT** | `rules/narration-sync.md` Rule 2 → SKILL Step 4 | Directly answers the field-test bug class: whisper wrote "Kalent" for "Caylent". Doubles as a pronunciation warning feeding Gate 4. |
| `snap_boundaries.py` audio-aware boundary snapping | **ADAPT** | `rules/narration-sync.md` Rule 3 | Concept ported (sentence-end + pad, silencedetect confirmation, narration-beats-BGM priority), not the script — our cuts are frame-computed in TSX, not ffmpeg segment cuts, so a Python dependency would be dead weight. |

### From `super-video-maker-skill`

| Candidate | Verdict | Landing | Reason |
|---|---|---|---|
| Rule #14 beat-lock (all visual changes pinned to whisper word timestamps) | **ADOPT** | `rules/narration-sync.md` Rule 1 → SKILL Step 4 | The single highest-leverage rule for narrated videos: "timing estimated from the script" is how narrated cuts ship broken. Made conditional — BGM-only videos skip it. |
| Rule #10 synthetic-presenter disclosure | **ADAPT** | `rules/qc-gates.md` Gate 4 bullet | Their rule is avatar-specific (baked-in spoken line + PiP badge). We have no avatars; the honest kernel — tell the user the voice is synthetic + provider/voice ID — became a Gate 4 disclosure item. The user decides about on-screen disclosure. |

### From `video-editing-skill` (maxazure)

| Candidate | Verdict | Landing | Reason |
|---|---|---|---|
| `render_qa.py` post-render machine QC (blackdetect / freezedetect / silencedetect / stream checks) | **ADOPT (ported)** | `scripts/render-qa.ts` → SKILL Step 8, blocking | Our biggest release gap: rendered MP4s had zero machine verification. Ported to TypeScript (matches every other script here), thresholds retuned for this skill's language (freeze ≥3s = review window, not failure — hold-then-snap is intentional; BGM silence >3s = fail — BGM is mandatory). Tested against synthetic pass/fail videos. |
| `content_guard.py` platform lint (广告法极限词 / 引流 / 医疗词) | **REJECT** | — | Rule bank is Xiaohongshu/抖音-policy-specific; this skill delivers a brand launch MP4, not a Chinese social post package. Importing another platform's policy list is a maintenance liability with near-zero hit rate here. Revisit only if social-variant export becomes a target. |
| Five-field narrative rewrite (hook/pain/turn/value/cta) | **REJECT** | — | Duplicate of our existing 5-act structure (`rules/narrative.md` + industry templates), and tuned for 口播 short video, not brand launch pacing. Two competing narrative skeletons in one skill = incoherence. |

### From hyperframes `music-to-video` (second fusion pass, 2026-07 — music-map analysis)

| Candidate | Verdict | Landing | Reason |
|---|---|---|---|
| `analyze-beatgrid.py` music-map analyzer (bpm/beats + energy phases/density + onsets + rolls + silences + hard stops) | **ADOPT (ported)** | `scripts/analyze-audiomap.py` → SKILL Step 4 → `rules/beat-sync.md` | Our beat-sync was aubiotrack BPM + first-beat offset — a metronome. The audiomap lets transitions breathe with energy and phrasing instead of counting beats. Ported slim: per-event drum classification / metrical grid / phrase budgets dropped (they serve hyperframes' per-frame sub-agent dispatch, dead weight for a 5-act launch video); added a `ROLL_MAX_BEATS` guard so a uniformly dense groove can't register as one track-long "roll". |
| "One analyzer, trust it unconditionally" + rhythm-trust design law (bpm/beats_sec reliable only on genuinely rhythmic music) | **ADOPT** | `rules/beat-sync.md` Laws 1–2 | The two ideas that make the analyzer safe: no second-sourcing beats (kills drift arguments), and an explicit machine `rhythmic: true/false` verdict (beat CV ≤ 0.12 + ≥50% beat-onset support + ≥0.8 onsets/s) instead of hyperframes' per-frame LLM pacing call — this skill has no per-frame sub-agents, so the verdict must be computed, not judged. Non-rhythmic → energy-phase/silence pacing, hard cuts to the grid forbidden. |
| beat-direction / kinetic-beat-slam creative kernels (one shared beat array drives every element; energy peaks earn the hit) | **ADAPT** | `rules/beat-sync.md` Law 3 + `references/audio.md` beats.ts note | Kernel kept: BEATS come from the audiomap verbatim (never BPM arithmetic), hold-then-snap resolves on `key_moments` SURGEs, rolls are cascade cues, `hard_stops` are the only earned smash cuts. HyperFrames/GSAP-specific mechanics (metronome chrome, GSAP ease table) not imported — Remotion springs already cover them via rules/motion.md. |
| librosa dependency handling | **ADAPT** | self-preflight inside `analyze-audiomap.py` | Wiring librosa into url-to-video.ts TOOLCHAIN would violate the "orchestrator untouched" red line; the analyzer pip-installs its own deps (plain → `--break-system-packages` → `--user`) and degrades to aubiotrack when install fails: audiomap then carries bpm+beats only, all other fields null, `rhythmic: false` — downstream treats the grid as untrusted. Verified both paths against a 30.9s MusicGen track (librosa: 123 BPM / 59 beats / rhythmic; fallback: 125.8 BPM / 56 beats / untrusted). |

## Score: 5 adopted/adapted in, 5 rejected (pass 1) · 4 adopted/adapted in (pass 2, music-map)

Pass-1 surface: 2 rule files (`qc-gates.md`, `narration-sync.md`), 1 script (`render-qa.ts`), 1 workflow step (2.5), 1 step repositioned (8.5 → 7.5). Pass-2 surface: 1 script (`analyze-audiomap.py`), 1 rule file (`beat-sync.md`), wired into existing Step 4 — orchestrator (`url-to-video.ts`) untouched, `beat-sync.ts` demoted to legacy pulse carrier. Everything on the existing 8-step spine; no parallel pipelines.

## Composition-debt repair (pass 3, 2026-07-03 — field failure driven)

Trigger: a happy-model launch first cut was killed by the user ("写死了，每次都是那几个动态") — every act was spring logo + shimmer / hub-and-spoke pill diagram / hollow-card triptych / CountUp row, all floating dead-center on bare `#000`. Root cause was structural, not per-project: the scaffold's compositional vocabulary was too narrow (one skeleton — `padding + eyebrow + headline + centered box` — worn by every act), the root atmosphere was near-invisible (GradientMesh 0.2 + grid 0.035), and no rule governed how content OCCUPIES the frame (taste.md bans elements, nothing banned compositions).

| Fix | Landing | Source |
|---|---|---|
| Bespoke Composition Law — 五铁律 (zero vacuum / full-bleed moment / editorial 200-320px type / real assets first / composition diversity) + compositional SLOP BLACKLIST with named replacements + thin-evidence playbook (score < 40 → grow a brand world from logo geometry, never empty cards) | **`rules/composition.md`** (new) → SKILL.md Step 4 reads it FIRST; Gate 2 evidence block gained a four-law Composition self-check line ("敢不敢把这一帧发给骂过你丑的人") | Generalized from the user-approved happy-model ART-DIRECTION v2 + the hyperframes-caylent benchmark's full-bleed/size-driven grammar |
| `Atmosphere` primitive — composed zero-vacuum base (VolumetricLight multi-layer radial glow eating `theme.color.primary` + GridHorizon perspective wireframe floor + DriftParticles deterministic sin-hash drift + optional grain), default-on at MainVideo root replacing the anemic GradientMesh/GridOverlay pair | **`scaffold/src/components/Atmosphere.tsx`** (new), wired in `scaffold/src/MainVideo.tsx` root | ART-DIRECTION v2 铁律 1 (氛围底座), parameterized for any brand |
| Organic motion vocabulary wiring — wiggle / inertia-overshoot / idle float / stagger-follow / loop / lookAt / exponential approach, as a when-to-use-which table with a pointer to the source skill for code + determinism rules | **`rules/motion.md`** new top section → `~/.claude/skills/remotion-motion/` | remotion-motion skill existed all along but was never wired in — idle ammunition |

Discipline note: no new scripts, no new gates — the five laws ride existing Step 4 + Gate 2; scaffold verified with a clean `tsc --noEmit` after the Atmosphere wiring.

## Three killer differentiators vs hyperframes (release positioning)

1. **Closed-loop taste iteration, pre-render.** Hyperframes' critic sub-agent produces a report a human applies. Our Step 7.5 critic *acts*: vision-LLM scores every act → rewrites the weakest scene → `tsc --noEmit` guard with auto-rollback → re-renders stills → repeats to threshold. The first MP4 the user sees is the post-critic cut.
2. **Machine QC on the actual output file.** Hyperframes' machine verification layer misfired in field test (animation-map broken, w2h-verify fighting idiomatic code); final-MP4 checking was manual frame reads. We ship `render-qa.ts`: black/freeze/silence/clipping/stream checks on the rendered file, blocking, with review windows a human (Claude) then Reads. Signal analysis where machines are right, eyes where they're not.
3. **One-command zero-manual intake with evidence scoring.** Hyperframes' pipeline is capture → 7 collaborative steps across multiple skills. Our orchestrator is a single command: preflight auto-installs tools, harvests brand evidence, scores it, picks a mode, writes the scene constitution and a runnable first-cut project — then the four evidence gates (adopted from hyperframes' best idea, minus its grep trap) guard the path to render.
