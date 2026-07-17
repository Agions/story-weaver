import { create } from 'zustand';

import type {
  FrameComment,
  StoryboardVersion,
  VersionDiffSummary,
} from '@/core/services/domain/collaboration-service';
import type { StoryboardFrame } from '@/shared/types';

export interface StoryboardState {
  frames: StoryboardFrame[];
  selectedFrame: StoryboardFrame | null;
  comments: FrameComment[];
  versions: StoryboardVersion[];
  compareLeftVersionId?: string;
  compareRightVersionId?: string;
  versionDiff: VersionDiffSummary | null;
  setFrames: (f: StoryboardFrame[] | ((p: StoryboardFrame[]) => StoryboardFrame[])) => void;
  selectFrame: (f: StoryboardFrame | null) => void;
  setComments: (c: FrameComment[]) => void;
  setVersions: (v: StoryboardVersion[]) => void;
  setCompareLeft: (id: string | undefined) => void;
  setCompareRight: (id: string | undefined) => void;
  setVersionDiff: (d: VersionDiffSummary | null) => void;
}

export const useStoryboardStore = create<StoryboardState>((set) => ({
  frames: [],
  selectedFrame: null,
  comments: [],
  versions: [],
  compareLeftVersionId: undefined,
  compareRightVersionId: undefined,
  versionDiff: null,
  setFrames: (f) => set((s) => ({ frames: typeof f === 'function' ? f(s.frames) : f })),
  selectFrame: (f) => set({ selectedFrame: f }),
  setComments: (c) => set({ comments: c }),
  setVersions: (v) => set({ versions: v }),
  setCompareLeft: (id) => set({ compareLeftVersionId: id }),
  setCompareRight: (id) => set({ compareRightVersionId: id }),
  setVersionDiff: (d) => set({ versionDiff: d }),
}));

export const useStoryboard = useStoryboardStore;
