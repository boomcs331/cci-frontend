"use client";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissionIds: [] as string[]
  });
  const [editFormData, setEditFormData] = useState({
    code: '',
    name: '',
    description: '',
    permissionIds: [] as string[]
  });
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const isModalOpen = showPermissionsModal || showAddModal || showEditModal;
    
    if (isModalOpen) {
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
  }, [showPermissionsModal, showAddModal, showEditModal]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        if (response.ok) {
          const data = await response.json();
          const rolesArray = Array.isArray(data) ? data : data.roles || data.data || [];
          setRoles(rolesArray);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const sortedRoles = [...roles].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof Role];
    let bValue: any = b[sortField as keyof Role];
    
    if (sortField === 'updatedAt') {
      aValue = a.updatedAt || a.createdAt;
      bValue = b.updatedAt || b.createdAt;
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredRoles = sortedRoles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPermissions = async (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
    setPermissionsLoading(true);
    setOpenDropdown(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles/${role.id}`);
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Failed to fetch role permissions:', error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const handleEditRole = async (role: Role) => {
    setSelectedRole(role);
    setEditFormData({
      code: role.code,
      name: role.name,
      description: role.description,
      permissionIds: []
    });
    setShowEditModal(true);
    setOpenDropdown(null);
    
    try {
      const [permissionsRes, roleRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions`),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles/${role.id}`)
      ]);
      
      if (permissionsRes.ok) {
        const permData = await permissionsRes.json();
        setAllPermissions(permData.permissions || permData || []);
      }
      
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        const currentPermissions = roleData.permissions || [];
        setEditFormData(prev => ({
          ...prev,
          permissionIds: currentPermissions.map((p: any) => p.id)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch data for edit:', error);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setAddLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editFormData.code,
          name: editFormData.name,
          description: editFormData.description
        }),
      });
      
      if (response.ok) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles/${selectedRole.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionIds: editFormData.permissionIds }),
        });
        
        const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        if (rolesResponse.ok) {
          const data = await rolesResponse.json();
          const rolesArray = Array.isArray(data) ? data : data.roles || data.data || [];
          setRoles(rolesArray);
        }
        
        setShowEditModal(false);
        setEditFormData({ code: '', name: '', description: '', permissionIds: [] });
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    
    try {
      // สร้าง role พร้อม permissions ในครั้งเดียว
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: addFormData.code,
          name: addFormData.name,
          description: addFormData.description,
          permissionIds: addFormData.permissionIds
        }),
      });
      
      if (response.ok) {
        // รีเฟรช roles list
        const rolesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/roles`);
        if (rolesResponse.ok) {
          const data = await rolesResponse.json();
          const rolesArray = Array.isArray(data) ? data : data.roles || data.data || [];
          setRoles(rolesArray);
        }
        
        setShowAddModal(false);
        setAddFormData({ code: '', name: '', description: '', permissionIds: [] });
      }
    } catch (error) {
      console.error('Failed to create role:', error);
    } finally {
      setAddLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Roles Management" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">ตารางแสดงข้อมูล Roles ในระบบ</h2>
            <button
              onClick={() => {
                setShowAddModal(true);
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/permissions`)
                  .then(res => res.json())
                  .then(data => setAllPermissions(data.permissions || data || []));
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              เพิ่ม Role
            </button>
          </div>
        </div>
        
        <ComponentCard title={`All Roles (${filteredRoles.length})`}>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('isSystem')}>
                      <div className="flex items-center gap-1">
                        System
                        {sortField === 'isSystem' && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d={sortDirection === 'asc' ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"} clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
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
                  {paginatedRoles.length > 0 ? paginatedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{role.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{role.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{role.description || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          role.isSystem
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}>
                          {role.isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(role.updatedAt || role.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === role.id ? null : role.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                          
                          {openDropdown === role.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewPermissions(role)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 0 1 6 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  ดู Permissions
                                </button>
                                <button
                                  onClick={() => handleEditRole(role)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  แก้ไข Role
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No roles found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredRoles.length > itemsPerPage && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length} results
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </ComponentCard>
        
        {/* Permissions Modal */}
        {showPermissionsModal && selectedRole && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Permissions for {selectedRole.name}
                </h3>
                <button 
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {permissionsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading permissions...</div>
              ) : (
                <div className="space-y-2">
                  {rolePermissions.length > 0 ? (
                    rolePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{permission.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{permission.description}</div>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">
                          {permission.code}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">No permissions assigned</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Edit Role Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">แก้ไข Role</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code</label>
                  <input
                    type="text"
                    required
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({...editFormData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                    {allPermissions.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editFormData.permissionIds.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                permissionIds: [...editFormData.permissionIds, permission.id]
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                permissionIds: editFormData.permissionIds.filter(id => id !== permission.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg"
                  >
                    {addLoading ? 'กำลังอัพเดท...' : 'อัพเดท Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Add Role Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">เพิ่ม Role ใหม่</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAddRole} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code</label>
                  <input
                    type="text"
                    required
                    value={addFormData.code}
                    onChange={(e) => setAddFormData({...addFormData, code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    value={addFormData.description}
                    onChange={(e) => setAddFormData({...addFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                    {allPermissions.map(permission => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={addFormData.permissionIds.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddFormData({
                                ...addFormData,
                                permissionIds: [...addFormData.permissionIds, permission.id]
                              });
                            } else {
                              setAddFormData({
                                ...addFormData,
                                permissionIds: addFormData.permissionIds.filter(id => id !== permission.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg"
                  >
                    {addLoading ? 'กำลังสร้าง...' : 'สร้าง Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}