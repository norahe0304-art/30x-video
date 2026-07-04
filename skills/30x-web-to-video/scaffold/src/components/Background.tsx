/**
 * [INPUT]: remotion useCurrentFrame/interpolate/Easing
 * [OUTPUT]: GradientMesh, FilmGrain, Vignette, ColorGrade, GridOverlay
 * [POS]: 视觉氛围层, 被 MainVideo 叠加于所有场景之上
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

// ================================================================
// GradientMesh — 缓慢漂移的渐变光球背景
// ================================================================
export const GradientMesh: React.FC<{
  colors: [string, string];
  speed?: number;
  opacity?: number;
}> = ({ colors, speed = 150, opacity = 0.12 }) => {
  const frame = useCurrentFrame();

  const x1 = interpolate(Math.sin(frame / speed), [-1, 1], [20, 50]);
  const y1 = interpolate(Math.cos(frame / (speed * 0.8)), [-1, 1], [10, 40]);
  const x2 = interpolate(Math.sin(frame / (speed * 1.2) + 1.5), [-1, 1], [50, 80]);
  const y2 = interpolate(Math.cos(frame / (speed * 0.6) + 0.8), [-1, 1], [60, 90]);
  const x3 = interpolate(Math.sin(frame / (speed * 0.9) + 3), [-1, 1], [30, 70]);
  const y3 = interpolate(Math.cos(frame / (speed * 1.1) + 2), [-1, 1], [40, 80]);

  const hex = (o: number) => Math.round(o * 255).toString(16).padStart(2, "0");

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          width: "200%",
          height: "200%",
          background: `
            radial-gradient(ellipse 600px 600px at ${x1}% ${y1}%, ${colors[0]}${hex(opacity)} 0%, transparent 70%),
            radial-gradient(ellipse 500px 500px at ${x2}% ${y2}%, ${colors[1]}${hex(opacity)} 0%, transparent 70%),
            radial-gradient(ellipse 400px 400px at ${x3}% ${y3}%, ${colors[0]}${hex(opacity * 0.6)} 0%, transparent 70%)
          `,
          filter: "blur(60px)",
        }}
      />
    </div>
  );
};

// ================================================================
// FilmGrain — 2-4% 噪声纹理, 去数码感
// ================================================================
export const FilmGrain: React.FC<{ opacity?: number }> = ({
  opacity = 0.03,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame * 1.7);
  const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${seed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `${noiseUrl} 0 0 / 256px 256px repeat`,
        opacity,
        mixBlendMode: "overlay",
        zIndex: 200,
      }}
    />
  );
};

// ================================================================
// Vignette — 径向暗角, 最具性价比的电影感效果
// ================================================================
export const Vignette: React.FC<{ intensity?: number }> = ({
  intensity = 0.4,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: `radial-gradient(ellipse 70% 70% at 50% 50%, transparent 50%, rgba(0,0,0,${intensity}) 100%)`,
      zIndex: 201,
    }}
  />
);

// ================================================================
// ColorGrade — SVG 去饱和滤镜, 电影色彩
// ================================================================
export const ColorGrade: React.FC<{ saturation?: number }> = ({
  saturation = 0.88,
}) => (
  <svg
    style={{
      position: "absolute",
      width: 0,
      height: 0,
      pointerEvents: "none",
    }}
  >
    <defs>
      <filter id="color-grade">
        <feColorMatrix type="saturate" values={String(saturation)} />
      </filter>
    </defs>
  </svg>
);

// ================================================================
// GridOverlay — 微妙网格图案
// ================================================================
export const GridOverlay: React.FC<{
  size?: number;
  opacity?: number;
  color?: string;
}> = ({ size = 40, opacity = 0.04, color = "white" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `
        linear-gradient(${color} 1px, transparent 1px),
        linear-gradient(90deg, ${color} 1px, transparent 1px)
      `,
      backgroundSize: `${size}px ${size}px`,
      opacity,
      pointerEvents: "none",
    }}
  />
);
