# Animation Component Library

Reusable animation components for Remotion videos. Copy into any project's `components/Animations.tsx`.

## FadeIn — Directional Fade with Easing

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children, delay = 0, duration = 30,
  direction = "up", distance = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const translate = {
    up:    `translateY(${(1 - progress) * distance}px)`,
    down:  `translateY(${(1 - progress) * -distance}px)`,
    left:  `translateX(${(1 - progress) * distance}px)`,
    right: `translateX(${(1 - progress) * -distance}px)`,
    none:  "none",
  };

  return (
    <div style={{
      opacity: progress,
      transform: translate[direction],
      willChange: "opacity, transform",
    }}>
      {children}
    </div>
  );
};
```

## ScaleIn — Spring-Based Scale Entrance

```tsx
import { useCurrentFrame, spring, useVideoConfig } from "remotion";

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  to?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children, delay = 0, from = 0, to = 1,
  config = { damping: 16, stiffness: 80, mass: 0.8 },
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config });
  const scale = from + (to - from) * progress;

  return (
    <div style={{
      transform: `scale(${scale})`,
      opacity: progress,
      willChange: "transform, opacity",
    }}>
      {children}
    </div>
  );
};
```

## Typewriter — True Typing (No Reflow)

**CRITICAL:** Never use `text.slice()` — it causes container reflow (width changes per frame), making text appear to slide in from the right instead of typing. Pre-render ALL characters, hide untyped ones with `color: transparent`.

```tsx
import { useCurrentFrame } from "remotion";

export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  speed?: number;       // characters per frame
  cursor?: boolean;
  cursorChar?: string;
  style?: React.CSSProperties;
  visibleColor?: string;
}> = ({
  text, delay = 0, speed = 2, cursor = true,
  cursorChar = "|", style, visibleColor,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - delay);
  const charCount = Math.min(Math.floor(elapsed * speed), text.length);
  const showCursor = cursor && charCount < text.length && frame % 16 < 10;
  const color = visibleColor || style?.color || "inherit";

  return (
    <span style={style}>
      {text.split("").map((char, i) => (
        <span key={i} style={{
          color: i < charCount ? color : "transparent",
        }}>
          {char}
        </span>
      ))}
      {showCursor && (
        <span style={{ color, opacity: 0.6, marginLeft: -2 }}>{cursorChar}</span>
      )}
    </span>
  );
};
```

## CountUp — Animated Number with Easing

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";

interface CountUpProps {
  from?: number;
  to: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}

export const CountUp: React.FC<CountUpProps> = ({
  from = 0, to, delay = 0, duration = 60,
  prefix = "", suffix = "", decimals = 0, style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = from + (to - from) * progress;

  return (
    <span style={style}>
      {prefix}{value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{suffix}
    </span>
  );
};
```

## AnimatedText — Multi-Mode Text Animation

```tsx
import { useCurrentFrame, spring, interpolate, useVideoConfig, Easing } from "remotion";

type AnimMode = "fadeUp" | "typewriter" | "scale" | "slideIn";

interface AnimatedTextProps {
  text: string;
  mode?: AnimMode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text, mode = "fadeUp", delay = 0, duration = 30, style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - delay;

  const animations: Record<AnimMode, React.CSSProperties> = {
    fadeUp: {
      opacity: interpolate(t, [0, duration], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      }),
      transform: `translateY(${interpolate(t, [0, duration], [40, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })}px)`,
    },
    typewriter: {
      clipPath: `inset(0 ${interpolate(t, [0, duration], [100, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })}% 0 0)`,
    },
    scale: (() => {
      const s = spring({ frame: t, fps, config: { damping: 14, stiffness: 100 } });
      return { transform: `scale(${s})`, opacity: s };
    })(),
    slideIn: {
      transform: `translateX(${interpolate(t, [0, duration], [-100, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      })}px)`,
      opacity: interpolate(t, [0, duration * 0.4], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      }),
    },
  };

  return <div style={{ ...style, ...animations[mode] }}>{text}</div>;
};
```

## AnimatedPath — SVG Self-Drawing with Glow

Requires `@remotion/paths`:

```tsx
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { evolvePath } from "@remotion/paths";

interface AnimatedPathProps {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  duration?: number;
  glow?: boolean;
  glowColor?: string;
}

export const AnimatedPath: React.FC<AnimatedPathProps> = ({
  d, stroke = "#20A1A7", strokeWidth = 2,
  delay = 0, duration = 60, glow = true, glowColor,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const evolved = evolvePath(progress, d);

  return (
    <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {glow && (
        <defs>
          <filter id="pathGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
      )}
      <path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={evolved.strokeDasharray}
        strokeDashoffset={evolved.strokeDashoffset}
        filter={glow ? "url(#pathGlow)" : undefined}
        style={{ filter: glow ? `drop-shadow(0 0 6px ${glowColor || stroke})` : undefined }}
      />
    </svg>
  );
};
```

## Stagger Pattern — Coordinating Multiple Animations

```tsx
const STAGGER = 8; // frames between each element

const items = ["Feature A", "Feature B", "Feature C"];

<>
  {items.map((item, i) => (
    <FadeIn key={i} delay={BASE_DELAY + i * STAGGER} direction="up" distance={20}>
      <FeatureCard title={item} />
    </FadeIn>
  ))}
</>
```

## SplitText — Per-Character Stagger (Premium Headlines)

Headlines must NEVER fade in as a block. Split into characters with spring stagger:

