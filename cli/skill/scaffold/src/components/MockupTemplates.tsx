/**
 * [INPUT]: remotion (useCurrentFrame, useVideoConfig, spring, interpolate, Easing),
 *          theme.ts (color, font, radius tokens)
 * [OUTPUT]: DataTable, KanbanBoard, TerminalWindow, AnalyticsDashboard, BrowserFrame
 * [POS]: 产品 UI 模拟模板库, 提供即插即用的场景级 mockup 组件
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";
import { theme } from "../theme";

// ================================================================
// 共享常量
// ================================================================
const STAGGER_FRAMES = 4;

// ================================================================
// 共享工具 — 交错入场 opacity + translateY
// ================================================================
const getStaggerEntrance = (
  frame: number,
  fps: number,
  index: number,
  delay = 0,
) => {
  const entryDelay = delay + index * STAGGER_FRAMES;
  const progress = spring({
    frame: frame - entryDelay,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.8 },
  });
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 20}px)`,
  };
};

// ================================================================
// 类型定义
// ================================================================

// -- DataTable --
interface StatusDot {
  color: string;
  label: string;
}

interface TableRow {
  cells: (string | StatusDot)[];
}

interface DataTableProps {
  columns: string[];
  rows: TableRow[];
  highlightRow?: number;
  delay?: number;
}

// -- KanbanBoard --
interface KanbanCard {
  title: string;
  tag?: string;
  tagColor?: string;
}

interface KanbanColumn {
  title: string;
  color: string;
  cards: KanbanCard[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  delay?: number;
}

// -- TerminalWindow --
interface TerminalLine {
  text: string;
  color?: string;
  prefix?: string;
}

interface TerminalWindowProps {
  lines: TerminalLine[];
  typingSpeed?: number;
  delay?: number;
}

// -- AnalyticsDashboard --
interface SparklinePoint {
  value: number;
}

interface Metric {
  icon: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend: number;
  sparkline?: SparklinePoint[];
}

interface AnalyticsDashboardProps {
  metrics: Metric[];
  delay?: number;
}

// -- BrowserFrame --
interface BrowserFrameProps {
  url: string;
  children: React.ReactNode;
  delay?: number;
}

// ================================================================
// macOS 窗口控制点 (红/黄/绿)
// ================================================================
const WindowDots: React.FC = () => (
  <div style={{ display: "flex", gap: 8 }}>
    {["#FF5F57", "#FFBD2E", "#28C840"].map((c) => (
      <div
        key={c}
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          background: c,
        }}
      />
    ))}
  </div>
);

// ================================================================
// DataTable — 带状态点、交替行背景、交错入场
// ================================================================
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  highlightRow,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isStatusDot = (cell: string | StatusDot): cell is StatusDot =>
    typeof cell === "object" && "color" in cell;

  return (
    <div
      style={{
        background: theme.color.panel,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.color.border}`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* 表头 */}
      <div
        style={{
          display: "flex",
          padding: "20px 28px",
          borderBottom: `1px solid ${theme.color.border}`,
          background: theme.color.surface,
        }}
      >
        {columns.map((col) => (
          <div
            key={col}
            style={{
              flex: 1,
              fontSize: 28,
              fontWeight: 600,
              fontFamily: theme.font.body,
              color: theme.color.textMuted,
              letterSpacing: "0.02em",
            }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* 行 */}
      {rows.map((row, rowIdx) => {
        const style = getStaggerEntrance(frame, fps, rowIdx, delay);
        const isHighlighted = highlightRow === rowIdx;

        return (
          <div
            key={rowIdx}
            style={{
              ...style,
              display: "flex",
              padding: "18px 28px",
              background: isHighlighted
                ? `${theme.color.primary}10`
                : rowIdx % 2 === 0
                  ? "transparent"
                  : `rgba(255,255,255,0.02)`,
              borderLeft: isHighlighted
                ? `3px solid ${theme.color.primary}`
                : "3px solid transparent",
              borderBottom: `1px solid ${theme.color.border}`,
            }}
          >
            {row.cells.map((cell, cellIdx) => (
              <div
                key={cellIdx}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 28,
                  fontFamily: theme.font.body,
                  color: theme.color.textBody,
                }}
              >
                {isStatusDot(cell) ? (
                  <>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        background: cell.color,
                        flexShrink: 0,
                      }}
                    />
                    {cell.label}
                  </>
                ) : (
                  cell
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ================================================================
// KanbanBoard — 3 列看板, 卡片交错入场
// ================================================================
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 20, width: "100%" }}>
      {columns.map((col, colIdx) => {
        const colStyle = getStaggerEntrance(frame, fps, colIdx, delay);

        return (
          <div
            key={col.title}
            style={{
              ...colStyle,
              flex: 1,
              background: theme.color.panel,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.color.border}`,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* 列标题 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingBottom: 12,
                borderBottom: `1px solid ${theme.color.border}`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: col.color,
                }}
              />
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  fontFamily: theme.font.body,
                  color: theme.color.text,
                }}
              >
                {col.title}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontFamily: theme.font.body,
                  color: theme.color.textMuted,
                  marginLeft: "auto",
                }}
              >
                {col.cards.length}
              </span>
            </div>

            {/* 卡片 */}
            {col.cards.map((card, cardIdx) => {
              const cardStyle = getStaggerEntrance(
                frame,
                fps,
                cardIdx,
                delay + colIdx * 6 + 8,
              );

              return (
                <div
                  key={cardIdx}
                  style={{
                    ...cardStyle,
                    background: theme.color.card,
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.color.border}`,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontFamily: theme.font.body,
                      color: theme.color.textBody,
                    }}
                  >
                    {card.title}
                  </span>
                  {card.tag && (
                    <span
                      style={{
                        fontSize: 28,
                        fontFamily: theme.font.body,
                        color: card.tagColor || theme.color.textMuted,
                        background: `${card.tagColor || theme.color.textMuted}15`,
                        padding: "4px 12px",
                        borderRadius: theme.radius.sm,
                        alignSelf: "flex-start",
                      }}
                    >
                      {card.tag}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ================================================================
// TerminalWindow — macOS 终端, 逐行打字, 闪烁光标
// ================================================================
export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  lines,
  typingSpeed = 1.5,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - delay);

  // 计算每行需要的总帧数, 累加得到每行开始帧
  const lineStartFrames: number[] = [];
  let accumFrames = 0;
  for (const line of lines) {
    lineStartFrames.push(accumFrames);
    accumFrames += Math.ceil(line.text.length / typingSpeed) + 8;
  }

  return (
    <div
      style={{
        background: "#0D0D0D",
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.color.border}`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* macOS 标题栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          background: "rgba(255,255,255,0.04)",
          borderBottom: `1px solid ${theme.color.border}`,
        }}
      >
        <WindowDots />
        <span
          style={{
            fontSize: 28,
            fontFamily: theme.font.mono,
            color: theme.color.textMuted,
            marginLeft: 8,
          }}
        >
          Terminal
        </span>
      </div>

      {/* 终端内容 */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 6 }}>
        {lines.map((line, i) => {
          const lineElapsed = elapsed - lineStartFrames[i];
          if (lineElapsed < 0) return null;

          const charCount = Math.min(
            Math.floor(lineElapsed * typingSpeed),
            line.text.length,
          );
          const isTyping = charCount < line.text.length;
          const showCursor = isTyping && frame % 16 < 10;
          const prefix = line.prefix ?? "$";
          const textColor = line.color || "#28C840";

          return (
            <div
              key={i}
              style={{
                fontSize: 28,
                fontFamily: theme.font.mono,
                lineHeight: 1.6,
                display: "flex",
              }}
            >
              {prefix && (
                <span style={{ color: "#28C840", marginRight: 12, flexShrink: 0 }}>
                  {prefix}
                </span>
              )}
              <span>
                {line.text.split("").map((char, ci) => (
                  <span
                    key={ci}
                    style={{ color: ci < charCount ? textColor : "transparent" }}
                  >
                    {char}
                  </span>
                ))}
                {showCursor && (
                  <span style={{ color: "#28C840", opacity: 0.8 }}>|</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ================================================================
// 迷你 Sparkline SVG
// ================================================================
const Sparkline: React.FC<{
  points: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
}> = ({ points, color, width = 120, height = 40 }) => {
  if (points.length < 2) return null;

  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const range = max - min || 1;

  const pathPoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p.value - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });

  const d = `M ${pathPoints.join(" L ")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
};

// ================================================================
// AnalyticsDashboard — 2x2 指标卡片 (图标+数字+趋势+sparkline)
// ================================================================
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  metrics,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        width: "100%",
      }}
    >
      {metrics.slice(0, 4).map((metric, idx) => {
        const cardStyle = getStaggerEntrance(frame, fps, idx, delay);
        const entryDelay = delay + idx * STAGGER_FRAMES;

        // 数字计数动画
        const numProgress = interpolate(
          frame - entryDelay - 6,
          [0, 40],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) },
        );
        const displayValue = metric.value * numProgress;
        const trendPositive = metric.trend >= 0;
        const trendColor = trendPositive ? "#28C840" : "#FF5F57";

        return (
          <div
            key={idx}
            style={{
              ...cardStyle,
              background: theme.color.panel,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.color.border}`,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* 顶部: 图标 + 标签 */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32 }}>{metric.icon}</span>
              <span
                style={{
                  fontSize: 28,
                  fontFamily: theme.font.body,
                  color: theme.color.textMuted,
                }}
              >
                {metric.label}
              </span>
            </div>

            {/* 中部: 大数字 + 趋势箭头 */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 600,
                  fontFamily: theme.font.heading,
                  color: theme.color.text,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {metric.prefix || ""}
                {displayValue
                  .toFixed(0)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                {metric.suffix || ""}
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontFamily: theme.font.body,
                  color: trendColor,
                }}
              >
                {trendPositive ? "\u2191" : "\u2193"} {Math.abs(metric.trend)}%
              </span>
            </div>

            {/* 底部: sparkline */}
            {metric.sparkline && (
              <Sparkline points={metric.sparkline} color={trendColor} width={200} height={36} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ================================================================
// BrowserFrame — macOS 浏览器外壳 (控制点 + 地址栏)
// ================================================================
export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  url,
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 80, mass: 0.8 },
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${0.96 + progress * 0.04})`,
        background: theme.color.panel,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.color.border}`,
        overflow: "hidden",
        width: "100%",
        boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
      }}
    >
      {/* Chrome 标题栏 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 20px",
          background: theme.color.surface,
          borderBottom: `1px solid ${theme.color.border}`,
        }}
      >
        <WindowDots />

        {/* 地址栏 */}
        <div
          style={{
            flex: 1,
            background: theme.color.bg,
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.color.border}`,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* 锁图标 */}
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ marginRight: 8, flexShrink: 0 }}>
            <path
              d="M4 7V5a4 4 0 118 0v2h1a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h1zm2-2a2 2 0 114 0v2H6V5z"
              fill={theme.color.textMuted}
            />
          </svg>
          <span
            style={{
              fontSize: 28,
              fontFamily: theme.font.body,
              color: theme.color.textMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {url}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div>{children}</div>
    </div>
  );
};
