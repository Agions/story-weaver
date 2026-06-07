/**
 * AutoPipelineWizard — 一步式启动向导
 *
 * 用户只需要：
 * 1. 粘贴或上传小说/剧本
 * 2. 选择风格和质量等级
 * 3. 点击「开始制作」
 *
 * 之后全部交给 AI 自主完成！
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useAutoPipeline } from '../hooks/useAutoPipeline';
import type { MangaStyle, QualityLevel } from '@/core/autonomous/types/autonomous.types';

export function AutoPipelineWizard() {
  const [content, setContent] = useState('');
  const [style, setStyle] = useState<MangaStyle>('anime');
  const [quality, setQuality] = useState<QualityLevel>('balanced');
  const [title, setTitle] = useState('');

  const { start, isRunning, progress, currentStep, error } = useAutoPipeline();

  const handleStart = () => {
    if (!content.trim()) return;

    start({
      content: content.trim(),
      mode: 'novel',
      title: title.trim() || undefined,
      style,
      qualityLevel: quality,
      enableSelfReview: true,
      maxReviewRetries: 3,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 标题区 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI 全自动漫剧制作</h1>
        <p className="text-muted-foreground">
          粘贴你的小说或剧本，AI 自动完成从剧本解析到成片导出的全部工作
        </p>
      </div>

      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle>第一步：提交你的故事</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 项目名称 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">项目名称（可选）</label>
            <input
              type="text"
              placeholder="给你的项目起个名字..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={isRunning}
            />
          </div>

          {/* 内容输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">小说/剧本内容 *</label>
            <Textarea
              placeholder="粘贴你的小说、剧本或故事内容在这里...&#10;&#10;支持格式：&#10;- 纯文本小说&#10;- 剧本格式（带场景描述和对话）&#10;- 直接粘贴网文内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              disabled={isRunning}
            />
            <p className="text-xs text-muted-foreground">
              字数：{content.length} 字符
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 选项区 */}
      <Card>
        <CardHeader>
          <CardTitle>第二步：选择风格和品质</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {/* 风格选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">视觉风格</label>
            <Select
              value={style}
              onValueChange={(v) => setStyle(v as MangaStyle)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anime">动漫风格（推荐）</SelectItem>
                <SelectItem value="2d">2D 漫画</SelectItem>
                <SelectItem value="3d">3D 建模</SelectItem>
                <SelectItem value="realistic">仿真人</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 质量等级 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">质量等级</label>
            <Select
              value={quality}
              onValueChange={(v) => setQuality(v as QualityLevel)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">快速（生成快，成本低）</SelectItem>
                <SelectItem value="balanced">均衡（推荐）</SelectItem>
                <SelectItem value="premium">精品（最优质，速度慢）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 开始按钮 */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={isRunning || !content.trim()}
          className="w-full max-w-xs"
        >
          {isRunning ? 'AI 正在制作中...' : '🚀 开始全自动制作'}
        </Button>

        {/* 进度显示 */}
        {isRunning && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              AI 正在工作中，请稍候...（中途可关闭页面，再次打开自动继续）
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
