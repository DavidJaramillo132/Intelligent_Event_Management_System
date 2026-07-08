import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import './FormField.css';

type BaseProps = {
  id: string;
  label: string;
  error?: string | null;
  helpText?: string;
  required?: boolean;
};

type InputFieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type SelectFieldProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { as: 'select'; children: ReactNode };
type TextareaFieldProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' };

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export default function FormField(props: FormFieldProps) {
  const { id, label, error, helpText, required, as = 'input', ...rest } = props;

  const labelText = required ? `${label} (requerido)` : label;
  const describedBy: string[] = [];
  if (helpText) describedBy.push(`${id}-help`);
  if (error) describedBy.push(`${id}-error`);

  const fieldProps = {
    id,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    'aria-invalid': error ? true : undefined,
    className: `form-field__input ${error ? 'form-field__input--error' : ''}`,
  };

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {labelText}
      </label>

      {as === 'select' ? (
        <select {...fieldProps} {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}>
          {(props as SelectFieldProps).children}
        </select>
      ) : as === 'textarea' ? (
        <textarea {...fieldProps} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...fieldProps} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}

      {helpText && !error && (
        <p id={`${id}-help`} className="form-field__help">
          {helpText}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="form-field__error" role="alert">
          <span className="form-field__error-icon" aria-hidden="true">⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}
