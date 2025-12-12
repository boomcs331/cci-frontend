// Login validation utilities

export interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ip?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

// Email validation
export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'กรุณากรอกอีเมล';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'รูปแบบอีเมลไม่ถูกต้อง';
  
  // Check for common invalid patterns
  if (email.includes('..')) return 'อีเมลไม่ถูกต้อง';
  if (email.startsWith('.') || email.endsWith('.')) return 'อีเมลไม่ถูกต้อง';
  
  return undefined;
};

// Password validation
export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'กรุณากรอกรหัสผ่าน';
  if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
  if (password.length > 128) return 'รหัสผ่านยาวเกินไป';
  
  // Check for common weak passwords
  const weakPasswords = ['123456', 'password', 'admin', 'qwerty', '111111'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return 'รหัสผ่านนี้ไม่ปลอดภัย กรุณาเลือกรหัสผ่านที่แข็งแกร่งกว่า';
  }
  
  return undefined;
};

// Rate limiting for login attempts
export class LoginRateLimit {
  private attempts: Map<string, LoginAttempt[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly blockDurationMs = 5 * 60 * 1000; // 5 minutes

  // Check if user is blocked
  isBlocked(email: string): boolean {
    const userAttempts = this.attempts.get(email.toLowerCase()) || [];
    const recentAttempts = userAttempts.filter(
      attempt => Date.now() - attempt.timestamp < this.windowMs
    );

    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    
    if (failedAttempts.length >= this.maxAttempts) {
      const lastFailedAttempt = failedAttempts[failedAttempts.length - 1];
      return Date.now() - lastFailedAttempt.timestamp < this.blockDurationMs;
    }

    return false;
  }

  // Record login attempt
  recordAttempt(email: string, success: boolean): void {
    const normalizedEmail = email.toLowerCase();
    const attempts = this.attempts.get(normalizedEmail) || [];
    
    attempts.push({
      email: normalizedEmail,
      timestamp: Date.now(),
      success
    });

    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < this.windowMs
    );

    this.attempts.set(normalizedEmail, recentAttempts);
  }

  // Get remaining attempts
  getRemainingAttempts(email: string): number {
    const userAttempts = this.attempts.get(email.toLowerCase()) || [];
    const recentFailedAttempts = userAttempts.filter(
      attempt => 
        Date.now() - attempt.timestamp < this.windowMs && 
        !attempt.success
    );

    return Math.max(0, this.maxAttempts - recentFailedAttempts.length);
  }

  // Get time until unblock
  getTimeUntilUnblock(email: string): number {
    const userAttempts = this.attempts.get(email.toLowerCase()) || [];
    const recentFailedAttempts = userAttempts.filter(
      attempt => 
        Date.now() - attempt.timestamp < this.windowMs && 
        !attempt.success
    );

    if (recentFailedAttempts.length >= this.maxAttempts) {
      const lastFailedAttempt = recentFailedAttempts[recentFailedAttempts.length - 1];
      const timeLeft = this.blockDurationMs - (Date.now() - lastFailedAttempt.timestamp);
      return Math.max(0, timeLeft);
    }

    return 0;
  }
}

// Global rate limiter instance
export const loginRateLimit = new LoginRateLimit();

// Comprehensive login validation
export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const errors: ValidationResult['errors'] = {};

  // Validate email
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  // Check rate limiting
  if (loginRateLimit.isBlocked(email)) {
    const timeLeft = loginRateLimit.getTimeUntilUnblock(email);
    const minutes = Math.ceil(timeLeft / (60 * 1000));
    errors.general = `บัญชีถูกล็อคชั่วคราว กรุณารอ ${minutes} นาทีแล้วลองใหม่`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Security headers and checks
export const getSecurityInfo = () => {
  return {
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    timestamp: Date.now(),
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
    language: typeof window !== 'undefined' ? navigator.language : ''
  };
};