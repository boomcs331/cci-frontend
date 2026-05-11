import React from "react";
import TableEmptyRow from "@/components/common/TableEmptyRow";

interface ReceivingTableProps {
  receivings: any[];
  onViewDetail: (receiving: any) => void;
  onPrintAll: (receiving: any) => void;
  getStatusBadge: (status: string) => string;
}

export default function ReceivingTable({
  receivings,
  onViewDetail,
  onPrintAll,
  getStatusBadge,
}: ReceivingTableProps) {
  return (
    <div className="-mx-1 overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700 sm:mx-0">
      <table className="w-full min-w-[880px] table-auto text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/90 dark:border-gray-700 dark:bg-gray-800/90">
            <th className="sticky left-0 z-[1] whitespace-nowrap bg-gray-50/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800/95 dark:text-gray-300 sm:px-4 sm:text-sm">
              เลขที่ใบรับ
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">
              วันที่รับ
            </th>
            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">
              วัตถุดิบ
            </th>
            <th className="hidden px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 md:table-cell sm:px-4 sm:text-sm">
              ซัพพลายเออร์
            </th>
            <th className="hidden px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 lg:table-cell sm:px-4 sm:text-sm">
              วันที่ผลิต
            </th>
            <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">
              จำนวน
            </th>
            <th className="hidden px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 md:table-cell sm:px-4 sm:text-sm">
              PO
            </th>
            <th className="px-2 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">
              สถานะ
            </th>
            <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:px-4 sm:text-sm">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {receivings.length === 0 ? (
            <TableEmptyRow colSpan={9} />
          ) : (
            receivings.map((rcv) => {
              const mfgStr = rcv.lots?.[0]?.incomeSupplireDate
                ? new Date(rcv.lots[0].incomeSupplireDate).toLocaleDateString("th-TH")
                : "-";
              return (
                <tr key={rcv.id} className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50">
                  <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white/95 px-3 py-3 text-sm font-medium text-gray-900 dark:border-gray-800 dark:bg-gray-900/95 dark:text-white sm:px-4">
                    {rcv.receivingNo}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-white sm:px-4">
                    {new Date(rcv.receivingDate).toLocaleDateString("th-TH")}
                  </td>
                  <td className="max-w-[200px] px-3 py-3 text-sm sm:max-w-xs sm:px-4">
                    <div className="font-medium text-gray-900 dark:text-white">{rcv.material?.matCode}</div>
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400" title={rcv.material?.matName}>
                      {rcv.material?.matName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 md:hidden">
                      {rcv.supplier?.name ? <span className="max-w-[140px] truncate">ซัพ: {rcv.supplier.name}</span> : null}
                      {rcv.poNo ? (
                        <span className="truncate" title={rcv.poNo}>
                          PO: {rcv.poNo}
                        </span>
                      ) : null}
                      <span className="whitespace-nowrap">MFG: {mfgStr}</span>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 text-sm text-gray-900 dark:text-white md:table-cell sm:px-4">
                    {rcv.supplier?.name || "-"}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-white lg:table-cell sm:px-4">
                    {mfgStr}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white sm:px-4">
                    {parseFloat(rcv.totalQuantity).toLocaleString()} {rcv.unit}
                  </td>
                  <td className="hidden max-w-[120px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white md:table-cell sm:px-4" title={rcv.poNo || ""}>
                    {rcv.poNo || "-"}
                  </td>
                  <td className="px-2 py-3 text-sm sm:px-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${getStatusBadge(rcv.status)}`}>{rcv.status}</span>
                  </td>
                  <td className="px-2 py-3 text-center sm:px-4">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetail(rcv)}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        title="รายละเอียด"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintAll(rcv)}
                        className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
                        title="พิมพ์ QR Code ทั้งหมด"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
