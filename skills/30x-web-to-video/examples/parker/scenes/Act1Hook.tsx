/**
 * [INPUT]: remotion, theme, PaperWorld (PaperAtmosphere), Animations (Typewriter), 真资产 wordmark-red/mascot-clean
 * [OUTPUT]: Act1Hook — 奶油纸面开场: 真字标 lockup 入场 + 打字机衬线巨字 (官网复古 Mac 打字机梗)
 * [POS]: 第一幕 hook; 家族 typewriter-editorial-open; VO1 句1 "The way you make ads is about to change."
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { theme } from "../theme";
import { PaperAtmosphere } from "./PaperWorld";
import { Typewriter } from "../components/Animations";

// VO1 @ abs f39; 本幕 abs f0 起 — 词级对齐 (evidence/vo-timing.json):
// "The"(39) ... "change."(f39+43=82)。打字机与语音赛跑, 到 f88 打完。
export const Act1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // lockup 入场: mascot 先落, 字标跟进 (spring 无旋转, 高级不杂技)
  const mascotIn = spring({ frame: frame - 4, fps: 30, config: { damping: 13, stiffness: 130 } });
  const markIn = spring({ frame: frame - 10, fps: 30, config: { damping: 15, stiffness: 110 } });

  // 收尾轻微整体上浮 — 给下一幕让位的呼吸
  const settle = interpolate(frame, [96, 118], [0, -14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <PaperAtmosphere base={theme.color.bg} dust={16} lightY={26} seed={1} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${settle}px)`,
        }}
      >
        {/* 品牌 lockup — hero.png 洗透明的真资产 */}
        <div style={{ display: "flex", alignItems: "center", gap: 40, marginBottom: 78 }}>
          <Img
            src={staticFile("brand/mascot-clean.png")}
            style={{
              width: 190,
              transform: `translateY(${(1 - mascotIn) * -60}px) rotate(${(1 - mascotIn) * -10}deg)`,
              opacity: mascotIn,
            }}
          />
          <Img
            src={staticFile("brand/wordmark-red.png")}
            style={{
              width: 480,
              transform: `translateX(${(1 - markIn) * 36}px)`,
              opacity: markIn,
            }}
          />
        </div>

        {/* 打字机巨字 — 官网 hero 的 Mac 屏幕打字梗, 与 VO 同步 */}
        <div
          style={{
            fontFamily: theme.font.heading,
            fontWeight: 500,
            fontSize: 128,
            lineHeight: 1.08,
            letterSpacing: -2.5,
            color: theme.color.ink,
            textAlign: "center",
            maxWidth: 1560,
          }}
        >
          <Typewriter
            text="The way you make ads"
            delay={34}
            speed={0.62}
            cursor={false}
            visibleColor={theme.color.ink}
          />
          <br />
          <Typewriter
            text="is about to change."
            delay={66}
            speed={0.85}
            cursorChar="|"
            visibleColor={theme.color.ink}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
