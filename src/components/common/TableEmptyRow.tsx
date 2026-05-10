import React from "react";

const cellBase =
  "px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400";

export function TableEmptyRow({
  colSpan,
  message = "ไม่มีข้อมูล",
  className,
}: {
  colSpan: number;
  message?: string;
  className?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={className ? `${cellBase} ${className}` : cellBase}
      >
        {message}
      </td>
    </tr>
  );
}

export default TableEmptyRow;
