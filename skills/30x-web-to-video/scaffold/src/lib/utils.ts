/**
 * [INPUT]: clsx, tailwind-merge
 * [OUTPUT]: cn() 工具函数
 * [POS]: 样式工具, 被所有组件消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
