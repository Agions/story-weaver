"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = '确认',
  description,
  onConfirm,
  onCancel,
  okText = '确认',
  cancelText = '取消',
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {okText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Convenience wrapper that triggers on button click
interface PopconfirmProps {
  title: string;
  onConfirm: () => void;
  okText?: string;
  cancelText?: string;
  children: React.ReactNode;
}

const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  onConfirm,
  okText = '确认',
  cancelText = '取消',
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={title}
      onConfirm={onConfirm}
      okText={okText}
      cancelText={cancelText}
    >
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
        {children}
      </div>
    </ConfirmDialog>
  );
};

export { ConfirmDialog, Popconfirm }
