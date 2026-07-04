/**
 * [INPUT]: remotion 原语 + TransitionSeries, theme, Atmosphere, SplitText, generated/provider-logos (官方 mark), public/brand/logo.png
 * [OUTPUT]: Act3 — "relay station" 世界: 八家模型 官方logo+名字 做流光数据束汇入 3D M → BASE_URL 大终端从底部升起 (v5: 终端段 162f 打字提速, 总长 335f 让位 Act4)
 * [POS]: 第三幕 / solution 主叙事; v3 — 照片底纹退场 (Atmosphere+代码流光自扛), section tag 已毙; 药丸连线图已枪毙
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
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { ProviderLogo } from "../generated/provider-logos";
import { theme } from "../theme";

const T_FADE = 12;
const G = theme.color.primary;

// ================================================================
// Act 3a — Relay world: 数据束从画面外汇入 3D M 中继核心
//   汇聚落定 local 113 = 全局 f480 = SURGE t=16 (锚点不动)
// ================================================================
const M_X = 1230;
const M_Y = 510;
const M_SIZE = 680;
const CONVERGE_END = 113;

type Provider = { name: string; x: number; y: number; s: number; dim: number };
const PROVIDERS: Provider[] = [
  { name: "OpenAI", x: 110, y: 140, s: 64, dim: 0 },
  { name: "Claude", x: 430, y: 296, s: 56, dim: 0.15 },
  { name: "Gemini", x: 70, y: 442, s: 72, dim: 0 },
  { name: "DeepSeek", x: 350, y: 588, s: 52, dim: 0.2 },
  { name: "Qwen", x: 130, y: 730, s: 62, dim: 0.05 },
  { name: "Grok", x: 520, y: 852, s: 46, dim: 0.35 },
  { name: "Kimi", x: 610, y: 66, s: 44, dim: 0.35 },
  { name: "Cohere", x: 690, y: 660, s: 40, dim: 0.45 },
];

// 二次贝塞尔取点 — 光脉冲沿束流动
const qx = (t: number, a: number, c: number, b: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

const RelayWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mEnter = spring({ frame: frame - 24, fps, config: { damping: 16, stiffness: 72, mass: 1 } });
  // SURGE t=16 (local 113): 中继核心受能一震
  const mPop = spring({ frame: frame - CONVERGE_END, fps, config: { damping: 13, stiffness: 130, mass: 0.8 } });
  const mScale = interpolate(mEnter, [0, 1], [0.86, 1]) * (1 + mPop * 0.05);
  const mGlow = interpolate(Math.sin(frame / 34), [-1, 1], [0.55, 0.85]) + mPop * 0.5;

  // 每家 provider 的当前几何 — div 与 SVG 束共用同一真相源
  const streams = PROVIDERS.map((p, i) => {
    const enter = spring({
      frame: frame - (6 + i * 5),
      fps,
      config: { damping: 17, stiffness: 64, mass: 1 },
    });
    const conv = interpolate(frame, [70 + i * 1.5, 104 + i * 1.1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const floatAmp = 1 - conv;
    const fx = Math.sin(frame / 44 + i * 1.7) * 8 * floatAmp;
    const fy = Math.cos(frame / 51 + i * 2.3) * 7 * floatAmp;
    const settledX = p.x + (1 - enter) * -460 + fx;
    const settledY = p.y + fy;
    const x = interpolate(conv, [0, 1], [settledX, M_X - 60]);
    const y = interpolate(conv, [0, 1], [settledY, M_Y]);
    const scale = interpolate(conv, [0, 1], [1, 0.4]);
    const alpha = enter * interpolate(conv, [0.8, 1], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const w = p.name.length * p.s * 0.56 + p.s * 1.2; // logo + 文本宽度近似 — 束流锚在词尾
    // 束流起点: 汇聚时名字飞入 M, 束流从词尾"脱钩"退回画面外左缘 —
    // 名字被吸收后, 8 条数据流仍从画外持续涌入 (左场永不真空)
    const sx = interpolate(conv, [0, 1], [x + w * scale + 22, -80]);
    const sy = interpolate(conv, [0, 1], [y + p.s * 0.55 * scale, p.y + 24]);
    const beamDraw = interpolate(frame - (34 + i * 3), [0, 24], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    return { p, i, x, y, scale, alpha, enter, sx, sy, beamDraw, conv };
  });

  // 汇聚后: 输出束从 M 射向画面右缘 (冲击感由 mPop scale + 背光增压表达, 扩散圆环已毙 — 模板动效)
  const outDraw = interpolate(frame, [CONVERGE_END, 127], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Atmosphere intensity={1} horizonY={0.78} />

      {/* M 核心背光 — 体积辉光, 汇聚时增压 */}
      <div
        style={{
          position: "absolute",
          left: M_X - 520,
          top: M_Y - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${G} 0%, transparent 58%)`,
          opacity: (0.13 + mPop * 0.1) * mEnter,
          filter: "blur(70px)",
        }}
      />

      {/* 左场补雾 — 束流区不许是真空 */}
      <div
        style={{
          position: "absolute",
          left: "-14%",
          top: "8%",
          width: "62%",
          height: "84%",
          background: `radial-gradient(ellipse 55% 45% at 40% 48%, ${G}16 0%, transparent 68%)`,
          filter: "blur(60px)",
        }}
      />

      {/* 数据束 + 光脉冲 + 输出束 */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {streams.map(({ p, i, sx, sy, beamDraw, enter, conv }) => {
          if (beamDraw <= 0) return null;
          const cpx = (sx + M_X) / 2 + 30;
          const cpy = (sy + M_Y) / 2 + (M_Y - sy) * 0.2;
          const ex = M_X - 150;
          const ey = M_Y + (sy - M_Y) * 0.08;
          const d = `M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}`;
          const pulseSpeed = interpolate(conv, [0, 1], [0.011, 0.024]);
          const beamAlpha = enter * (0.3 + conv * 0.32);
          return (
            <g key={p.name}>
              <path
                d={d}
                fill="none"
                stroke={G}
                strokeWidth={1.6 + conv * 1.4}
                strokeDasharray={2400}
                strokeDashoffset={2400 * (1 - beamDraw)}
                opacity={beamAlpha}
              />
              {beamDraw > 0.98
                ? [0, 0.5].map((off) => {
                    const t = ((frame - 34) * pulseSpeed + i * 0.37 + off) % 1;
                    return (
                      <circle
                        key={off}
                        cx={qx(t, sx, cpx, ex)}
                        cy={qx(t, sy, cpy, ey)}
                        r={3.4 + conv * 1.6}
                        fill="#DFFFE2"
                        opacity={enter * 0.9}
                        style={{ filter: `drop-shadow(0 0 8px ${G})` }}
                      />
                    );
                  })
                : null}
            </g>
          );
        })}
        {/* 输出束 — 一条线出去, 这就是产品: 宽光带 + 亮核 + 外发脉冲 */}
        {outDraw > 0 ? (
          <g>
            <rect
              x={M_X + 190}
              y={M_Y - 44}
              width={(1920 - M_X - 110) * outDraw}
              height={88}
              fill="url(#outband)"
              opacity={0.5}
            />
            <line
              x1={M_X + 190}
              y1={M_Y}
              x2={M_X + 190 + (1920 - M_X - 110) * outDraw}
              y2={M_Y}
              stroke={G}
              strokeWidth={3.4}
              opacity={0.95}
              style={{ filter: `drop-shadow(0 0 14px ${G})` }}
            />
            {outDraw > 0.9
              ? [0, 0.5].map((off) => {
                  const t = (frame * 0.02 + off) % 1;
                  return (
                    <circle
                      key={off}
                      cx={M_X + 190 + (1920 - M_X - 110) * t}
                      cy={M_Y}
                      r={5}
                      fill="#DFFFE2"
                      opacity={0.9}
                      style={{ filter: `drop-shadow(0 0 10px ${G})` }}
                    />
                  );
                })
              : null}
          </g>
        ) : null}
        <defs>
          <linearGradient id="outband" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={G} stopOpacity="0" />
            <stop offset="0.5" stopColor={G} stopOpacity="0.35" />
            <stop offset="1" stopColor={G} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* 八家模型 — 官方 mark + 大字, 数据束源头 (不是药丸) */}
      {streams.map(({ p, x, y, scale, alpha }) => (
        <div
          key={p.name}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${x}px, ${y}px) scale(${scale})`,
            transformOrigin: "left center",
            display: "flex",
            alignItems: "center",
            gap: p.s * 0.3,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: p.s,
            letterSpacing: "-0.02em",
            color: "#F2F4F6",
            opacity: alpha * (1 - p.dim * 0.55),
            filter: p.dim > 0.3 ? "blur(1px)" : undefined,
            whiteSpace: "nowrap",
          }}
        >
          <ProviderLogo
            name={p.name.toLowerCase()}
            size={p.s * 0.92}
            color="#F2F4F6"
            style={{ flexShrink: 0 }}
          />
          {p.name}
        </div>
      ))}

      {/* 3D M 中继核心 — 真资产 logo.png, 居中偏右 */}
      <div
        style={{
          position: "absolute",
          left: M_X - M_SIZE / 2,
          top: M_Y - M_SIZE / 2,
          width: M_SIZE,
          height: M_SIZE,
          transform: `scale(${mScale})`,
          opacity: mEnter,
          // screen 混合: logo.png 烘焙的纯黑方底直接消失 (drop-shadow 会描出方形 alpha, 禁用)
          mixBlendMode: "screen",
        }}
      >
        <Img
          src={staticFile("brand/logo.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `brightness(${0.96 + mGlow * 0.12})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ================================================================
// Act 3b — 巨型终端从底部升起 (~60% 画幅), 敲出 BASE_URL
// ================================================================
const TERMINAL_LINES = [
  { prefix: "$ ", text: "export BASE_URL=https://happy-model.com/v1", color: "#EDEDF3" },
  { prefix: "$ ", text: "curl $BASE_URL/models", color: "#EDEDF3" },
  { prefix: "", text: "→ gpt · claude · gemini · deepseek · qwen · grok · kimi · cohere", color: G },
  { prefix: "", text: "✓ 30+ providers · one key · one bill", color: G },
];
const TYPE_DELAY = 24;
const TYPE_SPEED = 3;

const BigTerminal: React.FC = () => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - TYPE_DELAY);

  const starts: number[] = [];
  let accum = 0;
  for (const line of TERMINAL_LINES) {
    starts.push(accum);
    accum += Math.ceil(line.text.length / TYPE_SPEED) + 8;
  }

  return (
    <div
      style={{
        width: "100%",
        height: 640,
        background: "rgba(10,10,10,0.92)",
        border: `1px solid rgba(248,250,252,0.12)`,
        borderBottom: "none",
        borderRadius: "22px 22px 0 0",
        overflow: "hidden",
        boxShadow: `0 -20px 120px ${G}1F, 0 -2px 0 ${G}30 inset`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 30px",
          background: "rgba(255,255,255,0.045)",
          borderBottom: `1px solid rgba(248,250,252,0.09)`,
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: 15, height: 15, borderRadius: 8, background: c }} />
        ))}
        <span
          style={{
            marginLeft: 12,
            fontSize: 26,
            fontFamily: theme.font.mono,
            color: theme.color.textMuted,
          }}
        >
          happy-model — zsh
        </span>
      </div>
      <div style={{ padding: "44px 52px", display: "flex", flexDirection: "column", gap: 14 }}>
        {TERMINAL_LINES.map((line, i) => {
          const lineElapsed = elapsed - starts[i];
          if (lineElapsed < 0) return null;
          const charCount = Math.min(Math.floor(lineElapsed * TYPE_SPEED), line.text.length);
          const isTyping = charCount < line.text.length;
          const showCursor = isTyping && frame % 16 < 10;
          return (
            <div
              key={i}
              style={{ fontSize: 34, fontFamily: theme.font.mono, lineHeight: 1.72, display: "flex" }}
            >
              {line.prefix ? (
                <span style={{ color: "#28C840", marginRight: 14, flexShrink: 0 }}>{line.prefix}</span>
              ) : null}
              <span>
                {showCursor && charCount === 0 ? (
                  <span style={{ color: "#28C840", opacity: 0.8 }}>|</span>
                ) : null}
                {line.text.split("").map((char, ci) => (
                  <React.Fragment key={ci}>
                    <span style={{ color: ci < charCount ? line.color : "transparent" }}>{char}</span>
                    {showCursor && ci === charCount - 1 ? (
                      <span style={{ color: "#28C840", opacity: 0.8 }}>|</span>
                    ) : null}
                  </React.Fragment>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Act3Terminal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: frame - 12, fps, config: { damping: 17, stiffness: 62, mass: 1.05 } });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Atmosphere intensity={0.8} horizonY={0.62} />

      {/* 编辑部级字排 — 站上 72px H1 气场放大; section tag 已毙 ("太 AI 了"), 主张信息住在终端行内 */}
      <div style={{ position: "absolute", left: 110, top: 116 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 200,
            lineHeight: 0.98,
            letterSpacing: "-0.05em",
            fontFamily: theme.font.heading,
            fontWeight: 500,
            color: theme.color.text,
            whiteSpace: "nowrap",
          }}
        >
          <SplitText text="One base URL." delay={8} staggerFrames={2} distance={30} />
        </h2>
      </div>

      {/* 巨型终端 — 从底部升起, 占 ~60% 画幅 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: 1560,
          transform: `translateX(-50%) translateY(${(1 - rise) * 700}px)`,
        }}
      >
        <BigTerminal />
      </div>
    </AbsoluteFill>
  );
};

export const Act3: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={185}>
      <RelayWorld />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: T_FADE })}
    />
    {/* terminal 起点 = 185−12 = local 173; 段长 162f (v5: 打字提速, -80f 让位 Act4 三 beat 扩容) */}
    <TransitionSeries.Sequence durationInFrames={162}>
      <Act3Terminal />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
