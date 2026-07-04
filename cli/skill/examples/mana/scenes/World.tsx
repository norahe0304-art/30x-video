/**
 * [INPUT]: theme (MANA 浅底世界 token), remotion 基元, 官方 etoile.svg 的精确路径几何
 * [OUTPUT]: PaperAtmosphere (奶油纸氛围底座) / Sparkle (官方星芒) / TintedMark (真透明 PNG 染色) / MarqueeBand (can 颈带跑马灯) / PillTag (官网胶囊)
 * [POS]: scenes/ 的共享世界基元 — 浅底世界的 Law 1 底座与品牌语汇件
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 浅底世界的氛围推导：暗片的 volumetric light 在奶油纸上不成立。
 * 这里的"零真空"= 纸的世界：暖白顶光呼吸 + 四角暖色加深 + 全局 grain
 * (MainVideo 根级) + 各幕自己的视差元素。禁止黑色重晕影。
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// ================================================================
// PaperAtmosphere — 奶油纸底座: 顶部暖白光呼吸 + 四角暖色加深
// ================================================================
export const PaperAtmosphere: React.FC<{ tint?: string; strength?: number }> = ({
  tint = theme.color.bg,
  strength = 1,
}) => {
  const frame = useCurrentFrame();
  const breathe = 0.5 + 0.5 * Math.sin(frame / 52);
  return (
    <AbsoluteFill style={{ backgroundColor: tint, pointerEvents: "none" }}>
      {/* 暖白顶光 — 光有来源(上方), 缓慢呼吸 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 130% 90% at 50% -14%, rgba(255,255,255,${
            (0.5 + breathe * 0.14) * strength
          }) 0%, rgba(255,255,255,0) 58%)`,
        }}
      />
      {/* 四角暖色加深 — 纸的纵深, 不是黑晕影 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 145% 120% at 50% 46%, rgba(0,0,0,0) 62%, rgba(107,74,20,${
            0.1 * strength
          }) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ================================================================
// Sparkle — 官方 etoile.svg 的精确路径 (fill/stroke 可染)
// ================================================================
export const Sparkle: React.FC<{
  size?: number;
  fill?: string;
  stroke?: string;
  style?: React.CSSProperties;
  pop?: number; // 0-1 入场进度
  spin?: number; // 度
}> = ({ size = 42, fill = theme.color.bg, stroke = theme.color.ink, style, pop = 1, spin = 0 }) => (
  <svg
    width={size}
    height={size * (47 / 42)}
    viewBox="0 0 42 47"
    fill="none"
    style={{ transform: `scale(${pop}) rotate(${spin}deg)`, transformOrigin: "center", ...style }}
  >
    <path
      d="M1 24.8065C12.943 20.1976 17.5419 12.25 21 1C24.4581 12.25 29.057 20.1976 41 24.8065C29.164 28.8347 24.5294 35.1129 21 46C17.5062 35.1129 12.8717 28.8347 1 24.8065Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// SparklePop — 定位好的星芒, spring 弹入 + 微自旋漂浮
export const SparklePop: React.FC<{
  x: number; // 相对画布 px
  y: number;
  size?: number;
  delay?: number;
  fill?: string;
  stroke?: string;
}> = ({ x, y, size = 46, delay = 0, fill, stroke }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const idle = Math.sin((frame - delay) / 34 + x) * 4;
  if (frame < delay) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateY(${idle}px)` }}>
      <Sparkle size={size} pop={pop} spin={idle * 0.8} fill={fill} stroke={stroke} />
    </div>
  );
};

// ================================================================
// TintedMark — 真透明 PNG 染色 (wordmark / 官方 icon)
// 前提: PNG 已经亮度阈值洗成真透明 (media-resolve 铁律), mask 只做染色
// ================================================================
export const TintedMark: React.FC<{
  src: string;
  color: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}> = ({ src, color, width, height, style }) => (
  <div
    style={{
      width,
      height,
      backgroundColor: color,
      WebkitMaskImage: `url(${src})`,
      maskImage: `url(${src})`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      ...style,
    }}
  />
);

// ================================================================
// MarqueeBand — can 颈带跑马灯: "ORGANIC ENERGY INFUSION ✳ ..."
// 来源: can label 顶带的原文 (EN/FR 双语交替 + 星号分隔)
// ================================================================
export const MarqueeBand: React.FC<{
  text?: string;
  bg?: string;
  color?: string;
  height?: number;
  speed?: number; // px/frame
  style?: React.CSSProperties;
}> = ({
  text = "ORGANIC ENERGY INFUSION ✳ INFUSION D'ÉNERGIE BIO ✳ ",
  bg = theme.color.accent,
  color = theme.color.bg,
  height = 64,
  speed = 2.4,
  style,
}) => {
  const frame = useCurrentFrame();
  const chunk = text.repeat(6);
  // 单份宽度未知 → 用超长重复 + 模周期平移 (估 24px/字符 保证覆盖)
  const period = text.length * 24;
  const shift = -((frame * speed) % period);
  return (
    <div
      style={{
        height,
        background: bg,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <div
        style={{
          transform: `translateX(${shift}px)`,
          fontFamily: theme.font.body,
          fontWeight: 500,
          fontSize: height * 0.42,
          letterSpacing: "0.18em",
          color,
        }}
      >
        {chunk}
      </div>
    </div>
  );
};

// ================================================================
// PillTag — 官网胶囊语言 (can 上的 "YERBA MATÉ" 白胶囊 / 官网按钮)
// ================================================================
export const PillTag: React.FC<{
  children: React.ReactNode;
  bg?: string;
  color?: string;
  fontSize?: number;
  shadow?: boolean;
  style?: React.CSSProperties;
}> = ({ children, bg = "#FFFFFF", color = theme.color.ink, fontSize = 26, shadow = false, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: `${fontSize * 0.55}px ${fontSize * 1.5}px`,
      borderRadius: theme.radius.pill,
      background: bg,
      color,
      fontFamily: theme.font.body,
      fontWeight: 500,
      fontSize,
      letterSpacing: "0.12em",
      boxShadow: shadow ? theme.shadow.offset : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

// ================================================================
// easeOutExpo — Apple keynote 手感
// ================================================================
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const riseIn = (frame: number, delay: number, dur = 18) =>
  easeOutExpo(clamp01((frame - delay) / dur));

export { interpolate };
