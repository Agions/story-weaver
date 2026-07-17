/**
 * 视觉一致性评分服务 - Visual Consistency Scorer（facade）
 *
 * 历史背景：本文件原为 329 行单类，承担类型定义 / VLM 评分 / 启发式评分 /
 * 关键词提取 / 评分聚合 / 评价文案 6 类职责。第 19 轮重构拆为 5 个子模块
 * （types / keywords / heuristic / vlm / aggregator），本 facade 保留所有对外
 * 公开 API 签名（visualConsistencyScorer 单例 + VisualConsistencyScorer 类
 * + setProvider / evaluate）以保证 1 个外部调用方零改动。
 *
 * 拆分思路：
 * 1. 类型 / 阈值 / 兜底分集中在 types（含 pickScoreNotes 字典查，消除 2 处三档 if-else 重复）
 * 2. 关键词提取剥离到 keywords（5 个正则 + density 公式）
 * 3. 启发式评分剥离到 heuristic
 * 4. VLM 评分剥离到 vlm（prompt 模板 + response 解析 + 单帧比对 + 主入口）
 * 5. 聚合剥离到 aggregator（overallScore 计算）
 * 6. 类主流程只剩"编排"——evaluate 路由 VLM / heuristic + 维护 provider 状态
 */

import type { AIProvider } from '@/core/ai/providers/ai-provider-interface';

import { evaluateWithHeuristic } from './visual-consistency-heuristic';
import { evaluateWithVLM } from './visual-consistency-vlm';
import {
  DEFAULT_VLM_MODEL,
  createEmptyResult,
  type VisualConsistencyInput,
  type VisualConsistencyResult,
} from './visual-consistency-types';

// 重导出公共类型，保持 `@/core/services/video/visual-consistency-scorer-service` 一站式导入
export type {
  VisualConsistencyInput,
  VisualConsistencyResult,
  CharacterConsistencyScore,
} from './visual-consistency-types';

/**
 * 视觉一致性评分器
 *
 * 内部维护：
 *   - provider: VLM 提供方（可空）
 *   - model: 当前 VLM 模型名
 */
export class VisualConsistencyScorer {
  private provider: AIProvider | null = null;
  private model: string;

  constructor(provider?: AIProvider, model: string = DEFAULT_VLM_MODEL) {
    this.provider = provider ?? null;
    this.model = model;
  }

  /** 设置 AI Provider（用于 VLM 调用） */
  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  /**
   * 评估视觉一致性
   *
   * 策略路由（与原 evaluate 字节级一致）：
   *   - 空输入（无帧或无角色）→ 返回空结果
   *   - 有 provider → evaluateWithVLM
   *   - 无 provider → evaluateWithHeuristic
   */
  async evaluate(input: VisualConsistencyInput): Promise<VisualConsistencyResult> {
    const { frameUrls, characterReferences } = input;

    if (frameUrls.length === 0 || characterReferences.length === 0) {
      return createEmptyResult();
    }

    if (this.provider) {
      return evaluateWithVLM(this.provider, this.model, input);
    }
    return evaluateWithHeuristic(input);
  }
}

// 单例导出
export const visualConsistencyScorer = new VisualConsistencyScorer();
export default visualConsistencyScorer;
