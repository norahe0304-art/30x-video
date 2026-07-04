/**
 * [INPUT]: PaperWorld, cf-icon.png (像素花 — 真产品 org-canvas 中心元素), theme, 真产品部门清单 (cfr-1 段截屏语义)
 * [OUTPUT]: Act3a — 公司组织 canvas: 8 部门节点按 VO 词级 onset 依次生长, 虚线连到中央 Cofounder 节点
 * [POS]: 五幕之一 (11.2-23.1s); 家族 company-org-canvas; 构图系统 = horizon-anchored world (canvas 全出血)
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

// VO 词级 onset (全局帧 − act start 329) — evidence/vo-vo2-align.json 推导
const DEPTS: { name: string; at: number; angle: number }[] = [
  { name: "Engineering", at: 154, angle: -90 },
  { name: "Sales", at: 177, angle: -45 },
  { name: "Marketing", at: 195, angle: 0 },
  { name: "Design", at: 213, angle: 45 },
  { name: "Finance", at: 231, angle: 90 },
  { name: "Operations", at: 249, angle: 135 },
  { name: "Legal", at: 279, angle: 180 },
  { name: "Support", at: 291, angle: -135 },
];
const PULSE_AT = 322; // "shared context"

const CX = 960;
const CY = 585;
const RX = 560;
const RY = 320;

export const Act3a: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const canvasIn = spring({ frame, fps, config: { damping: 19, stiffness: 80 } });
  const centerIn = spring({ frame: frame - 26, fps, config: { damping: 14, stiffness: 110 } });

  // "shared context" — 连接线整体亮一拍 (glow 脉冲, 禁扩散圆环)
  const pulse = interpolate(frame, [PULSE_AT, PULSE_AT + 10, PULSE_AT + 42], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 整个 canvas 缓慢呼吸推近
  const worldScale = interpolate(frame, [0, 371], [1.0, 1.05]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperWorld lightX={0.5} confettiSeed={29} dotOpacity={0.62} />

      <AbsoluteFill style={{ transform: `scale(${worldScale})`, transformOrigin: "50% 54%" }}>
        {/* 连接线层 */}
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          {DEPTS.map((d) => {
            const rad = (d.angle * Math.PI) / 180;
            const x = CX + Math.cos(rad) * RX;
            const y = CY + Math.sin(rad) * RY;
            const grow = spring({
              frame: frame - d.at + 6,
              fps,
              config: { damping: 20, stiffness: 90 },
            });
            const len = Math.hypot(x - CX, y - CY);
            return (
              <line
                key={d.name}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke={pulse > 0.05 ? theme.color.primary : "rgba(38,35,35,0.30)"}
                strokeWidth={pulse > 0.05 ? 2.5 : 1.8}
                strokeDasharray="7 7"
                strokeDashoffset={(1 - grow) * len}
                opacity={grow * (0.55 + pulse * 0.45)}
                style={{
                  filter: pulse > 0.05 ? `drop-shadow(0 0 ${8 * pulse}px ${theme.color.primary})` : undefined,
                }}
              />
            );
          })}
        </svg>

        {/* 部门节点 */}
        {DEPTS.map((d) => {
          const rad = (d.angle * Math.PI) / 180;
          const x = CX + Math.cos(rad) * RX;
          const y = CY + Math.sin(rad) * RY;
          const pop = spring({
            frame: frame - d.at,
            fps,
            config: { damping: 13, stiffness: 150, mass: 0.7 },
          });
          return (
            <div
              key={d.name}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${pop})`,
                opacity: Math.min(1, pop * 1.2),
                padding: "20px 38px",
                background: theme.color.panel,
                border: `1.5px solid ${theme.color.border}`,
                borderRadius: 14,
                boxShadow: "0 10px 34px rgba(38,35,35,0.10)",
                fontSize: 31,
                fontFamily: theme.font.heading,
                fontWeight: 500,
                color: theme.color.text,
                whiteSpace: "nowrap",
              }}
            >
              {d.name}
            </div>
          );
        })}

        {/* 中央 Cofounder 节点 — 真产品 canvas: 像素花 + 名字 */}
        <div
          style={{
            position: "absolute",
            left: CX,
            top: CY,
            transform: `translate(-50%, -50%) scale(${centerIn})`,
            opacity: Math.min(1, centerIn * 1.3),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* cf-icon 白底不透明 — 收编为有意的 app-icon 白片 */}
          <div
            style={{
              padding: 10,
              background: "#FFFFFF",
              border: `1.5px solid ${theme.color.border}`,
              borderRadius: 18,
              boxShadow: "0 8px 26px rgba(38,35,35,0.12)",
              lineHeight: 0,
            }}
          >
            <Img
              src={staticFile("brand/cf-icon.png")}
              style={{ width: 68, height: 68, imageRendering: "pixelated", display: "block" }}
            />
          </div>
          <div
            style={{
              padding: "22px 52px",
              background: theme.color.text,
              color: "#FFFFFF",
              borderRadius: 16,
              fontSize: 38,
              fontFamily: theme.font.heading,
              fontWeight: 500,
              boxShadow: `0 16px 50px rgba(38,35,35,0.22), 0 0 ${34 * pulse}px ${theme.color.primary}66`,
            }}
          >
            Cofounder
          </div>
        </div>
      </AbsoluteFill>

      {/* canvas 机器凭证 — 一处 mono 聚落 (小字预算 ≤1) */}
      <div
        style={{
          position: "absolute",
          left: 64,
          top: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 24px",
          background: "rgba(255,255,255,0.9)",
          border: `1px solid ${theme.color.border}`,
          borderRadius: 12,
          fontFamily: theme.font.mono,
          fontSize: 21,
          color: theme.color.textMuted,
          opacity: canvasIn,
        }}
      >
        <span style={{ color: theme.color.text }}>General Intelligence Company</span>
        <span>60%</span>
      </div>
    </AbsoluteFill>
  );
};
