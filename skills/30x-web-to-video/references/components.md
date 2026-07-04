# Visual Components

Reusable visual components for premium Remotion videos. Copy into your project's `components/` directory.

## HARD RULES

1. **lucide-react for all icons.** Never use emoji. Import and render as React components.
2. **No circle pulse / breathing rings.** Use GradientMesh, SVG path-draw, or masked reveals.
3. **Colors from scraped brand site.** Never invent. Always extract from the real page first.

## GradientMesh — Animated Gradient Background

Replaces FluidBackground with a more sophisticated multi-stop gradient that drifts:

```tsx
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface GradientMeshProps {
  colors: [string, string];
  speed?: number;
  opacity?: number;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({
  colors, speed = 150, opacity = 0.12,
}) => {
  const frame = useCurrentFrame();

  // Three anchor points that drift independently
  const x1 = interpolate(Math.sin(frame / speed), [-1, 1], [20, 50]);
  const y1 = interpolate(Math.cos(frame / (speed * 0.8)), [-1, 1], [10, 40]);
  const x2 = interpolate(Math.sin(frame / (speed * 1.2) + 1.5), [-1, 1], [50, 80]);
  const y2 = interpolate(Math.cos(frame / (speed * 0.6) + 0.8), [-1, 1], [60, 90]);
  const x3 = interpolate(Math.sin(frame / (speed * 0.9) + 3), [-1, 1], [30, 70]);
  const y3 = interpolate(Math.cos(frame / (speed * 1.1) + 2), [-1, 1], [40, 80]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: "-50%", width: "200%", height: "200%",
        background: `
          radial-gradient(ellipse 600px 600px at ${x1}% ${y1}%, ${colors[0]}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%),
          radial-gradient(ellipse 500px 500px at ${x2}% ${y2}%, ${colors[1]}${Math.round(opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%),
          radial-gradient(ellipse 400px 400px at ${x3}% ${y3}%, ${colors[0]}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)
        `,
        filter: "blur(60px)",
      }} />
    </div>
  );
};
```

## GlassPanel — Frosted Glass Card

```tsx
import React from "react";

interface GlassPanelProps {
  children: React.ReactNode;
  padding?: number;
  borderRadius?: number;
  blur?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children, padding = 40, borderRadius = 24,
  blur = 20, opacity = 0.06, style,
}) => (
  <div style={{
    background: `linear-gradient(135deg, rgba(255,255,255,${opacity}), rgba(255,255,255,${opacity * 0.15}))`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    borderRadius,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.37)",
    padding,
    ...style,
  }}>
    {children}
  </div>
);
```

## GridOverlay — Subtle Grid Pattern

```tsx
import React from "react";

export const GridOverlay: React.FC<{
  size?: number;
  opacity?: number;
  color?: string;
}> = ({ size = 40, opacity = 0.04, color = "white" }) => (
  <div style={{
    position: "absolute", inset: 0,
    backgroundImage: `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `,
    backgroundSize: `${size}px ${size}px`,
    opacity,
    pointerEvents: "none",
  }} />
);
```

## BrandIcon — lucide-react in Branded Container

```tsx
import React from "react";
import { type LucideIcon } from "lucide-react";

interface BrandIconProps {
  icon: LucideIcon;
  color: string;
  size?: number;
  containerSize?: number;
  borderRadius?: number;
}

export const BrandIcon: React.FC<BrandIconProps> = ({
  icon: Icon, color, size = 32, containerSize = 64, borderRadius = 16,
}) => (
  <div style={{
    width: containerSize, height: containerSize,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: `${color}12`,
    border: `1px solid ${color}20`,
    borderRadius,
  }}>
    <Icon size={size} color={color} strokeWidth={1.5} />
  </div>
);
```

Usage:

```tsx
import { Brain, Zap, Shield, Eye, Wrench, Rocket, Sparkles, Globe, Lock, BarChart3 } from "lucide-react";
import { BrandIcon } from "./Icons";

// In a feature card
<BrandIcon icon={Brain} color={theme.color.primary} />
<BrandIcon icon={Zap} color={theme.color.accent} size={48} containerSize={80} />

// Common icon mappings for tech products:
// AI/ML: Brain, Sparkles        Speed/Perf: Zap, Gauge
// Security: Shield, Lock         Vision: Eye, ScanEye
// Tools/API: Wrench, Code2       Launch: Rocket, ArrowUpRight
// Data: BarChart3, TrendingUp    Global: Globe, Network
```

## GradientBar — Brand Gradient Accent

```tsx
import React from "react";

export const GradientBar: React.FC<{
  colors: string[];
  height?: number;
  position?: "top" | "bottom";
}> = ({ colors, height = 4, position = "top" }) => (
  <div style={{
    position: "absolute",
    left: 0, right: 0,
    [position]: 0,
    height,
    background: `linear-gradient(90deg, ${colors.join(", ")})`,
  }} />
);
```

## GradientText — Headline with Brand Gradient

```tsx
import React from "react";

export const GradientText: React.FC<{
  children: React.ReactNode;
  colors: [string, string];
  angle?: number;
  style?: React.CSSProperties;
}> = ({ children, colors, angle = 135, style }) => (
  <span style={{
    background: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]})`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    ...style,
  }}>
    {children}
  </span>
);
```

## ProductFrame — Screenshot in Perspective

```tsx
import React from "react";
import { Img, staticFile } from "remotion";

