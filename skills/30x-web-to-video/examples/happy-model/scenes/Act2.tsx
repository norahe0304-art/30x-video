/**
 * [INPUT]: remotion 原语, theme, Atmosphere, SplitText
 * [OUTPUT]: Act2 — Problem 碎片风暴(透视纵深) + 185px 字排 → 绿光收束: 碎片被拉向画面深处消失 (收束启动 @local100 = 全局 f251 downbeat)
 * [POS]: 第二幕 / problem→solution 半拍 v3 — 照片底板全退场 ("不要原图"), 代码世界自己扛; 收束点即 Act3 中继核心席位, 叙事直接交棒
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { SplitText } from "../components/Animations";
import { theme } from "../theme";

const easeOutExpo = Easing.out(Easing.exp);
const G = theme.color.primary;

// z = 透视深度: 1.6 贴脸 / 1.0 中景 / 0.55 远景(模糊)
type Fragment = { t: string; x: number; y: number; s: number; o: number; z: number };

const FRAGMENTS: Fragment[] = [
  // ── 近景 — 大而锋利, 出血感 ──
  { t: "429 rate_limit_exceeded", x: 55, y: 20, s: 26, o: 0.72, z: 1.6 },
  { t: "api.openai.com/v1/chat/completions", x: 3, y: 10, s: 24, o: 0.62, z: 1.5 },
  { t: "sk-proj-••••••••••••••••", x: 22, y: 84, s: 26, o: 0.6, z: 1.55 },
  { t: "TimeoutError: request timed out", x: 58, y: 88, s: 24, o: 0.62, z: 1.45 },
  { t: "api.anthropic.com/v1/messages", x: 62, y: 6, s: 24, o: 0.55, z: 1.3 },
  // ── 中景 ──
  { t: "generativelanguage.googleapis.com/v1beta", x: 8, y: 76, s: 22, o: 0.5, z: 1.0 },
  { t: "api.deepseek.com/chat/completions", x: 66, y: 78, s: 22, o: 0.5, z: 1.0 },
  { t: "api.x.ai/v1", x: 88, y: 32, s: 26, o: 0.55, z: 1.1 },
  { t: "api.moonshot.cn/v1", x: 36, y: 5, s: 22, o: 0.48, z: 1.0 },
  { t: "api.cohere.com/v2/chat", x: 78, y: 60, s: 22, o: 0.5, z: 1.0 },
  { t: "dashscope.aliyuncs.com/api/v1", x: 2, y: 42, s: 20, o: 0.45, z: 0.95 },
  { t: "401 invalid_api_key", x: 84, y: 14, s: 24, o: 0.52, z: 1.05 },
  { t: "12 invoices · 12 dashboards", x: 42, y: 74, s: 22, o: 0.5, z: 1.0 },
  { t: "Authorization: Bearer sk-…", x: 30, y: 14, s: 22, o: 0.46, z: 0.95 },
  // ── 远景 — 小而虚, 纵深 ──
  { t: "insufficient_quota", x: 48, y: 34, s: 18, o: 0.32, z: 0.55 },
  { t: "x-ratelimit-remaining: 0", x: 12, y: 26, s: 17, o: 0.3, z: 0.5 },
  { t: "POST /v1/chat/completions", x: 70, y: 44, s: 18, o: 0.32, z: 0.55 },
  { t: "model_not_found", x: 88, y: 74, s: 17, o: 0.3, z: 0.5 },
  { t: "retry-after: 30s", x: 6, y: 60, s: 17, o: 0.3, z: 0.5 },
  { t: "status: degraded", x: 52, y: 58, s: 18, o: 0.3, z: 0.55 },
];

// ================================================================
// 收束参数 — @local100 = 全局 f251 downbeat (拍点锚帧不动)
// 收束点 = 画面深处偏右, 与 Act3 中继核心 (1230,510) 同席位 → 转场无缝交棒
// ================================================================
const PULL_START = 100;
const VP = { x: 1265, y: 478 } as const;

export const Act2: React.FC = () => {
  const frame = useCurrentFrame();

  // 氛围: 风暴期收着, 收束完成后调深调满 (代码世界自己扛画面)
  const atmosIntensity = interpolate(frame, [0, PULL_START, 168], [0.5, 0.55, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------- 收束全局量 ----------
  // 绿光束: 从深处射来的一道光, 宣告收束开始
  const beamIn = interpolate(frame, [PULL_START - 2, PULL_START + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const beamOut = interpolate(frame, [PULL_START + 34, PULL_START + 80], [1, 0.14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 收束核心辉光: 吸入越多越亮, 落定后呼吸怠速
  const coreCharge = interpolate(frame, [PULL_START + 4, PULL_START + 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const coreBreathe = interpolate(Math.sin(frame / 26), [-1, 1], [0.8, 1.15]);
  // 吸入冲击感: 核心光一次增压脉冲 (扩散圆环已毙 — Nora 红线: 模板动效)
  const corePulse = interpolate(
    frame,
    [PULL_START + 34, PULL_START + 42, PULL_START + 66],
    [1, 1.55, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
  );

  // 字排退场 — 被同一股引力带走 (轻微位移 + 淡出, 不做变形杂技)
  const headlineExit = interpolate(frame, [PULL_START + 2, PULL_START + 24], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const headlinePull = (1 - headlineExit) * 46;

  // 每个碎片的收束进度 (staggered) — div 与 SVG 束线共用同一真相源
  const pulls = FRAGMENTS.map((f, i) => {
    const conv = interpolate(frame, [PULL_START + i * 1.4, PULL_START + 30 + i * 1.4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
    return { f, i, conv };
  });

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Atmosphere intensity={atmosIntensity} horizonY={0.84} />

      {/* 绿光束 — 从画面深处 (收束点) 斜射入碎片场 */}
      {beamIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: VP.x - 1500,
            top: VP.y - 90,
            width: 1560,
            height: 180,
            background: `linear-gradient(90deg, transparent 0%, ${G}22 40%, ${G}55 82%, ${G}AA 100%)`,
            transform: `rotate(-7deg) scaleX(${beamIn})`,
            transformOrigin: "right center",
            filter: "blur(26px)",
            opacity: beamIn * beamOut * 0.9,
          }}
        />
      ) : null}

      {/* 收束核心 — 混乱被压成一点光 (Act3 中继核心的前身) */}
      <div
        style={{
          position: "absolute",
          left: VP.x - 340,
          top: VP.y - 340,
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${G} 0%, ${G}44 26%, transparent 62%)`,
          opacity: coreCharge * 0.34 * coreBreathe * corePulse,
          filter: "blur(40px)",
        }}
      />
      {coreCharge > 0.15 ? (
        <div
          style={{
            position: "absolute",
            left: VP.x - 9,
            top: VP.y - 9,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#DFFFE2",
            boxShadow: `0 0 26px 8px ${G}CC, 0 0 90px 30px ${G}44`,
            opacity: Math.min(1, coreCharge * 1.4) * coreBreathe,
          }}
        />
      ) : null}

      {/* 束线 + 冲击环 — 碎片沿引力线滑入深处 */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {pulls.map(({ f, i, conv }) => {
          if (conv <= 0 || conv >= 1) return null;
          const px = (f.x / 100) * 1920;
          const py = (f.y / 100) * 1080;
          return (
            <line
              key={i}
              x1={px + conv * (VP.x - px)}
              y1={py + conv * (VP.y - py)}
              x2={px + Math.min(1, conv + 0.22) * (VP.x - px)}
              y2={py + Math.min(1, conv + 0.22) * (VP.y - py)}
              stroke={G}
              strokeWidth={1.6 * f.z}
              opacity={conv * (1 - conv) * 2.4 * 0.55}
            />
          );
        })}
      </svg>

      {/* 碎片群 — 风暴漂移 → 被绿光拉向深处消失 */}
      {pulls.map(({ f, i, conv }) => {
        const appear = interpolate(frame - (4 + i * 2), [0, 10], [0, f.o], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: easeOutExpo,
        });
        // 漂移幅度随深度 — 近景晃得凶, 远景缓慢 (透视运动视差); 收束时引力压过漂移
        const floatAmp = 1 - conv;
        const dx = Math.sin(frame / 30 + i * 1.31) * 16 * f.z * floatAmp;
        const dy = Math.cos(frame / 38 + i * 2.17) * 12 * f.z * floatAmp;
        const rot = Math.sin(frame / 55 + i) * 2.4 * f.z * floatAmp;
        const px = (f.x / 100) * 1920;
        const py = (f.y / 100) * 1080;
        const tx = dx + conv * (VP.x - px);
        const ty = dy + conv * (VP.y - py);
        const scale = 1 - conv * 0.94;
        const alpha = appear * interpolate(conv, [0.72, 0.98], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (alpha <= 0.01) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${f.x}%`,
              top: `${f.y}%`,
              fontSize: f.s * f.z,
              fontFamily: theme.font.mono,
              fontWeight: 400,
              color: conv > 0.3 ? "#A9D8AC" : "#8A8F98",
              opacity: alpha,
              transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})`,
              filter:
                conv > 0.4
                  ? "blur(1.6px)"
                  : f.z < 0.7
                    ? "blur(2px)"
                    : f.z < 1.05
                      ? "blur(0.5px)"
                      : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {f.t}
          </div>
        );
      })}

      {/* 编辑部级字排 — 两行左对齐大字压住风暴; 收束时被同一股引力带走 */}
      {headlineExit > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 100,
            top: 322,
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 185,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: theme.color.text,
            textShadow: "0 4px 50px rgba(0,0,0,0.85)",
            opacity: headlineExit,
            transform: `translateX(${headlinePull}px) scale(${1 - (1 - headlineExit) * 0.04})`,
          }}
        >
          <div>
            <SplitText text="30+ providers." delay={14} staggerFrames={1.2} distance={30} />
          </div>
          <div>
            <SplitText text="30+ APIs." delay={30} staggerFrames={1.2} distance={30} />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
