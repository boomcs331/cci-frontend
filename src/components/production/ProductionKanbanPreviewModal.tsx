"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { KANBAN_TAG_MODAL_STYLES, KANBAN_TAG_STYLES } from "@/utils/productionOrderKanbanPrint";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  html: string | null;
  loading?: boolean;
  onPrint?: () => void;
  printing?: boolean;
};

export default function ProductionKanbanPreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  html,
  loading = false,
  onPrint,
  printing = false,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="!max-w-[min(96vw,920px)] !p-0 overflow-hidden flex flex-col max-h-[92vh]"
    >
      <div className="shrink-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3 pr-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/80 uppercase tracking-wide">Kanban Tag</p>
            <h3 className="text-lg font-bold truncate">{title}</h3>
            {subtitle ? <p className="text-sm text-white/90 mt-0.5 font-mono truncate">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
            aria-label="ปิด"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            กำลังโหลด Kanban...
          </div>
        ) : html ? (
          <div
            className="kanban-preview-root"
            dangerouslySetInnerHTML={{
              __html: `<style>${KANBAN_TAG_STYLES}${KANBAN_TAG_MODAL_STYLES}</style>${html}`,
            }}
          />
        ) : (
          <p className="text-center py-12 text-gray-500">ไม่มีข้อมูล Kanban</p>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap gap-2 justify-end border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ปิด
        </button>
        {onPrint ? (
          <button
            type="button"
            disabled={printing || loading || !html}
            onClick={onPrint}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm"
          >
            {printing ? "กำลังพิมพ์..." : "พิมพ์ Kanban"}
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
