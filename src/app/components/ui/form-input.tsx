/**
 * FormInput Component
 * Enhanced input component with built-in validation, sanitization, and error display
 */

import { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Label } from './label';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { ValidationResult } from '../../lib/security';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  validate?: (value: string) => ValidationResult;
  validateOnBlur?: boolean;
  validateRealtime?: boolean;
  showValidationIcon?: boolean;
  sanitize?: (value: string) => string;
  onValueChange?: (value: string, isValid: boolean) => void;
}

export function FormInput({
  label,
  error,
  helperText,
  validate,
  validateOnBlur = true,
  validateRealtime = false,
  showValidationIcon = true,
  sanitize,
  onValueChange,
  type = 'text',
  className = '',
  ...props
}: FormInputProps) {
  const [internalValue, setInternalValue] = useState(props.value?.toString() || '');
  const [internalError, setInternalError] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external error if provided, otherwise use internal
  const displayErrors = error
    ? Array.isArray(error)
      ? error
      : [error]
    : internalError;

  const hasError = displayErrors.length > 0 && touched;

  // Real-time validation
  useEffect(() => {
    if (validateRealtime && touched && validate) {
      const result = validate(internalValue);
      setInternalError(result.errors);
      setIsValid(result.isValid);

      if (onValueChange) {
        onValueChange(internalValue, result.isValid);
      }
    }
  }, [internalValue, validateRealtime, touched, validate, onValueChange]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Apply sanitization if provided
    if (sanitize) {
      value = sanitize(value);
    }

    setInternalValue(value);

    // Call original onChange if provided
    if (props.onChange) {
      props.onChange(e);
    }
  };

  // Handle blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);

    // Validate on blur if enabled
    if (validateOnBlur && validate) {
      const result = validate(internalValue);
      setInternalError(result.errors);
      setIsValid(result.isValid);

      if (onValueChange) {
        onValueChange(internalValue, result.isValid);
      }
    }

    // Call original onBlur if provided
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Generate unique ID for accessibility
  const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  // Determine input type
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      {/* Input Container */}
      <div className="relative">
        <Input
          ref={inputRef}
          id={inputId}
          type={inputType}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            ${className}
            ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
            ${isValid && touched && !hasError && showValidationIcon ? 'pr-10' : ''}
            ${type === 'password' ? 'pr-10' : ''}
          `}
          aria-invalid={hasError}
          aria-describedby={`
            ${hasError ? errorId : ''}
            ${helperText ? helperId : ''}
          `}
          {...props}
        />

        {/* Validation Icon */}
        {showValidationIcon && touched && !hasError && isValid && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !hasError && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {/* Error Messages */}
      {hasError && (
        <div id={errorId} className="space-y-1" role="alert" aria-live="polite">
          {displayErrors.map((err, index) => (
            <p key={index} className="text-sm text-red-600 flex items-start gap-1">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{err}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * FormTextarea Component
 * Enhanced textarea with validation
 */
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  validate?: (value: string) => ValidationResult;
  validateOnBlur?: boolean;
  showCharCount?: boolean;
  sanitize?: (value: string) => string;
}

export function FormTextarea({
  label,
  error,
  helperText,
  validate,
  validateOnBlur = true,
  showCharCount = false,
  sanitize,
  className = '',
  maxLength,
  ...props
}: FormTextareaProps) {
  const [internalValue, setInternalValue] = useState(props.value?.toString() || '');
  const [internalError, setInternalError] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const displayErrors = error
    ? Array.isArray(error)
      ? error
      : [error]
    : internalError;

  const hasError = displayErrors.length > 0 && touched;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (sanitize) {
      value = sanitize(value);
    }

    setInternalValue(value);

    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);

    if (validateOnBlur && validate) {
      const result = validate(internalValue);
      setInternalError(result.errors);
    }

    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  const inputId = props.id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const charCount = internalValue.length;
  const charLimit = maxLength || 0;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <textarea
        id={inputId}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        maxLength={maxLength}
        className={`
          flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base
          ring-offset-background placeholder:text-muted-foreground
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
          ${className}
          ${hasError ? 'border-red-500 focus:ring-red-500' : ''}
        `}
        aria-invalid={hasError}
        aria-describedby={`
          ${hasError ? errorId : ''}
          ${helperText ? helperId : ''}
        `}
        {...props}
      />

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="flex justify-end">
          <span className={`text-xs ${charCount > charLimit * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
            {charCount} / {charLimit}
          </span>
        </div>
      )}

      {helperText && !hasError && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {hasError && (
        <div id={errorId} className="space-y-1" role="alert" aria-live="polite">
          {displayErrors.map((err, index) => (
            <p key={index} className="text-sm text-red-600 flex items-start gap-1">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{err}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
