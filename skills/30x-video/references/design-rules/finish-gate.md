<!--
[INPUT]: Rendered video, scene drafts, brand evidence, taste rules
[OUTPUT]: Pre-delivery blocking gate with explicit pass/fail checks
[POS]: design-rules/ 的出口; 把品味变成执行前最后一道闸
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Finish Gate

Mandatory after render, before delivery. Catches default bad solutions before they ship.

## Anti-Attractor Pass

Before delivery, write down at least three reflex defaults the model wanted to reach for:

- purple-gradient SaaS aura
- Inter-everywhere monotony
- card-stack crutch
- centered headline over busy UI
- generic "clean startup" layout
- stock light-leak transition
- corporate elevator BGM

If you cannot name the reflex defaults, you are probably still inside them.

## What Must Be Stated

Before delivery, the builder must articulate:

1. **Default bad solution:** what the model would have done by reflex
2. **Why it was rejected:** what made it generic, monocultural, or unfaithful
3. **Brand truth override:** which real evidence forced a better decision
4. **Chosen direction:** what replaced the bad default and why it fits

If this cannot be said clearly, the video is not ready.

## Monoculture Checks (any → fail)

- Purple-gradient SaaS atmosphere with no brand justification
- Inter-everywhere monotony when the brand clearly signals another type attitude
- Card-on-card stacks or template dashboard grids used because they were easy
- Layouts that could belong to any AI startup with only a logo swap
- Decorative effects that have no information role
- Two or more scenes reuse the same centered-title / subtitle / CTA skeleton with only copy changed
- Two or more scenes rely on the same 3-card feature grid as a default reveal
- The overall cut reads as "generic AI output" before it reads as this brand

## Credibility Checks (any → fail)

- The product UI looks ornamental instead of real
- Motion feels playful when the product needs trust
- Proof moments are weaker than the decorative transition budget
- The video hides behind abstract visuals because the product evidence is thin
- The close sounds like generic AI copy instead of a brand-specific claim
- Dense UI scenes are covered with headline text instead of being framed cleanly
- Count-ups, charts, or metrics animate so late that the viewer cannot verify them before the cut

## Template Trap Checks (any → fail)

- Two adjacent scenes feel like the same layout with a palette swap
- The edit depends on decorative spacing rather than information hierarchy
- A scene survives the `logo swap test` with almost no other changes
- The most memorable visual move is a transition, not a product or proof moment

## Visual Discipline Audit

For the final cut, verify:

- **Hierarchy:** one clear focal point per frame
- **Hierarchy by two:** the hero element wins by at least two of size, contrast, position, weight
- **Contrast:** text and proof surfaces are readable without straining
- **Whitespace:** negative space feels intentional, not empty or starved; reject `whitespace starvation`
- **Density:** UI scenes hold enough evidence to be persuasive but not noisy
- **Motion dignity:** transitions support narrative instead of stealing attention
- **Remove test:** if covering an element improves the frame, that element is decorative filler — cut it

## Audio Discipline Audit

- **VO clarity:** the voice over reads cleanly, never crowded by BGM
- **BGM ducking:** BGM drops -12 to -18 dB under VO
- **Beat alignment:** transitions land on beat, holds land on bar
- **No corporate elevator BGM:** if the soundtrack could appear unchanged in any other AI-generated video, replace it
- **VO pacing:** 140-165 wpm target, 175 max
- **Silence is OK:** if a beat doesn't earn music, leave it silent

## Confirmation Trace

Confirm that:

- All decisions made at the Confirmation Gate were honored
- Format / duration / voice / BGM mood / visual style match what user approved
- No decisions silently changed mid-render

## Pass Conditions

Delivery may proceed only when:

- At least three reflex defaults were written down and explicitly rejected
- Real evidence (Refero refs / user assets / brand site scrape) is visible in the cut
- At least two scenes feel content-specific rather than layout-specific
- The archetype sharpened the design without overpowering the content
- No two scenes collapse into the same template posture
- Dense scenes remain readable without headline clutter
- VO and BGM are properly ducked and beat-aligned
- The team can explain why this does NOT look like a generic AI-generated video

## Anti-Pattern Vocabulary

Name problems precisely when rejecting:

- `template layout`, `cardocalypse`, `inter everywhere`, `purple reflex`
- `headline over UI clutter`, `proof starvation`, `monoculture motion`
- `reflex default`, `template trap`, `generic AI output`, `monoculture collapse`
- `card stack crutch`, `hierarchy failure`, `whitespace starvation`, `decorative filler`
- `stock transition reflex`, `corporate BGM reflex`, `VO over-narration`, `BGM domination`

Precise naming matters. Vague criticism leads to vague fixes.

## Iteration Limit

This gate may trigger up to 2 re-renders. After 2 fails, surface the failure to the user with explicit reasoning — do not silently ship a third attempt.
