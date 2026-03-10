import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintPlanQRProps {
  planCode: string;
  planName: string;
  planDate: string;
  items: Array<{
    productName?: string;
    quantity: number;
    unit: string;
  }>;
}

export const PrintPlanQR: React.FC<PrintPlanQRProps> = ({ planCode, planName, planDate, items }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4 print:hidden">
        พิมพ์
      </button>
      
      <div className="print:p-8 bg-white">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">แผนการผลิต</h1>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={planCode} size={150} />
          </div>
          <p className="text-lg font-semibold">{planCode}</p>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">ชื่อแผน:</span> {planName}
            </div>
            <div>
              <span className="font-semibold">วันที่:</span> {new Date(planDate).toLocaleDateString('th-TH')}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">รายการสินค้า</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">ลำดับ</th>
                <th className="border border-gray-300 px-4 py-2 text-left">สินค้า</th>
                <th className="border border-gray-300 px-4 py-2 text-right">จำนวน</th>
                <th className="border border-gray-300 px-4 py-2 text-center">หน่วย</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.productName || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-8, .print\\:p-8 * {
            visibility: visible;
          }
          .print\\:p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
