/**
 * VideoEditorPage — 视频编辑器页面（Presenter 层）
 *
 * 职责：
 * - 调用 useVideoEditor 获取所有状态和操作
 * - 渲染 UI 布局
 * - 组合 renderToolbar/renderPlayerControls 等子渲染函数
 *
 * 原始 714 行 → 拆分后 <250 行
 */

import {
  Upload,
  Undo,
  Redo,
  Download,
  Trash2,
  Plus,
  Maximize,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { useRef } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { Empty } from '@/components/ui/empty';
import { Row, Col } from '@/components/ui/grid';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { Space } from '@/components/ui/space';
import { Tabs, TabPane } from '@/components/ui/tabs';
import { Tag } from '@/components/ui/tag';
import { Tooltip } from '@/components/ui/tooltip';
import { Title, Text } from '@/components/ui/typography';

import { useVideoEditor } from './hooks/useVideoEditor';
import styles from './VideoEditorPage.module.less';

// ========== SettingDropdown 子组件 ==========

function SettingDropdown({
  label,
  value,
  items,
  onKey,
}: {
  label: string;
  value: string;
  items: { key: string; label: string }[];
  onKey: (key: { key: string }) => void;
}) {
  const menu = {
    items: items.map((item) => ({
      key: item.key,
      label: item.label,
    })),
    onClick: onKey,
  };

  return (
    <div className={styles.settingItem}>
      <Text className={styles.settingLabel}>{label}</Text>
      <Dropdown menu={menu} trigger={['click']}>
        <Button variant="outline" size="small">
          {value} <span style={{ marginLeft: 4 }}>▼</span>
        </Button>
      </Dropdown>
    </div>
  );
}

// ========== 子渲染函数 ==========

function ExportProgressModal({
  isExporting,
  exportProgress,
  exportStatus,
  outputFormat,
  videoQuality,
}: {
  isExporting: boolean;
  exportProgress: number;
  exportStatus: string;
  outputFormat: string;
  videoQuality: string;
}) {
  if (!isExporting) return null;
  const qualityLabel =
    videoQuality === 'low'
      ? '低 (720p)'
      : videoQuality === 'medium'
        ? '中 (1080p)'
        : videoQuality === 'high'
          ? '高 (1080p)'
          : '超清 (原画)';
  return (
    <Modal
      title="导出视频"
      open={isExporting}
      closable={false}
      footer={null}
      maskClosable={false}
      width={400}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Progress
          type="circle"
          percent={Math.round(exportProgress)}
          status={exportProgress >= 100 ? 'success' : 'active'}
        />
        <div style={{ marginTop: 20 }}>
          <Text strong>{exportStatus}</Text>
        </div>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            格式: {outputFormat.toUpperCase()} | 质量: {qualityLabel}
          </Text>
        </div>
      </div>
    </Modal>
  );
}

function renderSettingsPanel(
  outputFormat: string,
  videoQuality: string,
  setVideoQuality: (q: 'low' | 'medium' | 'high' | 'ultra') => void,
  setOutputFormat: (f: 'mp4' | 'mov' | 'mkv' | 'webm') => void
) {
  const formatLabel = outputFormat.toUpperCase();
  const qualityLabel =
    videoQuality === 'low'
      ? '低 (720p)'
      : videoQuality === 'medium'
        ? '中 (1080p)'
        : videoQuality === 'high'
          ? '高 (1080p)'
          : '超清 (原画)';

  return (
    <div className={styles.settingsPanel}>
      <Title level={5} className={styles.sectionTitle}>
        导出设置
      </Title>

      <Card className={styles.settingCard}>
        <SettingDropdown
          label="输出格式"
          value={formatLabel}
          items={[
            { key: 'mp4', label: 'MP4 (H.264+AAC)' },
            { key: 'mov', label: 'MOV (H.264+AAC)' },
            { key: 'mkv', label: 'MKV (H.264+AAC)' },
            { key: 'webm', label: 'WebM (VP9+Opus)' },
          ]}
          onKey={({ key }: { key: string }) => {
            if (key === 'mp4' || key === 'mov' || key === 'mkv' || key === 'webm') setOutputFormat(key);
          }}
        />

        <SettingDropdown
          label="视频质量"
          value={qualityLabel}
          items={[
            { key: 'low', label: '低 (720p, 1.5Mbps)' },
            { key: 'medium', label: '中 (1080p, 4Mbps)' },
            { key: 'high', label: '高 (1080p, 8Mbps)' },
            { key: 'ultra', label: '超清 (原画, 15Mbps)' },
          ]}
          onKey={({ key }: { key: string }) => {
            if (key === 'low' || key === 'medium' || key === 'high' || key === 'ultra') setVideoQuality(key);
          }}
        />
      </Card>
    </div>
  );
}

function renderToolbar(state: ReturnType<typeof useVideoEditor>) {
  const {
    loading,
    canUndo,
    canRedo,
    videoSrc,
    handleLoadVideo,
    handleUndo,
    handleRedo,
    handleAddSegment,
    handleSaveProject,
    handleExportVideo,
    isSaving,
    isExporting,
    segments,
  } = state;

  return (
    <div className={styles.toolbar}>
      <div className={styles.leftTools}>
        <Button type="primary" icon={<Upload />} onClick={handleLoadVideo} loading={loading}>
          加载视频
        </Button>

        <Tooltip title="撤销">
          <Button icon={<Undo />} disabled={!canUndo} onClick={handleUndo} />
        </Tooltip>

        <Tooltip title="重做">
          <Button icon={<Redo />} disabled={!canRedo} onClick={handleRedo} />
        </Tooltip>

        <Tooltip title="添加片段">
          <Button icon={<Plus />} onClick={handleAddSegment} disabled={!videoSrc} />
        </Tooltip>
      </div>

      <div className={styles.rightTools}>
        <Button
          icon={<Download />}
          onClick={handleSaveProject}
          loading={isSaving}
          disabled={!videoSrc}
        >
          保存
        </Button>

        <Button
          type="primary"
          icon={<Download />}
          onClick={handleExportVideo}
          loading={isExporting}
          disabled={!videoSrc || segments.length === 0}
        >
          导出
        </Button>
      </div>
    </div>
  );
}

function renderPlayerControls(state: ReturnType<typeof useVideoEditor>) {
  const { isPlaying, videoSrc, currentTime, duration, togglePlayPause, formatTime } = state;

  return (
    <div className={styles.playerControls}>
      <Button
        type="text"
        icon={isPlaying ? <PauseCircle /> : <PlayCircle />}
        onClick={togglePlayPause}
        size="large"
        disabled={!videoSrc}
      />

      <div className={styles.timeDisplay}>
        <Text>
          {formatTime(currentTime, { hours: 'always' })} /{' '}
          {formatTime(duration, { hours: 'always' })}
        </Text>
      </div>

      <div className={styles.progressBar}>
        <Progress
          percent={(currentTime / Math.max(duration, 1)) * 100}
          showInfo={false}
          strokeColor="#1E88E5"
          trailColor="#e6e6e6"
        />
      </div>

      <Tooltip title="全屏">
        <Button type="text" icon={<Maximize />} disabled={!videoSrc} />
      </Tooltip>
    </div>
  );
}

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
          {formatTime(segment.start, { hours: 'always' })} - {formatTime(segment.end, { hours: 'always' })}
        </Tag>
        <Text type="secondary">时长: {formatTime(segment.end - segment.start, { hours: 'always' })}</Text>
      </div>

      {segment.content && (
        <div className={styles.segmentContent}>
          <Text ellipsis>{segment.content}</Text>
        </div>
      )}
    </Card>
  );
}

