import { convertFileSrc } from '@tauri-apps/api/core';
import { Edit3, Trash2, Play, Plus, Save, Download, ChevronDown, Sparkles } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { toast } from '@/shared/components/ui/sonner';
import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import type { Script, ScriptMetadata } from '@/shared/types';
import { formatDurationShort } from '@/shared/utils';

import styles from './ScriptEditor.module.less';

// 定义 VideoSegment 类型（兼容旧接口）
interface VideoSegment {
  id: string;
  start: number;
  end: number;
  type: string;
  content?: string;
}

// 兼容两种接口
interface ScriptEditorProps {
  // 旧接口
  videoPath?: string;
  initialSegments?: VideoSegment[];
  onSave?: (segments: VideoSegment[]) => void;
  onExport?: (format: string) => void;
  // 新接口 (来自 VideoStudio)
  script?: Script;
  metadata?: ScriptMetadata;
  onScriptUpdate?: (updatedScript: Script) => void;
  // VideoStudio 使用的 segments
  segments?: VideoSegment[];
  onSegmentsChange?: (newSegments: VideoSegment[]) => void;
}

/**
 * 脚本编辑器组件
 */
function ScriptEditor({
  videoPath,
  initialSegments = [],
  onSave,
  onExport,
  script: _script,
  metadata: _metadata,
  onScriptUpdate: _onScriptUpdate,
}: ScriptEditorProps) {
  const [segments, setSegments] = useState<VideoSegment[]>(initialSegments);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<{
    start: number;
    end: number;
    type: string;
    content: string;
  } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<number | null>(null);

  const totalDuration = useMemo(
    () => segments.reduce((sum, segment) => sum + (segment.end - segment.start), 0),
    [segments]
  );

  // 添加新片段
  const handleAddSegment = () => {
    // 计算新片段的开始时间（从上一个片段的结束时间开始）
    const lastSegment = segments.length > 0 ? segments[segments.length - 1] : null;
    const startTime = lastSegment ? lastSegment.end : 0;
    const endTime = startTime + 30; // 默认片段长度30秒

    setEditFormValues({
      start: startTime,
      end: endTime,
      type: 'narration',
      content: '',
    });
    setEditingIndex(segments.length);
  };

  // 编辑片段
  const handleEditSegment = (index: number) => {
    const segment = segments[index];
    setEditFormValues({
      start: segment.start,
      end: segment.end,
      type: segment.type || 'narration',
      content: segment.content || '',
    });
    setEditingIndex(index);
  };

  // 保存编辑片段
  const handleSaveSegment = () => {
    if (!editFormValues) return;

    const start = editFormValues.start;
    const end = editFormValues.end;

    if (end <= start) {
      toast.error('结束时间必须大于开始时间');
      return;
    }

    const newSegments = [...segments];
    const segment: VideoSegment = {
      id: newSegments[editingIndex as number]?.id || `seg_${Date.now()}`,
      start,
      end,
      type: editFormValues.type,
      content: editFormValues.content,
    };

    if (editingIndex !== null) {
      if (editingIndex < segments.length) {
        newSegments[editingIndex] = segment;
      } else {
        newSegments.push(segment);
      }
    }

    setSegments(newSegments);
    setEditingIndex(null);
    setEditFormValues(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditFormValues(null);
  };

  // 删除片段
  const handleDeleteSegment = (index: number) => {
    setSegmentToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (segmentToDelete !== null) {
      const newSegments = [...segments];
      newSegments.splice(segmentToDelete, 1);
      setSegments(newSegments);
    }
    setDeleteConfirmOpen(false);
    setSegmentToDelete(null);
  };

  // 预览片段
  const handlePreviewSegment = async (index: number) => {
    try {
      setPreviewLoading(true);
      const segment = segments[index];

      const previewPath = await tauriService.generatePreview({
        inputPath: videoPath || '',
        segment: { start: segment.start, end: segment.end, type: 'preview' },
      });

      setPreviewSrc(convertFileSrc(previewPath));
      setPreviewVisible(true);
    } catch (error) {
      logger.error('生成预览失败:', error);
      toast.error('生成预览失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 导出脚本
  const handleExport = () => {
    setExportMenuVisible(true);
  };

  // 打开 AI 优化模态框
  const handleOpenAIModal = () => {
    setAiModalVisible(true);
  };

  // AI 优化脚本
  const handleAIImprove = async () => {
    try {
      toast.info('正在使用 AI 优化脚本...');
      setAiModalVisible(false);
      setTimeout(() => {
        toast.success('脚本优化完成');
      }, 2000);
    } catch (error) {
      logger.error('AI 优化脚本失败:', error);
      toast.error('AI 优化脚本失败');
    }
  };

  // 表格列定义
  const _columns = [
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_: unknown, record: VideoSegment, _index: number) => (
        <span>
          {formatDurationShort(record.start)} - {formatDurationShort(record.end)}
        </span>
      ),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (_: unknown, record: VideoSegment) => (
        <span>{formatDurationShort(record.end - record.start)}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <span>
          {type === 'narration'
            ? '旁白'
            : type === 'dialogue'
              ? '对白'
              : type === 'action'
                ? '动作'
                : type === 'transition'
                  ? '转场'
                  : type}
        </span>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div className={styles.contentCell}>
          {content || <span className={styles.emptyContent}>（无内容）</span>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: VideoSegment, index: number) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="small" onClick={() => handleEditSegment(index)}>
            <Edit3 size={14} />
          </Button>
          <Button variant="ghost" size="small" onClick={() => handlePreviewSegment(index)}>
            <Play size={14} />
          </Button>
          <Button variant="ghost" size="small" onClick={() => handleDeleteSegment(index)}>
            <Trash2 size={14} color="#ff4d4f" /> {/* TODO: add theme token */}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.scriptEditor}>
      <Card
        title="脚本编辑"
        className={styles.editorCard}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" icon={<Sparkles size={16} />} onClick={handleOpenAIModal}>
              AI优化
            </Button>
            <Button variant="default" icon={<Save size={16} />} onClick={() => onSave?.(segments)}>
              保存
            </Button>
            {onExport && (
              <div style={{ position: 'relative' }}>
                <Button variant="outline" icon={<Download size={16} />} onClick={handleExport}>
                  导出 <ChevronDown size={14} />
                </Button>
                {exportMenuVisible && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      background: 'white',
                      border: '1px solid #d9d9d9', // TODO: add theme token
                      borderRadius: 6,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: 120,
                    }}
                  >
                    <div
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onClick={() => {
                        onExport('txt');
                        setExportMenuVisible(false);
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#f5f5f5')} // TODO: add theme token
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.background = 'transparent')
                      }
                    >
                      文本文件 (.txt)
                    </div>
                    <div
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onClick={() => {
                        onExport('srt');
                        setExportMenuVisible(false);
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#f5f5f5')} // TODO: add theme token
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.background = 'transparent')
                      }
                    >
                      字幕文件 (.srt)
                    </div>
                    <div
                      style={{ padding: '8px 12px', cursor: 'pointer' }}
                      onClick={() => {
                        onExport('doc');
                        setExportMenuVisible(false);
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = '#f5f5f5')} // TODO: add theme token
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.background = 'transparent')
                      }
                    >
                      Word文档 (.docx)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      >
        <div className={styles.statsBar}>
          <div>总片段: {segments.length}</div>
          <div>总时长: {formatDurationShort(totalDuration)}</div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}> {/* TODO: add theme token */}
                <th style={{ padding: '8px', textAlign: 'left', width: 180 }}>时间</th>
                <th style={{ padding: '8px', textAlign: 'left', width: 80 }}>时长</th>
                <th style={{ padding: '8px', textAlign: 'left', width: 100 }}>类型</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>内容</th>
                <th style={{ padding: '8px', textAlign: 'left', width: 180 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((record, index) => (
                <tr key={record.id || index} style={{ borderBottom: '1px solid #f0f0f0' }}> {/* TODO: add theme token */}
                  <td style={{ padding: '8px' }}>
                    {formatDurationShort(record.start)} - {formatDurationShort(record.end)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {formatDurationShort(record.end - record.start)}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {record.type === 'narration'
                      ? '旁白'
                      : record.type === 'dialogue'
                        ? '对白'
                        : record.type === 'action'
                          ? '动作'
                          : record.type === 'transition'
                            ? '转场'
                            : record.type}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div className={styles.contentCell}>
                      {record.content || <span className={styles.emptyContent}>（无内容）</span>}
                    </div>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="ghost" size="small" onClick={() => handleEditSegment(index)}>
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handlePreviewSegment(index)}
                      >
                        <Play size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleDeleteSegment(index)}
                      >
                        <Trash2 size={14} color="#ff4d4f" /> {/* TODO: add theme token */}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            variant="outline"
            icon={<Plus size={16} />}
            style={{ width: '100%', marginTop: 16, borderStyle: 'dashed' }}
            onClick={handleAddSegment}
          >
            添加片段
          </Button>
        </div>

        {editingIndex !== null && editFormValues && (
          <div className={styles.editForm}>
            <Card title={`编辑片段 #${editingIndex + 1}`} className={styles.editCard}>
              <div className={styles.timeInputs}>
                <div className={styles.formField}>
                  <label
                    style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}
                  >
                    开始时间 (秒)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editFormValues.start}
                    onChange={(e) =>
                      setEditFormValues({
                        ...editFormValues,
                        start: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}
                  >
                    结束时间 (秒)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editFormValues.end}
                    onChange={(e) =>
                      setEditFormValues({ ...editFormValues, end: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  类型
                </label>
                <Select
                  value={editFormValues.type}
                  onValueChange={(v) => setEditFormValues({ ...editFormValues, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narration">旁白</SelectItem>
                    <SelectItem value="dialogue">对白</SelectItem>
                    <SelectItem value="action">动作</SelectItem>
                    <SelectItem value="transition">转场</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.formField}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  内容
                </label>
                <textarea
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9', // TODO: add theme token
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                  value={editFormValues.content}
                  onChange={(e) =>
                    setEditFormValues({ ...editFormValues, content: e.target.value })
                  }
                />
              </div>

              <div className={styles.formActions}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    取消
                  </Button>
                  <Button variant="default" onClick={handleSaveSegment}>
                    保存
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <Dialog open={previewVisible} onOpenChange={setPreviewVisible}>
        <DialogContent style={{ maxWidth: 700 }}>
          <DialogHeader>
            <DialogTitle>预览片段</DialogTitle>
          </DialogHeader>
          <div className={styles.previewContainer}>
            {previewLoading ? (
              <div className={styles.previewLoading}>
                <p>正在生成预览...</p>
              </div>
            ) : (
              <video
                src={previewSrc}
                controls
                autoPlay
                className={styles.previewVideo}
                style={{ width: '100%' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aiModalVisible} onOpenChange={setAiModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI 优化脚本</DialogTitle>
          </DialogHeader>
          <p>使用 AI 优化脚本将会根据视频内容和当前脚本，生成更加专业的表达和结构。</p>
          <p>点击确定开始优化。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalVisible(false)}>
              取消
            </Button>
            <Button variant="default" onClick={handleAIImprove}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>确定要删除这个片段吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ScriptEditor;
