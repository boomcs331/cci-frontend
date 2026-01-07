"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useRouter, useParams } from "next/navigation";
import Alert from "@/components/ui/alert/Alert";
import React, { useEffect, useState } from "react";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [alert, setAlert] = useState<{variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string} | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    roleIds: [] as string[]
  });

  const showAlert = (variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({ variant, title, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${userId}/toggle-status`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        showAlert('success', 'สำเร็จ!', 'เปลี่ยนสถานะผู้ใช้เรียบร้อยแล้ว');
      } else {
        showAlert('error', 'เปลี่ยนสถานะล้มเหลว', 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    } catch (error) {
      showAlert('error', 'เชื่อมต่อล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    }
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        roleIds: [...prev.roleIds, roleId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        roleIds: prev.roleIds.filter(id => id !== roleId)
      }));
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          setRoles(rolesData.roles || []);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          const user = data.user || data;
          setFormData({
            username: user.username || '',
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            roleIds: user.roles?.map((role: any) => role.id) || []
          });
        }
      } catch (error) {
        showAlert('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setFetchLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        showAlert('success', 'สำเร็จ!', 'อัพเดทข้อมูลผู้ใช้เรียบร้อยแล้ว');
        setTimeout(() => router.push('/users'), 2000);
      } else {
        const result = await response.json();
        showAlert('error', 'อัพเดทล้มเหลว', result.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
      }
    } catch (error) {
      showAlert('error', 'เชื่อมต่อล้มเหลว', 'เกิดข้อผิดพลาดในการเชื่อมต่อ API');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="แก้ไขผู้ใช้งาน" />
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

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
      <PageBreadcrumb pageTitle="แก้ไขผู้ใช้งาน" />
      <div className="space-y-6">
        <ComponentCard title="แก้ไขข้อมูลผู้ใช้งาน">
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
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="กรอก email"
                  required
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
                <Label>Roles</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {Array.isArray(roles) && roles.map((role: any) => (
                    <label key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{role.name}</span>
                    </label>
                  ))}
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
                onClick={handleToggleStatus}
                className="bg-orange-600 hover:bg-orange-700"
              >
                เปลี่ยนสถานะ
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