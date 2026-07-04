/**
 * [INPUT]: remotion useCurrentFrame/spring/interpolate/Img/staticFile, theme
 * [OUTPUT]: LogoEntrance dispatcher + 7 variant components (ImpactFlash, IrisOpen, ParticleAssembly, ZDepthPunch, SplitReveal, PrismRefraction, LightCurtain)
 * [POS]: Act1 logo opener 的可复用变体库, 替代千篇一律的 shimmer sweep
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { theme } from "../theme";

// ================================================================
// LogoEntrance — 7 种开场动效, 绝对禁止扫光(shimmer sweep)
//
// 用户原话: "他妈的每个视频都是那个"
// 每次新项目必须换一个 variant, 不能默认 impact-flash
//
// 调用方式:
//   <LogoEntrance variant="iris-open" src="brand/logo.svg" size={360} />
//
// variant 选择策略:
//   impact-flash    : 稳健默认, 适合大多数品牌, 庄重有分量
//   iris-open       : 电影感, 适合媒体/影视/相机品牌
//   particle-assembly: 科技感, 适合 AI/data/SaaS
//   z-depth-punch   : 冲击感, 适合 game/sports/消费电子
//   split-reveal    : 极简几何, 适合 design tool / 时尚
//   prism-refraction: 酷炫色散, 适合 creative tool / 音乐
//   light-curtain   : 高级神秘, 适合 enterprise / fintech
// ================================================================

export type LogoEntranceVariant =
  | "impact-flash"
  | "iris-open"
  | "particle-assembly"
  | "z-depth-punch"
  | "split-reveal"
  | "prism-refraction"
  | "light-curtain";

interface LogoEntranceProps {
  variant: LogoEntranceVariant;
  /** Path relative to public/ (e.g. "brand/logo.svg") — passed through staticFile. Pass null/undefined to render a text fallback. */
  src?: string | null;
  /** Text fallback when src is missing */
  fallbackText?: string;
  size?: number;
  /** Accent color for rings/particles/beams. Defaults to theme.color.primary */
  accent?: string;
  /** Solid background color under the effect (used for iris/light-curtain). Defaults to theme.color.bg */
  bg?: string;
}

// ----------------------------------------------------------------
// Shared: logo anchor with spring settle
// ----------------------------------------------------------------

const LogoMark: React.FC<{
  src?: string | null;
  fallbackText?: string;
  size: number;
  transform?: string;
  opacity?: number;
  filter?: string;
}> = ({ src, fallbackText, size, transform, opacity = 1, filter }) => {
  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transform,
    opacity,
    filter,
  };

  if (src) {
    return (
      <div style={wrapperStyle}>
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...wrapperStyle,
        fontFamily: theme.font.heading,
        fontSize: size * 0.28,
        color: theme.color.text,
        letterSpacing: "-0.03em",
      }}
    >
      {fallbackText || "BRAND"}
    </div>
  );
};

// ----------------------------------------------------------------
// 1. Impact Flash + Concentric Rings
// ----------------------------------------------------------------

