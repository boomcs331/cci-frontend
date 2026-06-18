import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Label from './Label';
import { CalenderIcon } from '../../icons';

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: (dates: Date[], dateStr: string, instance: any) => void;
  defaultDate?: Date | string | Date[] | string[];
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
  const handleChange = (newValue: any) => {
    if (onChange) {
      const dateStr = newValue ? newValue.format('YYYY-MM-DD') : '';
      const date = newValue ? newValue.toDate() : null;
      onChange(date ? [date] : [], dateStr, null);
    }
  };

  if (monthYearOnly) {
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
                onChange([newDate], e.target.value, null as any);
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

  const dateValue = defaultDate ? dayjs(defaultDate as any) : null;

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <MuiDatePicker
          value={dateValue}
          onChange={handleChange}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              placeholder,
              sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', height: '44px' } },
            },
            popper: { sx: { zIndex: 999999 } },
            dialog: { sx: { zIndex: 999999 } },
          }}
        />
      </LocalizationProvider>
    </div>
  );
}
