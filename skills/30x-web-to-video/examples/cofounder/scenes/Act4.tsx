/**
 * [INPUT]: PaperWorld, theme, 站上原句 "over 10,650 companies are running on Cofounder", cf-customer-*.png (官方 case-study wordmark)
 * [OUTPUT]: Act4 — 巨数字建筑化 count-up (Departure Mono 像素数字) + 真客户行
 * [POS]: 五幕之一 (34.2-38.5s); 家族 pixel-mono-countup + customer-row; 构图系统 = oversized-type + 底部细线行
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";
import { PaperWorld } from "./World";

const TARGET = 10650;
const COUNT_START = 20;
const COUNT_END = 64; // "companies" 落词前收口 — hold-then-snap

export const Act4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = interpolate(frame, [COUNT_START, COUNT_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3.2);
  const value = Math.round(TARGET * eased);
  const snap = spring({ frame: frame - COUNT_END, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const snapScale = 1 + (frame >= COUNT_END ? (1 - snap) * 0.035 : 0);

  const labelIn = spring({ frame: frame - 64, fps, config: { damping: 17, stiffness: 100 } });
  const numIn = spring({ frame: frame - COUNT_START + 6, fps, config: { damping: 18, stiffness: 90 } });

  const customers: { kind: "img" | "text"; src?: string; label?: string; h?: number }[] = [
    { kind: "img", src: "brand/cf-customer-activegraph.png", h: 44 },
    { kind: "img", src: "brand/cf-customer-veery.png", h: 40 },
    { kind: "text", label: "LearnPath" },
    { kind: "text", label: "Valence OS" },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperWorld lightX={0.5} confettiSeed={67} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          paddingBottom: 130,
        }}
      >
        <div
          style={{
            fontFamily: theme.font.mono,
            fontSize: 314,
            lineHeight: 1,
            color: theme.color.text,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
            opacity: numIn,
            transform: `scale(${snapScale})`,
          }}
        >
          {value.toLocaleString("en-US")}
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            color: theme.color.textBody,
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * 22}px)`,
          }}
        >
          companies are running on{" "}
          <span style={{ color: theme.color.text }}>Cofounder</span>
        </div>
      </AbsoluteFill>

      {/* 真客户行 — 无框细线, 官方 case-study wordmark */}
      <div
        style={{
          position: "absolute",
          left: 108,
          right: 108,
          bottom: 88,
          borderTop: `1.5px solid ${theme.color.border}`,
          paddingTop: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {customers.map((c, i) => {
          const cIn = spring({
            frame: frame - 68 - i * 5,
            fps,
            config: { damping: 17, stiffness: 110 },
          });
          return (
            <div
              key={i}
              style={{
                opacity: cIn,
                transform: `translateY(${(1 - cIn) * 20}px)`,
                display: "flex",
                alignItems: "center",
              }}
            >
              {c.kind === "img" ? (
                <Img
                  src={staticFile(c.src!)}
                  style={{ height: c.h, width: "auto", filter: "brightness(0.45) saturate(0.6)" }}
                />
              ) : (
                <span
                  style={{
                    fontSize: 33,
                    fontFamily: theme.font.heading,
                    fontWeight: 500,
                    color: theme.color.text,
                  }}
                >
                  {c.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
