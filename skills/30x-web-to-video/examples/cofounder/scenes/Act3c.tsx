/**
 * [INPUT]: PaperWorld, theme, 真产品 email outbound UI 文案 (To Sarah Chen / From Tanner Holloway / Subject… — cfr-6/7 段截屏)
 * [OUTPUT]: Act3c — 外联交接拍: 左巨字 "Hand off." + 右真文案 email 卡 + campaign 机器凭证条
 * [POS]: 五幕之一 (30.6-34.2s); 家族 email-outbound-card; 构图系统 = split composition (硬垂直缝)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { PaperWorld } from "./World";

const ROWS = [
  { k: "To", v: "Sarah Chen", extra: "sarah@acme.com" },
  { k: "From", v: "Tanner Holloway", extra: "tanner.holloway@ridgepoint.io" },
  { k: "Subject", v: "Thought you could use SignalLayer for Acme", extra: "" },
];

export const Act3c: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordIn = spring({ frame: frame - 4, fps, config: { damping: 15, stiffness: 95, mass: 0.9 } });
  const cardIn = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 80 } });
  const stripIn = spring({ frame: frame - 58, fps, config: { damping: 15, stiffness: 110 } });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperWorld lightX={0.3} confettiSeed={53} />

      {/* 左列 — 巨字 */}
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 0,
          bottom: 0,
          width: 660,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 178,
            lineHeight: 0.95,
            letterSpacing: "-0.045em",
            fontFamily: theme.font.heading,
            fontWeight: 500,
            color: theme.color.text,
            opacity: wordIn,
            transform: `translateX(${(1 - wordIn) * -70}px)`,
          }}
        >
          Hand
          <br />
          <span style={{ color: theme.color.primary }}>off.</span>
        </div>
      </div>

      {/* 垂直缝 */}
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 120,
          bottom: 120,
          width: 1.5,
          background: theme.color.border,
          opacity: cardIn,
        }}
      />

      {/* 右列 — email 卡 (真产品 demo 文案) */}
      <div
        style={{
          position: "absolute",
          left: 880,
          top: "50%",
          width: 930,
          transform: `translateY(-50%) translateX(${(1 - cardIn) * 320}px)`,
          opacity: cardIn,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div
          style={{
            background: theme.color.panel,
            border: `1.5px solid ${theme.color.border}`,
            borderRadius: 18,
            boxShadow: "0 22px 70px rgba(38,35,35,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 30px",
              borderBottom: `1.5px solid ${theme.color.border}`,
              fontSize: theme.fontSize.mockupTitle,
              fontFamily: theme.font.heading,
              fontWeight: 500,
              color: theme.color.text,
            }}
          >
            Email Preview
          </div>
          <div style={{ padding: "10px 30px 26px" }}>
            {ROWS.map((row, i) => {
              const rowIn = spring({
                frame: frame - 20 - i * 7,
                fps,
                config: { damping: 17, stiffness: 130 },
              });
              return (
                <div
                  key={row.k}
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "baseline",
                    padding: "16px 0",
                    borderBottom: i < ROWS.length - 1 ? `1px solid ${theme.color.border}` : "none",
                    opacity: rowIn,
                    transform: `translateY(${(1 - rowIn) * 16}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      fontSize: theme.fontSize.mockupRow,
                      color: theme.color.textMuted,
                      fontFamily: theme.font.body,
                    }}
                  >
                    {row.k}
                  </div>
                  <div
                    style={{
                      fontSize: 21,
                      color: theme.color.text,
                      fontFamily: theme.font.body,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.v}
                    {row.extra ? (
                      <span style={{ color: theme.color.textMuted, fontWeight: 400, marginLeft: 14 }}>
                        {row.extra}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {/* 正文 — 真 demo 邮件首句 */}
            <div
              style={{
                paddingTop: 18,
                fontSize: 17,
                lineHeight: 1.55,
                color: theme.color.textBody,
                fontFamily: theme.font.body,
                opacity: spring({ frame: frame - 44, fps, config: { damping: 18, stiffness: 110 } }),
              }}
            >
              Hey Sarah,
              <br />
              I've been following how quickly your team at Acme has been shipping — going from a
              single product to a full suite in under a year is seriously impressive.
            </div>
          </div>
        </div>

        {/* campaign 机器凭证 — 一处 mono 聚落 */}
        <div
          style={{
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 24px",
            background: "rgba(255,255,255,0.92)",
            border: `1px solid ${theme.color.border}`,
            borderRadius: 12,
            fontFamily: theme.font.mono,
            fontSize: 20,
            color: theme.color.textMuted,
            opacity: stripIn,
            transform: `translateY(${(1 - stripIn) * 22}px)`,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              background: theme.color.accent,
              display: "inline-block",
            }}
          />
          <span>Sales outreach campaign</span>
          <span style={{ color: theme.color.text }}>1/3</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
