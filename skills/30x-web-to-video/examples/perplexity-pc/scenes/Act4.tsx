/**
 * [INPUT]: public/brand/privacy-bg.jpg (官方隐私视觉), theme, SplitText
 * [OUTPUT]: Act4 — 官方隐私图全出血 + "Secure by design." 单主张 (family: single-claim-fullbleed)
 * [POS]: 第四幕 / trust, 短拍 (3.6s); 原文主张, 零副句
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

export const Act4: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 156], [1.06, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#101210" }}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <Img src={staticFile("brand/privacy-bg.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(8,10,9,0.35) 0%, transparent 75%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 150,
            letterSpacing: "-0.04em",
            color: "#FAF8F5",
            textShadow: "0 4px 44px rgba(0,0,0,0.45)",
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Secure by design." delay={8} staggerFrames={2} distance={28} />
        </h2>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
