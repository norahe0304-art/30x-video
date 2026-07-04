/**
 * [INPUT]: public/brand/context-aware-desktop.jpg (官方能力图), theme, SplitText/FadeIn
 * [OUTPUT]: Act2 — 奶油纸白编辑部: 左字排 "Teams of agents. / 20+ frontier models." + 右侧官方图出血裱装 (family: editorial-split-with-asset)
 * [POS]: 第二幕 / what-it-is; 浅底世界首拍, 墨字大排 + 青色强调; VO2 同窗
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

export const Act2: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [10, 40], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const imgIn = interpolate(frame, [10, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.color.bg }}>
      {/* 纸面轻微明度纵深 — 浅底世界的"氛围底", 不是真空 */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 24% 40%, rgba(255,255,255,0.75) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", left: 110, top: 300 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 140,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: theme.color.text,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Teams of agents." delay={12} staggerFrames={2} distance={26} />
        </h2>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 140,
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: theme.color.primary,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="20+ frontier models." delay={34} staggerFrames={2} distance={26} />
        </h2>
      </div>
      {/* 官方能力图 — 右下出血裱装, 纸上照片的置物感 */}
      <div
        style={{
          position: "absolute",
          right: -170,
          bottom: -140,
          width: 1120,
          transform: `translateY(${slide}px)`,
          opacity: imgIn,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 44px 120px rgba(16,16,16,0.28)",
        }}
      >
        <Img src={staticFile("brand/context-aware-desktop.jpg")} style={{ width: "100%", display: "block" }} />
      </div>
    </AbsoluteFill>
  );
};
