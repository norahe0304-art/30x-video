/**
 * [INPUT]: remotion 原语, theme, Atmosphere, FadeIn/SplitText, public/brand/wordmark.png
 * [OUTPUT]: Act5 — CTA 收尾: 字标 + "Idea to Impact. Faster." + caylent.com; 末帧完整 lockup 不黑场
 * [POS]: 第五幕 / close; VO4 在此播, 3.7s 短拍
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { FadeIn, SplitText } from "../components/Animations";
import { theme } from "../theme";

const MINT = theme.color.primary;

export const Act5: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = interpolate(Math.sin(frame / 26), [-1, 1], [0.9, 1.05]);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.4} glowX={50} glowY={44} horizon={0.5} particles={30} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        {/* 无 transform/filter wrapper — 保 screen 混合吃掉黑底; 呼吸走 opacity */}
        <Img
          src={staticFile("brand/wordmark.png")}
          style={{
            width: 880,
            opacity: interpolate(frame, [4, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * glow,
          }}
        />
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 400,
            fontSize: 66,
            letterSpacing: "-0.02em",
            color: "rgba(249,249,249,0.9)",
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="Idea to Impact. Faster." delay={20} staggerFrames={2} distance={20} />
        </h2>
        <FadeIn delay={44} duration={16} direction="up" distance={14}>
          <div
            style={{
              fontFamily: theme.font.mono,
              fontSize: 34,
              color: MINT,
              letterSpacing: "0.04em",
            }}
          >
            caylent.com →
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};
