"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  placeholder?: string;
}

function splitTime(value: string): { hours: string; minutes: string } {
  if (!value) return { hours: "00", minutes: "00" };
  const [h, m] = value.split(":");
  return { hours: h || "00", minutes: m || "00" };
}

export default function TimePicker({ value, onChange, label, placeholder = "เลือกเวลา" }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { hours, minutes } = useMemo(() => splitTime(value), [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleHourChange = (h: string) => {
    onChange(`${h}:${minutes}`);
  };

  const handleMinuteChange = (m: string) => {
    onChange(`${hours}:${m}`);
  };

  const handleOk = () => {
    onChange(`${hours}:${minutes}`);
    setIsOpen(false);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div ref={pickerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-between cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <span className={value ? "" : "text-gray-400"}>
          {value || placeholder}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ width: "380px" }}>
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-700 p-6">
              <div className="text-white text-sm opacity-80 mb-2">เลือกเวลา</div>
              <div className="text-white text-5xl font-light tracking-wider">
                {hours}:{minutes}
              </div>
            </div>

            {/* Time Selection */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Hours */}
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">ชั่วโมง</div>
                  <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {hoursList.map((h) => (
                      <div
                        key={h}
                        onClick={() => handleHourChange(h)}
                        className={`px-4 py-3 text-center cursor-pointer transition-colors text-base ${
                          hours === h
                            ? "bg-blue-600 text-white font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">นาที</div>
                  <div className="h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {minutesList.map((m) => (
                      <div
                        key={m}
                        onClick={() => handleMinuteChange(m)}
                        className={`px-4 py-3 text-center cursor-pointer transition-colors text-base ${
                          minutes === m
                            ? "bg-blue-600 text-white font-medium"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleOk}
                className="px-5 py-2.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
