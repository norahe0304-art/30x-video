/**
 * [INPUT]: public/brand/hero-img.jpg (官方 3D 渲染: Mac mini 落草地+镀铬气泡), theme, SplitText
 * [OUTPUT]: Act1 — 官方 hero 全出血慢推 + 左暗区编辑部双行 "Personal Computer / is here." (H1 原文)
 * [POS]: 第一幕 / hook; Law 4 真资产当主角 (family: live-asset-fullbleed); 零小字
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

export const Act1: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 211], [1.02, 1.09], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#0B0B0A" }}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <Img src={staticFile("brand/hero-img.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* 左暗区已天然存在 — 只补极轻压边保字 */}
      <AbsoluteFill style={{ background: "linear-gradient(100deg, rgba(5,5,4,0.45) 0%, transparent 46%)" }} />
      <div style={{ position: "absolute", left: 110, top: 330 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 176,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: "#FAF8F5",
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Personal Computer" delay={16} staggerFrames={2} distance={34} />
        </h1>
        <h1
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 176,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: theme.color.primary,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="is here." delay={44} staggerFrames={3} distance={34} />
        </h1>
      </div>
    </AbsoluteFill>
  );
};
