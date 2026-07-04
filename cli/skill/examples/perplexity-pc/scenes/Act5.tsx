/**
 * [INPUT]: public/brand/logo.svg (官方墨色字标), theme, FadeIn
 * [OUTPUT]: Act5 — 奶油纸白收尾: 官方 logo + "Available now." + 下载指引; 末帧完整 lockup (family: light-paper-endcard)
 * [POS]: 第五幕 / CTA (9s 长呼吸); 浅底端版, 墨字青点, 零杂饰
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { FadeIn, SplitText } from "../components/Animations";
import { theme } from "../theme";

export const Act5: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 36) * 0.004;

  return (
    <AbsoluteFill style={{ background: theme.color.bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 50% at 50% 44%, rgba(255,255,255,0.85) 0%, transparent 70%)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 348,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 52,
          transform: `scale(${breathe})`,
        }}
      >
        <FadeIn delay={6} duration={20} direction="up" distance={26}>
          <Img src={staticFile("brand/logo.svg")} style={{ width: 560 }} />
        </FadeIn>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 104,
            letterSpacing: "-0.035em",
            color: theme.color.text,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Available now, for Mac." delay={26} staggerFrames={2} distance={22} />
        </h2>
        <FadeIn delay={54} duration={16} direction="up" distance={14}>
          <div style={{ fontFamily: theme.font.mono, fontSize: 33, letterSpacing: "0.03em", color: theme.color.primary }}>
            perplexity.ai/personal-computer →
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};
