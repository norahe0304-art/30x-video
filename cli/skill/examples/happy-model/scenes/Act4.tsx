/**
 * [INPUT]: remotion 原语, theme, Atmosphere, FadeIn/SplitText/CountUp, generated/world-map, generated/provider-logos
 * [OUTPUT]: Act4 v6 — Proof 三连三种画面: 99.9% status 墙 → provider 级 failover (OpenAI 熄灭×改道 Claude, 复用官方 logo) → 全球路由点阵地图
 * [POS]: 第四幕 / 证明段; v6 按构图多样性铁律拆开 Beat2/3 — failover 是 provider 语义不是地理语义, 地图只属于 routing
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { FadeIn, SplitText, CountUp } from "../components/Animations";
import { WORLD_MAP } from "../generated/world-map";
import { ProviderLogo } from "../generated/provider-logos";
import { theme } from "../theme";

const G = theme.color.primary;
// 切点吸附连续旁白的短语 onset (evidence/vo-timing.json): vo3 @23.6s,
// "When a provider fails" +3.59s → 27.19s, "Every request" +6.93s → 30.53s
const BEAT2 = 126; // 27.2s — provider failover
const BEAT3 = 226; // 30.5s — 全球路由地图

// 6f 交叉淡切, 落点踩在 beat 边界上
const beatWindow = (frame: number, start: number, end: number) => {
  const fadeIn = start === 0 ? 1 : interpolate(frame, [start - 6, start], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = end >= 900 ? 1 : interpolate(frame, [end - 6, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return fadeIn * fadeOut;
};

const headlineStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 170,
  lineHeight: 0.98,
  letterSpacing: "-0.045em",
  fontFamily: theme.font.heading,
  fontWeight: 500,
  color: theme.color.text,
  whiteSpace: "nowrap",
};

// v7: 卖点副句小字全毙 ("干净一点") — 信息由旁白承载, 画面只留巨字排 + 世界

// 二次贝塞尔 — 光束/弧线共用
const qp = (t: number, a: number, c: number, b: number) =>
  (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

// ================================================================
// Beat 1 — 99.9% + status 墙 (v5 保留): 三区域 90 天 uptime 心跳条带
// ================================================================
const REGIONS = ["us-east-1", "eu-west-1", "ap-southeast-1"];
const BAR_N = 90;
const WALL_X = 110;
const WALL_W = 1700;
const BAR_STEP = WALL_W / BAR_N;
const BAR_W = BAR_STEP * 0.62;
const AMBER = "#E3A94C";

const BeatUptime: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 170,
        fontSize: 330,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        fontFamily: theme.font.heading,
        fontWeight: 500,
        color: theme.color.text,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <FadeIn delay={12} duration={20} direction="up" distance={40}>
        <CountUp from={90} to={99.9} delay={40} duration={60} decimals={1} suffix="%" />
      </FadeIn>
    </div>
    {REGIONS.map((region, r) => {
      const rowY = 680 + r * 122;
      return (
        <div key={region}>
          <div
            style={{
              position: "absolute",
              left: WALL_X,
              top: rowY - 40,
              fontSize: 24,
              fontFamily: theme.font.mono,
              color: "rgba(248,250,252,0.5)",
            }}
          >
            {region}
          </div>
          <svg
            width={1920}
            height={80}
            style={{ position: "absolute", left: 0, top: rowY }}
          >
            {Array.from({ length: BAR_N }, (_, c) => {
              const enter = interpolate(frame, [16 + c * 0.7 + r * 6, 28 + c * 0.7 + r * 6], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              });
              const blip = (r * 53 + c * 37) % 131 < 1; // 270 根里 ~2 粒琥珀
              // 末根"live"条微呼吸 — 幅度压低 (心跳式蓬蓬跳被否)
              const live = c === BAR_N - 1 ? 0.92 + Math.sin(frame / 11) * 0.08 : 1;
              const h = (blip ? 30 : 64) * enter;
              return (
                <rect
                  key={c}
                  x={WALL_X + c * BAR_STEP}
                  y={72 - h}
                  width={BAR_W}
                  height={h}
                  rx={2.5}
                  fill={blip ? AMBER : G}
                  opacity={(blip ? 0.9 : 0.42 + ((r * 31 + c * 13) % 5) * 0.07) * live}
                />
              );
            })}
            <line x1={WALL_X} y1={76} x2={WALL_X + WALL_W} y2={76} stroke="rgba(248,250,252,0.09)" strokeWidth={1.5} />
          </svg>
        </div>
      );
    })}
  </AbsoluteFill>
);

// ================================================================
// Beat 2 — Provider 级 failover: 请求光束 → OpenAI 熄灭 × → 瞬间改射 Claude
//   复用 Act3 的官方 logo — 这才是本产品 failover 的真实语义
// ================================================================
type Node = { slug: string; name: string; y: number };
const NODES: Node[] = [
  { slug: "openai", name: "OpenAI", y: 400 },
  { slug: "claude", name: "Claude", y: 620 },
  { slug: "gemini", name: "Gemini", y: 840 },
];
const NODE_X = 1330; // logo 列
const BEAM_SRC: [number, number] = [-60, 700]; // 请求流从画外左下涌入
const beamEnd = (y: number): [number, number] => [NODE_X - 56, y];
const beamCp = (y: number): [number, number] => [620, Math.min(BEAM_SRC[1], y) - 120];

const Beam: React.FC<{
  toY: number;
  draw: number;
  width: number;
  opacity: number;
  glow?: boolean;
  pulsePhase?: number;
}> = ({ toY, draw, width, opacity, glow, pulsePhase }) => {
  if (draw <= 0) return null;
  const [ex, ey] = beamEnd(toY);
  const [cx, cy] = beamCp(toY);
  return (
    <g>
      <path
        d={`M${BEAM_SRC[0]},${BEAM_SRC[1]} Q${cx},${cy} ${ex},${ey}`}
        fill="none"
        stroke={G}
        strokeWidth={width}
        strokeDasharray={2400}
        strokeDashoffset={2400 * (1 - draw)}
        opacity={opacity}
        style={glow ? { filter: `drop-shadow(0 0 12px ${G}88)` } : undefined}
      />
      {pulsePhase !== undefined && pulsePhase >= 0 && draw >= 1
        ? [0, 0.4, 0.8].map((off) => {
            const t = (pulsePhase + off) % 1;
            return (
              <circle
                key={off}
                cx={qp(t, BEAM_SRC[0], cx, ex)}
                cy={qp(t, BEAM_SRC[1], cy, ey)}
                r={5.5}
                fill="#DFFFE2"
                opacity={0.9}
                style={{ filter: `drop-shadow(0 0 10px ${G})` }}
              />
            );
          })
        : null}
    </g>
  );
};

const BeatFailover: React.FC<{ frame: number }> = ({ frame }) => {
  const t2 = frame - BEAT2;
  const oai = NODES[0];
  const cla = NODES[1];

  // 编舞: 光束→OpenAI (6-20) → 脉冲跑 → 36f OpenAI 熄灭 → 40-54 改射 Claude
  const drawA = interpolate(t2, [6, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const dead = interpolate(t2, [36, 43], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 熄灭瞬间 3f 闪烁 — 硬件断电感
  const flicker = t2 >= 36 && t2 < 43 ? (t2 % 2 < 1 ? 0.5 : 1) : 1;
  const drawB = interpolate(t2, [40, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const stampIn = interpolate(t2, [58, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nodeState = (n: Node): { alpha: number; scale: number } => {
    const enter = interpolate(t2, [4 + NODES.indexOf(n) * 4, 16 + NODES.indexOf(n) * 4], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    if (n === oai) return { alpha: enter * (1 - dead * 0.72) * flicker, scale: 1 - dead * 0.04 };
    if (n === cla) return { alpha: enter * (0.45 + drawB * 0.55), scale: 1 + drawB * 0.06 };
    return { alpha: enter * 0.4, scale: 1 };
  };

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* 主光束 → OpenAI, 熄灭后残影 */}
        <Beam toY={oai.y} draw={drawA} width={2.8} opacity={0.9 - dead * 0.75} pulsePhase={t2 >= 20 && dead <= 0 ? ((t2 - 20) * 0.03) % 1 : -1} />
        {/* 改道光束 → Claude — 更粗更亮 */}
        <Beam toY={cla.y} draw={drawB} width={3.8} opacity={0.95} glow pulsePhase={drawB >= 1 ? ((t2 - 54) * 0.028) % 1 : -1} />
        {/* 断点冲击感由 flicker + 光束熄灭表达 — 扩散圆环已毙 (模板动效) */}
      </svg>

      {/* Provider 列 — 官方 mark + 名字, 状态即叙事 */}
      {NODES.map((n) => {
        const { alpha, scale } = nodeState(n);
        return (
          <div
            key={n.slug}
            style={{
              position: "absolute",
              left: NODE_X,
              top: n.y,
              transform: `translateY(-50%) scale(${scale})`,
              transformOrigin: "left center",
              display: "flex",
              alignItems: "center",
              gap: 22,
              opacity: alpha,
              fontFamily: theme.font.heading,
              fontWeight: 500,
              fontSize: 64,
              letterSpacing: "-0.02em",
              color: "#F2F4F6",
              whiteSpace: "nowrap",
            }}
          >
            <ProviderLogo name={n.slug} size={60} color="#F2F4F6" style={{ flexShrink: 0 }} />
            {n.name}
          </div>
        );
      })}
      {/* OpenAI 熄灭 × */}
      <div
        style={{
          position: "absolute",
          left: NODE_X - 78,
          top: NODES[0].y,
          transform: "translateY(-50%)",
          fontSize: 46,
          fontFamily: theme.font.mono,
          color: "#9BA0A8",
          opacity: dead * 0.85,
        }}
      >
        ×
      </div>
      {/* 改道时间戳 — 机器凭证 */}
      <div
        style={{
          position: "absolute",
          left: NODE_X + 62,
          top: NODES[1].y + 52,
          fontSize: 26,
          fontFamily: theme.font.mono,
          color: `${G}CC`,
          opacity: stampIn,
        }}
      >
        rerouted · 183 ms
      </div>

      <div style={{ position: "absolute", left: 110, top: 110 }}>
        <h2 style={headlineStyle}>
          <SplitText text="Smart failover" delay={BEAT2 + 2} staggerFrames={1} distance={26} />
        </h2>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================
