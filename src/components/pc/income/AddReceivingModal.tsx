import React, { useState, useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { getMfgDateErrorCode, getPcFieldErrorMessage } from "@/lib/pc";
import PoNoInput, { validatePoNoField } from "@/components/pc/shared/PoNoInput";

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

export default function AddReceivingModal(props: AddReceivingModalProps) {
  if (!props.show) return null;
  return <AddReceivingModalInner {...props} />;
}

function AddReceivingModalInner({
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
  setMfgDate,
}: AddReceivingModalProps) {
  const [materialSearch, setMaterialSearch] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [mfgDateError, setMfgDateError] = useState<string | null>(null);
  const [mfgDateTouched, setMfgDateTouched] = useState(false);
  const [poShowErrors, setPoShowErrors] = useState(false);
  const [poValid, setPoValid] = useState(false);
  const mfgDatePickerRef = useRef<HTMLInputElement>(null);

  const resolveMfgDateError = (dateStr: string): string | null => {
    const code = getMfgDateErrorCode(dateStr);
    return code ? getPcFieldErrorMessage('mfgDate', code) : null;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPoShowErrors(true);
    setMfgDateTouched(true);
    setMfgDateError(resolveMfgDateError(mfgDate ?? ""));

    if (validatePoNoField(poNo)) {
      return;
    }
    if (resolveMfgDateError(mfgDate ?? "")) {
      return;
    }
    onSubmit(e);
  };

  useEffect(() => {
    if (!mfgDatePickerRef.current) return;
    const fp = flatpickr(mfgDatePickerRef.current, {
      dateFormat: "Y-m-d",
      maxDate: "today",
      onChange: (_selectedDates, dateStr) => {
        setMfgDate?.(dateStr);
        setMfgDateTouched(true);
        setMfgDateError(resolveMfgDateError(dateStr));
      },
      defaultDate: mfgDate || undefined,
    });
    return () => {
      if (!Array.isArray(fp)) fp.destroy();
    };
  }, [mfgDate, setMfgDate]);

  const selectedMaterial = materials.find((m) => m.id === materialId);
  const filteredSuppliers = selectedMaterial?.supplierId 
    ? suppliers.filter(s => s.id === selectedMaterial.supplierId)
    : suppliers;

  const filteredMaterials = materials.filter(m => 
    materialSearch === '' || 
    m.matCode.toLowerCase().includes(materialSearch.toLowerCase()) ||
    (m.matName || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[99999] flex animate-cci-backdrop-in items-center justify-center bg-gray-900/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="animate-cci-modal-in max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-cci-popup dark:border-gray-700 dark:bg-gray-800 sm:max-h-[90vh]">
        <div className="h-1 bg-gradient-to-r from-success-500 to-emerald-400" aria-hidden />
        <div className="sticky top-0 flex items-center justify-between border-b border-emerald-200/60 bg-gradient-to-r from-success-50 to-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:from-success-950/40 dark:to-emerald-950/30 sm:px-6 sm:py-4">
          <h3 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100 sm:text-xl">รับวัตถุดิบเข้า</h3>
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
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">วันที่ผลิต (MFG Date) *</label>
                <div className="relative">
                  <input 
                    ref={mfgDatePickerRef}
                    type="text" 
                    value={mfgDate || ''} 
                    onChange={(e) => {
                      setMfgDate?.(e.target.value);
                      setMfgDateTouched(true);
                      setMfgDateError(resolveMfgDateError(e.target.value));
                    }}
                    onBlur={() => {
                      setMfgDateTouched(true);
                      setMfgDateError(resolveMfgDateError(mfgDate ?? ''));
                    }}
                    className={`w-full h-11 rounded-lg border px-4 pr-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                      mfgDateTouched && mfgDateError
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="เลือกวันที่"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {mfgDateTouched && mfgDateError && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{mfgDateError}</p>
                )}
              </div>
              <PoNoInput
                className="md:col-span-2"
                value={poNo}
                onChange={setPoNo}
                forceShowErrors={poShowErrors}
                onValidityChange={setPoValid}
                disabled={submitLoading}
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">หมายเหตุ</label>
                <textarea 
                  value={remark} 
                  onChange={(e) => setRemark(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                  rows={3} 
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl bg-gray-500 px-6 text-sm font-medium text-white hover:bg-gray-600 sm:w-auto sm:shrink-0"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={
                  submitLoading ||
                  !!resolveMfgDateError(mfgDate ?? "") ||
                  !poValid
                }
                className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitLoading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
