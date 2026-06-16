/**
 * Novel Service AI 调用与 JSON 解析共享层
 *
 * 原 novel.service.ts 中 3 处重复模式：
 *   1. aiService.generate(prompt, { provider, model })
 *   2. JSON.parse(aiResponse)
 *   3. catch → throw new Error('XXX失败：AI 返回格式错误')
 *
 * 全部抽到 callAiAndParseJson() 一个工具函数里，新增 prompt 模板
 * 时直接复用，失败文案由 caller 自定义（保留原代码精确一致的
 * "小说解析失败：AI 返回格式错误" / "场景转换失败：AI 返回格式错误"
 * / "分镜生成失败：AI 返回格式错误" 三种 message）。
 */

import { aiService } from '@/core/services/ai/text/ai.service';

/**
 * 调用 AI 并解析 JSON 响应。
 *
 * @param prompt          完整的 prompt 字符串
 * @param options         {provider, model} 配置
 * @param failureMessage  JSON.parse 失败时抛出的错误文案
 *                        （保留原代码 3 处精确文案）
 * @returns               解析后的 JSON 对象（泛型 T 由 caller 自行断言）
 */
export async function callAiAndParseJson<T = unknown>(
  prompt: string,
  options: { provider?: string; model?: string },
  failureMessage: string
): Promise<T> {
  const { provider = 'alibaba', model = 'qwen-3.5' } = options;
  const aiResponse = await aiService.generate(prompt, { provider, model });

  try {
    return JSON.parse(aiResponse) as T;
  } catch {
    throw new Error(failureMessage);
  }
}
