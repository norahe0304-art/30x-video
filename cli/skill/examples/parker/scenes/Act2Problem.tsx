/**
 * [INPUT]: remotion, theme, PaperWorld (PaperAtmosphere/PaperScrap)
 * [OUTPUT]: Act2Problem — 紫色棋盘世界 + 纸片拼贴巨字问题陈述 (官网原版视觉直译)
 * [POS]: 第二幕问题; 家族 paper-scrap-collage-type; VO1 句2 词级吸附
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, PaperScrap } from "./PaperWorld";

// 本 seq 有效起点 abs f106。词级对齐 (vo1 @ f39):
// Making f113→local 7 | easy f138→l32 | knowing f163→l57 | hard. f202→l96
export const Act2Problem: React.FC = () => {
  const frame = useCurrentFrame();

  // 红色虚线 + ✗ — 官网"maze"红虚线元素, 在 "hard." 落定后划过
  const dashProgress = interpolate(frame, [104, 126], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashCount = 7;

  // 慢推 — 拼贴墙缓慢逼近
  const push = interpolate(frame, [0, 140], [1, 1.045]);

  return (
    <AbsoluteFill>
      <PaperAtmosphere
        base={theme.color.accent}
        checker={1}
        checkerDark
        dust={12}
        dustColor="rgba(252,245,226,0.3)"
        light="rgba(255,255,255,0.28)"
        lightY={22}
        seed={2}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${push})` }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <PaperScrap delay={7} rotate={-2.4} padding="26px 58px">
            <span
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: 96,
                letterSpacing: -2,
                color: theme.color.ink,
                whiteSpace: "nowrap",
              }}
            >
              Making ads is easy.
            </span>
          </PaperScrap>

          <PaperScrap delay={55} rotate={1.6} padding="26px 58px" style={{ marginLeft: 90 }}>
            <span
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: 96,
                letterSpacing: -2,
                color: theme.color.ink,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: theme.color.primary }}>Knowing</span> what ads
              <br />
              to make is <em>hard.</em>
            </span>
          </PaperScrap>
        </div>

        {/* 红虚线 + ✗ — 一个机器凭证元素 (小字预算内, 非文字) */}
        <div
          style={{
            position: "absolute",
            bottom: 150,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {Array.from({ length: dashCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 9,
                borderRadius: 4,
                background: theme.color.primary,
                opacity: dashProgress * dashCount > i ? 1 : 0,
              }}
            />
          ))}
          <span
            style={{
              fontFamily: theme.font.heading,
              fontSize: 52,
              fontWeight: 600,
              color: theme.color.primary,
              opacity: dashProgress >= 1 ? 1 : 0,
              transform: `rotate(8deg)`,
            }}
          >
            ✗
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
