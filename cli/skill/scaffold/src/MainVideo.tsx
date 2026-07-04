/**
 * [INPUT]: generated project data, theme, Atmosphere 氛围底座, background primitives, LogoEntrance, MockupTemplates, Animations
 * [OUTPUT]: MainVideo — real 5-act launch video (not a dashboard dump)
 * [POS]: 视频主编排器, 把 URL intake 产物渲染成 40 秒 launch video 首稿
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  ColorGrade,
  FilmGrain,
  Vignette,
} from "./components/Background";
import { Atmosphere } from "./components/Atmosphere";
import {
  AnalyticsDashboard,
  BrowserFrame,
  DataTable,
  KanbanBoard,
  TerminalWindow,
} from "./components/MockupTemplates";
import { GlassPanel } from "./components/UI";
import { FadeIn, SplitText, CountUp } from "./components/Animations";
import { LogoEntrance, type LogoEntranceVariant } from "./components/LogoEntrance";
import { PhoneFrame } from "./components/PhoneFrame";
import { assetManifest, brandReport, sceneConstitution } from "./generated/project-data";
import { beatMap } from "./generated/beat-map";
import { theme } from "./theme";

// ================================================================
// 类型
// ================================================================
type AssetLike = {
  kind: string;
  label?: string;
  localPath?: string;
  status?: string;
  notes?: string;
};

const manifestAssets = assetManifest.assets as ReadonlyArray<AssetLike>;

// ================================================================
// 资源定位器 — localPath → staticFile("brand/xxx")
// ================================================================
const relativeFromLocal = (localPath: string | undefined): string | null => {
  if (!localPath) return null;
  const normalized = localPath.replace(/\\/g, "/");
  const marker = "/public/";
  const idx = normalized.lastIndexOf(marker);
  if (idx >= 0) return normalized.slice(idx + marker.length);
  const tail = normalized.split("/").pop();
  return tail ? `brand/${tail}` : null;
};

const findAsset = (kinds: readonly string[]): AssetLike | null => {
  for (const kind of kinds) {
    const asset = manifestAssets.find(
      (a) => a.kind === kind && a.status !== "missing" && a.status !== "referenced",
    );
    if (asset) return asset;
  }
  return null;
};

const absSrc = (asset: AssetLike | null): string | null => {
  const rel = relativeFromLocal(asset?.localPath);
  return rel ? staticFile(rel) : null;
};

const relSrc = (asset: AssetLike | null): string | null => {
  return relativeFromLocal(asset?.localPath);
};

// ================================================================
// Archetype → LogoEntrance variant
// ================================================================
const pickLogoVariant = (archetype: string): LogoEntranceVariant => {
  const key = archetype.toLowerCase();
  if (/infra|fintech|enterprise|security|compliance|system/.test(key)) return "light-curtain";
  if (/ai|data|saas|cloud|developer|platform/.test(key)) return "particle-assembly";
  if (/media|film|camera|video|cinema/.test(key)) return "iris-open";
  if (/game|sport|consumer|fitness|hardware/.test(key)) return "z-depth-punch";
  if (/design|fashion|minimal|editorial/.test(key)) return "split-reveal";
  if (/creative|music|art|studio/.test(key)) return "prism-refraction";
  return "impact-flash";
};

// ================================================================
// 文案清洗 — featureNames 里有 HTML entity 和标点
// ================================================================
const decode = (raw: string): string =>
  raw
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\u2019/g, "'")
    .trim();

// ================================================================
// 资源快捷引用
// ================================================================
const LOGO_ASSET = findAsset(["logo", "wordmark"]);
// HOMEPAGE_ASSET 故意不取 — playwright 自截图, 非品牌自产, 不进场景池
const HERO_ASSET = findAsset(["hero-image", "hero"]);
const PRODUCT_ASSET = findAsset(["product-screenshot"]);
const VIDEO_ASSET = findAsset(["video", "demo-video"]);
const BGM_ASSET = findAsset(["bgm"]);

const LOGO_REL = relSrc(LOGO_ASSET);
const HERO_SRC = absSrc(HERO_ASSET);
const PRODUCT_SRC = absSrc(PRODUCT_ASSET);
const VIDEO_SRC = absSrc(VIDEO_ASSET);
const BGM_SRC = absSrc(BGM_ASSET);

// App Store gallery screens — harvested from apps.apple.com marketing page.
// Each is a DIFFERENT real screen (not a pan of the same asset). For
// mobile-app category these replace the single PRODUCT_SRC panned-3x approach.
// Note: App Store marketing stills often have baked headline text above the
// phone, so we treat them as `cover` and never put an overlay headline.
const APP_SCREEN_SRCS: string[] = manifestAssets
  .filter((a) => a.kind === "app-store-screenshot" && a.status !== "missing")
  .map((a) => absSrc(a))
  .filter((s): s is string => Boolean(s));

// ================================================================
// 资源池 — 只收品牌自产素材, 严禁 playwright 自截图混入
//
// 铁律 (来自用户): "素材都必须是网站的素材, 不是我们纯截图".
//
// 品牌自产 = 网站自己在 DOM / CDN 里 ship 的资源:
//   - <video> 源 / 嵌入 demo 视频
//   - <img> 源 / og:image / twitter:image / hero image (他们自己的 CDN)
//   - 产品 UI 截图 (他们自己放在 misc-assets 之类)
//
// 非品牌自产 = 我们用 playwright 渲染后截的图:
//   - homepage-screenshot 永远是 playwright 对着他们 header 截的, 严格视为 preview-only,
//     不进场景池. 用它等于拿"我们自己的屏幕录制"冒充他们的产品素材, 用户会立即察觉.
//
// 内容类型 (只对进池素材分类):
//   - "demo"  : 真实产品 UI / 演示视频 → overlay-safe, Showcase-eligible
//   - "cover" : og-image / brand hero (含已烘焙的 tagline) → 只能 full-bleed, 禁 overlay headline
//
// 规则:
//   - 每个 src 只能在整个视频里出现 1 次 (dedup)
//   - Act2 Reveal 优先 demo; 没有 demo 则用 cover (full-bleed, 禁 overlay)
//   - Act3 Showcase 只吃 demo. 没有 demo → EditorialVignette 纯字体编辑态
//   - Logo 不进池 (Act1 / Act5 专用)
//   - HOMEPAGE_SRC 永远不进池 (playwright 自截图)
// ================================================================
type VisualKind = "demo" | "cover";
type VisualSource = {
  src: string;
  kind: VisualKind;
  media: "video" | "image";
  objectPosition: string;
  hasBakedText: boolean; // cover 通常 true → 禁止 overlay headline
};

// 注意: HOMEPAGE_SRC 故意不在这里. 它是 playwright 自截图, 非品牌自产素材.
const rawPool: ReadonlyArray<Omit<VisualSource, "src"> & { src: string | null }> = [
  { src: VIDEO_SRC, kind: "demo", media: "video", objectPosition: "center center", hasBakedText: false },
  { src: PRODUCT_SRC, kind: "demo", media: "image", objectPosition: "center center", hasBakedText: false },
  { src: HERO_SRC, kind: "cover", media: "image", objectPosition: "center center", hasBakedText: true },
];
const ASSET_POOL: ReadonlyArray<VisualSource> = (() => {
  const seen = new Set<string>();
  const out: VisualSource[] = [];
  for (const item of rawPool) {
    if (!item.src) continue;
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    out.push({
      src: item.src,
      kind: item.kind,
      media: item.media,
      objectPosition: item.objectPosition,
      hasBakedText: item.hasBakedText,
    });
  }
  return out;
})();

const ACT2_VISUAL: VisualSource | null = ASSET_POOL[0] || null;
// 注意: Act3 不再消费真实图片素材 — 全部用 UI mockup (KanbanBoard/DataTable/...).
// 对 "demo" 类的过滤逻辑保留给未来 BrowserFrame 嵌真实演示视频时使用.

const BRAND_NAME = brandReport.brandName;
const HEADLINE = decode(brandReport.textTruth.headline || brandReport.textTruth.title || BRAND_NAME);
const SUBHEADLINE = decode(brandReport.textTruth.subheadline || "");
const HOST = (() => {
  try {
    return new URL(brandReport.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return brandReport.sourceUrl;
  }
})();
// featureNames 可能是 (a) 真 feature 短语 "Window Management", 也可能是 (b)
// 编辑口吻的 section headline "It's not about saving time." — (b) 配图会出事.
// 为 Showcase 保留所有条目, 为 Act3 editorial fallback 也够.
const FEATURES = brandReport.textTruth.featureNames
  .map(decode)
  .filter((s) => s.length > 0 && s.length < 80)
  .slice(0, 6);
const CTAS = brandReport.textTruth.cta.map(decode).filter((s) => s.length > 0 && s.length < 30);
const PRIMARY_CTA = CTAS[0] || "Get started";
const LOGO_VARIANT = pickLogoVariant(sceneConstitution.archetype.primary);

// ================================================================
// Act 1 — Authority / Logo open
// ================================================================
// 注意: act 根容器一律 background: "transparent" — 根级 Atmosphere 氛围底座
// (rules/composition.md Law 1) 必须透过每一幕可见. 不透明底色会把它盖死,
// 让视频退回"黑底真空". 只有 mockup 内部的 UI 表面才允许不透明底.
const Act1Authority: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <LogoEntrance
      variant={LOGO_VARIANT}
      src={LOGO_REL}
      fallbackText={BRAND_NAME}
      size={420}
      accent={theme.color.primary}
      bg={theme.color.bg}
    />
  </AbsoluteFill>
);

// ================================================================
// Act 2 — Reveal: 根据素材类型选布局, 绝不在 cover 上 overlay headline
//
//   demo (video/product-ui): BrowserFrame + 左右/上下分栏 + overlay headline
//   cover (og/hero with baked text): full-bleed, 禁止 overlay, 只在底部小字标品牌
//   page (homepage 全页): BrowserFrame 浏览器外壳 + overlay headline
//   none: 纯文字 SUBHEADLINE
// ================================================================
const Act2Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const kenBurns = interpolate(frame, [0, 180], [1.02, 1.05]);
  const visual = ACT2_VISUAL;

  // Cover 模式: 图里已有文字, 全屏无 overlay. 视觉权重完全给图.
  if (visual?.kind === "cover") {
    const bottomFade = interpolate(frame, [20, 48], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <AbsoluteFill style={{ background: "transparent", overflow: "hidden" }}>
        {visual.media === "video" ? (
          <OffthreadVideo
            src={visual.src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${kenBurns})`,
            }}
            muted
          />
        ) : (
          <Img
            src={visual.src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: visual.objectPosition,
              transform: `scale(${kenBurns})`,
              transformOrigin: "center center",
            }}
          />
        )}
        {/* 底部渐变 + 极简品牌署名, 不与图里已有的 headline 撞车 */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0 0 72px 0",
            opacity: bottomFade,
          }}
        >
          <div
            style={{
              fontSize: theme.fontSize.caption,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: theme.font.body,
              fontWeight: 500,
            }}
          >
            {HOST}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  // Demo / Page / None: 安全 overlay 模式 — 图不含 headline, 可以叠加
  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        padding: "92px 108px",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 48,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            fontSize: theme.fontSize.sectionTag,
            color: theme.color.textMuted,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: theme.font.body,
            fontWeight: 500,
          }}
        >
          <FadeIn delay={6} direction="up" distance={16}>
            <span>{BRAND_NAME}</span>
          </FadeIn>
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: theme.fontSize.hero,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            fontFamily: theme.font.heading,
            fontWeight: 600,
            color: theme.color.text,
            maxWidth: 1400,
          }}
        >
          <SplitText text={HEADLINE} delay={12} staggerFrames={2} distance={28} />
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderRadius: theme.radius.xl,
        }}
      >
        {visual?.media === "video" ? (
          <BrowserFrame url={HOST} delay={20}>
            <div style={{ height: 760, background: theme.color.bg }}>
              <OffthreadVideo
                src={visual.src}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted
              />
            </div>
          </BrowserFrame>
        ) : visual ? (
          <BrowserFrame url={HOST} delay={20}>
            <div style={{ height: 760, background: theme.color.bg, overflow: "hidden" }}>
              <Img
                src={visual.src}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: visual.objectPosition,
                  transform: `scale(${kenBurns})`,
                  transformOrigin: "center center",
                }}
              />
            </div>
          </BrowserFrame>
        ) : (
          <GlassPanel padding={56} style={{ width: "100%", textAlign: "center" }}>
            <div
              style={{
                fontSize: theme.fontSize.sub,
                fontFamily: theme.font.heading,
                fontWeight: 500,
                color: theme.color.text,
              }}
            >
              {SUBHEADLINE || "A better way to work."}
            </div>
          </GlassPanel>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================
// Act 3 — Showcase
//
// 铁律: feature 永远搭配 "生成式 UI mockup" (KanbanBoard / DataTable /
// TerminalWindow / AnalyticsDashboard / BrowserFrame), 不是 playwright 自截图.
// 这些组件读 theme 上色, 是原创创意资产, 不算假冒品牌素材.
//
// 场景选择按 archetype:
//   dev / infra / platform / fintech  → TerminalWindow → KanbanBoard → DataTable
//   ai / data / analytics             → AnalyticsDashboard → DataTable → KanbanBoard
//   其它                               → KanbanBoard → DataTable → AnalyticsDashboard
//
// feature 文案做左上角 eyebrow + 大字 headline + accent 渐变下划线.
// UI mockup 做主视觉 (禁 beatHit 呼吸 — heartbeat ban).
// 只有在 feature 数量 < 1 时才 fallback 成 EditorialVignette.
// ================================================================

// Vignette taxonomy is split into two universes:
//   desktop: terminal/kanban/table/dashboard — for saas-desktop, developer-tool
//   mobile : phone-screen variants            — for mobile-app
// productCategory selects which universe is used in Act 3.
type VignetteKind =
  | "terminal" | "kanban" | "table" | "dashboard"
  | "phone-feed" | "phone-detail" | "phone-stream";

const PRODUCT_CATEGORY: string =
  (brandReport as { productCategory?: { category?: string } }).productCategory?.category || "saas-desktop";

const pickVignetteSequence = (archetype: string, category: string): VignetteKind[] => {
  // Mobile-app: PhoneFrame variants. The real product screenshot (1080×1920)
  // is rendered as the screen content via PRODUCT_SRC, with overlay UI chrome.
  if (category === "mobile-app") {
    return ["phone-feed", "phone-detail", "phone-stream"];
  }
  const key = archetype.toLowerCase();
  if (/infra|fintech|enterprise|security|compliance|system|developer|platform|devtool/.test(key)) {
    return ["terminal", "kanban", "table"];
  }
  if (/ai|data|analytic|ml|model/.test(key)) {
    return ["dashboard", "table", "kanban"];
  }
  if (/design|creative|media|studio/.test(key)) {
    return ["kanban", "dashboard", "table"];
  }
  return ["kanban", "table", "dashboard"];
};

const VIGNETTE_SEQUENCE = pickVignetteSequence(sceneConstitution.archetype.primary, PRODUCT_CATEGORY);

// ---------- mockup data builders — 内容用 brand truth, 不瞎编 ----------

const terminalLines = (primary: string, accent: string) => [
  { text: `~ ${HOST.split(".")[0] || "app"} —zsh`, color: "rgba(255,255,255,0.35)" },
  { text: `${HOST.split(".")[0] || "app"} init`, prefix: "$ ", color: "#EDEDF3" },
  { text: "→ workspace ready", color: primary },
  { text: `${HOST.split(".")[0] || "app"} run ${(FEATURES[0] || "task").toLowerCase().split(" ")[0]}`, prefix: "$ ", color: "#EDEDF3" },
  { text: "✓ 12 actions completed", color: primary },
  { text: "✓ 0 errors", color: primary },
  { text: `${HOST.split(".")[0] || "app"} deploy --prod`, prefix: "$ ", color: "#EDEDF3" },
  { text: "→ live in 8.2s", color: accent },
];

const kanbanColumns = (primary: string, accent: string) => {
  const features = FEATURES.length >= 3 ? FEATURES : [...FEATURES, HEADLINE, SUBHEADLINE].filter(Boolean);
  return [
    {
      title: "Backlog",
      color: "rgba(255,255,255,0.4)",
      cards: [
        { title: features[0] || "New feature", tag: "P1", tagColor: accent },
        { title: features[1] || "Refactor core", tag: "P2", tagColor: "rgba(255,255,255,0.5)" },
      ],
    },
    {
      title: "In Progress",
      color: accent,
      cards: [
        { title: features[2] || "Ship release", tag: "Active", tagColor: accent },
      ],
    },
    {
      title: "Done",
      color: primary,
      cards: [
        { title: features[3] || "Customer rollout", tag: "Done", tagColor: primary },
        { title: features[4] || "Metrics dashboard", tag: "Done", tagColor: primary },
      ],
    },
  ];
};

const tableRows = (primary: string, accent: string) => {
  const features = FEATURES.filter((f) => f.length < 40);
  const pick = (i: number, fb: string) => features[i] || fb;
  return {
    columns: ["Workflow", "Owner", "Status", "Coverage"],
    rows: [
      {
        cells: [
          pick(0, "Onboarding"),
          "Team · 4",
          { color: primary, label: "Live" },
          "98%",
        ],
      },
      {
        cells: [
          pick(1, "Growth loop"),
          "Team · 6",
          { color: primary, label: "Live" },
          "94%",
        ],
      },
      {
        cells: [
          pick(2, "Platform"),
          "Team · 8",
          { color: accent, label: "Rolling" },
          "71%",
        ],
      },
      {
        cells: [
          pick(3, "Insights"),
          "Team · 3",
          { color: "rgba(255,255,255,0.5)", label: "Draft" },
          "22%",
        ],
      },
    ],
    highlight: 1,
  };
};

const dashboardMetrics = () => {
  const mk = (n: number) =>
    Array.from({ length: 14 }, (_, i) => ({
      value: 30 + Math.sin((i + n) * 0.7) * 18 + i * 2,
    }));
  return [
    { icon: "◆", label: "Active workspaces", value: 12480, prefix: "", suffix: "", trend: 12, sparkline: mk(0) },
    { icon: "▲", label: "Actions per day", value: 864000, prefix: "", suffix: "", trend: 24, sparkline: mk(2) },
    { icon: "●", label: "Time saved", value: 92, prefix: "", suffix: "%", trend: 8, sparkline: mk(4) },
    { icon: "◇", label: "Uptime", value: 99.98, prefix: "", suffix: "%", trend: 0, sparkline: mk(6) },
  ];
};

// ---------- mobile-app showcase screen ----------
// Renders the real product screenshot inside a PhoneFrame.
// Three variants pan/scale/parallax differently so each vignette feels distinct.
//
// Why this design:
//   Mobile apps live in a 9:19.5 phone shape. Cropping a phone screenshot
//   to fill a 16:9 frame strips its identity. Putting the real screenshot
//   inside a real-looking phone frame is the most credible way to show
//   "this is a mobile app you can hold."
const PhoneShowcaseScreen: React.FC<{ kind: VignetteKind; index: number }> = ({ kind, index }) => {
  const frame = useCurrentFrame();
  const screenSrc = PRODUCT_SRC || HERO_SRC;
  const screenWidth = 540;
  // Per-variant screen pan: feed slowly scrolls top→bottom, detail holds center,
  // stream pans bottom→top with subtle zoom-in.
  const panProgress = interpolate(frame, [0, 180], [0, 1], { extrapolateRight: "clamp" });
  const screenContent = (() => {
    if (!screenSrc) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(180deg, ${theme.color.panel}, ${theme.color.bg})`,
            color: theme.color.textMuted,
            fontFamily: theme.font.body,
            fontSize: theme.fontSize.mockupRow,
          }}
        >
          {BRAND_NAME}
        </div>
      );
    }
    const transform = (() => {
      switch (kind) {
        case "phone-feed":
          // slow scroll top→bottom (image bigger than screen, translateY pans)
          return `translateY(${interpolate(panProgress, [0, 1], [0, -240])}px) scale(1.0)`;
        case "phone-detail":
          // hold center with gentle zoom-in
          return `translateY(${interpolate(panProgress, [0, 1], [-60, -100])}px) scale(${interpolate(panProgress, [0, 1], [1.04, 1.10])})`;
        case "phone-stream":
          // pan bottom→top
          return `translateY(${interpolate(panProgress, [0, 1], [-360, -120])}px) scale(1.02)`;
      }
      return undefined;
    })();
    return (
      <Img
        src={screenSrc}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "cover",
          objectPosition: "center top",
          transform,
          transformOrigin: "center center",
        }}
      />
    );
  })();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <PhoneFrame screenWidth={screenWidth} tilt={index === 1 ? 0 : index === 0 ? 4 : -4}>
        {screenContent}
      </PhoneFrame>
    </div>
  );
};

// ---------- single vignette: eyebrow + headline + UI mockup ----------
const ShowcaseVignette: React.FC<{
  feature: string;
  index: number;
  total: number;
  kind: VignetteKind;
}> = ({ feature, index, total, kind }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 20, stiffness: 110, mass: 0.9 } });
  const drift = interpolate(intro, [0, 1], [24, 0]);

  const body = (() => {
    switch (kind) {
      case "terminal":
        return (
          <TerminalWindow
            lines={terminalLines(theme.color.primary, theme.color.accent)}
            typingSpeed={2}
            delay={14}
          />
        );
      case "kanban":
        return <KanbanBoard columns={kanbanColumns(theme.color.primary, theme.color.accent)} delay={14} />;
      case "table": {
        const t = tableRows(theme.color.primary, theme.color.accent);
        return <DataTable columns={t.columns} rows={t.rows} highlightRow={t.highlight} delay={14} />;
      }
      case "dashboard":
        return <AnalyticsDashboard metrics={dashboardMetrics()} delay={14} />;
      case "phone-feed":
      case "phone-detail":
      case "phone-stream":
        return <PhoneShowcaseScreen kind={kind} index={index} />;
    }
  })();

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        padding: "84px 104px",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          transform: `translateY(${drift}px)`,
          opacity: intro,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: theme.fontSize.sectionTag,
            color: theme.color.textMuted,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontFamily: theme.font.body,
            fontWeight: 500,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 44,
              height: 2,
              background: theme.color.primary,
              transform: `scaleX(${intro})`,
              transformOrigin: "left center",
            }}
          />
          <span>
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {BRAND_NAME}
          </span>
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: theme.fontSize.hero,
            lineHeight: 1.0,
            letterSpacing: "-0.035em",
            fontFamily: theme.font.heading,
            fontWeight: 600,
            color: theme.color.text,
            maxWidth: 1500,
          }}
        >
          <SplitText text={feature} delay={10} staggerFrames={2} distance={22} />
        </h2>
        <div
          style={{
            height: 4,
            width: 140,
            background: `linear-gradient(90deg, ${theme.color.primary}, ${theme.color.accent})`,
            borderRadius: 2,
            transform: `scaleX(${intro})`,
            transformOrigin: "left center",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          opacity: intro,
        }}
      >
        {body}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Act 3 mobile App Store cover — full-bleed, no overlay ----------
// When the orchestrator harvested 2+ App Store gallery screenshots, those
// images ARE the Act 3 story. They're real, different, and usually ship with
// baked marketing headlines. Ken-Burns through them, let the image breathe.
// No eyebrow, no 72px overlay, no split-screen template.
const AppStoreCoverSlide: React.FC<{ src: string; index: number; total: number }> = ({
  src,
  index,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22, stiffness: 95, mass: 0.9 } });
  // Alternate zoom direction per slide so it doesn't feel like the same pan.
  const dir = index % 2 === 0 ? 1 : -1;
  const scale = interpolate(frame, [0, 180], [1.04, 1.04 + dir * 0.05]);
  const shift = interpolate(frame, [0, 180], [0, dir * 18]);
  const opacity = interpolate(intro, [0, 1], [0.0, 1]);
  return (
    <AbsoluteFill style={{ background: "transparent", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, ${theme.color.panel}cc 0%, transparent 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        <Img
          src={src}
          style={{
            height: "92%",
            width: "auto",
            objectFit: "contain",
            transform: `scale(${scale}) translateX(${shift}px)`,
            transformOrigin: "center center",
            filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.45))",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 72px 56px 72px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: theme.fontSize.caption,
            color: theme.color.textMuted,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontFamily: theme.font.body,
            fontWeight: 500,
          }}
        >
          {BRAND_NAME}
        </div>
        <div
          style={{
            fontSize: theme.fontSize.caption,
            color: theme.color.textMuted,
            letterSpacing: "0.14em",
            fontFamily: theme.font.mono,
            fontWeight: 400,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Act3Showcase: React.FC<{ durationFrames: number }> = ({ durationFrames }) => {
  // Mobile-app path: if we harvested 2+ real App Store screens, use those as
  // the primary Act 3 — full-bleed, one per slide, no template overlay.
  if (PRODUCT_CATEGORY === "mobile-app" && APP_SCREEN_SRCS.length >= 2) {
    const screens = APP_SCREEN_SRCS.slice(0, Math.min(3, APP_SCREEN_SRCS.length));
    const segmentFrames = Math.floor(durationFrames / screens.length);
    return (
      <AbsoluteFill>
        {screens.map((src, i) => (
          <Sequence key={`as${i}`} from={i * segmentFrames} durationInFrames={segmentFrames + 4}>
            <AppStoreCoverSlide src={src} index={i} total={screens.length} />
          </Sequence>
        ))}
      </AbsoluteFill>
    );
  }

  // Default path: feature headline + mockup vignette per segment.
  const rawFeatures = FEATURES.length > 0 ? FEATURES : [HEADLINE];
  const slotCount = Math.min(3, Math.max(1, rawFeatures.length));
  const features = rawFeatures.slice(0, slotCount);
  const segmentFrames = Math.floor(durationFrames / features.length);

  return (
    <AbsoluteFill>
      {features.map((feature, i) => (
        <Sequence
          key={`v${i}`}
          from={i * segmentFrames}
          durationInFrames={segmentFrames + 4}
        >
          <ShowcaseVignette
            feature={feature}
            index={i}
            total={features.length}
            kind={VIGNETTE_SEQUENCE[i % VIGNETTE_SEQUENCE.length]}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ================================================================
// Act 4 — Proof: score bars + rationale
// ================================================================
const ProofStat: React.FC<{ label: string; value: number; delay: number; suffix?: string }> = ({
  label,
  value,
  delay,
  suffix = "",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - delay, [0, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 28,
          color: theme.color.textMuted,
          fontFamily: theme.font.body,
          letterSpacing: "0.04em",
        }}
      >
        <span style={{ textTransform: "uppercase" }}>{label}</span>
        <span
          style={{
            fontSize: 56,
            color: theme.color.text,
            fontFamily: theme.font.heading,
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <CountUp from={0} to={value} delay={delay} duration={48} suffix={suffix} />
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: theme.color.surface,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress * value}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${theme.color.primary}, ${theme.color.accent})`,
          }}
        />
      </div>
    </div>
  );
};

