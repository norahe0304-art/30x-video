<!--
[INPUT]: audiomap.json (scripts/analyze-audiomap.py 输出), public/brand/bgm.mp3, src/generated/beat-map.ts (legacy 脉冲常量), `npx remotion still` 渲帧能力
[OUTPUT]: BGM 驱动的转场/动效时机决策规则 — rhythmic 走拍网格吸附, 非 rhythmic 走能量段落与静默窗口; 附证据型验证程序
[POS]: rules/ 的音乐时机层; 被 SKILL.md Step 4 引用; 与 motion.md (hold-then-snap 实现) 和 qc-gates.md (Evidence, Never Grep 红线) 互补; 移植自 hyperframes music-to-video (见 FUSION-REPORT.md)
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Beat Sync — the music map drives the cuts

BGM-driven timing upgraded from "count beats off a BPM" to "breathe with the track's energy and phrasing." One analysis, one JSON, every timing decision reads from it.

## Law 1: One analyzer, and you trust it — unconditionally

`scripts/analyze-audiomap.py` is the **only** music analyzer. Run it once per track:

```bash
python3 <installed-skill-dir>/scripts/analyze-audiomap.py public/brand/bgm.mp3 --output audiomap.json
```

`audiomap.json` lands in the **project root**. It is deterministic — same file, same map.

- **Never re-measure the track** with aubiotrack, ffmpeg, another library, or by ear once `audiomap.json` exists. Two beat sources in one project = guaranteed drift arguments. If you suspect the map is wrong, delete it and re-run the one analyzer — don't second-source.
- `energy`, `energy_phases`, `onsets_sec`, `silences`, `key_moments`, `hard_stops`, `rolls` are reliable on **any** music.
- `bpm` and `beats_sec` are reliable **only when `rhythmic: true`**. On calm/ambient music the beat tracker still emits a grid — but it's a metronome the tracker imposed, not something a viewer hears. Cutting to it reads as random.

## Law 2: Read `rhythmic`, then pick the pacing mode

The analyzer writes an explicit verdict — `rhythmic: true|false` — plus its evidence (`rhythm.beat_cv`, `rhythm.beat_onset_support`, `rhythm.onset_rate`, `rhythm.reason`). Do not overrule it by vibes.

### `rhythmic: true` → snap to the beat grid

- Every scene transition start frame = `round(beats_sec[i] * fps)` for some real beat `i`. Prefer `downbeats_sec` for act boundaries (the big cuts land on bar lines, minor vignette cuts may take any beat).
- The first cut is never before `beats_sec[0]` — tracks often fade in; a cut in the pre-beat limbo feels early.
- Beat pulses / accent animations read the same grid. `src/generated/beat-map.ts` (the orchestrator's legacy pulse constants) stays as the mechanical carrier for MainVideo's pulse, but audiomap is the truth: if `beatMap.bpm` differs from `audiomap.bpm` by more than 2%, rewrite the beat-map constants from audiomap values (`bpm`, `firstBeatSec = beats_sec[0]`) — never the other way around.

### `rhythmic: false` → breathe with energy and silence

Hard-cutting to `beats_sec` is **forbidden** in this mode. Instead:

- **Transitions land on `energy_phases` boundaries** — a level change (LOW→HIGH, HIGH→MEDIUM) is the musical event a viewer actually feels. Longer crossfades (12–20f) over hard cuts.
- **`silences` windows are breathing frames**: hold a still composition, let text settle, no entrances mid-silence. The tail silence is where the CTA lockup rests — don't animate into a fading-out track.
- **`key_moments` SURGEs** are the only acceptable "hit" points for an emphatic entrance; DROPs are where you pull elements back.

## Law 3: Motion accents read the energy map (both modes)

- **hold-then-snap** (rules/motion.md): time the *snap* to a `key_moments` SURGE or, in rhythmic mode, to a downbeat inside the scene's span. The hold occupies the low-energy run before it.
- A `rolls` entry (localized onset burst) is a cascade cue: per-character stagger, card cascade, counter run — the continuous visual belongs inside the roll's `[start, end]`, resolving at its end.
- `hard_stops` are smash-cut licenses: an instant visual change at that timestamp is *earned*; anywhere else it needs a transition.
- Scene density should respect phase `density`: don't stack three entrances inside a `sparse` phase, don't leave a `dense` phase visually static.

## Degraded mode (analyzer fell back to aubiotrack)

If `source: "aubiotrack-fallback"`, the map carries only `bpm` + `beats_sec`; every other field is `null` and `rhythmic` is `false`. Treat the grid as **untrusted**: use Law 2's non-rhythmic pacing on scene-length intuition (equal-breath acts, generous crossfades), use `bpm` only for pulse period, and say so in Step 8's honest disclosure ("beat grid degraded — transitions not energy-verified").

## Verification — evidence, never grep

Per `qc-gates.md`'s hard rule: no static source checks that pretend to verify timing. A regex on `MainVideo.tsx` cannot hear music. Verify with numbers and pixels:

1. **Numeric check (facts, not source patterns):** list your actual cut frames (from the composition's sequencing math or Remotion Studio timeline), convert to seconds, and diff against the chosen anchors — `beats_sec`/`downbeats_sec` (rhythmic) or `energy_phases[].start`/`silences` (non-rhythmic). Every cut must sit within ±1 frame of its anchor. Write the table (cut → anchor → delta) into `evidence/act-evidence.md`.
2. **Pixel check:** render a still at each transition frame and at `transition_frame + 3f`, Read both — the change must actually be visible where the anchor says it is.
3. **Ear check at delivery:** after render, scrub the MP4 at the two strongest `key_moments` and confirm picture and hit coincide; anything not checked by ear goes in the "What I did NOT verify" section.
