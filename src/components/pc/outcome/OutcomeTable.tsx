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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] table-auto text-left">
        <thead>
          <tr className={`border-b border-gray-200/80 dark:border-gray-700 ${headerBg}`}>
            <th className="sticky left-0 z-[1] whitespace-nowrap bg-inherit px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              เลขที่ใบจ่าย
            </th>
            <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              วันที่จ่าย
            </th>
            <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              วัตถุดิบ
            </th>
            <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 md:table-cell">
              แผนก
            </th>
            <th className="hidden px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 lg:table-cell">
              Work Order
            </th>
            <th className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
              จำนวน
            </th>
            <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
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
                className="group transition-colors hover:bg-gray-50/90 dark:hover:bg-gray-800/40"
              >
                <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-gray-100 bg-white px-4 py-3.5 text-sm font-semibold text-gray-900 group-hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:group-hover:bg-gray-800/40">
                  <span className="font-mono text-[13px]">{out.issueNo}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200">
                  {new Date(out.issueDate).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="max-w-[220px] px-4 py-3.5 sm:max-w-xs">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {out.items?.[0]?.material?.matCode}
                  </div>
                  <div
                    className="truncate text-xs text-gray-500 dark:text-gray-400"
                    title={out.items?.[0]?.material?.matName}
                  >
                    {out.items?.[0]?.material?.matName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-gray-500 dark:text-gray-400 md:hidden">
                    {out.department ? <span>แผนก: {out.department}</span> : null}
                    {(out.productionOrderNo || out.workOrderNo) && (
                      <span className="truncate" title={out.productionOrderNo || out.workOrderNo}>
                        WO: {out.productionOrderNo || out.workOrderNo}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 md:table-cell">
                  {out.department || "—"}
                </td>
                <td
                  className="hidden max-w-[140px] truncate px-4 py-3.5 text-sm text-gray-700 dark:text-gray-200 lg:table-cell"
                  title={out.productionOrderNo || out.workOrderNo || ""}
                >
                  {out.productionOrderNo || out.workOrderNo || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {parseFloat(String(out.items?.[0]?.issuedQuantity || 0)).toLocaleString()}{" "}
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {out.items?.[0]?.unit}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  {out.documents && out.documents.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => onPreviewDocuments(out.documents)}
                      className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:hover:bg-orange-900/50"
                    >
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
                              fileName: out.documentFile.split("/").pop() || "document",
                              filePath: out.documentFile,
                              fileSize: 0,
                            },
                          ],
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-800 transition hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
                    >
                      ดูไฟล์
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
