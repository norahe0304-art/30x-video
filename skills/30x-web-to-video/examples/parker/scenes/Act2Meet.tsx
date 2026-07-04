/**
 * [INPUT]: remotion, theme, PaperWorld (PaperAtmosphere), Animations (SplitText)
 * [OUTPUT]: Act2Meet — 奶油世界编辑部巨字 reveal "Meet Parker." (problem→solution 转折)
 * [POS]: 第二幕后半 pivot; 家族 editorial-reveal (type-only, 无 logo — logo 只在 Act1/5)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere } from "./PaperWorld";
import { SplitText } from "../components/Animations";

// seq3 有效起点 abs f234。vo2 @ f240: Meet l6 | The AI l44 | strategist. l100
export const Act2Meet: React.FC = () => {
  const frame = useCurrentFrame();

  const subIn = spring({ frame: frame - 44, fps: 30, config: { damping: 16, stiffness: 120 } });

  // 巨字缓慢生长 — 编辑部自信
  const grow = interpolate(frame, [6, 140], [0.985, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PaperAtmosphere base={theme.color.bg} dust={16} lightY={34} seed={3} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${grow})` }}>
          <div
            style={{
              fontFamily: theme.font.heading,
              fontWeight: 500,
              fontSize: 220,
              letterSpacing: -6,
              lineHeight: 1,
              color: theme.color.ink,
              whiteSpace: "nowrap",
            }}
          >
            <SplitText text="Meet" delay={6} staggerFrames={2} distance={34} />{" "}
            <span style={{ color: theme.color.primary, fontStyle: "italic" }}>
              <SplitText text="Parker." delay={14} staggerFrames={2} distance={34} />
            </span>
          </div>
          <div
            style={{
              marginTop: 46,
              fontFamily: theme.font.body,
              fontWeight: 500,
              fontSize: 40,
              letterSpacing: -0.5,
              color: theme.color.textBody,
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 26}px)`,
            }}
          >
            The AI that thinks like your best creative strategist.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
