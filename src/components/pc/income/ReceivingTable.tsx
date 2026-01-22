import React from "react";

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
  getStatusBadge 
}: ReceivingTableProps) {
  if (receivings.length === 0) {
    return <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลรายการรับเข้า</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">เลขที่ใบรับ</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วันที่รับ</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">วัตถุดิบ</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">ซัพพลายเออร์</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">จำนวน</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">PO</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {receivings.map((rcv) => (
            <tr key={rcv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{rcv.receivingNo}</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {new Date(rcv.receivingDate).toLocaleDateString('th-TH')}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{rcv.material?.matCode}</div>
                <div className="text-xs text-gray-500">{rcv.material?.itemsName?.name}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rcv.supplier?.name || '-'}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                {parseFloat(rcv.totalQuantity).toLocaleString()} {rcv.unit}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rcv.poNo || '-'}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(rcv.status)}`}>
                  {rcv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => onViewDetail(rcv)} 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400" 
                    title="รายละเอียด"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => onPrintAll(rcv)} 
                    className="text-green-600 hover:text-green-800 dark:text-green-400" 
                    title="พิมพ์ QR Code ทั้งหมด"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
