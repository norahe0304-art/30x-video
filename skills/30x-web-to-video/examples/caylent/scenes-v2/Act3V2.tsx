/**
 * [INPUT]: remotion 原语, theme, SplitText
 * [OUTPUT]: Act3V2 — 三服务线三世界 (短语切点 local 208/272): Agent 决策图 DAG → GenAI 对话流 → 全出血面积图 (families: agent-decision-graph / chat-stream / edge-chart)
 * [POS]: V2 第三幕; 轮换: 时间轴/token流/统计行已用; 小字预算: 每屏 ≤1 处机器字
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

const MINT = theme.color.primary;
const V2 = 208;
const V3 = 272;

const fadeWin = (frame: number, start: number, end: number) => {
  const i = start === 0 ? 1 : interpolate(frame, [start - 6, start], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = end >= 900 ? 1 : interpolate(frame, [end - 6, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return i * o;
};

const headline: React.CSSProperties = {
  margin: 0,
  fontFamily: theme.font.heading,
  fontWeight: 500,
  fontSize: 150,
  lineHeight: 1,
  letterSpacing: "-0.045em",
  color: theme.color.text,
  whiteSpace: "nowrap",
};

// ── V1: Agent 决策图 — alarm → agent 三分支比选 → 胜出路径点亮 → resolved ──
const NODES = {
  alarm: { x: 300, y: 620, label: "alarm" },
  agent: { x: 760, y: 620, label: "agent" },
  rollback: { x: 1240, y: 460, label: "rollback" },
  scale: { x: 1240, y: 660, label: "scale out" },
  failover: { x: 1240, y: 860, label: "failover" },
  resolved: { x: 1680, y: 460, label: "resolved" },
} as const;
type NodeKey = keyof typeof NODES;
const EDGES: Array<{ from: NodeKey; to: NodeKey; at: number; win?: boolean }> = [
  { from: "alarm", to: "agent", at: 16 },
  { from: "agent", to: "rollback", at: 44, win: true },
  { from: "agent", to: "scale", at: 50 },
  { from: "agent", to: "failover", at: 56 },
  { from: "rollback", to: "resolved", at: 108, win: true },
];

export const AgentGraph: React.FC<{ frame: number }> = ({ frame }) => {
  // 落选分支在决策后沉暗
  const dimLosers = interpolate(frame, [96, 116], [1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const nodeOn = (k: NodeKey) =>
    Math.max(
      k === "alarm" ? interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0,
      ...EDGES.filter((e) => e.to === k).map((e) =>
        interpolate(frame - e.at, [10, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      ),
    );

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 106 }}>
        <h2 style={headline}>
          <SplitText text="Agentic cloud operations." delay={10} staggerFrames={1} distance={26} />
        </h2>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {EDGES.map((e) => {
          const a = NODES[e.from];
          const b = NODES[e.to];
          const draw = interpolate(frame - e.at, [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });
          if (draw <= 0) return null;
          const loser = !e.win && e.from === "agent";
          const midX = (a.x + b.x) / 2;
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={`M${a.x + 120},${a.y} C${midX},${a.y} ${midX},${b.y} ${b.x - 120},${b.y}`}
              fill="none"
              stroke={e.win ? MINT : "rgba(249,249,249,0.4)"}
              strokeWidth={e.win ? 3.2 : 2}
              strokeDasharray={900}
              strokeDashoffset={900 * (1 - draw)}
              opacity={(e.win ? 0.95 : 0.6) * (loser ? dimLosers : 1)}
              style={e.win ? { filter: `drop-shadow(0 0 10px ${MINT}66)` } : undefined}
            />
          );
        })}
      </svg>

      {(Object.keys(NODES) as NodeKey[]).map((k) => {
        const n = NODES[k];
        const on = nodeOn(k);
        if (on <= 0) return null;
        const isWin = k === "resolved";
        const loser = k === "scale" || k === "failover";
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: n.x - 120,
              top: n.y - 44,
              width: 240,
              height: 88,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              border: `1.5px solid ${isWin ? MINT : k === "agent" ? `${MINT}88` : "rgba(249,249,249,0.28)"}`,
              background: isWin ? `${MINT}1A` : "rgba(10,10,10,0.82)",
              fontFamily: theme.font.heading,
              fontWeight: 500,
              fontSize: 40,
              letterSpacing: "-0.01em",
              color: isWin ? MINT : theme.color.text,
              opacity: on * (loser ? dimLosers : 1),
              transform: `scale(${0.9 + on * 0.1})`,
              boxShadow: isWin ? `0 0 40px ${MINT}33` : undefined,
            }}
          >
            {n.label}
          </div>
        );
      })}

      {/* 唯一机器字: 决策置信度 — 胜出瞬间浮现 */}
      <div
        style={{
          position: "absolute",
          left: NODES.rollback.x - 120,
          top: NODES.rollback.y - 96,
          fontFamily: theme.font.mono,
          fontSize: 26,
          color: `${MINT}BB`,
          opacity: interpolate(frame, [96, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        confidence 0.97
      </div>
    </AbsoluteFill>
  );
};

// ── V2: GenAI 对话流 — 产品原生的 chat 界面, 流式回答 ──
const PROMPT = "Summarize today's incidents";
const ANSWER = "One p99 latency breach on api-gw, auto-resolved in 96s by rollback. No customer impact.";
const ChatStream: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - V2;
  const promptIn = interpolate(t, [2, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chars = Math.min(ANSWER.length, Math.floor(Math.max(0, t - 14) * 2.4));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 150 }}>
        <h2 style={headline}>
          <SplitText text="Generative AI," delay={V2 + 2} staggerFrames={1} distance={24} />
        </h2>
        <h2 style={{ ...headline, color: MINT }}>
          <SplitText text="production-grade." delay={V2 + 8} staggerFrames={1} distance={24} />
        </h2>
      </div>
      <div style={{ position: "absolute", left: 380, top: 560, width: 1160, display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            alignSelf: "flex-end",
            padding: "22px 34px",
            borderRadius: "26px 26px 6px 26px",
            background: `${MINT}22`,
            border: `1px solid ${MINT}55`,
            fontFamily: theme.font.body,
            fontSize: 34,
            color: theme.color.text,
            opacity: promptIn,
            transform: `translateY(${(1 - promptIn) * 20}px)`,
          }}
        >
          {PROMPT}
        </div>
        <div
          style={{
            alignSelf: "flex-start",
            maxWidth: 980,
            padding: "26px 38px",
            borderRadius: "26px 26px 26px 6px",
            background: "rgba(20,21,20,0.9)",
            border: "1px solid rgba(249,249,249,0.14)",
            fontFamily: theme.font.body,
            fontSize: 34,
            lineHeight: 1.55,
            color: theme.color.text,
            opacity: t > 12 ? 1 : 0,
          }}
        >
          {ANSWER.slice(0, chars)}
          {chars < ANSWER.length ? <span style={{ color: MINT }}>▌</span> : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── V3: 全出血面积图 — 成本曲线下行, 图即世界 ──
const CHART_PTS = [92, 88, 90, 84, 79, 81, 74, 70, 66, 68, 61, 57, 58, 52, 49, 45, 46, 41, 38, 36];
const EdgeChart: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - V3;
  const draw = interpolate(t, [8, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const n = CHART_PTS.length;
  const px = (i: number) => (i / (n - 1)) * 1920;
  // 值大 = 位置高 → 成本下降曲线视觉向下走 (下行才是 −31% 的正确情绪)
  const py = (v: number) => 400 + ((100 - v) / 100) * 560;
  const shown = Math.max(2, Math.ceil(draw * n));
  const pts = CHART_PTS.slice(0, shown).map((v, i) => `${px(i)},${py(v)}`).join(" L");
  const lastX = px(shown - 1);
  const lastY = py(CHART_PTS[shown - 1]);
  const bigIn = interpolate(t, [88, 104], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 130 }}>
        <h2 style={headline}>
          <SplitText text="Data & modernization." delay={V3 + 2} staggerFrames={1} distance={24} />
        </h2>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={MINT} stopOpacity="0.34" />
            <stop offset="1" stopColor={MINT} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M${pts} L${lastX},1080 L0,1080 Z`} fill="url(#chartfill)" />
        <path d={`M${pts}`} fill="none" stroke={MINT} strokeWidth={4} style={{ filter: `drop-shadow(0 0 14px ${MINT}55)` }} />
        {draw >= 1 ? null : <circle cx={lastX} cy={lastY} r={8} fill="#F4FFE8" style={{ filter: `drop-shadow(0 0 14px ${MINT})` }} />}
      </svg>
      {/* 曲线到底 → 大数字落定 (图的注解, 编辑部尺度非小字) */}
      <div
        style={{
          position: "absolute",
          right: 130,
          top: 330,
          textAlign: "right",
          opacity: bigIn,
          transform: `translateY(${(1 - bigIn) * 26}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 240,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: MINT,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          −31%
        </div>
        <div style={{ fontFamily: theme.font.heading, fontWeight: 400, fontSize: 58, color: "rgba(249,249,249,0.88)", marginTop: 14 }}>
          infrastructure cost
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Act3V2: React.FC = () => {
  const frame = useCurrentFrame();
  const w1 = fadeWin(frame, 0, V2);
  const w2 = fadeWin(frame, V2, V3);
  const w3 = fadeWin(frame, V3, 999);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.28} glowX={34} glowY={32} horizon={0.38} particles={20} />
      {w1 > 0 ? <AbsoluteFill style={{ opacity: w1 }}><AgentGraph frame={frame} /></AbsoluteFill> : null}
      {w2 > 0 && frame > V2 - 8 ? <AbsoluteFill style={{ opacity: w2 }}><ChatStream frame={frame} /></AbsoluteFill> : null}
      {w3 > 0 && frame > V3 - 8 ? <AbsoluteFill style={{ opacity: w3 }}><EdgeChart frame={frame} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
