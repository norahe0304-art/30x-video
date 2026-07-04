/**
 * [INPUT]: hero.png (官方 og-image: 四罐天空蓝 3D 棚拍), World 基元, audio-sync
 * [OUTPUT]: Act2Hero — 产品英雄全出血: 慢推 + can 颈带跑马灯 + 三词编辑部字排 (吸附 VO onset)
 * [POS]: 第 2 幕; 家族 "product-fullbleed + label-marquee-band" (真资产主角, Law 4)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 构图系统 (Law 5): full-bleed image + edge band + 词排。
 * VO 锚点: FRESH f169 / FRUITY f189 / SPARKLING f212 (幕内减去起帧)
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { MarqueeBand, riseIn } from "./World";
import { ACT_BOUNDS, WORD_ONSETS } from "../generated/audio-sync";

// TransitionSeries 里本幕从 (ACT_BOUNDS.act2 - 6) 全局帧起
const LOCAL0 = ACT_BOUNDS.act2 - 6;
const W_FRESH = WORD_ONSETS.fresh - LOCAL0;
const W_FRUITY = WORD_ONSETS.fruity - LOCAL0;
const W_SPARK = WORD_ONSETS.sparkling - LOCAL0;

const WORDS: Array<{ text: string; at: number }> = [
  { text: "FRESH,", at: W_FRESH },
  { text: "FRUITY,", at: W_FRUITY },
  { text: "SPARKLING.", at: W_SPARK },
];

export const Act2Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 160], [1.06, 1.14]);
  const panY = interpolate(frame, [0, 160], [0, -18]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#87A8E0" }}>
      {/* 官方 og-image 全出血慢推 — 品牌最强真资产当主角 */}
      <Img
        src={staticFile("brand/hero.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 42%",
          transform: `scale(${push}) translateY(${panY}px)`,
          transformOrigin: "center center",
        }}
      />

      {/* 底部深蓝渐变 scrim — 压字区 (词排的可读性) */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(43,61,115,0) 52%, rgba(24,34,66,0.72) 100%)",
        }}
      />

      {/* 三词编辑部字排 — 每词吸附自己的 VO onset */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          padding: "0 0 96px 108px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 44, whiteSpace: "nowrap" }}>
          {WORDS.map(({ text, at }) => {
            const p = riseIn(frame, at, 14);
            return (
              <span
                key={text}
                style={{
                  fontFamily: theme.font.heading,
                  fontWeight: 500,
                  fontSize: 132,
                  letterSpacing: "-0.015em",
                  color: "#FFFFFF",
                  opacity: p,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 60}px)`,
                }}
              >
                {text}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* can 颈带跑马灯 — 顶边, 来自 can label 原文 */}
      <MarqueeBand style={{ position: "absolute", top: 0, left: 0, right: 0 }} height={62} />
    </AbsoluteFill>
  );
};
