# Scene Transitions & Atmospheric Effects

TransitionSeries, light leaks, fluid backgrounds, noise textures, and parallax.

## TransitionSeries (Required)

NEVER use plain `Sequence` hard-cuts between acts:

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={180}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 12 })}
  />
  <TransitionSeries.Sequence durationInFrames={180}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

- 12-frame fade transitions between acts
- Available: `fade()`, `slide({ direction })`, `wipe()`, `flip()`, `clockWipe()`
- Transitions OVERLAP adjacent scenes: `total = sum(durations) - sum(transitionDurations)`

## Light Leak Overlays

`@remotion/light-leaks` between key transitions:

```tsx
<TransitionSeries.Overlay durationInFrames={30}>
  <LightLeak seed={3} hueShift={120} />
</TransitionSeries.Overlay>
```

- `hueShift`: 0=yellow-orange, 120=green, 240=blue → match brand accent
- Use between Act 1→2 and Act 4→5 (max 2-3 per video)
- Overlay does NOT shorten timeline
- Cannot be adjacent to another Overlay or Transition

## Fluid Breathing Background

Replace static backgrounds with slow-breathing gradient orbs:

```tsx
const ambientX = interpolate(Math.sin(frame / 120), [-1, 1], [-400, 400]);
const ambientY = interpolate(Math.cos(frame / 100), [-1, 1], [-200, 200]);
// Two large blurred orbs (1200-1600px) at 8-10% opacity
// Brand accent + complementary color, blur: 200px, borderRadius: 50%
```

More elegant than blurred screenshots. Creates LIVING atmospheric motion.

## Noise-Driven Textures (Optional)

```tsx
import { noise3D } from "@remotion/noise";
const dx = noise3D("x", px, py, frame * 0.01) * maxOffset;
```

Creates floating dot grids, organic wave surfaces. More natural than sin/cos.

## Parallax Depth (Optional)

- Background: moves at 0.3x speed (slow, distant)
- Midground (UI): moves at 1x (normal)
- Foreground (particles): moves at 1.5x (fast, close)

Even 10-20px offset creates perceived depth.


## 自定义转场家族 (2026-07-04 还债)

scaffold `src/components/Transitions.tsx` 提供 7 个与 `fade()` 同位替换的 presentation：whipPan / maskWipe / push / zoomPunch / blurDissolve / flashThrough / glitchCut，选型指南在文件头注释。**整片只用 fade = 转场贫困，违规。** 每幕切换按叙事能量选型，高能量段落踩拍用 whipPan/flashThrough，章节感用 maskWipe。

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
