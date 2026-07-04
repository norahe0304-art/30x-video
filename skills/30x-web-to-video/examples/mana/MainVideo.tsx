/**
 * [INPUT]: 五幕 bespoke scenes (Act1Open..Act5Close), audio-sync 时间真相源, bgm.mp3 + vo/narration.mp3, Transitions 家族
 * [OUTPUT]: MainVideo — MANA yerba mate 42.5s launch video (暖色浅底实拍世界, VO 驱动切点)
 * [POS]: 视频主编排器; 所有幕边界来自 audio-sync (ElevenLabs 词级时间戳), 禁止手写帧数
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 转场选型 (全程 fade 违规):
 *   1→2 zoomPunch (落重点: 海报→产品实拍) · 2→3 maskWipe up (章节感)
 *   3→4 push up (面板从下方顶入 — 翻到罐背) · 4→5 flashThrough (keynote 收尾闪切)
 *
 * 素材分类 (workflow.md Visual Classification):
 *   hero.png = brand-authored og-image, VisualKind "cover" 但画面无烘焙 tagline
 *   (纯产品棚拍) → 允许词排 overlay; 若未来换成带字 cover, 禁 overlay。
 *   kind: "demo" 类 UI 截图本片不存在 — 饮料品牌无 dashboard, Act3 走口味房间。
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { flashThrough, maskWipe, push, zoomPunch } from "./components/Transitions";
import { FilmGrain, Vignette } from "./components/Background";
import { theme } from "./theme";
import { Act1Open } from "./scenes/Act1Open";
import { Act2Hero } from "./scenes/Act2Hero";
import { Act3Flavors } from "./scenes/Act3Flavors";
import { Act4Label } from "./scenes/Act4Label";
import { Act5Close } from "./scenes/Act5Close";
import { ACT_BOUNDS, FPS, TOTAL_FRAMES, VO_OFFSET_S, VO_DURATION_S } from "./generated/audio-sync";

// 类型标注保留给素材分类审计 (本片 hero.png 为无字 cover, 见文件头)
export type VisualKind = "demo" | "cover";

// ================================================================
// 幕时长推导 — midpoint 对齐: 转场 12f, 每幕在 VO 句界 ±6f 交接
// ================================================================
const T = 12;
const SEQ1 = ACT_BOUNDS.act2 + T / 2; // 175
const SEQ2 = ACT_BOUNDS.act3 - ACT_BOUNDS.act2 + T; // 157
const SEQ3 = ACT_BOUNDS.act4 - ACT_BOUNDS.act3 + T; // 449
const SEQ4 = ACT_BOUNDS.act5 - ACT_BOUNDS.act4 + T; // 304
const SEQ5 = TOTAL_FRAMES - ACT_BOUNDS.act5 + T / 2; // 238

const VO_START_F = Math.round(VO_OFFSET_S * FPS);
const VO_END_F = Math.round((VO_OFFSET_S + VO_DURATION_S) * FPS);

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // BGM 包络: 起 0.9s 淡入 → VO 期间 duck 0.13 → VO 结束回 0.3 → 片尾淡出
  const RAMP = 12;
  const duck = interpolate(
    frame,
    [VO_START_F - RAMP, VO_START_F, VO_END_F, VO_END_F + RAMP],
    [1, 0.42, 0.42, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const bgmVolume =
    interpolate(frame, [0, 26, durationInFrames - 50, durationInFrames - 6], [0, 0.32, 0.32, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * duck;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.color.bg,
        color: theme.color.text,
        fontFamily: theme.font.body,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("brand/bgm.mp3")} volume={bgmVolume} />
      <Sequence from={VO_START_F}>
        <Audio src={staticFile("brand/vo/narration.mp3")} volume={1} />
      </Sequence>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SEQ1}>
          <Act1Open />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={SEQ2}>
          <Act2Hero />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={maskWipe({ direction: "up" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={SEQ3}>
          <Act3Flavors />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={push({ direction: "up" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={SEQ4}>
          <Act4Label />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={flashThrough()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={SEQ5}>
          <Act5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 浅底世界的收官层: grain 压数字感, 晕影极轻且暖 (不许黑重晕影) */}
      <FilmGrain opacity={0.03} />
      <Vignette intensity={0.14} />
    </AbsoluteFill>
  );
};
