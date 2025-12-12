// API service for authentication

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
      roles?: string[];
    };
    token: string;
    permissions?: string[];
  };
  error?: string;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    permissions?: string[];
    profile?: {
      department?: string;
      position?: string;
      avatar?: string;
      lastLogin?: string;
    };
  };
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Base API configuration
const API_BASE_URL = 'http://localhost:3006';
const API_TIMEOUT = 10000; // 10 seconds

// Create fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Login API call
export const loginApi = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    console.log('🔐 API: Sending login request to', `${API_BASE_URL}/auth/login`);
    console.log('🔐 API: Username:', credentials.username);

    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('🔐 API: Response status:', response.status);

    // Parse response
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('❌ API: Failed to parse response JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

    console.log('🔐 API: Response data:', responseData);

    // Handle different response statuses
    if (response.ok) {
      // Success response (200-299)
      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message || 'Login successful'
      };
    } else {
      // Error response (400+)
      return {
        success: false,
        error: responseData.message || responseData.error || `HTTP ${response.status}`,
        message: responseData.message || 'Login failed'
      };
    }

  } catch (error: any) {
    console.error('❌ API: Login request failed:', error);

    // Handle different types of errors
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - please check your connection',
        message: 'การเชื่อมต่อหมดเวลา กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      };
    }

    if (error.code === 'ECONNREFUSED' || 
        error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')) {
      return {
        success: false,
        error: 'Cannot connect to server',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่'
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'
    };
  }
};

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    console.log('🔍 API: Testing connection to', API_BASE_URL);
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
      method: 'GET',
    }, 5000); // 5 second timeout for health check

    console.log('🔍 API: Health check status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('❌ API: Health check failed:', error);
    return false;
  }
};

// Get user profile and permissions from API
export const getUserProfileApi = async (userId: string, token?: string): Promise<UserProfileResponse> => {
  try {
    console.log('👤 API: Fetching user profile for ID:', userId);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization header if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/profile/${userId}`, {
      method: 'GET',
      headers,
    });

    console.log('👤 API: Profile response status:', response.status);

    // Parse response
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error('❌ API: Failed to parse profile response JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

    console.log('👤 API: Profile response data:', responseData);

    // Handle different response statuses
    if (response.ok) {
      // Success response (200-299)
      return {
        success: true,
        data: responseData.data || responseData,
        message: responseData.message || 'Profile fetched successfully'
      };
    } else {
      // Error response (400+)
      return {
        success: false,
        error: responseData.message || responseData.error || `HTTP ${response.status}`,
        message: responseData.message || 'Failed to fetch profile'
      };
    }

  } catch (error: any) {
    console.error('❌ API: Profile request failed:', error);

    // Handle different types of errors
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - please check your connection',
        message: 'การเชื่อมต่อหมดเวลา กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
      };
    }

    if (error.code === 'ECONNREFUSED' || 
        error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')) {
      return {
        success: false,
        error: 'Cannot connect to server',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่'
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์ กรุณาลองใหม่อีกครั้ง'
    };
  }
};

// Get API status
export const getApiStatus = async (): Promise<{
  online: boolean;
  message: string;
  timestamp: number;
}> => {
  const isOnline = await testApiConnection();
  return {
    online: isOnline,
    message: isOnline ? 'API server is online' : 'API server is offline',
    timestamp: Date.now()
  };
};