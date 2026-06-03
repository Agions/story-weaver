/**
 * @frame-fab/core — 核心层公共 API
 *
 * 这是 frame-fab 核心领域层的 monorepo 入口。
 * 当前通过 shim 指向 src/core/ 的实现，monorepo 迁移完成后
 * 会切换为 packages/core/* 内部实现。
 *
 * 公共 API 子域：
 *   - ./pipeline    流水线引擎 + 10 步 + 责任链
 *   - ./autonomous  自主编排 + 质量门 + 自我评审
 *   - ./types       跨域共享类型
 */

export * as pipeline from './pipeline';
export * as autonomous from './autonomous';
export * as types from './types';
