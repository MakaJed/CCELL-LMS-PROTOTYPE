/**
 * Secure API Client
 * Enhanced API client with input sanitization, rate limiting, and error handling
 */

import { Security } from './security';
import { FormValidation } from './formValidation';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_CONFIG = {
  // Rate limiting config
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_LOGIN_ATTEMPTS: 5,
  MAX_ENROLLMENT_ATTEMPTS: 10,
  MAX_CERTIFICATE_REQUESTS: 10,

  // Timeout config
  REQUEST_TIMEOUT: 30000, // 30 seconds

  // Retry config
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check if request is rate limited
 */
function checkRequestRateLimit(endpoint: string): boolean {
  const key = `api_${endpoint}`;
  const result = Security.checkRateLimit(key, API_CONFIG.MAX_REQUESTS_PER_MINUTE, 60000);

  if (!result.allowed) {
    const resetTime = new Date(result.resetTime);
    throw new Error(
      `Too many requests. Please try again at ${resetTime.toLocaleTimeString()}`
    );
  }

  return true;
}

/**
 * Check login rate limit
 */
function checkLoginRateLimit(email: string): boolean {
  const key = `login_${email}`;
  const result = Security.checkRateLimit(key, API_CONFIG.MAX_LOGIN_ATTEMPTS, 900000); // 15 minutes

  if (!result.allowed) {
    throw new Error(
      'Too many login attempts. Please try again in 15 minutes or reset your password.'
    );
  }

  return true;
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize request body
 * Recursively sanitizes all string values in the object
 */
function sanitizeRequestBody(data: any): any {
  if (typeof data === 'string') {
    return Security.sanitizeText(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeRequestBody(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeRequestBody(value);
    }
    return sanitized;
  }

  return data;
}

/**
 * Sanitize query parameters
 */
function sanitizeQueryParams(params: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    // Sanitize key
    const cleanKey = Security.sanitizeText(key);

    // Sanitize value (search queries get special treatment)
    const cleanValue = key.toLowerCase().includes('search') || key.toLowerCase().includes('query')
      ? Security.sanitizeSearchQuery(value)
      : Security.sanitizeText(value);

    sanitized[cleanKey] = cleanValue;
  }

  return sanitized;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Handle API errors with user-friendly messages
 */
function handleAPIError(error: any, endpoint: string): never {
  console.error(`API Error [${endpoint}]:`, error);

  // Network errors
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    throw new APIError(
      'Network error. Please check your internet connection and try again.',
      0
    );
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    throw new APIError(
      'Request timeout. The server took too long to respond. Please try again.',
      408
    );
  }

  // API errors
  if (error instanceof APIError) {
    throw error;
  }

  // Generic errors
  throw new APIError(
    error.message || 'An unexpected error occurred. Please try again.',
    error.statusCode
  );
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Create abort controller with timeout
 */
function createAbortController(timeout: number): AbortController {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort();
  }, timeout);

  return controller;
}

/**
 * Retry failed requests with exponential backoff
 */
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = API_CONFIG.MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) {
      throw error;
    }

    // Don't retry on client errors (4xx)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      throw error;
    }

    // Wait before retrying with exponential backoff
    const delay = API_CONFIG.RETRY_DELAY * (API_CONFIG.MAX_RETRIES - retries + 1);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryRequest(fn, retries - 1);
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and sanitize login data
 */
export function validateLoginData(email: string, password: string): { email: string; password: string } {
  // Rate limit check
  checkLoginRateLimit(email);

  // Validation
  const errors = FormValidation.validateLoginForm(email, password);
  if (FormValidation.hasErrors(errors)) {
    const firstError = FormValidation.getFirstError(errors);
    throw new APIError(firstError || 'Invalid login credentials', 400);
  }

  // Sanitization
  return {
    email: Security.sanitizeEmail(email),
    password: password, // Don't sanitize password
  };
}

/**
 * Validate and sanitize registration data
 */
export function validateRegistrationData(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}): any {
  // Validation
  const errors = FormValidation.validateRegistrationForm(data);
  if (FormValidation.hasErrors(errors)) {
    const firstError = FormValidation.getFirstError(errors);
    throw new APIError(firstError || 'Invalid registration data', 400);
  }

  // Sanitization
  return {
    name: Security.sanitizeText(data.name),
    email: Security.sanitizeEmail(data.email),
    password: data.password, // Don't sanitize password
    role: data.role ? Security.sanitizeText(data.role) : undefined,
  };
}

