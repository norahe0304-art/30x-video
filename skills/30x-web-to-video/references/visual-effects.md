# Visual Effects Library Reference

Confirmed-working libraries for advanced visual effects in Remotion videos.

**CRITICAL:** Remotion renders frame-by-frame. Libraries using browser timing APIs (`requestAnimationFrame`, `performance.now()`, CSS transitions) will **flicker or break**. Only use libraries confirmed to work with `useCurrentFrame()`.

## Tier 1: Official Remotion Packages (Install & Use)

### @remotion/lottie — Lottie Animations
```bash
npm i @remotion/lottie lottie-web
```
Play Lottie JSON animations synchronized with timeline. Use for: logo animations, loading spinners, micro-interactions, icon animations, celebration effects.

```tsx
import { Lottie, getLottieMetadata } from "@remotion/lottie";
import animationData from "./animation.json";

const metadata = getLottieMetadata(animationData);

<Lottie
  animationData={animationData}
  playbackRate={1}
  style={{ width: 200, height: 200 }}
/>
```

**Free Lottie sources:**
- LottieFiles: https://lottiefiles.com (largest library)
- LordIcon: https://lordicon.com (animated icons)
- useAnimations: https://useanimations.com (micro-animations)

### @remotion/motion-blur — Film Motion Blur
```bash
npm i @remotion/motion-blur
```
```tsx
import { CameraMotionBlur, Trail } from "@remotion/motion-blur";

// Natural film-camera motion blur
<CameraMotionBlur samples={10}>
  <MyAnimatedScene />
</CameraMotionBlur>

// Trailing duplicates with time offset
<Trail layers={6} lagInFrames={2}>
  <MyMovingElement />
</Trail>
```
Use for: fast-moving elements, scene transitions, premium kinetic feel.

### @remotion/paths — SVG Path Animation
Already in scaffold. Key functions:
```tsx
import { evolvePath, interpolatePath } from "@remotion/paths";

// Line drawing effect (path gradually appears)
const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
const evolved = evolvePath(progress, svgPathData);
<path d={evolved} stroke={color} fill="none" />

// Morph between two SVG shapes
const morphed = interpolatePath(progress, pathA, pathB);
```
Use for: chart line drawing, logo path reveal, icon morphing.

### @remotion/noise — Perlin Noise
Already in scaffold. Use for organic, natural randomness:
```tsx
import { noise2D, noise3D } from "@remotion/noise";

// Floating particle positions
const x = noise2D("seed-x", frame / 100, 0) * 200;
const y = noise2D("seed-y", 0, frame / 100) * 200;
```

## Tier 2: Confirmed Community Libraries

### remotion-confetti — Confetti Bursts
```bash
npm i remotion-confetti
```
Canvas-based confetti. Use for: celebration moments, achievement reveals, proof scene.

### remotion-animated — Declarative Animation Chains
```bash
npm i remotion-animated
```
```tsx
import { Animated, Move, Scale, Fade } from "remotion-animated";

<Animated animations={[
  Move({ y: 0, start: -50 }),
  Scale({ by: 1, initial: 0.8 }),
  Fade({ to: 1 }),
]}>
  <MyComponent />
</Animated>
```
Use for: cleaner animation code, chaining multiple effects.

### Flubber — SVG Shape Morphing
```bash
npm i flubber
```
```tsx
import { interpolate as flubberInterpolate } from "flubber";
const morpher = flubberInterpolate(circlePath, starPath);
const d = morpher(progress); // 0→1
<path d={d} />
```
Use for: icon transitions, shape-shifting logos.

## Tier 3: Advanced (Heavier, Use Sparingly)

### @remotion/three — 3D via React Three Fiber
```bash
npm i three @react-three/fiber @remotion/three @types/three
```
Full 3D: models (GLTF), 3D text, particles, shaders, post-processing.
```tsx
import { ThreeCanvas } from "@remotion/three";
<ThreeCanvas width={1920} height={1080}>
  <mesh><boxGeometry /><meshStandardMaterial /></mesh>
</ThreeCanvas>
```
**Gotchas:** Use `useCurrentFrame()` not R3F's `useFrame()`. `<Sequence layout="none">` inside canvas. Heavy render time.

### @react-three/postprocessing — Bloom, Glitch, Chromatic Aberration
```bash
npm i @react-three/postprocessing postprocessing
```
Works inside `<ThreeCanvas>`. Effects: Bloom, ChromaticAberration, Glitch, DepthOfField, GodRays, Noise, Vignette, Scanlines.

### GL Transitions — 80+ GLSL Transitions
Repo: https://github.com/remotion-dev/remotion-gl-transitions
Collection: https://gl-transitions.com/
Beyond fade: cube rotate, directional wipe, swap, mosaic, pixelize, burn, ripple.

## DO NOT USE (Incompatible)

| Library | Why |
|---------|-----|
| Framer Motion / motion | Uses `performance.now()`, flickers during render |
| react-spring | Conflicts with Remotion's spring(), timing issues |
| tsParticles | Internal animation loop, no frame sync |
| CSS transitions/animations | Not deterministic per-frame |

## Recommended Additions to Scaffold

For maximum visual punch with minimal complexity, add these to every project:
1. `@remotion/lottie` + `lottie-web` — drop-in animated icons/effects
2. `@remotion/motion-blur` — premium kinetic feel on fast animations
3. `remotion-confetti` — celebration/proof moments
4. `flubber` — SVG morphing for transitions

The scaffold already includes: `@remotion/paths`, `@remotion/noise`, `@remotion/transitions`, `@remotion/light-leaks`.
