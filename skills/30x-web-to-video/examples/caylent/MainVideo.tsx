/**
 * [INPUT]: scenes/Act1-5, theme, Background grade 组件, public/brand/bgm.mp3 (calm ambient, 124.7BPM), public/brand/vo/vo1-4.m4a (ElevenLabs Brian)
 * [OUTPUT]: MainVideo — Caylent 40s 品牌 intro (calm authority): 几何生长 → 实拍 hook → 三服务线 → 真数据 proof → CTA
 * [POS]: 纯编排器 — TransitionSeries + Audio(BGM/VO, duck 由 VO_CUES 派生) + 全局 grade; 场景住 src/scenes/
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * ── TIMELINE (bgm 拍网格: 首拍 3.078s + k·0.481s, 小节 57.7f) ────
 *   f150  = 5.0s   (小节)   Act1→Act2 — VO1 5.3s 起
 *   f381  = 12.7s  (小节)   Act2→Act3 — VO2 13.1s 起, 段内切点 = 短语 onset (f589/f653)
 *   f785  = 26.2s  (小节)   Act3→Act4 — VO3 26.4s 起, 段内切点 = 短语 onset (f913/f983)
 *   f1088 = 36.3s  (拍)     Act4→Act5 — VO4 36.5s 起, 末帧完整 lockup
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
import { theme } from "./theme";
import { Act1 } from "./scenes/Act1";
import { Act2 } from "./scenes/Act2";
import { Act3 } from "./scenes/Act3";
import { Act4 } from "./scenes/Act4";
import { Act5 } from "./scenes/Act5";

// ================================================================
// 视觉素材分类 — demo (实拍/产品) 可叠字, cover (烘焙文案) 只许全屏原样
// ================================================================
type VisualKind = "demo" | "cover";
const VISUALS: ReadonlyArray<{ file: string; kind: VisualKind }> = [
  { file: "brand/demo.mp4", kind: "demo" }, // 官网 hero 背景实拍 — Act2 叠编辑部字排
  { file: "brand/hero.png", kind: "cover" }, // 烘焙 tagline — 禁叠字 (未入正片, wordmark 由其裁切)
];
const ACT2_VISUAL = VISUALS[0];

// ================================================================
// 转场锚点 → TransitionSeries 时长 (T=12f fade, cut_k = Σd − k·T)
// ================================================================
const T_FADE = 12;
const ACT1_FRAMES = 162; // cut1 = 162−12 = 150  (小节 5.0s)
const ACT2_FRAMES = 243; // cut2 = 405−24 = 381  (小节 12.7s)
const ACT3_FRAMES = 416; // cut3 = 821−36 = 785  (小节 26.2s)
const ACT4_FRAMES = 315; // cut4 = 1136−48 = 1088 (拍 36.3s)
const ACT5_FRAMES = 112; // 结束 = 1248−48 = 1200

// ================================================================
// VO cues — ElevenLabs Brian (evidence/vo-timing.json 词级对齐)
// duck 窗口由 cues 派生 — 加减 VO 无需改包络逻辑
// ================================================================
const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 5.3, durS: 5.85 }, // Act2 hook
  { src: "brand/vo/vo2.m4a", startS: 13.1, durS: 10.95 }, // Act3 三服务线 (连续)
  { src: "brand/vo/vo3.m4a", startS: 26.4, durS: 9.6 }, // Act4 proof (连续)
  { src: "brand/vo/vo4.m4a", startS: 36.5, durS: 2.3 }, // Act5 CTA
] as const;

const BGM_PEAK = 0.24;
const DUCK_DB = -10;
const DUCK_RAMP_F = 18;
const DUCK_GAIN = Math.pow(10, DUCK_DB / 20);

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
    const g = interpolate(
      frame,
      [inF - DUCK_RAMP_F, inF, outF, outF + DUCK_RAMP_F],
      [1, DUCK_GAIN, DUCK_GAIN, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    return Math.min(gain, g);
  }, 1);
  const bgmVolume = bgmBase * duck;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0A0A0A",
        color: theme.color.text,
        fontFamily: theme.font.body,
        overflow: "hidden",
        filter: "url(#color-grade)",
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
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT2_FRAMES}>
          {ACT2_VISUAL.kind === "cover" ? (
            // cover 素材: 全屏原样, 禁止叠字 (当前 Act2 用 demo 实拍, 此分支为素材换型保险)
            <AbsoluteFill style={{ background: "#0A0A0A" }} />
          ) : (
            <Act2 />
          )}
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT3_FRAMES}>
          <Act3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT4_FRAMES}>
          <Act4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T_FADE })} />
        <TransitionSeries.Sequence durationInFrames={ACT5_FRAMES}>
          <Act5 />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <FilmGrain opacity={0.05} />
      <Vignette intensity={0.32} />
    </AbsoluteFill>
  );
};
