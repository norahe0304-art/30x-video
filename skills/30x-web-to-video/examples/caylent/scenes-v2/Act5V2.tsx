/**
 * [INPUT]: public/brand/hero.png (官方品牌卡, kind=cover 烘焙 tagline), remotion 原语
 * [OUTPUT]: Act5V2 — 官方品牌卡全出血收尾: 慢推 + 光晕呼吸, 末帧即官方 end card (family: cover-endcard)
 * [POS]: V2 第五幕; 轮换: wordmark-lockup 已用; cover 素材全屏原样禁叠字 (workflow 分类法则的展示位)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

export const Act5V2: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 112], [1.06, 1], { extrapolateRight: "clamp" });
  const breathe = 1 + Math.sin(frame / 30) * 0.012;

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Img
        src={staticFile("brand/hero.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${drift * breathe})`,
        }}
      />
    </AbsoluteFill>
  );
};
