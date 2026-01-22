import React from "react";

interface PaginationProps {
  pagination: any;
  currentPage: number;
  limit: number;
}

export default function Pagination({ pagination, currentPage, limit }: PaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} results
      </div>
      <div className="flex items-center">
        <a 
          href={`?page=${Math.max(1, currentPage - 1)}&limit=${limit}`} 
          className={`mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
            currentPage <= 1 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Previous
        </a>
        <div className="flex items-center gap-2">
          {currentPage > 3 && <span className="px-2">...</span>}
          {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
            const pageNum = i + Math.max(currentPage - 1, 1);
            return (
              <a 
                key={pageNum} 
                href={`?page=${pageNum}&limit=${limit}`} 
                className={`px-4 py-2 rounded ${
                  currentPage === pageNum
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 dark:text-gray-400"
                } flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
              >
                {pageNum}
              </a>
            );
          })}
          {currentPage < pagination.totalPages - 2 && <span className="px-2">...</span>}
        </div>
        <a 
          href={`?page=${Math.min(pagination.totalPages, currentPage + 1)}&limit=${limit}`} 
          className={`ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${
            currentPage >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}