// Beat 3 — Global routing: 骨干网短跳级联 — 一个请求从 SF 出发逐跳
// 点亮全球 (短弧低顶点, 天然让开字区; ms 延迟戳把 low-latency 说实)
// ================================================================
const MAP_S = 1920 / WORLD_MAP.width;
const MAP_OY = 170;
const city = (name: string): [number, number] => {
  const [mx, my] = WORLD_MAP.cities[name];
  return [mx * MAP_S, my * MAP_S + MAP_OY];
};
// 环球主链 + 两条支线; latency 戳只放三处, 不糊屏
const HOPS: ReadonlyArray<{ a: string; b: string; ms?: string }> = [
  { a: "sf", b: "nyc", ms: "29 ms" },
  { a: "nyc", b: "london" },
  { a: "london", b: "frankfurt", ms: "8 ms" },
  { a: "frankfurt", b: "dubai" },
  { a: "dubai", b: "mumbai" },
  { a: "mumbai", b: "singapore", ms: "34 ms" },
  { a: "singapore", b: "tokyo" },
  { a: "singapore", b: "sydney" },
  { a: "nyc", b: "saopaulo" },
] as const;
const HOP_STAGGER = 6;
const HOP_DRAW = 14;

const BeatRouting: React.FC<{ frame: number }> = ({ frame }) => {
  const t3 = frame - BEAT3;
  const mapReveal = interpolate(t3, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 每跳几何 + 进度 — 一次算完, 弧线/脉冲/城市点/延迟戳共用
  const hops = HOPS.map(({ a, b, ms }, i) => {
    const from = city(a);
    const to = city(b);
    const start = 8 + i * HOP_STAGGER;
    const draw = interpolate(t3 - start, [0, HOP_DRAW], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    // 侧弓弧线: 控制点沿航线法向偏移 (大圆航线质感) — 竖向跳侧弯而非下垂
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dist = Math.hypot(dx, dy);
    const bow = Math.min(110, dist * 0.18);
    const sgn = dx >= 0 ? 1 : -1; // 统一向行进方向左侧弓 (西→东 = 向上)
    const cx = (from[0] + to[0]) / 2 + (dy / dist) * bow * sgn;
    const cy = (from[1] + to[1]) / 2 - (dx / dist) * bow * sgn;
    return { a, b, ms, i, from, to, cx, cy, draw };
  });
  const lit = new Set<string>(["sf"]);
  for (const h of hops) if (h.draw > 0.92) lit.add(h.b);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <g opacity={mapReveal}>
          {WORLD_MAP.points.map(([mx, my], i) => (
            <circle
              key={i}
              cx={mx * MAP_S}
              cy={my * MAP_S + MAP_OY}
              r={2.5}
              fill="rgba(248,250,252,0.19)"
            />
          ))}
        </g>
        {hops.map(({ a, b, i, from, to, cx, cy, draw }) => {
          if (draw <= 0) return null;
          const t = draw >= 1 ? (t3 * 0.02 + i * 0.37) % 1 : -1;
          return (
            <g key={`${a}-${b}`}>
              <path
                d={`M${from[0]},${from[1]} Q${cx},${cy} ${to[0]},${to[1]}`}
                fill="none"
                stroke={G}
                strokeWidth={2.4}
                opacity={0.35 + draw * 0.45}
                strokeDasharray={1200}
                strokeDashoffset={1200 * (1 - draw)}
                style={{ filter: `drop-shadow(0 0 8px ${G}55)` }}
              />
              {t >= 0 ? (
                <circle
                  cx={qp(t, from[0], cx, to[0])}
                  cy={qp(t, from[1], cy, to[1])}
                  r={4.5}
                  fill="#DFFFE2"
                  opacity={0.95}
                  style={{ filter: `drop-shadow(0 0 9px ${G})` }}
                />
              ) : null}
            </g>
          );
        })}
        {/* 城市节点 — 信号到达即点亮, 落点用亮度 pop 表达 (涟漪圆环已毙 — 模板动效) */}
        {Object.keys(WORLD_MAP.cities).map((n) => {
          const [cx, cy] = city(n);
          const arrival = hops.find((h) => h.b === n);
          const on = n === "sf" ? mapReveal : arrival ? arrival.draw : 0;
          if (on < 0.9) return null;
          const sinceLit = arrival ? t3 - (8 + arrival.i * HOP_STAGGER + HOP_DRAW) : t3;
          const pop = interpolate(sinceLit, [0, 10], [1.7, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <circle
              key={n}
              cx={cx}
              cy={cy}
              r={5 * pop}
              fill={pop > 1.25 ? "#DFFFE2" : G}
              opacity={0.95}
              style={{ filter: `drop-shadow(0 0 ${9 * pop}px ${G})` }}
            />
          );
        })}
      </svg>

      {/* latency 戳 — 跳线画完浮现, 机器凭证 */}
      {hops
        .filter((h) => h.ms)
        .map(({ a, b, ms, cx, cy, draw }) => (
          <div
            key={`ms-${a}-${b}`}
            style={{
              position: "absolute",
              left: cx - 40,
              top: cy + 26,
              fontSize: 24,
              fontFamily: theme.font.mono,
              color: `${G}CC`,
              opacity: interpolate(draw, [0.95, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {ms}
          </div>
        ))}

      <div style={{ position: "absolute", left: 110, top: 110 }}>
        <h2 style={headlineStyle}>
          <SplitText text="Global routing" delay={BEAT3 + 2} staggerFrames={1} distance={26} />
        </h2>
      </div>
    </AbsoluteFill>
  );
};

export const Act4: React.FC = () => {
  const frame = useCurrentFrame();
  const wA = beatWindow(frame, 0, BEAT2);
  const wB = beatWindow(frame, BEAT2, BEAT3);
  const wC = beatWindow(frame, BEAT3, 999);

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Atmosphere intensity={0.9} horizonY={0.8} />
      {wA > 0 ? (
        <AbsoluteFill style={{ opacity: wA }}>
          <BeatUptime frame={frame} />
        </AbsoluteFill>
      ) : null}
      {wB > 0 && frame > BEAT2 - 8 ? (
        <AbsoluteFill style={{ opacity: wB }}>
          <BeatFailover frame={frame} />
        </AbsoluteFill>
      ) : null}
      {wC > 0 && frame > BEAT3 - 8 ? (
        <AbsoluteFill style={{ opacity: wC }}>
          <BeatRouting frame={frame} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
