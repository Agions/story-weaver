/**
 * FinalPreview — 成片预览与下载
 *
 * Pipeline 完成后展示：
 * - 视频预览
 * - 元数据（时长、分辨率、文件大小）
 * - 下载按钮
 * - 分享链接
 */

import { Download, Share2, Check, Film, Clock, HardDrive, Layers, User, Image } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatChineseDuration } from '@/shared/utils/format';

import { useAutoPipelineStore, selectResult } from '../stores/autoPipelineStore';

export function FinalPreview() {
  const result = useAutoPipelineStore(selectResult);
  const [copied, setCopied] = useState(false);

  if (!result?.success || !result.outputPath) {
    return null;
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(result.outputPath!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* 成功提示 */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold">漫剧制作完成！</h2>
        <p className="text-muted-foreground">你的故事已成功转化为漫剧视频</p>
      </div>

      {/* 视频预览 */}
      <Card>
        <CardContent className="p-0">
          <video src={result.outputPath} controls className="w-full rounded-lg" poster="">
            你的浏览器不支持视频播放
          </video>
        </CardContent>
      </Card>

      {/* 元数据 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">成片信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">时长</p>
                <p className="font-medium">{formatChineseDuration(result.duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">分辨率</p>
                <p className="font-medium">{result.resolution ?? '1080p'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">文件大小</p>
                <p className="font-medium">{formatSize(result.fileSize)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">场景数</p>
                <p className="font-medium">{result.sceneCount ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">角色数</p>
                <p className="font-medium">{result.characterCount ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">渲染帧数</p>
                <p className="font-medium">{result.renderedFrames ?? '—'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button size="lg" asChild>
          <a href={result.outputPath} download>
            <Download className="w-4 h-4 mr-2" />
            下载 MP4
          </a>
        </Button>
        <Button size="lg" variant="outline" onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              已复制链接
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 mr-2" />
              分享链接
            </>
          )}
        </Button>
      </div>

      {/* 步骤耗时 */}
      {result.stepDurations && Object.keys(result.stepDurations).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">各步骤耗时</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(result.stepDurations).map(([stepId, duration]) => (
                <div key={stepId} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{stepId}</span>
                  <span>{Math.round((duration as number) / 1000)}秒</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
