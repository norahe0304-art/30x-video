/**
 * [INPUT]: scenes/Act1-5 (含 3a/3b/3c), Transitions 家族, public/brand/bgm.mp3 (musicgen 103.4BPM), public/brand/vo/vo1-4.m4a (ElevenLabs Adam, with-timestamps)
 * [OUTPUT]: MainVideo — 42.5s / 1275f 五幕编排: TransitionSeries + VO_CUES 派生 duck + 轻 grade
 * [POS]: 纯编排器 — 幕边界吸附 VO 短语 onset + BGM beat (audiomap.json), 场景住 src/scenes/
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 时间轴 (30fps, 幕切 = 转场中点):
 *   B1=164f(5.47s)  B2=335f(11.17s)  B3=694f(23.13s)  B4=918f(30.6s)  B5=1027f(34.23s)  B6=1155f(38.5s)  END=1275f
 *   B1/B2/B3/B5 吸附 audiomap beat; B4/B6 让位句间气口 (narration-sync Rule 3: 旁白赢过节拍)
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
import {
  blurDissolve,
  flashThrough,
  maskWipe,
  push,
  whipPan,
  zoomPunch,
} from "./components/Transitions";
import { FilmGrain, Vignette } from "./components/Background";
import { theme } from "./theme";
import { Act1 } from "./scenes/Act1";
import { Act2 } from "./scenes/Act2";
import { Act3a } from "./scenes/Act3a";
import { Act3b } from "./scenes/Act3b";
import { Act3c } from "./scenes/Act3c";
import { Act4 } from "./scenes/Act4";
import { Act5 } from "./scenes/Act5";

// ================================================================
// VO_CUES — ElevenLabs with-timestamps 实测时长 (evidence/vo-*-align.json)
// duck 包络从 cues 派生, 加减 VO 无需改逻辑
// ================================================================
const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 1.2, durS: 7.105 }, // Act1→2 hook
  { src: "brand/vo/vo2.m4a", startS: 11.4, durS: 11.703 }, // Act3a org canvas (连续)
  { src: "brand/vo/vo3.m4a", startS: 23.8, durS: 9.938 }, // Act3b roadmap + 3c handoff (连续)
  { src: "brand/vo/vo4.m4a", startS: 34.8, durS: 6.316 }, // Act4 proof → Act5 CTA
] as const;

const DUCK_GAIN = 0.34;
const RAMP_F = 10;

// 转场时长 (帧) — 幕切中点 = 边界帧
const T = 12;

// 各幕 Sequence 时长 (推导见文件头时间轴)
const DUR = {
  act1: 170,
  act2: 183,
  act3a: 371,
  act3b: 236,
  act3c: 121,
  act4: 140,
  act5: 126,
} as const;

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // BGM 包络: 起落 + VO duck (min 复合)
  const bgmBase = interpolate(
    frame,
    [0, 20, durationInFrames - 60, durationInFrames - 6],
    [0, 0.52, 0.52, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const duck = VO_CUES.reduce((gain, cue) => {
    const inF = cue.startS * fps;
    const outF = (cue.startS + cue.durS) * fps;
    return Math.min(
      gain,
      interpolate(frame, [inF - RAMP_F, inF, outF, outF + RAMP_F], [1, DUCK_GAIN, DUCK_GAIN, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }, 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.color.bg,
        color: theme.color.text,
        fontFamily: theme.font.body,
        overflow: "hidden",
      }}
    >
      <Audio src={staticFile("brand/bgm.mp3")} volume={bgmBase * duck} />
      {VO_CUES.map((cue) => (
        <Sequence
          key={cue.src}
          from={Math.round(cue.startS * fps)}
          durationInFrames={Math.ceil(cue.durS * fps) + 6}
        >
          <Audio src={staticFile(cue.src)} volume={1} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR.act1}>
          <Act1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={maskWipe({ direction: "up" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act2}>
          <Act2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={push({ direction: "left" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act3a}>
          <Act3a />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={blurDissolve()}
          timing={linearTiming({ durationInFrames: T + 4 })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act3b + 4}>
          <Act3b />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={whipPan({ direction: "left" })}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act3c}>
          <Act3c />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={zoomPunch()}
          timing={linearTiming({ durationInFrames: T })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act4}>
          <Act4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={flashThrough()}
          timing={linearTiming({ durationInFrames: T - 2 })}
        />
        <TransitionSeries.Sequence durationInFrames={DUR.act5}>
          <Act5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 轻 grade — 纸面世界: 细颗粒 + 极轻收角 (重 vignette 会脏) */}
      <FilmGrain opacity={0.02} />
      <Vignette intensity={0.14} />
    </AbsoluteFill>
  );
};
