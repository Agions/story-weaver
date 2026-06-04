/**
 * @frame-fab/common — 公共库统一导出
 *
 * Phase 2-B (2026-06-04): 收缩至仅 constants 子目录。
 *
 * 历史包袱：原设计期望 packages/common 是可独立发布的 npm 包
 * (含 utils/formatters/motion/hooks/components/domain/validation)。
 * 实际项目内全部 0 引用，未形成 monorepo 复用。
 * 见 docs/adr/0002-frontend-monorepo-ddd.md 原始设计意图。
 *
 * 现仅保留 constants 子目录（4 处真实引用）。
 * 未来若需要重提 monorepo 拆分，可基于 src/shared/* 现有实现重新组织。
 */

export * from './constants';
