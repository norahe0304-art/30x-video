/**
 * [INPUT]: wordmark-white.png (官方字标, 已洗真透明), World 基元, audio-sync 词级时间
 * [OUTPUT]: Act1Open — 奶油纸编辑部海报开场: 深蓝巨型字标 stamp + 官方星芒 + YERBA MATÉ 胶囊
 * [POS]: 第 1 幕 (0 → ACT_BOUNDS.act2); 家族 "editorial-poster-stamp" (新家族, 非 brand-geometry-growth)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 构图系统 (Law 5): oversized-type stack — 字标即海报。
 * VO 锚点: "Meet MANA." (f30 stamp) / "Organic yerba mate" (f69 胶囊)
 */
import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, PillTag, SparklePop, TintedMark, riseIn } from "./World";
import { WORD_ONSETS } from "../generated/audio-sync";

const STAMP = WORD_ONSETS.meet + 8; // "Meet MANA" 落点
const PILL = 69; // "Organic yerba mate" onset (2.30s 全局 f69 → act1 本地相同, act1 从 0 起)

export const Act1Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 字标 stamp: 大→小 落章 + 微转正
  const stamp = spring({ frame: frame - STAMP, fps, config: { damping: 14, stiffness: 130, mass: 0.9 } });
  const scale = 1.18 - stamp * 0.18;
  const rot = (1 - stamp) * -3;
  const show = frame >= STAMP;

  const pillIn = riseIn(frame, PILL, 16);

  // 收尾整体缓慢呼吸推近
  const drift = 1 + frame * 0.00012;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperAtmosphere />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          transform: `scale(${drift})`,
        }}
      >
        {show ? (
          <div style={{ transform: `scale(${scale}) rotate(${rot}deg)`, opacity: Math.min(1, stamp * 2) }}>
            <TintedMark
              src={staticFile("brand/wordmark-white.png")}
              color={theme.color.accent}
              width={1240}
              height={457}
            />
          </div>
        ) : (
          <div style={{ width: 1240, height: 457 }} />
        )}

        <div style={{ opacity: pillIn, transform: `translateY(${(1 - pillIn) * 26}px)` }}>
          <PillTag fontSize={27} shadow>
            YERBA MATÉ · MADE IN QUEBEC
          </PillTag>
        </div>
      </AbsoluteFill>

      {/* 官方星芒 — 字标周围 stagger 弹入 (官网 hero 的星芒语汇) */}
      <SparklePop x={286} y={214} size={54} delay={STAMP + 6} />
      <SparklePop x={1570} y={166} size={72} delay={STAMP + 10} />
      <SparklePop x={1650} y={700} size={46} delay={STAMP + 15} />
      <SparklePop x={200} y={760} size={38} delay={STAMP + 19} />
    </AbsoluteFill>
  );
};
