"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function PCOutcomePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="รายการจ่ายออก" />
      <div className="space-y-6">
        <ComponentCard title="รายการจ่ายออก">
          <div className="text-center py-8 text-gray-500">
            หน้ารายการจ่ายออก - กำลังพัฒนา
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}