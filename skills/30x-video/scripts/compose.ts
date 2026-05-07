/**
 * [INPUT]: VideoScript + DesignProfile + Format + assets (vo, bgm, stills)
 * [OUTPUT]: Hyperframes HTML + GSAP timeline
 * [POS]: scripts/ pipeline 第 [6] 步; 把镜头表变成可渲染的 HTML
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Composer — generates Hyperframes-compatible HTML + GSAP timeline
//
//  Hyperframes is HTML-driven. This module produces an HTML file with:
//    - Inline GSAP timeline animations
//    - <video> / <img> / <audio> tags for assets
//    - data-frame attributes for hyperframes seek alignment
//    - Typography from DesignProfile.fonts
//    - Color tokens from DesignProfile (when extracted)
//
//  This is a STUB for now. Full implementation requires:
//    - Knowledge of hyperframes' exact data attribute conventions
//    - GSAP timeline construction patterns
//    - Per-visual-style HTML generation logic (UI mockup vs typography vs cinematic)
// ================================================================

import type {
  BgmAsset,
  DesignProfile,
  Format,
  StyleComposition,
  VideoScript,
  VoAsset,
} from "./types.ts";

export interface ComposeInput {
  script: VideoScript;
  designProfile: DesignProfile;
  composition: StyleComposition;
  voAsset?: VoAsset;
  bgmAsset?: BgmAsset;
  outputHtmlPath: string;
}

const DIMENSIONS: Record<Format, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

export function composeHtml(input: ComposeInput): string {
  const dims = DIMENSIONS[input.composition.format];
  const { script, designProfile, composition, voAsset, bgmAsset } = input;

  // Build scene HTML blocks
  const sceneBlocks = script.scenes
    .map((scene, i) => sceneToHtml(scene, i, designProfile))
    .join("\n");

  // Build GSAP timeline
  const timelineJs = buildTimeline(script);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>30x-video composition</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeFont(designProfile.fonts.heading)}&family=${encodeFont(designProfile.fonts.body)}&display=swap">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    body {
      margin: 0;
      width: ${dims.width}px;
      height: ${dims.height}px;
      background: ${designProfile.backgroundColor ?? "#0a0a0a"};
      color: ${designProfile.textColor ?? "#fafafa"};
      font-family: '${designProfile.fonts.body}', sans-serif;
      overflow: hidden;
    }
    .scene {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }
    .scene[data-visible="true"] {
      opacity: 1;
    }
    .heading {
      font-family: '${designProfile.fonts.heading}', sans-serif;
      font-size: ${composition.format === "9:16" ? "72px" : "96px"};
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    /* anti-slop: NO purple gradients, NO uniform card-stacks, NO icon-circles */
  </style>
</head>
<body>
${sceneBlocks}
${voAsset ? `  <audio id="vo" src="${voAsset.path}" preload="auto"></audio>` : ""}
${bgmAsset ? `  <audio id="bgm" src="${bgmAsset.path}" preload="auto"></audio>` : ""}
<script>
${timelineJs}
</script>
</body>
</html>
`;
  return html;
}

function sceneToHtml(scene: VideoScript["scenes"][number], index: number, profile: DesignProfile): string {
  const text = scene.onScreenText ?? "";
  return `  <div class="scene" id="scene-${scene.index}" data-frame-start="${calcStartFrame(scene, index)}">
    ${text ? `<div class="heading">${escapeHtml(text)}</div>` : ""}
  </div>`;
}

function calcStartFrame(scene: VideoScript["scenes"][number], index: number): number {
  // Hyperframes data-frame: cumulative duration in frames at 30fps
  // This is naive — the orchestrator should fix exact frames once total known
  return index * 30;
}

function buildTimeline(script: VideoScript): string {
  const tweens: string[] = [];
  let cursor = 0;
  for (const scene of script.scenes) {
    tweens.push(
      `  tl.to("#scene-${scene.index}", { opacity: 1, duration: 0.3 }, ${cursor.toFixed(2)});`
    );
    cursor += scene.durationSeconds;
    tweens.push(
      `  tl.to("#scene-${scene.index}", { opacity: 0, duration: 0.3 }, ${cursor.toFixed(2)});`
    );
  }
  return `const tl = gsap.timeline({ paused: false });\n${tweens.join("\n")}`;
}

function encodeFont(fontName: string): string {
  return fontName.replace(/\s+/g, "+");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