export const ProductFrame: React.FC<{
  src: string;
  shadow?: boolean;
  perspective?: number;
  rotateY?: number;
}> = ({ src, shadow = true, perspective = 1200, rotateY = -8 }) => (
  <div style={{
    perspective,
    display: "flex", justifyContent: "center",
  }}>
    <Img src={staticFile(src)} style={{
      maxWidth: "100%",
      borderRadius: 16,
      transform: `rotateY(${rotateY}deg)`,
      boxShadow: shadow
        ? "0 24px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2)"
        : "none",
    }} />
  </div>
);
```

## Layouts

### CenteredLayout

```tsx
import React from "react";

export const CenteredLayout: React.FC<{
  children: React.ReactNode;
  maxWidth?: number;
  gap?: number;
}> = ({ children, maxWidth = 1200, gap = 24 }) => (
  <div style={{
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap, padding: 80,
  }}>
    <div style={{ maxWidth, width: "100%", textAlign: "center" }}>
      {children}
    </div>
  </div>
);
```

### SplitLayout — Media + Text Side-by-Side

```tsx
import React from "react";

export const SplitLayout: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: number;
  gap?: number;
}> = ({ left, right, ratio = 0.5, gap = 60 }) => (
  <div style={{
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center",
    padding: 80, gap,
  }}>
    <div style={{ flex: `0 0 ${ratio * 100}%` }}>{left}</div>
    <div style={{ flex: 1 }}>{right}</div>
  </div>
);
```

## iOS Notification Overlay (for demo videos)

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const NotificationOverlay: React.FC<{
  text: string;
  startSec: number;
  endSec: number;
  icon?: React.ReactNode;
  width?: string;
}> = ({ text, startSec, endSec, icon, width = "38%" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const dur = endSec - startSec;
  const t = sec - startSec;

  if (sec < startSec || sec > endSec) return null;

  const slideIn = interpolate(t, [0, 0.4], [-120, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const slideOut = interpolate(t, [dur - 0.4, dur], [0, -120], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute", top: 16, left: 16,
      width, transform: `translateY(${slideIn + slideOut}px)`,
      background: "linear-gradient(135deg, #2a2a2e 0%, #1c1c1e 100%)",
      borderRadius: 16, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {icon}
      <span style={{
        color: "white", fontSize: 26, fontWeight: 500,
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {text}
      </span>
    </div>
  );
};
```

## Transition Presets

```tsx
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { springTiming, linearTiming } from "@remotion/transitions";

export const transitions = {
  slideLeft:  { presentation: slide({ direction: "from-left" }),   timing: springTiming({ config: { damping: 100 } }) },
  slideRight: { presentation: slide({ direction: "from-right" }),  timing: springTiming({ config: { damping: 100 } }) },
  slideUp:    { presentation: slide({ direction: "from-bottom" }), timing: springTiming({ config: { damping: 100 } }) },
  fade:       { presentation: fade(), timing: linearTiming({ durationInFrames: 30 }) },
  quickFade:  { presentation: fade(), timing: linearTiming({ durationInFrames: 15 }) },
};
```

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
