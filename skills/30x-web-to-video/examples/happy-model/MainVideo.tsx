/**
 * [INPUT]: scenes/Act1-5, generated beat-map (bgm.mp3 aubiotrack 派生), Background 全局 grade 组件, public/brand/bgm.mp3 (原曲, Nora 耳朵拍板), public/brand/vo/vo1-4.m4a (ElevenLabs Brian)
 * [OUTPUT]: MainVideo — Happy Model 40s 5-act launch video (USER-LOCKED STORY: problem→solution), VO_CUES 驱动旁白 + BGM 自动 duck
 * [POS]: 纯编排器 — TransitionSeries + Audio(BGM/VO) + 全局 grade; 场景内容全部住在 src/scenes/
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * ── TIMELINE v5 (bgm-v2 125BPM 拍网格: 首拍 2.345s + k·0.48s) ────
 *   f151  = 5.03s                          Act1→Act2 转场起点 (旧锚, 偏新拍 6f 内)
 *   f367  = 12.23s                         Act2→Act3 转场起点
 *   f690  = 23.0s  (贴拍 22.985s)          Act3→Act4 转场起点 — Act4 扩容至 11.9s
 *   f690-840   Beat1 status 墙 (count-up 落 local 100 = 26.33s, vo3a 收口贴落点)
 *   f840-940   Beat2 failover 地图近景 (断链 29.0s, vo3b 同步)
 *   f940-1047  Beat3 拉远全球路由 (vo3c 31.8s)
 *   f1035 = 34.5s (贴拍 34.505s)           Act4→Act5 转场起点
 *   f1200 = 40.0s                          结尾 — 不黑场, 末帧为完整 CTA 状态
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ColorGrade, FilmGrain, Vignette } from "./components/Background";
import { beatMap } from "./generated/beat-map";
import { theme } from "./theme";
import { Act1 } from "./scenes/Act1";
import { Act2 } from "./scenes/Act2";
import { Act3 } from "./scenes/Act3";
import { Act4 } from "./scenes/Act4";
import { Act5 } from "./scenes/Act5";

// ================================================================
// 转场锚点 → TransitionSeries 时长 (T=12f fade, cut_k = Σd − k·T)
// ================================================================
const T_FADE = 12;
const ACT1_FRAMES = 163; // cut1 = 163−12 = 151
const ACT2_FRAMES = 228; // cut2 = 391−24 = 367
const ACT3_FRAMES = 335; // cut3 = 726−36 = 690  (新拍网格 22.985s; 终端段 -80f 提速让位 Act4)
const ACT4_FRAMES = 357; // cut4 = 1083−48 = 1035 (新拍 34.505s; 三 beat 扩容 8.1s→11.9s)
const ACT5_FRAMES = 165; // 结束 = 1248−48 = 1200

// ================================================================
// VO cues — ElevenLabs Brian (evidence/vo-timing.json 为词级对齐源)
// duck 窗口由 cues 派生, 不再手写区间 — 加减 VO 无需改包络逻辑
// ================================================================
const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 5.5, durS: 7.55 }, // Act2 痛点
  { src: "brand/vo/vo2.m4a", startS: 13.5, durS: 9.38 }, // Act3 解法
  // Act4 证明段: 一段连续旁白 (拆段死气口被否 — "说话不能断掉"), BEAT2/226 吸附短语 onset
  { src: "brand/vo/vo3.m4a", startS: 23.6, durS: 10.4 },
  { src: "brand/vo/vo4.m4a", startS: 35.3, durS: 2.75 }, // Act5 CTA
] as const;

// ================================================================
// BGM 包络 — 配音友好, 全参数化
// ================================================================
const BGM_PEAK = 0.22; // 峰值 (原 0.32 → 0.22, 给旁白让位)
const DUCK_DB = -10; // 旁白区衰减
const DUCK_RAMP_F = 18; // duck 进出坡道 (帧)
const DUCK_GAIN = Math.pow(10, DUCK_DB / 20); // ≈ 0.316

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // 基础包络: 15f 淡入 → PEAK 平台 → 片尾 45f 淡出 (track 45s, 视频 40s 截断)
  const bgmBase = interpolate(
    frame,
    [0, 15, durationInFrames - 45, durationInFrames],
    [0, BGM_PEAK, BGM_PEAK, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // 旁白 duck: 每段 VO 各自下潜 -10dB, 坡道平滑进出, 段间自然回升
  const duck = VO_CUES.reduce((gain, cue) => {
    const inF = cue.startS * fps;
    const outF = (cue.startS + cue.durS) * fps;
    const g = interpolate(
      frame,
      [inF - DUCK_RAMP_F, inF, outF, outF + DUCK_RAMP_F],
      [1, DUCK_GAIN, DUCK_GAIN, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return Math.min(gain, g);
  }, 1);
  const bgmVolume = bgmBase * duck;

  // Downbeat 脉冲 — beat-map.ts (audiomap 派生, 123 BPM), 每小节一次微呼吸
  const relFrame = frame - beatMap.firstBeatFrame;
  const measureIdx = Math.floor(relFrame / beatMap.measureFrames);
  const phase = relFrame - measureIdx * beatMap.measureFrames;
  const beatHit = relFrame < 0 ? 0 : Math.exp(-phase / 5);
  const beatBright = 1 + beatHit * 0.035;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        color: theme.color.text,
        fontFamily: theme.font.body,
        overflow: "hidden",
        filter: `url(#color-grade) brightness(${beatBright})`,
      }}
    >
      <Audio src={staticFile("brand/bgm.mp3")} volume={bgmVolume} />
      {VO_CUES.map((cue) => (
        <Sequence
          key={cue.src}
          from={Math.round(cue.startS * fps)}
          durationInFrames={Math.ceil(cue.durS * fps) + 2}
        >
          <Audio src={staticFile(cue.src)} volume={0.95} />
        </Sequence>
      ))}
      <ColorGrade />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACT1_FRAMES}>
          <Act1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T_FADE })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT2_FRAMES}>
          <Act2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T_FADE })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT3_FRAMES}>
          <Act3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T_FADE })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT4_FRAMES}>
          <Act4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T_FADE })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT5_FRAMES}>
          <Act5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* v2 铁律 1: grain 必须可见 (0.028 → 0.05) */}
      <FilmGrain opacity={0.05} />
      <Vignette intensity={0.34} />
    </AbsoluteFill>
  );
};
