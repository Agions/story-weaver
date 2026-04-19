/**
 * 专业空状态组件
 */

import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined, FolderOpenOutlined, FileOutlined } from '@ant-design/icons';
import styles from './Empty.module.less';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  type?: 'default' | 'project' | 'file';
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  action,
  type = 'default' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'project':
        return <FolderOpenOutlined className={styles.icon} />;
      case 'file':
        return <FileOutlined className={styles.icon} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {getIcon()}
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className={styles.description}>
            <div className={styles.title}>{title || '暂无内容'}</div>
            {description && <div className={styles.desc}>{description}</div>}
          </div>
        }
      >
        {action && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={action.onClick}
            className={styles.actionBtn}
          >
            {action.text}
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
