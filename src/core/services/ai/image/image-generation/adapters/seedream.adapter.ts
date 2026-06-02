/**
 * Seedream Adapter — implements AIImageAdapter
 *
 * Usage:
 *   import { SeedreamAdapter } from './adapters/seedream.adapter';
 *   import { imageGenRegistry } from '../adapter';
 *   imageGenRegistry.register(new SeedreamAdapter());
 */

import axios from 'axios';

import type {
  AIImageAdapter,
  ImageGenRequest,
  ImageGenResponse,
  VideoGenRequest,
  VideoGenResponse,
  ImageModelId,
  VideoModelId,
} from '../adapter';
import { getAPIKey, parseSize } from '../utils';

// ========== SeedreamAdapter ==========

export class SeedreamAdapter implements AIImageAdapter {
  readonly modelId: ImageModelId = 'seedream-5.0';
  readonly displayName = 'ByteDance Seedream 4.0';

  async generateImage(req: ImageGenRequest): Promise<ImageGenResponse> {
    const {
      prompt,
      size = '2K',
      numImages = 1,
      negativePrompt,
      quality = 'standard',
      signal,
    } = req;

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
    const { width, height } = parseSize(size);

    return {
      url: imageData?.url ?? '',
      width,
      height,
      model: this.modelId,
      processingTime: Date.now() - startTime,
    };
  }

  /** Seedream does not support video generation */
  generateVideo?(): Promise<VideoGenResponse> {
    throw new Error(`[SeedreamAdapter] Video generation is not supported`);
  }

  /** Seedream does not support async status polling */
  getVideoStatus?(): Promise<VideoGenResponse> {
    throw new Error(`[SeedreamAdapter] Status polling is not supported`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const apiKey = await getAPIKey('seedream');
      if (!apiKey) return false;

      await axios.head('https://ark.cn-beijing.volces.com/api/v3/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 3000,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// Auto-register on module load
import { imageGenRegistry } from '../adapter';
imageGenRegistry.register(new SeedreamAdapter());
