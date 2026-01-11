"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function PCSchedulePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="จัดงานล่วงหน้า" />
      <div className="space-y-6">
        <ComponentCard title="จัดงานล่วงหน้า">
          <div className="text-center py-8 text-gray-500">
            หน้าจัดงานล่วงหน้า - กำลังพัฒนา
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}