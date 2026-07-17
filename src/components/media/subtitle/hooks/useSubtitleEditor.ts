/**
 * 字幕编辑器 Hook - 状态管理与业务逻辑
 */
import { useCallback, useMemo, useState } from 'react';

import type { SubtitleItem, SubtitleStyle, SubtitleEditorProps } from '../types/subtitle-entities';
import { DEFAULT_SUBTITLE_STYLE as DEFAULT_STYLE } from '../types/subtitle-entities';

/**
 * 字幕编辑器状态 Hook
 * 包含所有业务逻辑，与 UI 完全解耦
 */
export function useSubtitleEditor({
  subtitles,
  onChange,
  currentTime = 0,
  videoWidth: _videoWidth = 1920,
  videoHeight: _videoHeight = 1080,
}: Pick<
  SubtitleEditorProps,
  'subtitles' | 'onChange' | 'currentTime' | 'videoWidth' | 'videoHeight'
>) {
  // 选中状态
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [previewStyle, setPreviewStyle] = useState<SubtitleStyle>(DEFAULT_STYLE);

  // 选中字幕
  const selectedSubtitle = useMemo(
    () => subtitles.find((s) => s.id === selectedId) ?? null,
    [subtitles, selectedId]
  );

  // 当前播放时间对应的高亮字幕
  const activeSubtitle = useMemo(
    () => subtitles.find((s) => currentTime >= s.startTime && currentTime <= s.endTime) ?? null,
    [subtitles, currentTime]
  );

  // 更新单条字幕
  const updateSubtitle = useCallback(
    (id: string, updates: Partial<SubtitleItem>) => {
      const newSubtitles = subtitles.map((s) => (s.id === id ? { ...s, ...updates } : s));
      onChange(newSubtitles);
    },
    [subtitles, onChange]
  );

  // 更新字幕样式
  const updateStyle = useCallback(
    (updates: Partial<SubtitleStyle>) => {
      if (!selectedId) return;
      const newStyle = { ...previewStyle, ...updates };
      setPreviewStyle(newStyle);

      const newSubtitles = subtitles.map((s) =>
        s.id === selectedId ? { ...s, style: newStyle } : s
      );
      onChange(newSubtitles);
    },
    [selectedId, previewStyle, subtitles, onChange]
  );

  // 添加新字幕
  const addSubtitle = useCallback(() => {
    const newSubtitle: SubtitleItem = {
      id: `subtitle-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 3,
      text: '新字幕',
      style: { ...DEFAULT_STYLE },
    };
    onChange([...subtitles, newSubtitle]);
    setSelectedId(newSubtitle.id);
    setEditingText(newSubtitle.text);
    setPreviewStyle(newSubtitle.style || DEFAULT_STYLE);
  }, [currentTime, subtitles, onChange]);

  // 删除字幕
  const deleteSubtitle = useCallback(
    (id: string) => {
      const newSubtitles = subtitles.filter((s) => s.id !== id);
      onChange(newSubtitles);
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [subtitles, onChange, selectedId]
  );

  // 复制字幕
  const duplicateSubtitle = useCallback(
    (subtitle: SubtitleItem) => {
      const newSubtitle: SubtitleItem = {
        ...subtitle,
        id: `subtitle-${Date.now()}`,
        startTime: subtitle.endTime,
        endTime: subtitle.endTime + (subtitle.endTime - subtitle.startTime),
      };
      const index = subtitles.findIndex((s) => s.id === subtitle.id);
      const newSubtitles = [
        ...subtitles.slice(0, index + 1),
        newSubtitle,
        ...subtitles.slice(index + 1),
      ];
      onChange(newSubtitles);
      setSelectedId(newSubtitle.id);
    },
    [subtitles, onChange]
  );

  // 选择字幕
  const selectSubtitle = useCallback((subtitle: SubtitleItem) => {
    setSelectedId(subtitle.id);
    setEditingText(subtitle.text);
    setPreviewStyle(subtitle.style || DEFAULT_STYLE);
  }, []);

  // 计算预览字幕的位置 CSS
  const previewPositionCSS = useMemo(() => {
    const style = selectedSubtitle?.style || previewStyle;
    const positionY =
      style.position === 'top' ? '10%' : style.position === 'middle' ? '50%' : '90%';
    return {
      positionY,
      textAlign: style.alignment,
    };
  }, [selectedSubtitle, previewStyle]);

  // 字幕时长计算
  const getSubtitleDuration = useCallback((subtitle: SubtitleItem) => {
    return subtitle.endTime - subtitle.startTime;
  }, []);

  return {
    // 状态
    selectedId,
    editingText,
    previewStyle,
    selectedSubtitle,
    activeSubtitle,
    previewPositionCSS,

    // 操作
    updateSubtitle,
    updateStyle,
    addSubtitle,
    deleteSubtitle,
    duplicateSubtitle,
    selectSubtitle,
    setSelectedId,
    setEditingText,

    // 计算属性
    getSubtitleDuration,
  };
}
