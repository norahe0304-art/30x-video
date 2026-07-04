# Cinematic Post-Production

Film grain, glassmorphism, vignette, shimmer sweep, color grading, and render settings.

## Film Grain Overlay (Every Video)

2-4% noise texture for premium non-digital feel.

**RENDER STABILITY WARNING:** The SVG `feTurbulence` approach regenerates noise per frame, which causes Chrome headless OOM on long compositions. Use a **static noise PNG** instead:

```tsx
// PREFERRED: Static noise texture (no per-frame SVG generation)
const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="g"><feTurbulence baseFrequency="0.75" numOctaves="4" seed="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>'
    )}")`,
    backgroundSize: "300px 300px",
    opacity, mixBlendMode: "overlay",
  }} />
);
```

Key difference: **fixed `seed="0"`** — the noise pattern is the same every frame. The slight visual "flicker" of changing grain is not worth the OOM risk. Static grain at 2-3% opacity is indistinguishable from animated grain in a 40s video.

**If render crashes with OOM:** Remove FilmGrain entirely. Vignette alone provides 80% of the cinematic feel. FilmGrain is the first effect to cut.

Light themes: 1-2% opacity, `mixBlendMode: "multiply"`.

## Cinematic Vignette

Radial gradient edge darkening — the single most impactful cinematic effect:

```tsx
<div style={{
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
  zIndex: 100,
}} />
```

- Dark themes: intensity 0.3-0.5
- Light themes: intensity 0.15-0.25
- Add AFTER film grain, as last layer

## Shimmer Sweep

Moving light band on logos, CTAs, glass panels at reveal moments:

```tsx
<div style={{
  position: "absolute", top: 0, bottom: 0, width: 60-80,
  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15-0.25), transparent)",
  transform: `translateX(${interpolate(frame, [start, end], [-80, 320], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  })}px)`,
}} />
```

Max 2-3 shimmers per video. Apply to: logo reveal (Act 2), CTA button (Act 5).

**BANNED on Act1 logo entrance.** The glass-sweep shimmer across the logo in Act1 has become a monoculture tell — every video uses it, and users notice. Act1 logo entrance MUST pick from a different effect each project. See "Logo Entrance Variety" below.

## Logo Entrance Variety (Act1 opener)

Do NOT default to "logo spring in + horizontal shimmer sweep across the mark." Rotate through these, pick one per project:

| Effect | How it reads | Implementation sketch |
|--------|--------------|----------------------|
| **Impact flash + concentric rings** | Logo lands with a bright radial bloom, then 2-3 rings pulse outward | Flash: radial-gradient div with opacity 0→1→0 over 10f at settle frame; rings: 3 absolute-positioned circles with `border`, `width/height` interpolated 360→1100, staggered delays 22/38/54, `mix-blend-mode: screen` for bloom |
| **Iris open** | Mask opens from center outward like a camera aperture | `clip-path: circle(Npx at 50% 50%)` animated from 0 → large; layer over solid bg color |
| **Particle assembly** | Logo assembles from scattered dots/fragments that converge | Pre-compute 20-30 particle start positions; interpolate x/y toward 0 + opacity in |
| **Z-depth punch** | Logo flies in from deep Z, lands with slight over-scale then settles | `transform: scale(3 → 1.05 → 1)` + blur 20px → 0; spring with mass 1.5 |
| **Split reveal** | Logo splits horizontally, halves slide together | Clip top half + bottom half; each slides from ±40px with opacity |
| **Prism refraction** | RGB channels fan out then converge on the logo | Three copies of logo, tinted R/G/B, offset ±15px, converge to 0 offset |
| **Light curtain drop** | Vertical beam of light sweeps down, logo appears behind where the beam passed | Vertical gradient bar translates Y top→bottom, logo opacity keyed to beam position |

**Rule:** Pick ONE per project. Never combine shimmer sweep with any of these — the sweep is the thing users are tired of seeing.

### Reusable component library

All 7 variants ship in the scaffold at `src/components/LogoEntrance.tsx`. You do NOT write these from scratch per project — import and pick:

```tsx
import { LogoEntrance } from "../components/LogoEntrance";

// In Act1Logo.tsx:
<LogoEntrance variant="iris-open" src="brand/logo.svg" size={360} />
```

Valid variants: `"impact-flash" | "iris-open" | "particle-assembly" | "z-depth-punch" | "split-reveal" | "prism-refraction" | "light-curtain"`.

Rotation guidance:
- **impact-flash** — safe default, enterprise / fintech / SaaS
- **iris-open** — media / film / camera / creative tools
- **particle-assembly** — AI / data / ML
- **z-depth-punch** — consumer / gaming / sports
- **split-reveal** — design tools / minimalist brands
- **prism-refraction** — music / video / creative apps
- **light-curtain** — luxury / enterprise / finance

Rule: if the last two projects you built used variant X, pick something other than X. Variety is the requirement, not optimality.

### Why this matters

User feedback (repeated across projects): *"开头的那个像是扫玻璃一样扫logo的特效可以换点别的吧/？他妈的每个视频都是那个"* — the glass-sweep opening has become a visual cliché. Variety is a first-class brand requirement, not a nice-to-have.

## Color Grading via SVG Filter

Subtle desaturation (0.85-0.9) for cinematic feel. Apply to root AbsoluteFill:

```tsx
<svg style={{ position: 'absolute', width: 0, height: 0 }}>
  <defs><filter id="grade">
    <feColorMatrix type="saturate" values="0.88" />
  </filter></defs>
</svg>

// Root: style={{ filter: "url(#color-grade)" }}
```

## Glassmorphism Standard

Consistent glass panel styling:

| Property | Dark Theme | Light Theme |
|----------|-----------|-------------|
| Background | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.03)` |
| Border | `1px solid rgba(255,255,255,0.1)` | `1px solid rgba(0,0,0,0.08)` |
| Blur | `backdropFilter: "blur(12-20px)"` | same |
| Shadow | `0 8px 32px rgba(0,0,0,0.4)` | `0 4px 20px rgba(0,0,0,0.08)` |

## Ken Burns Effect

Static images must NEVER be static:
- Slow zoom: scale 1.0 → 1.08 over display duration
- Slow pan: translateX drift 20-40px
- `Easing.out(Easing.quad)` for natural decel

## Render at Maximum Quality

```bash
npx remotion render --codec h264 --crf 16 --color-space bt709 --image-format png
```

CRF 16-18 (not default 28). `--image-format png` for lossless frames. `--scale 2` for Retina text.
