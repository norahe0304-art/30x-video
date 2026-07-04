/**
 * [INPUT]: 官方四张 flavor 棚拍图 (边缘色已采样进 theme), World 基元, audio-sync 词级时间
 * [OUTPUT]: Act3Flavors — 口味房间轮播: 整屏色彩房间逐口味切换 (官网 flavor carousel 的视频化)
 * [POS]: 第 3 幕; 家族 "flavor-color-room-carousel" (新家族 — 饮料世界的原生 artifact)
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * Claim→World: "四种口味各有性格" → 饮料从业者看的是货架与包装色 →
 * 把每个口味做成一间全出血色彩房间 (官网 carousel 每换口味整页换色, 这是站方自己的语汇)。
 * 构图系统 (Law 5): sequenced full-screen singles + 巨字排, 房间之间 push 平移 (carousel 语义)。
 * VO 锚点: intro f314 / melon f400 / blackberry f488 / tropical f582 / grapefruit f672 (全局)。
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { push } from "../components/Transitions";
import { theme } from "../theme";
import { PaperAtmosphere, SparklePop, riseIn } from "./World";
import { downbeatPulse, ACT_BOUNDS } from "../generated/audio-sync";

// 本幕全局起帧 (TransitionSeries 12f 转场, 提前 6f 进场)
const LOCAL0 = ACT_BOUNDS.act3 - 6;

// 房间边界 (全局帧 → 本地): intro→400, melon→488, blackberry→582, tropical→672
const B = { melon: 400 - LOCAL0, blackberry: 488 - LOCAL0, tropical: 582 - LOCAL0, grapefruit: 672 - LOCAL0 };
const TOTAL = 449;
const T = 8; // 内部 push 转场帧数

type Room = {
  id: string;
  photo: string;
  bg: string;
  lines: [string, string];
  textColor: string;
  counterColor: string;
};

const ROOMS: Room[] = [
  {
    id: "melon",
    photo: "brand/lifestyle/eie-1.jpg",
    bg: theme.color.flavorGreen,
    lines: ["MELON", "& MINT"],
    textColor: "#FFFFFF",
    counterColor: "rgba(255,255,255,0.72)",
  },
  {
    id: "blackberry",
    photo: "brand/flavors/mures-1.jpg",
    bg: theme.color.flavorBlue,
    lines: ["BLACKBERRY", "& HIBISCUS"],
    textColor: "#FFFFFF",
    counterColor: "rgba(255,255,255,0.72)",
  },
  {
    id: "tropical",
    photo: "brand/flavors/tropical-1.jpg",
    bg: theme.color.flavorPink,
    lines: ["TROPICAL", ""],
    textColor: "#FFFFFF",
    counterColor: "rgba(255,255,255,0.75)",
  },
  {
    id: "grapefruit",
    photo: "brand/flavors/pamplemousse-1.jpg",
    bg: theme.color.flavorYellow,
    lines: ["GRAPEFRUIT", ""],
    textColor: theme.color.ink,
    counterColor: "rgba(20,20,20,0.6)",
  },
];

// ---------- intro beat: 官网自己的 "F l a v o r s" 段落标题 ----------
const FlavorsIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const letters = "FLAVORS".split("");
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperAtmosphere />
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 58 }}>
          {letters.map((ch, i) => {
            const p = riseIn(frame, 8 + i * 3, 16);
            return (
              <span
                key={i}
                style={{
                  fontFamily: theme.font.heading,
                  fontWeight: 500,
                  fontSize: 224,
                  lineHeight: 1,
                  color: theme.color.ink,
                  opacity: p,
                  display: "inline-block",
                  transform: `translateY(${(1 - p) * 90}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
      {/* 四个口味色 chip — 即将进入的房间预告, 底部一排细条 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", height: 18 }}>
        {ROOMS.map((r, i) => {
          const p = riseIn(frame, 30 + i * 4, 14);
          return <div key={r.id} style={{ flex: 1, background: r.bg, transform: `scaleY(${p})`, transformOrigin: "bottom" }} />;
        })}
      </div>
      <SparklePop x={330} y={270} size={48} delay={26} />
      <SparklePop x={1544} y={640} size={58} delay={32} />
    </AbsoluteFill>
  );
};

// ---------- 一间口味房间 ----------
const FlavorRoom: React.FC<{ room: Room; index: number }> = ({ room, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 照片从右滑入 + 定格微倾
  const slide = spring({ frame: frame - 2, fps, config: { damping: 19, stiffness: 95, mass: 1.0 } });
  const photoX = (1 - slide) * 420;

  // downbeat 微呼吸 (96BPM 有节奏网格)
  const pulse = downbeatPulse(frame + LOCAL0 + index); // 全局帧对齐 BGM
  const photoScale = 1.001 + pulse * 0.008;

  const counter = `${String(index + 1).padStart(2, "0")} — 04`;

  return (
    <AbsoluteFill style={{ background: room.bg, overflow: "hidden" }}>
      {/* 官方棚拍图 — 右侧满高, 左缘用房间色羽化到无缝 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 940,
          height: "100%",
          transform: `translateX(${photoX}px) scale(${photoScale})`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={staticFile(room.photo)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${room.bg} 2%, rgba(0,0,0,0) 46%)`,
          }}
        />
      </div>

      {/* 房间光 — 罩在整帧之上 (含照片), 平面侧与照片侧同调, 不留接缝 */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 120% 85% at 50% -10%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 55%)",
          pointerEvents: "none",
        }}
      />

      {/* 巨字口味名 — 左半 编辑部字排 */}
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {room.lines.filter(Boolean).map((line, li) => {
          const p = riseIn(frame, 6 + li * 5, 16);
          const oneLine = room.lines[1] === "";
          return (
            <div
              key={line}
              style={{
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: oneLine ? 176 : 150,
                lineHeight: 0.98,
                letterSpacing: "-0.01em",
                color: room.textColor,
                opacity: p,
                transform: `translateY(${(1 - p) * 70}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {line}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 34,
            fontFamily: theme.font.body,
            fontWeight: 450,
            fontSize: 28,
            letterSpacing: "0.24em",
            color: room.counterColor,
            opacity: riseIn(frame, 18, 16),
          }}
        >
          {counter}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Act 3 编排 — 内部 TransitionSeries, push 平移 = carousel 语义 ----------
export const Act3Flavors: React.FC = () => {
  // 时长: midpoint 对齐 VO onset (audio-sync), s_i 见推导
  const s1 = B.melon + T / 2; // 96
  const s2 = B.blackberry - B.melon + T; // 96
  const s3 = B.tropical - B.blackberry + T; // 102
  const s4 = B.grapefruit - B.tropical + T; // 98
  const s5 = TOTAL - B.grapefruit + T / 2; // 89

  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={s1}>
          <FlavorsIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={push({ direction: "left" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={s2}>
          <FlavorRoom room={ROOMS[0]} index={0} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={push({ direction: "left" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={s3}>
          <FlavorRoom room={ROOMS[1]} index={1} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={push({ direction: "left" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={s4}>
          <FlavorRoom room={ROOMS[2]} index={2} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={push({ direction: "left" })} timing={linearTiming({ durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={s5}>
          <FlavorRoom room={ROOMS[3]} index={3} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
