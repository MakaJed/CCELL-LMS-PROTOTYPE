/**
 * Security Utilities
 * Input sanitization, XSS prevention, and security helpers
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes dangerous HTML tags and attributes
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (strip all HTML)
 * Use for user inputs that should never contain HTML
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user input for search queries
 * Prevents SQL injection patterns and special characters
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';

  // Remove SQL injection patterns
  let clean = query.replace(/['"`;()]/g, '');

  // Remove excessive whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  // Limit length
  return clean.slice(0, 100);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  const normalized = validator.normalizeEmail(email) || '';
  return sanitizeText(normalized);
}

/**
 * Sanitize URL
 * Only allows http and https protocols
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize file name
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';

  // Remove path traversal attempts
  let clean = filename.replace(/\.\./g, '');

  // Remove special characters except dots, dashes, underscores
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  return clean.slice(0, 255);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  if (!validator.isEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  if (email.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name (first name, last name, full name)
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }

  if (trimmed.length > 100) {
    errors.push(`${fieldName} is too long (max 100 characters)`);
  }

  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number (Philippine format)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || typeof phone !== 'string') {
    errors.push('Phone number is required');
    return { isValid: false, errors };
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Philippine mobile format: 09XX-XXX-XXXX or +639XX-XXX-XXXX
  const mobileRegex = /^(09|\+639)\d{9}$/;

  // Philippine landline format: (0XX) XXX-XXXX
  const landlineRegex = /^0\d{9,10}$/;

  if (!mobileRegex.test(cleaned) && !landlineRegex.test(cleaned)) {
    errors.push('Please enter a valid Philippine phone number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate URL
 */
export function validateURL(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    errors.push('Please enter a valid URL (must start with http:// or https://)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate text length
 */
export function validateTextLength(
  text: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'Field'
): ValidationResult {
  const errors: string[] = [];

  if (!text || typeof text !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} must be no more than ${maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string = 'Value'
): ValidationResult {
  const errors: string[] = [];

  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }

  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (value > max) {
    errors.push(`${fieldName} must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// RATE LIMITING (Client-side tracking)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if action is rate limited
 * Client-side rate limiting to reduce server load
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // First attempt
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.count >= maxAttempts) {
    // Rate limit exceeded
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate CSRF token
 * Use this for forms that modify data
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCSRFToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.error('Failed to store CSRF token:', error);
  }
}

/**
 * Get CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.error('Failed to retrieve CSRF token:', error);
    return null;
  }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}

// ============================================================================
// SECURE RANDOM GENERATION
// ============================================================================

/**
 * Generate cryptographically secure random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate verification code
 * Format: XXXX-XXXX-XXXX
 */
export function generateVerificationCode(): string {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    const array = new Uint8Array(2);
    crypto.getRandomValues(array);
    const segment = Array.from(array, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
    segments.push(segment);
  }
  return segments.join('-');
}

// ============================================================================
// CONTENT SECURITY HELPERS
// ============================================================================

/**
 * Check if content contains potential XSS
 */
export function containsPotentialXSS(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onload=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];

  return xssPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if content contains potential SQL injection
 */
export function containsPotentialSQLInjection(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const sqlPatterns = [
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
    /union\s+select/i,
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
    /;\s*insert\s+into/i,
    /;\s*update\s+\w+\s+set/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(content));
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const Security = {
  // Sanitization
  sanitizeHTML,
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeEmail,
  sanitizeURL,
  sanitizeFileName,

  // Validation
  validateEmail,
  validatePassword,
  validateName,
  validatePhoneNumber,
  validateURL,
  validateTextLength,
  validateNumberRange,

  // Rate limiting
  checkRateLimit,
  clearRateLimit,

  // CSRF
  generateCSRFToken,
  storeCSRFToken,
  getCSRFToken,
  validateCSRFToken,

  // Random generation
  generateSecureRandomString,
  generateVerificationCode,

  // Content security
  containsPotentialXSS,
  containsPotentialSQLInjection,
  safeJSONParse,
};

export default Security;
