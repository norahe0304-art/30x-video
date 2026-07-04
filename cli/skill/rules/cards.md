# Card Systems

Staggered card grids, interior fill techniques, and animated visual content.

## Staggered Card Entrance

Cards enter with spring + delay offset:

```tsx
const cardPop = spring({
  frame: frame - (12 + i * 6),
  fps: 30,
  config: { damping: 14, stiffness: 60 },
});
// Each card slides up + fades in sequentially
```

Each card: icon, title, data/progress, subtle colored border or shadow.

## Card Body Fill Technique

Empty card interiors kill quality. Fill with SVG visualizations:

| Card Type | Body Content |
|-----------|-------------|
| Image/data | SVG waveform `<path>` with `<linearGradient>` fill (25% top → 0% bottom) |
| Audio | SVG bar chart (24 bars, sin-wave heights, colored per card) |
| Video | Gradient bg, filmstrip, resolution badge, progress indicator |
| Generic | `flex: 1` on visualization div to stretch-fill |

Each card gets its own accent color for variety.

## Card Interiors Must Be Alive

Static gradient + tiny icon = dead card. Animated content per type:

- **Image:** scan line sweeping, or colored pixel grid assembling
- **Audio:** 8-12 oscillating waveform bars via sin/cos
- **Video:** filmstrip frames sliding, or playback progress
- **Code:** faint code lines fading in
- **Document:** thin gray bars staggering in (text lines)
- **3D:** rotating wireframe cube

**Test:** Does the card feel "alive" at 2 seconds? If nothing moves inside, it's broken.

## No Duplicate Animation Patterns

Every animated element must be visually distinct from siblings. Common failure: code card and document card both use "horizontal bars staggering in."

- Bars vs dots vs circles vs grids vs lines vs shapes — never reuse within one view
- If two cards look the same when you squint, one is broken
- Variety makes a grid feel rich. Repetition makes it feel lazy.

## Visual Density ≠ Text Density

Dense UI = VISUAL richness — charts, gradients, colored bars, icons, image previews — NOT text labels everywhere.

- **BAD:** icon + 2 text labels + progress bar = 80% empty void
- **GOOD:** icon + label + large visual preview filling body + progress bar = visually complete

The eye reads empty dark rectangles as "broken" or "loading."
- Text should be ~30% of visual density
- Other 70%: colored backgrounds, SVG, gradients, icons, progress, images

## Cards Are Not Always Required

Spacing and alignment create visual grouping naturally. Don't wrap everything in cards. Never nest cards inside cards (visual noise). Use cards only when content is truly distinct and needs comparison or interaction boundaries.
