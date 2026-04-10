"use client";
import React, { useState, useEffect, useRef } from "react";
import { getApiUrl } from "@/utils/api";
import {
  advanceLotStep,
  decodeProductionLotQr,
  getLotRecord,
  labelsForRecord,
  maxStepForRecord,
  stepLabelForRecord,
} from "@/utils/productionLotTracking";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [lotData, setLotData] = useState<any>(null);
  const [productionLot, setProductionLot] = useState<ReturnType<typeof getLotRecord>>(undefined);
  const [productionMissing, setProductionMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
      setQrCode('');
      setLotData(null);
      setProductionLot(undefined);
      setProductionMissing(false);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = qrCode.trim();
      if (!code) return;

      setLoading(true);
      setLotData(null);
      setProductionLot(undefined);
      setProductionMissing(false);

      try {
        const plDecode = decodeProductionLotQr(code);
        if (plDecode) {
          const rec = getLotRecord(code);
          if (rec) {
            setProductionLot(rec);
          } else {
            setProductionMissing(true);
          }
          return;
        }

        const res = await fetch(
          getApiUrl(`/materials/transactions/qr/${encodeURIComponent(code)}`)
        );
        const result = await res.json();

        if (result.success) {
          setLotData(result.data);
        } else {
          alert(result.message || 'ไม่พบข้อมูล');
          setLotData(null);
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        setLotData(null);
      } finally {
        setLoading(false);
        setQrCode('');
        inputRef.current?.focus();
      }
    }
  };

  const handleProductionNext = () => {
    if (!productionLot) return;
    const next = advanceLotStep(productionLot.qrPayload);
    if (next) setProductionLot(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">สแกน QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{maxHeight: 'calc(90vh - 80px)'}}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">สแกน QR Code ที่นี่</label>
            <input
              ref={inputRef}
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyPress={handleScan}
              placeholder="สแกน QR (วัตถุดิบ หรือล็อตผลิต CCI:PL:...) แล้วกด Enter"
              className="w-full h-14 rounded-lg border-2 border-blue-500 dark:border-blue-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          )}

          {productionMissing && !loading && (
            <div className="border-2 border-amber-200 dark:border-amber-800 rounded-lg p-6 bg-amber-50 dark:bg-amber-900/20">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                QR ล็อตผลิต
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                รูปแบบ QR ล็อตถูกต้อง แต่ยังไม่มีข้อมูลในเครื่องนี้ — ให้สร้างล็อตจากหน้ารายละเอียดแผนการผลิตก่อน
              </p>
            </div>
          )}

          {productionLot && !loading && (
            <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6 space-y-4 bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  ล็อตผลิต
                </h2>
                <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 break-all max-w-[50%] text-right">
                  {productionLot.qrPayload}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">แผน</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {productionLot.planCode}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">สินค้า</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {productionLot.productName}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ล็อตที่</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {productionLot.lotIndex + 1} (จำนวนในล็อต{" "}
                    {productionLot.quantity.toLocaleString()} {productionLot.unit})
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">อัปเดตล่าสุด</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(productionLot.updatedAt).toLocaleString("th-TH")}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  ขั้นตอนปัจจุบัน
                </p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {stepLabelForRecord(productionLot, productionLot.stepIndex)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {labelsForRecord(productionLot).map((label, idx) => (
                    <span
                      key={`${idx}-${label}`}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        idx === productionLot.stepIndex
                          ? "bg-indigo-600 text-white"
                          : idx < productionLot.stepIndex
                            ? "bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}. {label}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleProductionNext}
                disabled={
                  productionLot.stepIndex >= maxStepForRecord(productionLot)
                }
                className="w-full py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ย้ายไปขั้นตอนถัดไป
              </button>
            </div>
          )}

          {lotData && !loading && (
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lotData.material?.matName}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">รหัสวัตถุดิบ:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.material?.matCode}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ชื่อวัตถุดิบ:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.material?.matName}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Lot No:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.lotNo}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Lot PD No:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.lotPdNo || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">QR Code:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.qrCode}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">สถานะ:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lotData.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      lotData.status === 'USED_UP' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {lotData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">จำนวนคงเหลือ</div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {parseFloat(lotData.remainingQuantity).toLocaleString()} {lotData.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">จำนวนเริ่มต้น:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{parseFloat(lotData.quantity).toLocaleString()} {lotData.unit}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ที่เก็บ:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.location?.name || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">ซัพพลายเออร์:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lotData.receiving?.supplier?.name || '-'}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">วันที่รับเข้า:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {lotData.receiving?.receivingDate ? new Date(lotData.receiving.receivingDate).toLocaleDateString('th-TH') : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