```tsx
import React from "react";
import { useCurrentFrame, spring } from "remotion";

interface SplitTextProps {
  text: string;
  delay?: number;
  staggerFrames?: number;
  distance?: number;
  style?: React.CSSProperties;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text, delay = 0, staggerFrames = 2, distance = 20, style,
}) => {
  const frame = useCurrentFrame();

  return (
    <span style={{ display: "flex", flexWrap: "wrap", ...style }}>
      {text.split("").map((char, i) => {
        const charDelay = delay + i * staggerFrames;
        const progress = spring({
          frame: frame - charDelay, fps: 30,
          config: { damping: 20, stiffness: 100 },
        });
        return (
          <span key={i} style={{
            opacity: progress,
            transform: `translateY(${(1 - progress) * distance}px)`,
            display: "inline-block",
            minWidth: char === " " ? "0.3em" : undefined,
          }}>
            {char}
          </span>
        );
      })}
    </span>
  );
};
```

## SplitWords — Per-Word Stagger (Subtitles)

For subtitles where per-character is too slow:

```tsx
export const SplitWords: React.FC<{
  text: string;
  delay?: number;
  staggerFrames?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, staggerFrames = 4, style }) => {
  const frame = useCurrentFrame();

  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: "0.3em", ...style }}>
      {text.split(" ").map((word, i) => {
        const wordDelay = delay + i * staggerFrames;
        const progress = spring({
          frame: frame - wordDelay, fps: 30,
          config: { damping: 18, stiffness: 90 },
        });
        return (
          <span key={i} style={{
            opacity: progress,
            transform: `translateY(${(1 - progress) * 15}px)`,
            display: "inline-block",
          }}>
            {word}
          </span>
        );
      })}
    </span>
  );
};
```

## FilmGrain — Noise Texture Overlay

Every premium video needs 2-4% grain:

```tsx
import React from "react";
import { useCurrentFrame } from "remotion";

export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame * 1.7); // different noise per frame

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${seed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      opacity,
      mixBlendMode: "overlay",
    }} />
  );
};
```

## MaskedReveal — Clip-Path Wipe Transition

```tsx
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export const MaskedReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "left" | "right" | "up" | "down";
}> = ({ children, delay = 0, duration = 30, direction = "left" }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 100], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const clipPaths: Record<string, string> = {
    left:  `inset(0 ${100 - progress}% 0 0)`,
    right: `inset(0 0 0 ${100 - progress}%)`,
    up:    `inset(${100 - progress}% 0 0 0)`,
    down:  `inset(0 0 ${100 - progress}% 0)`,
  };

  return (
    <div style={{ clipPath: clipPaths[direction] }}>
      {children}
    </div>
  );
};
```

## AnimatedPath — SVG Self-Drawing with Glow

Uses strokeDasharray/strokeDashoffset for path reveal animation:

```tsx
export const AnimatedPath: React.FC<{
  d: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
  duration?: number;
  width?: number;
  height?: number;
  viewBox?: string;
}> = ({
  d, stroke = "#10A37F", strokeWidth = 2,
  delay = 0, duration = 60,
  width = 400, height = 400, viewBox = "0 0 400 400",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const pathLen = 2000;
  const dashOffset = pathLen * (1 - progress);

  return (
    <svg width={width} height={height} viewBox={viewBox}
      style={{ position: "absolute", overflow: "visible" }}>
      <defs>
        <filter id="pathGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={pathLen} strokeDashoffset={dashOffset}
        filter="url(#pathGlow)"
        style={{ filter: `drop-shadow(0 0 6px ${stroke}40)` }} />
    </svg>
  );
};
```

## FloatingOrb — Drifting Gradient Sphere Accent

Ambient decoration behind content. Use at 4-8% opacity for subtle depth:

```tsx
export const FloatingOrb: React.FC<{
  color: string; size?: number;
  x?: number; y?: number; speed?: number; opacity?: number;
}> = ({ color, size = 200, x = 0, y = 0, speed = 120, opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  const dx = interpolate(Math.sin(frame / speed), [-1, 1], [-30, 30]);
  const dy = interpolate(Math.cos(frame / (speed * 0.7)), [-1, 1], [-20, 20]);
  const scale = interpolate(Math.sin(frame / (speed * 1.5)), [-1, 1], [0.9, 1.1]);

  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity,
      transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
      filter: "blur(40px)", pointerEvents: "none",
    }} />
  );
};
```

## CSS ParticleField — Converging Dots (Lottie Alternative)

When premium Lottie files aren't available, this CSS-based system looks better than placeholder JSON:

```tsx
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const radius = 200 + (i % 3) * 80;
  return {
    startX: Math.cos(angle) * radius,
    startY: Math.sin(angle) * radius,
    size: 3 + (i % 4) * 2,
    delay: i * 3,
    opacity: 0.15 + (i % 3) * 0.1,
  };
});

const ParticleField: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {PARTICLES.map((p, i) => {
        const progress = interpolate(frame - p.delay, [0, 50], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const x = p.startX * (1 - progress);
        const y = p.startY * (1 - progress);
        return (
          <div key={i} style={{
            position: "absolute", left: "50%", top: "50%",
            width: p.size, height: p.size, borderRadius: "50%",
            background: accentColor,
            opacity: p.opacity * progress,
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            boxShadow: `0 0 ${p.size * 3}px ${accentColor}40`,
          }} />
        );
      })}
    </>
  );
};
```

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
