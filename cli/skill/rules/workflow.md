<!--
[INPUT]: Official brand site, screenshot and video evidence, brand assets, archetype rules
[OUTPUT]: BrandTruth, ScreenshotProof, VideoProof, asset strategy, and workflow gates before build/render
[POS]: rules/ 的现象层主脑; 负责把官网现实转成可执行素材与门禁条件
[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# Workflow & Assets

Scraping, logo sourcing, video embedding, icon system, and file organization.

## Phenomenal Layer First

This workflow treats the official website as the ground truth. The phenomenal layer is not "brand inspiration"; it is evidence collection.

- `ScreenshotProof` is mandatory.
- `VideoProof` is preferred.
- `agent-browser` is the preferred harvester when available — it runs headless (does not hijack the screen) and preserves rendered, interactive reality better than static scraping.
- If screenshot proof is missing, the build must stop.
- If video proof is missing, continue only in screenshot-first mode.

## V2 Evidence Scoring

URL-to-video V2 scores evidence before it chooses a production line. The scoring dimensions are:

| Dimension | What it means |
|-----------|---------------|
| `screenshotCompleteness` | Do we have homepage + product/hero visuals with enough coverage to compose scenes? |
| `videoUsefulness` | Is there a real product clip, hero motion, or official demo worth cutting in? |
| `logoQuality` | Do we have a usable logo/wordmark, ideally SVG? |
| `fontCertainty` | Did we recover real typography facts or are we guessing? |
| `productClarity` | Can the site clearly explain what the product actually is? |
| `proofRichness` | Are there metrics, customers, proof sections, or trust surfaces? |
| `brandDistinctiveness` | Does the brand surface have enough identity to avoid monoculture output? |

Default behavior:

- high score: generate first cut directly
- medium score: generate first cut plus explicit risks
- low score: if screenshots still support it, fall back to `editorial`; otherwise block and emit gaps

## V2 Mode Selection

The orchestrator must choose one of two production engines:

- `product-evidence`: strong UI/product proof, feature storytelling, proof-led Act 4
- `editorial`: weaker product proof but strong brand/visual surface, typography-led and composition-led

Never fake a product demo when the evidence only supports editorial storytelling.

## One-Shot Orchestrator: `scripts/url-to-video.ts`

The zero-manual entrypoint. Given a brand URL, it scrapes evidence, scores it, generates the scaffolded Remotion project, auto-runs `beat-sync` (if BGM harvested) and `visual-audit`, and writes `review.md` with a full harvest log.

```bash
npx tsx scripts/url-to-video.ts https://brand.com --out ./out/brand --force
```

**Flags**

| Flag | Purpose |
|------|---------|
| `--out <dir>` | Output directory (required) |
| `--force` | Overwrite existing output |
| `--offline` | Skip all network harvests (testing only) |
| `--yes` / `-y` | Auto-approve preflight tool installs (non-interactive) |
| `--no-install` | Skip preflight tool installs; warn and continue |

### Preflight — Tool Bootstrap

Before any scraping runs, the orchestrator checks for required external tools and offers to install anything missing. On interactive terminals it prompts `Install missing tools now? [Y/n]`; with `--yes` it installs silently; with `--no-install` it warns and continues (degraded mode).

| Tool | Purpose | Install |
|------|---------|---------|
| `ffmpeg` | Audio processing, BGM fades, video trim | `brew install ffmpeg` |
| `yt-dlp` | BGM harvest + product video download | `brew install yt-dlp` |
| `aubiotrack` | Beat detection for MainVideo pulse sync | `brew install aubio` |
| `playwright` | Headless rendered homepage screenshot | `npm install -g playwright && playwright install chromium` |

Rule: **never force-install without consent.** Users on locked-down machines can pass `--no-install` and wire tools manually. Missing tools degrade gracefully — e.g., no `aubiotrack` falls back to a `ffmpeg` onset beat-map; no `playwright` falls back to `agent-browser` or plain `fetch` of `og:image`.

## Step 0: Scrape the Brand (MANDATORY First Step)

ALWAYS fetch the brand's real site before writing any code. This is NON-NEGOTIABLE.

### How to Scrape

Use whichever browser tool is available. The OUTPUT matters, not the tool.

**Option A: agent-browser (preferred — headless, does not hijack screen)**

Use this first when the site depends on JavaScript, gated product tours, or authenticated surfaces. The phenomenal layer wants rendered truth, not just HTML source.

```bash
agent-browser open https://brand-site.com
agent-browser snapshot
agent-browser eval "JSON.stringify(getComputedStyle(document.documentElement))"
agent-browser eval "[...document.styleSheets].flatMap(s => [...s.cssRules]).filter(r => r.style).map(r => r.cssText).join('\n')"
agent-browser eval "document.querySelector('link[rel*=icon]')?.href"
agent-browser eval "document.querySelector('h1')?.textContent"
agent-browser eval "document.querySelector('[class*=hero] p, [class*=subtitle]')?.textContent"
agent-browser screenshot public/brand/homepage.png
```

**Option B: MCP chrome-devtools (if available)**

Use `navigate_page` to open the site, `evaluate_script` for DOM queries, `take_screenshot` for reference images.

**Option C: curl + manual (always works)**

```bash
curl -s https://brand-site.com -o /tmp/brand-page.html
# Search the HTML for: font-family, --color-, background-color, <h1>, og:image, favicon
# Extract logo URL from <link rel="icon"> or <link rel="apple-touch-icon">
curl -o public/brand/logo.svg "<logo-url>"
```

### What to Extract (Checklist)

| Category | What | How |
|----------|------|-----|
| **Colors** | primary, accent, bg, text (exact hex) | CSS variables, computed styles |
| **Typography** | heading font + weight, body font | @font-face rules, Google Fonts link |
| **Logo** | SVG verbatim from favicon or header | Download file directly, NEVER hand-write paths |
| **Hero Copy** | headline, subheadline, CTA text | DOM extraction |
| **Product** | primary interface type (chat? dashboard? editor?) | Visual analysis |
| **Features** | product capabilities, feature names | Page content |
| **Visual Style** | border-radius, spacing, gradient patterns, shadows | CSS inspection |
| **Video Assets** | Vimeo/YouTube embeds, `<video>` tags, CDN URLs | DOM scan |
| **Screenshot Assets** | homepage, hero, product UI, pricing, proof sections | screenshots or downloaded images |

### Video Asset Extraction

**Priority: video > PNG. Always attempt video download first.**

```bash
# 1. YouTube / Vimeo / most video platforms — USE yt-dlp (PREFERRED)
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
  -o public/brand/demo-full.mp4 "https://youtube.com/watch?v=XXXX"
ffmpeg -i public/brand/demo-full.mp4 -ss 0 -t 8 -c copy public/brand/demo.mp4

# 2. Search YouTube when no direct URL available
yt-dlp "ytsearch1:BrandName official product demo 2024" \
  -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
  -o public/brand/demo-full.mp4
ffmpeg -i public/brand/demo-full.mp4 -ss 0 -t 8 -c copy public/brand/demo.mp4

# 3. Direct CDN mp4: download and trim (keep clips ≤8s)
curl -o public/brand/demo.mp4 "https://cdn.brand.com/video.mp4"
ffmpeg -i public/brand/demo.mp4 -t 8 -c copy public/brand/demo-trimmed.mp4

# 4. Vimeo fallback: extract HLS from config endpoint
curl -H "Referer: https://brand-site.com" \
  "https://player.vimeo.com/video/{id}/config" | jq '.request.files.hls'
ffmpeg -i {hls_url} -t 8 -c copy public/brand/clip.mp4
```

**NEVER say "video not downloadable" if yt-dlp is available.** Most brand sites embed YouTube/Vimeo videos that yt-dlp handles. Search YouTube as fallback.

### ScreenshotProof (MANDATORY)

Capture or download enough screenshots to prove the brand visually:

- `homepage.png` — whole-page or hero-first screenshot
- `hero.png` or `product-ui.png` — the product or hero image that best explains the brand
- optional additional module screenshots for proof, pricing, dashboard, editor, collaboration, or benchmark sections

ScreenshotProof is what lets the builder reason about density, spacing, radius, layout, and UI seriousness even when video is unavailable.

### Image Size Safety (MANDATORY)

Chrome headless OOMs on images >2MB during Remotion render. **Compress all images in `public/brand/` after download:**

```bash
# Compress any PNG/JPG over 1.5MB to JPEG quality 85
for img in public/brand/*.{png,jpg,jpeg}; do
  size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
  if [ "${size:-0}" -gt 1500000 ]; then
    sips -s format jpeg -s formatOptions 85 "$img" --out "${img%.*}.jpg" 2>/dev/null \
      || convert "$img" -quality 85 "${img%.*}.jpg" 2>/dev/null
    echo "Compressed: $img -> ${img%.*}.jpg (was ${size} bytes)"
  fi
done
```

Target: all images under 1MB after compression. This prevents Chrome OOM during render without visible quality loss at 1920x1080.

### Asset De-duplication (MANDATORY — BLOCKING)

**No visual may appear twice in the same video.** Reusing `homepage.png` in Act 2 Reveal AND Act 3 Showcase, or putting `hero.png` in two different Showcase vignettes, is a render-blocking bug. Users see it immediately and it looks cheap.

**Rules:**

1. **Dedupe by `staticFile()` URL, not by asset `kind`.** Many brands ship identical bytes for `hero-image` and `og:image`. Build a `Set<string>` of URLs and skip duplicates before assigning to scenes.
2. **Asset pool is ordered by evidence strength:** `video > product-screenshot > homepage-screenshot > hero-image`. Act 2 Reveal consumes the pool top; Act 3 Showcase can only consume what remains.
3. **Vignette count ≤ remaining pool size.** If Act 2 ate the only screenshot, Act 3 may have 0 image vignettes — shrink the slot count rather than duplicate. One 14-second text-forward scene beats three copies of the same image.
4. **Logo never enters the pool.** It is reserved for Act 1 and Act 5 only.
5. **Never pair an arbitrary headline with an arbitrary image** just to fill a slot. If you have 4 feature headlines but only 1 remaining image, show 1 vignette with the strongest headline, not 4 vignettes sharing one image.
6. **Visual similarity is also duplication.** If `homepage.png` and `hero.png` differ by only a few KB and show the same screen, treat them as one asset and warn in `review.md`. A second-pass perceptual check (file size within 5%, same dimensions) is acceptable.

**Blocking gate before render:**

```bash
# Count distinct staticFile srcs referenced in scenes
grep -rhoE 'staticFile\("brand/[^"]+"\)' src/ | sort -u | wc -l
# Count total references
grep -rhoE 'staticFile\("brand/[^"]+"\)' src/ | wc -l
# Ratio should be close to 1:1 (allow logo duplicated across Act1/Act5 only)
```

If the same `brand/*.png` is referenced more than once outside `LogoEntrance`, fix it.

### Brand-Authored vs Self-Captured (MANDATORY — BLOCKING)

**User rule:** *"素材都必须是网站的素材, 不是我们纯截图"* — every visual on screen must be a brand-authored asset the website itself ships, never a screenshot we captured of their rendered page.

| Status | Examples | Scene-eligible? |
|---|---|---|
| **Brand-authored** | `og:image` / `twitter:image`, `<img>` tags served from the brand's own CDN, `<video>` embeds, product UI screenshots they host themselves, favicon / logo SVG | ✅ YES |
| **Self-captured** | Playwright headless screenshot of the rendered homepage, our own cropped sections, DevTools exports | ❌ **NEVER** — preview/debug only |

**Concrete consequences in the scaffold:**

1. `homepage-screenshot` kind is **always** a playwright self-capture in this pipeline. It is tagged by the harvester with `notes: "playwright-capture; preview/debug only; NOT scene-eligible"` and **must not** be referenced by `MainVideo.tsx` `ASSET_POOL` under any circumstance. It exists only so `review.md` can embed a preview thumbnail and for the preflight to prove harvest ran.
2. `hero-image` is scene-eligible **only when** `source === "official-site"` or the URL was resolved from `og:image` / `twitter:image` / a `<meta>` tag — i.e. the brand authored it. A `hero-image` that was constructed by playwright cropping the page is NOT scene-eligible.
3. `product-screenshot` is scene-eligible when fetched from the brand's own CDN. A `product-screenshot` with `status: "referenced"` must be downloaded first (so it's a local file) — `referenced` assets are excluded from the scene pool until downloaded.
4. `<video>` sources must come from `<video src>` / `<source>` tags in the actual DOM or an embedded player URL the brand ships. Never screen-recording the rendered page.
5. **If the harvest turns up zero brand-authored visuals** (only logo + playwright screenshot), Act 2 and Act 3 must both go typographic editorial. This is an honest "we have only your words, not your UI" rendering — far better than stitching our own screenshots in.

