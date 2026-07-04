/**
 * [INPUT]: remotion, theme, PaperWorld (PaperScrap/BlackButton/PaperAtmosphere), 真资产 wordmark-red.png
 * [OUTPUT]: Act5Close — 官网页脚语言收尾: CTA 纸片+黑按钮 + 巨型红字标从底边升起出血
 * [POS]: 第五幕 close; 家族 footer-wordmark-bleed-cta; 末帧不黑场
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, PaperScrap, BlackButton } from "./PaperWorld";

// seq6 有效起点 abs f1094; vo4 "Hire Parker today." abs f1100-1134 (local 6-40)
export const Act5Close: React.FC = () => {
  const frame = useCurrentFrame();

  // 巨型字标从底边升起 — 官网页脚原样构图, 底边出血
  const rise = spring({ frame: frame - 10, fps: 30, config: { damping: 17, stiffness: 52 } });
  const markY = interpolate(rise, [0, 1], [420, 96]);
  // 收尾缓慢继续上浮 — 画面到最后一帧仍是活的
  const drift = interpolate(frame, [70, 106], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PaperAtmosphere base={theme.color.bg} dust={14} lightY={20} seed={6} />

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div
          style={{
            marginTop: 168,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 44,
          }}
        >
          <PaperScrap delay={4} rotate={-1.6} padding="20px 48px">
            <span
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: 58,
                letterSpacing: -1,
                color: theme.color.ink,
                whiteSpace: "nowrap",
              }}
            >
              Ready to make <span style={{ color: theme.color.primary }}>better ads?</span>
            </span>
          </PaperScrap>
          <BlackButton label="Hire Parker Today" delay={12} />
        </div>
      </AbsoluteFill>

      {/* 页脚巨字标 — 底边出血 (真资产) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          transform: `translateX(-50%) translateY(${markY + drift}px)`,
          width: 1560,
        }}
      >
        <Img
          src={staticFile("brand/wordmark-red.png")}
          style={{ width: "100%", display: "block", opacity: Math.min(1, rise * 2) }}
        />
      </div>
    </AbsoluteFill>
  );
};
