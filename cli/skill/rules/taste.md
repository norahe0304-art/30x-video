<!--
[INPUT]: Scene drafts, archetype inference, enterprise product context, Impeccable and taste-skill principles
[OUTPUT]: Anti-slop discipline, archetype-sensitive taste rules, and readability/watchability constraints
[POS]: rules/ 的哲学层核心; 约束什么该被删除、什么值得保留、什么会立刻暴露为 AI 模板味
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Design Taste & Anti-AI-Slop

Design principles, cognitive psychology, quality gates, and the patterns to NEVER use.

## AI Slop Blacklist

These patterns instantly signal "AI-generated." Never use:

- Purple/violet gradient backgrounds or blue-to-purple color schemes
- 3-column feature grid: icon-in-circle + title + 2-line description × 3
- Icons in colored circles as section decoration
- Center-aligned everything (real design uses left-align in most contexts)
- Uniform border-radius on every element (use radius HIERARCHY)
- Decorative blobs, floating circles, wavy SVG dividers
- Emoji as design elements
- Colored left-border on cards (`border-left: 3px solid`)
- Generic hero copy: "Unlock the power of...", "Your all-in-one solution"
- Gradient text for "impact" on metrics/headings
- Hero metric template: big number + small label + gradient accent
- Default dark mode with glowing accents
- Sparklines as decoration conveying nothing
- Large icons with rounded corners above every heading
- Inter everywhere with no brand-specific type reasoning
- Cards on cards on cards ("cardocalypse")
- Template layouts that survive a logo swap
- Bad contrast hidden behind blur, glow, or tinted overlays
- **Expanding ring / ripple / burst-circle motion** (impact rings, sonar ripples, city-dot ripples — any stroked circle animating its radius outward). User verdict 2026-07-04: "我最恶心这种圆形的动效". Express impact with a glow-intensity pulse, a scale pop on the object itself, or a power-cut flicker — never a detached expanding circle
- **Heartbeat motion — any rhythmic scale/brightness oscillation** (downbeat scale pulse on the whole frame, `1 + Math.sin(frame/N) * k` breathing on glows/blobs/backgrounds, BGM-synced throb). User verdict 2026-07-04: "心跳的那种动效 以后别用". The throb reads as anxious, not alive. Slow positional drift (`translateX/Y` sine float) is still fine — atmosphere moves, it never *pumps*. Beat-sync stays for CUT TIMING only (transitions/act boundaries on downbeats), never as a continuous visual pulse
- **Decorative horizontal bars / rules / divider lines** — animated accent bars under headlines, metric progress-bar tracks, `borderBottom` hairlines between rows, vertical divider strokes between logo/stat groups. User verdict 2026-07-04: "我不喜欢那些横杠杠". Group with spacing and weight hierarchy instead; a real number (9/10) says more than a filled track
- **Symbol/dingbat decoration rows** — star-rating glyphs, sparkles, diamonds, any repeated icon strip used as ornament. User verdict 2026-07-04: "symbols之类的 (不要)". Ratings become numeric text; grouping becomes whitespace
- **Brand-native exception for the two bans above**: these ban *decorative defaults*, not brand truth. If the brand's own site verifiably uses hairlines or symbol marks as its design language (screenshot evidence, not vibes), reproducing that language is Law-4 real-asset fidelity, not a violation — cite the evidence in the act header comment. A star baked inside a product screenshot is always fine; a star you *drew* needs the brand to have drawn it first
- **Text overlaid on a full-bleed motion asset** — when a real motion graphic (product film, app showcase video) plays full-screen, it IS the statement; no headline on top. User verdict 2026-07-04: "动效图上面就不要字了 因为那个是全屏". Either full-bleed textless, or contained in a panel with type outside — never both at once
- Two adjacent beats sharing the same visual formula (e.g. "map + arcs" twice in a row) — each beat gets its own world; see composition diversity in composition.md

**The test:** Show this video and say "AI made this." Would they believe immediately? If yes, redesign.

**高级 ≠ 复杂 (用户原话 2026-07-04)：** "我们的品味是高级的 不是复杂的"。加东西前先问减什么——烘焙底纹、多余粒子、装饰性纹理都是复杂不是高级。逐帧眯眼看：任何"说不清为什么在那"的像素都该消失。

