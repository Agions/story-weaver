/**
 * 确认对话框组件
 */

import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React, { useState, useCallback } from 'react';

import styles from './ConfirmDialog.module.less';

export type ConfirmType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface ConfirmDialogProps {
  open?: boolean;
  type?: ConfirmType;
  title?: string;
  content?: string;
  icon?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  okButtonProps?: Record<string, unknown>;
  cancelButtonProps?: Record<string, unknown>;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  width?: number | string;
  centered?: boolean;
  destroyOnClose?: boolean;
  className?: string;
}

const iconMap = {
  info: <Info className="h-6 w-6 text-blue-500" />,
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
  error: <AlertCircle className="h-6 w-6 text-red-500" />,
  confirm: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open = false,
  type = 'confirm',
  title = '确认操作',
  content,
  icon,
  okText = '确定',
  cancelText = '取消',
  onOk,
  onCancel,
  loading = false,
  className,
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleOk = useCallback(async () => {
    if (!onOk) return;

    setLocalLoading(true);
    try {
      const result = onOk();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLocalLoading(false);
    }
  }, [onOk]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className={className}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {icon || iconMap[type]}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {content && (
            <DialogDescription>{content}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading || localLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'error' ? 'destructive' : 'default'}
            onClick={handleOk}
            disabled={loading || localLoading}
          >
            {okText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export interface UseConfirmOptions {
  title?: string;
  content?: string;
  type?: ConfirmType;
  okText?: string;
  cancelText?: string;
}

export interface UseConfirmReturn {
  confirm: (options?: UseConfirmOptions) => Promise<boolean>;
  ConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>>;
}

export const useConfirm = (defaultOptions?: UseConfirmOptions): UseConfirmReturn => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>(defaultOptions || {});
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmOptions = {}) => {
    setOptions({ ...defaultOptions, ...opts });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, [defaultOptions]);

  const handleOk = useCallback(() => {
    resolveRef?.(true);
    setOpen(false);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setOpen(false);
  }, [resolveRef]);

  const ConfirmDialogComponent: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>> = (dialogProps) => (
    <ConfirmDialog
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      {...defaultOptions}
      {...options}
      {...dialogProps}
    />
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
};

export default ConfirmDialog;