**Why:** Using a self-captured screenshot looks like we're impersonating their product. The viewer immediately senses "this isn't their video, it's someone cropping their website". It destroys the evidence-backed promise of the skill.

**Blocking gate:**

```bash
# No MainVideo scene may reference homepage.png (or any homepage-screenshot kind).
# Strip // line comments first so explanatory comments don't trip the gate.
sed 's|//.*||' src/MainVideo.tsx | grep -qE 'staticFile\("brand/homepage|findAsset\(\[?"homepage-screenshot' \
  && { echo "FAIL: MainVideo references playwright self-capture"; exit 1; } || true
```

### Visual Classification — demo / cover (MANDATORY — BLOCKING)

**Dedup is necessary but not sufficient.** Even with unique images, pairing the wrong *kind* of image with the wrong *kind* of copy destroys trust. A Raycast og-image with "Your shortcut to everything" baked into the pixels must not have another scraped headline overlaid on it — that is the content-mismatch bug the user called out as *"素材非常的不 make sense"*.

**Before composing any scene, classify every harvested visual into exactly one bucket:**

| Kind | Signals | Allowed usage | Forbidden usage |
|---|---|---|---|
| `demo` | product-UI screenshot, demo video, in-app capture; no taglines baked in | Act 2 Reveal (overlay-safe), Act 4 Proof | — |
| `cover` | og-image, hero-image, brand banner; typically ships with a tagline already rendered into the pixels | Act 2 Reveal **full-bleed only**, Act 5 Close background | **Never** overlay a scraped headline on it. **Never** use it as a feature vignette image. |

