/**
 * [INPUT]: PaperWorld, theme, 真产品 roadmap 语义 (Idea/Initial/Identity 阶段 + 任务卡 + Agent requires approval)
 * [OUTPUT]: Act3b — 底升 roadmap 面板 + human-in-the-loop 批准时刻 (光标点击 Approve, 徽章翻绿)
 * [POS]: 五幕之一 (23.1-30.6s); 家族 approval-task-board; 构图系统 = bottom-rising surface (占 62%)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { PaperWorld } from "./World";

// VO onset (局部帧, act start 688): "nothing ships" 171 · "your approval" 203
const CURSOR_START = 168;
const CLICK_AT = 203;
const APPROVED_AT = 212;

type Card = {
  title: string;
  badge?: { label: string; kind: "user" | "agent" | "approval" };
  col: number;
  at: number;
};

// 全部来自 cofounder.co 真 UI 文案 — 不编造
const CARDS: Card[] = [
  { title: "Initial Idea", badge: { label: "User task", kind: "user" }, col: 0, at: 40 },
  { title: "Pick a Company Name", col: 1, at: 52 },
  { title: "Setup Codebase", badge: { label: "Agent task", kind: "agent" }, col: 1, at: 62 },
  { title: "Incorporate LLC", badge: { label: "Agent requires approval", kind: "approval" }, col: 1, at: 94 },
  { title: "Setup Social Presence", col: 2, at: 76 },
  { title: "Buy Domain", badge: { label: "Agent task", kind: "agent" }, col: 2, at: 86 },
  { title: "Open Bank Account", col: 2, at: 104 },
];

const STAGES = ["Idea stage · 1/1", "Initial stage · 0/3", "Identity stage · 0/4"];

const Badge: React.FC<{ card: Card; approved: boolean; pressed: boolean }> = ({
  card,
  approved,
  pressed,
}) => {
  if (!card.badge) return null;
  const k = card.badge.kind;
  if (k === "approval") {
    return approved ? (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderRadius: 9,
          background: "rgba(63,157,78,0.14)",
          color: theme.color.approve,
          fontSize: 19,
          fontWeight: 500,
          fontFamily: theme.font.body,
        }}
      >
        ✓ Approved
      </div>
    ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 9,
            background: "rgba(201,138,43,0.14)",
            color: theme.color.warn,
            fontSize: 18,
            fontWeight: 500,
            fontFamily: theme.font.body,
            whiteSpace: "nowrap",
          }}
        >
          Agent requires approval
        </div>
        <div
          id="approve-btn"
          style={{
            padding: "8px 20px",
            borderRadius: 9,
            background: theme.color.text,
            color: "#FFF",
            fontSize: 19,
            fontWeight: 500,
            fontFamily: theme.font.body,
            transform: `scale(${pressed ? 0.93 : 1})`,
          }}
        >
          Approve
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "inline-block",
        padding: "8px 14px",
        borderRadius: 9,
        background: k === "agent" ? "rgba(62,142,228,0.13)" : "rgba(38,35,35,0.08)",
        color: k === "agent" ? theme.color.primary : theme.color.textBody,
        fontSize: 18,
        fontWeight: 500,
        fontFamily: theme.font.body,
      }}
    >
      {card.badge.label}
    </div>
  );
};

export const Act3b: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame: frame - 6, fps, config: { damping: 17, stiffness: 62 } });
  const headIn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const approved = frame >= APPROVED_AT;
  const pressed = frame >= CLICK_AT && frame < CLICK_AT + 6;

  // 光标: 画外 → Approve 按钮 (目标坐标手校于证据帧)
  const cursorP = interpolate(frame, [CURSOR_START, CLICK_AT - 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ease = 1 - Math.pow(1 - cursorP, 3);
  const cursorX = interpolate(ease, [0, 1], [1560, 1042]);
  const cursorY = interpolate(ease, [0, 1], [1080, 972]);
  const cursorVisible = frame >= CURSOR_START && frame < APPROVED_AT + 26;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperWorld lightX={0.8} confettiSeed={41} />

      {/* headline — 大字承载事件 */}
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 96,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * 30}px)`,
        }}
      >
        <div
          style={{
            fontSize: 108,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            fontFamily: theme.font.heading,
            fontWeight: 500,
            color: theme.color.text,
          }}
        >
          Start with an AI roadmap.
        </div>
      </div>

      {/* 底升 roadmap 面板 — 底边出血 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: 1560,
          transform: `translateX(-50%) translateY(${(1 - rise) * 640}px)`,
          background: "rgba(255,255,255,0.97)",
          border: `1.5px solid ${theme.color.border}`,
          borderBottom: "none",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -24px 90px rgba(38,35,35,0.13)",
          padding: "44px 54px 48px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 40 }}>
          {STAGES.map((stage, col) => (
            <div key={stage} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  fontFamily: theme.font.mono,
                  fontSize: 20,
                  color: theme.color.textMuted,
                  paddingBottom: 14,
                  borderBottom: `1.5px solid ${theme.color.border}`,
                }}
              >
                {stage}
              </div>
              {CARDS.filter((c) => c.col === col).map((card) => {
                const pop = spring({
                  frame: frame - card.at,
                  fps,
                  config: { damping: 15, stiffness: 120, mass: 0.8 },
                });
                const isApproval = card.badge?.kind === "approval";
                const lift = isApproval && frame >= CURSOR_START && !approved;
                return (
                  <div
                    key={card.title}
                    style={{
                      padding: "24px 26px",
                      background: theme.color.panel,
                      border: `1.5px solid ${
                        lift ? theme.color.warn : approved && isApproval ? theme.color.approve : theme.color.border
                      }`,
                      borderRadius: 14,
                      boxShadow: lift
                        ? "0 14px 44px rgba(201,138,43,0.2)"
                        : "0 6px 22px rgba(38,35,35,0.06)",
                      opacity: Math.min(1, pop * 1.2),
                      transform: `translateY(${(1 - pop) * 36}px) scale(${
                        lift ? 1.03 : 1
                      })`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 27,
                        fontFamily: theme.font.heading,
                        fontWeight: 500,
                        color: theme.color.text,
                      }}
                    >
                      {card.title}
                    </div>
                    <Badge card={card} approved={approved} pressed={pressed} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 光标 */}
      {cursorVisible ? (
        <svg
          width={34}
          height={38}
          viewBox="0 0 24 26"
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            filter: "drop-shadow(0 4px 10px rgba(38,35,35,0.4))",
          }}
        >
          <path
            d="M3 2 L3 20 L8 15.5 L11.5 23 L14.8 21.4 L11.3 14.2 L18 13.6 Z"
            fill="#262323"
            stroke="#FFFFFF"
            strokeWidth={1.6}
          />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
