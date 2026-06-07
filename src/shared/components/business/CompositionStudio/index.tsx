import { motion } from 'framer-motion';
import {
  PlayCircle,
  PauseCircle,
  Settings,
  Video,
  FastForward,
  Plus,
  Trash2,
  Download,
  Palette,
} from 'lucide-react';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';
import { SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Tag } from '@/components/ui/tag';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import {
  Select,
  InputNumber,
  Space,
  Divider,
  Modal,
  Row,
  Col,
} from '@/components/ui/ui-components';
import type {
  StoryboardFrame,
  CompositionProject,
  FrameAnimation,
  TransitionConfig,
  TransitionEffect,
  AnimationKeyframe,
} from '@/shared/types';
import { generatePrefixedId } from '@/shared/utils';

import FrameEditForm from './FrameEditForm';
import GlobalSettingsForm from './GlobalSettingsForm';
import styles from './index.module.less';

// PreviewArea subcomponent
interface PreviewAreaProps {
  currentFrame: StoryboardFrame | undefined;
  currentFrameConfig: FrameAnimation | undefined;
  currentFrameIndex: number;
  frameDuration: number;
  framesLength: number;
}

const PreviewArea: React.FC<PreviewAreaProps> = ({
  currentFrame,
  currentFrameConfig,
  currentFrameIndex,
  frameDuration,
  framesLength,
}) => (
  <div className={styles.previewArea}>
    {currentFrame?.imageUrl ? (
      <motion.div
        className={styles.previewFrame}
        animate={{
          scale: currentFrameConfig?.zoom ?? 1,
          rotate: currentFrameConfig?.rotation ?? 0,
          opacity: currentFrameConfig?.opacity ?? 1,
          x: (currentFrameConfig?.pan?.x ?? 0) * 5,
          y: (currentFrameConfig?.pan?.y ?? 0) * 5,
        }}
        transition={{
          duration: frameDuration,
          ease: 'easeInOut',
        }}
        style={{
          filter: `
            blur(${currentFrameConfig?.filters?.blur ?? 0}px)
            brightness(${currentFrameConfig?.filters?.brightness ?? 100}%)
            contrast(${currentFrameConfig?.filters?.contrast ?? 100}%)
            saturate(${currentFrameConfig?.filters?.saturation ?? 100}%)
          `,
        }}
      >
        <img src={currentFrame.imageUrl} alt={currentFrame.title} />
      </motion.div>
    ) : (
      <Empty description="请先完成场景渲染" />
    )}
    <div className={styles.frameIndicator}>
      帧 {currentFrameIndex + 1} / {framesLength} · {frameDuration}s
    </div>
  </div>
);

// PlaybackControls subcomponent
interface PlaybackControlsProps {
  currentFrameIndex: number;
  framesLength: number;
  playbackSpeed: number;
  onPrev: () => void;
  onNext: () => void;
  onSpeedChange: (speed: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentFrameIndex,
  framesLength,
  playbackSpeed,
  onPrev,
  onNext,
  onSpeedChange,
}) => (
  <div className={styles.controls}>
    <Divider orientation="left">播放控制</Divider>
    <Row gutter={8} style={{ marginBottom: 16 }}>
      <Col span={12}>
        <Space>
          <Button onClick={onPrev} disabled={currentFrameIndex === 0}>
            上一帧
          </Button>
          <Button onClick={onNext} disabled={currentFrameIndex >= framesLength - 1}>
            下一帧
          </Button>
        </Space>
      </Col>
      <Col span={12}>
        <Space>
          <Text>速度:</Text>
          <Select
            value={String(playbackSpeed)}
            onChange={(v) => onSpeedChange(parseFloat(String(v)))}
            style={{ width: 80 }}
          >
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </Select>
        </Space>
      </Col>
    </Row>
  </div>
);

// AnimationTableRow subcomponent
interface AnimationTableRowProps {
  record: FrameAnimation;
  frame: StoryboardFrame | undefined;
  onEdit: (frameId: string) => void;
  onOpenKeyframes: (frameId: string) => void;
}

