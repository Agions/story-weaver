/**
 * 视频脚本工作流页面
 */

import { Zap, Play, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/shared/components/ui/Toast';

import styles from './WorkflowPage.module.less';

const WORKFLOW_STEPS = [
  { key: 'import', title: '导入', description: '小说/剧本' },
  { key: 'analysis', title: 'AI解析', description: '智能分析' },
  { key: 'script', title: '剧本', description: '生成剧本' },
  { key: 'storyboard', title: '分镜', description: '漫画分镜' },
  { key: 'character', title: '角色', description: '角色形象' },
  { key: 'render', title: '渲染', description: '场景渲染' },
  { key: 'animate', title: '合成', description: '动态效果' },
  { key: 'audio', title: '配音', description: '配音配乐' },
  { key: 'export', title: '导出', description: '视频导出' },
];

const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workflow');
  const [currentStep, setCurrentStep] = useState(0);

  const handleStartWorkflow = () => {
    toast.info('开始创建工作流...');
    navigate('/project/new');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-semibold m-0">视频脚本工作流</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            设置
          </Button>
          <Button variant="default" size="sm" onClick={handleStartWorkflow}>
            <Play className="h-4 w-4 mr-1" />
            开始创建
          </Button>
        </div>
      </div>

      <Card className={styles.workflowCard}>
        <div className={styles.steps}>
          {WORKFLOW_STEPS.map((step, index) => (
            <div 
              key={step.key} 
              className={`${styles.step} ${index <= currentStep ? styles.stepActive : ''}`}
            >
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDesc}>{step.description}</div>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && <div className={styles.stepLine} />}
            </div>
          ))}
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabs}>
        <TabsList>
          <TabsTrigger value="workflow">工作流</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
          <TabsTrigger value="templates">模板</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <Card>
            <p className="text-muted-foreground">选择或创建新的工作流</p>
            <Button variant="default" className="mt-4" onClick={handleStartWorkflow}>
              创建新工作流
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <p className="text-muted-foreground">暂无历史记录</p>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <p className="text-muted-foreground">暂无模板</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowPage;