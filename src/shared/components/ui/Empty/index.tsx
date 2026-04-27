/**
 * 专业空状态组件
 */

import { FolderOpen, File, Plus } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

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
        return <FolderOpen className={styles.icon} />;
      case 'file':
        return <File className={styles.icon} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {getIcon()}
      <div className={styles.description}>
        <div className={styles.title}>{title || '暂无内容'}</div>
        {description && <div className={styles.desc}>{description}</div>}
      </div>
      {action && (
        <Button 
          onClick={action.onClick}
          className={styles.actionBtn}
        >
          <Plus className="h-4 w-4 mr-1" />
          {action.text}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;