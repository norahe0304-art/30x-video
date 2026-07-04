/**
 * [INPUT]: scenes/Act1-5, components/Transitions (push/maskWipe/whipPan), Background FX, theme, 真资产 bgm/vo
 * [OUTPUT]: MainVideo — Parker 40s launch video 编排器 (TransitionSeries + VO 词级对齐 + BGM duck)
 * [POS]: 视频主编排器; 幕边界吸附 evidence/vo-timing.json 短语 onset, 次吸附 beat-map 拍点
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 时间线 (30fps, 1200f):
 *   Act1 Hook       f0   – f112  typewriter-editorial-open      (vo1 句1)
 *   Act2 Problem    f112 – f240  paper-scrap-collage-type       (vo1 句2, "Making" onset f113)
 *   Act2 Meet       f240 – f378  editorial-reveal               (vo2 "Meet Parker" f240)
 *   Act3 Steps      f378 – f879  step-chip-footage-sequence     (vo3 连续段, 步切点=短语 onset)
 *   Act4 Proof      f879 – f1100 manifesto-line-stack           (vo4 行 onset)
 *   Act5 Close      f1100– f1200 footer-wordmark-bleed-cta      ("Hire" onset f1100)
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
import { whipPan, maskWipe, push } from "./components/Transitions";
import { ColorGrade, FilmGrain, Vignette } from "./components/Background";
import { theme } from "./theme";
import { Act1Hook } from "./scenes/Act1Hook";
import { Act2Problem } from "./scenes/Act2Problem";
import { Act2Meet } from "./scenes/Act2Meet";
import { Act3Steps } from "./scenes/Act3Steps";
import { Act4Proof } from "./scenes/Act4Proof";
import { Act5Close } from "./scenes/Act5Close";

// ================================================================
// 视觉资产分类 — demo/cover (workflow.md Visual Classification)
// cover 类 (og-image 拼图) 永不整图入片、永不被压 headline;
// 只作裁切源 (wordmark-red / mascot-clean 均裁自 hero.png)。
// ================================================================
type VisualKind = "demo" | "cover";
const VISUALS: ReadonlyArray<{ file: string; kind: VisualKind; use: string }> = [
  { file: "brand/demo.mp4", kind: "demo", use: "Act3 step1/step3 全屏 footage" },
  { file: "brand/chat-ui.png", kind: "demo", use: "Act3 step2 真产品 UI" },
  { file: "brand/hero.png", kind: "cover", use: "仅裁切源, 不入片" },
];
// cover 资产禁入 scene 的守卫 — 保留分类逻辑供 final audit 复核
export const sceneEligibleVisuals = VISUALS.filter((v) => !(v.kind === "cover"));

// ================================================================
// VO cues — 时长为 ffprobe 实测, 起点与幕边界共同吸附短语 onset
// ================================================================
const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 1.3, durS: 6.18 },
  { src: "brand/vo/vo2.m4a", startS: 8.0, durS: 4.13 },
  { src: "brand/vo/vo3.m4a", startS: 12.6, durS: 16.25 },
  { src: "brand/vo/vo4.m4a", startS: 29.4, durS: 8.73 },
] as const;

const BGM_BASE = 0.5;
const DUCK_GAIN = 0.16;
const RAMP = 10; // frames

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // duck = 各 cue 包络的 min (audio.md — 别手写固定窗口)
  const duck = VO_CUES.reduce((gain, cue) => {
    const inF = cue.startS * fps;
    const outF = (cue.startS + cue.durS) * fps;
    return Math.min(
      gain,
      interpolate(frame, [inF - RAMP, inF, outF, outF + RAMP], [1, DUCK_GAIN, DUCK_GAIN, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }, 1);

  const master = interpolate(
    frame,
    [0, 20, durationInFrames - 55, durationInFrames - 5],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: theme.color.bg }}>
      {/* ── 五幕 (转场家族: push / maskWipe / whipPan / maskWipe / push — 无全程 fade) ── */}
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={118}>
          <Act1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={push({ direction: "left" })}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <Act2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={maskWipe({ direction: "up", softEdgePx: 90 })}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence durationInFrames={149}>
          <Act2Meet />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={whipPan({ direction: "left" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={513}>
          <Act3Steps />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={maskWipe({ direction: "right", softEdgePx: 110 })}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={234}>
          <Act4Proof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={push({ direction: "up" })}
          timing={linearTiming({ durationInFrames: 12 })}
        />
        <TransitionSeries.Sequence durationInFrames={106}>
          <Act5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* ── 电影层 — 纸面世界的轻手 (亮场, 比暗场收敛) ── */}
      <ColorGrade saturation={1.04} />
      <Vignette intensity={0.28} />
      <FilmGrain opacity={0.05} />

      {/* ── 音频: BGM (swing, duck 包络) + 4 段 VO ── */}
      <Audio src={staticFile("brand/bgm.mp3")} volume={() => BGM_BASE * duck * master} />
      {VO_CUES.map((cue) => (
        <Sequence
          key={cue.src}
          from={Math.round(cue.startS * fps)}
          durationInFrames={Math.ceil(cue.durS * fps) + 6}
        >
          <Audio src={staticFile(cue.src)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