**There is no `page` kind.** Playwright full-page homepage screenshots are preview/debug only — see *Brand-Authored vs Self-Captured* above — and must never enter the visual pool.

**Rules:**

1. **`cover` images must render full-bleed with NO overlay headline.** The tagline is already in the pixels; overlaying another headline duplicates content. The only permitted text over a `cover` is a subtle uppercase `HOST` label at the bottom (< 30px, letter-spaced 0.2em).
2. **Act 3 Showcase does NOT use real visuals at all** — see *Act 3 Must Use Generated UI Mockups* below. `demo` visuals belong in Act 2 Reveal and Act 4 Proof, not Showcase.
3. **`featureNames` are not always features.** Many sites put editorial section headings ("Built for professionals like you.") into what harvest tools read as features. Treat them as *copy to drive UI mockup labels*, not as image crops.
4. **Classification happens at the scaffold seam**, not at harvest time (yet). The `rawPool` construction in `MainVideo.tsx` tags each visual with `{ kind: "demo" | "cover", hasBakedText: boolean }`. Scene components branch on `visual.kind`, never on raw asset `kind` strings.

**Blocking gate:** if `MainVideo.tsx` does not type its visual pool with `VisualKind = "demo" | "cover"`, or if any scene references `hero-image` / `og-image` inside a `BrowserFrame` with an overlay headline, fail the audit.

### Theme Sanitization (MANDATORY — BLOCKING)

**The theme file is the video's nervous system.** If `theme.ts` ships with wrong colors or non-loadable fonts, every scene looks generic — the bug the user called out as *"颜色也不对 文字居然会突出"*.

**Color selection rules (enforced in `scripts/url-to-video.ts → buildDesignTruth`):**

1. **`bg` must be the darkest, least-saturated neutral** from the harvested palette. Sort candidates by `brightness + saturation * 30` ASC. Never pick a saturated wine/lavender/olive as background — those are accent colors, not canvas.
2. **`text` must be the brightest, least-saturated light** from the palette. Sort by `-brightness + saturation * 40` ASC. Low-saturation white/off-white always wins over tinted pastels.
3. **`primary` comes from the rendered WEBSITE, not CSS text and not the logo.** The website is how the brand actually deploys color — hero backgrounds, CTAs, product screenshots, icon fills. The logo is just one isolated asset; CSS text frequency weights every hex equally regardless of visual prominence. Both miss the truth. Use **hue-weighted pixel dominance** on `hero.png` (og:image) or `homepage.png` (rendered) instead:
   - Scale the image to 256×256, read as raw RGBA via `ffmpeg -vf scale=256:256 -pix_fmt rgba`.
   - Filter out transparent, near-black (`max < 40`), near-white (`min > 210`), and near-grey (`chroma < 50`) pixels.
   - Bucket each remaining pixel by its **hue** into 12 slots of 30° each.
   - Per slot, accumulate the **sum of chroma** (not the pixel count — this rewards brightness-weighted saturation, not pixel volume).
   - The winning slot = the dominant brand hue family. Within that slot, pick the **highest-chroma** sample as the primary color. This returns the brightest deployment of the dominant hue, ignoring dark variants and pale tints.
   - Source priority: `hero.png` → `homepage.png` → `product-ui.png` → `logo.png` (last resort). Brand-authored og:image is most honest because the brand chose exactly that framing to represent itself.
   - This beats CSS frequency because macOS traffic-light buttons, section gradients, and OS chrome occupy < 0.01% of rendered pixels and their chroma weight is dwarfed by hero CTAs and icon fills.
4. **`accent` is the next saturated color at distance > 120 RGB units from primary.** If no CSS color is far enough, collapse `accent` to `#FFFFFF` — most strong brands are single-color (Raycast, Linear, Vercel), not two-color. Don't invent a contrasting accent that doesn't exist.

**Font sanitization rules (enforced in `scripts/project-blueprint.ts → renderThemeSource → sanitizeFont`):**

1. **Remotion cannot resolve Next.js CSS variables.** `var(--font-geist-mono)`, `var(--font-inter)`, etc. must be mapped to real google-fonts family names (`JetBrains Mono`, `Inter`, `Geist`, `Outfit`). Unknown vars → drop, fall back to `Outfit`.
2. **CSS globals are forbidden in theme.font.** `inherit`, `initial`, `unset`, `revert`, `auto`, `normal` are not fonts — they must be stripped and replaced with the fallback.
3. **Generic families are forbidden.** `sans-serif`, `serif`, `monospace`, `system-ui` cannot be loaded by `@remotion/google-fonts` — drop and fall back.
4. **Emoji/symbol/dingbat fonts are forbidden.** `Apple Color Emoji`, `Segoe UI Emoji`, `Segoe UI Symbol`, `Noto Color Emoji`, `Webdings`, `Wingdings`, `FontAwesome`, `Material Icons` etc. live inside CSS `font-family` fallback chains and the harvester pulls them as primary candidates. Block by case-insensitive regex on the head family before remap. Reason: rimbo.ai shipped with `heading: "Apple Color Emoji"`, `body: "Segoe UI Emoji"` because its CSS chain was `font-family: Inter, "Apple Color Emoji", "Segoe UI Emoji"` and the dedupe extracted each entry independently.
5. **System fonts must be remapped to Google Fonts equivalents.** `-apple-system`, `BlinkMacSystemFont`, `SF Pro`, `Segoe UI`, `Helvetica Neue`, `Helvetica`, `Arial`, `Verdana`, `Tahoma` → `Inter`. `Menlo`, `Monaco`, `Consolas`, `Courier New`, `SF Mono` → `JetBrains Mono`. These are real font names but `@remotion/google-fonts` can't load them, so they would silently break at runtime instead of being caught by the `grep` gate.
6. **Fallback chain:** `headingFont → "Outfit"`, `bodyFont → headingFont`, `monoFont → first sanitized mono family → "JetBrains Mono"`.

**Blocking gate:** `theme.ts` must not contain `var(--font-`, `inherit`, `initial`, generic families, OR any emoji/symbol/dingbat font name. Audit step must run two `grep`s — one for vars/generics, one for `emoji|symbol|webdings|wingdings|fontawesome|material icons` — and fail if either matches.

