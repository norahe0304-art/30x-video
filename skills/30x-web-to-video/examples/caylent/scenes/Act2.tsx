/**
 * [INPUT]: remotion 原语, theme, SplitText, public/brand/demo.mp4 (官网 hero 背景实拍, brand-authored)
 * [OUTPUT]: Act2 — Hook: 实拍全屏出血 + 暗部 scrim + 编辑部级双行字排 "Idea to Impact. / Faster."
 * [POS]: 第二幕 / product reality; 全屏时刻 (Law 2), VO1 在此播
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

export const Act2: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 243], [1.02, 1.1], { extrapolateRight: "clamp" });
  const scrimIn = interpolate(frame, [0, 24], [0.2, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      {/* 实拍慢推 — 官网 hero 背景片段 */}
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <OffthreadVideo
          src={staticFile("brand/demo.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* 暗部 scrim — 字区左下加重 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(112deg, rgba(5,5,8,${scrimIn + 0.22}) 0%, rgba(5,5,8,${scrimIn * 0.55}) 55%, rgba(5,5,8,0.18) 100%)`,
        }}
      />

      {/* 编辑部级双行 — 主张即画面 */}
      <div style={{ position: "absolute", left: 110, bottom: 200 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 168,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: theme.color.text,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Idea to Impact." delay={16} staggerFrames={2} distance={34} />
        </h1>
        <h1
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 236,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: theme.color.primary,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Faster." delay={40} staggerFrames={3} distance={40} />
        </h1>
      </div>
    </AbsoluteFill>
  );
};
