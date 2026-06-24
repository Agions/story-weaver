import { Trash2 } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

import type { StoryboardFrame } from './StoryboardEditor';
import styles from './StoryboardEditor.module.less';

interface VirtualizedFrameListProps {
  frames: StoryboardFrame[];
  selectedFrameId: string | null;
  onFrameSelect: (id: string) => void;
  onFrameRemove: (id: string) => void;
}

// 帧列表中的固定高度项目尺寸
const FRAME_ITEM_HEIGHT = 72;

export function VirtualizedFrameList({
  frames,
  selectedFrameId,
  onFrameSelect,
  onFrameRemove,
}: VirtualizedFrameListProps) {
  // 渲染单个分镜项
  const renderFrameItem = (index: number, frame: StoryboardFrame) => {
    const isSelected = frame.id === selectedFrameId;

    return (
      <Card
        key={frame.id}
        className={`${styles.frameItem} ${isSelected ? styles.selected : ''}`}
        onClick={() => onFrameSelect(frame.id)}
        size="small"
        style={{ marginBottom: 8 }}
      >
        <div className={styles.frameItemContent}>
          <div className={styles.frameNumber}>{index + 1}</div>
          <div className={styles.frameInfo}>
            <div className={styles.frameTitle}>{frame.title}</div>
            <div className={styles.frameDuration}>
              {frame.duration}秒 | {frame.cameraType}
            </div>
          </div>
          <div className={styles.frameActions}>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onFrameRemove(frame.id);
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // 渲染空状态
  if (frames.length === 0) {
    return (
      <div className={styles.emptyList}>
        <span style={{ fontSize: 48 }}>📷</span>
        <div className={styles.emptyText}>暂无分镜，点击下方按钮添加</div>
      </div>
    );
  }

  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={frames.length}
      itemContent={(index) => renderFrameItem(index, frames[index])}
      overscan={5}
      fixedItemHeight={FRAME_ITEM_HEIGHT}
    />
  );
}

export default VirtualizedFrameList;