### Act 3 Must Use Generated UI Mockups (MANDATORY — BLOCKING)

**Act 3 Showcase is the feature-claim act.** It must always render scaffold UI mockup components — `TerminalWindow`, `KanbanBoard`, `DataTable`, `AnalyticsDashboard` — archetype-mapped. It must **never** fall back to text-only editorial, and must **never** crop real screenshots as fake feature vignettes.

This is the lesson from *"没有动画 没有 ui 我们本来不是有那么多东西吗"*: abandoning the scaffold UI library to render text cards is a regression. The quality bar is the `anthropic-launch-video` reference project.

**Archetype → Vignette sequence mapping (in `Act3Showcase.tsx` / `MainVideo.tsx`):**

| Archetype pattern | Sequence |
|---|---|
| `infra \| fintech \| enterprise \| security \| compliance \| system \| developer \| platform \| devtool` | `terminal → kanban → table` |
| `ai \| data \| analytic \| ml \| model` | `dashboard → table → kanban` |
| `design \| creative \| media \| studio` | `kanban → dashboard → table` |
| (fallback) | `kanban → table → dashboard` |

**Each vignette must:**

1. Pull its labels/rows/columns from `brandReport.features` (not hardcoded lorem).
2. Use `theme.color.primary` and `theme.color.accent` for highlighted cells, typing cursor, status pills.
3. Animate via the component's built-in `delay` prop — do not wrap in extra Sequence gates that clip the animation.
4. Ship with a `01/03 · BRAND_NAME` eyebrow and a 72px SplitText headline above the mockup.

**Blocking gate:** `MainVideo.tsx` must import at least one of `TerminalWindow | KanbanBoard | DataTable | AnalyticsDashboard` and reference it inside the Act 3 block. If Act 3 renders only text, fail the audit.

### Logo Safety Rules

- **NEVER hand-write or approximate SVG path data** — it WILL render broken
- Fetch the exact file: `favicon.svg`, header `<svg>`, or `og:image`
- Replace CSS variables (`var(--color)`) with solid hex for Remotion compatibility
- Test render the logo at target size before building scenes around it
- **`fill="currentColor"` SVGs on dark backgrounds:** Many brand SVGs use `fill="currentColor"` which inherits text color. On dark backgrounds, the logo may be invisible (dark fill on dark bg). Fix: add `filter: brightness(0) invert(1)` on the `<Img>` style to force white, AND set `color: '#EDEDF3'` on the parent div as a `currentColor` override. Always check the SVG source for `currentColor` before using.

### Output

Save everything to `public/brand/`:
```
public/brand/
  logo.svg          — brand icon (verbatim SVG)
  wordmark.svg      — brand wordmark if separate
  homepage.png      — reference screenshot
  product-ui.png    — screenshot proof of the product or hero UI
  demo.mp4          — trimmed video clips (≤8s each)
  hero-image.png    — downloaded hero/product images
```

Build `theme.ts` from scraped values. Never guess colors or fonts.

## From BrandTruth to DesignArchetype

After harvesting evidence, infer the archetype using [archetypes.md](archetypes.md):

- choose one primary archetype
- choose one secondary only if it adds clarity
- never let the archetype override real brand evidence
- if screenshots imply one density model and video implies another, trust the screenshot layout for composition and the video only for motion temperament

The archetype exists to sharpen judgment, not to justify copying a famous website.

## staticFile() is the ONLY Way to Reference Assets

**ALWAYS use `staticFile()` for ALL asset references. No exceptions.**

```tsx
// ✅ CORRECT — always use staticFile()
<Img src={staticFile("brand/wordmark.svg")} />
<Audio src={staticFile("brand/bgm.mp3")} />
<OffthreadVideo src={staticFile("brand/demo.mp4")} />
backgroundImage: `url(${staticFile("brand/logo.svg")})`

// ❌ FATAL — hardcoded localhost URLs WILL break in production/other machines
<Img src="http://localhost:8888/brand/wordmark.svg" />
<Audio src="http://localhost:8888/brand/bgm.mp3" />
```

**NEVER use `http://localhost:8888/` URLs in committed code.** This was a dev workaround that caused production breakage across multiple projects. If `staticFile()` fails in dev mode, debug the Remotion config — don't bypass it with localhost hacks.

After any code generation, `grep -r "localhost:8888" src/` and fix ALL matches before considering the task done.

## 403/反爬降级 — 真浏览器人工采收 Playbook (2026-07-04 perplexity 实战)

orchestrator 被 Cloudflare/防火墙 403 时不要放弃, 用 chrome-devtools MCP 真浏览器采收, 质量往往更高:

1. `new_page` 打开目标页 → `evaluate_script` 抓 verbatim 文案 (title/h1/h2/h3)、`getComputedStyle(document.body)` 的真实底色/字色/字体
2. 同脚本扫 `document.querySelectorAll('img')` (naturalWidth>300) 和 `video source` — **官方 CDN 的营销资产 URL 会直接暴露** (hero/能力图/logo.svg 全高清), curl 冻结到 public/brand/
3. accent 色采样: 扫按钮/链接的 computed backgroundColor, 过滤掉背景色系
4. 手写 brand-report.json (标注 harvestMethod: "browser-manual"), 走正常管线
5. og:image 常是现成 end card (kind=cover)

## BGM / Background Music (MANDATORY)

Every video MUST have background music. Music makes the difference between amateur and premium.

### Variety Mandate — 音乐不许每次都是同一首 (HARD RULE)

固定查询 + 固定 known-good 曲目当默认下载 = 每个项目都是同一首 Infraction。用户已点名（"music不能每次都是这个"）。机制（hyperframes bgm.md 移植，2026-07-04）：

1. **mood 从品牌推导，不从模板抄。** `brand-report.json` 的 designTruth × productCategory → mood 词组，拼进搜索词/生成 prompt。两个不同品牌不该得到同一个查询串。
2. **全局 BGM 台账查重。** 选定曲目前查 `~/.media/bgm-ledger.jsonl`（`{track, source, project, date}` 一行一条）；同曲已被前一个项目用过 → 取下一候选或换生成 seed。选定后追加一行。
3. **生成路线天然不重样，优先于固定下载。** 来源顺序：① ElevenLabs Music API（`ELEVENLABS_API_KEY` 且有 `music_generation` 权限时：`POST /v1/music {prompt, music_length_ms}` — 质量最高；受限 key 会 401 `missing_permissions`，直接降级别重试）→ ② 本地 MusicGen（`scripts/generate-bgm.py`；torch+MPS 下 45s 约 1-2 分钟）→ ③ 下方目录/搜索链。
4. **known-good 曲目表是"这一档听感长什么样"的校准样本，不是默认答案。** 直接下载表内曲目必须先过台账查重。
5. **BPM 契约。** 换曲/生成后必跑 beat-sync 实测；与既有时间轴锁定 BPM 偏差 >2% 时，转场锚点必须按新 audiomap 重吸附，不许带病渲染。生成 prompt 里写明目标 BPM（如 "123 bpm, steady four on the floor"）能把偏差压进容差。

