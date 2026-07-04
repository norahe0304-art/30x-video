/**
 * [INPUT]: remotion 原语, theme, Atmosphere, SplitText
 * [OUTPUT]: Act3 v4 终版 — 三条服务线 (语音短语切点 local 208/272): Agent 决策图 (V1/V2 终审: 语义契合胜时间轴) → GenAI token 流 → 4 格无框统计行
 * [POS]: 第三幕 / showcase; 家族: agent-decision-graph / token-stream-type / borderless-stat-row; 决策图实现住 scenes-v2/Act3V2
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { AgentGraph } from "../scenes-v2/Act3V2";
import { theme } from "../theme";

const MINT = theme.color.primary;
const V2 = 208; // "generative AI" 短语 onset
const V3 = 272; // "data and application" 短语 onset

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

// ── V1: Agentic Ops — 决策图 (终审: 语义契合胜时间轴, 实现住 scenes-v2/Act3V2) ──

// ── V2: GenAI — token 流打字 (LLM 世界的原生动效) + 漂浮代码碎片纵深 ──
const TOKENS = [
  "invoke_model()", "claude-sonnet-5", "temperature: 0.7", "streaming: true",
  "bedrock.agent", "knowledge_base", "guardrails: on", "tokens/s: 214",
  "retrieval", "fine-tune", "agentcore", "prompt_cache",
];
const GenAIMoment: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - V2;
  const TEXT = "Generative AI";
  // token 式逐字上屏 — 3 字/拍, 带块状光标
  const shown = Math.min(TEXT.length, Math.floor(Math.max(0, t - 2) * 0.45 * 3));
  const cursorOn = t % 10 < 6;
  return (
    <AbsoluteFill>
      {/* 漂浮 mono 碎片 — 三层视差纵深, LLM 配置真词汇 */}
      {TOKENS.map((tok, i) => {
        const depth = 0.4 + (i % 3) * 0.3;
        const x = 140 + ((i * 353) % 1640);
        const y = 120 + ((i * 227) % 820) - t * depth * 0.5;
        const a = interpolate(t, [2 + i * 1.5, 12 + i * 1.5], [0, 0.1 + depth * 0.14], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={tok}
            style={{
              position: "absolute",
              left: x,
              top: y,
              fontFamily: theme.font.mono,
              fontSize: 20 + depth * 14,
              color: i % 4 === 0 ? MINT : theme.color.text,
              opacity: a,
              filter: depth < 0.7 ? "blur(1.2px)" : undefined,
            }}
          >
            {tok}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 110, top: 360 }}>
        <h2 style={{ ...headline, fontSize: 216 }}>
          {TEXT.slice(0, shown)}
          <span
            style={{
              display: "inline-block",
              width: 84,
              height: 172,
              marginLeft: 14,
              verticalAlign: "text-bottom",
              background: MINT,
              opacity: cursorOn ? 0.95 : 0.25,
              boxShadow: `0 0 24px ${MINT}88`,
            }}
          />
        </h2>
        <h2 style={{ ...headline, fontSize: 112, color: MINT, marginTop: 20 }}>
          <SplitText text="on Amazon Bedrock" delay={V2 + 16} staggerFrames={1} distance={22} />
        </h2>
      </div>
    </AbsoluteFill>
  );
};

// ── V3: Data & Modernization — 4 格编辑部统计行 (数量决定构图: 4 个一行细线分隔, 无卡片) ──
const STATS = [
  { label: "pipelines migrated", value: "128", trend: "↑ 12%", mint: false },
  { label: "query latency", value: "214ms", trend: "↓ 38%", mint: true },
  { label: "infra cost", value: "−31%", trend: "year one", mint: true },
  { label: "deploy frequency", value: "4×", trend: "↑ weekly → daily", mint: false },
];
const DataDash: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame - V3;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 110, top: 150 }}>
        <h2 style={headline}>
          <SplitText text="Data &" delay={V3 + 2} staggerFrames={1} distance={24} />
        </h2>
        <h2 style={{ ...headline, color: MINT }}>
          <SplitText text="modernization." delay={V3 + 8} staggerFrames={1} distance={24} />
        </h2>
      </div>
      {/* 4 stat 一行 — 细线分隔的编辑部统计行, 逐列升入 */}
      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          bottom: 200,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {STATS.map((s, i) => {
          const enter = interpolate(t - (16 + i * 7), [0, 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div
              key={s.label}
              style={{
                flex: 1,
                paddingLeft: i === 0 ? 0 : 54,
                borderLeft: i === 0 ? "none" : "1px solid rgba(249,249,249,0.14)",
                opacity: enter,
                transform: `translateY(${(1 - enter) * 34}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 24,
                  letterSpacing: "0.05em",
                  color: "rgba(249,249,249,0.52)",
                  marginBottom: 18,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontFamily: theme.font.heading,
                  fontWeight: 500,
                  fontSize: 96,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: s.mint ? MINT : theme.color.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 24,
                  color: `${MINT}CC`,
                  marginTop: 16,
                }}
              >
                {s.trend}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Act3: React.FC = () => {
  const frame = useCurrentFrame();
  const w1 = fadeWin(frame, 0, V2);
  const w2 = fadeWin(frame, V2, V3);
  const w3 = fadeWin(frame, V3, 999);

  return (
    <AbsoluteFill style={{ background: "#0A0A0A" }}>
      <Atmosphere primary={MINT} glow={0.3} glowX={30} glowY={30} horizon={0.4} particles={22} />
      {w1 > 0 ? <AbsoluteFill style={{ opacity: w1 }}><AgentGraph frame={frame} /></AbsoluteFill> : null}
      {w2 > 0 && frame > V2 - 8 ? <AbsoluteFill style={{ opacity: w2 }}><GenAIMoment frame={frame} /></AbsoluteFill> : null}
      {w3 > 0 && frame > V3 - 8 ? <AbsoluteFill style={{ opacity: w3 }}><DataDash frame={frame} /></AbsoluteFill> : null}
    </AbsoluteFill>
  );
};
