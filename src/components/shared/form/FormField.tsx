import React from 'react';

export type FormFieldType = 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea';

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
      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
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
          rows={3}
          className={inputClassName}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
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
