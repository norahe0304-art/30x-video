# Audio Integration Patterns

Audio sync, beat detection, voiceover ducking, and VO timeline systems for Remotion videos.

## Beat Sync System

Align scene transitions and animations to music beats for rhythmic, polished videos.

### beats.ts — Beat Timestamp Array

**Source of truth:** `audiomap.json` from `scripts/analyze-audiomap.py` (see [rules/beat-sync.md](../rules/beat-sync.md)). Copy `beats_sec` verbatim — never hand-generate the array from BPM math, and only use it when the audiomap says `rhythmic: true`.

```tsx
// Paste audiomap.beats_sec verbatim (real detected beats, not BPM arithmetic)
export const BEATS: number[] = [
  1.045, 1.533, 2.02, 2.508, 2.995,
  // ... rest of audiomap.beats_sec
];

export const isOnBeat = (timeSec: number, toleranceSec = 0.05): boolean =>
  BEATS.some(b => Math.abs(timeSec - b) <= toleranceSec);

export const isOnStrongBeat = (timeSec: number, toleranceSec = 0.05): boolean =>
  BEATS.filter((_, i) => i % 4 === 0).some(b => Math.abs(timeSec - b) <= toleranceSec);

export const getBeatProgress = (timeSec: number): number => {
  const beatInterval = 60 / 125; // adjust to your BPM
  return (timeSec % beatInterval) / beatInterval;
};
```

### Using Beats in Components

```tsx
const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const currentSec = frame / fps;

// Pulse on beat
const beatPulse = isOnBeat(currentSec)
  ? spring({ frame: frame % 15, fps, config: { damping: 8, stiffness: 200 } })
  : 0;

<div style={{ transform: `scale(${1 + beatPulse * 0.05})` }}>
  {children}
</div>
```

## BGM Auto-Duck

Lower background music volume when voiceover is playing.

```tsx
import { Audio, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface VoSegment {
  start: number;   // seconds
  duration: number; // seconds
  file: string;
}

const BGMWithDuck: React.FC<{
  musicFile: string;
  voSegments: VoSegment[];
  baseVolume?: number;
  duckVolume?: number;
  fadeDuration?: number; // frames for duck transition
}> = ({
  musicFile, voSegments,
  baseVolume = 0.7, duckVolume = 0.15, fadeDuration = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const isVoActive = voSegments.some(
    seg => currentSec >= seg.start && currentSec < seg.start + seg.duration
  );

  // Smooth transition between ducked and full volume
  const volume = isVoActive ? duckVolume : baseVolume;

  return <Audio src={staticFile(musicFile)} volume={volume} />;
};
```

### Advanced Duck with Edge Fade

Smoothly ramp volume at VO boundaries instead of hard cuts:

```tsx
const computeDuckedVolume = (
  frame: number, fps: number,
  voSegments: VoSegment[],
  baseVol: number, duckVol: number, fadeFrames: number,
): number => {
  const sec = frame / fps;

  for (const seg of voSegments) {
    const segEnd = seg.start + seg.duration;

    // Inside VO segment — check edge fade
    if (sec >= seg.start && sec < segEnd) {
      const fadeInProgress = interpolate(
        sec, [seg.start, seg.start + fadeFrames / fps], [baseVol, duckVol],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      const fadeOutProgress = interpolate(
        sec, [segEnd - fadeFrames / fps, segEnd], [duckVol, baseVol],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );
      return Math.min(fadeInProgress, fadeOutProgress);
    }
  }

  return baseVol;
};
```

## Voiceover Timeline with Nudge Adjustment

Fine-tune VO segment timing without re-recording:

```tsx
type VoDefaults = Record<string, { start: number; duration: number; file: string }>;
type VoNudges = Record<string, number>; // seconds to shift each segment

const resolveVoSegments = (
  defaults: VoDefaults,
  nudges: VoNudges = {},
): VoSegment[] =>
  Object.entries(defaults).map(([key, seg]) => ({
    ...seg,
    start: Math.max(0, seg.start + (nudges[key] ?? 0)),
  }));

// Usage in Root.tsx schema:
const videoPropsSchema = z.object({
  voEnabled: z.boolean().default(true),
  voNudges: z.record(z.string(), z.number()).default({}),
  // ...
});

// Apply nudges
const voSegments = resolveVoSegments(VO_DEFAULTS, props.voNudges);
```

## TTS Voiceover — ElevenLabs (首选) / Kokoro (免费兜底)

VO 生成走多 provider（hyperframes step-4-vo.md 移植，2026-07-04 happy-model 验证）：

### ElevenLabs `with-timestamps` — 词级时间戳白送，跳过 whisper 步

```bash
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/<VOICE_ID>/with-timestamps?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
  -d '{"text":"...","model_id":"eleven_multilingual_v2"}'
# 返回 { audio_base64, alignment: { characters, character_start_times_seconds, character_end_times_seconds } }
```

