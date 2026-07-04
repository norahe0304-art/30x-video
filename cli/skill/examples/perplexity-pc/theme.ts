/**
 * [INPUT]: 品牌抓取数据 (颜色/字体/视觉风格)
 * [OUTPUT]: theme 对象 — 全局设计 token
 * [POS]: 设计系统核心, 被所有 scene/component 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

// ================================================================
// STEP 2: 用品牌抓取的真实数据替换以下占位值
// NEVER guess — 所有值必须来自 scrape
// ================================================================
export const theme = {
  color: {
    // 60% — 主背景
    bg: "#FAF8F5",
    panel: "#FFFFFF",
    card: "#F1EDE6",
    surface: "#E9E4DB",

    // 30% — 文字层级
    text: "#101010",
    textBody: "#3A3A38",
    textMuted: "rgba(16,16,16,0.55)",

    // 10% — 品牌强调色
    primary: "#20808D",
    accent: "#20808D",

    // 边框
    border: "rgba(16,16,16,0.12)",
    borderActive: "rgba(16,16,16,0.25)",
  },

  font: {
    // 从 @remotion/google-fonts 加载, 见 lib/fonts.ts
    heading: "Instrument Sans",
    body: "Instrument Sans",
    mono: "Roboto Mono",
  },

  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  // ============================================================
  // FONT SIZE SCALE — context-scoped, NOT a flat 28px floor.
  //
  // The old "≥28px minimum everywhere" rule made every video look
  // like an old-folks-home menu. Real premium video uses sharp size
  // contrast: huge hero text (60-80px) against tiny captions (16-18px),
  // with mockup chrome at native UI sizes (12-22px) so the mockup
  // looks like real software, not Fisher-Price plastic.
  //
  // Use these tokens by SEMANTIC role, not by gut-check pixels:
  //   hero       — 1-line title in Acts 1, 2, 5 (the biggest text)
  //   sub        — supporting line under hero
  //   sectionTag — small uppercase eyebrow above hero (kicker)
  //   body       — paragraphs, descriptions
  //   caption    — bottom-of-frame attribution, host name
  //   mockupTitle — title bar text inside a UI mockup
  //   mockupRow  — row label / cell content inside table or list
  //   mockupLabel — tiny field label / metadata inside mockup
  //   metric     — large number in proof act
  //   metricLabel — small caption under metric
  // ============================================================
  fontSize: {
    hero: 80,
    sub: 36,
    sectionTag: 22,
    body: 28,
    caption: 20,
    mockupTitle: 22,
    mockupRow: 18,
    mockupLabel: 14,
    metric: 96,
    metricLabel: 22,
  },
} as const;
