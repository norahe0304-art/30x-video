/**
 * [INPUT]: 官方能力图 taskbar/app-control/local-files/natural-conversation (kind=demo 可叠字), theme
 * [OUTPUT]: Act3 — 四拍能力序列 (VO3 短语切点 local 73/111/180): 官方图全出血逐拍推移 + 单行编辑部 caption (family: sequenced-fullscreen-singles)
 * [POS]: 第三幕 / showcase; 真资产轮播, 每拍一图一句, 零小字堆叠
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// VO3 短语 onset (evidence/vo-timing.json): vo3@16.4s, Act3 起点 f469 (15.63s)
const BEATS = [
  { img: "brand/taskbar-desktop.jpg", caption: "The task bar.", at: 0 },
  { img: "brand/app-control-desktop.jpg", caption: "App control.", at: 73 },
  { img: "brand/local-files-desktop.jpg", caption: "Local files.", at: 111 },
  { img: "brand/natural-conversation-desktop.jpg", caption: "Just talk to it.", at: 180 },
] as const;

export const Act3: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#3A423C" }}>
      {BEATS.map((b, i) => {
        const start = b.at;
        const end = i < BEATS.length - 1 ? BEATS[i + 1].at : 999;
        const win =
          interpolate(frame, [start - 7, start], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
          (end >= 900 ? 1 : interpolate(frame, [end - 7, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        if (win <= 0) return null;
        const local = frame - start;
        const span = (end >= 900 ? 336 : end) - start;
        // 每拍缓慢平移推近 — 图是主角, 动作要克制
        const drift = interpolate(local, [0, span], [1.04, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const capIn = interpolate(local, [8, 24], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <AbsoluteFill key={b.img} style={{ opacity: win }}>
            <AbsoluteFill style={{ transform: `scale(${drift})` }}>
              <Img src={staticFile(b.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </AbsoluteFill>
            {/* 左上角轻纱 — caption 住进官方图自己的留白区, 不压其烘焙 UI */}
            <AbsoluteFill style={{ background: "linear-gradient(160deg, rgba(20,24,21,0.34) 0%, transparent 38%)" }} />
            <div
              style={{
                position: "absolute",
                left: 110,
                top: 96,
                fontFamily: theme.font.heading,
                fontWeight: 500,
                fontSize: 118,
                letterSpacing: "-0.04em",
                color: "#FAF8F5",
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 30}px)`,
                textShadow: "0 4px 40px rgba(0,0,0,0.35)",
              }}
            >
              {b.caption}
            </div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