function renderSegmentList(state: ReturnType<typeof useVideoEditor>) {
  const { segments, selectedSegmentIndex, videoSrc, handleSelectSegment, handleDeleteSegment, handleAddSegment, formatTime } = state;

  return (
    <div className={styles.segmentList}>
      <Title level={5} className={styles.sectionTitle}>
        片段列表
      </Title>

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

// ========== 主组件 ==========

const VideoEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useVideoEditor(projectId);
  const timelineRef = useRef<HTMLDivElement>(null);

  const {
    videoSrc,
    loading,
    currentTime,
    duration,
    segments,
    keyframes,
    selectedSegmentIndex,
    isExporting,
    exportProgress,
    exportStatus,
    outputFormat,
    videoQuality,
    isPlaying,
    videoRef,
    handleLoadVideo,
    togglePlayPause,
    handleTimeUpdate,
    handleVideoLoaded,
    setOutputFormat,
    setVideoQuality,
    handleAddSegment,
    formatTime,
  } = state;

  return (
    <div className={styles.editorLayout}>
      <div className={styles.editorContent}>
        <ExportProgressModal
          isExporting={isExporting}
          exportProgress={exportProgress}
          exportStatus={exportStatus}
          outputFormat={outputFormat}
          videoQuality={videoQuality}
        />

        {renderToolbar(state)}

        <Row gutter={[24, 24]}>
          {/* 视频预览区 */}
          <Col span={16}>
            <Card className={styles.playerCard} title="视频预览">
              {videoSrc ? (
                <div className={styles.playerWrapper}>
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className={styles.videoPlayer}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleVideoLoaded}
                    onClick={togglePlayPause}
                  >
                    <track kind="captions" src="" label="Captions" default={false} />
                  </video>
                  {renderPlayerControls(state)}
                </div>
              ) : (
                <div className={styles.emptyPlayer}>
                  <Button type="primary" icon={<Upload />} onClick={handleLoadVideo} size="large">
                    加载视频
                  </Button>
                  <Text type="secondary" style={{ marginTop: 16 }}>
                    支持MP4, MOV, AVI, MKV等格式
                  </Text>
                </div>
              )}
            </Card>

            {/* 时间轴 */}
            <div className={styles.timelineContainer}>
              <div className={styles.timeline} ref={timelineRef}>
                {segments.map((segment, index) => (
                  <div
                    key={index}
                    className={`${styles.timelineSegment} ${selectedSegmentIndex === index ? styles.selected : ''}`}
                    style={{
                      left: `${(segment.start / Math.max(duration, 1)) * 100}%`,
                      width: `${((segment.end - segment.start) / Math.max(duration, 1)) * 100}%`,
                    }}
                    onClick={() => state.handleSelectSegment(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') state.handleSelectSegment(index);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.segmentHandle} />
                    <div className={styles.segmentLabel}>{index + 1}</div>
                    <div className={styles.segmentHandle} />
                  </div>
                ))}
                <div
                  className={styles.playhead}
                  style={{ left: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                />
              </div>
            </div>
          </Col>

          {/* 右侧工具面板 */}
          <Col span={8}>
            <Tabs defaultActiveKey="trim" className={styles.editorTabs}>
              <TabPane tab="片段" key="trim">
                {renderSegmentList(state)}
              </TabPane>

              <TabPane tab="关键帧" key="keyframes">
                <div className={styles.keyframesContainer}>
                  <Title level={5} className={styles.sectionTitle}>
                    关键帧
                  </Title>
                  {renderKeyframeList(keyframes)}
                </div>
              </TabPane>

              <TabPane tab="效果" key="effects">
                <div className={styles.effectsPanel}>
                  <Title level={5} className={styles.sectionTitle}>
                    视频效果
                  </Title>
                  <Empty description="此功能正在开发中" />
                </div>
              </TabPane>

              <TabPane tab="设置" key="settings">
                {renderSettingsPanel(outputFormat, videoQuality, setVideoQuality, state.setOutputFormat)}
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default VideoEditor;