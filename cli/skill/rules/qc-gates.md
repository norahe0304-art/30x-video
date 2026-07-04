<!--
[INPUT]: asset-manifest.json + public/brand/* 视觉素材, scene-constitution.json + story.md, 已构建的 src/scenes/, scripts/iterate.ts (critique-scenes + regenerate-scene), `npx remotion still` 渲帧能力
[OUTPUT]: Four evidence-based QC gates — Gate 1 Asset Audit (Step 2.5), Gate 2 Per-Act Frame Evidence (Step 4), Gate 3 Critic Loop wiring (Step 7.5), Gate 4 Honest Disclosure (Step 8 delivery)
[POS]: rules/ 的证据层门禁; 与 finish-gate.md (哲学层) 互补 — finish-gate 审判品味, qc-gates 审判"你真的看过了吗"; Gate 2 引用 composition.md 四铁律自检; 被 SKILL.md workflow 的 2.5/4/7.5/8 步引用
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Evidence QC Gates

Four gates that kill one failure family: **claiming verification without looking.** Assets downloaded but never viewed. Scenes coded but never rendered. Renders never re-watched. Summaries that say "looks great" about things never checked. Each gate forces the same move — produce pixels, Read the pixels, write down what you saw — at the four points in the workflow where trust-without-evidence historically shipped broken videos.

## Design Rule: Evidence, Never Grep

Every gate in this file verifies by **rendering pixels and Reading them**, never by pattern-matching source code.

Why this is a hard rule: static literal checks fight idiomatic code. Field-tested example — a verify script whose timeline-coverage checker only recognized literal `duration: <number>`, so sub-agents who wrote the idiomatic `duration: BEAT` (a named constant) were flagged as failures, and code got rewritten purely to satisfy the checker. The check verified nothing about the video; it verified a coding style. If a check can be fooled (or failed) by renaming a variable, it is not a check.

- Visual claims ("the headline is legible", "the logo is on screen", "the chart animates") are only provable by a rendered frame that was actually Read.
- Timing claims are only provable by frames at specific frame numbers, or by playback.
- The existing Step 7 grep gates verify **structural presence** (a component is imported, an asset path is referenced) — that is their job and they stay. Do NOT add new grep/literal-matching checks that pretend to verify visual or timing correctness. When tempted, render a still instead.

---

## Gate 1: Asset Audit (Step 2.5 — after asset supplement, before storyline)

**Failure this kills:** assets get downloaded into `public/brand/` and placed into scenes without anyone ever viewing them. Field results from skipping this: a 3100×1000 logo with ~70% empty padding stretched full-width; a portrait photo forced into a landscape slot; files whose extension lies about their format; a video that could have carried Act 2 left on the floor.

**Procedure:**

1. Enumerate every visual asset: every `assets[].localPath` in `asset-manifest.json` plus anything else in `public/brand/` (`.png .jpg .jpeg .webp .svg .mp4`). Collapse exact duplicates first (`shasum public/brand/* | sort`) — audit distinct files, not copies.
2. Look at every one of them:
   - Preferred: build a labeled contact sheet — `montage -label '%f' public/brand/*.{png,jpg,jpeg,webp} -tile 4x -geometry 320x240+8+8 evidence/asset-sheet.jpg` — then Read the sheet. If any cell is too small to judge, Read the individual file.
   - No ImageMagick: Read each image file individually. SVGs render poorly as thumbnails — Read the individual file or a browser screenshot of it.
   - For `.mp4`: extract 3 spread frames (`ffmpeg -i demo.mp4 -vf "select='eq(n,0)+eq(n,120)+eq(n,240)'" -vsync vsync_drop evidence/demo-%d.png`) and Read those. You must know what footage shows before it plays in an act.
   - The contact sheet is for YOUR eyes only — it never appears in the video.
3. Write `asset-audit.md` in the project root — one row per distinct asset:

```
asset: public/brand/hero.png
pictured: <what is actually in the image — content, not filename>
quality: <resolution ok? padding? orientation? real format vs extension?>
verdict: USE (Act 3 vignette 2) | SKIP — <one sentence naming which act failed to find a use for it>
```

**Verdict rules:**

- USE must name the act. SKIP must give a reason; "doesn't fit" is not a reason.
- "SKIP everything except the logo" is the classic failure this gate exists to catch — if every distinctive brand visual is SKIP, the video will be a generic template with a logo swap. Revisit before proceeding.
- An asset that has no `asset-audit.md` row may not appear in any scene. Ever.

**Gate:** `asset-audit.md` exists, has a row for every distinct visual asset, and every USE names an act. This gate feeds Step 3 (storyline) and Step 4 (scenes) — the story should be told with assets you have actually seen.

---

## Gate 2: Per-Act Frame Evidence (Step 4 — after building EACH act, before starting the next)

**Failure this kills:** "the code compiles, so the scene renders correctly." It doesn't. TypeScript cannot see an off-screen headline, a mis-scaled screenshot, white text on a white brand background, or an animation that finishes after the act cuts.

**Procedure — after each act is built:**

1. Pick representative frames from the act's range in `scene-constitution.json`: minimum one mid-act frame (entrance settled, content at full opacity); for motion-heavy acts add an entrance frame (~20-30f in) and a near-exit frame.
2. Render them:

```bash
npx remotion still MainVideo evidence/act-<N>-f<frame>.png --frame=<frame>
```

3. **Read each PNG.** Not "the still command exited 0" — the Read tool, on the image, with your eyes on the output.
4. Append a structured evidence block to `evidence/act-evidence.md`:

```
Act N (frames X–Y) — evidence/act-N-f<frame>.png
  On screen:        <what is actually visible — headline text verbatim, UI elements, assets, background>
  Brand assets:     <which public/brand/ files are visibly on screen — or "none", with justification>
  Matches plan?     <scene-constitution.json act purpose + story.md — yes/no, name the gap>
  Legibility:       <headline readable at a glance? contrast ok? anything clipped or overlapping?>
  Motion state:     <at this frame, is the animation where the timing audit says it should be?>
  Composition:      <rules/composition.md 四铁律自检 on THIS still — vacuum? full-bleed moment? editorial type scale? real asset used? 判据: 敢不敢把这一帧发给骂过你丑的人>
  FLAG:             <anything ambiguous, surprising, or below quality bar — or "none">
  VERDICT:          PASS / FIX <exactly what>
```

5. FIX before starting the next act. A flaw carried forward gets copied by every act built after it.

If you cannot fill a line ("I can't tell which asset that is"), that IS a finding — resolve it, don't paper over it.

**Gate:** every act has at least one evidence block in `evidence/act-evidence.md` with VERDICT: PASS, written from a Read of a rendered frame — including the Composition line's four-iron-law self-check ([rules/composition.md](composition.md)). An act without an evidence block is an act nobody has seen; an act whose still fails the "send it to the person who called your last cut ugly" bar is an act that will get killed in review.

---

## Gate 3: Critic Loop (Step 7.5 — after final audit, BEFORE render)

**What changed:** the iterate loop is no longer a post-render "optional extra." It is the recommended path between Step 7 (final audit) and Step 8 (render). `critique-scenes.ts` renders its own stills, so it needs no MP4 — running it before render means the render you produce is the post-critic cut, not the pre-critic draft.

```bash
node --experimental-strip-types <installed-skill-dir>/scripts/iterate.ts . --rounds 3 --threshold 8
```

- Each round writes `.iterate/round-N/critique.json` (per-act 5-dim scores + weakest-scene directive), `frames/*.png`, `regenerate.log`. The regenerator auto-rolls back MainVideo.tsx/theme.ts if `tsc --noEmit` fails.
- **Read `critique.json` yourself.** Quote the weakest directive in your delivery message (Gate 4). Any act scoring below 3 on any dimension: fix it even if the overall score cleared the threshold.
- After the loop mutates scenes, spot-check with Gate 2 discipline: render one still of each changed act and Read it. The critic's fix can introduce its own regression.
- Skipping the loop (time pressure, user said "just render") is allowed — but then Gate 4 must say so: "Critic loop not run" goes in the NOT-verified list.

**How the three build gates chain:** Gate 1 verified the inputs (every asset seen before use) → Gate 2 verified each act as built (every scene seen before the next) → Gate 3 attacks the whole cut adversarially (a critic scores what you made, and the weakest scene gets rebuilt). Same principle at three altitudes: nothing ships unseen.

**Gate:** either `.iterate/history.json` exists and the final `overallScore ≥ threshold` (or remaining gaps are consciously accepted and disclosed), or the skip is disclosed in Gate 4.

---

## Gate 4: Honest Disclosure (Step 8 — the delivery message)

**Failure this kills:** "Looks great, ready to ship" — covering both what was checked and what wasn't, so the user can't tell which claims are load-bearing.

Your final delivery message MUST end with these two sections, after the file path / preview URL, before you stop talking:

```
**What I verified:**
- <one bullet per gate/check that passed, with the evidence cited inline>
  (e.g. "Asset audit: 14 distinct assets Read, 6 USE / 8 SKIP — asset-audit.md")
  (e.g. "Per-act frames: 5/5 acts PASS — evidence/act-evidence.md, 9 stills Read")
  (e.g. "Critic loop: 2 rounds, overallScore 8.2 — weakest directive was Act 3 card density, fixed")
  (e.g. "render-qa: PASS — 0 black frames, 0 silence, 1 freeze window at 12.4-15.6s Read and confirmed as the intended Act 3 hold")

**What I did NOT verify (spot-check these):**
- <one bullet per item skipped, deferred, or impossible in this session — and why>
```

Typical honestly-undisclosable-as-verified items for this pipeline:

- **Audio by ear** — BGM musical fit, mix levels, whether the TTS voiceover mispronounces the brand name. Frame reads and `volumedetect` numbers are not ears.
- **Full-frame-rate motion** — stills at N frames out of `duration × fps` are a few percent coverage; spring settle quality, transition smoothness, and everything between stills is unverified unless you played the video at 1.0×. State the coverage percentage.
- **Real-time Studio playback performance**, browser/codec compatibility, how the video looks on the target platform's compression.
- Any gate that was skipped (e.g. "Critic loop not run — user asked for fastest path").
- **Synthetic voice provenance** — if the video has TTS narration, say so in the delivery notes ("narration is an AI voice, provider X, voice Y") and carry any brand-name pronunciation warning from rules/narration-sync.md Rule 2. The user decides whether their channel needs on-screen disclosure; you must give them the fact.

**Rules:**

- The section header "What I did NOT verify" must appear even if the list is "None." Its absence is the red flag the user learns to look for.
- No adjectives where numbers exist ("most frames checked" → "9 stills of ~1200 frames, 0.75%").
- Never omit a known FLAG from an evidence block because you decided it was minor — one bullet, let the user decide.

Lying or omitting here is worse than skipping a check honestly. A short user spot-check beats a hidden broken video every time.
