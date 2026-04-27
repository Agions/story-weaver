import React, { useState } from 'react';
import { 
  Robot, Send, Scissors, Audio, Lightbulb, Zap, FlaskConical
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Text, Title, Paragraph } from '@/components/ui/typography';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import styles from './AIAssistant.module.less';

// Simple collapsible component for "advanced options"
interface CollapsibleProps {
  header: React.ReactNode;
  children: React.ReactNode;
  ghost?: boolean;
  className?: string;
}

const Collapsible: React.FC<CollapsibleProps> = ({ header, children, ghost, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`${ghost ? '' : 'border rounded-md'} ${className || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:underline ${ghost ? '' : 'bg-background'}`}
      >
        <span>{header}</span>
        <span className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="px-4 pb-4 text-sm">{children}</div>}
    </div>
  );
};

interface AIAssistantProps {}

const AIAssistant: React.FC<AIAssistantProps> = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [selectedLang, setSelectedLang] = useState('zh');
  const [subtitleFormat, setSubtitleFormat] = useState('srt');
  const [translateLang, setTranslateLang] = useState('');
  const [smartCutMode, setSmartCutMode] = useState('content');
  const [targetDuration, setTargetDuration] = useState('auto');
  const [autoSegment, setAutoSegment] = useState(true);
  const [filterFiller, setFilterFiller] = useState(true);
  const [removeSilence, setRemoveSilence] = useState(true);
  const [optimizeTransition, setOptimizeTransition] = useState(true);
  const [precision, setPrecision] = useState(80);
  const [keyContentPriority, setKeyContentPriority] = useState(70);
  const [sceneSensitivity, setSceneSensitivity] = useState(50);

  const [messages, setMessages] = useState<any[]>([
    {
      role: 'ai',
      content: '您好!我是您的AI视频助手。我可以帮助您生成字幕、智能剪辑片段、提供内容建议以及增强视频效果。请告诉我您需要什么帮助?',
      time: new Date()
    }
  ]);

  // AI模型选项
  const models = [
    { id: 'gpt-4o', name: 'GPT-4o (通用)', provider: 'openai' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus (高精度)', provider: 'anthropic' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (多模态)', provider: 'google' },
    { id: 'ernie-4.0', name: '文心一言 (中文优化)', provider: 'baidu' }
  ];

  // 字幕语言选项
  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' }
  ];

  // 发送消息
  const sendMessage = () => {
    if (!prompt.trim()) return;

    const userMessage = {
      role: 'user',
      content: prompt,
      time: new Date()
    };
    setMessages([...messages, userMessage]);
    setPrompt('');

    setProcessing(true);
    setTimeout(() => {
      const aiResponse = {
        role: 'ai',
        content: `我将帮您完成"${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"。正在处理您的请求...`,
        time: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setProcessing(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 生成字幕
  const generateSubtitles = () => {
    setProcessing(true);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);

        const resultMessage = {
          role: 'ai',
          content: '已成功生成字幕!字幕已经添加到时间轴上,您可以在编辑器中查看和修改。',
          time: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
      }
    }, 300);
  };

  // 智能剪辑
  const smartCut = () => {
    setProcessing(true);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 3;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setProcessing(false);

        const resultMessage = {
          role: 'ai',
          content: '智能剪辑完成!已为您移除了沉默部分并优化了节奏。可以在时间轴上查看剪辑结果。',
          time: new Date()
        };
        setMessages(prev => [...prev, resultMessage]);
      }
    }, 200);
  };

  // 渲染聊天消息
  const renderMessages = () => {
    return messages.map((message, index) => (
      <div
        key={index}
        className={`${styles.message} ${message.role === 'ai' ? styles.aiMessage : styles.userMessage}`}
      >
        <div className={styles.messageAvatar}>
          {message.role === 'ai' ? (
            <Avatar className={styles.aiAvatar}>
              <Robot size={20} />
            </Avatar>
          ) : (
            <Avatar
              className={styles.userAvatar}
              style={{
                backgroundColor: '#1890ff',
                color: '#fff'
              }}
            >
              U
            </Avatar>
          )}
        </div>
        <div className={styles.messageContent}>
          <div className={styles.messageText}>
            {message.content}
          </div>
          <div className={styles.messageTime}>
            {new Date(message.time).toLocaleTimeString()}
          </div>
        </div>
      </div>
    ));
  };

  return (
    <TooltipProvider>
    <div className={styles.aiAssistantContainer}>
      <div className={styles.aiHeader}>
        <Title level={4} className={styles.aiTitle}>
          <Robot className={styles.aiIcon} /> AI助手
        </Title>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={styles.aiTabs}
      >
        <TabsList>
          <TabsTrigger value="chat">智能对话</TabsTrigger>
          <TabsTrigger value="subtitles">字幕生成</TabsTrigger>
          <TabsTrigger value="smartcut">智能剪辑</TabsTrigger>
          <TabsTrigger value="enhance">视频增强</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className={styles.chatContainer}>
            <div className={styles.chatMessages}>
              {renderMessages()}
            </div>

            <div className={styles.chatInput}>
              <div className={styles.modelSelector}>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger style={{ width: '100%' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="请描述您需要的帮助..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                disabled={processing}
                className="resize-none"
              />
              <Button
                variant="default"
                onClick={sendMessage}
                disabled={!prompt.trim() || processing}
                className={styles.sendButton}
              >
                <Send />
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subtitles">
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <CardHeader>
                <CardTitle>自动生成字幕</CardTitle>
              </CardHeader>
              <CardContent>
                <Paragraph className={styles.toolDescription}>
                  使用AI识别视频中的语音内容,自动生成字幕并添加到时间轴
                </Paragraph>

                <div className={styles.toolOptions}>
                  <div className={styles.optionItem}>
                    <Text>识别语言</Text>
                    <Select value={selectedLang} onValueChange={setSelectedLang}>
                      <SelectTrigger style={{ width: '100%' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={styles.optionItem}>
                    <Text>字幕格式</Text>
                    <Select value={subtitleFormat} onValueChange={setSubtitleFormat}>
                      <SelectTrigger style={{ width: '100%' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="srt">SRT</SelectItem>
                        <SelectItem value="vtt">VTT</SelectItem>
                        <SelectItem value="ass">ASS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.switchOption}>
                      <Switch
                        checked={autoSegment}
                        onCheckedChange={setAutoSegment}
                      />
                      <Text>自动分段</Text>
                      <Tooltip>
                        <TooltipTrigger><HelpCircle /></TooltipTrigger>
                        <TooltipContent>根据语义自动将字幕分成多个段落</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.switchOption}>
                      <Switch
                        checked={filterFiller}
                        onCheckedChange={setFilterFiller}
                      />
                      <Text>过滤语气词</Text>
                      <Tooltip>
                        <TooltipTrigger><HelpCircle /></TooltipTrigger>
                        <TooltipContent>移除'嗯'、'啊'等语气词,使字幕更加清晰</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  onClick={generateSubtitles}
                  disabled={processing}
                  className="w-full mt-4"
                >
                  <Languages />
                  {processing && activeTab === 'subtitles' ? '生成中...' : '开始生成字幕'}
                </Button>

                {processing && activeTab === 'subtitles' && (
                  <div className={styles.progressContainer}>
                    <Progress value={progress} />
                    <div className={styles.progressStatus}>
                      {progress < 30 && '正在分析音频...'}
                      {progress >= 30 && progress < 60 && '识别语音内容...'}
                      {progress >= 60 && progress < 90 && '生成字幕文件...'}
                      {progress >= 90 && '完成中...'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Collapsible
              header="高级选项"
              ghost
              className={styles.extraOptions}
            >
              <div className={styles.advancedOptions}>
                <div className={styles.optionItem}>
                  <Text>识别精度</Text>
                  <Slider
                    value={precision}
                    onValueChange={setPrecision}
                    max={100}
                    min={0}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>快速</span>
                    <span>标准</span>
                    <span>高精度</span>
                  </div>
                </div>

                <div className={styles.optionItem}>
                  <Text>翻译字幕</Text>
                  <Select value={translateLang} onValueChange={setTranslateLang}>
                    <SelectTrigger style={{ width: '100%' }}>
                      <SelectValue placeholder="选择目标语言(可选)" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.filter(lang => lang.code !== 'zh').map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Collapsible>
          </div>
        </TabsContent>

        <TabsContent value="smartcut">
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <CardHeader>
                <CardTitle>智能剪辑</CardTitle>
              </CardHeader>
              <CardContent>
                <Paragraph className={styles.toolDescription}>
                  AI分析视频内容,自动移除不需要的部分,保留精华片段
                </Paragraph>

                <div className={styles.toolOptions}>
                  <div className={styles.optionItem}>
                    <Text>剪辑模式</Text>
                    <Select value={smartCutMode} onValueChange={setSmartCutMode}>
                      <SelectTrigger style={{ width: '100%' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">内容优先</SelectItem>
                        <SelectItem value="pace">节奏优先</SelectItem>
                        <SelectItem value="compact">精简模式</SelectItem>
                        <SelectItem value="highlight">亮点提取</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={styles.optionItem}>
                    <Text>目标时长</Text>
                    <Select value={targetDuration} onValueChange={setTargetDuration}>
                      <SelectTrigger style={{ width: '100%' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">自动优化</SelectItem>
                        <SelectItem value="30">30秒</SelectItem>
                        <SelectItem value="60">1分钟</SelectItem>
                        <SelectItem value="120">2分钟</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.switchOption}>
                      <Switch
                        checked={removeSilence}
                        onCheckedChange={setRemoveSilence}
                      />
                      <Text>移除沉默</Text>
                      <Tooltip>
                        <TooltipTrigger><HelpCircle /></TooltipTrigger>
                        <TooltipContent>自动检测并移除视频中的沉默部分</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.switchOption}>
                      <Switch
                        checked={optimizeTransition}
                        onCheckedChange={setOptimizeTransition}
                      />
                      <Text>优化转场</Text>
                      <Tooltip>
                        <TooltipTrigger><HelpCircle /></TooltipTrigger>
                        <TooltipContent>在剪辑点添加平滑转场效果</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <Button
                  variant="default"
                  onClick={smartCut}
                  disabled={processing}
                  className="w-full mt-4"
                >
                  <Scissors />
                  {processing && activeTab === 'smartcut' ? '剪辑中...' : '开始智能剪辑'}
                </Button>

                {processing && activeTab === 'smartcut' && (
                  <div className={styles.progressContainer}>
                    <Progress value={progress} />
                    <div className={styles.progressStatus}>
                      {progress < 30 && '分析视频内容...'}
                      {progress >= 30 && progress < 60 && '识别关键片段...'}
                      {progress >= 60 && progress < 90 && '优化剪辑点...'}
                      {progress >= 90 && '完成中...'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Collapsible
              header="高级选项"
              ghost
              className={styles.extraOptions}
            >
              <div className={styles.advancedOptions}>
                <div className={styles.optionItem}>
                  <Text>关键内容优先级</Text>
                  <Slider
                    value={keyContentPriority}
                    onValueChange={setKeyContentPriority}
                    max={100}
                    min={0}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>低</span>
                    <span>中</span>
                    <span>高</span>
                  </div>
                </div>

                <div className={styles.optionItem}>
                  <Text>场景检测灵敏度</Text>
                  <Slider
                    value={sceneSensitivity}
                    onValueChange={setSceneSensitivity}
                    max={100}
                    min={0}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>低</span>
                    <span>中</span>
                    <span>高</span>
                  </div>
                </div>
              </div>
            </Collapsible>
          </div>
        </TabsContent>

        <TabsContent value="enhance">
          <div className={styles.toolContainer}>
            <Card className={styles.toolCard}>
              <CardHeader>
                <CardTitle>视频增强</CardTitle>
              </CardHeader>
              <CardContent>
                <Paragraph className={styles.toolDescription}>
                  AI提升视频质量,修复问题并应用智能效果
                </Paragraph>

                <div className={styles.enhanceOptions}>
                  <div className={styles.enhanceOption}>
                    <Card className={styles.enhanceCard}>
                      <Zap className={styles.enhanceIcon} />
                      <div className={styles.enhanceTitle}>画质提升</div>
                      <div className={styles.enhanceDesc}>提升清晰度和细节</div>
                      <Button size="sm" className={styles.enhanceButton}>应用</Button>
                    </Card>
                  </div>

                  <div className={styles.enhanceOption}>
                    <Card className={styles.enhanceCard}>
                      <Lightbulb className={styles.enhanceIcon} />
                      <div className={styles.enhanceTitle}>色彩优化</div>
                      <div className={styles.enhanceDesc}>改善对比度和饱和度</div>
                      <Button size="sm" className={styles.enhanceButton}>应用</Button>
                    </Card>
                  </div>

                  <div className={styles.enhanceOption}>
                    <Card className={styles.enhanceCard}>
                      <Audio className={styles.enhanceIcon} />
                      <div className={styles.enhanceTitle}>音频降噪</div>
                      <div className={styles.enhanceDesc}>移除背景噪音</div>
                      <Button size="sm" className={styles.enhanceButton}>应用</Button>
                    </Card>
                  </div>

                  <div className={styles.enhanceOption}>
                    <Card className={styles.enhanceCard}>
                      <FlaskConical className={styles.enhanceIcon} />
                      <div className={styles.enhanceTitle}>智能特效</div>
                      <div className={styles.enhanceDesc}>应用AI生成的特效</div>
                      <Button size="sm" className={styles.enhanceButton}>应用</Button>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
};

export default AIAssistant;
