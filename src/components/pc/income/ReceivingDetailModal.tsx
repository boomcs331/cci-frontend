import React from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";

interface ReceivingDetailModalProps {
  show: boolean;
  onClose: () => void;
  receiving: any;
  onViewQR: (lot: any) => void;
  getStatusBadge: (status: string) => string;
}

export default function ReceivingDetailModal({
  show,
  onClose,
  receiving,
  onViewQR,
  getStatusBadge
}: ReceivingDetailModalProps) {
  if (!show || !receiving) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">รายละเอียดการรับเข้า</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="font-medium">เลขที่ใบรับ:</span> {receiving.receivingNo}</div>
            <div><span className="font-medium">วันที่รับ:</span> {new Date(receiving.receivingDate).toLocaleString('th-TH')}</div>
            <div><span className="font-medium">วัตถุดิบ:</span> {receiving.material?.matCode} - {receiving.material?.itemsName?.name}</div>
            <div><span className="font-medium">ซัพพลายเออร์:</span> {receiving.supplier?.name || '-'}</div>
            <div><span className="font-medium">จำนวนรวม:</span> {parseFloat(receiving.totalQuantity).toLocaleString()} {receiving.unit}</div>
            <div><span className="font-medium">PO:</span> {receiving.poNo || '-'}</div>
            <div className="col-span-2"><span className="font-medium">หมายเหตุ:</span> {receiving.remark || '-'}</div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">รายการ Lot ({receiving.lots?.length || 0})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-3 py-2 text-left">Lot No</th>
                    <th className="px-3 py-2 text-center">QR Code</th>
                    <th className="px-3 py-2 text-right">จำนวน</th>
                    <th className="px-3 py-2 text-right">คงเหลือ</th>
                    <th className="px-3 py-2 text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receiving.lots?.map((lot: any) => (
                    <tr key={lot.id}>
                      <td className="px-3 py-2">{lot.lotNo}</td>
                      <td className="px-3 py-2 text-center">
                        <div 
                          className="inline-block cursor-pointer hover:opacity-80"
                          onClick={() => onViewQR(lot)}
                        >
                          <QRCodeGenerator value={lot.qrCode} size={80} className="mx-auto" />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">{parseFloat(lot.quantity).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{parseFloat(lot.remainingQuantity).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(lot.status)}`}>
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