### How to Source BGM (AUTO — never ask user)

BGM sourcing is AUTOMATIC. Do NOT ask the user to provide music. Try sources in order until one works:

```bash
# Source 1: Pixabay Music (browse, find direct MP3 link)
# https://pixabay.com/music/search/?q=corporate+ambient&duration=30-60
curl -L -o public/brand/bgm-raw.mp3 "<pixabay-direct-mp3-url>"

# Source 2: Mixkit (direct download, no login needed)
# https://mixkit.co/free-stock-music/
curl -L -o public/brand/bgm-raw.mp3 "https://assets.mixkit.co/music/download/mixkit-<track>.mp3"

# Source 3: Uppbeat free tier
# https://uppbeat.io/browse/music

# Source 4: YouTube royalty-free (ALWAYS works as last resort)
yt-dlp -x --audio-format mp3 -o public/brand/bgm-raw.mp3 \
  "ytsearch1:royalty free corporate ambient background music 30 seconds"

# After download from ANY source — trim + fade:
ffmpeg -i public/brand/bgm-raw.mp3 -t 45 -af "afade=in:0:d=2,afade=out:st=42:d=3" public/brand/bgm.mp3

# Detect BPM for beat sync:
ffmpeg -i public/brand/bgm.mp3 -af "atempo=1" -f null - 2>&1 | grep -i bpm
```

**If one source fails (login wall, CAPTCHA, region block), move to the next.** `yt-dlp` YouTube search (Source 4) is the ultimate fallback that always works.

**Tone matching guide:**
| Brand Tone | Search Keywords |
|------------|----------------|
| Tech/SaaS | "corporate ambient", "tech minimal", "digital innovation" |
| Creative/Design | "inspiring cinematic", "modern elegant" |
| Startup/Hype | "upbeat technology", "energetic corporate" |
| **Enterprise product demo / launch video** | **"upbeat corporate tech", "Markvard Time", "driving electronic corporate", "modern product demo" — MUST have strong percussion + driving rhythm** |
| **Big-tech keynote / flagship launch (Apple/Google/Anthropic feel)** | **"Infraction Tech Success", "Infraction cinematic technology", "cinematic technology hip-hop instrumental" — deep sub bass + cinematic pads + tight trap hats, no vocals. This is the tier above "corporate tech".** |
| Playful/Consumer | "happy upbeat", "positive modern" |

### "大厂感" / Big-Tech Keynote Tier (Apple, Google, Anthropic launch feel)

When the user says music needs to feel "高级" / "大厂" / "premium" / "like a real launch video" — generic upbeat corporate is NOT enough. That tier is background music for SaaS explainer videos. A flagship launch needs a **cinematic tech** score — the kind used under Apple Event product reveals, Google I/O sizzle reels, OpenAI/Anthropic release films.

**Signature characteristics:**
- Deep **sub-bass** that you feel more than hear (808-style)
- **Cinematic pad swells** in the background (orchestral-adjacent but synth)
- Tight, processed **trap hi-hats** or precise electronic percussion (not generic rock kit)
- **Builds and drops** synced to phrase boundaries — soft intro → swell → drop → payoff
- Production value that sounds like a real film score, not a free YouTube loop

**Known-good artist / track:**
- **Infraction — "Cinematic Technology Hip-Hop / Tech Success"** — the archetype. Free, no vocals, Apple-keynote-grade. *(proven on Anthropic 4:5 launch)*
- Other Infraction "Tech" / "Cinematic" / "Inspiring" series tracks
- Whitesand ambient-electronic tracks (more orchestral)
- Alex-Productions "cinematic tech" series

**Search query that reliably hits this tier:**
```bash
yt-dlp -x --audio-format mp3 --audio-quality 0 -o bgm-raw.mp3 \
  "ytsearch1:Infraction cinematic technology instrumental no copyright"
```

**Loudness override for this tier:** use `I=-15:LRA=8:TP=-1.2` (slightly hotter and more compressed than the generic enterprise `I=-16:LRA=9:TP=-1.5`) — big-tech launch music needs to hit harder.

**Entry point:** these tracks typically build for 20-30s before the main drop. Use `-ss 25` (not the default `-ss 15`) to land on the drop, not the build.

**Why this deserves its own tier:** user feedback (`"音乐还是差点意思？？？？我觉得音乐要很高级很大厂啊"`) made it clear that "corporate tech" is mid-tier — a flagship AI lab launch video needs one tier above, and that tier has a specific sonic signature worth encoding.

### Enterprise Demo BGM — Instrumental Only, No Vocals

**HARD RULE:** BGM for launch / demo / product videos MUST be **purely instrumental**. No vocals, no lyrics, no "oohs" / "aahs" / vocal chops, no sung hooks. Vocals compete with on-screen text and make the video feel like a music video instead of a product demo.

- Always include `instrumental` or `no vocals` in the yt-dlp search query
- Reject any track where you hear a human voice during preview — immediately re-download
- Known vocal traps: LiQWYD "Future" (has vocals), most "upbeat corporate" top hits (vocal hooks), anything with "feat." in the title
- Known-safe **instrumental-only** artists: Aylex, Markvard (instrumental versions), Ikson (most), Scandinavianz instrumental, Pufino, Infraction (corporate instrumental)

```bash
# Safe search queries
yt-dlp -x --audio-format mp3 -o bgm-raw.mp3 \
  "ytsearch1:Aylex instrumental upbeat corporate no copyright"
yt-dlp -x --audio-format mp3 -o bgm-raw.mp3 \
  "ytsearch1:Infraction corporate instrumental no vocals"
```

If a downloaded track turns out to have vocals, do NOT try to EQ them out — re-download a different track. Vocal removal artifacts sound worse than the vocals.

### Enterprise Demo BGM — Rhythm is Mandatory

Product launch / demo videos are NOT ambient scores. They need a **percussive, driving beat** that cuts with scene transitions. Slow cinematic piano (Scott Buckley, Olafur Arnalds vibe) kills demo energy — save that for brand identity films, not product launches.

**Rule:** For any `DesignArchetype` of `SaaS Productivity`, `Fintech Precision`, `DevTool`, `Infra Authority`, or anything with "demo" / "launch" in the story intent — the BGM MUST pass this test:

- Audible kick drum or percussive pulse on every beat (or at minimum every downbeat)
- BPM 100-140 (not 60-90 ambient territory)
- Clear phrase structure (8-bar / 16-bar loops) so act transitions can land on phrase boundaries
- Energy arc: soft intro → build → peak → outro. Not flat dynamics.

