/**
 * [INPUT]: remotion Composition, MainVideo, generated scene constitution, format preset
 * [OUTPUT]: RemotionRoot — Composition 注册, 多长宽比预设驱动
 * [POS]: Remotion 根组件, 定义所有 Composition
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import "./index.css";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { sceneConstitution } from "./generated/project-data";

// ================================================================
// FORMAT PRESETS — 切换一行即可改长宽比
// ================================================================
// landscape        : 1920x1080  YouTube / 官网 hero / 通用 16:9
// portrait-social  : 1080x1350  Instagram Feed / LinkedIn 4:5 (社媒默认)
// reel             : 1080x1920  TikTok / Reels / Shorts 9:16
// square           : 1080x1080  Twitter / Feed 1:1
//
// 切换时必须同步检查:
// 1. 场景内 padding / maxWidth (竖屏要 padding 56-80px, 横屏要 108-140px)
// 2. fontSize (竖屏 headline 84-96, 横屏可用 90-120)
// 3. UI mockup maxWidth (竖屏 940-960px 锁死, 横屏可铺到 1200+)
// 4. 长边 >=1080 的 SplitText delay × 字符数确保能在场景时长内跑完
// ================================================================
const FORMATS = {
  landscape: { width: 1920, height: 1080 },
  "portrait-social": { width: 1080, height: 1350 },
  reel: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
} as const;

type FormatName = keyof typeof FORMATS;

// 默认 landscape. 社媒项目改成 "portrait-social", 竖屏短视频用 "reel".
const FORMAT: FormatName = "landscape";

// ================================================================
// Duration follows generated scene constitution so the first cut stays
// aligned with the intake engine instead of a hard-coded shell.
// ================================================================
export const RemotionRoot: React.FC = () => {
  const durationInFrames = Math.max(
    150,
    Math.round((sceneConstitution.pacingProfile?.durationSeconds || 40) * 30),
  );

  const { width, height } = FORMATS[FORMAT];

  return (
    <Composition
      id="LaunchVideo"
      component={MainVideo}
      durationInFrames={durationInFrames}
      fps={30}
      width={width}
      height={height}
    />
  );
};
