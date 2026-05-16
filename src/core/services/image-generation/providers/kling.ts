/**
 * 快手可灵服务
 */

import axios from 'axios';

import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
} from '../types';
import { getAPIKey, mapKlingSize } from '../utils';

/**
 * 快手可灵图像生成
 */
export async function generateWithKling(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const { size = '2K', numImages = 1, negativePrompt, signal } = options;

  const apiKey = await getAPIKey('kling');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://api.klingai.com/v1/images/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: 'kling-v1-6',
      prompt,
      image_count: numImages,
      negative_prompt: negativePrompt,
      size: mapKlingSize(size),
    },
    signal,
  });

  const imageData = response.data?.images?.[0];

  return {
    url: imageData?.url ?? '',
    width: imageData?.width ?? 1024,
    height: imageData?.height ?? 1024,
    model: 'kling-1.6',
    processingTime: Date.now() - startTime,
  };
}

/**
 * 快手可灵视频生成
 */
export async function generateVideoWithKling(
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

  const apiKey = await getAPIKey('kling');

  // 构建角色一致性引用（Kling API: subject_reference）
  const subjectRef = characterReferences
    ?.map((ref) => ({
      id: ref.characterId,
      image_url: ref.referenceImageUrls?.front || ref.referenceImageUrls?.fullBody || '',
    }))
    .filter((r) => r.image_url);

  const response = await axios({
    method: 'post',
    url: 'https://api.klingai.com/v1/videos/generations',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    data: {
      model: 'kling-v1-6',
      prompt,
      negative_prompt: negativePrompt,
      duration,
      image_url: referenceImage,
      aspect_ratio: aspectRatio,
      ...(subjectRef && subjectRef.length > 0 ? { subject_reference: subjectRef } : {}),
    },
    signal,
  });

  const videoData = response.data;

  return {
    url: videoData?.url ?? '',
    coverUrl: videoData?.cover_url,
    duration,
    width: videoData?.width ?? 1920,
    height: videoData?.height ?? 1080,
    model: 'kling-1.6',
    taskId: videoData?.task_id,
    status: 'processing',
  };
}
