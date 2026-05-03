/**
 * @core/types - Backward compatibility re-export from shared/types
 * @deprecated Use @shared/types instead
 */
export * from '@/shared/types';

// Legacy type alias
export type { Script as ScriptData } from '@/shared/types';

// ========== Additional types used by hooks/stores (not in shared/types yet) ==========
// These supplement shared/types exports

export type TaskStatus = {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
};
