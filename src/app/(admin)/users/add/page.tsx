"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import React, { useState, useEffect } from "react";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  const [alert, setAlert] = useState<{variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string} | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleId: ''
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log('Fetching roles from:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          console.log('Is array?', Array.isArray(data));
          console.log('Data type:', typeof data);
          setRoles(data.roles || []);
        } else {
          console.log('Response not ok:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };
    fetchRoles();
  }, []);

  const showAlert = (variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({ variant, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { roleId, ...submitData } = formData;
      
      // สร้างผู้ใช้ก่อน
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('User created successfully:', result);
        showAlert('success', 'สำเร็จ!', 'สร้างผู้ใช้ใหม่เรียบร้อยแล้ว');
        
        // ถ้าเลือก role แล้ว ให้กำหนด role ให้ผู้ใช้
        if (roleId && result.user?.id) {
          try {
            const roleResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${result.user.id}/roles/${roleId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (roleResponse.ok) {
              console.log('Role assigned successfully');
              showAlert('success', 'Role สำเร็จ!', 'กำหนด Role ให้ผู้ใช้เรียบร้อยแล้ว');
            } else {
              console.error('Failed to assign role');
              showAlert('error', 'กำหนด Role ล้มเหลว', 'เกิดข้อผิดพลาดในการกำหนด Role');
            }
          } catch (roleError) {
            console.error('Error assigning role:', roleError);
            showAlert('error', 'เชื่อมต่อล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อ API สำหรับกำหนด Role');
          }
        }
        
        router.push('/users');
      } else {
        console.error('Failed to create user:', result);
        showAlert('error', 'สร้างผู้ใช้ล้มเหลว', result.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      showAlert('error', 'เชื่อมต่อล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {alert && (
        <div className="mb-6">
          <Alert
            variant={alert.variant}
            title={alert.title}
            message={alert.message}
          />
        </div>
      )}
      <PageBreadcrumb pageTitle="เพิ่มผู้ใช้งาน" />
      <div className="space-y-6">
        <ComponentCard title="เพิ่มผู้ใช้งานใหม่">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Username <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="กรอก username"
                  required
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="กรอก email"
                />
              </div>
              
              <div>
                <Label>ชื่อ</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="กรอกชื่อ"
                />
              </div>
              
              <div>
                <Label>นามสกุล</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="กรอกนามสกุล"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Role <span className="text-red-500">*</span></Label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({...formData, roleId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือก Role</option>
                  {Array.isArray(roles) && roles.map((role: any) => {
                    console.log('Role item:', role);
                    return (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    );
                  })}
                </select>
                <div className="text-sm text-gray-500 mt-1">Roles count: {roles.length}</div>
              </div>
              
              <div className="md:col-span-2">
                <Label>Password <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="กรอก password"
                    required
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
              <Button 
                type="button" 
                onClick={() => router.push('/users')}
                className="bg-gray-500 hover:bg-gray-600"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}