/**
 * [INPUT]: cf-footer-img.png (官方像素向日葵田), cf-logo-dark.svg, theme, 真 CTA "Run a company" + cofounder.co
 * [OUTPUT]: Act5 — 向日葵田全屏收尾: wordmark 纸片 + 墨色 CTA pill + mono 域名, 末帧不黑场
 * [POS]: 五幕之一 (38.5-42.5s); 家族 pixel-field-endcard; 构图系统 = full-bleed image + centered lockup
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

export const Act5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, 126], [1.1, 1.0], { extrapolateRight: "clamp" });
  const chipIn = spring({ frame: frame - 4, fps, config: { damping: 16, stiffness: 95 } });
  const ctaIn = spring({ frame: frame - 12, fps, config: { damping: 13, stiffness: 130, mass: 0.8 } });
  const urlIn = interpolate(frame, [40, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: theme.color.bg }}>
      <Img
        src={staticFile("brand/cf-footer-img.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 68%",
          transform: `scale(${scale})`,
          transformOrigin: "center 60%",
          imageRendering: "pixelated",
        }}
      />
      {/* 中央光斑 scrim — lockup 可读, 不闷像素画 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 760px 520px at 50% 52%, rgba(18,30,12,0.44) 0%, rgba(18,30,12,0.12) 62%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <div
          style={{
            padding: "30px 54px",
            background: "rgba(255,255,255,0.97)",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(12,24,8,0.4)",
            opacity: chipIn,
            transform: `translateY(${(1 - chipIn) * 46}px)`,
          }}
        >
          <Img
            src={staticFile("brand/cf-logo-dark.svg")}
            style={{ height: 62, width: "auto", display: "block" }}
          />
        </div>

        <div
          style={{
            padding: "24px 62px",
            borderRadius: 999,
            background: theme.color.text,
            color: "#FFFFFF",
            fontSize: 37,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            boxShadow: "0 18px 60px rgba(12,24,8,0.45)",
            opacity: ctaIn,
            transform: `scale(${0.9 + ctaIn * 0.1})`,
          }}
        >
          Run a company
        </div>

        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 25,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 3px 16px rgba(12,24,8,0.6)",
            opacity: urlIn,
          }}
        >
          cofounder.co
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
