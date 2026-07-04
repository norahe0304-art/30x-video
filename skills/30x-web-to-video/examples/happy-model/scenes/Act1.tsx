/**
 * [INPUT]: remotion 原语, theme, Atmosphere, public/brand/logo.png
 * [OUTPUT]: Act1 — 品牌几何生长式入场: 等距线框脚手架 draw-on → 霓虹绿 M 自底灌注成型 → bloom 稳定 (0-163f, cut @f151 SURGE t=5)
 * [POS]: 第一幕 / logo 揭幕 v3 — spring+shimmer 已毙 ("写死了一样的无聊"), logo 必须从世界里长出来
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { theme } from "../theme";

const G = theme.color.primary;
const SIZE = 470;

// ================================================================
// 等距线框脚手架 — 与 logo 自带 wireframe cube 同语言的六边形+Y脊
// 相对 470 视窗的立方体顶点 (iso 投影)
// ================================================================
const T = [235, 24] as const;   // 顶
const NE = [429, 136] as const;
const SE = [429, 334] as const;
const B = [235, 446] as const;  // 底
const SW = [41, 334] as const;
const NW = [41, 136] as const;
const C = [235, 248] as const;  // 前上顶点 (Y 脊交点)

// [起点, 终点, draw 延迟] — 六边沿等距角度依次勾勒, 再落三条 Y 脊
const EDGES: ReadonlyArray<[readonly [number, number], readonly [number, number], number]> = [
  [T, NE, 8],
  [NE, SE, 14],
  [SE, B, 20],
  [T, NW, 11],
  [NW, SW, 17],
  [SW, B, 23],
  [NW, C, 32],
  [NE, C, 34],
  [C, B, 38],
];

export const Act1: React.FC = () => {
  const frame = useCurrentFrame();

  // ── 阶段参数 (163f, cut @151; 首动 f8 < 3s 规则) ─────────────
  // f8-52   线框脚手架 draw-on
  // f40-88  M 自底向上灌注 (mask 前沿上移), 灌注中过亮如熔态
  // f88-112 bloom: 辉光爆点后回稳, 脚手架溶解归还给 logo 自带线框
  // f112+   呼吸怠速
  const atmosIn = interpolate(frame, [0, 26], [0.25, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // 灌注前沿: mask 渐变自 logo 底部推到顶部
  const pour = interpolate(frame, [40, 88], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const maskStop = interpolate(pour, [0, 1], [-20, 112]); // % 自底起算
  // 熔态过亮 → bloom 回稳
  const molten = interpolate(frame, [40, 84, 96, 112], [1.55, 1.35, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bloom = interpolate(frame, [84, 96, 130], [0, 1, 0.42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  // 脚手架: 画完 → 灌注期看护 → bloom 时溶解
  const scaffoldFade = interpolate(frame, [86, 112], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breathe = interpolate(Math.sin(frame / 42), [-1, 1], [0.09, 0.15]);

  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Atmosphere intensity={atmosIn} horizonY={0.76} />

      {/* 体积光柱 — 随灌注增强, 光从天顶落在生长中的 M 上 */}
      <div
        style={{
          position: "absolute",
          left: 960 - 230,
          top: -160,
          width: 460,
          height: 1100,
          background: `linear-gradient(180deg, ${G}00 0%, ${G}26 30%, ${G}14 62%, transparent 90%)`,
          filter: "blur(70px)",
          opacity: 0.3 + pour * 0.6,
        }}
      />
      {/* 地面光池 — 灌注完成后 M 站在光里 */}
      <div
        style={{
          position: "absolute",
          left: 960 - 380,
          top: 0.76 * 1080 - 70,
          width: 760,
          height: 150,
          borderRadius: "50%",
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${G}38 0%, transparent 70%)`,
          filter: "blur(34px)",
          opacity: pour,
        }}
      />
      {/* 呼吸底光 + bloom 爆点 */}
      <div
        style={{
          position: "absolute",
          left: 960 - 450,
          top: 476 - 450,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${G} 0%, transparent 62%)`,
          opacity: breathe * pour + bloom * 0.22,
          filter: "blur(80px)",
        }}
      />

      {/* 注意: 此容器不许加 transform/filter — 会创建 stacking context,
          隔离子层的 mix-blend-mode, logo 黑方底就会显形 (f96 bug 实证) */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: SIZE, height: SIZE, marginTop: -80 }}>
          {/* 等距线框脚手架 — 先于实体存在, 实体成型后溶解 */}
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ position: "absolute", inset: 0, opacity: scaffoldFade }}
          >
            {EDGES.map(([a, b, delay], i) => {
              const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
              const draw = interpolate(frame - delay, [0, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.inOut(Easing.cubic),
              });
              const isSpine = i >= 6;
              return (
                <line
                  key={i}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={isSpine ? G : "rgba(248,250,252,0.55)"}
                  strokeWidth={isSpine ? 1.8 : 1.4}
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - draw)}
                  style={isSpine ? { filter: `drop-shadow(0 0 6px ${G}88)` } : undefined}
                />
              );
            })}
            {/* 顶点标记 — 勾勒到位处亮起 */}
            {[T, NE, SE, B, SW, NW, C].map(([x, y], i) => {
              const on = interpolate(frame - (10 + i * 5), [0, 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return <circle key={i} cx={x} cy={y} r={3} fill="#DFFFE2" opacity={on * 0.9} />;
            })}
          </svg>

          {/* 真资产 M — 自底向上灌注成型 (mask 前沿), 熔态过亮回稳 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              mixBlendMode: "screen", // 黑方底在氛围上消失
              maskImage: `linear-gradient(0deg, black ${maskStop - 16}%, transparent ${maskStop}%)`,
              WebkitMaskImage: `linear-gradient(0deg, black ${maskStop - 16}%, transparent ${maskStop}%)`,
            }}
          >
            <Img
              src={staticFile("brand/logo.png")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                // drop-shadow 会沿不透明方底描出方形光晕 — bloom 一律交给背后的径向光层
                filter: `brightness(${molten})`,
              }}
            />
          </div>

          {/* 灌注前沿光线 — 熔态液面 (仅在前沿处于字形范围内时渲染) */}
          {maskStop > 6 && maskStop < 102 ? (
            <div
              style={{
                position: "absolute",
                left: 30,
                right: 30,
                top: `${100 - maskStop + 8}%`,
                height: 3,
                background: `linear-gradient(90deg, transparent, ${G}CC 30%, #DFFFE2 50%, ${G}CC 70%, transparent)`,
                filter: "blur(1px)",
                boxShadow: `0 0 18px 3px ${G}66`,
                opacity: 0.9,
              }}
            />
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
