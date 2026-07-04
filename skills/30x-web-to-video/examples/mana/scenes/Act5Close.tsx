/**
 * [INPUT]: wordmark-white.png + 官方 fleur.png / 星芒, World 基元, audio-sync
 * [OUTPUT]: Act5Close — 主黄色场收尾: 白字标 (深蓝 offset 影) + MADE IN QUEBEC + 橘红胶囊 CTA
 * [POS]: 第 5 幕; 家族 "color-field-cta-stamp" (官网 IG 黄段的视频化; 非 wordmark-cta-lockup 的暗片公式)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 构图系统 (Law 5): 色场海报 — 整屏品牌黄 (官网 "FOR A DOSE OF ENERGY" 段的底色),
 * 字标贴纸落章 + 官网按钮语言 (胶囊 + 深蓝硬 offset 阴影)。末帧持续, 不黑场。
 * VO 锚点(全局): MANA f1043 / made in quebec f1111 / find your flavor f1166
 */
import React from "react";
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { PillTag, SparklePop, TintedMark, riseIn } from "./World";
import { ACT_BOUNDS, WORD_ONSETS } from "../generated/audio-sync";

const LOCAL0 = ACT_BOUNDS.act5 - 6;
const AT = {
  mana: WORD_ONSETS.manaYerbaMate - LOCAL0,
  quebec: WORD_ONSETS.madeInQuebec - LOCAL0,
  find: WORD_ONSETS.findYourFlavor - LOCAL0,
};

export const Act5Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stamp = spring({ frame: frame - AT.mana - 4, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } });
  const wmScale = 1.16 - stamp * 0.16;
  const wmRot = (1 - stamp) * 2.5;

  const quebecIn = riseIn(frame, AT.quebec, 16);
  const ctaPop = spring({ frame: frame - AT.find, fps, config: { damping: 15, stiffness: 150, mass: 0.8 } });

  const flowerIn = spring({ frame: frame - AT.mana - 14, fps, config: { damping: 12, stiffness: 130, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ background: theme.color.primary, overflow: "hidden" }}>
      {/* 色场光 — 黄场顶部暖白呼吸 (Law 1 在色场同样成立) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 130% 90% at 50% -12%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 56%)",
        }}
      />

      {/* 官方花朵贴纸 — 右下角探入 (官网 footer 段花朵) */}
      <div
        style={{
          position: "absolute",
          right: -60,
          bottom: -70,
          transform: `scale(${flowerIn}) rotate(${(1 - flowerIn) * 24}deg)`,
          transformOrigin: "bottom right",
        }}
      >
        <Img src={staticFile("brand/deco/fleur.png")} style={{ width: 360, height: "auto" }} />
      </div>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 58,
        }}
      >
        {/* 字标贴纸: 深蓝 offset 底影 + 白面 — 官网按钮的贴纸语言放大 */}
        {frame >= AT.mana ? (
          <div
            style={{
              position: "relative",
              transform: `scale(${wmScale}) rotate(${wmRot}deg)`,
              opacity: Math.min(1, stamp * 2),
            }}
          >
            <TintedMark
              src={staticFile("brand/wordmark-white.png")}
              color={theme.color.accent}
              width={1000}
              height={368}
              style={{ position: "absolute", left: 10, top: 14 }}
            />
            <TintedMark
              src={staticFile("brand/wordmark-white.png")}
              color="#FFFFFF"
              width={1000}
              height={368}
            />
          </div>
        ) : (
          <div style={{ width: 1000, height: 368 }} />
        )}

        <div
          style={{
            fontFamily: theme.font.body,
            fontWeight: 500,
            fontSize: 32,
            letterSpacing: "0.34em",
            color: theme.color.ink,
            opacity: quebecIn,
            transform: `translateY(${(1 - quebecIn) * 24}px)`,
          }}
        >
          MADE IN QUEBEC
        </div>

        {/* CTA — 官网 Subscribe 按钮语言: 橘红胶囊 + 深蓝硬 offset 影 */}
        <div
          style={{
            opacity: Math.min(1, ctaPop * 1.6),
            transform: `scale(${0.8 + ctaPop * 0.2}) translateY(${(1 - ctaPop) * 20}px)`,
          }}
        >
          <PillTag bg={theme.color.coral} color="#FFFFFF" fontSize={33} shadow>
            manayerbamate.com
          </PillTag>
        </div>
      </AbsoluteFill>

      {/* 官方星芒 — 字标周围 */}
      <SparklePop x={300} y={196} size={56} delay={AT.mana + 8} fill={theme.color.primary} />
      <SparklePop x={1560} y={250} size={68} delay={AT.mana + 12} fill={theme.color.primary} />
      <SparklePop x={250} y={730} size={44} delay={AT.mana + 17} fill={theme.color.primary} />
    </AbsoluteFill>
  );
};
