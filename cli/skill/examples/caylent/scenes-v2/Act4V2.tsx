/**
 * [INPUT]: remotion 原语, theme, Atmosphere, SplitText, public/brand/customers-wall.png
 * [OUTPUT]: Act4V2 — Proof 三拍 (短语切点 local 128/198): 老虎机数字锁定 70% → 双计时赛跑 manual vs accelerate → 客户 logo 跑马灯 (families: slot-counter / race-split / logo-ticker)
 * [POS]: V2 第四幕; 轮换: countup/对比条/静态客户墙已用; 小字预算 ≤1
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

const MINT = theme.color.primary;
const B2 = 128;
const B3 = 198;

const fadeWin = (frame: number, start: number, end: number) => {
  const i = start === 0 ? 1 : interpolate(frame, [start - 6, start], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = end >= 900 ? 1 : interpolate(frame, [end - 6, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return i * o;
};

// ── 拍1: 老虎机 70% — 数字滚轮减速锁定 (motion-primitive: slot-machine-reveal + counting-punch) ──
const DIGIT_H = 340;
const SlotDigit: React.FC<{ frame: number; target: number; delay: number }> = ({ frame, target, delay }) => {
  // 滚动圈数递减 → 精确停在 target
  const p = interpolate(frame - delay, [0, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const totalSteps = 30 + target; // 三整圈 + 落位
  const pos = p * totalSteps;
  const offset = (pos % 10) * DIGIT_H;
  const settled = p >= 1;
  return (
    <div
      style={{
        height: DIGIT_H,
        overflow: "hidden",
        position: "relative",
        // 滚轮窗上下渐隐 — 半截数字读作转轮而非破图
        maskImage: "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
      }}
    >
      <div style={{ transform: `translateY(${-offset}px)`, filter: settled ? "none" : `blur(${(1 - p) * 5}px)` }}>
        {Array.from({ length: 11 }, (_, d) => (
          <div
            key={d}
            style={{
              height: DIGIT_H,
              fontFamily: theme.font.heading,
              fontWeight: 500,
              fontSize: 330,
              lineHeight: `${DIGIT_H}px`,
              letterSpacing: "-0.04em",
              color: theme.color.text,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {d % 10}
          </div>
        ))}
      </div>
    </div>
  );
};

const SlotSeventy: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: 96, top: 250, display: "flex", alignItems: "flex-start" }}>
      <SlotDigit frame={frame} target={7} delay={14} />
      <SlotDigit frame={frame} target={0} delay={26} />
      <div
        style={{
          fontFamily: theme.font.heading,
          fontWeight: 500,
          fontSize: 330,
          lineHeight: `${DIGIT_H}px`,
          color: MINT,
          opacity: interpolate(frame, [86, 96], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        %
      </div>
    </div>
    <div style={{ position: "absolute", left: 110, top: 640 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: theme.font.heading,
          fontWeight: 400,
          fontSize: 74,
          letterSpacing: "-0.03em",
          color: "rgba(249,249,249,0.88)",
        }}
      >
        <SplitText text="of remediation work — automated." delay={92} staggerFrames={1} distance={22} />
      </h2>
    </div>
  </AbsoluteFill>
);

// ── 拍2: 双计时赛跑 — manual 还在爬, accelerate 冲线锁定 (family: race-split) ──
const RaceSplit: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - B2;
  // 同一场事故两种响应: 双钟同速走表 — accelerate 96s 冲线锁定, manual 一直爬没完没了
  const clock = Math.floor(interpolate(t, [8, 74], [0, 150], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const accel = Math.min(96, clock);
  const manual = clock;
  const locked = accel >= 96;
  const counter: React.CSSProperties = {
    fontFamily: theme.font.heading,
    fontWeight: 500,
    fontSize: 250,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontVariantNumeric: "tabular-nums",
  };
  const label: React.CSSProperties = {
    fontFamily: theme.font.heading,
    fontWeight: 400,
    fontSize: 52,
    letterSpacing: "-0.02em",
    color: "rgba(249,249,249,0.75)",
    marginBottom: 34,
  };
  return (
    <AbsoluteFill>
      {/* 中缝细线分屏 */}
      <div style={{ position: "absolute", left: "50%", top: 140, bottom: 140, width: 1.5, background: "rgba(249,249,249,0.16)" }} />
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        <div style={label}>manual runbook</div>
        <div style={{ ...counter, color: "rgba(249,249,249,0.42)" }}>
          {manual}s
        </div>
      </div>
      <div style={{ position: "absolute", right: 130, top: 300, textAlign: "right" }}>
        <div style={{ ...label, color: locked ? MINT : label.color }}>with caylent accelerate</div>
        <div
          style={{
            ...counter,
            color: MINT,
            textShadow: locked ? `0 0 60px ${MINT}55` : undefined,
            transform: locked ? `scale(${1 + Math.max(0, 1 - (t - 46) / 8) * 0.05})` : undefined,
            transformOrigin: "right center",
          }}
        >
          {accel}s
        </div>
        {/* 唯一机器字 — 冲线锁定章 */}
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 27,
            color: `${MINT}CC`,
            marginTop: 26,
            opacity: interpolate(t, [50, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          resolved · MTTR −40%
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 拍3: 客户跑马灯 — logo 墙无缝横滚 (family: logo-ticker) ──
const LogoTicker: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - B3;
  const REPEAT_W = 1920;
  const x = -((t * 3.2) % REPEAT_W);
  const tickerIn = interpolate(t, [10, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 200 }}>
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
      {/* 无缝滚动带 — 两份拼接, 端部渐隐 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 230,
          height: 210,
          opacity: tickerIn,
          maskImage: "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <div style={{ position: "absolute", left: x, top: 0, display: "flex" }}>
          <Img src={staticFile("brand/customers-wall.png")} style={{ width: REPEAT_W, mixBlendMode: "screen" }} />
          <Img src={staticFile("brand/customers-wall.png")} style={{ width: REPEAT_W, mixBlendMode: "screen" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Act4V2: React.FC = () => {
  const frame = useCurrentFrame();
  const w1 = fadeWin(frame, 0, B2);
  const w2 = fadeWin(frame, B2, B3);
  const w3 = fadeWin(frame, B3, 999);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.26} glowX={62} glowY={68} horizon={0.4} particles={18} />
      {w1 > 0 ? <AbsoluteFill style={{ opacity: w1 }}><SlotSeventy frame={frame} /></AbsoluteFill> : null}
      {w2 > 0 && frame > B2 - 8 ? <AbsoluteFill style={{ opacity: w2 }}><RaceSplit frame={frame} /></AbsoluteFill> : null}
      {w3 > 0 && frame > B3 - 8 ? <AbsoluteFill style={{ opacity: w3 }}><LogoTicker frame={frame} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