**Known-good search queries for enterprise demo BGM:**
```bash
yt-dlp -x --audio-format mp3 -o public/brand/bgm-raw.mp3 \
  "ytsearch1:LiQWYD Future tech background no copyright"

# Other proven artists (all CC/royalty-free, driving rhythm):
#   - LiQWYD (upbeat electronic)
#   - Markvard (corporate pop)
#   - Ikson (modern tropical house)
#   - Scandinavianz (driving chill)
#   - Aylex (tech beat)
#   - Lakey Inspired (lo-fi but with pulse)
```

**Reject list (DO NOT use for demo videos):**
- Scott Buckley ambient pieces (cinematic score, no beat)
- Kevin MacLeod slow cinematic
- Any search with "reverie", "piano solo", "meditation", "lullaby", "spa"
- Anything labeled "ambient", "drone", "soundscape" without percussion

If the first track sounds slow/ambient in Remotion Studio preview, **immediately re-download a different one** — do not try to fix slow music with visual beat pulses.

### BGM Full-Coverage Rule (No Early Ducking)

Users perceive a video as "the music isn't working" when the BGM fades or ducks before the final beat. For a 40s video, the BGM envelope MUST hold at full volume for at least **35 continuous seconds** of the body, with fades only at the very top and tail.

**Correct envelope (Remotion `interpolate` on frame → volume):**

```tsx
// For a 40s / 1200f video at 30fps
const bgmVolume = interpolate(
  frame,
  [0, 15, 1160, 1200],   // 0.5s ramp-in, hold, 1.33s fade-out
  [0, 0.3, 0.3, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
);
```

- Ramp-in ≤ 0.5s (15f @ 30fps). Longer and the opening Act feels musicless.
- Hold volume: 0.28-0.32 typical. Too quiet and user asks "why is the music so low."
- Fade-out only in the final 1-1.5s. Earlier and user complains "music cut out early."
- Total full-volume hold must be ≥ 35s for a 40s video, ≥ 25s for a 30s video, etc. (≥ 85% of runtime.)

**Reject these common wrong envelopes:**
- `[0, 60, 1100, 1200]` with 2s ramp-in — opening Act plays in silence
- `[0, 30, 900, 1200]` with fade starting at 30s — loses the climax
- Volumes below 0.2 — music reads as background ambience, not score
- Any "duck under VO" pattern when there is no VO — just a self-inflicted volume drop

### BGM Dynamics — Flatten Before Loudnorm

Even a "peak section" clip will have internal dynamic variation that users perceive as the music dropping out. Always run `acompressor` BEFORE `loudnorm` in the filter chain so the track glues into a consistent wall of sound:

```bash
-af "acompressor=threshold=-22dB:ratio=4:attack=10:release=200:makeup=3,loudnorm=I=-13:LRA=6:TP=-1,afade=..."
```

- `threshold=-22dB` — compress anything above quiet speaking level (most of the music)
- `ratio=4` — aggressive but not pumping
- `attack=10 release=200` — fast enough to catch transients, slow enough to breathe
- `makeup=3` — gain back the compressed peaks
- After compression, `loudnorm I=-13 LRA=6` for big-tech tier (was `-16 / 9` for standard — the tighter LRA=6 is what makes it feel "glued")

This is the difference between "music that fills the room" and "music that keeps ducking in and out."

### BGM Peak Section Selection

A 150s YouTube track has roughly 3 energy zones: intro build (0-20s), main body (20-100s), outro decay (100-150s). The **loudest and most consistent** section is usually 55-100s. Sample the source with `volumedetect` at 5-second intervals BEFORE trimming and pick the 45s window with the highest average volume and smallest variance:

```bash
# Find the loudest 45s window in a source track
for t in 0 20 40 55 60 70 80 90 100; do
  lvl=$(ffmpeg -ss $t -t 0.5 -i bgm-raw.mp3 -af volumedetect -f null - 2>&1 \
        | grep mean_volume | awk '{print $5, $6}')
  echo "src t=${t}s: $lvl"
done
# Pick -ss value where neighbors are all louder than -15 dB
```

Do NOT default to `-ss 15` without checking — sometimes the peak is at 55s, sometimes at 80s. The sampling takes 5 seconds and prevents the "music feels weak in the middle" complaint.

### BGM Duration Gate (CRITICAL)

The BGM file MUST be ≥ video duration. If the video is 40s, bgm.mp3 must be ≥ 45s (with fades). Common bug: scraped track is shorter than expected, audio cuts to silence mid-video.

```bash
# MANDATORY verify step after trimming
VIDEO_SEC=40
BGM_SEC=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/brand/bgm.mp3 | cut -d. -f1)
if [ "$BGM_SEC" -lt "$VIDEO_SEC" ]; then
  echo "FATAL: bgm.mp3 is ${BGM_SEC}s but video is ${VIDEO_SEC}s — re-download with longer -t"
  exit 1
fi
```

### BGM Loudness Normalization (MANDATORY)

Raw downloads have wildly inconsistent loudness. Normalize with `loudnorm` filter before wiring to the video, otherwise the first preview will be either deafening or inaudible:

```bash
# Trim + fade + loudness normalize in one pass (REQUIRED for every BGM)
# CRITICAL: -ss and -t MUST come BEFORE -i (input-side seek).
#           Placing -ss AFTER -i (output-side seek) combined with loudnorm
#           silently produces a file with audio only in the first ~15s,
#           then digital silence for the rest. This is a real bug, not theory.
ffmpeg -y -ss <entry_point> -t 45 -i bgm-raw.mp3 \
  -af "loudnorm=I=-16:LRA=9:TP=-1.5,afade=t=in:st=0:d=1.5,afade=t=out:st=43.5:d=1.5" \
  -ar 48000 -codec:a libmp3lame -b:a 192k public/brand/bgm.mp3
```

**MANDATORY post-encode sanity check** — sample volume at 5-second intervals to confirm the track actually contains audio for its full duration. If any sample past 15s reads `-91 dB`, the encode is broken (classic symptom of output-side `-ss` + loudnorm):

```bash
for t in 0 5 10 15 20 25 30 35 40 44; do
  lvl=$(ffmpeg -ss $t -t 0.5 -i public/brand/bgm.mp3 -af volumedetect -f null - 2>&1 \
        | grep mean_volume | awk '{print $5, $6}')
  echo "t=${t}s: $lvl"
done
# PASS: all samples between -10 and -30 dB (with fade-in at t=0 and fade-out at t=44)
# FAIL: any sample reads -91.0 dB → re-encode with -ss BEFORE -i
```

- `I=-16` → integrated loudness -16 LUFS (enterprise demo target, louder than cinematic -23)
- `LRA=9` → loudness range 9 (punchy, not flat)
- `TP=-1.5` → true peak -1.5 dBFS (leaves headroom)
- `-b:a 192k` → 192kbps MP3 (720KB files at 144kbps sound muddy — aim for ≥1MB for 45s)

