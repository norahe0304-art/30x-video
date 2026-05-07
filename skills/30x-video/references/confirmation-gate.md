<!--
[INPUT]: All upstream pipeline decisions ([1]-[3]) before render
[OUTPUT]: Locked decision set + user-approved go signal
[POS]: references/ 的强制门; pipeline 不可绕过的中间检查
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Confirmation Gate Protocol

The single most important rule in 30x-video. This document expands the
short version in `SKILL.md` for developer / agent reference.

## Why This Exists

Video pipelines are expensive:
- TTS calls cost money
- BGM fetching takes 30-60s
- Hyperframes rendering takes 3-15 minutes
- LLM critique takes another 1-3 minutes
- A wrong format / wrong tone / wrong length means the entire chain re-runs

A 90-second confirmation conversation prevents 15 minutes of wasted compute
and a frustrated user.

## Hard Rules

### Rule 1: Lock Before Execute

Do NOT call any of these functions before Confirmation Gate passes:

- `vo-synth.ts` (TTS provider)
- `bgm-fetch.ts` (BGM library or yt-dlp)
- `compose.ts` (hyperframes HTML generation)
- `render.ts` (hyperframes engine call)
- `refero_get_screen` with `image_size: "full"` (large data pull)
- Any 30x-image call (if user requested still generation)

Allowed before Confirmation Gate:
- `refero_search_screens` (search-only, lightweight)
- `refero_get_screen` with `image_size: "thumbnail"` (small)
- LLM analysis of brief (text-only)

### Rule 2: One Batch, All Decisions

When presenting the plan, include EVERY decision the agent inferred:

| Field | Required in plan |
|---|---|
| Topic / subject | ✅ |
| Duration | ✅ |
| Format (aspect ratio) | ✅ |
| Visual style (1 of 7) | ✅ |
| Pacing (1 of 4) | ✅ |
| Voice over: yes/no, archetype, voice model | ✅ |
| BGM: archetype, tempo target | ✅ |
| Reference videos (2-3 from library) | ✅ |
| Brand reference (if applicable) | ✅ |
| Output platform (if applicable) | ✅ |

### Rule 3: Surface Ambiguities Together

If multiple ambiguous points exist, list them all. Do NOT ask question 1,
get answer, then ask question 2. Examples of poor flow:

```
❌ Bad:
  Agent: "Should this be 9:16 or 16:9?"
  User: "9:16"
  Agent: "Should there be a voice over?"
  User: "yes"
  Agent: "What tone should the voice over have?"
  ...
```

```
✅ Good:
  Agent: "I have 3 questions before starting:
          1. Format: 9:16 vertical (TikTok/Reels) or 16:9 horizontal?
          2. Voice over: yes / no, and if yes — warm female narrator
             OR authoritative male narrator?
          3. Reference vibe: Apple-like editorial OR Hormozi-style hook?
          
          You can also reply 'go' to use my defaults: 9:16, warm female VO,
          editorial reference."
```

### Rule 4: Provide Defaults When Possible

For every ambiguity, ALSO suggest a sensible default. Users should be able
to reply `go` to accept all defaults. Without defaults, ambiguity becomes
a chore.

### Rule 5: Honor the Lock

Once user replies `go` or confirms specifics, those decisions are LOCKED.
Do not silently change them mid-pipeline. If a downstream step requires
deviation (e.g. TTS can't produce the requested voice), surface to the
user before proceeding.

### Rule 6: User-Initiated Adjustments

User may say:
- `go` → use all defaults, lock and proceed
- `change format to 1:1` → adjust that line, others stay as proposed, present updated plan
- `redo` → start over, ask what they want differently
- `ask the model` → agent picks confidently, no further user input

Each is a valid response. Honor it.

## Plan Format Template

Use this layout for the Confirmation Gate display:

```
┌─── Video Plan ───────────────────────────────────────┐
│ Topic:        {subject}                              │
│ Duration:     {N}s                                   │
│ Format:       {aspect ratio} {orientation}           │
│ Visual:       {visual_style}                         │
│ Pacing:       {pacing}                               │
│ Voice over:   {vo_archetype} ({voice_model})         │
│ BGM:          {bgm_archetype} ({bpm_range})          │
│ Reference:    {video_1} ({timestamp_range})          │
│               {video_2}                              │
│ Brand:        {brand_name OR "creator/no-brand"}     │
└───────────────────────────────────────────────────────┘

Questions:
{numbered list, max 3 questions, with default suggestions}

Reply 'go' to proceed with these defaults, or adjust any line.
```

## When to NOT Use Confirmation Gate

Confirmation Gate is required for FIRST run of a job. It is NOT required:

- During `--retry` runs where user explicitly says "use last decisions"
- During Finish Gate iteration (different gate, different rules)
- During programmatic benchmark runs where decisions are pre-specified
- When `auto_confirm: true` is set in jobspec (advanced users only)

Default behavior: always present Confirmation Gate.

## Failure Modes

If user does not respond within reasonable time (agent has been waiting):
- Do NOT auto-proceed
- Do NOT silently start
- The job stays paused indefinitely
- User can resume by replying

If user gives ambiguous response (e.g., "sounds good" without specifying):
- Treat as `go` with all proposed defaults
- Confirm what was assumed in the next message before [4] starts

## Self-Check Before Calling Render

Before any of `compose.ts` / `render.ts`, the orchestrator must verify:

```typescript
assert(decisionsLocked === true);
assert(userExplicitlyConfirmed === true);
assert(allRequiredFieldsPresent(plan));
assert(noChangesSinceConfirmation(currentPlan, lockedPlan));
```

If any assertion fails: re-run Confirmation Gate. Do NOT proceed.

## The Single Test

If the agent ever wonders "should I just do it and ask later?" — the
answer is NO. **No silent execution.** Always confirm.
