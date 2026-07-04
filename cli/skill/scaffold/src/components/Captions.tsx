/**
 * [INPUT]: 词级时间戳 transcript ({text,start,end}[] 秒), remotion useCurrentFrame/useVideoConfig, theme token 由调用方注入
 * [OUTPUT]: WordCaptions — 词级同步字幕, 6 风格预设: karaoke / scalePop / weightShift / neonGlow / kineticSlam / editorial
 * [POS]: scaffold 组件库的字幕层; 还"caption 体系 0 vs 16"的债 (对标 hyperframes caption-* 高频子集); 社媒竖版(静音播放)必备
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 数据源: ElevenLabs with-timestamps 或 whisper 词级 JSON (narration-sync.md 管线原样输出)。
 * 用法:
 *   <WordCaptions words={transcript} style="karaoke" accent={theme.color.primary} bottomPx={180} />
 * 分页: 按 maxChars 贪心分组, 页在首词 start 进场、末词 end + holdS 退场 — 无跨页残影。
 */
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type CapWord = { text: string; start: number; end: number };
export type CaptionStyle =
  | "karaoke"
  | "scalePop"
  | "weightShift"
  | "neonGlow"
  | "kineticSlam"
  | "editorial";

type Page = { words: CapWord[]; start: number; end: number };

const paginate = (words: CapWord[], maxChars: number): Page[] => {
  const pages: Page[] = [];
  let cur: CapWord[] = [];
  let len = 0;
  for (const w of words) {
    if (len + w.text.length + 1 > maxChars && cur.length > 0) {
      pages.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
      len = 0;
    }
    cur.push(w);
    len += w.text.length + 1;
  }
  if (cur.length > 0) pages.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
  return pages;
};

export const WordCaptions: React.FC<{
  words: CapWord[];
  style?: CaptionStyle;
  /** 高亮色 — 品牌主色 */
  accent?: string;
  baseColor?: string;
  fontFamily?: string;
  fontSize?: number;
  /** 距底部 px (竖版建议画高的 ~22%) */
  bottomPx?: number;
  maxChars?: number;
  /** 末词后的页保持秒数 */
  holdS?: number;
  /** editorial 风格的强调词 (小写匹配); 缺省高亮每页最长词 */
  keywords?: string[];
}> = ({
  words,
  style = "karaoke",
  accent = "#CBEFAE",
  baseColor = "#F8FAFC",
  fontFamily = "Roboto",
  fontSize = 64,
  bottomPx = 160,
  maxChars = 26,
  holdS = 0.35,
  keywords,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pages = useMemo(() => paginate(words, maxChars), [words, maxChars]);

  const page = pages.find((p) => t >= p.start && t <= p.end + holdS);
  if (!page) return null;

  // 页进场: 首词 start 起 5f — kineticSlam 用重, 其余用轻
  const pageIn = interpolate(t, [page.start, page.start + 5 / fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slamScale = style === "kineticSlam" ? 1.22 - pageIn * 0.22 : 1;
  const kwSet = new Set(
    (keywords ?? [page.words.reduce((a, b) => (b.text.length > a.text.length ? b : a)).text]).map((k) =>
      k.toLowerCase().replace(/[^a-z0-9]/g, ""),
    ),
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: bottomPx,
          display: "flex",
          justifyContent: "center",
          gap: "0.32em",
          flexWrap: "wrap",
          padding: "0 8%",
          fontFamily,
          fontSize,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          opacity: pageIn,
          transform: `scale(${slamScale})`,
          transformOrigin: "center bottom",
          textShadow: "0 2px 24px rgba(0,0,0,0.75)",
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < w.end;
          const done = t >= w.end;
          const wp = interpolate(t, [w.start, Math.max(w.start + 0.001, w.end)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const clean = w.text.toLowerCase().replace(/[^a-z0-9]/g, "");

          let color = baseColor;
          let transform = "none";
          let textShadow: string | undefined;
          let fontWeight = 500;
          let backgroundImage: string | undefined;
          let backgroundClip: string | undefined;

          switch (style) {
            case "karaoke":
              // 已读染色, 活动词渐变填充推进
              if (done) color = accent;
              else if (active) {
                backgroundImage = `linear-gradient(90deg, ${accent} ${wp * 100}%, ${baseColor} ${wp * 100}%)`;
                backgroundClip = "text";
                color = "transparent";
              }
              break;
            case "scalePop":
              if (active) {
                const pop = 1 + Math.sin(Math.min(wp * 2, 1) * Math.PI) * 0.18;
                transform = `scale(${pop})`;
                color = accent;
              } else if (done) color = baseColor;
              else color = "rgba(248,250,252,0.45)";
              break;
            case "weightShift":
              fontWeight = active ? 500 : 300;
              color = active ? baseColor : "rgba(248,250,252,0.6)";
              if (active) textShadow = `0 0 30px ${accent}66`;
              break;
            case "neonGlow":
              color = active || done ? baseColor : "rgba(248,250,252,0.4)";
              if (active) textShadow = `0 0 14px ${accent}, 0 0 42px ${accent}88`;
              break;
            case "kineticSlam":
              color = active ? accent : baseColor;
              break;
            case "editorial":
              color = kwSet.has(clean) ? accent : baseColor;
              break;
          }

          return (
            <span
              key={`${w.start}-${i}`}
              style={{
                color,
                transform,
                fontWeight,
                textShadow,
                backgroundImage,
                WebkitBackgroundClip: backgroundClip as never,
                backgroundClip: backgroundClip as never,
                display: "inline-block",
                transition: "none",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const CAPTION_STYLES: CaptionStyle[] = [
  "karaoke",
  "scalePop",
  "weightShift",
  "neonGlow",
  "kineticSlam",
  "editorial",
];
