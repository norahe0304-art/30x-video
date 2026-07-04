/**
 * [INPUT]: remotion (useCurrentFrame/spring/interpolate), theme
 * [OUTPUT]: PaperAtmosphere / PaperScrap / StepChip / BlackButton — Parker 纸面世界共享原语
 * [POS]: scenes/ 的世界底座; 五幕共用的品牌视觉词汇 (拼贴纸片/棋盘格/step徽章)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// ================================================================
// 确定性伪随机 — 禁 Math.random()
// ================================================================
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ================================================================
// PaperAtmosphere — 亮纸面世界的零真空底座
// 层: 底色 + 呼吸暖光 + 品牌棋盘格纹 (demo.mp4 同款) + 漂浮尘埃
// ================================================================
export const PaperAtmosphere: React.FC<{
  base: string;
  /** 光色 (默认暖白) */
  light?: string;
  /** 棋盘格纹透明度 0 关闭 — 紫/绿分区用, 是品牌自己的纹理 */
  checker?: number;
  checkerDark?: boolean;
  /** 尘埃数量 */
  dust?: number;
  dustColor?: string;
  /** 光源位置 % */
  lightX?: number;
  lightY?: number;
  seed?: number;
}> = ({
  base,
  light = "rgba(255, 252, 240, 0.5)",
  checker = 0,
  checkerDark = false,
  dust = 14,
  dustColor = "rgba(30,30,30,0.16)",
  lightX = 50,
  lightY = 30,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 52) * 0.06;
  const checkerTone = checkerDark ? "rgba(0,0,0,0.045)" : "rgba(255,255,255,0.05)";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: base }}>
      {/* 棋盘格 — 品牌 demo/research 面板的原生纹理 */}
      {checker > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: checker,
            backgroundImage: `linear-gradient(45deg, ${checkerTone} 25%, transparent 25%, transparent 75%, ${checkerTone} 75%), linear-gradient(45deg, ${checkerTone} 25%, transparent 25%, transparent 75%, ${checkerTone} 75%)`,
            backgroundSize: "144px 144px",
            backgroundPosition: `0 0, 72px 72px`,
          }}
        />
      )}
      {/* 呼吸暖光 — 光有来源 */}
      <div
        style={{
          position: "absolute",
          inset: "-20%",
          background: `radial-gradient(ellipse ${62 * breathe}% ${50 * breathe}% at ${lightX}% ${lightY}%, ${light}, transparent 70%)`,
        }}
      />
      {/* 底部收暗 — 纵深 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 130% 90% at 50% 118%, rgba(0,0,0,0.16), transparent 62%)`,
        }}
      />
      {/* 漂浮尘埃 — 空气感, 确定性 */}
      {Array.from({ length: dust }).map((_, i) => {
        const r = hash(i + seed * 97);
        const r2 = hash(i * 3.7 + seed * 31 + 5);
        const x = r * 100;
        const drift = Math.sin(frame / (90 + r2 * 80) + i * 2.1) * 26;
        const y = ((r2 * 100 + frame * (0.022 + r * 0.03)) % 112) - 6;
        const size = 2.5 + r * 3.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(${x}% + ${drift}px)`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: dustColor,
            }}
          />
        );
      })}
    </div>
  );
};

// ================================================================
// PaperScrap — 官网同款斜贴纸片标签 (stamp-in 入场)
// ================================================================
export const PaperScrap: React.FC<{
  children: React.ReactNode;
  delay?: number;
  rotate?: number;
  bg?: string;
  padding?: string;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, rotate = -2, bg = "#FFFDF4", padding = "18px 44px", style }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - delay, fps: 30, config: { damping: 13, stiffness: 160 } });
  const scale = interpolate(p, [0, 1], [1.28, 1]);
  return (
    <div
      style={{
        display: "inline-block",
        background: bg,
        padding,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        opacity: Math.min(1, p * 2),
        boxShadow: "0 10px 34px rgba(20, 16, 4, 0.22)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ================================================================
// StepChip — 官网 Step 徽章 (色块 + 黑描边 + 实心偏移影)
// ================================================================
export const StepChip: React.FC<{
  label: string;
  color: string;
  textColor?: string;
  delay?: number;
  fontSize?: number;
}> = ({ label, color, textColor = theme.color.ink, delay = 0, fontSize = 40 }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - delay, fps: 30, config: { damping: 12, stiffness: 190 } });
  const scale = interpolate(p, [0, 1], [1.45, 1]);
  return (
    <div
      style={{
        display: "inline-block",
        background: color,
        color: textColor,
        fontFamily: theme.font.heading,
        fontWeight: 500,
        fontSize,
        letterSpacing: -0.5,
        padding: "20px 52px",
        borderRadius: theme.radius.md,
        border: "3px solid #101010",
        boxShadow: "7px 8px 0 #101010",
        transform: `rotate(-1.2deg) scale(${scale})`,
        opacity: Math.min(1, p * 2.5),
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

// ================================================================
// BlackButton — 官网 "Hire Parker Today" 黑按钮
// ================================================================
export const BlackButton: React.FC<{
  label: string;
  delay?: number;
  fontSize?: number;
}> = ({ label, delay = 0, fontSize = 44 }) => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - delay, fps: 30, config: { damping: 14, stiffness: 150 } });
  const pop = 1 + Math.max(0, Math.sin(Math.min(1, p) * Math.PI)) * 0.04;
  return (
    <div
      style={{
        display: "inline-block",
        background: "#0D0D0D",
        color: "#FCF5E2",
        fontFamily: theme.font.body,
        fontWeight: 600,
        fontSize,
        padding: "26px 66px",
        borderRadius: 16,
        boxShadow: "0 14px 40px rgba(10,8,0,0.35), 4px 5px 0 rgba(30,30,30,0.6)",
        transform: `translateY(${(1 - p) * 46}px) scale(${pop})`,
        opacity: Math.min(1, p * 2),
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};
