import React, { useState } from 'react';
import { Upload, Search, Bell, MoreHorizontal, Video, Audio, FileImage, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { EmptyState } from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';

import { logger } from '@/core/utils/logger';

import styles from './AssetPanel.module.less';

interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  src: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  tags: string[];
}

// 模拟素材数据
const mockAssets: Asset[] = [
  {
    id: 'video-1',
    name: '片段1.mp4',
    type: 'video',
    src: 'https://example.com/video1.mp4',
    thumbnail: 'https://picsum.photos/96/54?random=1',
    duration: 45,
    size: 10.5,
    tags: ['入场']
  },
  {
    id: 'video-2',
    name: '片段2.mp4',
    type: 'video',
    src: 'https://example.com/video2.mp4',
    thumbnail: 'https://picsum.photos/96/54?random=2',
    duration: 30,
    size: 8.2,
    tags: ['特写']
  },
  {
    id: 'audio-1',
    name: '背景音乐.mp3',
    type: 'audio',
    src: 'https://example.com/audio1.mp3',
    duration: 120,
    size: 3.5,
    tags: ['音乐']
  },
  {
    id: 'image-1',
    name: 'logo.png',
    type: 'image',
    src: 'https://example.com/image1.png',
    thumbnail: 'https://picsum.photos/96/54?random=3',
    size: 0.8,
    tags: ['素材']
  },
  {
    id: 'text-1',
    name: '字幕1',
    type: 'text',
    src: 'Hello World',
    size: 0.1,
    tags: ['字幕']
  }
];

interface AssetPanelProps {}

const AssetPanel: React.FC<AssetPanelProps> = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤显示的素材
  const filteredAssets = assets.filter(asset => {
    // 按类型过滤
    if (activeTab !== 'all' && asset.type !== activeTab) {
      return false;
    }

    // 按搜索词过滤
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // 删除素材
  const handleDelete = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  // 添加到时间轴
  const addToTimeline = (asset: Asset) => {
    logger.info('添加到时间轴', asset);
    // 这里将来会实现与Timeline组件的交互
  };

  // 格式化时长显示
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化文件大小
  const formatSize = (mb: number): string => {
    return mb < 1 ? `${Math.round(mb * 1000)} KB` : `${mb.toFixed(1)} MB`;
  };

  // 渲染素材缩略图或图标
  const renderThumbnail = (asset: Asset) => {
    switch (asset.type) {
      case 'video':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <Video className={styles.assetIcon} />
          </div>
        );
      case 'audio':
        return (
          <div className={styles.assetIconContainer}>
            <Audio className={styles.assetIcon} />
          </div>
        );
      case 'image':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <FileImage className={styles.assetIcon} />
          </div>
        );
      case 'text':
        return (
          <div className={styles.assetIconContainer}>
            <FileText className={styles.assetIcon} />
          </div>
        );
      default:
        return null;
    }
  };

  // 上传素材
  const handleUpload = (info: unknown) => {
    logger.info('上传文件', info);
    // 实际项目中会处理文件上传和转码
  };

  // 素材项操作菜单
  const getAssetMenuItems = (id: string) => [
    {
      key: '1',
      label: '重命名',
      onClick: () => logger.info('重命名', id)
    },
    {
      key: '2',
      label: '下载',
      onClick: () => logger.info('下载', id)
    },
    {
      key: '3',
      label: '复制',
      onClick: () => logger.info('复制', id)
    },
    {
      type: 'divider' as const
    },
    {
      key: '4',
      label: '删除',
      danger: true,
      onClick: () => handleDelete(id)
    }
  ];

  return (
    <div className={styles.assetPanelContainer}>
      <div className={styles.assetSearch}>
        <Input
          placeholder="搜索素材..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className={styles.assetTabs} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="video">视频</TabsTrigger>
          <TabsTrigger value="audio">音频</TabsTrigger>
          <TabsTrigger value="image">图片</TabsTrigger>
          <TabsTrigger value="text">文本</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className={styles.uploadContainer}>
        <Upload
          multiple
          showUploadList={false}
          customRequest={handleUpload}
        >
          <Button variant="outline" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            上传素材
          </Button>
        </Upload>
      </div>

      <div className={styles.assetList}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <div key={asset.id} className={styles.assetItem}>
              <div
                className={styles.assetContent}
                onClick={() => addToTimeline(asset)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") addToTimeline(asset); }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.assetPreview}>
                  {renderThumbnail(asset)}
                  {asset.duration && (
                    <div className={styles.assetDuration}>
                      {formatDuration(asset.duration)}
                    </div>
                  )}
                </div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetName} title={asset.name}>{asset.name}</div>
                  <div className={styles.assetDetails}>
                    <span className={styles.assetSize}>{formatSize(asset.size)}</span>
                    {asset.tags.map(tag => (
                      <span key={tag} className={styles.assetTag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Dropdown menu={{ items: getAssetMenuItems(asset.id) }} trigger={['click']} placement="bottomRight">
                <Button
                  variant="ghost"
                  className={styles.assetMenuButton}
                  icon={<MoreHorizontal />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          ))
        ) : (
          <EmptyState
            title={
              searchQuery
                ? "没有找到匹配的素材"
                : activeTab === 'all'
                  ? "没有素材"
                  : `没有${activeTab === 'video' ? '视频' : activeTab === 'audio' ? '音频' : activeTab === 'image' ? '图片' : '文本'}素材`
            }
            description="请尝试其他搜索词或上传新素材"
          />
        )}
      </div>
    </div>
  );
};

export default AssetPanel;