/**
 * Form Validation Utilities
 * Enhanced form validation with real-time feedback and error handling
 */

import { Security, ValidationResult } from './security';

// ============================================================================
// FORM FIELD VALIDATION
// ============================================================================

export interface FieldValidation {
  value: string;
  isValid: boolean;
  errors: string[];
  touched: boolean;
}

export interface FormErrors {
  [key: string]: string[];
}

/**
 * Create initial field validation state
 */
export function createFieldValidation(initialValue: string = ''): FieldValidation {
  return {
    value: initialValue,
    isValid: true,
    errors: [],
    touched: false,
  };
}

// ============================================================================
// SPECIFIC FIELD VALIDATORS
// ============================================================================

/**
 * Validate login form
 */
export function validateLoginForm(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  // Email validation
  const emailValidation = Security.validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }

  // Password validation (basic check for login)
  if (!password || password.trim().length === 0) {
    errors.password = ['Password is required'];
  }

  return errors;
}

/**
 * Validate registration form
 */
export function validateRegistrationForm(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Name validation
  const nameValidation = Security.validateName(data.name, 'Full name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errors;
  }

  // Email validation
  const emailValidation = Security.validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }

  // Password validation
  const passwordValidation = Security.validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors;
  }

  // Confirm password
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = ['Passwords do not match'];
  }

  // Role validation (if provided)
  if (data.role) {
    const validRoles = ['student', 'instructor', 'admin'];
    if (!validRoles.includes(data.role)) {
      errors.role = ['Invalid role selected'];
    }
  }

  return errors;
}

/**
 * Validate course creation form
 */
export function validateCourseForm(data: {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price?: number;
  cpdUnits?: number;
}): FormErrors {
  const errors: FormErrors = {};

  // Title validation
  const titleValidation = Security.validateTextLength(data.title, 5, 200, 'Course title');
  if (!titleValidation.isValid) {
    errors.title = titleValidation.errors;
  }

  // Description validation
  const descValidation = Security.validateTextLength(data.description, 20, 2000, 'Description');
  if (!descValidation.isValid) {
    errors.description = descValidation.errors;
  }

  // Category validation
  if (!data.category || data.category.trim().length === 0) {
    errors.category = ['Category is required'];
  }

  // Level validation
  const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
  if (!validLevels.includes(data.level)) {
    errors.level = ['Please select a valid difficulty level'];
  }

  // Duration validation
  if (!data.duration || data.duration.trim().length === 0) {
    errors.duration = ['Duration is required'];
  }

  // Price validation (if provided)
  if (data.price !== undefined) {
    const priceValidation = Security.validateNumberRange(data.price, 0, 1000000, 'Price');
    if (!priceValidation.isValid) {
      errors.price = priceValidation.errors;
    }
  }

  // CPD units validation (if provided)
  if (data.cpdUnits !== undefined) {
    const cpdValidation = Security.validateNumberRange(data.cpdUnits, 0, 100, 'CPD units');
    if (!cpdValidation.isValid) {
      errors.cpdUnits = cpdValidation.errors;
    }
  }

  return errors;
}

/**
 * Validate profile update form
 */
export function validateProfileForm(data: {
  name: string;
  email: string;
  phone?: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Name validation
  const nameValidation = Security.validateName(data.name, 'Full name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.errors;
  }

  // Email validation
  const emailValidation = Security.validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.errors;
  }

  // Phone validation (if provided)
  if (data.phone && data.phone.trim().length > 0) {
    const phoneValidation = Security.validatePhoneNumber(data.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.errors;
    }
  }

  return errors;
}

/**
 * Validate certificate verification code
 */
export function validateVerificationCode(code: string): FormErrors {
  const errors: FormErrors = {};

  if (!code || code.trim().length === 0) {
    errors.code = ['Verification code is required'];
    return errors;
  }

  // Format: CCELL-YYYY-XXX-NNNNNN
  const codePattern = /^CCELL-\d{4}-[A-Z]{3}-\d{6}$/;
  if (!codePattern.test(code)) {
    errors.code = ['Invalid verification code format. Expected: CCELL-YYYY-XXX-NNNNNN'];
  }

  return errors;
}

/**
 * Validate quiz submission
 */
export function validateQuizSubmission(data: {
  courseId: string;
  quizId: string;
  answers: any[];
  score?: number;
}): FormErrors {
  const errors: FormErrors = {};

  // Course ID
  if (!data.courseId || data.courseId.trim().length === 0) {
    errors.courseId = ['Course ID is required'];
  }

  // Quiz ID
  if (!data.quizId || data.quizId.trim().length === 0) {
    errors.quizId = ['Quiz ID is required'];
  }

  // Answers
  if (!Array.isArray(data.answers) || data.answers.length === 0) {
    errors.answers = ['Quiz answers are required'];
  }

  // Score validation (if provided)
  if (data.score !== undefined) {
    const scoreValidation = Security.validateNumberRange(data.score, 0, 100, 'Score');
    if (!scoreValidation.isValid) {
      errors.score = scoreValidation.errors;
    }
  }

  return errors;
}

