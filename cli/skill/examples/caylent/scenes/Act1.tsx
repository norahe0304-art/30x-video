/**
 * [INPUT]: remotion 原语, theme, Atmosphere, generated/wordmark-letters (官方字标单字母精灵, 真透明), public/brand/letters/*.png
 * [OUTPUT]: Act1 v4 终版 — 三横条长成绿 E → 字母 tracking-in 凝聚归位 (无旋转, 高级是克制) → 微呼吸 + 背光脉动 (logo 永不静止)
 * [POS]: 第一幕 / logo 揭幕; 逐字滚入被否 ("很丑"), 凝聚版定稿; 单字母精灵真透明
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { WORDMARK_LETTERS, WORDMARK_SRC_H } from "../generated/wordmark-letters";
import { theme } from "../theme";

const MINT = theme.color.primary;

// 字标显示框: 1020 宽居中; 字母精灵坐标 = 裁切系 × S
const WM_W = 1020;
const WM_LEFT = (1920 - WM_W) / 2;
const WM_TOP = 540 - (WORDMARK_SRC_H * (WM_W / 850)) / 2;
const S = WM_W / 850;
const E_INDEX = WORDMARK_LETTERS.findIndex((l) => l.green);
const E_BOX = WORDMARK_LETTERS[E_INDEX];
// 三横条几何: 由 E 精灵盒推导 (贴齐官方字形)
const BAR_X = WM_LEFT + (E_BOX.x + 6) * S;
const BAR_W = (E_BOX.w - 12) * S;
const BAR_H = 26 * S;
const BAR_YS = [WM_TOP + 22 * S, WM_TOP + 63 * S, WM_TOP + 104 * S];

// 右侧点阵波场 — 官网 hero 的粒子波语言 (世界底, 非 logo 部件)
const WAVE_DOTS: Array<{ x: number; y: number; r: number; a: number }> = [];
for (let arc = 0; arc < 14; arc++) {
  const R = 480 + arc * 52;
  for (let k = 0; k < 46; k++) {
    const t = -0.55 + (k / 45) * 1.15;
    const x = 2130 - R * Math.cos(t);
    const y = 540 + R * Math.sin(t) * 1.15;
    if (x < 1180 || x > 1970 || y < -40 || y > 1120) continue;
    WAVE_DOTS.push({ x, y, r: 2 + (arc % 3) * 0.9, a: 0.1 + ((arc * 7 + k * 3) % 5) * 0.05 });
  }
}

export const Act1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const waveIn = interpolate(frame, [10, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // E 位交接: 横条 → E 精灵 1:1 交叉淡切
  const eSwap = interpolate(frame, [66, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 落定后整字标微呼吸 — logo 永不完全静止
  const breathe = 1 + Math.sin(frame / 34) * 0.006;
  const glowPulse = interpolate(Math.sin(frame / 28), [-1, 1], [0.94, 1.06]);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.35} glowX={78} glowY={46} horizon={0.35} particles={26} />

      {/* 点阵波场 — 右缘出血 */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: waveIn }}>
        {WAVE_DOTS.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={MINT} opacity={d.a * (0.5 + 0.5 * Math.sin(frame / 30 + i * 0.13))} />
        ))}
      </svg>

      {/* 字标整体容器 — 呼吸缩放 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${breathe})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* 三横条 → E 位生长 (几何语义: 品牌 mark 就是这三条) */}
        {BAR_YS.map((y, i) => {
          const grow = spring({ frame: frame - (10 + i * 9), fps, config: { damping: 15, stiffness: 90, mass: 0.9 } });
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: BAR_X,
                top: y,
                width: BAR_W,
                height: BAR_H,
                borderRadius: 3,
                background: "#8CC66F",
                transform: `translateX(${(1 - grow) * -420}px) scaleX(${0.2 + grow * 0.8})`,
                transformOrigin: "left center",
                opacity: grow * (1 - eSwap),
                boxShadow: `0 0 ${18 + grow * 14}px ${MINT}55`,
              }}
            />
          );
        })}

        {/* 官方字形逐字滚入 — E 用交接淡入, 其余从下方滚落归位 */}
        {WORDMARK_LETTERS.map((letter, i) => {
          const isE = i === E_INDEX;
          if (isE) {
            return (
              <Img
                key={letter.file}
                src={staticFile(letter.file)}
                style={{
                  position: "absolute",
                  left: WM_LEFT + letter.x * S,
                  top: WM_TOP,
                  width: letter.w * S,
                  opacity: eSwap,
                }}
              />
            );
          }
          // Tracking-in 凝聚: 字母从两侧向 E 无旋转收拢 (高级是克制, 不是杂技)
          const finalX = WM_LEFT + letter.x * S;
          const eCenter = WM_LEFT + (E_BOX.x + E_BOX.w / 2) * S;
          const gather = interpolate(frame, [56, 96], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const spreadX = eCenter + (finalX - eCenter) * 1.22; // 初始向外撑开 22%
          return (
            <Img
              key={letter.file}
              src={staticFile(letter.file)}
              style={{
                position: "absolute",
                left: spreadX + (finalX - spreadX) * gather,
                top: WM_TOP,
                width: letter.w * S,
                opacity: Math.pow(gather, 1.4),
              }}
            />
          );
        })}

        {/* 字标背光 — 随呼吸脉动 */}
        <div
          style={{
            position: "absolute",
            left: WM_LEFT - 120,
            top: WM_TOP - 160,
            width: WM_W + 240,
            height: WORDMARK_SRC_H * S + 320,
            background: `radial-gradient(ellipse 55% 42% at 50% 50%, ${MINT}14 0%, transparent 70%)`,
            opacity: eSwap * glowPulse,
            filter: "blur(30px)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
