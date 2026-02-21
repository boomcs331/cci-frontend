"use client";
import React from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

const masterDataItems = [
  { name: "ประเภทวัตถุดิบ", path: "/master-data/material-types", icon: "📦" },
  { name: "สถานที่เก็บ", path: "/master-data/locations", icon: "📍" },
  { name: "ผู้จัดจำหน่าย", path: "/master-data/suppliers", icon: "🏢" },
  { name: "โมเดล", path: "/master-data/models", icon: "🔧" },
  { name: "ประเภทการส่ง", path: "/master-data/delivery-types", icon: "🚚" },
  { name: "หน่วย", path: "/master-data/units", icon: "📏" },
  { name: "จุดขนถ่าย", path: "/master-data/loading-points", icon: "🏭" },
  { name: "สายการผลิต", path: "/master-data/process-lines", icon: "⚙️" },
];

export default function MasterDataPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Master Data" />
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            จัดการข้อมูลพื้นฐาน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {masterDataItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {item.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