- **对齐数据是 TTS 引擎的 ground truth** — 直接存 `evidence/vo-timing.json`，beat-lock 验证用它；whisper 只在需要"听写复核发音"时才跑。
- **受限 key 处理：** 缺 `voices_read` 权限会 401 — 不是死路，跳过 voice 列表直接用已知 premade voice ID（男声旁白 Brian `nPczCjzI2devNBz1zQrb`、Adam `pNInz6obpgDQGcFmaJgB`；女声 Rachel `21m00Tcm4TlvDq8ikWAM`）。缺 `music_generation` 同理只影响 Music API。用户贴 key 时照用别评论，写进项目 `.env`（`.gitignore` 掉）。
- 每段台词单独生成单独文件（`vo1..voN`），预算时长写在 narration.md；生成后实测时长必须逐段回填 VO_CUES。
- mp3 → m4a 用 macOS 自带 `afconvert -f m4af -d aac`（无需 ffmpeg）。

### VO_CUES 驱动 duck — 包络从 cues 派生，别手写区间

```tsx
const VO_CUES = [
  { src: "brand/vo/vo1.m4a", startS: 5.5, durS: 7.55 },
  // ...
] as const;
// duck = 各 cue 包络的 min — 加减 VO 段无需改任何包络逻辑（消灭特殊情况）
const duck = VO_CUES.reduce((gain, cue) => {
  const inF = cue.startS * fps, outF = (cue.startS + cue.durS) * fps;
  return Math.min(gain, interpolate(frame,
    [inF - RAMP, inF, outF, outF + RAMP], [1, DUCK_GAIN, DUCK_GAIN, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
}, 1);
```

手写 `DUCK_SPAN_S = [5, 33]` 这类固定窗口是反面教材 — 新增 CTA 段 VO 落在窗口外，BGM 不让位。

### Kokoro — 零 API key 的本地 TTS 兜底（hyperframes CLI 自带，2026-07-04 本机验证）

没有任何 TTS key 时 VO 不降级为"没有"——Kokoro-82M 本地模型，54 个声音：

```bash
npx hyperframes tts "narration text here" --voice af_nova --output narration.wav
npx hyperframes tts --list   # 全部 54 声音
```

- **无词级时间戳** — 生成后接 whisper 转写拿 word timestamps（narration-sync.md Rule 1 照走）
- **发音坑**（品质比 ElevenLabs 糙一档，先出 2 句测试片段听/转写复核）：`API`→`A P I`、`UI`→`U I`、`SaaS`→`sass`；品牌名写音标拼法（`Vercel`→`Ver-sell`）；**禁 SSML**（`<break/>` 会被读出来），停顿用空行或 `...`
- 语速偏快 ~40%（35s 计划 → 19s 实际）——先测后排，音频是真相源
- 定位：草稿/预览/无凭据环境。正式片优先 ElevenLabs `with-timestamps`（本文件上节）

## Whisper Word-Level Sync

For transcript-driven videos with precise word highlighting:

```bash
# Generate word timestamps
whisper audio.wav --model medium --language en --word_timestamps True --output_format json
```

### Parse Whisper Output

```tsx
// Build per-segment word timing arrays
type WordTimes = Record<number, number[]>; // segmentId -> relative seconds per word

const WORD_TIMES: WordTimes = {
  0: [0.0, 0.28, 0.56, 0.89, ...],  // relative to segment start
  1: [0.0, 0.34, 0.72, ...],
  // ...
};

// Highlight current word in transcript
const getCurrentWordIndex = (
  segmentId: number, elapsedSec: number,
): number => {
  const times = WORD_TIMES[segmentId];
  if (!times) return -1;
  for (let i = times.length - 1; i >= 0; i--) {
    if (elapsedSec >= times[i]) return i;
  }
  return 0;
};
```

## Audio Layer Composition

Standard three-layer audio setup:

```tsx
<AbsoluteFill>
  {/* Layer 1: Background Music (always playing, auto-ducked) */}
  <Audio src={staticFile("bgm.mp3")} volume={bgmVolume} />

  {/* Layer 2: Voiceover segments (timed to scenes) */}
  {voSegments.map((seg, i) => (
    <Sequence key={i} from={Math.round(seg.start * fps)}
      durationInFrames={Math.round(seg.duration * fps)}>
      <Audio src={staticFile(seg.file)} volume={1.0} />
    </Sequence>
  ))}

  {/* Layer 3: SFX (whoosh on transitions, click on UI, etc.) */}
  <Sequence from={transitionFrame} durationInFrames={15}>
    <Audio src={staticFile("whoosh.mp3")} volume={0.4} />
  </Sequence>
</AbsoluteFill>
```

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
