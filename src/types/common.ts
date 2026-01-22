// Common types used across the application

export type Theme = 'light' | 'dark';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  variant: AlertVariant;
  title: string;
  message: string;
}

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface ModalProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
