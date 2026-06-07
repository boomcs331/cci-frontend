"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';

type PropsType = {
  id: string;
  label?: string;
  defaultDate?: Date;
  onChange: (date: Date) => void;
  className?: string;
};

const thaiMonths = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function MonthYearPicker({
  id,
  label,
  defaultDate = new Date(),
  onChange,
  className = '',
}: PropsType) {
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentYear, month, 1);
    setSelectedDate(newDate);
    onChange(newDate);
    setIsOpen(false);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(year, currentMonth, 1);
    setSelectedDate(newDate);
    onChange(newDate);
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-between"
        >
          <span className="font-medium">
            {thaiMonths[currentMonth]} {currentYear + 543}
          </span>
          <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-4">
              {/* Year Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  ปี
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearChange(year)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        year === currentYear
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {year + 543}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  เดือน
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {thaiMonths.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleMonthChange(index)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        index === currentMonth
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
