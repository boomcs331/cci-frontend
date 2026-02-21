import React from "react";

interface AddReceivingModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  materials: any[];
  suppliers: any[];
  locations: any[];
  materialId: number | null;
  setMaterialId: (id: number | null) => void;
  quantity: number;
  setQuantity: (qty: number) => void;
  supplierId: number;
  setSupplierId: (id: number) => void;
  locationId: number;
  setLocationId: (id: number) => void;
  poNo: string;
  setPoNo: (po: string) => void;
  remark: string;
  setRemark: (remark: string) => void;
  submitLoading: boolean;
  onMaterialChange: (matId: number) => void;
}

export default function AddReceivingModal({
  show,
  onClose,
  onSubmit,
  materials,
  suppliers,
  locations,
  materialId,
  quantity,
  setQuantity,
  supplierId,
  setSupplierId,
  locationId,
  setLocationId,
  poNo,
  setPoNo,
  remark,
  setRemark,
  submitLoading,
  onMaterialChange
}: AddReceivingModalProps) {
  if (!show) return null;

  const selectedMaterial = materials.find(m => m.id === materialId);
  const filteredSuppliers = selectedMaterial?.supplierId 
    ? suppliers.filter(s => s.id === selectedMaterial.supplierId)
    : suppliers;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">รับวัตถุดิบเข้า</h3>
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
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วัตถุดิบ *</label>
                <select 
                  value={materialId ?? ''} 
                  onChange={(e) => onMaterialChange(Number(e.target.value))} 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                  required
                >
                  <option value="">-- เลือกวัตถุดิบ --</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.matCode} - {m.matName || 'ไม่มีชื่อ'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">จำนวน *</label>
                <input 
                  type="number" 
                  value={quantity || ''} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                  required 
                  min="0" 
                  step="0.01" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ซัพพลายเออร์</label>
                <select 
                  value={supplierId} 
                  onChange={(e) => setSupplierId(Number(e.target.value))} 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  disabled={!materialId}
                >
                  <option value={0}>ไม่ระบุ</option>
                  {filteredSuppliers && filteredSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">ที่เก็บ *</label>
                <select 
                  value={locationId} 
                  onChange={(e) => setLocationId(Number(e.target.value))} 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลขที่ PO</label>
                <input 
                  type="text" 
                  value={poNo} 
                  onChange={(e) => setPoNo(e.target.value)} 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">หมายเหตุ</label>
                <textarea 
                  value={remark} 
                  onChange={(e) => setRemark(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                  rows={3} 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button 
                type="submit" 
                disabled={submitLoading} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded"
              >
                {submitLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
