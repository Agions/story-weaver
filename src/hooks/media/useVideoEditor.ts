/**
 * useVideoEditor — re-export facade
 *
 * Re-exports useVideo and its reducer from @/core/hooks.
 * No logic lives here; this file exists solely to provide a stable
 * import path under src/hooks/media/.
 */

export { useVideo } from '@/core/hooks/useVideo';
export type { UseVideoReturn } from '@/core/hooks/useVideo';

export { videoReducer, initialVideoState, createVideoSetters } from '@/core/hooks/useVideo-reducer';
export type { VideoState, VideoAction, VideoSetter } from '@/core/hooks/useVideo-reducer';
