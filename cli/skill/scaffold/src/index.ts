/**
 * [INPUT]: remotion registerRoot, Root 组件, fonts 加载器
 * [OUTPUT]: Remotion 入口注册
 * [POS]: 项目入口, Remotion bootstrap
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import "./index.css";
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { loadFonts } from "./lib/fonts";

loadFonts();
registerRoot(RemotionRoot);