const Act4Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 20, stiffness: 110 } });
  const score = brandReport.score;
  const rationale = score.rationale.slice(0, 3);

  const stats = [
    { label: "Product Clarity", value: score.productClarity },
    { label: "Screenshot Coverage", value: score.screenshotCompleteness },
    { label: "Brand Signature", value: score.brandDistinctiveness },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        padding: "92px 108px",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 56,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontSize: 26,
            color: theme.color.textMuted,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontFamily: theme.font.body,
            fontWeight: 500,
          }}
        >
          <FadeIn delay={4} direction="up" distance={16}>
            <span>Why it works</span>
          </FadeIn>
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 82,
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            fontFamily: theme.font.heading,
            fontWeight: 600,
            color: theme.color.text,
            maxWidth: 1400,
          }}
        >
          <SplitText text="Built on real product evidence." delay={10} staggerFrames={2} distance={20} />
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 56,
          alignItems: "center",
        }}
      >
        <GlassPanel
          padding={48}
          blur={18}
          opacity={0.06}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 36,
            transform: `translateY(${interpolate(intro, [0, 1], [24, 0])}px)`,
            opacity: intro,
          }}
        >
          {stats.map((stat, i) => (
            <ProofStat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              delay={20 + i * 10}
              suffix=""
            />
          ))}
        </GlassPanel>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {rationale.map((line, i) => (
            <FadeIn key={i} delay={40 + i * 14} direction="left" distance={24}>
              <div
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                  fontSize: 30,
                  lineHeight: 1.4,
                  color: theme.color.textBody,
                  fontFamily: theme.font.body,
                  fontWeight: 400,
                }}
              >
                <div
                  style={{
                    marginTop: 14,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: theme.color.primary,
                    flexShrink: 0,
                  }}
                />
                <span>{line}</span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================
// Act 5 — Close: logo lockup + CTA
// ================================================================
const Act5Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ctaProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 18, stiffness: 100, mass: 0.9 },
  });
  const hostProgress = interpolate(frame - 60, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
      }}
    >
      <LogoEntrance
        variant={LOGO_VARIANT}
        src={LOGO_REL}
        fallbackText={BRAND_NAME}
        size={320}
        accent={theme.color.primary}
        bg={theme.color.bg}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          opacity: ctaProgress,
          transform: `translateY(${interpolate(ctaProgress, [0, 1], [18, 0])}px)`,
        }}
      >
        <div
          style={{
            padding: "22px 56px",
            borderRadius: 999,
            background: theme.color.text,
            color: theme.color.bg,
            fontSize: 34,
            fontFamily: theme.font.body,
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {PRIMARY_CTA}
        </div>
        <div
          style={{
            fontSize: 26,
            color: theme.color.textMuted,
            fontFamily: theme.font.body,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: hostProgress,
          }}
        >
          {HOST}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================
// 场景时长 — 来自 pacingProfile.targetActs (秒), 回落 40s 均分
// ================================================================
const getActFrames = (sceneId: string, fallback: number): number => {
  const targets = sceneConstitution.pacingProfile?.targetActs;
  if (targets && typeof (targets as Record<string, unknown>)[sceneId] === "number") {
    return Math.max(120, Math.round(((targets as Record<string, number>)[sceneId]) * 30));
  }
  return fallback;
};

// ================================================================
// BEAT PULSE — 从 beat-map.ts 读取, 禁止硬编码
// ================================================================
const MEASURE_FRAMES = beatMap.measureFrames;
const FIRST_BEAT = beatMap.firstBeatFrame;

// ================================================================
// MainVideo — 5-act TransitionSeries with bgm + color grade
// ================================================================
export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const bgmVolume = interpolate(
    frame,
    [0, 15, durationInFrames - 40, durationInFrames],
    [0, 0.3, 0.3, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 心跳式 downbeat 脉冲已封杀 (taste.md heartbeat ban, Nora 2026-07-04):
  // 节律性 scale/brightness 抖动 = 心跳感. beat grid 只用于剪辑点, 不做可见脉冲.

  // Scene durations from constitution (seconds → frames)
  const authorityFrames = getActFrames("authority", 150);
  const revealFrames = getActFrames("reveal", 180);
  const showcaseFrames = getActFrames("showcase", 420);
  const proofFrames = getActFrames("proof", 240);
  const closeFrames = getActFrames("close", 210);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.color.bg,
        color: theme.color.text,
        fontFamily: theme.font.body,
        overflow: "hidden",
        filter: "url(#color-grade)",
      }}
    >
      {BGM_SRC ? <Audio src={BGM_SRC} volume={bgmVolume} /> : null}

      {/* 零真空法 (rules/composition.md Law 1): 氛围底座常驻根级 —
          体积光 + 网格地平线 + 漂浮粒子. 各 act 可调参换气质,
          绝不许删回裸 #000. grain 不开 — 下方已叠 FilmGrain. */}
      <Atmosphere primary={theme.color.primary} accent={theme.color.accent} />
      <ColorGrade />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={authorityFrames}>
          <Act1Authority />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={revealFrames}>
          <Act2Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={showcaseFrames}>
          <Act3Showcase durationFrames={showcaseFrames} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={proofFrames}>
          <Act4Proof />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 14 })}
        />
        <TransitionSeries.Sequence durationInFrames={closeFrames}>
          <Act5Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <FilmGrain opacity={0.028} />
      <Vignette intensity={0.36} />
    </AbsoluteFill>
  );
};
