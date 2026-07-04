/**
 * [INPUT]: remotion (OffthreadVideo/Img), theme, PaperWorld (StepChip/PaperAtmosphere), 真资产 demo.mp4 + chat-ui.png
 * [OUTPUT]: Act3Steps — 三步 showcase: Research(footage 全屏) → Chat(真产品UI推近) → Grow(footage 全屏)
 * [POS]: 第三幕主证据段; 家族 step-chip-footage-sequence; 切点吸附 vo3 短语 onset
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere, StepChip } from "./PaperWorld";

// seq4 有效起点 abs f373; vo3 @ f378 词级对齐 (evidence/vo-timing.json):
// "First" l5 | "Then you chat" l211 | "And then you grow" l378 | vo3 止 l490
const STEP2_AT = 211;
const STEP3_AT = 378;

// ── 全屏 footage + 底左 step 徽章 ────────────────────────────────
const FootageBeat: React.FC<{
  startFromSec: number;
  playbackRate: number;
  chip: string;
  chipColor: string;
  chipDelay?: number;
}> = ({ startFromSec, playbackRate, chip, chipColor, chipDelay = 7 }) => {
  const frame = useCurrentFrame();
  // 入场轻推近 — footage 是活的, 不是贴图
  const scale = interpolate(frame, [0, 150], [1.03, 1.085], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: "#F7F3E8" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile("brand/demo.mp4")}
          startFrom={Math.round(startFromSec * 30)}
          playbackRate={playbackRate}
          muted
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </AbsoluteFill>
      {/* 底部暗 scrim — 徽章可读区 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: "linear-gradient(to top, rgba(20,16,4,0.30), transparent)",
        }}
      />
      <div style={{ position: "absolute", left: 96, bottom: 88 }}>
        <StepChip label={chip} color={chipColor} delay={chipDelay} />
      </div>
    </AbsoluteFill>
  );
};

export const Act3Steps: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: theme.color.bg }}>
      {/* Step 1 — Research: demo 前段 (pill 点击 → 来源树 → agent 工作) */}
      <Sequence durationInFrames={STEP2_AT} layout="none">
        <FootageBeat
          startFromSec={2.2}
          playbackRate={0.885}
          chip="Step 1 — Research"
          chipColor={theme.color.yellow}
          chipDelay={10}
        />
      </Sequence>

      {/* Step 2 — Chat: 真产品 chat/scripts UI, 紫棋盘世界推近 */}
      <Sequence from={STEP2_AT} durationInFrames={STEP3_AT - STEP2_AT} layout="none">
        <ChatBeat />
      </Sequence>

      {/* Step 3 — Grow: demo 尾段 (视频卡扇出 → 真 dashboard) */}
      <Sequence from={STEP3_AT} layout="none">
        <FootageBeat
          startFromSec={8.55}
          playbackRate={0.69}
          chip="Step 3 — Grow"
          chipColor={theme.color.greenLight}
          chipDelay={7}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── Step 2 — 真产品 UI (homepage 裁切) Ken Burns 推近 ─────────────
const ChatBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps: 30, config: { damping: 16, stiffness: 90 } });
  const zoom = interpolate(frame, [0, 160], [1, 1.09], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <PaperAtmosphere
        base={theme.color.accent}
        checker={1}
        checkerDark
        dust={10}
        dustColor="rgba(252,245,226,0.28)"
        light="rgba(255,255,255,0.24)"
        lightY={18}
        seed={4}
      />
      {/* 偏置构图: 框右移出血, 左下棋盘区留给徽章 — 不撞角 */}
      <div
        style={{
          position: "absolute",
          left: 560,
          top: 64,
          transform: `translateY(${(1 - enter) * 90}px) scale(${zoom})`,
          transformOrigin: "left center",
          opacity: enter,
          boxShadow: "0 40px 120px rgba(10,6,30,0.45)",
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        <Img src={staticFile("brand/chat-ui.png")} style={{ width: 1560, display: "block" }} />
      </div>
      <div style={{ position: "absolute", left: 96, bottom: 88 }}>
        <StepChip label="Step 2 — Chat" color="#FFFDF4" delay={7} />
      </div>
    </AbsoluteFill>
  );
};
