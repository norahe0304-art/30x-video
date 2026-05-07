/**
 * [INPUT]: VideoScript scenes with voLine, VoArchetype
 * [OUTPUT]: VoAsset (wav file path + duration)
 * [POS]: scripts/ pipeline 第 [5] 步; TTS via hyperframes-media (Kokoro)
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  VO Synthesizer — single provider via hyperframes-media
//
//  Hyperframes ships a hyperframes-media skill with Kokoro TTS built
//  in. We use it as the single source. No multi-provider switching
//  — if you need higher-quality voices, upgrade hyperframes-media
//  and every skill depending on it benefits.
//
//  Why single provider:
//  - Multi-provider = N bugs × N maintenance × user-facing choice friction
//  - Kokoro is free, local, and good enough for v1
//  - Upgrade path = upgrade hyperframes-media, not 30x-video
// ================================================================

import { spawn } from "child_process";
import type { VideoScript, VoArchetype, VoAsset } from "./types.ts";

export interface VoSynthOptions {
  script: VideoScript;
  archetype: VoArchetype;
  outputPath: string;
  voice?: string;
}

// ----------------------------------------------------------------
//  Voice mapping: archetype → Kokoro voice name
// ----------------------------------------------------------------

const VOICE_MAP: Record<VoArchetype, string> = {
  none: "",
  "conversational-host": "bella",        // warm female
  "authoritative-narrator": "chris",     // deep male narrator
  "character-voice": "sarah",            // distinctive personality
  "multi-speaker": "bella",              // primary, second voice swapped per scene
};

export function pickVoice(archetype: VoArchetype): string {
  return VOICE_MAP[archetype];
}

// ----------------------------------------------------------------
//  Main synth — calls hyperframes-media via npx
//
//  Expected CLI shape (from hyperframes-media docs):
//    npx hyperframes media tts --text "..." --voice <name> --output <wav>
// ----------------------------------------------------------------

export async function synthesizeVoiceOver(opts: VoSynthOptions): Promise<VoAsset> {
  if (opts.archetype === "none") {
    throw new Error("synthesizeVoiceOver called with archetype=none");
  }

  const voice = opts.voice ?? pickVoice(opts.archetype);
  const fullText = opts.script.scenes
    .map((s) => s.voLine)
    .filter((l): l is string => Boolean(l))
    .join(" ");

  if (!fullText.trim()) {
    throw new Error("No VO lines found in script — cannot synthesize empty VO.");
  }

  await runHyperframesTts({
    text: fullText,
    voice,
    outputPath: opts.outputPath,
  });

  const durationSec = estimateVoDuration(opts.script);

  return {
    path: opts.outputPath,
    durationSeconds: durationSec,
    provider: "kokoro",
    voice,
    wpm: 150,
  };
}

interface TtsCallOptions {
  text: string;
  voice: string;
  outputPath: string;
}

async function runHyperframesTts(opts: TtsCallOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "hyperframes",
      "media",
      "tts",
      "--text",
      opts.text,
      "--voice",
      opts.voice,
      "--output",
      opts.outputPath,
    ];
    const child = spawn("npx", args, { stdio: "inherit" });

    child.on("error", (err) => {
      reject(
        new Error(
          `hyperframes-media TTS failed: ${err.message}\n` +
            `Install: npm install hyperframes && npx hyperframes init`
        )
      );
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `hyperframes-media TTS exited with code ${code}.\n` +
              `Verify hyperframes-media skill is installed.`
          )
        );
    });
  });
}

// ----------------------------------------------------------------
//  Helpers
// ----------------------------------------------------------------

export function estimateVoDuration(script: VideoScript, wpm = 150): number {
  const totalWords = script.scenes
    .map((s) => (s.voLine ?? "").split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);
  return (totalWords / wpm) * 60;
}
