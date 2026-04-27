/**
 * 质量闸门提示组件
 */
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import type { QualityGateIssue } from '@/core/services';

export interface QualityGateAlertProps {
  issues: QualityGateIssue[];
  passed: boolean;
  onLocateIssue: (issue: QualityGateIssue) => void;
}

const QualityGateAlert: React.FC<QualityGateAlertProps> = ({
  issues,
  passed,
  onLocateIssue,
}) => (
  <Alert
    variant={passed ? 'default' : 'warning'}
    className="quality-gate-alert"
  >
    <AlertDescription>
      {passed ? '质量闸门已通过，可执行导出' : '质量闸门未完全通过，建议先修复以下问题'}
      <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
        {issues.length > 0 ? (
          issues.map((issue) => (
            <li key={issue.code}>
              [{issue.level === 'error' ? '阻断' : '建议'}] {issue.title}：{issue.detail}
              {typeof issue.frameIndex === 'number' ? `（第 ${issue.frameIndex + 1} 镜）` : ''}
              {issue.field ? ` 字段: ${issue.field}` : ''}
              {issue.frameId ? (
                <Button 
                  type="link" 
                  size="sm" 
                  onClick={() => onLocateIssue(issue)}
                  className="ml-2"
                >
                  定位修复
                </Button>
              ) : null}
            </li>
          ))
        ) : (
          <li>分镜数量、镜头覆盖与评测摘要达到默认阈值。</li>
        )}
      </ul>
    </AlertDescription>
  </Alert>
);

export default QualityGateAlert;