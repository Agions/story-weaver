import {
  Bot,
  CheckCircle,
  AlertCircle,
  Key,
  Settings,
  Download,
  ExternalLink,
  Copy
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';

import { AIModelType, AI_MODEL_INFO } from '@/core/types/ai-model.types';
import { useLegacyStore } from '@/shared/stores';

import styles from './ModelCard.module.less';

// API密钥申请链接
const API_LINKS = {
  wenxin: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu',
  qianwen: 'https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key',
  spark: 'https://www.xfyun.cn/doc/spark/Guide.html',
  chatglm: 'https://open.bigmodel.cn/dev/api#apikey',
  doubao: 'https://www.doubao.com/docs/api/',
  deepseek: 'https://platform.deepseek.com/api'
};

interface ModelCardProps {
  modelType: AIModelType;
  onSelect: (modelType: AIModelType) => void;
  onRequestApiKey?: (modelType: AIModelType) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({
  modelType,
  onSelect,
  onRequestApiKey
}) => {
  const { aiModelsSettings, selectedAIModel } = useLegacyStore();
  const navigate = useNavigate();
  const modelInfo = AI_MODEL_INFO[modelType];
  const isEnabled = aiModelsSettings[modelType]?.enabled;
  const isSelected = selectedAIModel === modelType;
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // 处理选择模型
  const handleSelect = () => {
    if (isEnabled) {
      onSelect(modelType);
    } else {
      navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
    }
  };

  // 处理跳转到设置页面
  const handleGoToSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
  };

  // 处理申请API密钥
  const handleRequestApiKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // 处理直接跳转到API密钥申请页面
  const handleGoToApiPage = () => {
    window.open(API_LINKS[modelType], '_blank');
    setIsModalOpen(false);
  };

  // 渲染申请选项模态框
  const renderApplyModal = () => (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className={styles.applyModal}>
        <DialogHeader>
          <DialogTitle>申请{modelInfo.name} API密钥</DialogTitle>
        </DialogHeader>
        <div className={styles.applyOptions}>
          <Button
            variant="default"
            icon={<ExternalLink size={16} />}
            onClick={handleGoToApiPage}
            className={styles.applyButton}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            前往{modelInfo.provider}官网申请API密钥
          </Button>

          <div className={styles.dividerText}>或者</div>

          <Button
            variant="outline"
            icon={<Settings size={16} />}
            onClick={() => {
              setIsModalOpen(false);
              navigate('/settings', { state: { activeModel: modelType, showKeyConfig: true } });
            }}
            className={styles.applyButton}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            直接配置API密钥
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Card
        className={`${styles.modelCard} ${isSelected ? styles.selected : ''} ${isEnabled ? '' : styles.disabled}`}
        hoverable
        onClick={handleSelect}
      >
        <div className={styles.modelIcon}>
          <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28
          }}>
            <span style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isEnabled ? (isSelected ? "#1677ff" : "#52c41a") : "#ff4d4f",
              top: 0,
              right: 0
            }} />
            <Bot size={28} />
          </span>
        </div>

        <div className={styles.modelInfo}>
          <h4 className={styles.modelName} style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
            {modelInfo.name}
            {isEnabled && isSelected && (
              <CheckCircle size={16} color="#1677ff" style={{ marginLeft: 4 }} />
            )}
          </h4>

          <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }} className={styles.modelProvider}>
            {modelInfo.provider}
          </span>

          <div className={styles.modelStatus}>
            {isEnabled ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                color: '#52c41a',
                fontSize: 12
              }}>
                <CheckCircle size={12} /> 已配置
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                color: '#faad14',
                fontSize: 12
              }}>
                <AlertCircle size={12} /> 未配置
              </span>
            )}
            {isSelected && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
                background: '#e6f4ff',
                border: '1px solid #91caff',
                color: '#1677ff',
                fontSize: 12
              }}>
                当前默认
              </span>
            )}
          </div>

          <div className={styles.modelActions}>
            {isEnabled ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleSelect(); }}
                >
                  {isSelected ? '当前默认' : '设为默认'}
                </Button>
                <Tooltip content="管理模型设置">
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<Settings size={14} />}
                    onClick={handleGoToSettings}
                  />
                </Tooltip>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="default"
                  size="small"
                  icon={<Settings size={14} />}
                  onClick={handleGoToSettings}
                >
                  去配置
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  icon={<Key size={14} />}
                  onClick={handleRequestApiKey}
                  className={styles.applyKeyButton}
                >
                  申请密钥
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      {renderApplyModal()}
    </>
  );
};

export default ModelCard;
