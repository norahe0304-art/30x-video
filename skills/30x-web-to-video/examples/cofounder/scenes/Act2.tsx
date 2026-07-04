/**
 * [INPUT]: PaperWorld 底座, theme, 站上 H1 原文 "run an entire company with AI"
 * [OUTPUT]: Act2 — 编辑部纸面巨字排: 三行阶梯 stack, "AI" 像素天空蓝
 * [POS]: 五幕之一 (5.5-11.2s); 家族 editorial-type-paper; 构图系统 = oversized-type stack (Law 3, 200-320px)
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

const LINES: { text: string; size: number; accentFrom?: number }[] = [
  { text: "Run an entire", size: 150 },
  { text: "company", size: 268 },
  { text: "with AI.", size: 268, accentFrom: 5 }, // "AI." 上蓝
];

const Line: React.FC<{ line: (typeof LINES)[number]; delay: number }> = ({ line, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 17, stiffness: 82, mass: 1.0 } });
  return (
    <div style={{ overflow: "hidden", padding: "0.06em 0" }}>
      <div
        style={{
          fontSize: line.size,
          lineHeight: 0.96,
          letterSpacing: "-0.028em",
          wordSpacing: "0.08em",
          fontFamily: theme.font.heading,
          fontWeight: 500,
          color: theme.color.text,
          transform: `translateY(${(1 - p) * 108}%)`,
          whiteSpace: "nowrap",
        }}
      >
        {line.accentFrom == null ? (
          line.text
        ) : (
          <>
            {line.text.slice(0, line.accentFrom)}
            <span style={{ color: theme.color.primary }}>{line.text.slice(line.accentFrom)}</span>
          </>
        )}
      </div>
    </div>
  );
};

export const Act2: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 170], [0, -26], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperWorld lightX={0.24} confettiSeed={13} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 108,
          transform: `translateY(${settle}px)`,
        }}
      >
        <Line line={LINES[0]} delay={4} />
        <Line line={LINES[1]} delay={12} />
        <Line line={LINES[2]} delay={20} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