const AnimationTableRow: React.FC<AnimationTableRowProps> = ({
  record,
  frame,
  onEdit,
  onOpenKeyframes,
}) => {
  const type = record.cameraMotion?.type;
  return (
    <TableRow key={record.frameId}>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{frame?.title ?? record.frameId}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{frame?.sceneDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <Tag color={type ? 'blue' : 'default'}>{type ?? '静止'}</Tag>
      </TableCell>
      <TableCell>{((record.zoom ?? 1) * 100).toFixed(0)}%</TableCell>
      <TableCell>{(record.rotation ?? 0).toFixed(0)}°</TableCell>
      <TableCell>{((record.opacity ?? 1) * 100).toFixed(0)}%</TableCell>
      <TableCell>
        <Tag color={record.keyframes?.length ? 'green' : 'default'}>
          {record.keyframes?.length ?? 0}
        </Tag>
      </TableCell>
      <TableCell>
        <Space>
          <Button size="sm" variant="outline" onClick={() => onEdit(record.frameId)}>
            编辑
          </Button>
          <Button size="sm" variant="outline" onClick={() => onOpenKeyframes(record.frameId)}>
            关键帧
          </Button>
        </Space>
      </TableCell>
    </TableRow>
  );
};

// KeyframeEditorContent subcomponent
interface KeyframeEditorContentProps {
  keyframes: AnimationKeyframe[];
  frameDuration: number;
  onDeleteKeyframe: (index: number) => void;
}

const KeyframeEditorContent: React.FC<KeyframeEditorContentProps> = ({
  keyframes,
  frameDuration,
  onDeleteKeyframe,
}) => (
  <div className={styles.keyframeEditor}>
    <Divider orientation="left">关键帧列表</Divider>
    <div className={styles.keyframeList}>
      {keyframes.length === 0 ? (
        <Empty description="暂无关键帧" />
      ) : (
        <Timeline>
          {keyframes.map((kf, idx) => (
            <TimelineItem key={idx} dot={<Tag color="blue">{kf.time}s</Tag>} color="blue">
              <Space>
                <span className="font-semibold">{kf.property}</span>
                <span>= {kf.value}</span>
                <Text type="secondary">({kf.easing})</Text>
                <Button size="sm" variant="destructive" onClick={() => onDeleteKeyframe(idx)}>
                  <Trash2 />
                </Button>
              </Space>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </div>

    <Divider orientation="left">添加关键帧</Divider>
    <Row gutter={16}>
      <Col span={8}>
        <label className="block text-sm font-medium mb-1">时间点 (秒)</label>
        <InputNumber min={0} max={frameDuration} style={{ width: '100%' }} placeholder="0-3" />
      </Col>
      <Col span={8}>
        <label className="block text-sm font-medium mb-1">属性</label>
        <Select placeholder="选择属性">
          <SelectItem value="zoom">缩放</SelectItem>
          <SelectItem value="rotation">旋转</SelectItem>
          <SelectItem value="opacity">透明度</SelectItem>
          <SelectItem value="pan-x">水平平移</SelectItem>
          <SelectItem value="pan-y">垂直平移</SelectItem>
        </Select>
      </Col>
      <Col span={8}>
        <label className="block text-sm font-medium mb-1">值</label>
        <InputNumber style={{ width: '100%' }} placeholder="数值" />
      </Col>
    </Row>
    <Button type="dashed" block icon={<Plus />}>
      添加关键帧
    </Button>
  </div>
);

interface CompositionStudioProps {
  frames: StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (composition: CompositionProject) => void;
}

// 镜头运动类型选项
const CAMERA_MOTION_OPTIONS = [
  { value: 'static', label: '静止' },
  { value: 'pan-left', label: '左摇' },
  { value: 'pan-right', label: '右摇' },
  { value: 'tilt-up', label: '上仰' },
  { value: 'tilt-down', label: '下俯' },
  { value: 'dolly-in', label: '推进' },
  { value: 'dolly-out', label: '拉远' },
  { value: 'zoom-in', label: '放大' },
  { value: 'zoom-out', label: '缩小' },
  { value: 'shake', label: '抖动' },
];

// 转场效果选项
const TRANSITION_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'crossfade', label: '交叉淡化' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe-left', label: '左擦除' },
  { value: 'wipe-right', label: '右擦除' },
  { value: 'wipe-up', label: '上擦除' },
  { value: 'wipe-down', label: '下擦除' },
  { value: 'slide-left', label: '左滑入' },
  { value: 'slide-right', label: '右滑入' },
  { value: 'zoom', label: '缩放过渡' },
  { value: 'blur', label: '模糊过渡' },
];

// 默认转场
const DEFAULT_TRANSITION: TransitionConfig = {
  effect: 'crossfade',
  duration: 0.5,
  easing: 'ease-in-out',
};

const CompositionStudio = ({ frames, projectId, onCompositionChange }: CompositionStudioProps) => {
  const [composition, setComposition] = useState<CompositionProject>(() => ({
    id: generatePrefixedId('comp'),
    projectId: projectId ?? '',
    frames: [],
    transitions: [],
    masterSettings: {
      frameDuration: 3,
      defaultTransition: DEFAULT_TRANSITION,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameModalVisible, setFrameModalVisible] = useState(false);
  const [globalModalVisible, setGlobalModalVisible] = useState(false);
  const [keyframeModalVisible, setKeyframeModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [keyframes, setKeyframes] = useState<AnimationKeyframe[]>([]);
  const animationRef = useRef<number | null>(null);

  // Stable callback wrapper to prevent useEffect re-run on every render
  const stableOnCompositionChange = useCallback(
    (c: CompositionProject) => onCompositionChange?.(c),
    [onCompositionChange]
  );

  // 通知父组件
  useEffect(() => {
    stableOnCompositionChange(composition);
  }, [composition, stableOnCompositionChange]);

  // 初始化帧动画配置
  useEffect(() => {
    if (frames.length > 0) {
      const existingFrameIds = new Set(composition.frames.map((f) => f.frameId));
      const missingFrames = frames.filter((f) => !existingFrameIds.has(f.id));

      if (missingFrames.length > 0) {
        const newFrames = missingFrames.map((frame) => ({
          frameId: frame.id,
          cameraMotion: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          rotation: 0,
          opacity: 1,
          filters: {
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
          },
          keyframes: [], // 关键帧系统
        })) as FrameAnimation[];

        // 使用函数式更新避免直接修改状态
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setComposition((prev) => ({
          ...prev,
          frames: [...prev.frames, ...newFrames],
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  // 打开帧编辑模态框
  const handleEditFrame = useCallback((frameId: string) => {
    setEditingFrameId(frameId);
    setFrameModalVisible(true);
  }, []);

  // 打开关键帧编辑器
  const handleOpenKeyframes = useCallback(
    (frameId: string) => {
      const frameConfig = composition.frames.find((f) => f.frameId === frameId);
      setKeyframes(frameConfig?.keyframes ?? []);
      setEditingFrameId(frameId);
      setKeyframeModalVisible(true);
    },
    [composition.frames]
  );

  // 保存关键帧
  const handleSaveKeyframes = useCallback(() => {
    if (!editingFrameId) return;

    setComposition((prev) => {
      const newFrames = prev.frames.map((f) =>
        f.frameId === editingFrameId
          ? { ...f, keyframes: [...keyframes].sort((a, b) => a.time - b.time) }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    setKeyframeModalVisible(false);
    toast.success('关键帧已保存');
  }, [editingFrameId, keyframes]);

  // 删除关键帧
  const handleDeleteKeyframe = useCallback((index: number) => {
    setKeyframes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 保存帧动画配置
  const handleSaveFrame = useCallback(
    (values: Partial<FrameAnimation>) => {
      if (!editingFrameId) return;

      setComposition((prev) => {
        const newFrames = prev.frames.map((f) =>
          f.frameId === editingFrameId
            ? {
                ...f,
                ...values,
                // 确保保留关键帧
                keyframes: f.keyframes ?? [],
              }
            : f
        );
        return {
          ...prev,
          frames: newFrames,
          updatedAt: new Date().toISOString(),
        };
      });

      setFrameModalVisible(false);
      setEditingFrameId(null);
      toast.success('动画配置已保存');
    },
    [editingFrameId]
  );

  // 重置帧
  const handleResetFrame = useCallback(() => {
    if (!editingFrameId) return;

    setComposition((prev) => {
      const newFrames = prev.frames.map((f) =>
        f.frameId === editingFrameId
          ? {
              frameId: f.frameId,
              cameraMotion: null,
              zoom: 1,
              pan: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              filters: {
                blur: 0,
                brightness: 100,
                contrast: 100,
                saturation: 100,
              },
              keyframes: [],
            }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    toast.success('已重置为默认');
  }, [editingFrameId]);

  // 打开全局设置
  const handleOpenGlobalSettings = useCallback(() => {
    setGlobalModalVisible(true);
  }, []);

  // 保存全局设置
  const handleSaveGlobalSettings = useCallback(
    (values: {
      frameDuration: number;
      defaultTransition: { effect: TransitionEffect; duration: number; easing?: string };
      transitions?: TransitionConfig[];
    }) => {
      setComposition((prev) => ({
        ...prev,
        masterSettings: {
          ...prev.masterSettings,
          frameDuration: values.frameDuration,
          defaultTransition: {
            ...values.defaultTransition,
            effect: values.defaultTransition.effect as TransitionEffect,
          },
        },
        transitions: values.transitions ?? [],
        updatedAt: new Date().toISOString(),
      }));
      setGlobalModalVisible(false);
      toast.success('全局设置已保存');
    },
    []
  );

  // 预览转场效果
  const handlePreviewTransition = useCallback((_transition: TransitionConfig) => {
    // State values never read — removed to eliminate dead code
  }, []);

  // 导出合成数据
  const handleExportComposition = useCallback(() => {
    const exportData = {
      version: '1.0',
      projectId: composition.projectId,
      frames: composition.frames.map((f) => ({
        frameId: f.frameId,
        duration: composition.masterSettings.frameDuration,
        cameraMotion: f.cameraMotion,
        zoom: f.zoom,
        pan: f.pan,
        rotation: f.rotation,
        opacity: f.opacity,
        filters: f.filters,
        keyframes: f.keyframes,
      })),
      transitions: composition.transitions,
      masterSettings: composition.masterSettings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `composition-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('合成数据已导出');
  }, [composition, projectId]);

  // 播放预览
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentFrameIndex(0);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // 播放动画帧
  useEffect(() => {
    if (!isPlaying) return;

    const frameDuration = (composition.masterSettings.frameDuration * 1000) / playbackSpeed;
    const startTime = Date.now() - currentFrameIndex * frameDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const frameIndex = Math.floor(elapsed / frameDuration);

      if (frameIndex >= frames.length) {
        setIsPlaying(false);
        return;
      }

      if (frameIndex !== currentFrameIndex) {
        setCurrentFrameIndex(frameIndex);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isPlaying,
    currentFrameIndex,
    frames.length,
    composition.masterSettings.frameDuration,
    playbackSpeed,
  ]);

  // 下一帧
  const handleNext = useCallback(() => {
    if (currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentFrameIndex, frames.length]);

  // 上一帧
  const handlePrev = useCallback(() => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex((prev) => prev - 1);
    }
  }, [currentFrameIndex]);

  // 当前帧的动画配置
  const currentFrameConfig = useMemo(() => {
    return composition.frames.find((f) => f.frameId === frames[currentFrameIndex]?.id);
  }, [composition.frames, currentFrameIndex, frames]);

  // 当前帧对象
  const currentFrame = frames[currentFrameIndex];

  return (
    <div className={styles.container}>
      <Card
        title={
          <Space>
            <Video />
            <span>动态合成工作室</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<Settings />} onClick={handleOpenGlobalSettings}>
              全局设置
            </Button>
            <Button icon={<Palette />} onClick={() => setPreviewModalVisible(true)}>
              效果预览
            </Button>
            <Button
              icon={<Download />}
              onClick={handleExportComposition}
              disabled={composition.frames.length === 0}
            >
              导出数据
            </Button>
            {!isPlaying ? (
              <Button
                type="primary"
                icon={<PlayCircle />}
                onClick={handlePlay}
                disabled={frames.length === 0}
              >
                播放预览
              </Button>
            ) : (
              <Button icon={<PauseCircle />} onClick={handlePause}>
                暂停
              </Button>
            )}
            <Button
              icon={<FastForward />}
              onClick={handleNext}
              disabled={currentFrameIndex >= frames.length - 1}
            >
              下一帧
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          {/* 左侧预览区 */}
          <Col span={12}>
            <PreviewArea
              currentFrame={currentFrame}
              currentFrameConfig={currentFrameConfig}
              currentFrameIndex={currentFrameIndex}
              frameDuration={composition.masterSettings.frameDuration}
              framesLength={frames.length}
            />
          </Col>

          {/* 右侧控制面板 */}
          <Col span={12}>
            <div className={styles.controls}>
              <PlaybackControls
                currentFrameIndex={currentFrameIndex}
                framesLength={frames.length}
                playbackSpeed={playbackSpeed}
                onPrev={handlePrev}
                onNext={handleNext}
                onSpeedChange={setPlaybackSpeed}
              />
              <Divider orientation="left">全局设置</Divider>
              <Row gutter={8} align="middle">
                <Col span={12}>
                  <Text>每帧默认时长: {composition.masterSettings.frameDuration}s</Text>
                </Col>
                <Col span={12}>
                  <Button type="link" onClick={handleOpenGlobalSettings}>
                    修改
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">默认转场</Divider>
              <Row gutter={8} align="middle">
                <Col span={14}>
                  <Text>
                    {composition.masterSettings.defaultTransition.effect}(
                    {composition.masterSettings.defaultTransition.duration}s)
                  </Text>
                </Col>
                <Col span={10}>
                  <Button
                    size="small"
                    onClick={() =>
                      handlePreviewTransition(composition.masterSettings.defaultTransition)
                    }
                  >
                    预览
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">动画列表</Divider>
              <div className={styles.tableContainer}>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: 150 }}>分镜</TableHead>
                      <TableHead style={{ width: 120 }}>镜头运动</TableHead>
                      <TableHead style={{ width: 80 }}>缩放</TableHead>
                      <TableHead style={{ width: 80 }}>旋转</TableHead>
                      <TableHead style={{ width: 80 }}>透明度</TableHead>
                      <TableHead style={{ width: 80 }}>关键帧</TableHead>
                      <TableHead style={{ width: 150 }}>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {composition.frames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          暂无动画配置
                        </TableCell>
                      </TableRow>
                    ) : (
                      composition.frames.map((record) => (
                        <AnimationTableRow
                          key={record.frameId}
                          record={record}
                          frame={frames.find((f) => f.id === record.frameId)}
                          onEdit={handleEditFrame}
                          onOpenKeyframes={handleOpenKeyframes}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 帧编辑模态框 */}
      <Modal
        title={`编辑动画 - ${frames.find((f) => f.id === editingFrameId)?.title ?? ''}`}
        open={frameModalVisible}
        onCancel={() => {
          setFrameModalVisible(false);
          setEditingFrameId(null);
        }}
        width={700}
        cancelText="取消"
        footer={null}
      >
        {editingFrameId && (
          <FrameEditForm
            frameId={editingFrameId}
            initialValues={composition.frames.find((f) => f.frameId === editingFrameId)}
            onSave={handleSaveFrame}
            onReset={handleResetFrame}
          />
        )}
      </Modal>

      {/* 关键帧编辑器模态框 */}
      <Modal
        title={`关键帧编辑 - ${frames.find((f) => f.id === editingFrameId)?.title ?? ''}`}
        open={keyframeModalVisible}
        onOk={handleSaveKeyframes}
        onCancel={() => {
          setKeyframeModalVisible(false);
          setEditingFrameId(null);
        }}
        width={800}
        okText="保存关键帧"
        cancelText="取消"
      >
        <KeyframeEditorContent
          keyframes={keyframes}
          frameDuration={composition.masterSettings.frameDuration}
          onDeleteKeyframe={handleDeleteKeyframe}
        />
      </Modal>

      {/* 全局设置模态框 */}
      <Modal
        title="全局合成设置"
        open={globalModalVisible}
        onCancel={() => setGlobalModalVisible(false)}
        width={600}
        footer={null}
      >
        <GlobalSettingsForm
          initialValues={{
            frameDuration: composition.masterSettings.frameDuration,
            defaultTransition: composition.masterSettings.defaultTransition,
            transitions: composition.transitions,
          }}
          onSave={handleSaveGlobalSettings}
        />
      </Modal>

      {/* 效果预览模态框 */}
      <Modal
        title="转场效果预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className={styles.transitionPreview}>
          <div className="preview-slide">
            <Space direction="vertical">
              <span>帧 A</span>
              <Text type="secondary">转场效果演示</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompositionStudio;
export type { CompositionStudioProps };
