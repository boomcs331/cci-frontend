import React from 'react';

export type InfoCardVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: InfoCardVariant;
  className?: string;
}

/**
 * InfoCard - Simple card for displaying key-value information
 * Used in summary sections and detail views
 */
export const InfoCard: React.FC<InfoCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  className = '',
}) => {
  const variantClasses: Record<InfoCardVariant, { border: string; iconBg: string; iconColor: string }> = {
    default: { border: 'border-l-gray-400', iconBg: 'bg-gray-100 dark:bg-gray-700', iconColor: 'text-gray-500 dark:text-gray-400' },
    info: { border: 'border-l-brand-500', iconBg: 'bg-brand-100 dark:bg-brand-900/30', iconColor: 'text-brand-600 dark:text-brand-400' },
    success: { border: 'border-l-success-500', iconBg: 'bg-success-100 dark:bg-success-900/30', iconColor: 'text-success-600 dark:text-success-400' },
    warning: { border: 'border-l-warning-500', iconBg: 'bg-warning-100 dark:bg-warning-900/30', iconColor: 'text-warning-600 dark:text-warning-400' },
    danger: { border: 'border-l-error-500', iconBg: 'bg-error-100 dark:bg-error-900/30', iconColor: 'text-error-600 dark:text-error-400' },
  };

  const config = variantClasses[variant];

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-xl p-4 border-l-4 ${config.border} ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`flex-shrink-0 p-2 rounded-lg ${config.iconBg} ${config.iconColor}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
