/**
 * [INPUT]: theme, ShaderFX silkNoise 低透明度底, remotion 原语
 * [OUTPUT]: Act2V2 — 动能字排 hook: TURNING IDEAS / TO IMPACT. / FASTER. 逐行砸落 (family: kinetic-type-stack)
 * [POS]: V2 第二幕; 轮换: 实拍出血已用, 本片纯字排世界; VO1 同窗; 零小字
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ShaderPlane } from "../components/ShaderFX";
import { theme } from "../theme";

const MINT = theme.color.primary;
// 行落点错开呼应 VO1 语流 (5.3s 起): 视觉先行半拍
const LINES = [
  { text: "TURNING IDEAS", size: 168, color: theme.color.text, at: 14 },
  { text: "TO IMPACT.", size: 224, color: theme.color.text, at: 40 },
  { text: "FASTER.", size: 288, color: MINT, at: 78 },
] as const;

export const Act2V2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: "#070707" }}>
      <ShaderPlane preset="liquidWarp" colorA={MINT} colorB="#16114F" opacity={0.22} phase={7} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 200,
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        {LINES.map((line) => {
          const slam = spring({ frame: frame - line.at, fps, config: { damping: 14, stiffness: 160, mass: 0.8 } });
          const landed = frame >= line.at;
          return (
            <div
              key={line.text}
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: line.size,
                lineHeight: 0.98,
                letterSpacing: "-0.045em",
                color: line.color,
                opacity: landed ? Math.min(1, slam * 1.4) : 0,
                transform: `scale(${1.5 - slam * 0.5}) translateY(${(1 - slam) * -30}px)`,
                transformOrigin: "left center",
                whiteSpace: "nowrap",
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
      {/* FASTER. 落地时全屏亮度一跳 — 冲击感走光不走圆环 */}
      <AbsoluteFill
        style={{
          background: MINT,
          opacity: interpolate(frame, [78, 82, 94], [0, 0.14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
