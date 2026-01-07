"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import Alert from "@/components/ui/alert/Alert";
import React, { useEffect, useState } from "react";

type Permission = {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  createdAt: string;
  updatedAt: string;
};

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    module: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState<{variant: 'success' | 'error' | 'warning' | 'info', title: string, message: string} | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    const isModalOpen = showAddModal || showEditModal || showDeleteModal;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const header = document.querySelector('header');
      if (header) header.style.display = 'none';
    } else {
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) header.style.display = 'block';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      const header = document.querySelector('header');
      if (header) header.style.display = 'block';
    };
  }, [showAddModal, showEditModal, showDeleteModal]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions`);
      if (response.ok) {
        const data = await response.json();
        const permissionsArray = Array.isArray(data) ? data : data.permissions || data.data || [];
        setPermissions(permissionsArray);
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedPermissions = [...permissions].sort((a, b) => {
    if (!sortField) return 0;
    let aValue: any = a[sortField as keyof Permission];
    let bValue: any = b[sortField as keyof Permission];
    
    if (sortField === 'updatedAt') {
      aValue = a.updatedAt || a.createdAt;
      bValue = b.updatedAt || b.createdAt;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredPermissions = sortedPermissions.filter(permission => 
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAdd = () => {
    setFormData({ code: '', name: '', description: '', module: '' });
    setShowAddModal(true);
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      code: permission.code,
      name: permission.name,
      description: permission.description,
      module: permission.module
    });
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const url = showEditModal 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions/${selectedPermission?.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions`;
      
      const response = await fetch(url, {
        method: showEditModal ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchPermissions();
        setShowAddModal(false);
        setShowEditModal(false);
        setAlert({
          variant: 'success', 
          title: 'สำเร็จ', 
          message: data.message || `${showEditModal ? 'แก้ไข' : 'เพิ่ม'}ข้อมูล Permission เรียบร้อยแล้ว`
        });
      } else {
        const data = await response.json();
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถดำเนินการได้'});
      }
    } catch (error) {
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPermission) return;
    setFormLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions/${selectedPermission.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }
        await fetchPermissions();
        setShowDeleteModal(false);
        setAlert({variant: 'success', title: 'สำเร็จ', message: data.message || 'ลบ Permission เรียบร้อยแล้ว'});
      } else {
        const data = await response.json();
        setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: data.message || 'ไม่สามารถลบ Permission ได้'});
      }
    } catch (error) {
      setAlert({variant: 'error', title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'});
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Permissions Management" />
      {alert && (
        <div className="mb-4">
          <Alert variant={alert.variant} title={alert.title} message={alert.message} />
        </div>
      )}
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ตารางแสดงข้อมูล Permissions ในระบบ</h2>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              เพิ่ม Permission
            </Button>
          </div>
        </div>
        
        <ComponentCard title={`All Permissions (${filteredPermissions.length})`}>
          <div className="mb-6">
            <input
              type="text"
              placeholder="ค้นหา name, code, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 h-11 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-3 focus:ring-blue-500/10 focus:border-blue-300 dark:focus:border-blue-800"
            />
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('code')}>
                      <div className="flex items-center gap-1">
                        Code
                        {sortField === 'code' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={sortDirection === 'asc' ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1">
                        Name
                        {sortField === 'name' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={sortDirection === 'asc' ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Module</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('updatedAt')}>
                      <div className="flex items-center gap-1">
                        Updated
                        {sortField === 'updatedAt' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={sortDirection === 'asc' ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedPermissions.length > 0 ? paginatedPermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{permission.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{permission.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{permission.description || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{permission.module || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(permission.updatedAt || permission.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === permission.id ? null : permission.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {openDropdown === permission.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEdit(permission)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  แก้ไข
                                </button>
                                <button
                                  onClick={() => handleDelete(permission)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  ลบ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No permissions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredPermissions.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredPermissions.length)} of {filteredPermissions.length} results
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </ComponentCard>
        
        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {showAddModal ? 'เพิ่ม Permission ใหม่' : 'แก้ไข Permission'}
                </h3>
                <button 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Module</label>
                  <input
                    type="text"
                    value={formData.module}
                    onChange={(e) => setFormData({...formData, module: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg"
                  >
                    {formLoading ? 'กำลังบันทึก...' : (showAddModal ? 'เพิ่ม' : 'บันทึก')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Delete Modal */}
        {showDeleteModal && selectedPermission && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">ยืนยันการลบ</h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  คุณต้องการลบ Permission <strong>{selectedPermission.name}</strong> หรือไม่?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button 
                  onClick={handleConfirmDelete}
                  disabled={formLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 rounded-lg"
                >
                  {formLoading ? 'กำลังลบ...' : 'ลบ'}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}