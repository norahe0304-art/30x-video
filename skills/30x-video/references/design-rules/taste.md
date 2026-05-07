<!--
[INPUT]: Scene drafts, archetype inference, brand context, anti-slop discipline
[OUTPUT]: Anti-AI-slop blacklist + readability/watchability constraints + taste pillars
[POS]: design-rules/ 的核心; 视频品味的总宪法
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Design Taste & Anti-AI-Slop

The hard rules that separate agency-grade videos from AI-template output.

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
- Stock-feel transitions: light leaks, lens flares, fade-to-black between every cut
- Default royalty-free corporate elevator-pitch BGM
- "Discover the future..." style closing voice over
- AI-generated faces that look "almost real but not"
- Fake confetti / particles / motion graphics that signify nothing

**The test:** Show this video and say "AI made this." Would they believe immediately? If yes, redesign.

## Anti-Slop Copy Blacklist

Reject these words/phrases in voice over and on-screen text:

- Elevate / Unleash / Empower / Revolutionize / Transform
- Game-changer / Disrupt / Reimagine
- Best-in-class / Cutting-edge / Next-generation
- Discover / Unlock / Experience the future
- Your all-in-one solution / The only X you'll ever need
- Seamless / Effortless / Frictionless (used as filler)

If a phrase could land in any AI-startup video unchanged, it's not earning its place.

## Taste Pillars

- **Credibility over cleverness.** Viewers forgive restraint faster than gimmicks.
- **Product reality over decorative abstraction.** If the product is real, let the product carry the persuasion.
- **Density must feel intentional.** High density is fine when it reads as system confidence, not clutter.
- **Whitespace is structure.** Empty space should create order, not just breathing room.
- **One frame, one argument.** A scene should be able to say one thing cleanly.
- **No reflex defaults.** The first "nice-looking" answer is usually the template trap, not the right answer.
- **Headline THEN interface, not headline OVER interface.** Dense product scenes should not be buried under marketing chrome.

## Archetype Signals

Use [archetypes.md](archetypes.md) as a taste dial, not a brand copier.

- **Financial Precision:** depth, polish, disciplined luxury
- **System Clarity:** ruthless alignment, compressed waste, operational calm
- **Editorial Minimalism:** typographic confidence, large breathing zones, fewer objects
- **Infra Authority:** proof-heavy composition, technical seriousness, no ornamental drift
- **Productive Warmth:** approachable but ordered, humane without losing discipline

## Cognitive Principles

- **One focal point per frame.** Supporting elements recede. Eye travels: hero → detail → ambient.
- **Hierarchy must win by two.** Let the hero dominate by at least two of size, contrast, position, or weight.
- **Subtraction default.** When wrong, REMOVE before adding. Fight the "add more" instinct.
- **Constraint worship.** Fixed grid. Consistent spacing. Limited palette. No "feels about right."
- **Specificity over vibes.** "Clean, modern" is NOT a design decision. Name the font, spacing, radius, shadow.
- **Empathy as simulation.** Watch at 1x as a VIEWER. Note every moment you lose focus — those are bugs.
- **Act variation matters.** If two scenes share the same compositional skeleton, one is probably lazy.

## UX Laws for Video

- **Von Restorff:** The ONE different element gets noticed. Make the hero card slightly larger/different.
- **Proximity = grouping:** 8px gap = related. 24px gap = separate. Uniform spacing = no relationships.
- **Peak-End Rule:** Viewers remember peak + ending most. Invest disproportionate polish there.
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
- stock transition reflex
- corporate BGM reflex

Then answer:

1. Why is that default wrong for this brand / content?
2. Which real fact forces a better composition?
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
8. **Brand test:** Could this scene still work if I removed the logo and gave it to another brand? If yes, it is too generic.
9. **Evidence test:** Is the most persuasive thing in the frame a real product reality or just design theater?
10. **Template trap test:** Did I already use this exact scene posture elsewhere in the cut?
11. **Whitespace test:** Is the frame calm, or is it suffering from whitespace starvation?
12. **Headline clutter test:** Would the UI read better if the headline had its own frame?

## Coherence Checks

- **Aesthetic + Motion:** Minimal aesthetic → subtle motion. Playful → springy.
- **Color + Content:** Dashboards = cool/functional. Brand scenes = warmer.
- **Density + Pacing:** Dense UI → longer hold (3-4s). Sparse lockup → shorter (2-3s).
- **Typography + Hierarchy:** Most important text = largest AND highest contrast.

## Negative Space Is Luxury

Premium videos are 40% empty space. Headlines: 80%+ empty. UI demos: generous padding. Filling every pixel signals desperation. If you squint and see noise, remove until you see calm.

## Pacing: Let Content Breathe

A 40-second video is better than 30 seconds of rushing. Each scene needs:

- **Entrance:** ~0.5s spring/fade animation
- **Hold:** 2-4s to absorb the content
- **Exit:** ~0.3s fade

If the viewer can't read the text before it transitions, the scene is too short. Better to cut a feature than rush four.

## Reading Time Validation (Mandatory)

For every text element, verify it's on screen long enough to be read:

```
Reading time = word_count × 0.33s/word
Minimum visible = reading_time × 1.5
```

| Element Type | Minimum Hold |
|---|---|
| Logo animation | 3s |
| Headline (3-5 words) | 2s |
| Subtitle (8-15 words) | 3s |
| UI mockup (dense) | 4s |
| Product screenshot | 3s |
| Data dashboard | 4s |
| CTA / close | 3s |

## Font Size Validation

- Minimum 28px for ANY text (tested at 1080p)
- Headlines: 64-88px
- Body text: 24-28px
- Labels/captions: 24px minimum

If text is smaller than 24px at 1920×1080, it WILL be unreadable on mobile.

## Voice Over Pacing

- Target: 140-165 words per minute
- Maximum: 175 wpm (anything faster sounds anxious)
- Pause beats between sentences: 0.4-0.8s
- Final word should land 0.3-0.5s before the visual cuts

## Background Music Discipline

- BGM must duck during VO (-12 to -18 dB under voice)
- Avoid music with strong vocal hooks unless the song IS the message
- Tempo should support pacing: 70-90 bpm for slow-luxury, 100-120 bpm for medium-narrative, 130+ bpm for quick-hook
- Cut on the beat. Hold on the bar. Never let BGM fight transitions.

## Reject These Hedging Phrases

These hide weak judgment. Replace with specific decisions:

- `looks premium enough`
- `feels modern`
- `clean startup vibe`
- `probably fine`
- `visually interesting`

Replace them with specific decisions about typography, density, contrast, proof, and brand fidelity.
