"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxesStacked, faIndustry } from "@fortawesome/free-solid-svg-icons";

const items = [
  {
    name: "ยอดคงเหลือ วัตถุดิบ",
    path: "/pc/stock",
    description: "สต็อกวัตถุดิบ จอง และคงเหลือพร้อมใช้",
    icon: <FontAwesomeIcon icon={faBoxesStacked} />,
  },
  {
    name: "ยอดคงเหลือ สินค้าขาย",
    path: "/production/product-stock",
    description: "สต็อกสินค้าสำเร็จรูปหลังผลิตเสร็จ",
    icon: <FontAwesomeIcon icon={faIndustry} />,
  },
];

export default function BalancesOverviewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="ภาพรวม Stock" />
      <div className="space-y-8">
        <OverviewHubSection
          title="Stock"
          sectionDescription="เมนูย่อยภายใต้กลุ่ม Stock — วัตถุดิบและสินค้าขาย (รูปแบบเดียวกับ Master Data)"
          icon={<FontAwesomeIcon icon={faBoxesStacked} />}
          items={items}
        />
      </div>
    </div>
  );
}
