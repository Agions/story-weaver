import { Button } from '@/shared/components/ui/button';

import styles from '../ProjectEdit.module.less';

interface StepActionsProps {
  onPrev: () => void;
  onNext: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

export function StepActions({
  onPrev,
  onNext,
  prevLabel = '上一步',
  nextLabel = '下一步',
}: StepActionsProps) {
  return (
    <div className={styles.stepActions}>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onPrev}>
          {prevLabel}
        </Button>
        <Button variant="default" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