/**
 * Validate enrollment form
 */
export function validateEnrollmentForm(data: {
  courseId: string;
  paymentMethod?: string;
  paymentProof?: string;
}): FormErrors {
  const errors: FormErrors = {};

  // Course ID
  if (!data.courseId || data.courseId.trim().length === 0) {
    errors.courseId = ['Course ID is required'];
  }

  // Payment method (if course has a price)
  if (data.paymentMethod && data.paymentMethod.trim().length === 0) {
    errors.paymentMethod = ['Payment method is required for paid courses'];
  }

  // Payment proof URL validation (if provided)
  if (data.paymentProof && data.paymentProof.trim().length > 0) {
    const urlValidation = Security.validateURL(data.paymentProof);
    if (!urlValidation.isValid) {
      errors.paymentProof = ['Payment proof must be a valid URL'];
    }
  }

  return errors;
}

// ============================================================================
// FORM HELPERS
// ============================================================================

/**
 * Check if form has any errors
 */
export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get first error message from form errors
 */
export function getFirstError(errors: FormErrors): string | null {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return null;

  const fieldErrors = errors[firstKey];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
}

/**
 * Get all error messages as a flat array
 */
export function getAllErrors(errors: FormErrors): string[] {
  return Object.values(errors).flat();
}

/**
 * Format error messages for display
 */
export function formatErrorMessages(errors: FormErrors): { [key: string]: string } {
  const formatted: { [key: string]: string } = {};

  for (const [field, messages] of Object.entries(errors)) {
    formatted[field] = messages.join('. ');
  }

  return formatted;
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...validations: ValidationResult[]): ValidationResult {
  const allErrors = validations.flatMap(v => v.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ============================================================================
// REAL-TIME VALIDATION HELPERS
// ============================================================================

/**
 * Debounce function for real-time validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create real-time field validator
 * Returns a debounced validation function
 */
export function createRealtimeValidator(
  validateFn: (value: string) => ValidationResult,
  delay: number = 300
) {
  return debounce((value: string, callback: (result: ValidationResult) => void) => {
    const result = validateFn(value);
    callback(result);
  }, delay);
}

// ============================================================================
// FIELD-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Email field validator (for real-time validation)
 */
export const emailValidator = (value: string): ValidationResult => {
  return Security.validateEmail(value);
};

/**
 * Password field validator (for real-time validation)
 */
export const passwordValidator = (value: string): ValidationResult => {
  return Security.validatePassword(value);
};

/**
 * Name field validator (for real-time validation)
 */
export const nameValidator = (value: string): ValidationResult => {
  return Security.validateName(value);
};

/**
 * Phone field validator (for real-time validation)
 */
export const phoneValidator = (value: string): ValidationResult => {
  return Security.validatePhoneNumber(value);
};

// ============================================================================
// CUSTOM VALIDATION RULES
// ============================================================================

/**
 * Required field validation
 */
export function required(value: string, fieldName: string = 'This field'): ValidationResult {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      errors: [`${fieldName} is required`],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Min length validation
 */
export function minLength(value: string, min: number, fieldName: string = 'This field'): ValidationResult {
  if (value.trim().length < min) {
    return {
      isValid: false,
      errors: [`${fieldName} must be at least ${min} characters`],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Max length validation
 */
export function maxLength(value: string, max: number, fieldName: string = 'This field'): ValidationResult {
  if (value.trim().length > max) {
    return {
      isValid: false,
      errors: [`${fieldName} must be no more than ${max} characters`],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Pattern validation
 */
export function pattern(value: string, regex: RegExp, message: string): ValidationResult {
  if (!regex.test(value)) {
    return {
      isValid: false,
      errors: [message],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

/**
 * Match validation (for password confirmation)
 */
export function match(value: string, compareValue: string, fieldName: string = 'Values'): ValidationResult {
  if (value !== compareValue) {
    return {
      isValid: false,
      errors: [`${fieldName} do not match`],
    };
  }

  return {
    isValid: true,
    errors: [],
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const FormValidation = {
  // Form validators
  validateLoginForm,
  validateRegistrationForm,
  validateCourseForm,
  validateProfileForm,
  validateVerificationCode,
  validateQuizSubmission,
  validateEnrollmentForm,

  // Error helpers
  hasErrors,
  getFirstError,
  getAllErrors,
  formatErrorMessages,
  combineValidations,

  // Real-time validation
  debounce,
  createRealtimeValidator,
  emailValidator,
  passwordValidator,
  nameValidator,
  phoneValidator,

  // Custom rules
  required,
  minLength,
  maxLength,
  pattern,
  match,

  // Field state
  createFieldValidation,
};

export default FormValidation;
