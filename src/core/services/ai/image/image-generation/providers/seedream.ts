/**
 * 字节 Seedream 服务
 * 文档: https://www.volcengine.com/docs/6792
 */

import axios from 'axios';

import type { ImageGenerationOptions, ImageGenerationResult } from '../types';
import { getAPIKey, parseSize } from '../utils';

/**
 * 字节 Seedream 图像生成
 */
export async function generateWithSeedream(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const { size = '2K', numImages = 1, negativePrompt, quality = 'standard', signal } = options;

  const apiKey = await getAPIKey('seedream');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: 'doubao-seedream-4-0-250828',
      prompt,
      size,
      n: numImages,
      negative_prompt: negativePrompt,
      response_format: 'url',
      quality,
    },
    signal,
  });

  const imageData = response.data?.data?.[0];

  return {
    url: imageData?.url ?? '',
    width: parseSize(size).width,
    height: parseSize(size).height,
    model: 'seedream-5.0',
    processingTime: Date.now() - startTime,
  };
}
