<!--
[INPUT]: TTS 生成的 narration 音频 (可选路径), whisper 词级时间戳 JSON, STORYBOARD/story.md 的 beat 计划, scene 时长表
[OUTPUT]: 三条叙述同步法则 — Beat-Lock (视觉变化锁词级时间戳)、Caption/Brand Cleanup (字幕清理不动时间戳)、Sentence-Boundary Snapping (切点吸附句界)
[POS]: rules/ 的配音同步层; 仅当视频含 voiceover/captions 时生效 (纯 BGM 视频跳过); 被 SKILL.md Step 4 引用, 披露项汇入 qc-gates.md Gate 4
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Narration Sync — Beat-Lock, Caption Cleanup, Boundary Snapping

Applies ONLY when the video has a voiceover (TTS narration) or burned captions. BGM-only videos skip this file entirely. When narration exists, these three rules are mandatory — timing "estimated from the script" is the #1 way narrated videos ship broken.

## Rule 1: Beat-Lock — pin every visual change to real word timestamps

Never assume timing. A 78-word script is not "about 30 seconds" — it is exactly as long as the rendered audio says it is, and each sentence lands where whisper says it lands.

After generating the TTS audio:

```bash
whisper public/brand/narration.mp3 --model base --word_timestamps True --output_format json --output_dir evidence/
```

(Any whisper flavor works — what matters is a JSON of `{word, start, end}` per word. faster-whisper and whisper.cpp emit equivalents.)

Then:

1. Convert word times to frames (`t × fps`, round) and derive each act's real start/end from where its narration sentences actually sit.
2. Every scene cut, headline reveal, count-up start, and caption cue in `MainVideo.tsx` derives from these numbers — not from an even split of `durationInFrames`, not from reading the script and eyeballing.
3. If the audio runs long/short vs the plan, update the scene constitution's frame ranges — the audio is the source of truth, the plan is the draft.

**Forbidden:** writing `<Sequence from={900}>` because "act 3 should start around 30s". If a frame number can't be traced to a word timestamp or a beat-map entry, it's a guess.

**Gate:** for a narrated video, every act boundary in MainVideo.tsx maps to a word/sentence timestamp from the whisper JSON (state the mapping in the act's Gate-2 evidence block).

## Rule 2: Caption & brand-word cleanup — fix text, never touch timestamps

Raw whisper output is not caption-ready. Before rendering captions, Claude passes over the transcript:

1. **Fix brand-word mis-transcriptions** from surrounding context — whisper writes "Kalent" for "Caylent", "strip" for "Stripe". Cross-check every product/brand token against `brand-report.json`'s brandName.
2. Remove filler words (um, uh, you know) from caption *text* only.
3. **Keep all timestamps unchanged.** Edit only the text field; the word timing grid is what Rule 1 and Rule 3 depend on.
4. Write the cleaned copy to a separate file (`evidence/transcript-clean.json`), never over the raw transcript.

**Disclosure hook (→ Gate 4):** a mis-transcribed brand name is also a *pronunciation warning* — whisper may be spelling what the TTS voice actually said. You cannot verify pronunciation without ears. Add to "What I did NOT verify": "whisper heard '<X>' for '<Brand>' — listen to the first 5s; if mispronounced, regenerate TTS with a phonetic spelling."

## Rule 3: Sentence-boundary snapping — cuts land on sentence ends, never mid-word

Scene transitions in a narrated video must land in the gaps between sentences:

1. From the whisper JSON, a sentence boundary = a word whose text ends in `.?!`; the cut point is that word's `end` + ~300ms pad, converted to frames.
2. If a planned cut falls mid-sentence, move it to the nearest sentence end (prefer extending; a beat that breathes beats a beat that clips a clause).
3. When BGM beat-sync (`beat-map.json`) is also active, narration wins: pick the BGM beat *nearest to* the sentence gap, not the reverse — a cut on a musical beat but mid-word is still a broken cut.
4. Cross-check with silence: `ffmpeg -i narration.mp3 -af silencedetect=noise=-35dB:d=0.3 -f null -` — a real pause near your cut point confirms it; no pause anywhere near it means the sentence isn't over.

**Gate:** no act transition occurs while a narration word is mid-utterance (word `start < cut < end` for any word = fail).

## Rule 4: Continuous speech — 一段论证一口气说完, 画面吸附短语

用户判决（2026-07-04）：为了给每个卖点配画面而把一段旁白拆成几个短句文件、句间留 1-2s 死气口 = "说话断掉了，很不舒服"。同一段论证（如证明段的三个卖点）必须是**一段连续生成的音频**，中途不许有人为空档。

对齐方向是单向的：**画面跟话走，话不迁就画面。**

1. 把整段写成一份 script 连续生成 TTS；用词级对齐（ElevenLabs `with-timestamps` 直接返回，或 whisper）量出每个卖点短语的 onset。
2. 段内视觉切点（beat 边界常量）设为短语 onset 对应的帧 — 不是先定画面时长再找话塞。
3. 卖点节奏太快的正解是**加长文案给每个点更多词**，再按新 onset 重吸附 — 不是拆音频。
4. 有旁白时，headline 下的解释性副句小字一律删（"干净一点"）— 信息由旁白承载，画面只留巨字排 + 世界本身。产品世界原生的机器文本（终端行、状态页区域标签、`ms` 延迟戳）不算副句，保留。

**Gate:** 同一论证段的旁白音频文件数 = 1；每个段内 beat 边界能指认到对齐 JSON 里的短语 onset。
