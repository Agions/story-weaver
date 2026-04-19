/**
 * 专业页面头部
 */

import React from 'react';
import { Breadcrumb, Typography, Space, Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import styles from './PageHeader.module.less';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  extra,
  onBack
}) => {
  return (
    <div className={styles.header}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          className={styles.breadcrumb}
          separator={<RightOutlined />}
          items={breadcrumbs.map((item, index) => ({
            title: item.href ? (
              <a href={item.href}>{item.title}</a>
            ) : (
              item.title
            )
          }))}
        />
      )}
      
      <div className={styles.titleRow}>
        <div className={styles.titleContent}>
          {onBack && (
            <Button 
              type="text" 
              onClick={onBack}
              className={styles.backBtn}
            >
              ← 返回
            </Button>
          )}
          <Typography.Title level={3} className={styles.title}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" className={styles.subtitle}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        
        {extra && (
          <Space className={styles.extra}>
            {extra}
          </Space>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
