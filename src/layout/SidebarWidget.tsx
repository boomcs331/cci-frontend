"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import UserPermissions from "@/components/auth/UserPermissions";

export default function SidebarWidget() {
  const { user } = useAuth();

  return (
    <div className="space-y-4 mb-10">
      {/* User Info Widget */}
      <div className="mx-auto w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
        <div className="mb-3">
          <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-semibold text-lg">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {user?.firstName || user?.username || 'User'}
          </h3>
          <p className="text-gray-500 text-xs dark:text-gray-400">
            {user?.email || 'user@example.com'}
          </p>
          <div className="mt-2">
            <UserPermissions />
          </div>
        </div>
        
        <div className="space-y-2">
          <Link
            href="/profile"
            className="flex items-center justify-center p-2 font-medium text-gray-700 rounded-lg bg-white dark:bg-gray-800 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            โปรไฟล์
          </Link>
          
          <Link
            href="/logout"
            className="flex items-center justify-center p-2 font-medium text-white rounded-lg bg-red-500 text-xs hover:bg-red-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            ออกจากระบบ
          </Link>
        </div>
      </div>

      {/* Promo Widget */}
{/*       <div className="mx-auto w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white text-sm">
          🔐 ระบบความปลอดภัย
        </h3>
        <p className="mb-4 text-gray-500 text-xs dark:text-gray-400">
          Session Management & Security Logging
        </p>
        <Link
          href="/security-logs"
          className="flex items-center justify-center p-2 font-medium text-white rounded-lg bg-brand-500 text-xs hover:bg-brand-600 transition-colors"
        >
          ดู Security Logs
        </Link>
      </div> */}
    </div>
  );
}
