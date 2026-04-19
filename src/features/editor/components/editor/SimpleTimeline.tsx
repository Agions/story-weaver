import React, { useRef, useEffect, useState } from 'react';
import { Button, Tooltip, Slider, Typography, Tag, Dropdown, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  PlusOutlined,
  DeleteOutlined,
  ScissorOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  SoundOutlined,
  ExpandOutlined,
  HolderOutlined,
  SyncOutlined,
  VideoCameraAddOutlined
} from '@ant-design/icons';
import styles from './SimpleTimeline.module.less';

const { Text } = Typography;

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
  onZoomChange
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localZoom, setLocalZoom] = useState(zoom);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // 处理时间轴点击
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration === 0) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
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
        label: formatTime(i),
        position: (i / duration) * 100
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
      backgroundColor: segment.color || '#1E88E5'
    };
  };

  return (
    <div className={styles.timeline}>
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.leftTools}>
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              type="text"
              size="small"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={onPlayPause}
              className={styles.playBtn}
            />
          </Tooltip>
          
          <div className={styles.timeDisplay}>
            <Text strong>{formatTime(currentTime)}</Text>
            <Text type="secondary"> / {formatTime(duration)}</Text>
          </div>
          
          <Space size={4}>
            <Tooltip title="后退一帧">
              <Button type="text" size="small" icon={<StepBackwardOutlined />} />
            </Tooltip>
            <Tooltip title="前进一帧">
              <Button type="text" size="small" icon={<StepForwardOutlined />} />
            </Tooltip>
          </Space>
        </div>

        <div className={styles.rightTools}>
          <Space>
            <Tooltip title="添加片段">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={onAddSegment}
              />
            </Tooltip>
            
            {selectedSegmentId && (
              <Tooltip title="删除片段">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onSegmentDelete?.(selectedSegmentId)}
                />
              </Tooltip>
            )}
            
            <div className={styles.zoomControls}>
              <Tooltip title="缩小">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={handleZoomOut}
                />
              </Tooltip>
              <span className={styles.zoomLevel}>{Math.round(localZoom * 100)}%</span>
              <Tooltip title="放大">
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={handleZoomIn}
                />
              </Tooltip>
            </div>
          </Space>
        </div>
      </div>

      {/* 时间轴主体 */}
      <div className={styles.timelineBody}>
        {/* 左侧轨道标签 */}
        <div className={styles.trackLabels}>
          <div className={styles.trackLabel}>
            <VideoCameraAddOutlined />
            <span>视频轨道</span>
          </div>
          <div className={styles.trackLabel}>
            <SoundOutlined />
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
            ref={timelineRef}
            onClick={handleTimelineClick}
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
                >
                  <HolderOutlined className={styles.segmentHandle} />
                  <span className={styles.segmentName}>{segment.name}</span>
                </div>
              ))}
              
              {/* 如果没有片段显示提示 */}
              {segments.length === 0 && (
                <div className={styles.emptyTrack}>
                  <Text type="secondary">点击加载视频或添加片段</Text>
                </div>
              )}
            </div>

            {/* 音频轨道占位 */}
            <div className={styles.track}>
              <div className={styles.emptyTrack}>
                <Text type="secondary">音频轨道</Text>
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
          <Tag color="blue">{segments.length} 个片段</Tag>
          <Text type="secondary">
            总时长: {formatTime(duration)}
          </Text>
        </div>
        <div className={styles.rightStatus}>
          <Text type="secondary">
            {selectedSegmentId 
              ? `已选择: ${segments.find(s => s.id === selectedSegmentId)?.name || '未知'}`
              : '未选择片段'
            }
          </Text>
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeline;
