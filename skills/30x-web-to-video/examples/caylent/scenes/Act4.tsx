/**
 * [INPUT]: remotion 原语, theme, Atmosphere, FadeIn/SplitText/CountUp, public/brand/customers-wall.png (homepage 裁切真客户墙)
 * [OUTPUT]: Act4 — Proof 三拍 (VO3 短语切点 local 128/198): 70% 巨数字 → 40% MTTR 巨数字 → 真客户 logo 墙全宽
 * [POS]: 第四幕 / 证明段; 真数据 (Caylent Accelerate 官网口径), 一拍一个主角, 无副句小字
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { FadeIn, SplitText, CountUp } from "../components/Animations";
import { theme } from "../theme";

const MINT = theme.color.primary;
const B2 = 128; // "cuts recovery time" 短语 onset
const B3 = 198; // "trusted by" 短语 onset

const fadeWin = (frame: number, start: number, end: number) => {
  const i = start === 0 ? 1 : interpolate(frame, [start - 6, start], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = end >= 900 ? 1 : interpolate(frame, [end - 6, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return i * o;
};

const bigNum: React.CSSProperties = {
  fontFamily: theme.font.heading,
  fontWeight: 500,
  fontSize: 340,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  color: theme.color.text,
  fontVariantNumeric: "tabular-nums",
};

const contextLine: React.CSSProperties = {
  margin: 0,
  fontFamily: theme.font.heading,
  fontWeight: 400,
  fontSize: 74,
  lineHeight: 1.06,
  letterSpacing: "-0.03em",
  color: "rgba(249,249,249,0.88)",
};

// 拍1: 70% remediation 自动化 — 数字即建筑
const StatSeventy: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 96, top: 250 }}>
      <FadeIn delay={10} duration={18} direction="up" distance={40}>
        <div style={bigNum}>
          <CountUp from={0} to={70} delay={22} duration={54} decimals={0} suffix="%" />
        </div>
      </FadeIn>
      <h2 style={{ ...contextLine, marginTop: 26 }}>
        <SplitText text="of remediation work — automated." delay={40} staggerFrames={1} distance={22} />
      </h2>
    </div>
    {/* 右缘竖光柱 — 自动化能量 */}
    <div
      style={{
        position: "absolute",
        right: 140,
        top: 0,
        width: 4,
        height: `${interpolate(frame, [20, 90], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })}%`,
        background: `linear-gradient(180deg, transparent, ${MINT}, transparent)`,
        boxShadow: `0 0 30px ${MINT}66`,
      }}
    />
  </AbsoluteFill>
);

// 拍2: MTTR −40% — 恢复时长对比条: manual runbook vs Accelerate, 差距即卖点
const MTTR_BARS = [
  { label: "manual runbook", widthPx: 1010, color: "rgba(249,249,249,0.30)", glow: false },
  { label: "with caylent accelerate", widthPx: 606, color: undefined, glow: true }, // 60% = −40%
];
const StatMttr: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - B2;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", right: 120, top: 230, textAlign: "right" }}>
        <FadeIn delay={B2 + 8} duration={16} direction="up" distance={30}>
          <div style={{ ...bigNum, color: MINT }}>
            <CountUp from={0} to={40} delay={B2 + 16} duration={48} decimals={0} prefix="−" suffix="%" />
          </div>
        </FadeIn>
        <h2 style={{ ...contextLine, marginTop: 26 }}>
          <SplitText text="mean time to recovery." delay={B2 + 30} staggerFrames={1} distance={22} />
        </h2>
      </div>
      {/* 恢复时长对比 — 两根横条, 第二根只有 60% 长, 差距一眼读完 */}
      <div style={{ position: "absolute", left: 120, top: 640 }}>
        {MTTR_BARS.map((bar, i) => {
          const draw = interpolate(t - (14 + i * 22), [0, 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div key={bar.label} style={{ marginBottom: 64, opacity: draw > 0 ? 1 : 0 }}>
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 24,
                  letterSpacing: "0.05em",
                  color: bar.glow ? `${MINT}CC` : "rgba(249,249,249,0.5)",
                  marginBottom: 16,
                }}
              >
                {bar.label}
              </div>
              <div
                style={{
                  width: bar.widthPx * draw,
                  height: 22,
                  borderRadius: 4,
                  background: bar.color ?? `linear-gradient(90deg, ${MINT}88, ${MINT})`,
                  boxShadow: bar.glow ? `0 0 26px ${MINT}55` : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// 拍3: 真客户墙 — homepage 原样裁切, 全宽出血
const Customers: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - B3;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 150 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 150,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: theme.color.text,
          }}
        >
          <SplitText text="Trusted by global" delay={B3 + 2} staggerFrames={1} distance={24} />
        </h2>
        <h2
          style={{
            margin: 0,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 150,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: MINT,
          }}
        >
          <SplitText text="enterprises." delay={B3 + 10} staggerFrames={1} distance={24} />
        </h2>
      </div>
      {/* 无 transform/filter — stacking context 会杀 mix-blend-mode, 黑底就露矩形 */}
      <Img
        src={staticFile("brand/customers-wall.png")}
        style={{
          position: "absolute",
          left: 0,
          bottom: 210,
          width: 1920,
          opacity: interpolate(t, [14, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

export const Act4: React.FC = () => {
  const frame = useCurrentFrame();
  const w1 = fadeWin(frame, 0, B2);
  const w2 = fadeWin(frame, B2, B3);
  const w3 = fadeWin(frame, B3, 999);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.28} glowX={64} glowY={70} horizon={0.42} particles={20} />
      {w1 > 0 ? <AbsoluteFill style={{ opacity: w1 }}><StatSeventy frame={frame} /></AbsoluteFill> : null}
      {w2 > 0 && frame > B2 - 8 ? <AbsoluteFill style={{ opacity: w2 }}><StatMttr frame={frame} /></AbsoluteFill> : null}
      {w3 > 0 && frame > B3 - 8 ? <AbsoluteFill style={{ opacity: w3 }}><Customers frame={frame} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
