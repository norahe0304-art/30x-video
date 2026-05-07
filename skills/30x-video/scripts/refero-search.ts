/**
 * [INPUT]: Query string, optional filters (platform, limit)
 * [OUTPUT]: Refero screens via MCP
 * [POS]: scripts/ Refero MCP 包装层; 所有 Refero 调用入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 SKILL.md
 */

// ================================================================
//  Refero MCP wrapper
//
//  Two execution modes:
//  1. Agent mode: Claude Code's MCP runtime calls refero_* tools.
//     Agent should call these tools directly using its tool-use API.
//     Functions here serve as interface documentation.
//  2. CLI / standalone mode: HTTP fetch to Refero MCP endpoint with
//     Bearer token from REFERO_API_TOKEN env var.
// ================================================================

import type { ReferoScreen, ReferoScreenDetail } from "./types.ts";

const REFERO_MCP_URL = process.env.REFERO_MCP_URL ?? "https://api.refero.design/mcp";
const REFERO_TOKEN = process.env.REFERO_API_TOKEN;

interface SearchScreensParams {
  query: string;
  platform?: "web" | "ios" | "all";
  limit?: number;
  offset?: number;
}

interface GetScreenParams {
  screen_id?: number;
  screen_ids?: number[];
  image_size?: "none" | "thumbnail" | "full";
  include_similar?: boolean;
  similar_limit?: number;
}

interface SearchResponse {
  pagination: { total_count: number; next_offset: number };
  records: ReferoScreen[];
}

// ----------------------------------------------------------------
//  Public API
// ----------------------------------------------------------------

/**
 * Search screens by semantic query.
 * Maps to Refero MCP tool: refero_search_screens
 */
export async function searchScreens(
  params: SearchScreensParams
): Promise<SearchResponse> {
  return mcpCall("refero_search_screens", {
    query: params.query,
    platform: params.platform ?? "all",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

/**
 * Get full screen details (single or batch) optionally with image data.
 * Maps to Refero MCP tool: refero_get_screen
 */
export async function getScreen(
  params: GetScreenParams
): Promise<ReferoScreenDetail | ReferoScreenDetail[]> {
  const body: Record<string, unknown> = {
    image_size: params.image_size ?? "none",
    include_similar: params.include_similar ?? true,
    similar_limit: params.similar_limit ?? 4,
  };
  if (params.screen_id !== undefined) body.screen_id = params.screen_id;
  if (params.screen_ids !== undefined) body.screen_ids = params.screen_ids;
  return mcpCall("refero_get_screen", body);
}

// ----------------------------------------------------------------
//  Helper: aggregate screens by site_name to find top brand matches
// ----------------------------------------------------------------

export interface BrandHit {
  brand: string;
  hitCount: number;
  topCategory: string;
  sampleFonts: string[];
  sampleScreenIds: number[];
}

export function aggregateByBrand(screens: ReferoScreen[]): BrandHit[] {
  const map = new Map<string, BrandHit>();
  for (const screen of screens) {
    const existing = map.get(screen.site_name);
    if (existing) {
      existing.hitCount += 1;
      existing.sampleScreenIds.push(screen.screen_id);
      for (const font of screen.fonts) {
        if (!existing.sampleFonts.includes(font)) existing.sampleFonts.push(font);
      }
    } else {
      map.set(screen.site_name, {
        brand: screen.site_name,
        hitCount: 1,
        topCategory: screen.site_categories[0] ?? "uncategorized",
        sampleFonts: [...screen.fonts],
        sampleScreenIds: [screen.screen_id],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.hitCount - a.hitCount);
}

// ----------------------------------------------------------------
//  Internal: HTTP MCP call (CLI mode only)
// ----------------------------------------------------------------

async function mcpCall<T>(tool: string, params: unknown): Promise<T> {
  if (!REFERO_TOKEN) {
    throw new Error(
      `REFERO_API_TOKEN not set. Either: (1) run inside Claude Code where ` +
        `Refero MCP is configured, or (2) export REFERO_API_TOKEN before CLI use.`
    );
  }
  const response = await fetch(REFERO_MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${REFERO_TOKEN}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: tool, arguments: params },
    }),
  });
  if (!response.ok) {
    throw new Error(`Refero MCP ${tool} failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { result?: { content?: Array<{ text?: string }> }; error?: unknown };
  if (data.error) throw new Error(`Refero MCP error: ${JSON.stringify(data.error)}`);
  const content = data.result?.content?.[0]?.text;
  if (!content) throw new Error(`Refero MCP returned no content`);
  return JSON.parse(content) as T;
}
