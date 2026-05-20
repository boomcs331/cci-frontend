import React from "react";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import { PcStatusBadge } from "@/components/pc/transactions/PcStatusBadge";
import { TRANSACTION_THEME } from "@/components/pc/transactions/theme";

interface ReceivingTableProps {
  receivings: any[];
  onViewDetail: (receiving: any) => void;
  onPrintAll: (receiving: any) => void;
}

export default function ReceivingTable({
  receivings,
  onViewDetail,
  onPrintAll,
}: ReceivingTableProps) {
  const headerBg = TRANSACTION_THEME.income.tableHeader;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] table-auto text-left">
        <thead>
          <tr className={`border-b border-gray-200/80 dark:border-gray-700 ${headerBg}`}>
            <th className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              เลขที่ใบรับ
            </th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              วันที่รับ
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              วัตถุดิบ
            </th>
            <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 md:table-cell">
              ซัพพลายเออร์
            </th>
            <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 lg:table-cell">
              วันที่ผลิต
            </th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              จำนวน
            </th>
            <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 md:table-cell">
              PO
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              สถานะ
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {receivings.length === 0 ? (
            <TableEmptyRow colSpan={9} />
          ) : (
            receivings.map((rcv) => {
              const mfgStr = rcv.lots?.[0]?.incomeSupplireDate
                ? new Date(rcv.lots[0].incomeSupplireDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
              return (
                <tr
                  key={rcv.id}
                  className="group transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-950/15"
                >
                  <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white px-4 py-3.5 group-hover:bg-emerald-50/50 dark:border-gray-800 dark:bg-gray-900 dark:group-hover:bg-emerald-950/15">
                    <span className="font-mono text-[13px] font-semibold text-gray-900 dark:text-white">
                      {rcv.receivingNo}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200">
                    {new Date(rcv.receivingDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="max-w-[220px] px-4 py-3.5 sm:max-w-xs">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {rcv.material?.matCode}
                    </div>
                    <div
                      className="truncate text-xs text-gray-500 dark:text-gray-400"
                      title={rcv.material?.matName}
                    >
                      {rcv.material?.matName}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 md:hidden">
                      {rcv.supplier?.name ? (
                        <span className="max-w-[140px] truncate">ซัพ: {rcv.supplier.name}</span>
                      ) : null}
                      {rcv.poNo ? (
                        <span className="truncate" title={rcv.poNo}>
                          PO: {rcv.poNo}
                        </span>
                      ) : null}
                      <span className="whitespace-nowrap">MFG: {mfgStr}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 md:table-cell">
                    {rcv.supplier?.name || "—"}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 lg:table-cell">
                    {mfgStr}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {parseFloat(rcv.totalQuantity).toLocaleString()}{" "}
                    <span className="font-normal text-gray-500 dark:text-gray-400">{rcv.unit}</span>
                  </td>
                  <td
                    className="hidden max-w-[120px] truncate px-4 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-300 md:table-cell"
                    title={rcv.poNo || ""}
                  >
                    {rcv.poNo || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <PcStatusBadge status={rcv.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(rcv)}
                        className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        title="รายละเอียด"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintAll(rcv)}
                        className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
