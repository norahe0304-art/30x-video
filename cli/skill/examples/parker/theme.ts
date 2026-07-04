/**
 * [INPUT]: brand-report.json designTruth + homepage.png 实勘纠偏 (奶油纸面/紫/深绿分区, 红字标, 黄step徽章)
 * [OUTPUT]: theme object — Parker 复古编辑部设计 token（light 纸面主场，非默认暗场）
 * [POS]: 全项目设计 token 脊柱, 被 scenes 与 components 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const theme = {
  color: {
    // 纸面主场 — 官网奶油底
    bg: "#FCF5E2",
    panel: "#FFFDF6",
    card: "#FFFFFF",
    surface: "#F3EBD3",
    // 墨色文字（奶油底上的正文/标题）
    text: "#1E1E1E",
    textBody: "#323232",
    textMuted: "rgba(30, 30, 30, 0.55)",
    // 品牌角色色（全部来自官网真实分区）
    primary: "#F42615", // 红 — 字标与强调词专用
    accent: "#7F78C5", // 紫 — 分区满铺
    yellow: "#EEBF12", // Step 1 徽章 / 高亮条
    greenDeep: "#194D15", // 深绿分区（proof / pricing）
    greenLight: "#72D184", // Step 3 徽章
    cream: "#FCF5E2",
    ink: "#1E1E1E",
    border: "rgba(30, 30, 30, 0.14)",
    borderActive: "rgba(30, 30, 30, 0.32)",
  },

  font: {
    heading: "Newsreader", // 官网衬线大标题气质
    body: "Instrument Sans", // 官网正文人文无衬线
    mono: "JetBrains Mono", // 机器凭证文本
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    xl: 30,
  },

  // Context-scoped font sizes（见 typography.md — 角色定尺寸，不是统一地板）
  fontSize: {
    hero: 96,
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
