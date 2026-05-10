import React, { useEffect } from "react";
import QRCodeGenerator from "@/components/common/QRCodeGenerator";

interface PrintAllQRModalProps {
  show: boolean;
  onClose: () => void;
  receiving: any;
}

export default function PrintAllQRModal({ show, onClose, receiving }: PrintAllQRModalProps) {
  useEffect(() => {
    if (show && typeof window !== 'undefined') {
      const style = document.createElement('style');
      style.id = 'print-qr-styles';
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          #print-modal,
          #print-modal *,
          #print-content,
          #print-content *,
          #qr-grid,
          #qr-grid *,
          .qr-sticker,
          .qr-sticker * {
            visibility: visible !important;
          }
          
          #print-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          
          #print-modal > div {
            position: static !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: visible !important;
            box-shadow: none !important;
          }
          
          #print-content {
            max-height: none !important;
            overflow: visible !important;
            padding: 0.3cm !important;
          }
          
          #qr-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 0.3cm !important;
          }
          
          .qr-sticker {
            page-break-inside: avoid;
            break-inside: avoid;
            border: 1px solid #ddd !important;
            padding: 0.2cm !important;
            height: auto !important;
          }
          
          .qr-sticker img {
            width: 2.5cm !important;
            height: 2.5cm !important;
          }
          
          .qr-sticker canvas {
            width: 2.5cm !important;
            height: 2.5cm !important;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('print-qr-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [show]);

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
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm animate-cci-backdrop-in flex items-center justify-center z-[99999] p-4" id="print-modal">
      <div className="bg-white rounded-xl shadow-cci-popup animate-cci-modal-in w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center print:hidden">
          <h3 className="text-xl font-semibold">พิมพ์สติ๊กเกอร์ QR Code - {receiving.receivingNo}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              พิมพ์
            </button>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}} id="print-content">
          <div className="grid grid-cols-5 gap-3" id="qr-grid">
            {sortedLots.map((lot: any) => (
              <div key={lot.id} className="qr-sticker border border-gray-300 p-2 rounded bg-white text-center break-inside-avoid">
                <div className="bg-white p-1 inline-block mb-1">
                  <QRCodeGenerator value={lot.qrCode} size={100} className="mx-auto" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-xs truncate">{receiving.material?.matCode}</div>
                  <div className="text-[10px] text-gray-600 truncate">{receiving.material?.matName}</div>
                  <div className="text-[10px] text-gray-600 truncate">ผู้ขาย: {receiving.supplier?.name || '-'}</div>
                  <div className="font-semibold text-xs">LOT: {lot.lotNo}</div>
                  <div className="font-semibold text-xs">LOT Supplier: {lot.lotPdNo}</div>
                  <div className="text-[10px]">{parseFloat(lot.quantity).toLocaleString()} {receiving.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
