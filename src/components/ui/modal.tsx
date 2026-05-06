"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from "@/shared/utils/class-names"

// ============================================================
// AntD-compatible Modal (wraps shadcn Dialog)
// ============================================================
interface ModalProps {
  open?: boolean;
  onCancel?: () => void;
  onOk?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
  children?: React.ReactNode;
  className?: string;
  maskClosable?: boolean;
  closable?: boolean;
  destroyOnClose?: boolean;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
}

const ModalFn: React.FC<ModalProps> = ({
  open,
  onCancel,
  onOk,
  title,
  footer,
  width = 520,
  children,
  className,
  maskClosable = true,
  closable = true,
  okText,
  cancelText,
}) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open !== undefined) setIsOpen(open);
    
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onCancel?.();
    }
    setIsOpen(newOpen);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const handleOk = () => {
    onOk?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        style={{ maxWidth: typeof width === 'number' ? width : width }}
        onPointerDownOutside={(e) => {
          if (!maskClosable) e.preventDefault();
        }}
      >
        {closable && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
          </DialogHeader>
        )}
        {title && !closable && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div className="py-2">{children}</div>
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
        {footer === undefined && (onOk || okText) && (
          <DialogFooter>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              {cancelText ?? '取消'}
            </button>
            <button
              type="button"
              onClick={handleOk}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              {okText ?? '确定'}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Modal.confirm helper
const ModalConfirm = ({ title, content, onOk, onCancel }: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onCancel?.(); }}>
      <DialogContent>
        {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
        {content && <div className="py-2">{content}</div>}
        <DialogFooter>
          <button type="button" onClick={() => { setOpen(false); onCancel?.(); }} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">取消</button>
          <button type="button" onClick={() => { setOpen(false); onOk?.(); }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">确定</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ModalConfirmDialog: React.FC<{
  title?: React.ReactNode;
  content?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: string;
}> = ({ title, content, onOk, onCancel, okText = '确定', cancelText = '取消', okType }) => {
  const [open, setOpen] = React.useState(true);
  const okClass = okType === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-primary-foreground hover:bg-primary/90';
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) onCancel?.(); }}>
      <DialogContent>
        {title && <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>}
        {content && <div className="py-2">{content}</div>}
        <DialogFooter>
          <button type="button" onClick={() => { setOpen(false); onCancel?.(); }} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">{cancelText}</button>
          <button type="button" onClick={() => { setOpen(false); onOk?.(); }} className={cn("px-4 py-2 text-sm rounded-md hover:bg-primary/90", okClass)}>{okText}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Modal = ModalFn as unknown as React.FC<ModalProps> & {
  confirm: (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void; okText?: React.ReactNode; cancelText?: React.ReactNode; okType?: string }) => React.ReactElement;
  confirmAlt: (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void }) => React.ReactElement;
};
(Modal as any).confirm = (props: { title?: React.ReactNode; content?: React.ReactNode; onOk?: () => void; onCancel?: () => void; okText?: React.ReactNode; cancelText?: React.ReactNode; okType?: string }) => React.createElement(ModalConfirmDialog, props);
(Modal as any).confirmAlt = ModalConfirm;

export { Modal, ModalConfirmDialog, ModalConfirm, type ModalProps }
