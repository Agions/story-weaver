/**
 * 字节 Seedance 视频生成服务
 */

import axios from 'axios';

import type { VideoGenerationOptions, VideoGenerationResult } from '../types';
import { getAPIKey } from '../utils';

/**
 * Seedance 视频生成 (字节)
 */
export async function generateVideoWithSeedance(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 5,
    referenceImage,
    characterReferences,
    negativePrompt,
    aspectRatio = '16:9',
    signal,
  } = options;

  const apiKey = await getAPIKey('seedance');

  // 构建角色一致性参考
  // Seedance 2.0 支持通过 image_url + extra_data 传递角色 reference
  const seedanceData: Record<string, unknown> = {
    model: 'seedance-2-0-250212',
    prompt,
    negative_prompt: negativePrompt,
    duration,
    image_url: referenceImage,
    aspect_ratio: aspectRatio,
  };

  // 注入角色一致性 reference（cref/cw 模式）
  // 将角色的三视图 reference image 注入到 extra_data 中
  if (characterReferences && characterReferences.length > 0) {
    const refs = characterReferences
      .filter((c) => c.referenceImageUrls?.front)
      .map((c) => ({
        character_id: c.characterId,
        character_name: c.name,
        reference_image: c.referenceImageUrls?.front,
        reference_prompt: c.referencePrompt,
      }));

    if (refs.length > 0) {
      seedanceData.extra_data = {
        character_references: refs,
      };
    }
  }

  const response = await axios({
    method: 'post',
    url: 'https://ark.cn-beijing.volces.com/api/v3/video/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: seedanceData,
    signal,
  });

  const videoData = response.data?.data?.[0];

  return {
    url: videoData?.url ?? '',
    coverUrl: videoData?.cover_image_url,
    duration,
    width: videoData?.width ?? 1920,
    height: videoData?.height ?? 1080,
    model: 'seedance-2.0',
    taskId: videoData?.task_id,
    status: 'processing',
  };
}
