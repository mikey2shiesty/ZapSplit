// ═══════════════════════════════════════════════════════════════
// Input Validation Utilities - Security & Data Integrity
// ═══════════════════════════════════════════════════════════════

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string | number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Email Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const sanitized = email.trim().toLowerCase();

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }

  if (!EMAIL_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Phone Number Validation (Australian format)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AU_PHONE_REGEX = /^(\+61|0)[4-9]\d{8}$/;
const INTL_PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export function validatePhoneNumber(phone: string, requireAustralian = false): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const sanitized = phone.replace(/[\s\-\(\)]/g, '');

  if (sanitized.length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }

  if (requireAustralian) {
    if (!AU_PHONE_REGEX.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid Australian phone number' };
    }
  } else {
    if (!INTL_PHONE_REGEX.test(sanitized)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Amount Validation (Money)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateAmount(
  amount: number | string,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
  } = {}
): ValidationResult {
  const { min = 0.01, max = 100000, allowZero = false } = options;

  // Parse string to number if needed
  let numAmount: number;
  if (typeof amount === 'string') {
    // Remove currency symbols and commas
    const cleaned = amount.replace(/[$,\s]/g, '');
    numAmount = parseFloat(cleaned);
  } else {
    numAmount = amount;
  }

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }

  if (!allowZero && numAmount === 0) {
    return { isValid: false, error: 'Amount cannot be zero' };
  }

  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (numAmount < min) {
    return { isValid: false, error: `Amount must be at least $${min.toFixed(2)}` };
  }

  if (numAmount > max) {
    return { isValid: false, error: `Amount cannot exceed $${max.toFixed(2)}` };
  }

  // Round to 2 decimal places
  const sanitized = Math.round(numAmount * 100) / 100;

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Text Input Sanitization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function sanitizeText(
  text: string,
  options: {
    maxLength?: number;
    minLength?: number;
    allowSpecialChars?: boolean;
    allowHtml?: boolean;
  } = {}
): ValidationResult {
  const { maxLength = 500, minLength = 0, allowSpecialChars = true, allowHtml = false } = options;

  if (text === null || text === undefined) {
    return { isValid: minLength === 0, error: minLength > 0 ? 'This field is required' : undefined, sanitized: '' };
  }

  if (typeof text !== 'string') {
    return { isValid: false, error: 'Invalid input type' };
  }

  let sanitized = text.trim();

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove potentially dangerous characters for SQL injection
  // Note: Supabase uses parameterized queries, but this is defense in depth
  sanitized = sanitized.replace(/['";\\]/g, (char) => {
    if (allowSpecialChars) {
      return char === "'" ? "'" : char; // Allow single quotes but escape
    }
    return '';
  });

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  if (sanitized.length < minLength) {
    return { isValid: false, error: `Must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Cannot exceed ${maxLength} characters` };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Name Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateName(name: string): ValidationResult {
  const result = sanitizeText(name, { maxLength: 100, minLength: 1 });

  if (!result.isValid) {
    return { isValid: false, error: result.error || 'Name is required' };
  }

  // Check for valid name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[\p{L}\s\-'\.]+$/u;
  if (!nameRegex.test(result.sanitized as string)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return result;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Username Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateUsername(username: string): ValidationResult {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const sanitized = username.trim().toLowerCase();

  if (sanitized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (sanitized.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters' };
  }

  // Only allow alphanumeric and underscores
  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(sanitized)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Prevent reserved words
  const reserved = ['admin', 'root', 'system', 'support', 'help', 'zapsplit', 'official'];
  if (reserved.includes(sanitized)) {
    return { isValid: false, error: 'This username is reserved' };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Password Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' };
  }

  // Check for at least one uppercase, lowercase, and number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and a number',
    };
  }

  return { isValid: true };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UUID Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUUID(uuid: string): ValidationResult {
  if (!uuid || typeof uuid !== 'string') {
    return { isValid: false, error: 'Invalid ID' };
  }

  const sanitized = uuid.trim().toLowerCase();

  if (!UUID_REGEX.test(sanitized)) {
    return { isValid: false, error: 'Invalid ID format' };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BSB Validation (Australian Bank)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateBSB(bsb: string): ValidationResult {
  if (!bsb || typeof bsb !== 'string') {
    return { isValid: false, error: 'BSB is required' };
  }

  // Remove dashes and spaces
  const sanitized = bsb.replace(/[\s\-]/g, '');

  if (!/^\d{6}$/.test(sanitized)) {
    return { isValid: false, error: 'BSB must be 6 digits' };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Account Number Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { isValid: false, error: 'Account number is required' };
  }

  // Remove spaces
  const sanitized = accountNumber.replace(/\s/g, '');

  if (!/^\d{6,10}$/.test(sanitized)) {
    return { isValid: false, error: 'Account number must be 6-10 digits' };
  }

  return { isValid: true, sanitized };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PayID Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validatePayID(payId: string, type: 'email' | 'phone' | 'abn'): ValidationResult {
  if (!payId || typeof payId !== 'string') {
    return { isValid: false, error: 'PayID is required' };
  }

  switch (type) {
    case 'email':
      return validateEmail(payId);
    case 'phone':
      return validatePhoneNumber(payId, true);
    case 'abn':
      const sanitized = payId.replace(/\s/g, '');
      if (!/^\d{11}$/.test(sanitized)) {
        return { isValid: false, error: 'ABN must be 11 digits' };
      }
      return { isValid: true, sanitized };
    default:
      return { isValid: false, error: 'Invalid PayID type' };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Split Title/Description Validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateSplitTitle(title: string): ValidationResult {
  return sanitizeText(title, { maxLength: 100, minLength: 1 });
}

export function validateSplitDescription(description: string): ValidationResult {
  return sanitizeText(description, { maxLength: 500, minLength: 0 });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Batch Validation Helper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateAll(
  validations: { field: string; result: ValidationResult }[]
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const { field, result } of validations) {
    if (!result.isValid && result.error) {
      errors[field] = result.error;
      isValid = false;
    }
  }

  return { isValid, errors };
}
