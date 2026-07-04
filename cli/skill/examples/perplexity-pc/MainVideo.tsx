/**
 * [INPUT]: scenes/Act1-5, components/Transitions (maskWipe/push/blurDissolve/flashThrough), theme, public/brand/bgm.mp3 (133BPM) + vo/vo1-4.m4a
 * [OUTPUT]: MainVideo — Perplexity Personal Computer 40s launch (奶油纸白编辑部 + 官方资产主角): hero → agents → 四拍能力 → secure → 纸白端版
 * [POS]: 纯编排器; 切点吸附 133BPM 小节 (199/469/793/901), VO duck 由 cues 派生
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
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
import { maskWipe, push, blurDissolve, flashThrough } from "./components/Transitions";
import { FilmGrain } from "./components/Background";
import { theme } from "./theme";
import { Act1 } from "./scenes/Act1";
import { Act2 } from "./scenes/Act2";
import { Act3 } from "./scenes/Act3";
import { Act4 } from "./scenes/Act4";
import { Act5 } from "./scenes/Act5";

type VisualKind = "demo" | "cover";
const VISUALS: ReadonlyArray<{ file: string; kind: VisualKind }> = [
  { file: "brand/hero-img.jpg", kind: "demo" },
  { file: "brand/taskbar-desktop.jpg", kind: "demo" },
  { file: "brand/personal-computer-og-img.jpg", kind: "cover" }, // 烘焙构图禁叠字, 备用 end card
];
void VISUALS;

const T_FADE = 12;
const ACT1_FRAMES = 211; // cut1 = 199 (小节 6.63s)
const ACT2_FRAMES = 282; // cut2 = 469 (小节 15.63s)
const ACT3_FRAMES = 336; // cut3 = 793 (小节 26.43s)
const ACT4_FRAMES = 156; // cut4 = 901 (小节 30.03s)
const ACT5_FRAMES = 263; // 结束 = 1200

const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 1.2, durS: 3.9 },
  { src: "brand/vo/vo2.m4a", startS: 7.0, durS: 7.2 },
  { src: "brand/vo/vo3.m4a", startS: 16.4, durS: 6.55 }, // 连续旁白, Act3 拍点吸附其短语 onset
  { src: "brand/vo/vo4.m4a", startS: 27.4, durS: 2.6 },
] as const;

const BGM_PEAK = 0.22;
const DUCK_RAMP_F = 18;
const DUCK_GAIN = Math.pow(10, -10 / 20);

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const bgmBase = interpolate(
    frame,
    [0, 15, durationInFrames - 45, durationInFrames],
    [0, BGM_PEAK, BGM_PEAK, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const duck = VO_CUES.reduce((gain, cue) => {
    const inF = cue.startS * fps;
    const outF = (cue.startS + cue.durS) * fps;
    return Math.min(
      gain,
      interpolate(frame, [inF - DUCK_RAMP_F, inF, outF, outF + DUCK_RAMP_F], [1, DUCK_GAIN, DUCK_GAIN, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  }, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.color.bg, color: theme.color.text, fontFamily: theme.font.body, overflow: "hidden" }}>
      <Audio src={staticFile("brand/bgm.mp3")} volume={bgmBase * duck} />
      {VO_CUES.map((cue) => (
        <Sequence key={cue.src} from={Math.round(cue.startS * fps)} durationInFrames={Math.ceil(cue.durS * fps) + 2}>
          <Audio src={staticFile(cue.src)} volume={0.95} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACT1_FRAMES}>
          <Act1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={maskWipe({ direction: "up" })} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT2_FRAMES}>
          <Act2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={push({ direction: "left" })} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT3_FRAMES}>
          <Act3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={blurDissolve({})} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT4_FRAMES}>
          <Act4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={flashThrough({ color: "#FAF8F5" })} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT5_FRAMES}>
          <Act5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 浅底世界: 低 grain, 无 vignette (暗角在纸白上是脏) */}
      <FilmGrain opacity={0.03} />
    </AbsoluteFill>
  );
};
