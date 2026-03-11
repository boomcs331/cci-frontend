import React, { useState, useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

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
  mfgDate?: string;
  setMfgDate?: (date: string) => void;
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
  onMaterialChange,
  mfgDate,
  setMfgDate
}: AddReceivingModalProps) {
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const mfgDatePickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      setMaterialSearch('');
      setShowMaterialDropdown(false);
      if (mfgDatePickerRef.current) {
        flatpickr(mfgDatePickerRef.current, {
          dateFormat: "Y-m-d",
          onChange: (selectedDates, dateStr) => {
            setMfgDate?.(dateStr);
          },
          defaultDate: mfgDate || undefined
        });
      }
    }
  }, [show]);

  if (!show) return null;

  const selectedMaterial = materials.find(m => m.id === materialId);
  const filteredSuppliers = selectedMaterial?.supplierId 
    ? suppliers.filter(s => s.id === selectedMaterial.supplierId)
    : suppliers;

  const filteredMaterials = materials.filter(m => 
    materialSearch === '' || 
    m.matCode.toLowerCase().includes(materialSearch.toLowerCase()) ||
    (m.matName || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

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
                <div className="relative">
                  <input
                    type="text"
                    value={materialId && !materialSearch ? (selectedMaterial ? `${selectedMaterial.matCode} - ${selectedMaterial.matName || ''}` : '') : materialSearch}
                    onChange={(e) => {
                      setMaterialSearch(e.target.value);
                      setShowMaterialDropdown(true);
                    }}
                    onFocus={() => setShowMaterialDropdown(true)}
                    placeholder="ค้นหารหัสหรือชื่อวัตถุดิบ"
                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    required
                  />
                  {showMaterialDropdown && filteredMaterials.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaterials.slice(0, 50).map((mat) => (
                        <div
                          key={mat.id}
                          onClick={() => {
                            onMaterialChange(mat.id);
                            setMaterialSearch(`${mat.matCode} - ${mat.matName || ''}`);
                            setShowMaterialDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{mat.matCode}</div>
                          <div className="text-xs text-gray-500">{mat.matName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">เลข Lot (Auto)</label>
                <input 
                  type="text" 
                  value="จะถูกสร้างอัตโนมัติ (PC20260101-001)" 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" 
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วันที่ผลิต (Auto)</label>
                <input 
                  type="text" 
                  value="จะถูกสร้างอัตโนมัติ (PD20260101-001)" 
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" 
                  disabled
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วันที่ผลิต (MFG Date)</label>
                <div className="relative">
                  <input 
                    ref={mfgDatePickerRef}
                    type="text" 
                    value={mfgDate || ''} 
                    onChange={(e) => setMfgDate?.(e.target.value)} 
                    className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                    placeholder="เลือกวันที่"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
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
