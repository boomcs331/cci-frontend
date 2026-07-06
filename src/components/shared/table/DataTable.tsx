import React from 'react';

export interface Column<T extends Record<string, any>> {
  key: string;
  title: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: keyof T | ((row: T) => string);
  className?: string;
}

/**
 * DataTable - Standard data table component
 * Supports dynamic columns, loading state, empty state, and row click
 */
const getAlignClass = (align?: 'left' | 'center' | 'right') => {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  empty = false,
  emptyMessage = 'ไม่พบข้อมูล',
  onRowClick,
  rowKey,
  className = '',
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    if (rowKey && rowKey in (row as Record<string, any>)) {
      return String((row as Record<string, any>)[rowKey as string]);
    }
    return `row-${index}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (empty || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={`px-6 py-3 ${getAlignClass(column.align)} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                onClick={() => onRowClick?.(row)}
                className={`
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-6 py-4 whitespace-nowrap text-sm ${getAlignClass(column.align)} text-gray-900 dark:text-white`}>
                    {column.render
                      ? column.render((row as any)[column.key], row, index)
                      : (row as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
