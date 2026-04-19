import React from 'react';
import { Card, Button, List, Tag, Space, Typography, Tooltip, Progress, Divider } from 'antd';
import {
  ScissorOutlined,
  AudioOutlined,
  FontSizeOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  BulbOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  StarOutlined,
  VideoCameraAddOutlined,
  PictureOutlined,
  BgColorsOutlined,
  FontColorsOutlined,
  EditOutlined
} from '@ant-design/icons';
import styles from './AIFeaturePanel.module.less';

const { Text, Title } = Typography;

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
    icon: <ScissorOutlined />,
    title: '智能剪辑',
    description: 'AI 自动识别精彩片段',
    tag: 'AI',
    tagColor: '#6366f1'
  },
  {
    key: 'smartDub',
    icon: <AudioOutlined />,
    title: '智能配音',
    description: '文字转语音，情感合成',
    tag: 'AI',
    tagColor: '#ec4899'
  },
  {
    key: 'subtitle',
    icon: <FontSizeOutlined />,
    title: '字幕生成',
    description: '语音识别自动生成字幕',
    tag: 'AI',
    tagColor: '#14b8a6'
  },
  {
    key: 'autoHighlight',
    icon: <ThunderboltOutlined />,
    title: '精彩时刻',
    description: '自动识别高能片段',
    tag: 'AI',
    tagColor: '#f59e0b'
  },
  {
    key: 'storyline',
    icon: <RobotOutlined />,
    title: '故事线',
    description: 'AI 生成视频叙事结构',
    tag: 'Beta',
    tagColor: '#8b5cf6'
  },
  {
    key: 'bRoll',
    icon: <PictureOutlined />,
    title: 'B-Roll',
    description: '智能推荐辅助镜头',
    tag: 'AI',
    tagColor: '#10b981'
  },
  {
    key: 'background',
    icon: <BgColorsOutlined />,
    title: '背景音乐',
    description: '智能匹配背景音乐',
    tag: 'AI',
    tagColor: '#3b82f6'
  },
  {
    key: 'colorGrade',
    icon: <BulbOutlined />,
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
        return <SyncOutlined spin style={{ color: '#3b82f6' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'error':
        return <ClockCircleOutlined style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Title level={5} className={styles.title}>
          <RobotOutlined className={styles.aiIcon} />
          AI 功能
        </Title>
        <Text type="secondary" className={styles.subtitle}>
          点击使用 AI 能力
        </Text>
      </div>

      <Divider className={styles.divider} />

      <List
        className={styles.featureList}
        dataSource={aiFeatures}
        renderItem={(item) => {
          const status = processingStatus[item.key] || 'idle';
          const isSelected = selectedFeature === item.key;

          return (
            <List.Item
              className={`${styles.featureItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => onFeatureSelect?.(item.key)}
            >
              <div className={styles.featureContent}>
                <div className={styles.featureIcon}>
                  {status === 'processing' ? (
                    <SyncOutlined spin />
                  ) : (
                    item.icon
                  )}
                </div>
                <div className={styles.featureInfo}>
                  <div className={styles.featureTitle}>
                    {item.title}
                    <Tag
                      color={item.tagColor}
                      className={styles.featureTag}
                    >
                      {item.tag}
                    </Tag>
                    {getStatusIcon(status)}
                  </div>
                  <Text type="secondary" className={styles.featureDesc}>
                    {item.description}
                  </Text>
                </div>
              </div>

              {status === 'processing' && (
                <Progress
                  percent={50}
                  size="small"
                  showInfo={false}
                  className={styles.progressBar}
                />
              )}
            </List.Item>
          );
        }}
      />

      <Divider className={styles.divider} />

      <div className={styles.quickActions}>
        <Title level={5} className={styles.sectionTitle}>
          快速操作
        </Title>
        <Space wrap className={styles.actionButtons}>
          <Tooltip title="批量处理">
            <Button icon={<ThunderboltOutlined />} className={styles.actionBtn}>
              一键成片
            </Button>
          </Tooltip>
          <Tooltip title="智能识别">
            <Button icon={<VideoCameraAddOutlined />} className={styles.actionBtn}>
              内容分析
            </Button>
          </Tooltip>
          <Tooltip title="导出设置">
            <Button icon={<SettingOutlined />} className={styles.actionBtn}>
              导出
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div className={styles.aiTip}>
        <BulbOutlined className={styles.tipIcon} />
        <Text type="secondary">
          提示：使用 AI 功能前请先加载视频素材
        </Text>
      </div>
    </div>
  );
};

export default AIFeaturePanel;
