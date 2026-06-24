import { Bell } from 'lucide-react';

import { EmptyState } from '@/shared/components/ui';
import { Button } from '@/shared/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { useAppStore } from '@/shared/stores';

import styles from './NotificationCenter.module.less';

interface NotificationCenterProps {
  open?: boolean;
  onClose?: () => void;
}

function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const { notifications, clearAllNotifications } = useAppStore();

  const mockNotifications = [
    {
      id: 1,
      title: '项目导出完成',
      content: '您的项目"视频解说脚本"已成功导出',
      time: '10分钟前',
    },
    {
      id: 2,
      title: '新功能上线',
      content: '我们新增了AI智能分析功能，快来体验吧！',
      time: '1小时前',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <SheetContent side="right" className="w-[320px]">
        <SheetHeader>
          <SheetTitle>通知中心</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            disabled={!notifications}
          >
            清除全部
          </Button>
        </SheetHeader>

        <div className={styles.notificationContent}>
          {mockNotifications.length > 0 ? (
            <div className={styles.notificationList}>
              {mockNotifications.map((item) => (
                <div key={item.id} className={styles.notificationItem}>
                  <div className={styles.notificationHeader}>
                    <span className={styles.notificationTitle}>{item.title}</span>
                    <span className={styles.notificationTime}>{item.time}</span>
                  </div>
                  <p className={styles.notificationContent}>{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyContainer}>
              <Bell className="h-12 w-12 text-muted-foreground" />
              <EmptyState title="暂无通知" description="这里会显示您的系统通知" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationCenter;
