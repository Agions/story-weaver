import {
  Scissors,
  Volume2,
  Type,
  Zap,
  Bot,
  Lightbulb,
  CheckCircle,
  Clock,
  Video,
  Image,
  Palette,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

import styles from './AIFeaturePanel.module.less';

interface AIFeaturePanelProps {
  onFeatureSelect?: (feature: string) => void;
  selectedFeature?: string;
  processingStatus?: {
    [key: string]: 'idle' | 'processing' | 'completed' | 'error';
  };
}

// AI 功能列表
const aiFeatures = [
  {
    key: 'smartClip',
    icon: <Scissors size={18} />,
    title: '智能剪辑',
    description: 'AI 自动识别精彩片段',
    tag: 'AI',
    tagColor: '#6366f1'
  },
  {
    key: 'smartDub',
    icon: <Volume2 size={18} />,
    title: '智能配音',
    description: '文字转语音，情感合成',
    tag: 'AI',
    tagColor: '#ec4899'
  },
  {
    key: 'subtitle',
    icon: <Type size={18} />,
    title: '字幕生成',
    description: '语音识别自动生成字幕',
    tag: 'AI',
    tagColor: '#14b8a6'
  },
  {
    key: 'autoHighlight',
    icon: <Zap size={18} />,
    title: '精彩时刻',
    description: '自动识别高能片段',
    tag: 'AI',
    tagColor: '#f59e0b'
  },
  {
    key: 'storyline',
    icon: <Bot size={18} />,
    title: '故事线',
    description: 'AI 生成视频叙事结构',
    tag: 'Beta',
    tagColor: '#8b5cf6'
  },
  {
    key: 'bRoll',
    icon: <Image size={18} />,
    title: 'B-Roll',
    description: '智能推荐辅助镜头',
    tag: 'AI',
    tagColor: '#10b981'
  },
  {
    key: 'background',
    icon: <Palette size={18} />,
    title: '背景音乐',
    description: '智能匹配背景音乐',
    tag: 'AI',
    tagColor: '#3b82f6'
  },
  {
    key: 'colorGrade',
    icon: <Lightbulb size={18} />,
    title: '智能调色',
    description: '一键电影级调色',
    tag: 'AI',
    tagColor: '#ef4444'
  }
];

const AIFeaturePanel: React.FC<AIFeaturePanelProps> = ({
  onFeatureSelect,
  selectedFeature,
  processingStatus = {}
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Zap size={14} className={styles.spinIcon} style={{ color: '#3b82f6' }} />;
      case 'completed':
        return <CheckCircle size={14} style={{ color: '#10b981' }} />;
      case 'error':
        return <Clock size={14} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h5 className={styles.title}>
          <Bot size={18} className={styles.aiIcon} />
          AI 功能
        </h5>
        <span className={styles.subtitle}>
          点击使用 AI 能力
        </span>
      </div>

      <Separator className={styles.divider} />

      <div className={styles.featureList}>
        {aiFeatures.map((item) => {
          const status = processingStatus[item.key] || 'idle';
          const isSelected = selectedFeature === item.key;

          return (
            <div
              key={item.key}
              className={`${styles.featureItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => onFeatureSelect?.(item.key)}
            >
              <div className={styles.featureContent}>
                <div className={styles.featureIcon}>
                  {status === 'processing' ? (
                    <Zap size={18} className={styles.spinIcon} />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className={styles.featureInfo}>
                  <div className={styles.featureTitle}>
                    {item.title}
                    <span
                      className={styles.featureTag}
                      style={{ backgroundColor: item.tagColor }}
                    >
                      {item.tag}
                    </span>
                    {getStatusIcon(status)}
                  </div>
                  <span className={styles.featureDesc}>
                    {item.description}
                  </span>
                </div>
              </div>

              {status === 'processing' && (
                <Progress
                  value={50}
                  className={styles.progressBar}
                />
              )}
            </div>
          );
        })}
      </div>

      <Separator className={styles.divider} />

      <div className={styles.quickActions}>
        <h5 className={styles.sectionTitle}>
          快速操作
        </h5>
        <div className={styles.actionButtons}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className={styles.actionBtn}>
                <Zap size={14} /> 一键成片
              </Button>
            </TooltipTrigger>
            <TooltipContent>批量处理</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className={styles.actionBtn}>
                <Video size={14} /> 内容分析
              </Button>
            </TooltipTrigger>
            <TooltipContent>智能识别</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className={styles.actionBtn}>
                <Settings size={14} /> 导出
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出设置</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className={styles.aiTip}>
        <Lightbulb size={14} className={styles.tipIcon} />
        <span className={styles.tipText}>
          提示：使用 AI 功能前请先加载视频素材
        </span>
      </div>
    </div>
  );
};

export default AIFeaturePanel;