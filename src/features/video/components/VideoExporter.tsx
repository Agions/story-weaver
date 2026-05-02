import {
  Download,
  Video,
  Settings,
  CheckCircle,
  Play,
  File,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Tooltip as TooltipPrimitive } from '@/components/ui/tooltip';
import type { ExportSettings } from '@/core/types';
import { logger } from '@/core/utils/logger';

import styles from './VideoExporter.module.less';

// 导出格式选项
export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

// 分辨率选项
export const RESOLUTIONS = ['480p', '720p', '1080p', '4K'] as const;
export type Resolution = typeof RESOLUTIONS[number];

// 帧率选项
export const FRAME_RATES = [24, 30, 60] as const;
export type FrameRate = typeof FRAME_RATES[number];

// 分辨率对应的像素值
const RESOLUTION_VALUES: Record<Resolution, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
};

// 质量预设
const QUALITY_PRESETS = {
  low: { label: '低', description: '文件小，适合快速预览', bitrate: '2Mbps' },
  medium: { label: '中', description: '平衡质量与文件大小', bitrate: '5Mbps' },
  high: { label: '高', description: '高质量，适合分享', bitrate: '10Mbps' },
  ultra: { label: '超清', description: '最高质量，适合专业用途', bitrate: '20Mbps' },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;

interface VideoExporterProps {
  projectId?: string;
  projectName?: string;
  estimatedDuration?: number; // 预计时长（秒）
  onExport?: (settings: ExportSettings) => Promise<void>;
  onCancel?: () => void;
  initialSettings?: Partial<ExportSettings>;
}

const VideoExporter: React.FC<VideoExporterProps> = ({
  projectId: _projectId,
  projectName = '未命名项目',
  estimatedDuration = 0,
  onExport,
  onCancel,
  initialSettings,
}) => {
  // 导出格式
  const [format, setFormat] = useState<ExportFormat>(initialSettings?.format as ExportFormat || 'MP4');

  // 分辨率
  const [resolution, setResolution] = useState<Resolution>(initialSettings?.resolution as Resolution || '1080p');

  // 帧率
  const [frameRate, setFrameRate] = useState<FrameRate>(initialSettings?.frameRate as FrameRate || 30);

  // 质量
  const [quality, setQuality] = useState<QualityPreset>('high');

  // 文件名
  const [filename, setFilename] = useState<string>(
    `${projectName}_${new Date().toISOString().slice(0, 10)}`
  );

  // 导出状态
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedFilePath, setExportedFilePath] = useState<string>('');

  // 计算预计文件大小
  const estimatedFileSize = useCallback(() => {
    const { width, height } = RESOLUTION_VALUES[resolution];
    const _pixels = width * height;
    const _frameRateValue = frameRate;
    const bitrate = QUALITY_PRESETS[quality].bitrate;
    const bitrateMbps = parseFloat(bitrate);

    // 粗略估算：比特率 * 时长
    const sizeInMegabits = bitrateMbps * estimatedDuration;
    const sizeInMegabytes = sizeInMegabits / 8;

    if (sizeInMegabytes > 1024) {
      return `${(sizeInMegabytes / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMegabytes.toFixed(1)} MB`;
  }, [resolution, frameRate, quality, estimatedDuration]);

  // 处理导出
  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error('请输入有效的文件名');
      return;
    }

    if (estimatedDuration === 0) {
      toast.error('没有可导出的内容');
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportStatus('正在准备导出...');
    setExportComplete(false);

    const exportSettings: ExportSettings = {
      format: format.toLowerCase() as ExportSettings['format'],
      quality,
      resolution: resolution as ExportSettings['resolution'],
      frameRate: frameRate as ExportSettings['frameRate'],
      includeSubtitles: true,
      burnSubtitles: true,
    };

    try {
      // 模拟导出进度（实际项目中应调用后端API）
      if (onExport) {
        await onExport(exportSettings);
      } else {
        // 模拟导出过程
        await simulateExport();
      }

      setExportProgress(100);
      setExportStatus('导出完成！');
      setExportComplete(true);
      setExportedFilePath(`/exports/${filename}.${format.toLowerCase()}`);
      toast.success('视频导出成功！');
    } catch (error) {
      logger.error('导出失败:', error);
      setExportStatus('导出失败，请重试');
      toast.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 模拟导出进度
  const simulateExport = async () => {
    const steps = [
      { progress: 10, status: '正在编码视频...' },
      { progress: 30, status: '正在处理音频...' },
      { progress: 50, status: '正在合成字幕...' },
      { progress: 70, status: '正在添加转场效果...' },
      { progress: 90, status: '正在生成最终文件...' },
      { progress: 100, status: '导出完成！' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setExportProgress(step.progress);
      setExportStatus(step.status);
    }
  };

  // 取消导出
  const handleCancel = () => {
    if (exporting) {
      toast.warning('导出已取消');
    }
    setExporting(false);
    setExportProgress(0);
    setExportStatus('');
    onCancel?.();
  };

  // 重置导出
  const handleReset = () => {
    setExporting(false);
    setExportProgress(0);
    setExportStatus('');
    setExportComplete(false);
    setExportedFilePath('');
  };

  return (
    <Card className={styles.exportPanel}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Video className={styles.titleIcon} size={20} />
          <h4 className={styles.title} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>漫剧视频导出</h4>
        </div>
        {projectName && (
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }} className={styles.projectName}>
            项目：{projectName}
          </span>
        )}
      </div>

      <Separator className={styles.divider} />

      {!exportComplete ? (
        <div className={styles.content}>
          {/* 文件名设置 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Settings size={16} />
              <span style={{ fontWeight: 600 }}>文件名</span>
            </div>
            <div style={{ display: 'flex', gap: 0 }}>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="输入文件名"
                disabled={exporting}
                className={styles.filenameInput}
                style={{ borderRadius: '6px 0 0 6px', borderRight: 'none' }}
              />
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0 12px',
                background: '#f5f5f5',
                border: '1px solid #d9d9d9',
                borderLeft: 'none',
                borderRadius: '0 6px 6px 0',
                fontSize: 14,
                color: 'rgba(0,0,0,0.65)'
              }}>
                .{format.toLowerCase()}
              </span>
            </div>
          </div>

          {/* 导出格式 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <File size={16} />
              <span style={{ fontWeight: 600 }}>导出格式</span>
            </div>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} disabled={exporting}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {EXPORT_FORMATS.map((fmt) => (
                  <div key={fmt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RadioGroupItem value={fmt} id={`fmt-${fmt}`} />
                    <label htmlFor={`fmt-${fmt}`} style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer' }}>
                      <span className={styles.formatLabel}>{fmt}</span>
                      <span className={styles.formatDesc} style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {fmt === 'MP4' && '通用格式，兼容性最好'}
                        {fmt === 'MOV' && 'Apple QuickTime 格式'}
                        {fmt === 'WebM' && 'Web 在线播放格式'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 分辨率选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Settings size={16} />
              <span style={{ fontWeight: 600 }}>分辨率</span>
            </div>
            <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)} disabled={exporting}>
              <SelectTrigger className={styles.select}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((res) => (
                  <SelectItem key={res} value={res}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{res}</span>
                      <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                        {RESOLUTION_VALUES[res].width}x{RESOLUTION_VALUES[res].height}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 帧率选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Play size={16} />
              <span style={{ fontWeight: 600 }}>帧率</span>
            </div>
            <RadioGroup value={String(frameRate)} onValueChange={(v) => setFrameRate(Number(v) as FrameRate)} disabled={exporting}>
              <div style={{ display: 'flex', gap: 16 }}>
                {FRAME_RATES.map((fps) => (
                  <div key={fps} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RadioGroupItem value={String(fps)} id={`fps-${fps}`} />
                    <label htmlFor={`fps-${fps}`} style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: 'pointer' }}>
                      <span className={styles.frameRateLabel}>{fps} FPS</span>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {fps === 24 && '电影标准'}
                        {fps === 30 && '常用帧率'}
                        {fps === 60 && '流畅丝滑'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 质量选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Settings size={16} />
              <span style={{ fontWeight: 600 }}>质量预设</span>
            </div>
            <RadioGroup value={quality} onValueChange={(v) => setQuality(v as QualityPreset)} disabled={exporting}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RadioGroupItem value={key} id={`quality-${key}`} />
                    <label htmlFor={`quality-${key}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <span className={styles.qualityLabel}>{preset.label}</span>
                      <span className={styles.qualityDesc}>{preset.description}</span>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {preset.bitrate}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* 预计文件大小 */}
          {estimatedDuration > 0 && (
            <Alert variant="default" className={styles.infoAlert}>
              <AlertDescription>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>预计导出时长：<strong>{Math.floor(estimatedDuration / 60)}分{estimatedDuration % 60}秒</strong></span>
                  <span>|</span>
                  <span>预计文件大小：<strong>{estimatedFileSize()}</strong></span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 导出进度 */}
          {exporting && (
            <div className={styles.progressSection}>
              <span style={{ fontWeight: 600 }}>导出进度：{exportStatus}</span>
              <Progress
                value={exportProgress}
                className={styles.progress}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <div style={{ display: 'flex', gap: 8 }}>
              {exporting ? (
                <Button variant="destructive" onClick={handleCancel}>
                  取消导出
                </Button>
              ) : (
                <>
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      取消
                    </Button>
                  )}
                  <TooltipPrimitive content={!filename.trim() ? '请输入文件名' : undefined}>
                    <span>
                      <Button
                        variant="default"
                        icon={<Download size={16} />}
                        onClick={handleExport}
                        disabled={!filename.trim() || estimatedDuration === 0}
                      >
                        开始导出
                      </Button>
                    </span>
                  </TooltipPrimitive>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 导出完成 */
        <div className={styles.completeSection}>
          <div className={styles.successIcon}>
            <CheckCircle size={48} color="#52c41a" />
          </div>
          <h4 className={styles.successTitle} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>导出成功！</h4>
          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }} className={styles.filePath}>
            文件已保存至：{exportedFilePath}
          </span>

          <div className={styles.exportSummary}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><strong>格式：</strong>{format}</div>
              <div><strong>分辨率：</strong>{resolution} ({RESOLUTION_VALUES[resolution].width}x{RESOLUTION_VALUES[resolution].height})</div>
              <div><strong>帧率：</strong>{frameRate} FPS</div>
              <div><strong>质量：</strong>{QUALITY_PRESETS[quality].label}</div>
              <div><strong>预计大小：</strong>{estimatedFileSize()}</div>
            </div>
          </div>

          <div className={styles.completeActions}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" onClick={handleReset}>
                再次导出
              </Button>
              <Button variant="default" icon={<Download size={16} />} onClick={() => toast.success('文件已打开')}>
                打开文件
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VideoExporter;
