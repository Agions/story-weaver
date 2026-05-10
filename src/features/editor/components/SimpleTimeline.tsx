import {
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Volume2,
  GripVertical,
  Video,
} from 'lucide-react';
import React, { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { formatTimeWithMs } from '@/shared/utils';

import styles from './SimpleTimeline.module.less';

interface Segment {
  id: string;
  start: number;
  end: number;
  type: 'video' | 'audio' | 'image';
  name: string;
  color?: string;
}

interface SimpleTimelineProps {
  duration: number;
  currentTime: number;
  segments: Segment[];
  selectedSegmentId?: string;
  onTimeChange?: (time: number) => void;
  onSegmentSelect?: (id: string) => void;
  onSegmentDelete?: (id: string) => void;
  onAddSegment?: () => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

const SimpleTimeline: React.FC<SimpleTimelineProps> = ({
  duration,
  currentTime,
  segments,
  selectedSegmentId,
  onTimeChange,
  onSegmentSelect,
  onSegmentDelete,
  onAddSegment,
  isPlaying = false,
  onPlayPause,
  zoom = 1,
  onZoomChange,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [localZoom, setLocalZoom] = useState(zoom);

  // 格式化时间

  // 处理时间轴点击
  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (!timelineRef.current || duration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = 'clientX' in e ? e.clientX - rect.left : rect.width / 2;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    onTimeChange?.(newTime);
  };

  // 处理缩放
  const handleZoomIn = () => {
    const newZoom = Math.min(4, localZoom * 1.5);
    setLocalZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.25, localZoom / 1.5);
    setLocalZoom(newZoom);
    onZoomChange?.(newZoom);
  };

  // 生成时间刻度
  const generateTimeMarkers = () => {
    if (duration === 0) return [];

    const markers = [];
    const interval = localZoom > 2 ? 1 : localZoom > 1 ? 5 : 10;
    const totalSeconds = Math.ceil(duration / interval) * interval;

    for (let i = 0; i <= totalSeconds; i += interval) {
      markers.push({
        time: i,
        label: formatTimeWithMs(i),
        position: (i / duration) * 100,
      });
    }

    return markers;
  };

  const timeMarkers = generateTimeMarkers();

  // 计算片段在时间轴上的位置和宽度
  const getSegmentStyle = (segment: Segment) => {
    const left = (segment.start / duration) * 100;
    const width = ((segment.end - segment.start) / duration) * 100;
    return {
      left: `${left}%`,
      width: `${width}%`,
      backgroundColor: segment.color || '#1E88E5',
    };
  };

  return (
    <div className={styles.timeline}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.leftTools}>
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              variant="ghost"
              size="sm"
              icon={isPlaying ? <PauseCircle /> : <PlayCircle />}
              onClick={onPlayPause}
              className={styles.playBtn}
            />
          </Tooltip>

          <div className={styles.timeDisplay}>
            <span style={{ fontWeight: 600 }}>{formatTimeWithMs(currentTime)}</span>
            <span style={{ color: 'rgba(0,0,0,0.45)' }}> / {formatTimeWithMs(duration)}</span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <Tooltip title="后退一帧">
              <Button variant="ghost" size="sm" icon={<SkipBack />} />
            </Tooltip>
            <Tooltip title="前进一帧">
              <Button variant="ghost" size="sm" icon={<SkipForward />} />
            </Tooltip>
          </div>
        </div>

        <div className={styles.rightTools}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tooltip title="添加片段">
              <Button variant="ghost" size="sm" icon={<Plus />} onClick={onAddSegment} />
            </Tooltip>

            {selectedSegmentId && (
              <Tooltip title="删除片段">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 />}
                  onClick={() => onSegmentDelete?.(selectedSegmentId)}
                />
              </Tooltip>
            )}

            <div className={styles.zoomControls}>
              <Tooltip title="缩小">
                <Button variant="ghost" size="sm" icon={<ZoomOut />} onClick={handleZoomOut} />
              </Tooltip>
              <span className={styles.zoomLevel}>{Math.round(localZoom * 100)}%</span>
              <Tooltip title="放大">
                <Button variant="ghost" size="sm" icon={<ZoomIn />} onClick={handleZoomIn} />
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* 时间轴主体 */}
      <div className={styles.timelineBody}>
        {/* 左侧轨道标签 */}
        <div className={styles.trackLabels}>
          <div className={styles.trackLabel}>
            <Video />
            <span>视频轨道</span>
          </div>
          <div className={styles.trackLabel}>
            <Volume2 />
            <span>音频轨道</span>
          </div>
        </div>

        {/* 时间轴内容区 */}
        <div className={styles.trackArea}>
          {/* 时间刻度 */}
          <div className={styles.timeScale}>
            {timeMarkers.map((marker, index) => (
              <div
                key={index}
                className={styles.timeMarker}
                style={{ left: `${marker.position}%` }}
              >
                <span className={styles.markerLabel}>{marker.label}</span>
              </div>
            ))}
          </div>

          {/* 轨道区域 */}
          <div
            className={styles.tracks}
            ref={timelineRef as unknown as React.RefObject<HTMLDivElement>}
            onClick={handleTimelineClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ')
                handleTimelineClick(e as unknown as React.KeyboardEvent<HTMLDivElement>);
            }}
            role="slider"
            aria-label="Timeline tracks"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration || 100}
            tabIndex={0}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'default',
              textAlign: 'left',
              width: '100%',
              display: 'block',
            }}
          >
            {/* 视频轨道 */}
            <div className={styles.track}>
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className={`${styles.segment} ${selectedSegmentId === segment.id ? styles.selected : ''}`}
                  style={getSegmentStyle(segment)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSegmentSelect?.(segment.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onSegmentSelect?.(segment.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={segment.name}
                >
                  <GripVertical className={styles.segmentHandle} />
                  <span className={styles.segmentName}>{segment.name}</span>
                </div>
              ))}

              {/* 如果没有片段显示提示 */}
              {segments.length === 0 && (
                <div className={styles.emptyTrack}>
                  <span style={{ color: 'rgba(0,0,0,0.45)' }}>点击加载视频或添加片段</span>
                </div>
              )}
            </div>

            {/* 音频轨道占位 */}
            <div className={styles.track}>
              <div className={styles.emptyTrack}>
                <span style={{ color: 'rgba(0,0,0,0.45)' }}>音频轨道</span>
              </div>
            </div>

            {/* 播放头 */}
            <div
              className={styles.playhead}
              style={{ left: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
            >
              <div className={styles.playheadHead} />
              <div className={styles.playheadLine} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className={styles.statusBar}>
        <div className={styles.leftStatus}>
          <span className={styles.tag}>{segments.length} 个片段</span>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>总时长: {formatTimeWithMs(duration)}</span>
        </div>
        <div className={styles.rightStatus}>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>
            {selectedSegmentId
              ? `已选择: ${segments.find((s) => s.id === selectedSegmentId)?.name || '未知'}`
              : '未选择片段'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeline;
