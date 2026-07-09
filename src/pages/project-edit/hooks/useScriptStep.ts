import { useState } from 'react';

import type { VideoSegment } from '@/shared/types/script';

export interface UseScriptStepResult {
  scriptText: string;
  setScriptText: (text: string) => void;
  /** 将脚本片段序列化为纯文本并更新 scriptText */
  saveScriptFromSegments: (segments: VideoSegment[]) => void;
}

/**
 * 管理剧本步骤的文本状态。
 * 将剧本片段序列化逻辑从 ProjectEditPage 中提取。
 */
export function useScriptStep(): UseScriptStepResult {
  const [scriptText, setScriptText] = useState<string>('');

  const saveScriptFromSegments = (segments: VideoSegment[]) => {
    const text = segments
      .map((seg) => seg.content || '')
      .filter(Boolean)
      .join('\n');
    setScriptText(text);
  };

  return {
    scriptText,
    setScriptText,
    saveScriptFromSegments,
  };
}
