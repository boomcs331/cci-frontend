import React from 'react';

interface ContentCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * ContentCard - Standard card wrapper for content sections
 * Consistent styling with border-radius, padding, and shadow
 */
export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-xl p-6 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default ContentCard;
