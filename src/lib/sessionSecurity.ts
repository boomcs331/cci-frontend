// Session security utilities

export interface SessionInfo {
  userId: string;
  email: string;
  loginTime: number;
  lastActivity: number;
  deviceInfo: {
    userAgent: string;
    ip?: string;
    timezone: string;
    language: string;
  };
  permissions: string[];
  sessionId: string;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'session_expired' | 'suspicious_activity';
  userId: string;
  timestamp: number;
  details: any;
}

// Session timeout settings
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours of inactivity

// Generate secure session ID
export const generateSessionId = (): string => {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Create session info
export const createSessionInfo = (
  userId: string, 
  email: string, 
  permissions: string[]
): SessionInfo => {
  return {
    userId,
    email,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    deviceInfo: {
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      language: typeof window !== 'undefined' ? navigator.language : ''
    },
    permissions,
    sessionId: generateSessionId()
  };
};

// Validate session
export const validateSession = (sessionInfo: SessionInfo): {
  isValid: boolean;
  reason?: string;
} => {
  const now = Date.now();

  // Check if session has expired
  if (now - sessionInfo.loginTime > SESSION_TIMEOUT) {
    return { isValid: false, reason: 'session_expired' };
  }

  // Check if user has been inactive too long
  if (now - sessionInfo.lastActivity > ACTIVITY_TIMEOUT) {
    return { isValid: false, reason: 'activity_timeout' };
  }

  // Check for suspicious activity (device change)
  if (typeof window !== 'undefined') {
    const currentUserAgent = navigator.userAgent;
    if (sessionInfo.deviceInfo.userAgent !== currentUserAgent) {
      return { isValid: false, reason: 'device_changed' };
    }
  }

  return { isValid: true };
};

// Update session activity
export const updateSessionActivity = (sessionInfo: SessionInfo): SessionInfo => {
  return {
    ...sessionInfo,
    lastActivity: Date.now()
  };
};

// Security event logger
class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 100;

  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', securityEvent);
    }
  }

  getEvents(userId?: string): SecurityEvent[] {
    if (userId) {
      return this.events.filter(event => event.userId === userId);
    }
    return [...this.events];
  }

  getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }
}

export const securityLogger = new SecurityLogger();

// Enhanced session storage with encryption (basic)
export const secureSessionStorage = {
  // Simple encryption (for demo purposes - use proper encryption in production)
  encrypt: (data: string): string => {
    if (typeof window === 'undefined') return data;
    return btoa(encodeURIComponent(data));
  },

  decrypt: (encryptedData: string): string => {
    if (typeof window === 'undefined') return encryptedData;
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  },

  setItem: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    const encrypted = secureSessionStorage.encrypt(JSON.stringify(value));
    localStorage.setItem(key, encrypted);
  },

  getItem: (key: string): any => {
    if (typeof window === 'undefined') return null;
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    try {
      const decrypted = secureSessionStorage.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Session monitoring
export class SessionMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;

  start(onSessionExpired: () => void): void {
    this.onSessionExpired = onSessionExpired;
    
    // Check session every minute
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, 60 * 1000);

    // Check on page visibility change
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkSession();
        }
      });
    }
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkSession(): void {
    const sessionInfo = secureSessionStorage.getItem('session_info');
    if (!sessionInfo) return;

    const validation = validateSession(sessionInfo);
    if (!validation.isValid) {
      securityLogger.logEvent({
        type: 'session_expired',
        userId: sessionInfo.userId,
        details: { reason: validation.reason }
      });

      // Clear session
      secureSessionStorage.removeItem('session_info');
      secureSessionStorage.removeItem('user');
      secureSessionStorage.removeItem('permissions');

      // Notify about expiration
      if (this.onSessionExpired) {
        this.onSessionExpired();
      }
    } else {
      // Update activity
      const updatedSession = updateSessionActivity(sessionInfo);
      secureSessionStorage.setItem('session_info', updatedSession);
    }
  }
}

export const sessionMonitor = new SessionMonitor();