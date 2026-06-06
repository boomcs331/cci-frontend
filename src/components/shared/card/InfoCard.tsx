import React from 'react';

interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
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
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 text-gray-400">
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
