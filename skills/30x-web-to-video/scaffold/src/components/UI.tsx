/**
 * [INPUT]: remotion, lucide-react
 * [OUTPUT]: GlassPanel, BrandIcon, GradientText, GradientBar
 * [POS]: UI 原语库, 被场景组件用于构建产品 mockup
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { type LucideIcon } from "lucide-react";

// ================================================================
// GlassPanel — 毛玻璃卡片
// ================================================================
export const GlassPanel: React.FC<{
  children: React.ReactNode;
  padding?: number;
  borderRadius?: number;
  blur?: number;
  opacity?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  padding = 40,
  borderRadius = 24,
  blur = 20,
  opacity = 0.06,
  style,
}) => (
  <div
    style={{
      background: `linear-gradient(135deg, rgba(255,255,255,${opacity}), rgba(255,255,255,${opacity * 0.15}))`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.37)",
      padding,
      ...style,
    }}
  >
    {children}
  </div>
);

// ================================================================
// BrandIcon — lucide 图标 + 品牌色容器
// ================================================================
export const BrandIcon: React.FC<{
  icon: LucideIcon;
  color: string;
  size?: number;
  containerSize?: number;
  borderRadius?: number;
}> = ({ icon: Icon, color, size = 32, containerSize = 64, borderRadius = 16 }) => (
  <div
    style={{
      width: containerSize,
      height: containerSize,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `${color}12`,
      border: `1px solid ${color}20`,
      borderRadius,
    }}
  >
    <Icon size={size} color={color} strokeWidth={1.5} />
  </div>
);

// ================================================================
// GradientText — 渐变色标题文字
// ================================================================
export const GradientText: React.FC<{
  children: React.ReactNode;
  colors: [string, string];
  angle?: number;
  style?: React.CSSProperties;
}> = ({ children, colors, angle = 135, style }) => (
  <span
    style={{
      background: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]})`,
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style,
    }}
  >
    {children}
  </span>
);

// ================================================================
// GradientBar — 顶部/底部渐变装饰线
// ================================================================
export const GradientBar: React.FC<{
  colors: string[];
  height?: number;
  position?: "top" | "bottom";
}> = ({ colors, height = 4, position = "top" }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      [position]: 0,
      height,
      background: `linear-gradient(90deg, ${colors.join(", ")})`,
    }}
  />
);
