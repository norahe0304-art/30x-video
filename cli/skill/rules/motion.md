# Motion & Animation

Springs, easing curves, timing, and stagger patterns for premium Remotion video.

## Organic Motion Vocabulary (from the `remotion-motion` skill)

The AE-expression motion vocabulary lives in a sibling skill: **`~/.claude/skills/remotion-motion/SKILL.md`** — deterministic Remotion ports of wiggle, inertia bounce, loops, stagger, idle float, lookAt, exponential approach. Read that file for the actual code; this table says WHEN to reach for which. If a held shot feels dead or an entrance feels robotic, the answer is usually here, not another spring preset.

| Pattern | Feel | Use it when |
|---|---|---|
| `wiggle(freq, amp)` | organic jitter / handheld drift | Camera drift on full-bleed imagery; floating UI panels; anything held >3s that must not read as a freeze-frame. Low freq (0.3-0.6), low amp (4-10px) |
| Inertia / overshoot bounce (`spring damping 9` or decaying-sine settle) | arrive with weight, then settle | The ONE hero element arrival per act (logo, key number, main panel). Never on every element — overshoot everywhere = cartoon. Siblings keep damping 14-16 |
| Idle float / breathe (`sin` bob ±1-2% scale) | alive while holding | Directly serves the "never hold still >4s" rule — logos in Act 1/5, hero numbers in Act 4, phones/mockups mid-hold |
| Stagger / delay-follow (`frame - i*3`; grid: `(i%COLS)*2 + row*5`) | crowd trailing a leader | Grids and lists entering — the diagonal-wave grid variant beats uniform left-to-right stagger |
| `loopOut` cycle / pingpong | seamless idle loops | Background particles, scanning lines, positional drift loops that must run the whole act without a visible seam (rhythmic scale/brightness throb = heartbeat ban, taste.md) |
| 2D `lookAt` (atan2 to target) | element faces its motion path | Anything traveling along a path — arrows, vehicles, data packets in a convergence scene (composition.md hub-and-spoke replacement) |
| Exponential approach (half-life ease) | camera easing to rest, no bounce | Ken-Burns endings, camera reframes inside a brand world, follow-cam on a moving subject |

Determinism is non-negotiable (same rules as the source skill): no `Math.random()`, no `Date.now()` — seed per-element with the sin-hash and de-sync copies via per-element phase offsets. When you invent a new pattern, fold it back into `remotion-motion/SKILL.md` so the shared vocabulary grows.

## Exponential Easing (Apple Keynote Feel)

Use exponential deceleration instead of cubic — objects arrive FAST, settle SLOWLY:

```tsx
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

// Usage in interpolate
const entrance = interpolate(frame, [0, 15], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: easeOutExpo,
});
```

## Per-Character Text Stagger

Headlines NEVER fade in as a block. Split into characters with 40-80ms stagger:

```tsx
{text.split("").map((char, i) => {
  const delay = startFrame + i * 1.2;
  const prog = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  return (
    <span key={i} style={{
      display: "inline-block", opacity: prog,
      transform: `translateY(${interpolate(prog, [0, 1], [25, 0])}px)`,
      whiteSpace: "pre",
    }}>{char}</span>
  );
})}
```

## Spring Config Presets

| Use case | Config | Behavior |
|----------|--------|----------|
| Professional default | `{ damping: 14-16, stiffness: 60-80 }` | Minimal bounce |
| Smooth reveal | `{ damping: 200 }` | No bounce, subtle |
| Snappy UI | `{ damping: 20, stiffness: 200 }` | Responsive |
| Heavy settle | `{ damping: 15, stiffness: 80, mass: 2 }` | Slow, weighty |

## Spring OOM Warning

`spring()` creates a new function evaluation per frame per call site. In long compositions (1200+ frames) with many simultaneous spring calls (10+ elements animating), Chrome headless can OOM and crash the render.

**If render crashes with OOM or exits silently around frame 300-500:**

Replace `spring()` with `interpolate()` + `Easing.out(Easing.exp)` — visually identical, dramatically lower memory:

```tsx
// BEFORE (OOM risk in long sequences):
const scale = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });

// AFTER (safe, same visual feel):
const scale = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: Easing.out(Easing.exp),
});
```

**Rule of thumb:** Use `spring()` for ≤3 simultaneous elements per scene. For staggered grids (4+ cards, 6+ icons), prefer `interpolate` with easeOutExpo.

## Timing Standards

- **Entrance:** 15-20 frames (spring scale 0.95→1 + opacity 0→1)
- **Hold:** 60-90 frames minimum per scene state
- **Exit:** 10-15 frames (opacity fade only, ~75% of entrance duration)
- **Stagger:** 4-8 frames between siblings. Cap total: 10 items × 4f = 40f max
- **First 3 seconds:** must animate immediately — no slow fade from black
- **Static limit:** never hold still >4 seconds — add float drift, cursor motion, or a slow glow *position* shift (never rhythmic glow/scale throb — heartbeat ban, taste.md)

