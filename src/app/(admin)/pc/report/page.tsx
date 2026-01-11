"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function PCReportPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="รายงาน" />
      <div className="space-y-6">
        <ComponentCard title="รายงาน">
          <div className="text-center py-8 text-gray-500">
            หน้ารายงาน - กำลังพัฒนา
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}