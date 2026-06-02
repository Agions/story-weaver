/**
 * 生数 Vidu 服务
 */

import axios from 'axios';

import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
} from '../types';
import { getAPIKey, mapViduSize } from '../utils';

/**
 * Vidu 图像生成
 */
export async function generateWithVidu(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const { size = '2K', numImages = 1, negativePrompt, signal } = options;

  const apiKey = await getAPIKey('vidu');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://api.vidu.cn/v1/images/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: 'vidu-2-0',
      prompt,
      num_images: numImages,
      negative_prompt: negativePrompt,
      size: mapViduSize(size),
    },
    signal,
  });

  const imageData = response.data?.data?.[0];

  return {
    url: imageData?.url ?? '',
    width: imageData?.width ?? 1024,
    height: imageData?.height ?? 1024,
    model: 'vidu-2.0',
    processingTime: Date.now() - startTime,
  };
}

/**
 * Vidu 视频生成
 */
export async function generateVideoWithVidu(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 5,
    referenceImage,
    negativePrompt,
    aspectRatio = '16:9',
    characterReferences,
    signal,
  } = options;

  const apiKey = await getAPIKey('vidu');

  // 构建角色一致性引用（Vidu API: character_reference）
  const charRef = characterReferences
    ?.map((ref) => ({
      id: ref.characterId,
      image_url: ref.referenceImageUrls?.front || ref.referenceImageUrls?.fullBody || '',
    }))
    .filter((r) => r.image_url);

  const response = await axios({
    method: 'post',
    url: 'https://api.vidu.cn/v1/videos/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: 'vidu-2-0',
      prompt,
      negative_prompt: negativePrompt,
      duration,
      first_frame_image: referenceImage,
      aspect_ratio: aspectRatio,
      ...(charRef && charRef.length > 0 ? { character_reference: charRef } : {}),
    },
    signal,
  });

  const videoData = response.data;

  return {
    url: videoData?.url ?? '',
    coverUrl: videoData?.cover_image_url,
    duration,
    width: videoData?.width ?? 1920,
    height: videoData?.height ?? 1080,
    model: 'vidu-2.0',
    taskId: videoData?.task_id,
    status: 'processing',
  };
}