Ambient/cinematic content can use `I=-18, LRA=11, TP=-2` (wider dynamic range).

### BGM Entry Point

Do not start from 0:00. Most tracks have 10-20s of build-up / intro silence. Use `-ss` to enter at a high-energy point (typically 0:15-0:30 of the source).

```bash
ffmpeg -y -ss 15 -i bgm-raw.mp3 -t 45 ...  # skip first 15s intro
```

**Free sources (no attribution needed):**
- Pixabay Music (pixabay.com/music) — best for quick auto-download
- Mixkit (mixkit.co/free-stock-music)
- Uppbeat (uppbeat.io/browse/music)

**NEVER ask the user for music.** Pick a track that matches the brand tone from scraping, download it, trim it, and add it to the video automatically.

### Beat Sync — MUST Detect Real Tempo, Never Guess 120 BPM

User feedback (repeated complaint): *"音乐卡点不对"* / *"有卡点吗？"* — the visual beat pulse feels wrong when you hardcode 120 BPM but the track is actually 116 or 124. The ~3% tempo drift compounds over 40 seconds until downbeats land 5+ frames off the audible beat. That reads as "broken" to the user.

**MANDATORY:** after installing `public/brand/bgm.mp3`, run the bundled `beat-sync` script. It uses `aubiotrack` (preferred) or falls back to `ffmpeg` onset detection, and writes `src/generated/beat-map.ts` — a typed module that `MainVideo.tsx` imports directly. **You never hand-edit tempo constants.**

```bash
npx tsx scripts/beat-sync.ts public/brand/bgm.mp3
```

This one command:
1. Detects real BPM + first-beat offset via `aubiotrack` (install: `brew install aubio`)
2. Computes `measureFrames = beatIntervalSec * 4 * fps` and `firstBeatFrame = firstBeatSec * fps`
3. Writes `public/brand/beat-map.json` for debugging + `src/generated/beat-map.ts` for MainVideo consumption
4. Stamps `confidence: "high" | "medium" | "low"` based on which detector succeeded

`MainVideo.tsx` already contains:

```tsx
import { beatMap } from "./generated/beat-map";
const MEASURE_FRAMES = beatMap.measureFrames;
const FIRST_BEAT = beatMap.firstBeatFrame;
```

**You do not paste numbers in.** If `confidence === "low"`, `visual-audit` will warn — fix by installing `aubiotrack` and re-running `beat-sync`.

Example of what the generated file looks like for Infraction "Tech Success":
```ts
export const beatMap: BeatMap = {
  bpm: 116.5,
  firstBeatSec: 3.037, firstBeatFrame: 91,
  beatIntervalSec: 0.515, beatIntervalFrames: 15.45,
  measureFrames: 61.8,
  fps: 30,
  source: "aubiotrack", confidence: "high",
  generatedAt: "..."
};
```

**CRITICAL: pulse on downbeats ONLY, not every beat.** The scaffold MainVideo already does this — the block below shows the pattern for reference.

```tsx
// BEAT PULSE — ONLY on downbeats (每小节一次, 不是每拍一次)
// 每 2 秒视觉收缩一次 = premium. 每 0.5 秒收缩一次 = 迪厅/廉价.
const relFrame = frame - FIRST_BEAT;
const measureIdx = Math.floor(relFrame / MEASURE_FRAMES);
const phase = relFrame - measureIdx * MEASURE_FRAMES; // 0 at downbeat, grows to MEASURE_FRAMES
const isPreRoll = relFrame < 0;

// phase/5 decay = ~15f visible tail. 只在每小节触发, 所以可以衰减慢一些, 更有重量
const beatHit = isPreRoll ? 0 : Math.exp(-phase / 5);

// Apply to root AbsoluteFill
const beatScale = 1 + beatHit * 0.006;    // ~0.6% scale hit
const beatBright = 1 + beatHit * 0.04;    // ~4% brightness hit
```

### CRITICAL: Downbeat-only, not every beat

User feedback (repeated): *"卡点太多了吧？？？有的跳的太多了"* — pulsing on every beat at 116 BPM means ~80 visual hits in 40 seconds, once every ~0.5 seconds. That reads as a disco strobe, not a premium launch video.

**Rule:** pulse ONLY on downbeats = once per measure = once every ~2 seconds. 40-second video should have ~20 visual hits total, not 80.

| Approach | Hits/40s video | Feel |
|----------|----------------|------|
| Every beat (`beatIdx`) | 80 | Disco strobe, "AI-generated" |
| Every downbeat (`measureIdx`) | 20 | Premium, breathing, **USE THIS** |
| Every 2 measures | 10 | Extra-subtle, ambient |
| Phrase boundaries only (every 8 beats) | 10 | Good for editorial / cinematic |

**Key design notes:**
- Pulse at most once every 2 seconds. More frequent = cheap.
- `phase / 5` decay constant = ~15 frame tail — has weight because it's rare
- `beatHit` ranges 0→1, one peak per measure
- Pre-roll frames (before first audible beat) stay still — don't pulse over silence
- Scale ≤1.008, brightness ≤1.05 — sub-pixel territory, readable as rhythm but never as "effect"

**Never do:**
- `frame % 60` assuming 120 BPM — almost always wrong tempo
- `(frame / 30) * BPM / 60` without a first-beat offset — every pulse lands early by the intro build duration
- Pulsing on every beat instead of every downbeat — turns launch video into EDM visualizer
- Cranking scale to 1.05+ or brightness to 1.2+ — looks cheap, not on-beat
- Adding "downbeatBoost" multiplier on top of already-per-beat pulsing — compounds the strobe problem

### Audio Layer in MainVideo

```tsx
// BGM with fade in/out
const BGM: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const volume = Math.min(
    interpolate(frame, [0, 2 * fps], [0, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - 3 * fps, durationInFrames], [0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  return <Audio src={staticFile("brand/bgm.mp3")} volume={volume} />;
};
```

**Volume levels:** BGM 0.2-0.3 (subtle), SFX 0.3-0.5 (noticeable), VO 0.9-1.0 (dominant).

## Critical API Gotcha: evolvePath

`evolvePath(progress, path)` from `@remotion/paths` returns `{ strokeDasharray: string, strokeDashoffset: string }` — NOT a path string. **Never assign the return value to a `d` attribute.** Use destructuring:

```tsx
// CORRECT
const { strokeDasharray, strokeDashoffset } = evolvePath(progress, originalPath);
<path d={originalPath} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />

// WRONG — will render "[object Object]" as path data
const evolved = evolvePath(progress, originalPath);
<path d={evolved} />  // ← BROKEN
```

The scaffold's `PathDraw` and `MorphTransition` components already handle this correctly.

## BGM Wiring Checklist (MainVideo.tsx)

Every MainVideo.tsx MUST include Audio import and volume envelope. This is easy to forget when scaffold `MainVideo.tsx` only has the TransitionSeries template:

