"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function PCIncomePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="รายการรับเข้า" />
      <div className="space-y-6">
        <ComponentCard title="รายการรับเข้า">
          <div className="text-center py-8 text-gray-500">
            หน้ารายการรับเข้า - กำลังพัฒนา
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}