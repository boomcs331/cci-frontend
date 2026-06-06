import React from 'react';

export type StatusType = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled' 
  | 'draft' 
  | 'processing' 
  | 'completed' 
  | 'failed'
  | 'success'
  | 'error'
  | 'warning'
  | 'info';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

/**
 * StatusBadge - Standardized status badge component
 * Maps status types to consistent colors across the application
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const statusConfig: Record<StatusType, { label: string; className: string }> = {
    pending: { label: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    approved: { label: 'อนุมัติ', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    rejected: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    cancelled: { label: 'ยกเลิก', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
    draft: { label: 'ฉบับร่าง', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    processing: { label: 'กำลังดำเนินการ', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    completed: { label: 'เสร็จสมบูรณ์', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    failed: { label: 'ล้มเหลว', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    success: { label: 'สำเร็จ', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    error: { label: 'ข้อผิดพลาด', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    warning: { label: 'แจ้งเตือน', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    info: { label: 'ข้อมูล', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  };

  const config = statusConfig[status] || statusConfig.info;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
