'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';

interface Material {
  materialId: number;
  materialName: string;
  requiredQuantity: number;
  availableQty: number;
  unit: string;
}

interface PlanItem {
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  materials: Material[];
}

interface PlanDetail {
  id: number;
  planCode: string;
  planName: string;
  planDate: string;
  status: string;
  remarks?: string;
  items: PlanItem[];
}

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<PlanDetail | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`http://localhost:3006/production-plans/${params.id}/details`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error:', err));
  }, [params.id]);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle="รายละเอียดแผนการผลิต" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{data.planCode} - {data.planName}</h2>
          </div>
        </div>

        <ComponentCard title="รายละเอียดแผนการผลิต">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">วันที่:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(data.planDate).toLocaleDateString('th-TH')}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">สถานะ:</span>
              <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">{data.status}</span>
            </div>
            {data.remarks && (
              <div className="col-span-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">หมายเหตุ:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">{data.remarks}</span>
              </div>
            )}
          </div>

          {data.items.map((item) => (
            <div key={item.productId} className="mb-8 border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {item.productName} - จำนวน {item.quantity} {item.unit}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Material</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">ต้องการ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">คงเหลือ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {item.materials.map((m) => (
                      <tr key={m.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{m.materialName}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {m.requiredQuantity} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          {m.availableQty} {m.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.availableQty >= m.requiredQuantity ? (
                            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ย้อนกลับ
            </button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
