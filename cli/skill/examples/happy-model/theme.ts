/**
 * [INPUT]: brand-report.json derived design truth and local generated project data
 * [OUTPUT]: theme object — global first-cut design tokens
 * [POS]: generated project's design-token spine, consumed by scenes and components
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const theme = {
  color: {
    bg: "#000000",
    panel: "#0F0F0F",
    card: "#1A1A1A",
    surface: "#292929",
    text: "#F8FAFC",
    textBody: "#CBCDCF",
    textMuted: "rgba(203, 205, 207, 0.52)",
    primary: "#00C805",
    accent: "#FFFFFF",
    border: "rgba(248, 250, 252, 0.08)",
    borderActive: "rgba(248, 250, 252, 0.18)",
  },

  font: {
    heading: "Geist",
    body: "Geist",
    mono: "Geist Mono",
  },

  radius: {
    sm: 8,
    md: 14,
    lg: 22,
    xl: 28,
  },

  // Context-scoped font sizes. NEVER use a flat 28px floor — that
  // turns every video into a Fisher-Price menu. Real premium video
  // uses sharp size contrast: huge hero + tiny mockup chrome.
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
