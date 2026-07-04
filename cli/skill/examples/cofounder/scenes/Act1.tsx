/**
 * [INPUT]: public/brand/cf-og-home.png (官方 og, cover 类·烘焙 headline), cf-logo-dark.svg (官方 wordmark), theme
 * [OUTPUT]: Act1 — 像素世界冷开场: og 全屏出血慢推 + wordmark 纸片从底浮入
 * [POS]: 五幕之一 (0-5.5s); 家族 pixel-world-coldopen; 构图系统 = full-bleed image + corner lockup
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export const Act1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 慢推 — 像素画保持 pixelated, 放大也锐利
  const scale = interpolate(frame, [0, 170], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });
  const rise = spring({ frame: frame - 22, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: theme.color.bg }}>
      <Img
        src={staticFile("brand/cf-og-home.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // og 左侧有烘焙 headline — 锚左裁右, 文案完整可读 (cover 类铁律)
          objectPosition: "0% 35%",
          transform: `scale(${scale})`,
          transformOrigin: "16% 40%",
          imageRendering: "pixelated",
        }}
      />
      {/* 底缘轻 scrim — 给 lockup 一块可读地面, 不压像素画 */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 72%, rgba(20,30,16,0.38) 100%)",
        }}
      />
      {/* wordmark 纸片 — 站上 nav 的白 pill 语言 */}
      <div
        style={{
          position: "absolute",
          right: 92,
          bottom: 74,
          display: "flex",
          alignItems: "center",
          padding: "26px 44px",
          background: "rgba(255,255,255,0.96)",
          borderRadius: 18,
          boxShadow: "0 18px 60px rgba(15,25,10,0.35)",
          opacity: rise,
          transform: `translateY(${(1 - rise) * 90}px)`,
        }}
      >
        <Img
          src={staticFile("brand/cf-logo-dark.svg")}
          style={{ height: 54, width: "auto", display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};
