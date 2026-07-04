/**
 * [INPUT]: brand-report.json derived design truth and local generated project data
 * [OUTPUT]: theme object — global first-cut design tokens
 * [POS]: generated project's design-token spine, consumed by scenes and components
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export const theme = {
  color: {
    bg: "#101010",
    panel: "#1E1E1E",
    card: "#282828",
    surface: "#363636",
    text: "#F9F9F9",
    textBody: "#CFCFCF",
    textMuted: "rgba(207, 207, 207, 0.52)",
    primary: "#CBEFAE",
    accent: "#E4FFB9",
    border: "rgba(249, 249, 249, 0.08)",
    borderActive: "rgba(249, 249, 249, 0.18)",
  },

  font: {
    heading: "Roboto",
    body: "Roboto",
    mono: "Roboto Mono",
  },

  radius: {
    sm: 8,
    md: 18,
    lg: 28,
    xl: 36,
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
