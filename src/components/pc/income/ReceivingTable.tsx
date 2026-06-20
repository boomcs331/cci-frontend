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
    <>
      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full min-w-[900px] table-auto text-left">
          <thead>
            <tr className={`border-b-2 border-emerald-200 dark:border-emerald-800 ${headerBg}`}>
              <th className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                เลขที่ใบรับ
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                วันที่รับ
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                วัตถุดิบ
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                ซัพพลายเออร์
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                วันที่ผลิต
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                จำนวน
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                PO
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                สถานะ
              </th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {receivings.length === 0 ? (
              <TableEmptyRow colSpan={9} />
            ) : (
              receivings.map((rcv, index) => {
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
                    className="group transition-all duration-200 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20 hover:shadow-sm"
                  >
                    <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white px-5 py-4 group-hover:bg-emerald-50/70 dark:border-gray-800 dark:bg-gray-900 dark:group-hover:bg-emerald-950/20">
                      <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        {rcv.receivingNo}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(rcv.receivingDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="max-w-[250px] px-5 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {rcv.material?.matCode}
                      </div>
                      <div
                        className="truncate text-sm text-gray-500 dark:text-gray-400"
                        title={rcv.material?.matName}
                      >
                        {rcv.material?.matName}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {rcv.supplier?.name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {mfgStr}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                      {parseFloat(rcv.totalQuantity).toLocaleString()}{" "}
                      <span className="font-normal text-gray-500 dark:text-gray-400 text-xs">{rcv.unit}</span>
                    </td>
                    <td
                      className="max-w-[140px] truncate px-5 py-4 font-mono text-sm text-gray-600 dark:text-gray-300"
                      title={rcv.poNo || ""}
                    >
                      {rcv.poNo || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <PcStatusBadge status={rcv.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetail(rcv)}
                          className="rounded-lg p-2.5 text-emerald-600 transition-all duration-200 hover:bg-emerald-100 hover:scale-105 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
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
                          className="rounded-lg p-2.5 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:scale-105 dark:text-gray-400 dark:hover:bg-gray-800"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {receivings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-center">
              <div className="text-base font-medium text-gray-600 dark:text-gray-300">ไม่พบข้อมูลใบรับ</div>
              <div className="text-sm text-gray-400 mt-1">ลองปรับตัวกรองหรือเพิ่มข้อมูลใหม่</div>
            </div>
          </div>
        ) : receivings.map((rcv) => {
          const mfgStr = rcv.lots?.[0]?.incomeSupplireDate
            ? new Date(rcv.lots[0].incomeSupplireDate).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          return (
            <div key={rcv.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg mb-2 inline-block">
                    {rcv.receivingNo}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(rcv.receivingDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <PcStatusBadge status={rcv.status} />
              </div>
              
              <div className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                {rcv.material?.matCode}
              </div>
              <div className="text-sm text-gray-500 mb-4 line-clamp-1">
                {rcv.material?.matName}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">ซัพพลายเออร์</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{rcv.supplier?.name || "—"}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">PO</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{rcv.poNo || "—"}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">วันที่ผลิต</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{mfgStr}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">จำนวน</div>
                  <div className="font-bold text-gray-900 dark:text-white tabular-nums">
                    {parseFloat(rcv.totalQuantity).toLocaleString()} {rcv.unit}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => onViewDetail(rcv)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  รายละเอียด
                </button>
                <button
                  type="button"
                  onClick={() => onPrintAll(rcv)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  พิมพ์ QR
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
