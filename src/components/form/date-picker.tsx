import { useEffect } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  monthYearOnly?: boolean;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  monthYearOnly = false,
}: PropsType) {
  useEffect(() => {
    if (monthYearOnly) {
      // For month-year only, use native HTML input
      return;
    }

    const config: any = {
      mode: mode || "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      defaultDate,
      onChange,
    };

    const flatPickr = flatpickr(`#${id}`, config);

    return () => {
      if (flatPickr && !Array.isArray(flatPickr)) {
        flatPickr.destroy();
      }
    };
  }, [mode, onChange, id, defaultDate, monthYearOnly]);

  if (monthYearOnly) {
    // Use native month input for month-year only selection
    const year = defaultDate ? (defaultDate as Date).getFullYear() : new Date().getFullYear();
    const month = defaultDate ? (defaultDate as Date).getMonth() + 1 : new Date().getMonth() + 1;
    const monthValue = `${year}-${String(month).padStart(2, '0')}`;

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return (
      <div>
        {label && <Label htmlFor={id}>{label}</Label>}

        <div className="relative">
          <input
            id={id}
            type="month"
            defaultValue={monthValue}
            onChange={(e) => {
              if (e.target.value && onChange) {
                const [y, m] = e.target.value.split('-').map(Number);
                const newDate = new Date(y, m - 1, 1);
                if (Array.isArray(onChange)) {
                  onChange.forEach(hook => hook([newDate], e.target.value, null as any));
                } else {
                  onChange([newDate], e.target.value, null as any);
                }
              }
            }}
            className="h-12 w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none hover:border-gray-400 dark:hover:border-gray-500"
            style={{
              colorScheme: 'light',
            }}
          />

          <span className="absolute text-gray-400 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-500">
            <CalenderIcon className="size-5" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          <CalenderIcon className="size-6" />
        </span>
      </div>
    </div>
  );
}