```tsx
import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from "remotion";

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const bgmVolume = interpolate(frame, [0, 30, 1170, 1200], [0, 0.4, 0.4, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Audio src={staticFile("brand/bgm.mp3")} volume={bgmVolume} />
      {/* ... TransitionSeries ... */}
    </AbsoluteFill>
  );
};
```

**Common miss:** Building agents copy the scaffold but never add the `<Audio>` line because the scaffold template omits it. Always wire BGM as soon as the file exists in `public/brand/bgm.mp3`.

## Icons: lucide-react Only

Never emoji. Import from `lucide-react`, render with `size`, `color`, `strokeWidth={1.5}`:

```tsx
import { Brain, Zap, Shield, Eye, Code2, Globe } from "lucide-react";
<Brain size={32} color={theme.color.accent} strokeWidth={1.5} />
```

Mappings: AI→Brain, Speed→Zap, Security→Shield, Vision→Eye, Code→Code2, Global→Globe

## Screenshot & Image Cropping Safety (MANDATORY)

Downloaded screenshots and product images MUST display with ALL text and UI elements fully visible. Cropped text = broken video.

### Rules

1. **NEVER use `objectFit: "cover"` on product screenshots** — it crops content. Use `objectFit: "contain"` to guarantee nothing is cut off.
2. **If the image is taller than the container:** Use `objectPosition: "top center"` ONLY when the bottom is decorative (footer, empty space). If the bottom has important text or UI, scale the image down to fit instead of cropping.
3. **Before using ANY downloaded image in a scene:** Check the image dimensions. If the aspect ratio doesn't fit the container, adjust the container height to match — do NOT crop the image.
4. **Test every screenshot at render resolution (1920x1080):** If any text is cut off at the edges, the image container is too small. Increase container size or reduce image scale.
5. **Safe zone: 40px padding inside browser chrome / UI frames.** No screenshot content should touch the edge of the frame.

### Anti-Patterns

```tsx
// BAD — crops bottom text
<Img src={screenshot} style={{ width: "100%", height: 500, objectFit: "cover" }} />

// GOOD — shows everything, scales to fit
<Img src={screenshot} style={{ width: "100%", height: "auto", maxHeight: 600, objectFit: "contain" }} />

// GOOD — if you must constrain height, show from top
<Img src={screenshot} style={{ width: "100%", height: 560, objectFit: "cover", objectPosition: "top center" }} />
// ↑ Only acceptable when bottom of image is non-essential
```

### Validation

After placing any image in a scene, mentally check:
- Can I read ALL text in the image at 1080p?
- Is any UI element (button, label, badge) cut off at any edge?
- If the image has a caption or footer, is it fully visible?

If ANY text is cropped → fix the container dimensions before moving on.

## Asset Strategy: MANDATORY Real Assets (Enforced)

**RULE: Every video MUST use real brand assets. No exceptions.**

Priority order for visual content:
1. **Dynamic assets** (video clips from site, `<Video>` component) — ALWAYS preferred
2. **Static assets** (product screenshots, hero images, `<Img>` component) — fallback if no video
3. **Code-built UI mockups** — supplement assets, never replace them entirely

Real assets can be displayed TWO ways:
1. **Inside UI chrome** — video/image fills the CONTENT area of a browser frame, product frame, or device mockup. UI chrome (title bar, sidebar, nav) stays code-built around the asset.
2. **Full-screen / full-bleed** — when the video asset IS the visual (e.g., a product demo reel, a cinematic brand clip, a hands-on interaction shot), let it fill the entire 1920×1080 frame. Don't force it into a browser window when it doesn't need one. Shopify's hands-on demo, Notion's hero reel — these work better full-bleed.

**Choose based on the asset content:**
- Product UI recording (dashboard, editor) → inside browser chrome
- Cinematic / lifestyle / hands-on footage → full-screen
- Marketing reel / sizzle clip → full-screen with optional vignette overlay

**At minimum, the video MUST include:**
- At least ONE scene with a real product screenshot/video inside UI chrome
- The brand's REAL logo/wordmark SVG (downloaded, NEVER hand-written)
- At least ONE downloaded hero image or product image from the site
- ScreenshotProof for the homepage and product surface

**NEVER:**
- Build an entire video with ZERO real assets (pure code-built UIs only)
- Create standalone "video showcase" scenes (slideshow, not launch video)
- Blur a screenshot to 8% opacity as "atmospheric texture"
- Use a hand-written letter/shape as logo substitute
- Use `<Img>` for content that could be `<Video>`
- Use a video asset that doesn't match the scene context (e.g., a login page video in a "features" scene)

## Asset Relevance Check (MANDATORY)

**Every downloaded video/image MUST make sense for its scene.** Before placing an asset:

1. **Watch the full clip** — does it show the product feature this scene is about?
2. **Match scene narrative** — HookScene asset should show the product's hero moment; ShowcaseScene assets should match specific features being highlighted
3. **Check visual quality** — no watermarks, no low-res upscales, no recording artifacts (mouse cursors, OS notifications)
4. **Brand alignment** — the asset should look like it came from the brand's own marketing, not a random YouTube tutorial

If the downloaded video doesn't match → search for a better one. Don't force a mismatched clip just to "have a real asset."

**Logo is SACRED:**
- Download the exact SVG from the site's favicon, header, or Lottie animation
- NEVER approximate with a styled `<span>` letter (e.g., "C" for Claude)
- NEVER hand-write SVG `<path>` data — it WILL render broken
- Test the logo renders correctly before building scenes around it

## Video Embedding

Prefer `@remotion/media`'s `Video` — auto-falls back to OffthreadVideo in production:

```tsx
import { Video } from "@remotion/media";
<Video src={staticFile("brand/demo.mp4")} />
```

If using core `remotion`, import `OffthreadVideo` directly (NOT from `@remotion/media`).

## Asset Download > Screenshots

- Scrape `<img>`, `og:image`, hero images from brand site
- Downloaded assets > screenshots (higher quality, brand-approved)
- Display at near-full width (900px+), borderRadius 16px, drop shadow
- Screenshots are FALLBACK only

## File Organization

```
src/
  Root.tsx              — Composition registration + Zod schema
  MainVideo.tsx         — 5-act sequencer + audio + grain
  theme.ts              — Brand tokens from scraped site
  fonts.ts              — @remotion/google-fonts setup
  scenes/
    HookScene.tsx        — Act 1: product UI hook
    RevealScene.tsx      — Act 2: logo constellation
    ShowcaseScene.tsx     — Act 3: feature vignettes
    ProofScene.tsx       — Act 4: data dashboard
    CloseScene.tsx       — Act 5: CTA close
  components/
    Background.tsx       — GradientMesh, FilmGrain, Vignette, ColorGrade
    Animations.tsx       — FadeIn, ScaleIn, SplitText, CountUp
public/
  brand/                 — Scraped: logo, images, video clips
```
