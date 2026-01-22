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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">QR Code - {lot.lotNo}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCodeGenerator value={lot.qrCode} size={256} />
          </div>
          <div className="space-y-2 text-sm text-gray-900 dark:text-white">
            <div><span className="font-medium">เลข Lot:</span> {lot.lotNo}</div>
            <div><span className="font-medium">QR Code:</span> {lot.qrCode}</div>
            <div><span className="font-medium">จำนวน:</span> {parseFloat(lot.quantity).toLocaleString()} {lot.unit}</div>
            <div><span className="font-medium">คงเหลือ:</span> {parseFloat(lot.remainingQuantity).toLocaleString()} {lot.unit}</div>
          </div>
          <button 
            onClick={() => window.print()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            พิมพ์ QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
