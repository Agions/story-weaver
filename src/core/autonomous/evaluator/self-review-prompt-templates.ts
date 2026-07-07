/**
 * Self-Review Loop Prompt 模板
 * ===========================
 * 两个大 prompt 模板 + 11 步 stepName 映射。
 * 便于单独调优 prompt 文案，不用改 SelfReviewLoop 类逻辑。
 */

/** 审核 prompt 模板（5 维度评分） */
export const REVIEW_PROMPT_TEMPLATE = `你是专业的 AI 内容质量审核员。请审核以下 AI 生成的 {stepName} 输出。

## 审核维度

1. **完整性 (completeness)**：输出是否包含所有必要字段/元素？
2. **一致性 (consistency)**：人物描写、场景描述前后是否矛盾？
3. **画面感 (visual_quality)**：描述是否具备足够的视觉细节供 AI 生图？
4. **时长匹配 (duration_match)**：对话/场景时长是否与内容体量匹配？
5. **情绪爆点 (punch_point)**：是否包含情绪爆点、转折、高潮？

## 原输出

{originalOutput}

## 审核要求

请严格按照上述 5 个维度评分（0-100分），并给出：
1. 每个维度的评分和是否通过（>=60分通过）
2. 不合格的具体原因（列出所有未通过项）
3. 修复建议

## 输出格式

请严格按以下 JSON 格式输出，不要包含任何其他内容：

{
  "passed": true/false,
  "score": 0-100,
  "dimensions": [
    {"dimension": "completeness", "score": 0-100, "passed": true/false, "detail": "说明"},
    {"dimension": "consistency", "score": 0-100, "passed": true/false, "detail": "说明"},
    {"dimension": "visual_quality", "score": 0-100, "passed": true/false, "detail": "说明"},
    {"dimension": "duration_match", "score": 0-100, "passed": true/false, "detail": "说明"},
    {"dimension": "punch_point", "score": 0-100, "passed": true/false, "detail": "说明"}
  ],
  "reasons": ["不合格原因1", "不合格原因2"],
  "suggestions": ["修复建议1", "修复建议2"]
}`;

/** 修复 prompt 模板（基于审核反馈重新生成） */
export const REPAIR_PROMPT_TEMPLATE = `你是专业的 {stepName} 内容生成专家。以下是你之前生成的 {stepName} 输出和审核反馈。

## 原输出

{originalOutput}

## 审核反馈

{reviewResult}

## 不合格原因

{fallbackReasons}

## 修复要求

请根据以上反馈，重新生成符合以下要求的 {stepName} 输出：
1. 修复所有不合格项
2. 保持与上下文的连贯性
3. 输出格式保持不变
4. 只输出修复后的内容，不要包含任何解释

## 直接输出修复后的 JSON 内容：`;

/** 步骤 ID → 中文名称映射 */
export const STEP_NAMES: Record<string, string> = {
  'step-import': '导入解析',
  'step-analysis': 'AI 分析',
  'step-script': '剧本生成',
  'step-character': '角色设计',
  'step-scene': '场景规划',
  'step-storyboard': '分镜生成',
  'step-render': '批量渲染',
  'step-video-edit': '视频剪辑',
  'step-audio': '配音合成',
  'step-subtitle': '字幕嵌入',
  'step-export': '成片导出',
};

/** 审核温度（低温 = 稳定） */
export const REVIEW_TEMPERATURE = 0.3;

/** 修复温度（较高温度 = 产生变化） */
export const REPAIR_TEMPERATURE = 0.7;

/** 审核最大 token 数 */
export const REVIEW_MAX_TOKENS = 4096;

/** 修复最大 token 数 */
export const REPAIR_MAX_TOKENS = 8192;
