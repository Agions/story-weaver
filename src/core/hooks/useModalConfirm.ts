/**
 * 确认对话框 Hook
 */
import {
  useConfirm,
  ConfirmDialogProps,
  UseConfirmOptions,
} from '@/shared/components/ui/confirm-dialog';

export type UseModalConfirmOptions = UseConfirmOptions;

export interface UseModalConfirmReturn {
  confirm: (options?: UseModalConfirmOptions) => Promise<boolean>;
  ModalConfirm: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>>;
}

export const useModalConfirm = (defaultOptions?: UseModalConfirmOptions): UseModalConfirmReturn => {
  const { confirm, ConfirmDialog } = useConfirm(defaultOptions);
  return {
    confirm: (options) => confirm(options || {}),
    ModalConfirm: ConfirmDialog,
  };
};
