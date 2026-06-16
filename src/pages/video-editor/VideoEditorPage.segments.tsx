/**
 * VideoEditorPage 子组件 - 片段列表相关
 */
import { Trash2, Plus } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import Empty from '@/shared/components/ui/empty';
import { Space } from '@/shared/components/ui/space';
import { Tag } from '@/shared/components/ui/tag';
import { Tooltip } from '@/shared/components/ui/tooltip';
import { Text } from '@/shared/components/ui/typography';

import styles from '../VideoEditorPage.module.less';

// ========== SegmentCard ==========

function SegmentCard({
  segment,
  index,
  isSelected,
  onSelect,
  onDelete,
  formatTime,
}: {
  segment: { start: number; end: number; content?: string };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  formatTime: (s: number, opts?: object) => string;
}) {
  return (
    <Card
      className={`${styles.segmentCard} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.segmentHeader}>
        <Text strong>片段 {index + 1}</Text>
        <Space>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            />
          </Tooltip>
        </Space>
      </div>
      <div className={styles.segmentTime}>
        <Tag color="blue">
          {formatTime(segment.start, { hours: 'always' })} -{' '}
          {formatTime(segment.end, { hours: 'always' })}
        </Tag>
        <Text type="secondary">
          时长: {formatTime(segment.end - segment.start, { hours: 'always' })}
        </Text>
      </div>
      {segment.content && (
        <div className={styles.segmentContent}>
          <Text ellipsis>{segment.content}</Text>
        </div>
      )}
    </Card>
  );
}

// ========== renderSegmentList ==========

function renderSegmentList(state: {
  segments: { start: number; end: number; content?: string }[];
  selectedSegmentIndex: number;
  videoSrc: string;
  handleSelectSegment: (index: number) => void;
  handleDeleteSegment: (index: number) => void;
  handleAddSegment: () => void;
  formatTime: (s: number, opts?: object) => string;
}) {
  const {
    segments,
    selectedSegmentIndex,
    videoSrc,
    handleSelectSegment,
    handleDeleteSegment,
    handleAddSegment,
    formatTime,
  } = state;

  return (
    <div className={styles.segmentList}>
      <h3 className={styles.sectionTitle}>片段列表</h3>
      {segments.length === 0 ? (
        <Empty description="暂无片段" image={undefined} />
      ) : (
        segments.map((segment, index) => (
          <SegmentCard
            key={index}
            segment={segment}
            index={index}
            isSelected={selectedSegmentIndex === index}
            onSelect={() => handleSelectSegment(index)}
            onDelete={() => handleDeleteSegment(index)}
            formatTime={formatTime}
          />
        ))
      )}
      <Button
        type="dashed"
        icon={<Plus />}
        block
        onClick={handleAddSegment}
        disabled={!videoSrc}
        className={styles.addSegmentButton}
      >
        添加片段
      </Button>
    </div>
  );
}

// ========== renderKeyframeList ==========

function renderKeyframeList(keyframes: string[]) {
  if (keyframes.length === 0) {
    return <Empty description="暂无关键帧" image={undefined} />;
  }
  return (
    <div className={styles.keyframeList}>
      {keyframes.map((frame, index) => (
        <div key={index} className={styles.keyframeItem}>
          <img src={frame} alt={`关键帧 ${index + 1}`} className={styles.keyframeImage} />
        </div>
      ))}
    </div>
  );
}

export { SegmentCard, renderSegmentList, renderKeyframeList };
