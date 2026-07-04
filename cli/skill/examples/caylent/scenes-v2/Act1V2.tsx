/**
 * [INPUT]: ShaderFX liquidWarp, theme, public/brand/wordmark.png
 * [OUTPUT]: Act1V2 — 液态冷开场: 品牌色流体全屏涌动 → 字标从流体中 maskWipe 浮现 (family: shader-emergence)
 * [POS]: V2 第一幕; 轮换: 几何生长已用两次, 本片换 shader 世界; 零小字
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ShaderPlane } from "../components/ShaderFX";
import { theme } from "../theme";

export const Act1V2: React.FC = () => {
  const frame = useCurrentFrame();
  const shaderIn = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // 字标从流体中横扫浮现 — 揭示而非弹入
  const wipe = interpolate(frame, [54, 96], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // 流体在字标登场后沉下去让位
  const shaderDim = interpolate(frame, [54, 110], [1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <ShaderPlane preset="liquidWarp" colorA={theme.color.primary} colorB="#16114F" opacity={shaderIn * shaderDim} />
      {/* 字标浮现区后加暗幕 — 保证对比 */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 34% at 50% 50%, rgba(5,5,5,0.72) 0%, transparent 75%)",
          opacity: interpolate(frame, [54, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      />
      <Img
        src={staticFile("brand/wordmark.png")}
        style={{
          position: "absolute",
          left: (1920 - 1020) / 2,
          top: 540 - 90,
          width: 1020,
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
        }}
      />
    </AbsoluteFill>
  );
};
