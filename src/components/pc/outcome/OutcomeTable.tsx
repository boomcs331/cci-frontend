import React from "react";
import TableEmptyRow from "@/components/common/TableEmptyRow";
import type { PcTransactionVariant } from "@/components/pc/transactions/theme";
import { TRANSACTION_THEME } from "@/components/pc/transactions/theme";

type OutcomeRow = {
  id: number;
  issueNo: string;
  issueDate: string;
  department?: string;
  productionOrderNo?: string;
  workOrderNo?: string;
  documentFile?: string;
  documents?: { id?: number; fileName?: string; filePath?: string; fileSize?: number }[];
  items?: {
    issuedQuantity?: string | number;
    unit?: string;
    material?: { matCode?: string; matName?: string };
  }[];
};

type OutcomeTableProps = {
  outcomes: OutcomeRow[];
  variant?: PcTransactionVariant;
  onPreviewDocuments: (files: OutcomeRow["documents"], legacyFile?: string, id?: number) => void;
};

export default function OutcomeTable({
  outcomes,
  variant = "outcome",
  onPreviewDocuments,
}: OutcomeTableProps) {
  const headerBg = TRANSACTION_THEME[variant].tableHeader;

  return (
    <>
      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full min-w-[800px] table-auto text-left">
          <thead>
            <tr className={`border-b-2 border-orange-200 dark:border-orange-800 ${headerBg}`}>
              <th className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                เลขที่ใบจ่าย
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                วันที่จ่าย
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                วัตถุดิบ
              </th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                แผนก
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                Work Order
              </th>
              <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                จำนวน
              </th>
              <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                เอกสาร
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {outcomes.length === 0 ? (
              <TableEmptyRow colSpan={7} />
            ) : (
              outcomes.map((out) => (
                <tr
                  key={out.id}
                  className="group transition-all duration-200 hover:bg-orange-50/70 dark:hover:bg-orange-950/20 hover:shadow-sm"
                >
                  <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white px-5 py-4 text-sm font-bold text-orange-700 group-hover:bg-orange-50/70 dark:border-gray-800 dark:bg-gray-900 dark:text-orange-400 dark:group-hover:bg-orange-950/20">
                    <span className="font-mono">{out.issueNo}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(out.issueDate).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="max-w-[250px] px-5 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {out.items?.[0]?.material?.matCode}
                    </div>
                    <div
                      className="truncate text-sm text-gray-500 dark:text-gray-400"
                      title={out.items?.[0]?.material?.matName}
                    >
                      {out.items?.[0]?.material?.matName}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {out.department || "—"}
                  </td>
                  <td
                    className="max-w-[160px] truncate px-5 py-4 text-sm text-gray-600 dark:text-gray-300"
                    title={out.productionOrderNo || out.workOrderNo || ""}
                  >
                    {out.productionOrderNo || out.workOrderNo || "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    {parseFloat(String(out.items?.[0]?.issuedQuantity || 0)).toLocaleString()}{" "}
                    <span className="font-normal text-gray-500 dark:text-gray-400 text-xs">
                      {out.items?.[0]?.unit}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {out.documents && out.documents.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onPreviewDocuments(out.documents)}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 transition-all duration-200 hover:bg-orange-200 hover:scale-105 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-900/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ดูไฟล์ ({out.documents.length})
                      </button>
                    ) : out.documentFile && out.documentFile !== "/uploads/default.pdf" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewDocuments(
                            [
                              {
                                id: out.id,
                                fileName: out.documentFile?.split("/").pop() || "document",
                                filePath: out.documentFile!,
                                fileSize: 0,
                              },
                            ],
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 transition-all duration-200 hover:bg-orange-200 hover:scale-105 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-900/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ดูไฟล์
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {outcomes.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-gray-400 py-12">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-center">
              <div className="text-base font-medium text-gray-600 dark:text-gray-300">ไม่พบข้อมูลใบจ่าย</div>
              <div className="text-sm text-gray-400 mt-1">ลองปรับตัวกรองหรือเพิ่มข้อมูลใหม่</div>
            </div>
          </div>
        ) : outcomes.map((out) => (
          <div key={out.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-lg mb-2 inline-block">
                  {out.issueNo}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(out.issueDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
            
            <div className="font-semibold text-gray-900 dark:text-white text-base mb-1">
              {out.items?.[0]?.material?.matCode}
            </div>
            <div className="text-sm text-gray-500 mb-4 line-clamp-1">
              {out.items?.[0]?.material?.matName}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {out.department && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">แผนก</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">{out.department}</div>
                </div>
              )}
              {(out.productionOrderNo || out.workOrderNo) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Work Order</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300 line-clamp-1">{out.productionOrderNo || out.workOrderNo}</div>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">จำนวน</div>
                <div className="font-bold text-gray-900 dark:text-white tabular-nums">
                  {parseFloat(String(out.items?.[0]?.issuedQuantity || 0)).toLocaleString()} {out.items?.[0]?.unit}
                </div>
              </div>
            </div>
            
            <div className="flex items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              {out.documents && out.documents.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onPreviewDocuments(out.documents)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ดูไฟล์ ({out.documents.length})
                </button>
              ) : out.documentFile && out.documentFile !== "/uploads/default.pdf" ? (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewDocuments(
                      [
                        {
                          id: out.id,
                          fileName: out.documentFile?.split("/").pop() || "document",
                          filePath: out.documentFile!,
                          fileSize: 0,
                        },
                      ],
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  ดูไฟล์
                </button>
              ) : (
                <span className="w-full text-center text-sm text-gray-400 dark:text-gray-500 py-3">ไม่มีเอกสารแนบ</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
