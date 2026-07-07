/**
 * AIBriefingPanel — AI 任务简报面板
 *
 * 展示当前 AI 正在执行的任务：
 * - 任务目标
 * - 为什么要这样做
 * - 正在调用哪个模型
 * - 预计耗时
 */

import { Bot, Brain, Zap, Clock } from 'lucide-react';

import { cn } from '@/shared/utils/class-names';

interface AIBriefingPanelProps {
  stepId: string;
  stepName: string;
  model?: string;
  estimatedTime?: number; // seconds
  reason?: string;
  className?: string;
}

const STEP_BRIEFINGS: Record<
  string,
  {
    goal: string;
    reason: string;
    model: string;
    defaultTime: number;
  }
> = {
  'step-import': {
    goal: '解析原材料',
    reason: '自动识别小说/剧本格式，智能切分章节',
    model: '内置解析器',
    defaultTime: 10,
  },
  'step-analysis': {
    goal: '分析故事结构',
    reason: '识别人物、场景、情节曲线和情绪爆点',
    model: 'GLM-5 / M2.5',
    defaultTime: 60,
  },
  'step-script': {
    goal: '生成视频剧本',
    reason: '将小说文本转化为结构化的视频分镜脚本',
    model: 'GLM-5',
    defaultTime: 120,
  },
  'step-character': {
    goal: '设计角色',
    reason: '生成角色设定卡，保证跨镜头一致性',
    model: 'Seedream 5.0 + GLM-5',
    defaultTime: 180,
  },
  'step-scene': {
    goal: '规划场景',
    reason: '规划全局场景布局、色彩基调和氛围',
    model: 'GLM-5',
    defaultTime: 60,
  },
  'step-storyboard': {
    goal: '生成分镜',
    reason: '生成每个镜头的参考图和动作描述',
    model: 'Seedream 5.0',
    defaultTime: 300,
  },
  'step-render': {
    goal: '批量渲染',
    reason: 'AI 批量生成所有关键帧图像',
    model: 'Seedream 5.0 / Kling 1.6',
    defaultTime: 600,
  },
  'step-video-edit': {
    goal: '剪辑合成',
    reason: '将帧序列合成为连续视频，添加转场',
    model: 'FFmpeg WASM',
    defaultTime: 120,
  },
  'step-audio': {
    goal: '配音合成',
    reason: '文字转语音，生成角色对话和旁白',
    model: 'Edge TTS / CosyVoice 2.0',
    defaultTime: 180,
  },
  'step-subtitle': {
    goal: '字幕嵌入',
    reason: '生成时间轴字幕并嵌入视频',
    model: '内置字幕引擎',
    defaultTime: 60,
  },
  'step-export': {
    goal: '导出成片',
    reason: '最终编码输出 MP4/WebM 文件',
    model: 'FFmpeg WASM',
    defaultTime: 120,
  },
};

export function AIBriefingPanel({
  stepId,
  stepName,
  model,
  estimatedTime,
  reason,
  className,
}: AIBriefingPanelProps) {
  const briefing = STEP_BRIEFINGS[stepId] ?? {
    goal: '处理中...',
    reason: reason ?? 'AI 正在工作中',
    model: model ?? '—',
    defaultTime: 60,
  };

  const time = estimatedTime ?? briefing.defaultTime;
  const timeLabel = time < 60 ? `${time}秒` : `${Math.round(time / 60)}分钟`;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50',
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-500" />
        <span className="font-medium text-blue-900">{stepName}</span>
      </div>

      {/* 目标 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>任务目标</span>
        </div>
        <p className="text-sm font-medium">{briefing.goal}</p>
      </div>

      {/* 原因 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brain className="w-3 h-3" />
          <span>为什么要这样做</span>
        </div>
        <p className="text-sm">{briefing.reason}</p>
      </div>

      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>调用模型：</span>
          <span className="font-mono text-blue-600">{model ?? briefing.model}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>预计 {timeLabel}</span>
        </div>
      </div>
    </div>
  );
}
