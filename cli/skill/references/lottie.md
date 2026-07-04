# Lottie & GSAP Integration

AE-quality animations in Remotion via `@remotion/lottie` and GSAP timeline sync.

## @remotion/lottie — Core Integration

**Install:**
```bash
npm i @remotion/lottie lottie-web
```

**LottieAnimation wrapper component:**

```tsx
import React, { useEffect, useState } from "react";
import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

interface LottieAnimationProps {
  file: string;                    // path relative to public/
  loop?: boolean;
  playbackRate?: number;
  direction?: "forward" | "backward";
  style?: React.CSSProperties;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  file, loop = false, playbackRate = 1, direction = "forward", style,
}) => {
  const [handle] = useState(() => delayRender(`Loading Lottie: ${file}`));
  const [data, setData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(staticFile(file))
      .then(r => r.json())
      .then(json => {
        setData(json);
        continueRender(handle);
      })
      .catch(err => cancelRender(err));
  }, [handle, file]);

  if (!data) return null;

  return (
    <Lottie
      animationData={data}
      loop={loop}
      playbackRate={playbackRate}
      direction={direction}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
};
```

**Usage in scenes:**

```tsx
// Logo reveal with particle animation
<AbsoluteFill>
  <LottieAnimation file="lottie/particle-converge.json" />
</AbsoluteFill>

// Background ambient effect
<div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
  <LottieAnimation file="lottie/aurora-bg.json" loop />
</div>

// Transition between scenes
<Sequence from={transitionStart} durationInFrames={30}>
  <LottieAnimation file="lottie/liquid-wipe.json" playbackRate={1.5} />
</Sequence>
```

## Lottie Props Reference

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `animationData` | object | required | Lottie JSON (memoize with useState) |
| `loop` | boolean | false | Repeat animation |
| `playbackRate` | number | 1 | Speed multiplier |
| `direction` | "forward"/"backward" | "forward" | Play direction |
| `renderer` | "svg"/"canvas"/"html" | "svg" | Render mode (svg = best quality) |
| `style` | CSSProperties | — | Container styling |
| `className` | string | — | Container class |

**Critical:** Always use `delayRender()` / `continueRender()` pattern. Remotion will not wait for async loads otherwise, causing blank frames during render.

## Where to Get Premium Lottie Files

For product launch videos, you need these categories:

**Logo/Reveal animations:**
- LottieFiles marketplace: search "particle converge", "logo reveal", "morphing shapes"
- Creattie.com: artist-made premium animations

**Transition effects:**
- Search "liquid transition", "geometric morph", "light sweep", "glitch"
- These replace hard cuts between scenes

**Data visualization:**
- Search "animated chart", "counter", "graph", "network", "node"
- Use in Proof scene (Act 4) for metric reveals

**Background/Ambient:**
- Search "aurora", "particles floating", "gradient mesh animated", "abstract lines"
- Layer at low opacity (0.2-0.4) behind content

**Tech-specific:**
- "AI brain", "neural network", "code typing", "terminal", "API flow"
- Map to product category

## GSAP Integration (Advanced)

For effects not available in Lottie, use GSAP with paused timeline + seek:

```tsx
import gsap from "gsap";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useEffect, useRef } from "react";

const GsapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline>();

  // Build timeline once
  useEffect(() => {
    if (!ref.current) return;
    tl.current = gsap.timeline({ paused: true })
      .from(ref.current, { x: -200, opacity: 0, duration: 0.8, ease: "power3.out" })
      .to(ref.current, { scale: 1.05, duration: 0.3, ease: "power2.inOut" }, "+=0.2")
      .to(ref.current, { scale: 1, duration: 0.2, ease: "power2.out" });
  }, []);

  // Seek to current frame position
  useEffect(() => {
    tl.current?.seek(frame / fps);
  }, [frame, fps]);

  return <div ref={ref}>Animated Element</div>;
};
```

**When to use GSAP vs Remotion native:**
- GSAP: Complex timeline choreography, MorphSVG, DrawSVG, SplitText (GSAP plugin)
- Remotion: Simple spring/interpolate animations, audio sync, frame-accurate control

**Install:** `npm i gsap` (free core). Premium plugins (MorphSVG, DrawSVG) require GSAP license.

## Rive Integration (Alternative to Lottie)

For interactive/parametric animations:

```bash
npm i @remotion/rive
```

```tsx
import { RemotionRiveCanvas } from "@remotion/rive";
import { staticFile } from "remotion";

<RemotionRiveCanvas
  src={staticFile("animation.riv")}
  fit="contain"
  alignment="center"
/>
```

Rive advantage: state machines, dynamic text, interactive. Use when animation needs to respond to data (e.g., dynamic brand name in animated title).

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
