/**
 * [INPUT]: VideoScript scenes with voLine, VoArchetype
 * [OUTPUT]: VoAsset (wav file path + duration + provider info)
 * [POS]: scripts/ pipeline 第 [5] 步; 多供应商 TTS 适配
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  VO Synthesizer — multi-provider TTS
//
//  Provider priority (fall back if previous unavailable):
//    1. Kokoro (local, free) — default
//    2. ElevenLabs (paid, highest quality) — if ELEVENLABS_API_KEY set
//    3. OpenAI TTS — if OPENAI_API_KEY set
//
//  This module is a STUB for now. Full implementation requires:
//    - hyperframes-media skill installed for Kokoro
//    - ElevenLabs / OpenAI HTTP clients
//    - ffmpeg for concat + duration measurement
// ================================================================

import type { VoArchetype, VoAsset, VideoScript } from "./types.ts";

export interface VoSynthOptions {
  script: VideoScript;
  archetype: VoArchetype;
  outputPath: string;
  provider?: "kokoro" | "elevenlabs" | "openai";
  voice?: string;
}

interface VoiceRegistry {
  kokoro: Record<VoArchetype, string>;
  elevenlabs: Record<VoArchetype, string>;
  openai: Record<VoArchetype, string>;
}

const VOICE_REGISTRY: VoiceRegistry = {
  kokoro: {
    none: "",
    "conversational-host": "bella",
    "authoritative-narrator": "chris",
    "character-voice": "sarah",
    "multi-speaker": "bella",
  },
  elevenlabs: {
    none: "",
    "conversational-host": "Rachel",
    "authoritative-narrator": "Antoni",
    "character-voice": "Daniel",
    "multi-speaker": "Rachel",
  },
  openai: {
    none: "",
    "conversational-host": "nova",
    "authoritative-narrator": "onyx",
    "character-voice": "shimmer",
    "multi-speaker": "nova",
  },
};

export function pickVoice(provider: VoSynthOptions["provider"], archetype: VoArchetype): string {
  if (!provider) provider = "kokoro";
  return VOICE_REGISTRY[provider][archetype] ?? "";
}

export function detectAvailableProvider(): "kokoro" | "elevenlabs" | "openai" {
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "kokoro";
}

export async function synthesizeVoiceOver(opts: VoSynthOptions): Promise<VoAsset> {
  if (opts.archetype === "none") {
    throw new Error("synthesizeVoiceOver called with archetype=none");
  }

  const provider = opts.provider ?? detectAvailableProvider();
  const voice = opts.voice ?? pickVoice(provider, opts.archetype);

  // STUB: actual provider integration goes here
  // For now, throw a helpful "not implemented" with guidance
  throw new Error(
    `VO synth not yet implemented. Provider chosen: ${provider} / voice: ${voice}.\n` +
      `To implement:\n` +
      `  - Kokoro: install hyperframes-media skill, call its TTS pipeline\n` +
      `  - ElevenLabs: HTTP call to api.elevenlabs.io with ELEVENLABS_API_KEY\n` +
      `  - OpenAI: HTTP call to api.openai.com/v1/audio/speech with OPENAI_API_KEY\n` +
      `Output: wav file at ${opts.outputPath} + duration via ffprobe`
  );
}

export function estimateVoDuration(script: VideoScript, wpm = 150): number {
  const totalWords = script.scenes
    .map((s) => (s.voLine ?? "").split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);
  return (totalWords / wpm) * 60;
}
