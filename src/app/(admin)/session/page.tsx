"use client";
import React, { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { getSession } from "@/utils/session";

export default function SessionPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionData = () => {
      try {
        const session = getSession(); // ใช้ getSession ที่จะตรวจสอบ expiration
        if (session) {
          setSessionData(session);
        }
      } catch (error) {
        console.error('Failed to parse session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSessionData();
  }, []);

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Session Information" />
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Session Information" />
      <div className="space-y-6">
        <ComponentCard title="Current Session Data">
          {sessionData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">ID:</span> {sessionData.user?.id || 'N/A'}</div>
                    <div><span className="font-medium">Username:</span> {sessionData.user?.username || 'N/A'}</div>
                    <div><span className="font-medium">Email:</span> {sessionData.user?.email || 'N/A'}</div>
                    <div><span className="font-medium">First Name:</span> {sessionData.user?.firstName || 'N/A'}</div>
                    <div><span className="font-medium">Last Name:</span> {sessionData.user?.lastName || 'N/A'}</div>
                    <div><span className="font-medium">Active:</span> {sessionData.user?.isActive ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Session Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Token:</span> {sessionData.token ? `${sessionData.token.substring(0, 20)}...` : 'N/A'}</div>
                    <div><span className="font-medium">Expires At:</span> {sessionData.expiresAt ? new Date(sessionData.expiresAt).toLocaleString('th-TH') : 'N/A'}</div>
                    <div><span className="font-medium">Created:</span> {sessionData.user?.createdAt ? new Date(sessionData.user.createdAt).toLocaleString() : 'N/A'}</div>
                    <div><span className="font-medium">Updated:</span> {sessionData.user?.updatedAt ? new Date(sessionData.user.updatedAt).toLocaleString() : 'N/A'}</div>
                    <div><span className="font-medium">Last Login:</span> {sessionData.user?.lastLoginAt ? new Date(sessionData.user.lastLoginAt).toLocaleString() : 'Never'}</div>
                  </div>
                </div>
              </div>

              {sessionData.user?.roles && sessionData.user.roles.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {sessionData.user.roles.map((role: any) => (
                      <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm">
                        {role.name} ({role.code})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Raw Session Data</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No session data found
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}