import type { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  disabled,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`input-field-group ${error ? 'input-field-has-error' : ''} ${disabled ? 'input-field-disabled' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-field-label">
          {label}
          {required && <span className="input-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className="input-field-control"
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="input-field-error-text" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="input-field-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}
