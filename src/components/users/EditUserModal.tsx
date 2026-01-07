import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import React, { useEffect } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
  }>;
};

type EditUserModalProps = {
  isOpen: boolean;
  user: User | null;
  formData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    roleIds: string[];
  };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (data: { username: string; email: string; firstName: string; lastName: string; roleIds: string[] }) => void;
  loading?: boolean;
  availableRoles?: Array<{
    id: string;
    code: string;
    name: string;
    description: string;
    isSystem: boolean;
  }>;
};

export default function EditUserModal({
  isOpen,
  user,
  formData,
  onClose,
  onSubmit,
  onFormChange,
  loading = false,
  availableRoles = [],
}: EditUserModalProps) {
  useEffect(() => {
    console.log('Form data prop changed modal:', formData);
  }, [formData]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }
    } else {
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
      }
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">แก้ไขผู้ใช้งาน</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-5">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username *</Label>
                <Input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => {
                    console.log('Username changed:', e.target.value);
                    onFormChange({...formData, username: e.target.value});
                  }}
                  className="mt-1"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">Current: {formData.username}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => onFormChange({...formData, email: e.target.value})}
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">Current: {formData.email}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ</Label>
                <Input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => onFormChange({...formData, firstName: e.target.value})}
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">Current: {formData.firstName}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">นามสกุล</Label>
                <Input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => onFormChange({...formData, lastName: e.target.value})}
                  className="mt-1"
                />
                <div className="text-xs text-gray-500 mt-1">Current: {formData.lastName}</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</Label>
                <select
                  value={formData.roleIds?.[0] || ''}
                  onChange={(e) => onFormChange({...formData, roleIds: e.target.value ? [e.target.value] : []})}
                  className="mt-1 h-11 w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  Current: {availableRoles.find(r => r.id === formData.roleIds?.[0])?.name || 'No role selected'}
                </div>
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" disabled={loading}>
              บันทึก
            </Button>
            <Button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5"
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}