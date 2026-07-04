/**
 * [INPUT]: @remotion/transitions 自定义 presentation API, React
 * [OUTPUT]: 7 个转场家族 — whipPan / maskWipe / push / zoomPunch / blurDissolve / flashThrough / glitchCut
 * [POS]: scaffold 组件库的转场层; 还"全片 fade"的债 (对标 hyperframes transitions-* 12 家族的高频子集)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 用法 (与 fade() 同位替换):
 *   <TransitionSeries.Transition presentation={whipPan({ direction: "left" })} timing={linearTiming({ durationInFrames: 10 })} />
 * 选型指南:
 *   fade         — 默认呼吸 (慢, 稳)                whipPan   — 高能量段落切换 (8-12f, 踩拍)
 *   maskWipe     — 章节感 (12-16f)                  push      — 平移叙事/并列关系 (10-14f)
 *   zoomPunch    — 落重点/reveal (10-14f)           blurDissolve — 梦境/时间流逝 (16-24f)
 *   flashThrough — keynote 大厂闪切 (6-10f)          glitchCut — 科技/故障语义 (6-8f, 慎用)
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

type Dir = "left" | "right" | "up" | "down";
const VEC: Record<Dir, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
};

// 进出双方共用的包装 — progress ∈ [0,1], entering 从 1-p 侧进, exiting 向 p 侧出
const wrap = (style: React.CSSProperties, children: React.ReactNode) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);

// ── 1. whipPan — 快速甩镜: 平移 + 方向模糊, 高能量切换 ──────────────
type WhipProps = { direction?: Dir };
const WhipComp: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const [dx, dy] = VEC[passedProps.direction ?? "left"];
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  const shift = isIn ? (1 - p) * -100 : p * 100;
  // 模糊在中段最强 — 甩动感
  const blur = Math.sin(p * Math.PI) * 26;
  return wrap(
    {
      transform: `translate(${dx * shift}%, ${dy * shift}%)`,
      filter: `blur(${Math.abs(dx) * blur}px) blur(${Math.abs(dy) * blur}px)`,
    },
    children,
  );
};
export const whipPan = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({
  component: WhipComp,
  props,
});

// ── 2. maskWipe — 定向遮罩揭示: 章节切换的仪式感 ────────────────────
type WipeProps = { direction?: Dir; softEdgePx?: number };
const WipeComp: React.FC<TransitionPresentationComponentProps<WipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  if (presentationDirection === "exiting") return wrap({}, children);
  const d = passedProps.direction ?? "left";
  const p = presentationProgress * 100;
  const inset =
    d === "left" ? `0 ${100 - p}% 0 0` :
    d === "right" ? `0 0 0 ${100 - p}%` :
    d === "up" ? `0 0 ${100 - p}% 0` :
    `${100 - p}% 0 0 0`;
  return wrap({ clipPath: `inset(${inset})` }, children);
};
export const maskWipe = (props: WipeProps = {}): TransitionPresentation<WipeProps> => ({
  component: WipeComp,
  props,
});

// ── 3. push — 新画面推走旧画面: 并列叙事 ────────────────────────────
type PushProps = { direction?: Dir };
const PushComp: React.FC<TransitionPresentationComponentProps<PushProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const [dx, dy] = VEC[passedProps.direction ?? "left"];
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  const shift = isIn ? (1 - p) * -100 : p * 100;
  return wrap({ transform: `translate(${-dx * shift}%, ${-dy * shift}%)` }, children);
};
export const push = (props: PushProps = {}): TransitionPresentation<PushProps> => ({
  component: PushComp,
  props,
});

// ── 4. zoomPunch — 冲镜: 旧画面放大穿过, 新画面从深处落定 ───────────
type ZoomProps = { intensity?: number };
const ZoomComp: React.FC<TransitionPresentationComponentProps<ZoomProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const k = passedProps.intensity ?? 1;
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  const scale = isIn ? 0.86 + p * 0.14 : 1 + p * 0.18 * k;
  const opacity = isIn ? Math.min(1, p * 1.6) : 1 - p * p;
  const blur = isIn ? (1 - p) * 8 : p * 14 * k;
  return wrap({ transform: `scale(${scale})`, opacity, filter: `blur(${blur}px)` }, children);
};
export const zoomPunch = (props: ZoomProps = {}): TransitionPresentation<ZoomProps> => ({
  component: ZoomComp,
  props,
});

// ── 5. blurDissolve — 焦外溶解: 时间流逝/柔和章节 ──────────────────
type BlurProps = { maxBlurPx?: number };
const BlurComp: React.FC<TransitionPresentationComponentProps<BlurProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const m = passedProps.maxBlurPx ?? 22;
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  return wrap(
    {
      opacity: isIn ? p : 1 - p,
      filter: `blur(${(isIn ? 1 - p : p) * m}px)`,
    },
    children,
  );
};
export const blurDissolve = (props: BlurProps = {}): TransitionPresentation<BlurProps> => ({
  component: BlurComp,
  props,
});

// ── 6. flashThrough — 闪白/闪品牌色穿越: keynote 式硬切 ─────────────
type FlashProps = { color?: string };
const FlashComp: React.FC<TransitionPresentationComponentProps<FlashProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  // 闪光钟形: 中点最亮 — 只在 entering 层画一次, 覆盖双方
  const flash = Math.pow(Math.sin(p * Math.PI), 2.2);
  return (
    <AbsoluteFill style={{ opacity: isIn ? (p > 0.5 ? 1 : 0) : p > 0.5 ? 0 : 1 }}>
      {children}
      {isIn ? (
        <AbsoluteFill style={{ background: passedProps.color ?? "#FFFFFF", opacity: flash * 0.92, pointerEvents: "none" }} />
      ) : null}
    </AbsoluteFill>
  );
};
export const flashThrough = (props: FlashProps = {}): TransitionPresentation<FlashProps> => ({
  component: FlashComp,
  props,
});

// ── 7. glitchCut — RGB 通道错位数帧: 科技/故障语义, 慎用 ────────────
type GlitchProps = { amountPx?: number };
const GlitchComp: React.FC<TransitionPresentationComponentProps<GlitchProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const amt = passedProps.amountPx ?? 14;
  const p = presentationProgress;
  const isIn = presentationDirection === "entering";
  if (!isIn) return wrap({ opacity: p > 0.5 ? 0 : 1 }, children);
  const energy = Math.sin(p * Math.PI); // 中段错位最猛
  // 确定性抖动 — 由 progress 离散档驱动, 无随机
  const step = Math.floor(p * 7);
  const jx = ((step * 37) % 5) - 2;
  const off = energy * amt;
  return (
    <AbsoluteFill style={{ opacity: p > 0.5 ? 1 : 0 }}>
      <AbsoluteFill style={{ transform: `translateX(${jx - off}px)`, mixBlendMode: "screen", filter: "url(#glitch-r)" }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${jx + off}px)`, mixBlendMode: "screen", filter: "url(#glitch-b)" }}>
        {children}
      </AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="glitch-r">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="glitch-b">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};
export const glitchCut = (props: GlitchProps = {}): TransitionPresentation<GlitchProps> => ({
  component: GlitchComp,
  props,
});

// 便捷索引 — 设计时翻这张表选型
export const TRANSITION_FAMILIES = [
  "fade (remotion 内置)",
  "whipPan",
  "maskWipe",
  "push",
  "zoomPunch",
  "blurDissolve",
  "flashThrough",
  "glitchCut",
] as const;
void useMemo;
