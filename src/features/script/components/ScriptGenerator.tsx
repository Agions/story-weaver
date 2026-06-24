/**
 * 脚本生成器组件
 * 专业的 AI 脚本生成界面
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit,
  Zap,
  Clock,
  FileText,
  User,
  Globe,
  CheckCircle,
  Loader,
  Settings,
} from 'lucide-react';
import { useState, useCallback } from 'react';

import { useModel, useModelCost } from '@/core/hooks/useModel';
import { useProject } from '@/core/hooks/useProject';
import ModelSelector from '@/features/ai/components/ModelSelector';
import { Alert } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card as CardBase } from '@/shared/components/ui/card';
import { Divider } from '@/shared/components/ui/divider';
import { Input } from '@/shared/components/ui/input';
import { Progress } from '@/shared/components/ui/progress';
import { RadioGroup, Radio, RadioButton } from '@/shared/components/ui/radio-group';
import { AntDSelect as Select } from '@/shared/components/ui/select';
import { Space } from '@/shared/components/ui/space';
import { Tag } from '@/shared/components/ui/tag';
import { toast } from '@/shared/components/ui/toast';
import { Text, Title, Paragraph } from '@/shared/components/ui/typography';
import type { Script, ScriptSegment } from '@/shared/types';
import { delay } from '@/shared/utils';

import styles from './ScriptGenerator.module.less';

// 脚本风格选项
const STYLE_OPTIONS = [
  { value: 'professional', label: '专业正式', desc: '适合商业、教育类视频' },
  { value: 'casual', label: '轻松随意', desc: '适合生活、娱乐类视频' },
  { value: 'humorous', label: '幽默风趣', desc: '适合搞笑、娱乐类视频' },
  { value: 'emotional', label: '情感共鸣', desc: '适合故事、情感类视频' },
  { value: 'technical', label: '技术讲解', desc: '适合教程、科普类视频' },
  { value: 'promotional', label: '营销推广', desc: '适合产品、广告类视频' },
];

// 语气选项
const TONE_OPTIONS = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'authoritative', label: '权威专业' },
  { value: 'enthusiastic', label: '热情激昂' },
  { value: 'calm', label: '平静沉稳' },
  { value: 'humorous', label: '幽默诙谐' },
];

// 长度选项
const LENGTH_OPTIONS = [
  { value: 'short', label: '简短', desc: '1-3分钟', words: '300-500字' },
  { value: 'medium', label: '适中', desc: '3-5分钟', words: '500-800字' },
  { value: 'long', label: '详细', desc: '5-10分钟', words: '800-1500字' },
];

// 目标受众
const AUDIENCE_OPTIONS = [
  { value: 'general', label: '普通大众' },
  { value: 'professional', label: '专业人士' },
  { value: 'student', label: '学生群体' },
  { value: 'business', label: '商务人士' },
  { value: 'tech', label: '技术爱好者' },
  { value: 'elderly', label: '中老年群体' },
];

// 表单值类型
type ScriptFormValues = {
  topic: string;
  keywords?: string[];
  style: string;
  tone: string;
  length: string;
  audience: string;
  language: string;
  requirements?: string;
};

interface ScriptGeneratorProps {
  projectId?: string;
  videoDuration?: number;
  onGenerate?: (script: Script) => void;
  onSave?: (script: Script) => void;
}

export function ScriptGenerator({
  projectId,
  videoDuration: _videoDuration,
  onGenerate,
  onSave,
}: ScriptGeneratorProps) {
  const { updateScript } = useProject(projectId);
  const { selectedModel, isConfigured } = useModel();
  const { estimateScriptCost, formatCost } = useModelCost();

  // form refactor 2026-06-04: removed <Form>/<FormItem>/useForm AntD-style bridge.
  // The script generator config is a flat bag of 8 primitive fields with no
  // cross-field validation, so plain useState is the simplest correct form
  // library here. The handleGenerate callback already received a FormValues
  // dict from <Form> onFinish — rewrap the 8 fields into the same shape.
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [style, setStyle] = useState('professional');
  const [tone, setTone] = useState('friendly');
  const [length, setLength] = useState('medium');
  const [audience, setAudience] = useState('general');
  const [language, setLanguage] = useState('zh');
  const [requirements, setRequirements] = useState('');

  const buildFormValues = () => ({
    topic,
    keywords,
    style,
    tone,
    length,
    audience,
    language,
    requirements,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // 估算成本
  const estimatedCost = useCallback(() => {
    const currentLength = buildFormValues().length;
    const wordCount = LENGTH_OPTIONS.find((l) => l.value === currentLength)?.words || '500-800字';
    const avgWords = parseInt(wordCount.split('-')[0]) + 200;
    return formatCost(estimateScriptCost(avgWords));
  }, [buildFormValues, estimateScriptCost, formatCost]);

  // 生成脚本
  const handleGenerate = useCallback(
    async (values?: ScriptFormValues) => {
      const formData = values ?? (buildFormValues() as unknown as ScriptFormValues);
      if (!selectedModel) {
        toast.warning('请先选择 AI 模型');
        setShowModelSelector(true);
        return;
      }

      if (!isConfigured) {
        toast.warning('请先配置 API 密钥');
        return;
      }

      setIsGenerating(true);
      setProgress(0);

      try {
        // 模拟生成过程
        const steps = [
          { progress: 10, message: '分析视频内容...', delay: 800 },
          { progress: 30, message: '提取关键信息...', delay: 1000 },
          { progress: 50, message: '构建脚本结构...', delay: 1200 },
          { progress: 70, message: '生成脚本内容...', delay: 1500 },
          { progress: 90, message: '优化语言表达...', delay: 1000 },
        ];

        for (const step of steps) {
          await delay(step.delay);
          setProgress(step.progress);
        }

        // 生成模拟脚本
        const script: Script = {
          id: `script_${Date.now()}`,
          title: formData.topic || '生成的脚本',
          content: generateMockScript(formData),
          segments: generateMockSegments(formData),
          metadata: {
            style: formData.style,
            tone: formData.tone,
            length: formData.length as 'short' | 'medium' | 'long',
            targetAudience: formData.audience,
            language: formData.language || 'zh',
            wordCount: estimateWordCount(formData.length),
            estimatedDuration: estimateDuration(formData.length),
            generatedBy: selectedModel.id,
            generatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setProgress(100);
        setGeneratedScript(script);
        onGenerate?.(script);
        toast.success('脚本生成成功');
      } catch {
        toast.error('脚本生成失败');
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedModel, isConfigured, onGenerate]
  );

  // 保存脚本
  const handleSave = useCallback(() => {
    if (generatedScript) {
      updateScript(generatedScript);
      onSave?.(generatedScript);
      toast.success('脚本已保存');
    }
  }, [generatedScript, updateScript, onSave]);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    void handleGenerate();
  }, [handleGenerate]);

  return (
    <div className={styles.container}>
      <Title level={4} className={styles.title}>
        <Edit /> AI 脚本生成器
      </Title>

      {/* 模型选择 */}
      <CardBase className={styles.modelCard}>
        <div className={styles.modelHeader}>
          <Space>
            <Text type="secondary">当前模型:</Text>
            {selectedModel ? (
              <Badge
                status={isConfigured ? 'success' : 'warning'}
                text={
                  <Space>
                    <Text>{selectedModel.name}</Text>
                    <Tag color={isConfigured ? 'success' : 'warning'}>
                      {isConfigured ? '已配置' : '未配置'}
                    </Tag>
                  </Space>
                }
              />
            ) : (
              <Text type="secondary">未选择</Text>
            )}
          </Space>
          <Button
            type="link"
            icon={<Settings />}
            onClick={() => setShowModelSelector(!showModelSelector)}
          >
            {showModelSelector ? '收起' : '更改'}
          </Button>
        </div>

        <AnimatePresence>
          {showModelSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Divider />
              <ModelSelector
                taskType="script"
                compact
                onSelect={() => setShowModelSelector(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardBase>

      {/* 生成表单 — 原 <Form>/<FormItem> 桥接被移除，改为原生 <form> + 受控 state */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleGenerate();
        }}
        className={styles.form}
      >
        <CardBase title="脚本设置" className={styles.settingsCard}>
          <label className="block text-sm font-medium mb-1">脚本主题</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：如何制作一杯完美的拿铁咖啡"
            prefix={<FileText />}
          />

          <label className="block text-sm font-medium mb-1">关键词（可选）</label>
          <Select
            value={keywords}
            mode="tags"
            placeholder="输入关键词，按回车添加"
            style={{ width: '100%' }}
            onChange={(v) => setKeywords(v as string[])}
          />

          <label className="block text-sm font-medium mb-1">脚本风格</label>
          <RadioGroup optionType="button" buttonStyle="solid" value={style} onChange={setStyle}>
            {STYLE_OPTIONS.map((opt) => (
              <RadioButton key={opt.value} value={opt.value}>
                <span title={opt.desc}>{opt.label}</span>
              </RadioButton>
            ))}
          </RadioGroup>

          <label className="block text-sm font-medium mb-1">语气语调</label>
          <RadioGroup optionType="button" value={tone} onChange={setTone}>
            {TONE_OPTIONS.map((opt) => (
              <RadioButton key={opt.value} value={opt.value}>
                {opt.label}
              </RadioButton>
            ))}
          </RadioGroup>

          <label className="block text-sm font-medium mb-1">脚本长度</label>
          <RadioGroup optionType="button" value={length} onChange={setLength}>
            {LENGTH_OPTIONS.map((opt) => (
              <RadioButton key={opt.value} value={opt.value}>
                <span title={`${opt.desc}，约${opt.words}`}>{opt.label}</span>
              </RadioButton>
            ))}
          </RadioGroup>

          <label className="block text-sm font-medium mb-1">目标受众</label>
          <Select
            value={audience}
            placeholder="选择目标受众"
            options={AUDIENCE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            onChange={(v) => setAudience(v as string)}
          />

          <label className="block text-sm font-medium mb-1">语言</label>
          <RadioGroup value={language} onChange={setLanguage}>
            <Radio value="zh">中文</Radio>
            <Radio value="en">English</Radio>
          </RadioGroup>

          <label className="block text-sm font-medium mb-1">特殊要求（可选）</label>
          <textarea
            rows={3}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="例如：需要包含产品介绍、使用步骤、注意事项等"
          />
        </CardBase>

        {/* 生成按钮 */}
        <div className={styles.actions}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={isGenerating ? <Loader /> : <Zap />}
              htmlType="submit"
              disabled={isGenerating || !selectedModel || !isConfigured}
              block
            >
              {isGenerating ? '生成中...' : '生成脚本'}
            </Button>

            {isGenerating && <Progress value={progress} />}

            <Alert>预估成本: {estimatedCost()}</Alert>
          </Space>
        </div>
      </form>

      {/* 生成结果 */}
      <AnimatePresence>
        {generatedScript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CardBase
              title={
                <Space>
                  <CheckCircle style={{ color: '#52c41a' }} />
                  <span>生成结果</span>
                </Space>
              }
              className={styles.resultCard}
              extra={
                <Space>
                  <Button onClick={handleRegenerate} icon={<Zap />}>
                    重新生成
                  </Button>
                  <Button type="primary" onClick={handleSave} icon={<CheckCircle />}>
                    保存脚本
                  </Button>
                </Space>
              }
            >
              <div className={styles.scriptContent}>
                <Title level={5}>{generatedScript.title}</Title>
                <Paragraph>{generatedScript.content}</Paragraph>
              </div>

              <Divider />

              <div className={styles.scriptMeta}>
                <Space wrap>
                  <Tag icon={<FileText />}>{generatedScript.metadata?.wordCount ?? 0} 字</Tag>
                  <Tag icon={<Clock />}>
                    约 {generatedScript.metadata?.estimatedDuration ?? 0} 分钟
                  </Tag>
                  <Tag icon={<User />}>
                    {
                      AUDIENCE_OPTIONS.find(
                        (a) => a.value === generatedScript.metadata?.targetAudience
                      )?.label
                    }
                  </Tag>
                  <Tag icon={<Globe />}>
                    {generatedScript.metadata?.language === 'zh' ? '中文' : 'English'}
                  </Tag>
                </Space>
              </div>
            </CardBase>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 辅助函数
function generateMockScript(values: ScriptFormValues): string {
  return `欢迎来到${values.topic}！

今天我们将一起探索这个精彩的主题。

首先，让我们了解一下基本概念。${values.topic}是一个非常重要的话题，它影响着我们的日常生活。

在接下来的内容中，我将为大家详细介绍：
1. 核心概念和原理
2. 实际应用场景
3. 注意事项和技巧
4. 常见问题解答

希望通过这个视频，能够帮助大家更好地理解${values.topic}。让我们开始吧！`;
}

function generateMockSegments(_values: ScriptFormValues): ScriptSegment[] {
  return [
    { id: '1', startTime: 0, endTime: 10, content: '开场介绍', type: 'narration' },
    { id: '2', startTime: 10, endTime: 60, content: '核心概念讲解', type: 'narration' },
    { id: '3', startTime: 60, endTime: 120, content: '实际演示', type: 'action' },
    { id: '4', startTime: 120, endTime: 150, content: '总结回顾', type: 'narration' },
  ];
}

function estimateWordCount(length: string): number {
  const map: Record<string, number> = { short: 400, medium: 650, long: 1150 };
  return map[length] || 650;
}

function estimateDuration(length: string): number {
  const map: Record<string, number> = { short: 2, medium: 4, long: 7 };
  return map[length] || 4;
}

export default ScriptGenerator;
