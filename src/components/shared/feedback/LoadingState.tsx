import React from 'react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * LoadingState - Standard loading indicator
 * Used when data is being fetched
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'กำลังโหลด...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default LoadingState;
