/**
 * [INPUT]: remotion, theme, PaperWorld (PaperAtmosphere/PaperScrap)
 * [OUTPUT]: Act4Proof — 深绿宣言墙: 衬线证言逐行落定 + 红字纸片收束 (官网 CTA 段原文)
 * [POS]: 第四幕 proof; 家族 manifesto-line-stack; 行 onset 吸附 vo4 词时间戳
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, PaperScrap } from "./PaperWorld";

// seq5 有效起点 abs f860; vo4 @ f882:
// Years l22 | Thousands l82 | Intuition l143 | now-you-have-it l198
const LINES: { text: string; at: number }[] = [
  { text: "Years of pattern recognition.", at: 22 },
  { text: "Thousands of ads analyzed.", at: 82 },
  { text: "Intuition you can't teach.", at: 143 },
];

export const Act4Proof: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <PaperAtmosphere
        base={theme.color.greenDeep}
        dust={12}
        dustColor="rgba(252,245,226,0.22)"
        light="rgba(238,191,18,0.16)"
        lightX={30}
        lightY={16}
        seed={5}
      />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 170 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          {LINES.map((line, i) => {
            const p = spring({
              frame: frame - line.at,
              fps: 30,
              config: { damping: 15, stiffness: 110 },
            });
            // 新行到来时旧行退为背景层次
            const next = LINES[i + 1];
            const dim = next
              ? interpolate(frame, [next.at, next.at + 14], [1, 0.42], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : interpolate(frame, [198, 212], [1, 0.42], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
            return (
              <div
                key={i}
                style={{
                  fontFamily: theme.font.heading,
                  fontWeight: 500,
                  fontSize: 88,
                  letterSpacing: -1.8,
                  lineHeight: 1.05,
                  color: theme.color.cream,
                  opacity: p * dim,
                  transform: `translateY(${(1 - p) * 40}px)`,
                }}
              >
                {line.text}
              </div>
            );
          })}

          {/* 收束纸片 — 红字强调, 官网原文 */}
          <div style={{ marginTop: 26 }}>
            <PaperScrap delay={198} rotate={-1.8} padding="24px 54px">
              <span
                style={{
                  fontFamily: theme.font.heading,
                  fontWeight: 500,
                  fontStyle: "italic",
                  fontSize: 92,
                  letterSpacing: -2,
                  color: theme.color.primary,
                  whiteSpace: "nowrap",
                }}
              >
                Now you have it too.
              </span>
            </PaperScrap>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
