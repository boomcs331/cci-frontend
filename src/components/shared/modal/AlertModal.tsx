"use client";

import React from 'react';
import { BaseModal } from './BaseModal';
import { ActionButton } from '../button/ActionButton';

export type AlertModalVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: AlertModalVariant;
  title?: string;
  message?: string;
  confirmText?: string;
}

const VARIANT_CONFIG: Record<
  AlertModalVariant,
  { defaultTitle: string; icon: React.ReactNode; buttonVariant: 'success' | 'danger' | 'warning' | 'info' }
> = {
  success: {
    defaultTitle: 'สำเร็จ',
    icon: (
      <svg className="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    buttonVariant: 'success',
  },
  error: {
    defaultTitle: 'เกิดข้อผิดพลาด',
    icon: (
      <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    buttonVariant: 'danger',
  },
  warning: {
    defaultTitle: 'คำเตือน',
    icon: (
      <svg className="h-12 w-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    buttonVariant: 'warning',
  },
  info: {
    defaultTitle: 'แจ้งเตือน',
    icon: (
      <svg className="h-12 w-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    buttonVariant: 'info',
  },
};

/**
 * AlertModal - Standard popup alert modal (success / error / warning / info)
 * Use for one-way notifications with a single acknowledgement button.
 * For confirm/cancel flows, use ConfirmModal instead.
 */
export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  variant,
  title,
  message,
  confirmText = 'ตกลง',
}) => {
  const config = VARIANT_CONFIG[variant];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mb-4 flex justify-center">{config.icon}</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          {title || config.defaultTitle}
        </h3>
        {message && (
          <p className="mb-6 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
        <div className="flex justify-center">
          <ActionButton variant={config.buttonVariant} onClick={onClose} className="min-w-[120px]">
            {confirmText}
          </ActionButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default AlertModal;
