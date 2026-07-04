/**
 * [INPUT]: brand-report.json designTruth + 官网实证 (homepage 分段截图 + can label 纹理 + 官方棚拍图采样)
 * [OUTPUT]: theme object — MANA 暖色浅底世界的全局设计 token
 * [POS]: generated project's design-token spine, consumed by scenes and components
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 *
 * 品牌世界推导（全部来自真实证据，非模板）：
 * - 底色 #FEF7E6 奶油纸 — 官网主底（homepage seg0/seg2/seg4 实测）
 * - 墨色 #141414 — 官网巨型编辑部标题的近黑
 * - 主黄 #FFD372 — designTruth.primaryColor（官网 IG 段整屏用它）
 * - 深蓝 #2B3D73 — designTruth.accentColor（官网按钮 offset 阴影 / can 顶带）
 * - 四个 flavor 房间色 — 从四张官方棚拍图边缘直接采样（无缝全出血扩展）
 * - 字体 Neue Montreal — 官网自带 woff2（蒙特利尔字体厂，魁北克品牌的本地选择）
 */

export const theme = {
  color: {
    bg: "#FEF7E6", // 奶油纸底 — 光的世界，不是黑洞
    panel: "#FFFDF6", // 浅底世界的"面板" = 更亮的纸
    card: "#FFFFFF",
    surface: "rgba(20, 20, 20, 0.06)",
    ink: "#141414", // 编辑部近黑
    inkSoft: "rgba(20, 20, 20, 0.62)",
    inkFaint: "rgba(20, 20, 20, 0.34)",
    text: "#141414", // 浅底世界: text = ink（全套反转）
    textBody: "rgba(20, 20, 20, 0.78)",
    textMuted: "rgba(20, 20, 20, 0.5)",
    primary: "#FFD372", // 暖黄
    accent: "#2B3D73", // 深蓝 — 阴影/描边/图标染色
    coral: "#F15B40", // 官网 Subscribe 按钮橘红
    magenta: "#E72F63",
    border: "rgba(20, 20, 20, 0.12)",
    borderActive: "rgba(20, 20, 20, 0.26)",
    // Flavor 房间 — 官方棚拍图边缘实测色
    flavorGreen: "#79C549",
    flavorBlue: "#4A7CD3",
    flavorPink: "#F996D2",
    flavorYellow: "#F6B830",
  },

  font: {
    heading: "Neue Montreal",
    body: "Neue Montreal",
    mono: "Neue Montreal", // 品牌无 mono 语汇；机器凭证用 tabular-nums 排数
  },

  radius: {
    sm: 8,
    md: 18,
    lg: 28,
    xl: 36,
    pill: 999, // 官网按钮全是胶囊
  },

  // 官网按钮语言: 胶囊 + 深蓝硬 offset 阴影（无模糊）
  shadow: {
    offset: "4px 6px 0 #2B3D73",
    offsetSmall: "3px 4px 0 #2B3D73",
  },

  // Context-scoped font sizes（typography.md）
  fontSize: {
    hero: 96,
    editorial: 200, // Law 3 编辑部巨字（每幕唯一时刻可到 200-320）
    sub: 36,
    sectionTag: 22,
    body: 28,
    caption: 20,
    mockupTitle: 22,
    mockupRow: 18,
    mockupLabel: 14,
    metric: 300, // 营养面板巨数字
    metricLabel: 24,
  },
} as const;

export type Theme = typeof theme;
