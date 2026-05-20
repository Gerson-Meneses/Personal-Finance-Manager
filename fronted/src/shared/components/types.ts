export interface BaseInputProps<T> {
  value?: T;
  onChange: (value: T) => void;

  label?: string;
  error?: string | null;

  name?: string;
  id?: string;

  disabled?: boolean;
  required?: boolean;

  className?: string;
}