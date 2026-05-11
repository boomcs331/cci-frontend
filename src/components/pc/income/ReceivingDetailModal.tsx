import React from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";
import TableEmptyRow from "@/components/common/TableEmptyRow";

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

  const getLotDateTime = (lot: any) => {
    const raw =
      lot?.createDate ??
      lot?.create_date ??
      lot?.createdAt ??
      lot?.created_at ??
      lot?.incomeDate ??
      lot?.income_date ??
      lot?.receivingDate ??
      lot?.receiving_date ??
      lot?.updateDate ??
      lot?.update_date;

    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getLotNo = (lot: any) => (typeof lot?.lotNo === "string" ? lot.lotNo : "");

  const sortedLots = (receiving.lots ?? [])
    .map((lot: any, idx: number) => ({ lot, idx }))
    .sort((a: any, b: any) => {
      const aDt = getLotDateTime(a.lot);
      const bDt = getLotDateTime(b.lot);
      const aLotNo = getLotNo(a.lot);
      const bLotNo = getLotNo(b.lot);

      // Primary: datetime ASC (if present)
      if (aDt && bDt) {
        const dt = aDt.getTime() - bDt.getTime();
        if (dt !== 0) return dt;
        const lotCmp = aLotNo.localeCompare(bLotNo, undefined, { numeric: true, sensitivity: "base" });
        return lotCmp !== 0 ? lotCmp : a.idx - b.idx;
      }

      // If one has datetime, it comes first
      if (aDt && !bDt) return -1;
      if (!aDt && bDt) return 1;

      // No datetime for both: Lot No ASC
      const lotCmp = aLotNo.localeCompare(bLotNo, undefined, { numeric: true, sensitivity: "base" });
      return lotCmp !== 0 ? lotCmp : a.idx - b.idx;
    })
    .map((x: any) => x.lot);

  return (
    <div className="fixed inset-0 z-[99999] flex animate-cci-backdrop-in items-center justify-center bg-gray-900/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="animate-cci-modal-in max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-cci-popup dark:border-gray-700 dark:bg-gray-800 sm:max-h-[90vh]">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6 sm:py-4">
          <h3 className="truncate pr-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">รายละเอียดการรับเข้า</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(92vh - 72px)" }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="text-sm">
              <span className="font-medium">เลขที่ใบรับ:</span> {receiving.receivingNo}
            </div>
            <div className="text-sm">
              <span className="font-medium">วันที่รับ:</span> {new Date(receiving.receivingDate).toLocaleString("th-TH")}
            </div>
            <div className="text-sm sm:col-span-2">
              <span className="font-medium">วัตถุดิบ:</span> {receiving.material?.matCode} - {receiving.material?.matName}
            </div>
            <div className="text-sm">
              <span className="font-medium">ซัพพลายเออร์:</span> {receiving.supplier?.name || "-"}
            </div>
            <div className="text-sm">
              <span className="font-medium">จำนวนรวม:</span> {parseFloat(receiving.totalQuantity).toLocaleString()} {receiving.unit}
            </div>
            <div className="text-sm">
              <span className="font-medium">PO:</span> {receiving.poNo || "-"}
            </div>
            {receiving.lots?.[0]?.incomeSupplireDate && (
              <div className="text-sm">
                <span className="font-medium">วันที่ผลิต:</span>{" "}
                {new Date(receiving.lots[0].incomeSupplireDate).toLocaleDateString("th-TH")}
              </div>
            )}
            <div className="text-sm sm:col-span-2">
              <span className="font-medium">หมายเหตุ:</span> {receiving.remark || "-"}
            </div>
          </div>

          <div className="mt-4 border-t pt-4">
            <h4 className="mb-3 font-semibold">รายการ Lot ({receiving.lots?.length || 0})</h4>
            <div className="-mx-1 overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-700 sm:mx-0">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-3 py-2 text-left">Lot No</th>
                    <th className="px-3 py-2 text-left">LOT Supplier</th>
                    <th className="px-3 py-2 text-center">QR Code</th>
                    <th className="px-3 py-2 text-left">วันที่ผลิต</th>
                    <th className="px-3 py-2 text-right">จำนวน</th>
                    <th className="px-3 py-2 text-right">คงเหลือ</th>
                    <th className="px-3 py-2 text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedLots.length === 0 ? (
                    <TableEmptyRow colSpan={7} />
                  ) : (
                    sortedLots.map((lot: any) => (
                      <tr key={lot.id}>
                      <td className="px-3 py-2">{lot.lotNo}</td>
                      <td className="px-3 py-2">{lot.lotPdNo}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-block cursor-pointer hover:opacity-80" onClick={() => onViewQR(lot)}>
                          <QRCodeGenerator value={lot.qrCode} size={72} className="mx-auto" />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {lot.incomeSupplireDate ? new Date(lot.incomeSupplireDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">{parseFloat(lot.quantity).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{parseFloat(lot.remainingQuantity).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(lot.status)}`}>
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
