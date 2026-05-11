'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

function ConfirmDialog({
  open,
  onOpenChange,
  title = '确认',
  description,
  onConfirm,
  onCancel,
  okText = '确认',
  cancelText = '取消',
  children,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          {description && <DialogDescription>{description}</DialogDescription>}
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
}

// Convenience wrapper that triggers on button click
interface PopconfirmProps {
  title: string;
  onConfirm: () => void;
  okText?: string;
  cancelText?: string;
  children: React.ReactNode;
}

function Popconfirm({
  title,
  onConfirm,
  okText = '确认',
  cancelText = '取消',
  children,
}: PopconfirmProps) {
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
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
    </ConfirmDialog>
  );
}

// AlertDialog components (shadcn-style, wraps ConfirmDialog)
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function AlertDialog({ children, ..._props }: AlertDialogProps) {
  return <ConfirmDialog {..._props}>{children}</ConfirmDialog>;
}

const AlertDialogTrigger = ({
  children,
  asChild,
  ..._props
}: React.PropsWithChildren & { asChild?: boolean }) => <>{children}</>;

const AlertDialogContent = ({ children, ..._props }: React.PropsWithChildren) => <>{children}</>;
const AlertDialogHeader = ({ children, ..._props }: React.PropsWithChildren) => <>{children}</>;
const AlertDialogTitle = ({ children, ..._props }: React.PropsWithChildren) => <>{children}</>;
const AlertDialogDescription = ({ children, ..._props }: React.PropsWithChildren) => (
  <>{children}</>
);
const AlertDialogFooter = ({ children, ..._props }: React.PropsWithChildren) => <>{children}</>;
const AlertDialogCancel = ({ children, ..._props }: React.PropsWithChildren) => <>{children}</>;
const AlertDialogAction = ({
  children,
  ..._props
}: React.PropsWithChildren & { onClick?: () => void }) => <>{children}</>;

export {
  ConfirmDialog,
  Popconfirm,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
