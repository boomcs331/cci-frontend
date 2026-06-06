import React from 'react';
import { BaseModal } from './BaseModal';
import { ActionButton } from '../button/ActionButton';

export type ConfirmModalType = 'confirm' | 'delete' | 'warning' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

/**
 * ConfirmModal - Standard confirmation modal
 * Used for confirm, delete, warning, and success confirmations
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  loading = false,
}) => {
  const typeConfig: Record<ConfirmModalType, { title: string; icon: React.ReactNode; variant: 'primary' | 'danger' | 'warning' | 'success' }> = {
    confirm: {
      title: title || 'ยืนยัน',
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'primary',
    },
    delete: {
      title: title || 'ยืนยันการลบ',
      icon: (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      variant: 'danger',
    },
    warning: {
      title: title || 'คำเตือน',
      icon: (
        <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      variant: 'warning',
    },
    success: {
      title: title || 'สำเร็จ',
      icon: (
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'success',
    },
  };

  const config = typeConfig[type];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {config.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex justify-center gap-3">
          <ActionButton
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </ActionButton>
          <ActionButton
            variant={config.variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </ActionButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
