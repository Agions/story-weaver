/**
 * VideoEditorPage 子组件 - 工具栏相关
 */
import { Upload, Undo, Redo, Download, Plus } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Dropdown } from '@/shared/components/ui/dropdown';
import { Modal } from '@/shared/components/ui/modal';
import { Progress } from '@/shared/components/ui/progress';
import { Text } from '@/shared/components/ui/typography';

import styles from '../VideoEditorPage.module.less';

import { useVideoEditor } from './hooks/useVideoEditor';

type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';
type OutputFormat = 'mp4' | 'mov' | 'mkv' | 'webm';
type UseVideoEditorState = ReturnType<typeof useVideoEditor>;

// ========== SettingDropdown ==========

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

// ========== ExportProgressModal ==========

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

// ========== renderSettingsPanel ==========

function renderSettingsPanel(
  outputFormat: string,
  videoQuality: string,
  setVideoQuality: (q: VideoQuality) => void,
  setOutputFormat: (f: OutputFormat) => void
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
      <h3 className={styles.sectionTitle}>导出设置</h3>
      <div className={styles.settingCard}>
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
            if (['mp4', 'mov', 'mkv', 'webm'].includes(key)) setOutputFormat(key as OutputFormat);
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
            if (['low', 'medium', 'high', 'ultra'].includes(key))
              setVideoQuality(key as VideoQuality);
          }}
        />
      </div>
    </div>
  );
}

// ========== renderToolbar ==========

function renderToolbar(state: UseVideoEditorState) {
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
        <Button icon={<Undo />} disabled={!canUndo} onClick={handleUndo} />
        <Button icon={<Redo />} disabled={!canRedo} onClick={handleRedo} />
        <Button icon={<Plus />} onClick={handleAddSegment} disabled={!videoSrc} />
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

export { SettingDropdown, ExportProgressModal, renderSettingsPanel, renderToolbar };
export type { VideoQuality, OutputFormat };
