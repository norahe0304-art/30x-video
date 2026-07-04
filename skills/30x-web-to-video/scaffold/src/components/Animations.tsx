/**
 * [INPUT]: remotion useCurrentFrame/spring/interpolate/Easing
 * [OUTPUT]: FadeIn, ScaleIn, SplitText, Typewriter, CountUp
 * [POS]: 动画原语库, 被所有场景组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

// ================================================================
// easeOutExpo — Apple Keynote 级别的指数减速
// ================================================================
export const easeOutExpo = (t: number) =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

// ================================================================
// FadeIn — 方向性淡入 + 缓动
// ================================================================
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
}> = ({
  children,
  delay = 0,
  duration = 30,
  direction = "up",
  distance = 30,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const translate = {
    up: `translateY(${(1 - progress) * distance}px)`,
    down: `translateY(${(1 - progress) * -distance}px)`,
    left: `translateX(${(1 - progress) * distance}px)`,
    right: `translateX(${(1 - progress) * -distance}px)`,
    none: "none",
  };

  return (
    <div
      style={{
        opacity: progress,
        transform: translate[direction],
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
};

// ================================================================
// ScaleIn — 弹簧缩放入场
// ================================================================
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  from?: number;
  to?: number;
  config?: { damping?: number; stiffness?: number; mass?: number };
}> = ({
  children,
  delay = 0,
  from = 0,
  to = 1,
  config = { damping: 16, stiffness: 80, mass: 0.8 },
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config });
  const scale = from + (to - from) * progress;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity: progress,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
};

// ================================================================
// SplitText — 逐字符弹簧入场 (Premium 标题必用)
//
// 关键: word-aware inline rendering. 单词内部的字符绝不换行 (whiteSpace:
// nowrap), 只允许在单词之间换行. 根容器用 display: inline (不是 flex),
// 这样它在 flex-column 父容器里不会被挤成 min-content -> 每个字符竖排成
// 一列的历史 bug 再也不会发生.
//
// 历史 bug: display: flex + flexWrap: wrap 的旧版本在 flex-column +
// alignItems: center 的父容器里被 shrink 成 min-content, 每个 inline-block
// char 换行 -> headline 变成竖直一列字符. 不要回退.
// ================================================================
export const SplitText: React.FC<{
  text: string;
  delay?: number;
  staggerFrames?: number;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, staggerFrames = 2, distance = 20, style }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  let charIdx = 0;

  return (
    <span style={{ display: "inline", ...style }}>
      {words.map((word, wi) => {
        const chars = word.split("").map((char) => {
          const i = charIdx++;
          const charDelay = delay + i * staggerFrames;
          const progress = spring({
            frame: frame - charDelay,
            fps: 30,
            config: { damping: 20, stiffness: 100 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: `translateY(${(1 - progress) * distance}px)`,
              }}
            >
              {char}
            </span>
          );
        });
        return (
          <React.Fragment key={`w${wi}`}>
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>{chars}</span>
            {wi < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};

// ================================================================
// Typewriter — 真逐字打字效果
// 关键: 全部字符预渲染占位, 未打到的 color:transparent
// 容器尺寸恒定不 reflow, 视觉上是真打字而非文字滑入
// NEVER 用 slice — slice 导致容器宽度变化 = 假打字
// ================================================================
export const Typewriter: React.FC<{
  text: string;
  delay?: number;
  speed?: number;
  cursor?: boolean;
  cursorChar?: string;
  style?: React.CSSProperties;
  visibleColor?: string;
}> = ({
  text,
  delay = 0,
  speed = 2,
  cursor = true,
  cursorChar = "|",
  style,
  visibleColor,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - delay);
  const charCount = Math.min(Math.floor(elapsed * speed), text.length);
  const showCursor = cursor && charCount < text.length && frame % 16 < 10;
  const color = visibleColor || style?.color || "inherit";

  return (
    <span style={style}>
      {text.split("").map((char, i) => (
        <span key={i} style={{
          color: i < charCount ? color : "transparent",
        }}>
          {char}
        </span>
      ))}
      {showCursor && (
        <span style={{ color, opacity: 0.6, marginLeft: -2 }}>{cursorChar}</span>
      )}
    </span>
  );
};

// ================================================================
// CountUp — 数字缓动动画 (数据仪表盘)
// ================================================================
export const CountUp: React.FC<{
  from?: number;
  to: number;
  delay?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({
  from = 0,
  to,
  delay = 0,
  duration = 60,
  prefix = "",
  suffix = "",
  decimals = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = from + (to - from) * progress;

  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {value
        .toFixed(decimals)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
      {suffix}
    </span>
  );
};
