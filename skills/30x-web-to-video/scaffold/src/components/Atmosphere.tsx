/**
 * [INPUT]: remotion useCurrentFrame/interpolate; theme 色值由调用方注入
 * [OUTPUT]: Atmosphere (合成氛围底座) + VolumetricLight / GridHorizon / DriftParticles 独立原语
 * [POS]: rules/composition.md Law 1 (零真空法) 的默认实现; MainVideo 根级常驻, 各 act 可单独调参或取用子原语
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { useCurrentFrame } from "remotion";

// ================================================================
// 确定性工具 — 禁 Math.random(), 同帧必须像素一致
// ================================================================
const hash = (n: number) => {
  const x = Math.sin(n * 99.13) * 43758.5453;
  return x - Math.floor(x);
};

const alphaHex = (o: number) =>
  Math.round(Math.max(0, Math.min(1, o)) * 255)
    .toString(16)
    .padStart(2, "0");

// ================================================================
// VolumetricLight — 多层径向体积光, 光有来源和方向, 不是均匀辉光
// ================================================================
export const VolumetricLight: React.FC<{
  primary: string;
  accent?: string;
  /** 0-1, 默认 0.5 */
  intensity?: number;
  /** 主光源位置 (%), 默认下中 — 像地平线后透出的光 */
  x?: number;
  y?: number;
}> = ({ primary, accent, intensity = 0.5, x = 50, y = 78 }) => {
  const frame = useCurrentFrame();
  // 心跳禁令 (taste.md): 亮度只许恒定, 生命感交给位移漂移
  const breathe = 1;
  const driftX = Math.sin(frame / 140) * 6;
  const driftY = Math.cos(frame / 180) * 4;
  const second = accent || primary;
  const a = (base: number) => alphaHex(base * intensity * breathe);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(ellipse 90% 55% at ${x + driftX}% ${y}%, ${primary}${a(0.34)} 0%, ${primary}${a(0.12)} 42%, transparent 72%),
          radial-gradient(ellipse 55% 40% at ${x + driftX}% ${y - 6}%, ${primary}${a(0.22)} 0%, transparent 60%),
          radial-gradient(ellipse 70% 45% at ${(x + 42) % 100}% ${Math.max(0, y - 66)}%, ${second}${a(0.1)} 0%, transparent 65%)
        `,
      }}
    />
  );
};

// ================================================================
// GridHorizon — 等距线框网格地平线, 给画面一个"地面"和"世界"
// ================================================================
export const GridHorizon: React.FC<{
  color: string;
  /** 0-1 网格整体透明度, 默认 0.4 */
  opacity?: number;
  /** 地平线距底部的画面高度占比, 默认 0.42 */
  height?: number;
  /** 网格单元 px, 默认 90 */
  cell?: number;
  /** 网格向观众滚动的速度 (px/frame), 0 = 静止 */
  scroll?: number;
}> = ({ color, opacity = 0.4, height = 0.42, cell = 90, scroll = 0.35 }) => {
  const frame = useCurrentFrame();
  const offset = (frame * scroll) % cell;
  const line = `${color}${alphaHex(0.5)}`;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: `${height * 100}%`,
        pointerEvents: "none",
        opacity,
        overflow: "hidden",
      }}
    >
      {/* 透视地板: rotateX 后的双向线框, 顶部 mask 渐隐进地平线 */}
      <div
        style={{
          position: "absolute",
          left: "-60%",
          right: "-60%",
          top: 0,
          bottom: "-120%",
          background: `
            repeating-linear-gradient(0deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${cell}px),
            repeating-linear-gradient(90deg, ${line} 0px, ${line} 1px, transparent 1px, transparent ${cell}px)
          `,
          backgroundPosition: `0px ${offset}px, 0px 0px`,
          transform: "perspective(900px) rotateX(62deg)",
          transformOrigin: "center top",
          maskImage: "linear-gradient(180deg, transparent 0%, black 26%, black 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 26%, black 100%)",
        }}
      />
      {/* 地平线光缝 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent 8%, ${color}${alphaHex(0.55)} 50%, transparent 92%)`,
          filter: "blur(1px)",
        }}
      />
    </div>
  );
};

// ================================================================
// DriftParticles — 慢漂浮粒子, 是空气不是彩带; 位置/相位全由 hash 播种
// ================================================================
export const DriftParticles: React.FC<{
  color: string;
  /** 粒子数, 默认 26 */
  count?: number;
  /** 0-1 整体透明度, 默认 0.5 */
  opacity?: number;
  seed?: number;
}> = ({ color, count = 26, opacity = 0.5, seed = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      {Array.from({ length: count }, (_, i) => {
        const k = seed * 131 + i;
        const baseX = hash(k + 1) * 100;
        const baseY = hash(k + 2) * 100;
        const size = 1.5 + hash(k + 3) * 3.5;
        const phase = hash(k + 4) * Math.PI * 2;
        const rate = 0.006 + hash(k + 5) * 0.008;
        const dx = Math.sin(frame * rate + phase) * 26;
        const dy = Math.cos(frame * rate * 0.8 + phase * 1.7) * 18;
        const twinkle = 0.45; // 心跳禁令: 粒子不闪烁, 只漂移

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${baseX}%`,
              top: `${baseY}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: twinkle,
              transform: `translate(${dx}px, ${dy}px)`,
              filter: size > 3.5 ? "blur(0.5px)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
};

// ================================================================
// Atmosphere — 合成底座: 体积光 + 网格地平线 + 粒子 (+ 可选 grain)
//
// 默认强度即可用; 各 act 想换气质就调层参数, 绝不许退回裸色底.
// grain 默认 0: MainVideo 根级已叠 FilmGrain, 避免双重噪点.
// ================================================================
export const Atmosphere: React.FC<{
  primary: string;
  accent?: string;
  /** 体积光强度 0-1, 0 关闭 */
  glow?: number;
  /** 光源位置 (%) */
  glowX?: number;
  glowY?: number;
  /** 地平线透明度 0-1, 0 关闭 */
  horizon?: number;
  /** 地平线高度占比 */
  horizonHeight?: number;
  /** 粒子数, 0 关闭 */
  particles?: number;
  /** 噪点透明度, 默认 0 (根级已有 FilmGrain 时勿开) */
  grain?: number;
  seed?: number;
}> = ({
  primary,
  accent,
  glow = 0.5,
  glowX = 50,
  glowY = 78,
  horizon = 0.35,
  horizonHeight = 0.42,
  particles = 26,
  grain = 0,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const grainSeed = Math.floor(frame * 1.7);
  const noiseUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${grainSeed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {horizon > 0 && (
        <GridHorizon color={primary} opacity={horizon} height={horizonHeight} />
      )}
      {glow > 0 && (
        <VolumetricLight primary={primary} accent={accent} intensity={glow} x={glowX} y={glowY} />
      )}
      {particles > 0 && <DriftParticles color={primary} count={particles} seed={seed} />}
      {grain > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `${noiseUrl} 0 0 / 256px 256px repeat`,
            opacity: grain,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
};
