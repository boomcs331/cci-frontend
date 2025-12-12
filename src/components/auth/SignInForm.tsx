"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loginApi, getApiStatus } from "@/lib/api";

export default function SignInForm() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Form states
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    general?: string;
  }>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    online: boolean;
    message: string;
    checking: boolean;
  }>({
    online: false,
    message: 'กำลังตรวจสอบการเชื่อมต่อ...',
    checking: true
  });

  // Validation functions
  const validateUsername = (username: string): string | undefined => {
    if (!username) return 'กรุณากรอกชื่อผู้ใช้';
    if (username.length < 3) return 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร';
    if (username.length > 20) return 'ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษร ตัวเลข และ _';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'กรุณากรอกรหัสผ่าน';
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    return undefined;
  };

  // Mock users for fallback mode
  const mockUsers = [
    {
      username: 'admin',
      password: 'admin123',
      userData: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['admin']
      }
    },
    {
      username: 'user',
      password: 'user123',
      userData: {
        id: '2',
        username: 'user',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        roles: ['user']
      }
    },
    {
      username: 'test',
      password: '123456',
      userData: {
        id: '3',
        username: 'test',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        roles: ['user']
      }
    }
  ];

  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await getApiStatus();
        setApiStatus({
          online: status.online,
          message: status.online 
            ? 'เชื่อมต่อกับเซิร์ฟเวอร์สำเร็จ' 
            : 'เซิร์ฟเวอร์ออฟไลน์ - ใช้โหมดทดสอบ',
          checking: false
        });
      } catch (error) {
        setApiStatus({
          online: false,
          message: 'เซิร์ฟเวอร์ออฟไลน์ - ใช้โหมดทดสอบ',
          checking: false
        });
      }
    };

    checkApiStatus();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked
    if (isBlocked) {
      setErrors({ general: 'บัญชีถูกล็อค กรุณารอ 5 นาทีแล้วลองใหม่' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Validate inputs
      const usernameError = validateUsername(username);
      const passwordError = validatePassword(password);

      if (usernameError || passwordError) {
        setErrors({
          username: usernameError,
          password: passwordError
        });
        setIsLoading(false);
        return;
      }

      if (apiStatus.online) {
        // Try API login first
        const response = await loginApi({
          username,
          password
        });

        if (response.success && response.data) {
          // Successful API login
          setErrors({ general: 'เข้าสู่ระบบสำเร็จ! กำลังดึงข้อมูลสิทธิ์...' });
          
          const success = await login(
            response.data.user,
            response.data.token,
            response.data.permissions || ['read', 'write']
          );
          
          if (success) {
            setLoginAttempts(0);
            setErrors({ general: 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...' });
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setErrors({ general: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการเข้าสู่ระบบ' });
          }
        } else {
          // API login failed
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          if (newAttempts >= 5) {
            setIsBlocked(true);
            setErrors({ general: 'ล็อกอินผิดเกินกำหนด บัญชีถูกล็อคชั่วคราว 5 นาที' });
            setTimeout(() => {
              setIsBlocked(false);
              setLoginAttempts(0);
            }, 5 * 60 * 1000);
          } else {
            const errorMessage = response.message || response.error || 
              `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - newAttempts} ครั้ง)`;
            setErrors({ general: errorMessage });
          }
        }
      } else {
        // Fallback to mock authentication
        console.log('🔄 Using fallback mock authentication');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check credentials against mock database
        const user = mockUsers.find(u => 
          u.username.toLowerCase() === username.toLowerCase() && 
          u.password === password
        );

        if (user) {
          // Successful mock login
          setErrors({ general: 'เข้าสู่ระบบสำเร็จ! (โหมดทดสอบ) กำลังดึงข้อมูลสิทธิ์...' });
          
          const success = await login(
            user.userData, 
            'mock-jwt-token-' + Date.now(), 
            ['read', 'write', ...(user.userData.roles.includes('admin') ? ['admin'] : [])]
          );
          
          if (success) {
            setLoginAttempts(0);
            setErrors({ general: 'เข้าสู่ระบบสำเร็จ! (โหมดทดสอบ) กำลังเปลี่ยนหน้า...' });
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            setErrors({ general: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
          }
        } else {
          // Failed mock login
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          
          if (newAttempts >= 5) {
            setIsBlocked(true);
            setErrors({ general: 'ล็อกอินผิดเกินกำหนด บัญชีถูกล็อคชั่วคราว 5 นาที' });
            setTimeout(() => {
              setIsBlocked(false);
              setLoginAttempts(0);
            }, 5 * 60 * 1000);
          } else {
            setErrors({ 
              general: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือ ${5 - newAttempts} ครั้ง)` 
            });
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              เข้าสู่ระบบ
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* General Error/Success Message */}
                {errors.general && (
                  <div className={`p-3 text-sm rounded-lg border ${
                    errors.general.includes('สำเร็จ') 
                      ? 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  }`}>
                    {errors.general}
                  </div>
                )}

                {/* API Status */}
                <div className={`p-3 text-xs rounded-lg border ${
                  apiStatus.checking 
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                    : apiStatus.online
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <p className={`font-semibold mb-1 ${
                    apiStatus.checking 
                      ? 'text-yellow-800 dark:text-yellow-400'
                      : apiStatus.online
                      ? 'text-green-800 dark:text-green-400'
                      : 'text-red-800 dark:text-red-400'
                  }`}>
                    {apiStatus.checking ? '🔄' : apiStatus.online ? '✅' : '❌'} สถานะเซิร์ฟเวอร์
                  </p>
                  <p className={`${
                    apiStatus.checking 
                      ? 'text-yellow-600 dark:text-yellow-300'
                      : apiStatus.online
                      ? 'text-green-600 dark:text-green-300'
                      : 'text-red-600 dark:text-red-300'
                  }`}>
                    {apiStatus.message}
                  </p>
                  {apiStatus.online ? (
                    <p className="text-green-600 dark:text-green-300 mt-1">
                      🌐 API: http://localhost:3006/auth/login
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <p className="text-orange-600 dark:text-orange-300 text-xs">
                        💡 โหมดทดสอบ - ใช้บัญชีด้านล่าง:
                      </p>
                      <p className="text-orange-600 dark:text-orange-300 text-xs">
                        • admin / admin123 (Admin)
                      </p>
                      <p className="text-orange-600 dark:text-orange-300 text-xs">
                        • user / user123 (User)
                      </p>
                      <p className="text-orange-600 dark:text-orange-300 text-xs">
                        • test / 123456 (User)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Username <span className="text-error-500">*</span></Label>
                  <Input 
                    placeholder="กรอกชื่อผู้ใช้ของคุณ" 
                    type="text" 
                    defaultValue={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) {
                        setErrors(prev => ({ ...prev, username: undefined }));
                      }
                    }}
                    error={!!errors.username}
                    hint={errors.username}
                  />
                </div>
                
                <div>
                  <Label>Password <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      defaultValue={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      error={!!errors.password}
                      hint={errors.password}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? <EyeIcon /> : <EyeCloseIcon />}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      จดจำการเข้าสู่ระบบ
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                
                <div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    disabled={isLoading || isBlocked}
                  >
                    {isLoading 
                      ? 'กำลังเข้าสู่ระบบ...' 
                      : apiStatus.online 
                      ? 'เข้าสู่ระบบ'
                      : 'เข้าสู่ระบบ (โหมดทดสอบ)'
                    }
                  </Button>
                </div>

                {/* Login Attempts Warning */}
                {loginAttempts > 0 && loginAttempts < 5 && (
                  <div className="p-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                    ⚠️ ความพยายามเข้าสู่ระบบ: {loginAttempts}/5
                  </div>
                )}
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ยังไม่มีบัญชี? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}