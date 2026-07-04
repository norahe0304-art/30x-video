/**
 * [INPUT]: cofounder.co 真身设计真相 (asset-audit.md 第二批) — 纸面奶油/墨色/像素天空蓝/草绿/向日葵黄
 * [OUTPUT]: theme object — 全局设计 token (mobbin 壳色板已废弃)
 * [POS]: 设计 token 脊柱, 被 scenes 与 components 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const theme = {
  color: {
    // 纸面世界 — cofounder.co 的 cream paper 段落
    bg: "#F7F5EF",
    panel: "#FFFFFF",
    card: "#FFFFFF",
    surface: "#EFECE4",
    // 墨色 — logo-dark.svg fill rgba(38,35,35) 自证
    text: "#262323",
    textBody: "rgba(38,35,35,0.72)",
    textMuted: "rgba(38,35,35,0.46)",
    // 像素世界三原色 — og/footer/chapter art 采样
    primary: "#3E8EE4", // pixel sky blue
    accent: "#5CA83E", // pixel grass green
    sun: "#F2C744", // sunflower yellow
    skyDeep: "#2069C8",
    approve: "#3F9D4E",
    warn: "#C98A2B",
    border: "rgba(38,35,35,0.12)",
    borderActive: "rgba(38,35,35,0.24)",
  },

  font: {
    heading: "Instrument Sans", // Neoris(商用不可得) 的 humanist 近似
    body: "Instrument Sans",
    mono: "Departure Mono", // 官方自托管 woff2 已冻结 public/fonts/
    monoAlt: "IBM Plex Mono", // 站上真用的第二 mono
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    xl: 30,
  },

  fontSize: {
    hero: 84,
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
