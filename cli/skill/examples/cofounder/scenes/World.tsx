/**
 * [INPUT]: theme, remotion interpolate/useCurrentFrame
 * [OUTPUT]: PaperWorld — 品牌纸面氛围底座 (点阵纸纹 + 像素 confetti 漂浮 + 光暖角); PixelConfetti 独立可用
 * [POS]: scenes/ 的零真空底座 (composition.md Law 1), 替代深色 Atmosphere — cofounder 是奶油纸面世界
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// ── 确定性伪随机 (无 Math.random — remotion determinism) ──────────
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ── 像素 confetti — 站上 carousel 装饰条的代码化 (蓝/绿碎像素慢漂) ──
export const PixelConfetti: React.FC<{
  count?: number;
  seed?: number;
  band?: [number, number]; // y 范围 (0-1)
  opacity?: number;
}> = ({ count = 26, seed = 7, band = [0.05, 0.95], opacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const cells = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const h1 = hash(i * 3.7 + seed);
        const h2 = hash(i * 9.1 + seed * 2.3);
        const h3 = hash(i * 5.3 + seed * 4.1);
        return {
          x: h1 * 1920,
          y: (band[0] + h2 * (band[1] - band[0])) * 1080,
          size: 6 + Math.round(h3 * 3) * 4,
          drift: 8 + h2 * 22,
          speed: 0.15 + h1 * 0.3,
          color:
            h3 > 0.62
              ? theme.color.accent
              : h3 > 0.24
                ? theme.color.primary
                : theme.color.sun,
          alpha: 0.16 + h2 * 0.3,
        };
      }),
    [count, seed, band],
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.size,
            background: c.color,
            opacity: c.alpha,
            transform: `translate(${Math.sin(frame * 0.02 * c.speed + i) * c.drift}px, ${
              Math.cos(frame * 0.016 * c.speed + i * 2) * c.drift * 0.6
            }px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// ── 纸面世界底座 — 奶油纸 + 点阵 (真产品 canvas 的 dot grid) + 暖角光 ──
export const PaperWorld: React.FC<{
  confetti?: boolean;
  confettiSeed?: number;
  lightX?: number; // 光源水平位置 (0-1), 每幕移动光源
  dotOpacity?: number;
}> = ({ confetti = true, confettiSeed = 7, lightX = 0.72, dotOpacity = 0.5 }) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame * 0.02) * 0.05;
  return (
    <AbsoluteFill style={{ background: theme.color.bg, pointerEvents: "none" }}>
      {/* 暖光源 — 有方向的光, 不是均匀发光 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${900 * breathe}px ${620 * breathe}px at ${
            lightX * 100
          }% 18%, rgba(255,252,240,0.95) 0%, rgba(247,245,239,0) 68%)`,
        }}
      />
      {/* 点阵纸纹 — 产品 org-canvas 的真实底纹 */}
      <AbsoluteFill
        style={{
          opacity: dotOpacity,
          backgroundImage: `radial-gradient(circle, rgba(38,35,35,0.16) 1.6px, transparent 1.6px)`,
          backgroundSize: "44px 44px",
          backgroundPosition: "22px 22px",
        }}
      />
      {/* 底部草色地平微渍 — 世界有地面 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, transparent 82%, rgba(92,168,62,0.07) 100%)`,
        }}
      />
      {confetti ? <PixelConfetti seed={confettiSeed} /> : null}
      {/* 纸面角部收暗 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 140% 120% at 50% 42%, transparent 62%, rgba(38,35,35,0.09) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
