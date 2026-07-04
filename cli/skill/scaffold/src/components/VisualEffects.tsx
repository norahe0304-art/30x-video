/**
 * [INPUT]: remotion useCurrentFrame/spring/interpolate, @remotion/paths, @remotion/noise
 * [OUTPUT]: ConfettiBurst, MorphTransition, MotionBlurWrap, ShimmerSweep, PulseGlow, ParticleField
 * [POS]: 高级视觉效果组件, 补充 Animations.tsx 的动效词汇量
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { noise2D } from "@remotion/noise";
import { evolvePath } from "@remotion/paths";

// ================================================================
// ConfettiBurst — 庆祝/成就时刻的粒子爆发
// 纯数学粒子, 无外部依赖, frame-deterministic
// ================================================================

interface ConfettiParticle {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  shape: "rect" | "circle";
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateParticles(
  count: number,
  colors: string[],
  seed: number,
): ConfettiParticle[] {
  const rng = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: 960 + (rng() - 0.5) * 200,
    y: 540,
    angle: -Math.PI / 2 + (rng() - 0.5) * Math.PI * 0.8,
    speed: 8 + rng() * 16,
    size: 6 + rng() * 10,
    color: colors[Math.floor(rng() * colors.length)],
    rotation: rng() * 360,
    rotSpeed: (rng() - 0.5) * 15,
    shape: rng() > 0.5 ? "rect" : "circle",
  }));
}

export const ConfettiBurst: React.FC<{
  colors: string[];
  count?: number;
  delay?: number;
  duration?: number;
  gravity?: number;
  originX?: number;
  originY?: number;
  seed?: number;
}> = ({
  colors,
  count = 60,
  delay = 0,
  duration = 90,
  gravity = 0.3,
  originX = 960,
  originY = 540,
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - delay;
  const particles = generateParticles(count, colors, seed);

  if (elapsed < 0 || elapsed > duration) return null;

  const fadeOut = interpolate(elapsed, [duration * 0.6, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p, i) => {
        const t = elapsed / 30;
        const px = (p.x - 960 + originX) + Math.cos(p.angle) * p.speed * t * 30;
        const py = (p.y - 540 + originY) + Math.sin(p.angle) * p.speed * t * 30 + gravity * t * t * 900;
        const rot = p.rotation + p.rotSpeed * elapsed;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: p.size,
              height: p.shape === "rect" ? p.size * 0.6 : p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : 2,
              transform: `rotate(${rot}deg)`,
              opacity: fadeOut,
            }}
          />
        );
      })}
    </div>
  );
};

// ================================================================
// MorphTransition — SVG 路径形态变形
// 输入两个 SVG path d 属性, 在 startFrame → endFrame 之间平滑过渡
// ================================================================
export const MorphTransition: React.FC<{
  pathFrom: string;
  pathTo: string;
  startFrame?: number;
  endFrame?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  viewBox?: string;
}> = ({
  pathFrom,
  pathTo,
  startFrame = 0,
  endFrame = 60,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
  width = 200,
  height = 200,
  viewBox = "0 0 24 24",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // We do not depend on flubber here.
  // The component animates the source path and snaps to the target path at completion.
  const visiblePath = progress < 1 ? pathFrom : pathTo;
  const drawState = evolvePath(progress, visiblePath);

  return (
    <svg width={width} height={height} viewBox={viewBox}>
      <path
        d={visiblePath}
        style={drawState}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ================================================================
// PathDraw — SVG 路径绘制动画 (线条逐渐出现)
// ================================================================
export const PathDraw: React.FC<{
  d: string;
  delay?: number;
  duration?: number;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  viewBox?: string;
}> = ({
  d,
  delay = 0,
  duration = 60,
  stroke = "currentColor",
  strokeWidth = 2,
  width = 400,
  height = 300,
  viewBox = "0 0 400 300",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const drawState = evolvePath(progress, d);

  return (
    <svg width={width} height={height} viewBox={viewBox}>
      <path
        d={d}
        style={drawState}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

// ================================================================
// ShimmerSweep — 横向光泽扫过效果 (CTA、Logo)
// ================================================================
export const ShimmerSweep: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  width?: number;
}> = ({
  children,
  delay = 0,
  duration = 40,
  color = "rgba(255,255,255,0.15)",
  width: sweepWidth = 120,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [-sweepWidth, 1920 + sweepWidth], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
      {children}
      {frame >= delay && frame <= delay + duration && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: progress,
            width: sweepWidth,
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

// ================================================================
// PulseGlow — 呼吸脉冲光晕 (Logo 背景, 强调元素)
// ================================================================
export const PulseGlow: React.FC<{
  color: string;
  size?: number;
  speed?: number;
  minOpacity?: number;
  maxOpacity?: number;
}> = ({
  color,
  size = 400,
  speed = 80,
  minOpacity = 0.03,
  maxOpacity = 0.12,
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(
    Math.sin(frame / speed * Math.PI * 2),
    [-1, 1],
    [minOpacity, maxOpacity],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: pulse,
        pointerEvents: "none",
        filter: "blur(40px)",
      }}
    />
  );
};

// ================================================================
// ParticleField — Perlin noise 驱动的有机粒子场
// 用于: 背景氛围, 科技感, 数据流可视化
// ================================================================
export const ParticleField: React.FC<{
  count?: number;
  color?: string;
  speed?: number;
  size?: number;
  spread?: number;
  seed?: string;
}> = ({
  count = 30,
  color = "rgba(255,255,255,0.3)",
  speed = 100,
  size = 4,
  spread = 800,
  seed = "particles",
}) => {
  const frame = useCurrentFrame();

  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      seedX: `${seed}-x-${i}`,
      seedY: `${seed}-y-${i}`,
      baseSize: size * (0.5 + (i % 3) * 0.3),
    }));
  }, [count, seed, size]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p) => {
        const x = 960 + noise2D(p.seedX, frame / speed, 0) * spread;
        const y = 540 + noise2D(p.seedY, 0, frame / speed) * (spread * 0.6);
        const opacity = interpolate(
          noise2D(`${p.seedX}-o`, frame / (speed * 2), 0),
          [-1, 1],
          [0.1, 0.6],
        );

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: p.baseSize,
              height: p.baseSize,
              borderRadius: "50%",
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

// ================================================================
// StaggerReveal — 子元素依次入场的容器 (替代手动 map+delay)
// ================================================================
export const StaggerReveal: React.FC<{
  children: React.ReactNode[];
  delay?: number;
  gap?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  delay = 0,
  gap = 6,
  direction = "up",
  distance = 24,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={style}>
      {React.Children.map(children, (child, i) => {
        const childDelay = delay + i * gap;
        const progress = spring({
          frame: frame - childDelay,
          fps,
          config: { damping: 20, stiffness: 100 },
        });

        const transforms = {
          up: `translateY(${(1 - progress) * distance}px)`,
          down: `translateY(${(1 - progress) * -distance}px)`,
          left: `translateX(${(1 - progress) * distance}px)`,
          right: `translateX(${(1 - progress) * -distance}px)`,
        };

        return (
          <div style={{ opacity: progress, transform: transforms[direction] }}>
            {child}
          </div>
        );
      })}
    </div>
  );
};