This list bans *elements*. Whole-frame composition slop (hub-and-spoke pill diagrams, hollow-card triptychs, centered-object voids, the eternal spring+shimmer open) is banned — with named replacements — in [composition.md](composition.md) → SLOP BLACKLIST.

## Enterprise-Grade Taste Pillars

- **Credibility over cleverness.** Enterprise viewers forgive restraint faster than gimmicks.
- **Product reality over decorative abstraction.** If the product is real, let the product carry the persuasion.
- **Density must feel intentional.** High density is fine when it reads as system confidence, not clutter.
- **Whitespace is structure.** Empty space should create order, not just breathing room.
- **One frame, one argument.** A scene should be able to say one thing cleanly.
- **No reflex defaults.** The first "nice-looking" answer is usually the template trap, not the right answer.
- **Headline then interface, not headline over interface.** Dense product scenes should not be buried under marketing chrome.

## Archetype Signals

Use [archetypes.md](archetypes.md) as a taste dial, not a brand copier.

- **Financial Precision:** depth, polish, disciplined luxury
- **System Clarity:** ruthless alignment, compressed waste, operational calm
- **Editorial Minimalism:** typographic confidence, large breathing zones, fewer objects
- **Infra Authority:** proof-heavy composition, technical seriousness, no ornamental drift
- **Productive Warmth:** approachable but ordered, humane without losing discipline

## Design Cognitive Principles

- **One focal point per frame.** Supporting elements recede. Eye travels: hero → detail → ambient.
- **Hierarchy must win by two.** Let the hero dominate by at least two of size, contrast, position, or weight.
- **Subtraction default.** When wrong, REMOVE before adding. Fight the "add more" instinct.
- **Constraint worship.** Fixed grid. Consistent spacing. Limited palette. No "feels about right."
- **Specificity over vibes.** "Clean, modern" is NOT a design decision. Name the font, spacing, radius, shadow.
- **Empathy as simulation.** Watch at 1x as a VIEWER. Note every moment you lose focus — those are bugs.
- **Act variation matters.** If two acts share the same compositional skeleton, one of them is probably lazy.

## UX Laws for Video

- **Von Restorff:** The ONE different element gets noticed. In a grid, make the hero card slightly larger/different.
- **Proximity = grouping:** 8px gap = related. 24px gap = separate. Uniform spacing = no relationships.
- **Peak-End Rule:** Viewers remember Act 3 peak + Act 5 ending most. Invest disproportionate polish there.
- **Serial Position:** First and last items remembered best. Strongest feature first, best stat first.
- **Miller's Chunking:** Don't show 12 stats — group into 3 cards of 4. Chunked data is scannable.

## The Squint Test

Blur your eyes at each frame. Can you identify: the most important element? The second? Clear groupings? If everything looks same weight, hierarchy is broken. Build through size + weight + color + position simultaneously.

## Anti-Attractor Discipline

Before polishing, name the model's reflex default for the current scene:

- purple reflex
- card stack crutch
- inter everywhere
- generic AI output
- template layout

Then answer:

1. Why is that default wrong for this brand?
2. Which real brand fact forces a better composition?
3. What is the sharper alternative?

If you cannot answer these, you are still designing from monoculture.

## Scene Self-Review Checklist

Before finalizing ANY scene:
1. **Squint test:** Blur eyes. Is #1 focal point obvious?
2. **First impression:** Look 1 second, look away. Can you name the hero element?
3. **AI slop test:** Would someone believe "AI made this" immediately?
4. **Remove test:** Cover each element. Does the scene improve? If yes, delete it.
5. **3-second test:** Can a viewer understand in 3 seconds?
6. **Font size test:** Render at 1080p, step back 1 meter. Can you read everything?
7. **Motion test:** Does every animation have purpose? If it just "looks cool," cut it.
8. **Brand test:** Could this scene still work if I removed the logo and gave it to another SaaS company? If yes, it is too generic.
9. **Evidence test:** Is the most persuasive thing in the frame a real product reality or just design theater?
10. **Template trap test:** Did I already use this exact scene posture elsewhere in the cut?
11. **Whitespace test:** Is the frame calm, or is it suffering from whitespace starvation?
12. **Headline clutter test:** Would the UI read better if the headline had its own frame?

