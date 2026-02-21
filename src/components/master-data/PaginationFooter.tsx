interface PaginationFooterProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PaginationFooter({ page, limit, total, totalPages }: PaginationFooterProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
      </div>
      <div className="flex items-center">
        <a href={`?page=${Math.max(1, page - 1)}&limit=${limit}`} className={`mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
          Previous
        </a>
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + Math.max(page - 2, 1);
            if (pageNum > totalPages) return null;
            return (
              <a key={pageNum} href={`?page=${pageNum}&limit=${limit}`} className={`px-4 py-2 rounded ${page === pageNum ? "bg-brand-500 text-white" : "text-gray-700 dark:text-gray-400"} flex w-10 items-center justify-center h-10 rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}>
                {pageNum}
              </a>
            );
          })}
        </div>
        <a href={`?page=${Math.min(totalPages, page + 1)}&limit=${limit}`} className={`ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs text-sm hover:bg-gray-50 h-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>
          Next
        </a>
      </div>
    </div>
  );
}
