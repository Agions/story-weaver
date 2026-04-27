/**
 * 专业页面头部
 */

import { ChevronRight } from 'lucide-react';
import React from 'react';
import { Breadcrumb, BreadcrumbContent, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

import styles from './PageHeader.module.less';

interface BreadcrumbItemData {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemData[];
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
        <Breadcrumb className={styles.breadcrumb}>
          <BreadcrumbList>
            {breadcrumbs.map((item, _index) => (
              <>
                <BreadcrumbItem key={_index}>
                  {item.href ? (
                    <a href={item.href}>{item.title}</a>
                  ) : (
                    item.title
                  )}
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              </>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      
      <div className={styles.titleRow}>
        <div className={styles.titleContent}>
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className={styles.backBtn}
            >
              ← 返回
            </Button>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && (
            <p className={styles.subtitle}>{subtitle}</p>
          )}
        </div>
        
        {extra && (
          <div className={styles.extra}>
            {extra}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;