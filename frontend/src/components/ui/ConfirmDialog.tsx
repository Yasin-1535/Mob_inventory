import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import ActionButton from './ActionButton';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      icon={AlertTriangle}
      iconBg={variant === 'danger' ? 'bg-rose-50' : 'bg-amber-50'}
      iconColor={variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}
      footer={
        <>
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </ActionButton>
          <ActionButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </ActionButton>
        </>
      }
    >
      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
        {message}
      </p>
    </Modal>
  );
};

export default ConfirmDialog;
