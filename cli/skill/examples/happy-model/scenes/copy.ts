/**
 * [INPUT]: brand-report.json 派生的真实站点文案 (不造假)
 * [OUTPUT]: HOST, TAGLINE, PRIMARY_CTA
 * [POS]: scenes 共享文案源 — 各幕统一引用, 消灭复制漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export const HOST = "happy-model.com";
export const TAGLINE = "AI API relay station";
// v3: Act5 换无字底图自建 lockup, TAGLINE 回归巨字席位; 副句用真实主张三连
export const CLOSE_LINE = "Every major model.";
export const SUB_LINE = "One key. One bill. Every model.";
export const PRIMARY_CTA = "Get Key";