/**
 * Validate and sanitize course data
 */
export function validateCourseData(data: {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price?: number;
  cpdUnits?: number;
}): any {
  // Check for XSS in description
  if (Security.containsPotentialXSS(data.description)) {
    throw new APIError('Description contains potentially dangerous content', 400);
  }

  // Validation
  const errors = FormValidation.validateCourseForm(data);
  if (FormValidation.hasErrors(errors)) {
    const firstError = FormValidation.getFirstError(errors);
    throw new APIError(firstError || 'Invalid course data', 400);
  }

  // Sanitization
  return {
    title: Security.sanitizeText(data.title),
    description: Security.sanitizeHTML(data.description),
    category: Security.sanitizeText(data.category),
    level: Security.sanitizeText(data.level),
    duration: Security.sanitizeText(data.duration),
    price: data.price,
    cpdUnits: data.cpdUnits,
  };
}

/**
 * Validate and sanitize enrollment data
 */
export function validateEnrollmentData(data: {
  courseId: string;
  paymentMethod?: string;
  paymentProof?: string;
}): any {
  // Rate limit
  checkRequestRateLimit('enrollment');

  // Validation
  const errors = FormValidation.validateEnrollmentForm(data);
  if (FormValidation.hasErrors(errors)) {
    const firstError = FormValidation.getFirstError(errors);
    throw new APIError(firstError || 'Invalid enrollment data', 400);
  }

  // Sanitization
  return {
    courseId: Security.sanitizeText(data.courseId),
    paymentMethod: data.paymentMethod ? Security.sanitizeText(data.paymentMethod) : undefined,
    paymentProof: data.paymentProof ? Security.sanitizeURL(data.paymentProof) : undefined,
  };
}

/**
 * Validate certificate verification code
 */
export function validateCertificateCode(code: string): string {
  // Rate limit
  checkRequestRateLimit('certificate_verification');

  // Validation
  const errors = FormValidation.validateVerificationCode(code);
  if (FormValidation.hasErrors(errors)) {
    const firstError = FormValidation.getFirstError(errors);
    throw new APIError(firstError || 'Invalid verification code', 400);
  }

  // Sanitization
  return Security.sanitizeText(code).toUpperCase();
}

// ============================================================================
// SECURE REQUEST WRAPPER
// ============================================================================

/**
 * Make a secure API request with all safety features
 */
export async function secureRequest<T>(
  endpoint: string,
  options?: RequestInit & {
    sanitizeBody?: boolean;
    rateLimit?: boolean;
    timeout?: number;
    retry?: boolean;
  }
): Promise<T> {
  const {
    sanitizeBody = true,
    rateLimit = true,
    timeout = API_CONFIG.REQUEST_TIMEOUT,
    retry = true,
    ...fetchOptions
  } = options || {};

  // Rate limiting
  if (rateLimit) {
    checkRequestRateLimit(endpoint);
  }

  // Sanitize request body
  let body = fetchOptions.body;
  if (body && sanitizeBody && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      const sanitized = sanitizeRequestBody(parsed);
      body = JSON.stringify(sanitized);
    } catch (error) {
      console.warn('Failed to sanitize request body:', error);
    }
  }

  // Create request function
  const makeRequest = async (): Promise<T> => {
    const controller = createAbortController(timeout);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        body,
        signal: controller.signal,
      });

      // Parse response
      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        throw new APIError(
          data.error || `Request failed with status ${response.status}`,
          response.status,
          data.details
        );
      }

      return data;
    } catch (error: any) {
      return handleAPIError(error, endpoint);
    }
  };

  // Execute with retry if enabled
  if (retry) {
    return retryRequest(makeRequest);
  }

  return makeRequest();
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Get secure request headers
 */
export function getSecureHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  };

  // Add CSRF token if available
  const csrfToken = Security.getCSRFToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const SecureAPI = {
  // Request helpers
  secureRequest,
  getSecureHeaders,

  // Validation helpers
  validateLoginData,
  validateRegistrationData,
  validateCourseData,
  validateEnrollmentData,
  validateCertificateCode,

  // Sanitization helpers
  sanitizeRequestBody,
  sanitizeQueryParams,

  // Rate limiting
  checkRequestRateLimit,
  checkLoginRateLimit,

  // Error class
  APIError,
};

export default SecureAPI;
