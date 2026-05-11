import React from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";

interface QRCodeModalProps {
  show: boolean;
  onClose: () => void;
  lot: any;
}

export default function QRCodeModal({ show, onClose, lot }: QRCodeModalProps) {
  if (!show || !lot) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex animate-cci-backdrop-in items-center justify-center bg-gray-900/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="animate-cci-modal-in w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-cci-popup dark:border-gray-700 dark:bg-gray-800">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6 sm:py-4">
          <h3 className="truncate pr-2 text-base font-semibold text-gray-900 dark:text-white sm:text-xl">
            QR Code - {lot.lotNo}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 text-center sm:p-6">
          <div className="mb-4 inline-block rounded-lg bg-white p-2 sm:p-4">
            <QRCodeGenerator value={lot.qrCode} size={220} className="mx-auto max-w-full" />
          </div>
          <div className="space-y-2 text-left text-sm text-gray-900 dark:text-white sm:text-center">
            <div><span className="font-medium">เลข LOT:</span> {lot.lotNo}</div>
            <div><span className="font-medium">เลข LOT Supplier:</span> {lot.lotPdNo}</div>
            <div><span className="font-medium">QR Code:</span> {lot.qrCode}</div>
            <div><span className="font-medium">จำนวน:</span> {parseFloat(lot.quantity).toLocaleString()} {lot.unit}</div>
            <div><span className="font-medium">คงเหลือ:</span> {parseFloat(lot.remainingQuantity).toLocaleString()} {lot.unit}</div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-4 h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            พิมพ์ QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
