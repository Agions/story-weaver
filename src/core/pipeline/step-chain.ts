/**
 * Backward-compat shim — re-exports from the new split files.
 *
 * Original step-chain.ts was 355 lines (close to the 400-line threshold).
 * Phase 4 splits it into:
 *   - step-chain.types.ts         (纯类型, 85 行)
 *   - step-chain.types-helpers.ts (构造器配置, 35 行)
 *   - async-step-chain.ts         (执行器类, 180 行)
 *   - step-chain.builder.ts       (Builder 模式, 95 行)
 *
 * Kept so existing imports of `from './step-chain'` continue to work.
 */

export * from './step-chain.types';
export * from './async-step-chain';
export * from './step-chain.builder';