## Coherence Checks

- **Aesthetic + Motion:** Minimal aesthetic → subtle motion. Playful → springy.
- **Color + Content:** Dashboards = cool/functional. Brand scenes = warmer.
- **Density + Pacing:** Dense UI → longer hold (90+ frames). Sparse lockup → shorter (60-80).
- **Typography + Hierarchy:** Most important text = largest AND highest contrast.

## Negative Space Is Luxury

Premium videos are 40% empty space. Headlines: 80%+ empty. UI demos: generous padding (60-80px). Filling every pixel signals desperation. If you squint and see noise, remove until you see calm.

## Pacing: Let Content Breathe

40 seconds is better than 30 seconds of rushing. Each scene needs:
- **Entrance:** 15-20 frames for spring animation
- **Hold:** 80-120 frames to absorb the content
- **Exit:** 10-15 frames fade

If the viewer can't read the text before it transitions, the scene is too short. Better to cut a feature than rush four.

## Impeccable Anti-Monoculture Principle

Before finalizing a scene, identify the model's most likely lazy solution:

- What would a generic AI launch-video template do here?
- Why is that wrong for this brand?
- Which brand fact forces a better answer?

Use [finish-gate.md](finish-gate.md) to formalize the final rejection and replacement.

Reject these phrases internally because they hide weak judgment:

- `looks premium enough`
- `feels modern`
- `clean startup vibe`
- `probably fine`
- `visually interesting`

Replace them with specific decisions about typography, density, contrast, proof, and brand fidelity.

## Automatic Readability & Watchability Audit (MANDATORY Step 4.5)

After building all scenes and BEFORE final render, run this self-audit automatically. Do NOT skip.

### Reading Time Validation

For every text element in the video, calculate if it's on screen long enough to be read:

```
Reading time (frames) = word_count × 10 frames/word (at 30fps ≈ 0.33s/word)
Minimum visible frames = reading_time × 1.5 (breathing room)
```

**Audit each scene programmatically by reading the code:**

| Element Type | Minimum Hold (frames) | Minimum Hold (seconds) |
|---|---|---|
| Logo animation | 90f | 3s |
| Headline (3-5 words) | 60f | 2s |
| Subtitle (8-15 words) | 90f | 3s |
| UI mockup (dense) | 120f | 4s |
| Product screenshot | 90f | 3s |
| Data dashboard | 120f | 4s |
| CTA / close | 90f | 3s |
| Typing animation | text.length / speed + 30f buffer | varies |

### How to Audit

After writing all scenes, scan every `Sequence` `durationInFrames` and compare against the content inside:

```
AUDIT CHECKLIST (run mentally for each scene):
1. Count words in all visible text
2. Calculate minimum reading time
3. Compare against Sequence durationInFrames
4. If duration < minimum → EXTEND the sequence
5. Check typing animations finish before scene ends (charCount reaches text.length)
6. Verify no text appears in the last 15 frames (too late to read before transition)
```

### Auto-Fix Rules

- **Scene too short for text:** Extend `durationInFrames`, reduce total acts if needed
- **Typing doesn't finish:** Increase `speed` parameter or extend scene
- **Text appears too late:** Reduce `delay` parameter
- **Too many features rushed:** Cut the weakest feature, give remaining ones more time
- **UI mockup flashes by:** Minimum 4s (120f) for any dense UI
- **SplitText/stagger not done before fade:** `delay + charCount × staggerFrames + 45f < durationInFrames`
- **Animation still playing when scene cuts:** BLOCKING — extend scene or speed up animation

### Font Size Validation

- Minimum 28px for ANY text in the video (tested at 1080p)
- Headlines: 64-88px
- Body text: 24-28px
- Labels/captions: 24px minimum
- If text is smaller than 24px at 1920x1080, it WILL be unreadable on mobile

**NEVER ship a video without running this audit.** If any scene fails, fix it before rendering.
