/**
 * [INPUT]: mode name, fixed scene blueprints
 * [OUTPUT]: video mode constants and scene blueprint helpers
 * [POS]: mode-aware structure layer, consumed by MainVideo and future orchestrators
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

export type VideoMode = "product-evidence" | "editorial";

export type SceneBlueprint = {
  title: string;
  eyebrow: string;
  durationInFrames: number;
  note: string;
};

export type ModeBlueprint = {
  name: string;
  subtitle: string;
  actLabel: string;
  scenes: SceneBlueprint[];
};

export const DEFAULT_VIDEO_MODE: VideoMode = "product-evidence";

export const MODE_BLUEPRINTS: Record<VideoMode, ModeBlueprint> = {
  "product-evidence": {
    name: "Product Evidence Mode",
    subtitle: "UI-led first cut for SaaS, infra, fintech, and devtool brands",
    actLabel: "Proof-first structure",
    scenes: [
      { title: "Authority", eyebrow: "ACT 1", durationInFrames: 180, note: "Brand lockup + thesis" },
      { title: "Reveal", eyebrow: "ACT 2", durationInFrames: 180, note: "Product entry + context shift" },
      { title: "Showcase", eyebrow: "ACT 3", durationInFrames: 480, note: "Feature-led UI vignettes" },
      { title: "Proof", eyebrow: "ACT 4", durationInFrames: 180, note: "Signals, metrics, credibility" },
      { title: "Close", eyebrow: "ACT 5", durationInFrames: 180, note: "CTA + brand memory" },
    ],
  },
  editorial: {
    name: "Editorial Mode",
    subtitle: "Brand-led first cut for no-UI, consumer, services, and image-first sites",
    actLabel: "Mood-first structure",
    scenes: [
      { title: "Mood", eyebrow: "ACT 1", durationInFrames: 180, note: "Atmosphere + opening tension" },
      { title: "Claim", eyebrow: "ACT 2", durationInFrames: 180, note: "Brand promise + narrative anchor" },
      { title: "Motif", eyebrow: "ACT 3", durationInFrames: 480, note: "Visual rhythm + repeated forms" },
      { title: "Trust", eyebrow: "ACT 4", durationInFrames: 180, note: "Proof by language, imagery, or social signal" },
      { title: "Close", eyebrow: "ACT 5", durationInFrames: 180, note: "Final line + brand memory" },
    ],
  },
};

export const getModeBlueprint = (mode: VideoMode = DEFAULT_VIDEO_MODE) =>
  MODE_BLUEPRINTS[mode];
