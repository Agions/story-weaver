/**
 * video.slice.ts — 视频操作切片
 */

import type { VideoInfo } from '@/shared/types';

type SetState = (...args: any[]) => void;
type GetState = () => any;

export function createVideoSlice(set: SetState, _get: GetState) {
  return {
    addVideo: (projectId: string, video: VideoInfo) => {
      set((s: any) => ({
        projects: s.projects.map((p: any) =>
          p.id === projectId ? { ...p, videos: [...(p.videos ?? []), video] } : p
        ),
      }));
    },

    removeVideo: (projectId: string, videoId: string) => {
      set((s: any) => ({
        projects: s.projects.map((p: any) =>
          p.id === projectId
            ? { ...p, videos: (p.videos ?? []).filter((v: VideoInfo) => v.id !== videoId) }
            : p
        ),
      }));
    },
  };
}
