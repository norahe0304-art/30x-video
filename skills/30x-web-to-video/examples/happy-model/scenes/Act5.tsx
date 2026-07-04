/**
 * [INPUT]: remotion 原语, theme, Atmosphere, SplitText, public/brand/logo.png, copy.{TAGLINE,SUB_LINE,PRIMARY_CTA,HOST}
 * [OUTPUT]: Act5 — Close: 代码世界收尾 (Atmosphere 网格地平线 + 右侧远景线框 M 静静发光) + 左半 lockup (巨型 tagline + 副句 + CTA), 末帧不黑场
 * [POS]: 第五幕 / 收尾 CTA v4 — 照片底图全退场 ("不要原图"), 复用 Act1 线框脚手架语言首尾呼应; lockup 布局不动
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";
import { HOST, PRIMARY_CTA, SUB_LINE, TAGLINE } from "./copy";

const G = theme.color.primary;

// ================================================================
// 远景线框 M 脚手架 — 与 Act1 同语言 (六边形 + Y 脊), 首尾呼应
// 相对 520 视窗的等距立方体顶点
// ================================================================
const WSIZE = 520;
const T = [260, 26] as const;
const NE = [475, 150] as const;
const SE = [475, 370] as const;
const B = [260, 494] as const;
const SW = [45, 370] as const;
const NW = [45, 150] as const;
const C = [260, 274] as const;

const EDGES: ReadonlyArray<[readonly [number, number], readonly [number, number], number]> = [
  [T, NE, 6],
  [NE, SE, 12],
  [SE, B, 18],
  [T, NW, 9],
  [NW, SW, 15],
  [SW, B, 21],
  [NW, C, 30],
  [NE, C, 32],
  [C, B, 36],
];

export const Act5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 远景线框世界 — 缓慢逼近 + 呼吸, 末帧仍在运动感里
  const worldZoom = interpolate(frame, [0, 199], [1, 1.06], {
    easing: Easing.out(Easing.quad),
  });
  const worldBreathe = interpolate(Math.sin(frame / 46), [-1, 1], [0.75, 1]);

  const logoEnter = spring({ frame: frame - 30, fps, config: { damping: 16, stiffness: 90, mass: 0.9 } });
  const subFade = interpolate(frame, [86, 106], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaEnter = spring({
    frame: frame - 100,
    fps,
    config: { damping: 18, stiffness: 100, mass: 0.9 },
  });
  const hostFade = interpolate(frame, [126, 146], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // CTA shimmer (全片第 2 处, 也是最后一处)
  const sweepX = interpolate(frame, [132, 158], [-80, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const sweepAlpha = interpolate(frame, [132, 138, 152, 158], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#000000", overflow: "hidden" }}>
      {/* 代码世界铺底 — 网格地平线 + 体积雾 (Act1 同款氛围底座) */}
      <Atmosphere intensity={0.85} horizonY={0.8} />

      {/* 右侧远景线框 M — 低调发光的世界坐标, 不抢 CTA */}
      <div
        style={{
          position: "absolute",
          left: 1180,
          top: 168,
          width: WSIZE,
          height: WSIZE,
          transform: `scale(${worldZoom})`,
          transformOrigin: "center 78%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: WSIZE / 2 - 330,
            top: WSIZE / 2 - 330,
            width: 660,
            height: 660,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${G} 0%, transparent 60%)`,
            opacity: 0.1 * worldBreathe,
            filter: "blur(60px)",
          }}
        />
        <svg width={WSIZE} height={WSIZE} viewBox={`0 0 ${WSIZE} ${WSIZE}`} style={{ position: "absolute", inset: 0 }}>
          {EDGES.map(([a, b, delay], i) => {
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const draw = interpolate(frame - delay, [0, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.cubic),
            });
            const isSpine = i >= 6;
            return (
              <line
                key={i}
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={isSpine ? G : "rgba(248,250,252,0.3)"}
                strokeWidth={isSpine ? 1.7 : 1.2}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - draw)}
                opacity={isSpine ? 0.6 * worldBreathe + 0.25 : 1}
                style={isSpine ? { filter: `drop-shadow(0 0 6px ${G}66)` } : undefined}
              />
            );
          })}
          {[T, NE, SE, B, SW, NW, C].map(([x, y], i) => {
            const on = interpolate(frame - (8 + i * 4), [0, 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return <circle key={i} cx={x} cy={y} r={2.6} fill="#DFFFE2" opacity={on * 0.65} />;
          })}
        </svg>
        {/* 地面光池 — 线框 M 站在网格地平线的光里 */}
        <div
          style={{
            position: "absolute",
            left: WSIZE / 2 - 300,
            top: WSIZE - 40,
            width: 600,
            height: 120,
            borderRadius: "50%",
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${G}30 0%, transparent 70%)`,
            filter: "blur(30px)",
            opacity: 0.8 * worldBreathe,
          }}
        />
      </div>

      {/* 左半轻压 — lockup 席位对比度保险, 不是照片压暗 */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 40%, transparent 66%)",
          pointerEvents: "none",
        }}
      />

      {/* 左半 lockup — 品牌锚 → 巨型 tagline (roll 35.1-36.15s 逐字瀑布) → 副句 → CTA */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 0,
          bottom: 0,
          width: 1020,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 34,
        }}
      >
        <Img
          src={staticFile("brand/logo.png")}
          style={{
            width: 108,
            height: 108,
            opacity: logoEnter,
            transform: `translateY(${interpolate(logoEnter, [0, 1], [14, 0])}px)`,
            filter: `drop-shadow(0 0 26px ${G}66)`,
            mixBlendMode: "screen", // logo.png 黑底透掉, 只留发光 M
          }}
        />
        <div
          style={{
            fontSize: 210,
            lineHeight: 0.98,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            letterSpacing: "-0.05em",
            color: theme.color.text,
            textShadow: "0 4px 60px rgba(0,0,0,0.8)",
          }}
        >
          <SplitText text={TAGLINE + "."} delay={52} staggerFrames={1.4} distance={30} />
        </div>
        <div
          style={{
            fontSize: 42,
            fontFamily: theme.font.body,
            fontWeight: 400,
            color: "rgba(255,255,255,0.82)",
            letterSpacing: "0.01em",
            opacity: subFade,
          }}
        >
          {SUB_LINE}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            marginTop: 14,
            opacity: ctaEnter,
            transform: `translateY(${interpolate(ctaEnter, [0, 1], [22, 0])}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "22px 62px",
              borderRadius: 999,
              background: G,
              color: "#000000",
              fontSize: 34,
              fontFamily: theme.font.body,
              fontWeight: 600,
              letterSpacing: "0.01em",
              boxShadow: `0 0 60px ${G}55, 0 0 140px ${G}22`,
            }}
          >
            {PRIMARY_CTA}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 64,
                transform: `translateX(${sweepX}px) rotate(12deg)`,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                opacity: sweepAlpha,
              }}
            />
          </div>
          <div
            style={{
              fontSize: theme.fontSize.caption,
              color: "rgba(255,255,255,0.72)",
              fontFamily: theme.font.body,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              opacity: hostFade,
            }}
          >
            {HOST}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