## IRON LAW: Animation Must Complete Before Scene Ends

**Every animation (SplitText, Typewriter, stagger, CountUp, spring) MUST finish with breathing room BEFORE the scene transitions.** If text is still appearing when the fade starts, the video is broken.

### Completion Budget Formula

```
animation_finish_frame = delay + (char_count × staggerFrames)   // SplitText
animation_finish_frame = delay + (text.length / speed)           // Typewriter
animation_finish_frame = delay + (item_count × stagger_gap)     // staggered items

scene_transition_start = durationInFrames - 15                   // fade begins

REQUIRED: animation_finish_frame + 45 < scene_transition_start
          ↑ 45 frames (1.5s) minimum reading/breathing time
```

### How to Validate (Do This For EVERY Scene)

After writing a scene, calculate:
1. When does the LAST animation element finish appearing?
2. When does the scene transition/fade begin?
3. Is there at least **45 frames (1.5s)** between finish and transition?

If NOT → either:
- **Extend the scene** `durationInFrames`
- **Reduce delay** so animation starts earlier
- **Increase speed** so animation completes faster
- **Cut content** — fewer words, fewer items

### Common Traps

| Trap | Why It Breaks | Fix |
|------|--------------|-----|
| SplitText with 30 chars × 2f stagger = 60f finish, in a 80f scene | Only 5f to read before fade | Extend scene to 120f or reduce stagger to 1.5f |
| Typewriter with 60 chars at speed 1.5 = 40f, delay 30 = finishes at 70f, scene is 90f | Text finishes at 70f, fade at 75f, 5f to read | Start typing earlier (delay 10) or increase speed |
| 6 icons with 6f stagger, delay 40 = finishes at 76f, scene is 90f | Last icon appears 14f before scene ends | Reduce delay to 25 or increase durationInFrames |

**This is not a suggestion. This is a BLOCKING check. Fix before moving to the next scene.**

### Hard Floor: Minimum Sequence Duration for Text-Bearing Scenes

**Any `<Sequence durationInFrames={N}>` that contains a SplitText / Typewriter / per-character animation MUST have N ≥ 80 frames.** A 40f or 60f sequence cannot mathematically satisfy the formula above — even with delay=0 and stagger=1, a 20-character headline needs `20f (reveal) + 45f (breath) + 15f (fade) = 80f` minimum. Shorter sequences guarantee the text cuts mid-reveal.

**Red flag:** if you are writing `Sequence durationInFrames={40}` or `{60}` with any text-bearing component inside — STOP. Either merge it into the adjacent sequence or extend it to ≥90f.

This bug appeared repeatedly in Act3 Showcase scenes where agents packed 5 sub-sequences (headline → UI → headline → UI → headline) into 480f and gave the final headline only 40f. The "final frontier" message then cut before finishing. **Fix: drop the third headline and extend the prior sequences. The closing brand message belongs in Act5, not Act3.**

### Act-Level Structural Rule: Max 4 Sub-Sequences per 16s Act

A 480f (16s) Act3 Showcase should contain AT MOST 4 internal `<Sequence>` blocks (2 headline-UI pairs). Cramming 5 sequences (e.g. H1→UI1→H2→UI2→H3) leaves the last one under-sized. If you feel tempted to add a third headline, put it in Act5 close instead.

### Automated Audit Command

Before moving to Step 6 preview, run this grep to find suspiciously short sequences:

```bash
grep -rn "durationInFrames={[0-7][0-9]}" src/scenes/ | grep -v "fade\|spring\|interpolate"
# Any hit here is a POTENTIAL bug — inspect and verify no SplitText/Typewriter inside
```

## Scene Entrance/Exit Uniformity

All scenes must:
- Enter with spring scale (0.95→1) + opacity (0→1) in first 15 frames
- Exit with opacity fade in last 18-22 frames
- Use `overflow: "hidden"` on ALL containers

## Hold-Then-Snap

Premium videos alternate STILLNESS and MOTION. Content holds still 60-90 frames, then snaps to next state in 8-12 frames. The contrast creates drama. Constant motion = screensaver, not launch video.

## Easing Rules

- **ease-out** for entrances (elements arriving)
- **ease-in** for exits (elements leaving)
- **spring** for interactive/gesture-like motion
- **NEVER linear** (except progress bars)
- **NEVER bounce/elastic** — tacky since 2015. Spring with damping 14-16 gives the right feel

## One Focal Animation at a Time

If cards stagger in AND a chart draws AND text types simultaneously, the eye has nowhere to go. Sequence them: cards first → chart draws → text types.

## Transform Only

Never animate `width`, `height`, `top`, `left`. Animate only `transform` and `opacity` — smoother rendering.
