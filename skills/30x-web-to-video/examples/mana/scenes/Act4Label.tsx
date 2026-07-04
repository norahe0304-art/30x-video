/**
 * [INPUT]: can label 纹理提取的官方事实 (120mg/50cal/no crash/vegan/antiox) + 洗净官方图标, World 基元, audio-sync
 * [OUTPUT]: Act4Label — 营养面板证明幕: 巨数字 120 MG + nutrition-facts 式行表 (粗顶栏+细分隔线)
 * [POS]: 第 4 幕; 家族 "nutrition-panel-proof" (新家族 — 能量饮料的证明世界就是罐背营养标签)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * Claim→World: "能量但不 crash" → 消费者翻罐看的是 Nutrition Facts 面板 →
 * 把面板做成编辑部尺度: 左侧 300px 巨数字, 右侧标签行表 (粗黑顶栏是营养标签的签名笔画)。
 * 构图系统 (Law 5): split composition with vertical seam。
 * VO 锚点(全局): inside f751 / 120 f801 / caffeine f848 / 50cal f896 / crash f980
 */
import React from "react";
import { AbsoluteFill, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, Sparkle, TintedMark, riseIn, clamp01, easeOutExpo } from "./World";
import { ACT_BOUNDS, WORD_ONSETS } from "../generated/audio-sync";

const LOCAL0 = ACT_BOUNDS.act4 - 6;
const AT = {
  inside: WORD_ONSETS.insideEveryCan - LOCAL0, // 12
  n120: WORD_ONSETS.oneHundredTwenty - LOCAL0, // ~56
  caffeine: WORD_ONSETS.naturalCaffeine - LOCAL0,
  cal: WORD_ONSETS.fiftyCalories - LOCAL0,
  energy: WORD_ONSETS.allTheEnergy - LOCAL0,
  crash: WORD_ONSETS.noneOfTheCrash - LOCAL0,
};

type Row = { icon: string | null; label: string; value: string; at: number; hero?: boolean };

// 左侧巨数字已承载 caffeine 主张 — 行表不重复它 (one frame, one argument)
// 图标语义诚实: ring=antioxydants, leaf=vegan, wave=no-crash (全部来自 can label 官方图标)
const ROWS: Row[] = [
  { icon: null, label: "Calories", value: "50", at: AT.cal + 2 },
  { icon: "brand/icons/icon-antiox.png", label: "Antioxidants", value: "✓", at: AT.cal + 14 },
  { icon: "brand/icons/icon-vegan.png", label: "Vegan · Organic", value: "✓", at: AT.cal + 26 },
  { icon: "brand/icons/icon-nocrash.png", label: "Crash", value: "0", at: AT.crash + 2, hero: true },
];

export const Act4Label: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 巨数字 count-up: "one hundred and twenty" onset 起 1.2s 数到 120
  const countP = easeOutExpo(clamp01((frame - AT.n120) / 36));
  const bigN = Math.round(countP * 120);
  const bigIn = riseIn(frame, AT.n120 - 4, 14);

  // 顶部粗黑栏 (营养标签签名笔画) 划入
  const barP = riseIn(frame, AT.inside - 6, 20);

  // "Crash 0" 落章
  const crashStamp = spring({ frame: frame - AT.crash, fps, config: { damping: 13, stiffness: 160, mass: 0.8 } });

  const eyebrowIn = riseIn(frame, AT.inside, 16);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperAtmosphere />

      <AbsoluteFill style={{ padding: "96px 120px 88px" }}>
        {/* 粗黑顶栏 + 眉线 — 营养面板的开场笔画 */}
        <div style={{ height: 14, background: theme.color.ink, transform: `scaleX(${barP})`, transformOrigin: "left center" }} />
        <div
          style={{
            marginTop: 22,
            fontFamily: theme.font.body,
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: "0.26em",
            color: theme.color.inkSoft,
            opacity: eyebrowIn,
          }}
        >
          INSIDE EVERY CAN — 355 ML
        </div>

        {/* 主体: 左巨数字 | 细缝 | 右行表 */}
        <div style={{ display: "flex", marginTop: 40, gap: 84, alignItems: "stretch", flex: 1 }}>
          {/* 左: 300px 巨数字建筑 */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", opacity: bigIn }}>
            <div
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: 330,
                lineHeight: 0.9,
                letterSpacing: "-0.03em",
                color: theme.color.ink,
                fontVariantNumeric: "tabular-nums",
                transform: `translateY(${(1 - bigIn) * 60}px)`,
              }}
            >
              {bigN}
            </div>
            <div
              style={{
                marginTop: 18,
                fontFamily: theme.font.body,
                fontWeight: 500,
                fontSize: 36,
                letterSpacing: "0.2em",
                color: theme.color.ink,
                opacity: riseIn(frame, AT.caffeine, 14),
              }}
            >
              MG NATURAL CAFFEINE
            </div>
          </div>

          {/* 竖缝 */}
          <div style={{ width: 2, background: theme.color.border, transform: `scaleY(${barP})`, transformOrigin: "top" }} />

          {/* 右: nutrition 行表 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {ROWS.map((row, i) => {
              const p = riseIn(frame, row.at, 16);
              const isCrash = Boolean(row.hero);
              const stampScale = isCrash ? 1 + (1 - Math.min(1, crashStamp)) * 0.35 : 1;
              const rowColor = isCrash && frame >= AT.crash ? theme.color.coral : theme.color.ink;
              return (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 30,
                    padding: "34px 6px",
                    borderBottom: i < ROWS.length - 1 ? `2px solid ${theme.color.border}` : undefined,
                    opacity: p,
                    transform: `translateX(${(1 - p) * 44}px)`,
                  }}
                >
                  {row.icon ? (
                    <TintedMark
                      src={staticFile(row.icon)}
                      color={theme.color.accent}
                      width={56}
                      height={52}
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 56, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      <Sparkle size={40} fill={theme.color.primary} stroke={theme.color.accent} />
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: theme.font.body,
                      fontWeight: 450,
                      fontSize: 44,
                      color: theme.color.textBody,
                      flex: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontFamily: theme.font.heading,
                      fontWeight: 500,
                      fontSize: isCrash ? 84 : 64,
                      color: rowColor,
                      fontVariantNumeric: "tabular-nums",
                      transform: `scale(${stampScale})`,
                      transformOrigin: "right center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
