"use client";
import React, { useState, useEffect, useRef } from "react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [lotData, setLotData] = useState<any>(null);
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
      try {
        const res = await fetch(`http://localhost:3006/materials/transactions/qr/${code}`);
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
              placeholder="สแกน QR Code แล้วกด Enter..."
              className="w-full h-14 rounded-lg border-2 border-blue-500 dark:border-blue-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-lg"
              autoFocus
            />
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
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
