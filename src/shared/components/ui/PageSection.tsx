/**
 * PageSection - Section wrapper component
 */
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import styles from './PageSection.module.less';

interface PageSectionProps {
  title?: React.ReactNode;
  description?: string;
  extra?: React.ReactNode;
  card?: boolean;
  children: React.ReactNode;
  className?: string;
}

const PageSection = ({
  title,
  description,
  extra,
  card = false,
  children,
  className = '',
}: PageSectionProps) => {
  const content = (
    <div className={`${styles.section} ${className}`}>
      {(title || extra) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.content}>{children}</div>
    </div>
  );

  if (card) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return content;
};

export default PageSection;
