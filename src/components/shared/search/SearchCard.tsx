import React from 'react';

interface SearchCardProps {
  children: React.ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  className?: string;
}

/**
 * SearchCard - Standard card for search/filter sections
 * Wraps search form with consistent styling
 */
export const SearchCard: React.FC<SearchCardProps> = ({
  children,
  onReset,
  showReset = true,
  className = '',
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-6 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {children}
        </div>
        {showReset && onReset && (
          <div className="flex justify-end">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCard;
