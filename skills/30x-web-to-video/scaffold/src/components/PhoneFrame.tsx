/**
 * [INPUT]: react, remotion (useCurrentFrame for entrance), theme tokens via props
 * [OUTPUT]: PhoneFrame — iPhone 14-style bezel + Dynamic Island wrapping any screen content
 * [POS]: scaffold/src/components 的移动端展示主舞台. mobile-app productCategory 的 Act 2/3 必备
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 设计哲学:
 *   不画 marketing 用的塑料感渲染图. 画一个克制的真实 iPhone 14 Pro 外壳:
 *   - 黑色钛金属边框 (12px), 圆角 60px
 *   - 内屏圆角 52px, 黑色描边 2px
 *   - 顶部 Dynamic Island (椭圆 ~120x36, 距顶 18px)
 *   - 9:19.5 比例 (iPhone 14 Pro 1179×2556)
 *   - 极轻 specular highlight (顶部 1px 白线 8% opacity)
 *
 *   children 是屏幕内容. 父级控制定位/缩放, 这个组件只负责画外壳和裁剪.
 */
import React from "react";

export type PhoneFrameProps = {
  /** 屏幕宽度 (像素). 高度按 19.5/9 自动计算. */
  screenWidth?: number;
  /** 内容. 渲染在屏幕区域, 自动 overflow:hidden. */
  children?: React.ReactNode;
  /** 整体倾斜角度 (deg). 0 = 正面, 8 = 略微 3/4 视角. */
  tilt?: number;
  /** 覆盖外壳颜色 (默认黑钛). */
  bezelColor?: string;
};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  screenWidth = 480,
  children,
  tilt = 0,
  bezelColor = "#0B0B0D",
}) => {
  const screenHeight = Math.round((screenWidth * 19.5) / 9);
  const bezelThickness = Math.max(12, Math.round(screenWidth * 0.025));
  const outerWidth = screenWidth + bezelThickness * 2;
  const outerHeight = screenHeight + bezelThickness * 2;
  const outerRadius = Math.round(screenWidth * 0.13);
  const innerRadius = Math.round(screenWidth * 0.108);
  const islandWidth = Math.round(screenWidth * 0.25);
  const islandHeight = Math.round(screenWidth * 0.075);
  const islandTop = Math.round(screenWidth * 0.038);

  return (
    <div
      style={{
        width: outerWidth,
        height: outerHeight,
        borderRadius: outerRadius,
        background: `linear-gradient(155deg, #1a1a1d 0%, ${bezelColor} 35%, #060608 70%, #1a1a1d 100%)`,
        padding: bezelThickness,
        boxSizing: "border-box",
        position: "relative",
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.55), 0 24px 48px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)",
        transform: tilt ? `perspective(2400px) rotateY(${tilt}deg)` : undefined,
        transformOrigin: "center center",
      }}
    >
      {/* Inner screen */}
      <div
        style={{
          width: screenWidth,
          height: screenHeight,
          borderRadius: innerRadius,
          background: "#000",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.9), inset 0 0 0 3px rgba(255,255,255,0.04)",
        }}
      >
        {children}
        {/* Dynamic Island */}
        <div
          style={{
            position: "absolute",
            top: islandTop,
            left: "50%",
            transform: "translateX(-50%)",
            width: islandWidth,
            height: islandHeight,
            borderRadius: islandHeight,
            background: "#000",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
            zIndex: 20,
          }}
        />
        {/* Top specular hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "8%",
            right: "8%",
            height: 1,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            zIndex: 21,
          }}
        />
      </div>
    </div>
  );
};
