import React from 'react';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import TimePicker from "@/components/ui/TimePicker";

export type FormFieldType = 'text' | 'number' | 'email' | 'password' | 'date' | 'time' | 'select' | 'textarea';

interface FormFieldProps {
  label: string;
  name: string;
  type?: FormFieldType;
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  options?: { value: string | number; label: string }[];
  className?: string;
  autoFocus?: boolean;
  hideLabel?: boolean;
}

/**
 * FormField - Standard form field component
 * Supports text, number, email, password, date, select, and textarea types
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  options,
  className = '',
  autoFocus = false,
  hideLabel = false,
}) => {
  const inputClassName = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-300
    dark:bg-gray-900 dark:border-gray-700 dark:text-white/90
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200'}
    ${className}
  `;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    onChange?.(newValue);
  };

  return (
    <div className="flex flex-col">
      <label className={`block text-xs font-medium text-gray-500 dark:text-gray-400 ${hideLabel ? 'sr-only' : 'mb-1'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          autoFocus={autoFocus}
          className={inputClassName}
        >
          <option value="">เลือก...</option>
          {options?.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={3}
          className={inputClassName}
        />
      ) : type === 'time' ? (
        <TimePicker
          value={value ? String(value) : ''}
          onChange={(time) => { onChange?.(time); }}
          placeholder={placeholder}
        />
      ) : type === 'date' ? (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={value ? dayjs(String(value)) : null}
            onChange={(newValue) => onChange?.(newValue ? newValue.format('YYYY-MM-DD') : '')}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                error: !!error,
                disabled,
                autoFocus,
                sx: { '& .MuiOutlinedInput-root': { borderRadius: '0.5rem', height: '40px' } },
              },
              popper: { sx: { zIndex: 999999 } },
              dialog: { sx: { zIndex: 999999 } },
            }}
          />
        </LocalizationProvider>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={inputClassName}
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormField;