const ImpactFlash: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = accent || theme.color.primary;

  const settle = spring({ frame, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const scale = interpolate(settle, [0, 1], [0.72, 1]);
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const flashOpacity = interpolate(frame, [14, 22, 34], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ringSpec = [
    { delay: 22, maxSize: size * 2.4, width: 2 },
    { delay: 38, maxSize: size * 3.2, width: 1.5 },
    { delay: 54, maxSize: size * 4.0, width: 1 },
  ];

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* flash bloom */}
      <div
        style={{
          position: "absolute",
          inset: `-${size * 0.8}px`,
          background: `radial-gradient(circle, ${color}aa 0%, ${color}44 30%, transparent 65%)`,
          opacity: flashOpacity,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      {/* concentric rings */}
      {ringSpec.map((ring, i) => {
        const p = interpolate(frame, [ring.delay, ring.delay + 40], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const ringSize = interpolate(p, [0, 1], [size * 0.9, ring.maxSize]);
        const ringOpacity = interpolate(p, [0, 0.3, 1], [0, 0.8, 0]);
        return (
          <div
            key={`ring-${i}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: ringSize,
              height: ringSize,
              marginLeft: -ringSize / 2,
              marginTop: -ringSize / 2,
              borderRadius: "50%",
              border: `${ring.width}px solid ${color}`,
              opacity: ringOpacity,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        );
      })}
      <LogoMark
        src={src}
        fallbackText={fallbackText}
        size={size}
        transform={`scale(${scale})`}
        opacity={opacity}
      />
    </div>
  );
};

// ----------------------------------------------------------------
// 2. Iris Open
// ----------------------------------------------------------------

const IrisOpen: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360, bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cover = bg || theme.color.bg;

  // iris radius grows from 0 to beyond logo
  const irisProgress = spring({ frame, fps, config: { damping: 20, stiffness: 90, mass: 1 } });
  const radius = interpolate(irisProgress, [0, 1], [0, size * 1.4]);
  const logoOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "relative",
        width: size * 2,
        height: size * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LogoMark src={src} fallbackText={fallbackText} size={size} opacity={logoOpacity} />
      {/* cover that opens via circular clip-path */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: cover,
          clipPath: `circle(${Math.max(0, size * 1.4 - radius)}px at 50% 50%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------
// 3. Particle Assembly
// ----------------------------------------------------------------

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ParticleAssembly: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = accent || theme.color.primary;

  const rng = seeded(42);
  const particles = React.useMemo(
    () =>
      Array.from({ length: 36 }, () => {
        const angle = rng() * Math.PI * 2;
        const dist = size * (0.9 + rng() * 1.4);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          delay: Math.floor(rng() * 8),
          dotSize: 4 + rng() * 6,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const logoReveal = interpolate(frame, [32, 50], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {particles.map((p, i) => {
        const travel = spring({
          frame: frame - p.delay,
          fps,
          config: { damping: 18, stiffness: 100, mass: 1 },
        });
        const x = interpolate(travel, [0, 1], [p.x, 0]);
        const y = interpolate(travel, [0, 1], [p.y, 0]);
        const opacity = interpolate(travel, [0, 0.4, 1], [0, 1, 0]);
        return (
          <div
            key={`p-${i}`}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px - ${p.dotSize / 2}px)`,
              top: `calc(50% + ${y}px - ${p.dotSize / 2}px)`,
              width: p.dotSize,
              height: p.dotSize,
              borderRadius: "50%",
              background: color,
              opacity,
              boxShadow: `0 0 ${p.dotSize * 2}px ${color}`,
              pointerEvents: "none",
            }}
          />
        );
      })}
      <LogoMark src={src} fallbackText={fallbackText} size={size} opacity={logoReveal} />
    </div>
  );
};

// ----------------------------------------------------------------
// 4. Z-Depth Punch
// ----------------------------------------------------------------

const ZDepthPunch: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settle = spring({ frame, fps, config: { damping: 11, stiffness: 120, mass: 1.5 } });
  // scale: 3 → overshoot 1.05 → 1 (spring naturally overshoots with these params)
  const scale = interpolate(settle, [0, 1], [3.2, 1]);
  const blur = interpolate(frame, [0, 18], [24, 0], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <LogoMark
      src={src}
      fallbackText={fallbackText}
      size={size}
      transform={`scale(${scale})`}
      opacity={opacity}
      filter={`blur(${blur}px)`}
    />
  );
};

// ----------------------------------------------------------------
// 5. Split Reveal (horizontal halves slide together)
// ----------------------------------------------------------------

const SplitReveal: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360 }) => {
  const frame = useCurrentFrame();

  const p = interpolate(frame, [0, 32], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const offset = interpolate(p, [0, 1], [size * 0.15, 0]);
  const opacity = interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* top half */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: "inset(0 0 50% 0)",
          transform: `translateY(${-offset}px)`,
          opacity,
        }}
      >
        <LogoMark src={src} fallbackText={fallbackText} size={size} />
      </div>
      {/* bottom half */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: "inset(50% 0 0 0)",
          transform: `translateY(${offset}px)`,
          opacity,
        }}
      >
        <LogoMark src={src} fallbackText={fallbackText} size={size} />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// 6. Prism Refraction (RGB channel fan-out then converge)
// ----------------------------------------------------------------

const PrismRefraction: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360 }) => {
  const frame = useCurrentFrame();

  const p = interpolate(frame, [0, 28], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const offset = interpolate(p, [0, 1], [22, 0]);
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const channel = (color: string, dx: number, dy: number) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${dx}px, ${dy}px)`,
        mixBlendMode: "screen",
        filter: `drop-shadow(0 0 0 ${color})`,
        opacity: opacity * 0.8,
      }}
    >
      <LogoMark src={src} fallbackText={fallbackText} size={size} />
    </div>
  );

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {channel("#ff3050", -offset, 0)}
      {channel("#30ff80", offset * 0.5, -offset * 0.3)}
      {channel("#3080ff", offset, 0)}
      {/* crisp final layer on top */}
      <div style={{ position: "absolute", inset: 0, opacity: interpolate(p, [0.6, 1], [0, 1]) }}>
        <LogoMark src={src} fallbackText={fallbackText} size={size} />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// 7. Light Curtain Drop
// ----------------------------------------------------------------

const LightCurtain: React.FC<LogoEntranceProps> = ({ src, fallbackText, size = 360, accent }) => {
  const frame = useCurrentFrame();
  const color = accent || theme.color.primary;

  // beam sweeps from top to bottom over frames 0-30, logo revealed behind beam
  const beamP = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const beamY = interpolate(beamP, [0, 1], [-size * 0.6, size * 1.2]);

  // logo opacity keyed to beam position — appears where beam has passed
  const logoOpacity = interpolate(beamP, [0.15, 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width: size, height: size, overflow: "hidden" }}>
      <LogoMark src={src} fallbackText={fallbackText} size={size} opacity={logoOpacity} />
      {/* vertical light beam */}
      <div
        style={{
          position: "absolute",
          left: -size * 0.1,
          right: -size * 0.1,
          top: beamY,
          height: size * 0.18,
          background: `linear-gradient(180deg, transparent 0%, ${color}dd 50%, transparent 100%)`,
          mixBlendMode: "screen",
          filter: "blur(6px)",
          pointerEvents: "none",
          opacity: interpolate(beamP, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------
// Dispatcher
// ----------------------------------------------------------------

const VARIANTS: Record<LogoEntranceVariant, React.FC<LogoEntranceProps>> = {
  "impact-flash": ImpactFlash,
  "iris-open": IrisOpen,
  "particle-assembly": ParticleAssembly,
  "z-depth-punch": ZDepthPunch,
  "split-reveal": SplitReveal,
  "prism-refraction": PrismRefraction,
  "light-curtain": LightCurtain,
};

export const LogoEntrance: React.FC<LogoEntranceProps> = (props) => {
  const Component = VARIANTS[props.variant];
  if (!Component) {
    // Fail loudly in dev — an unknown variant is a typo, not a fallback case
    throw new Error(
      `LogoEntrance: unknown variant "${props.variant}". ` +
        `Valid: ${Object.keys(VARIANTS).join(", ")}`,
    );
  }
  return <Component {...props} />;
};

export const LOGO_ENTRANCE_VARIANTS = Object.keys(VARIANTS) as LogoEntranceVariant[];
