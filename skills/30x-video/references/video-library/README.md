<!--
[INPUT]: Curation criteria from SKILL.md, real YouTube videos
[OUTPUT]: 50-video reference library organized across 5-dim style tags
[POS]: video-library/ 入口; agent 在 Style Composer 阶段查阅
[PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
-->

# Video Reference Library

A curated notebook of 50 real videos. The agent uses these as
compositional references during 5-dim Style Composer and during the
Confirmation Gate to communicate intent to the user.

## Why a notebook, not abstract rules

We do not write 1800 lines of "what makes a good video." We curate real
videos. Real examples beat abstract rules — the same philosophy Refero
applies to design.

## Three quality tiers

| Tier | Standard | Count |
|---|---|---|
| **S — Gold standard** | Top global brand official films, agency-grade craft | 20 |
| **A — Data + reputation** | 100k+ likes AND 1M+ views, Cannes / D&AD level work | 20 |
| **B — Creator viral** | 5M+ views, high engagement (likes/views > 5%) | 10 |

## Five-dimensional tagging

Each video is tagged across the same five dimensions used in
`references/style-dimensions.md`:

- **Visual:** product-ui-mockup / cinematic-luxury / data-viz-driven /
  lifestyle-shot / typography-statement / comparison-split / before-after
- **Pacing:** slow-luxury / medium-narrative / quick-hook / tiktok-flash
- **BGM:** minimalist-ambient / techno-driving / cinematic-orchestral /
  hip-hop-confident / lo-fi-warm / silence-with-sfx / speech-only
- **VO:** none / conversational-host / authoritative-narrator /
  character-voice / multi-speaker
- **Format:** 16:9 / 9:16 / 1:1 / 4:5

## Per-video schema

Each video has a `.md` file with:

```markdown
# {Title}

**URL:** {youtube_url}
**Duration:** {mm:ss}
**Tier:** {S|A|B}
**Format:** {16:9|9:16|1:1|4:5}

## 5-dim Tags
- visual: {style}
- pacing: {pacing}
- bgm: {bgm}
- vo: {vo}
- format: {format}

## Why It's Exemplary
{1-2 sentences: what specifically is worth learning}

## Use as Reference For
{what content / brand / context this matches}

## Notable Timestamp Range (optional)
{e.g. 0:30-1:10 for the segment to study}
```

## Index

`INDEX.json` provides a flat searchable index. Use it from
`scripts/refero-search.ts` and `scripts/style-composer.ts` to find videos
matching a chosen 5-dim combination.

## Adding videos

When curating new videos:
1. Verify the URL is publicly accessible
2. Confirm view / like counts meet tier criteria (for A and B tiers)
3. Tag honestly — do not stretch tags to fill gaps
4. Write 1-2 sentences on what's exemplary, not a generic description
5. Update `INDEX.json` with the new entry

This library is meant to grow over time as we find more gold-standard work.
