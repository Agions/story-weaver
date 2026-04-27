/**
 * UI组件演示页面
 * 展示项目中使用的各种UI组件
 */

import { User, Star, Heart, MessageCircle, Video, Zap, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState } from 'react';

import SubtitleEditor from '@/features/subtitle/components/SubtitleEditor';
import { EmptyState, PageContainer, PageSection, GridStatistic, AnimateIn } from '@/shared/components/ui';

const Demo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [subtitles, setSubtitles] = useState(mockSubtitles);
  const [currentTime, setCurrentTime] = useState(0);
  const [sliderValue, setSliderValue] = useState<number[]>([30]);
  const [sliderRange, setSliderRange] = useState<number[]>([20, 50]);
  const [selectValue, setSelectValue] = useState('');

  // 模拟播放时间更新
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((t) => (t > 20 ? 0 : t + 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const buttons: { variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'; text: string }[] = [
    { variant: 'default', text: '主要按钮' },
    { variant: 'secondary', text: '默认按钮' },
    { variant: 'outline', text: '虚线按钮' },
    { variant: 'ghost', text: '文字按钮' },
    { variant: 'link', text: '链接按钮' },
  ];

  const tags = [
    { variant: 'default' as const, text: '标签一' },
    { variant: 'secondary' as const, text: '标签二' },
    { variant: 'destructive' as const, text: '标签三' },
    { variant: 'outline' as const, text: '标签四' },
  ];

  const listData = [
    { title: '列表项目 1', description: '这是列表项的描述内容' },
    { title: '列表项目 2', description: '这是列表项的描述内容' },
    { title: '列表项目 3', description: '这是列表项的描述内容' },
  ];

  // 统计卡片数据
  const stats = [
    { title: '项目总数', value: '12', icon: <Video />, color: 'primary' as const, trend: 'up' as const, trendValue: '较上周' },
    { title: '已完成', value: '8', icon: <Star />, color: 'success' as const },
    { title: '处理中', value: '3', icon: <Zap />, color: 'warning' as const },
    { title: 'API调用', value: '1.2K', icon: <Cloud />, color: 'info' as const, trend: 'up' as const, trendValue: '+15%' },
  ];

  return (
    <PageContainer title="UI组件演示" description="展示通用UI组件的使用方式">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="page">页面组件</TabsTrigger>
          <TabsTrigger value="buttons">按钮</TabsTrigger>
          <TabsTrigger value="forms">表单组件</TabsTrigger>
          <TabsTrigger value="display">数据展示</TabsTrigger>
          <TabsTrigger value="list">列表</TabsTrigger>
          <TabsTrigger value="feedback">反馈组件</TabsTrigger>
        </TabsList>

        <TabsContent value="page">
          <AnimateIn type="slideUp">
            <PageSection title="数据统计" extra={<Badge variant="default">实时</Badge>}>
              <GridStatistic items={stats} columns={4} />
            </PageSection>
          </AnimateIn>

          <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }} />

          <AnimateIn type="slideUp" delay={100}>
            <PageSection title="字幕编辑器" description="拖动下方滑块模拟播放进度，测试字幕高亮效果" card>
              <SubtitleEditor
                subtitles={subtitles as any}
                onChange={(newSubtitles) => setSubtitles(newSubtitles as any)}
                currentTime={currentTime}
                videoWidth={640}
                videoHeight={360}
                showPreview
              />
            </PageSection>
          </AnimateIn>

          <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }} />

          <AnimateIn type="slideUp" delay={200}>
            <PageSection title="加载状态">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <ShadcnSkeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <ShadcnSkeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <ShadcnSkeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <ShadcnSkeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
                </div>
                <ShadcnSkeleton style={{ width: '100%', height: 120 }} />
                <ShadcnSkeleton style={{ width: '100%', height: 80 }} />
                <ShadcnSkeleton style={{ width: '100%', height: 60 }} />
              </div>
            </PageSection>
          </AnimateIn>
        </TabsContent>

        <TabsContent value="buttons">
          <Card title="按钮类型">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {buttons.map((btn) => (
                <Button key={btn.text} variant={btn.variant}>
                  {btn.text}
                </Button>
              ))}
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>按钮尺寸</div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button size="sm">小按钮</Button>
              <Button size="default">中按钮</Button>
              <Button size="lg">大按钮</Button>
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>按钮状态</div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="destructive" disabled>
                危险按钮
              </Button>
              <Button variant="secondary" disabled>
                禁用
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <Card title="输入框">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
              <Input placeholder="基本输入框" />
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#666' }} />
                <Input placeholder="带图标的输入框" style={{ paddingLeft: 36 }} />
              </div>
              <Input type="password" placeholder="密码输入框" />
              <textarea 
                placeholder="多行文本" 
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>选择器</div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 400 }}>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger style={{ width: 200 }}>
                  <SelectValue placeholder="选择框" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">选项一</SelectItem>
                  <SelectItem value="2">选项二</SelectItem>
                  <SelectItem value="3">选项三</SelectItem>
                </SelectContent>
              </Select>

              <Switch />
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>滑动条</div>

            <div style={{ maxWidth: 400 }}>
              <Slider value={sliderValue} onValueChange={(v) => setSliderValue(v)} max={100} step={1} />
              <div style={{ marginTop: 16 }}>
                <Slider value={sliderRange} onValueChange={(v) => setSliderRange(v)} max={100} step={1} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card title="标签">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Badge key={tag.text} variant={tag.variant}>
                  {tag.text}
                </Badge>
              ))}
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>头像和徽标</div>

            <div style={{ display: 'flex', gap: 24 }}>
              <Avatar style={{ width: 64, height: 64 }}>
                <AvatarFallback><User style={{ width: 32, height: 32 }} /></AvatarFallback>
              </Avatar>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar style={{ width: 40, height: 40, borderRadius: 0 }}>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ff4d4f',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>5</div>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar style={{ width: 40, height: 40 }}>
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  background: '#52c41a',
                  borderRadius: '50%',
                  border: '2px solid #fff'
                }} />
              </div>
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>进度条</div>

            <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Progress value={30} />
              <Progress value={70} />
              <Progress value={100} />
              <Progress value={50} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card title="列表">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {listData.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: index < listData.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar style={{ width: 40, height: 40 }}>
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.title}</div>
                      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{item.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm"><Star style={{ width: 14, height: 14 }} /> 收藏</Button>
                    <Button variant="ghost" size="sm"><Heart style={{ width: 14, height: 14 }} /> 点赞</Button>
                    <Button variant="ghost" size="sm"><MessageCircle style={{ width: 14, height: 14 }} /> 评论</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card title="加载状态">
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid #f0f0f0', borderTopColor: '#1890ff', borderRadius: '50%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid #f0f0f0', borderTopColor: '#1890ff', borderRadius: '50%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="animate-spin" style={{ width: 32, height: 32, border: '2px solid #f0f0f0', borderTopColor: '#1890ff', borderRadius: '50%' }} />
              </div>
            </div>

            <div style={{ height: '1px', background: '#d9d9d9', margin: '24px 0' }}>空状态</div>

            <EmptyState
              description="暂无数据"
              action={{
                text: '创建项目',
                onClick: () => {},
              }}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

// 模拟字幕数据
const mockSubtitles = [
  { id: '1', startTime: 0, endTime: 3, text: '欢迎使用 PlotCraft AI' },
  { id: '2', startTime: 3, endTime: 6, text: 'AI 驱动的视频创作平台' },
  { id: '3', startTime: 6, endTime: 10, text: '让创作变得更简单' },
  { id: '4', startTime: 10, endTime: 14, text: '智能分析、自动剪辑' },
  { id: '5', startTime: 14, endTime: 18, text: '尽享创作乐趣' },
];

export default Demo;
