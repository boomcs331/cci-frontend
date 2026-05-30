"use client";

import React, { useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { useClientHydrated } from "@/hooks/useClientHydrated";
import { canAccessPolicy, getRouteAccessPolicy } from "@/utils/accessControl";
import {
  getSession,
  getUserDepartmentCodes,
  isAdmin,
} from "@/utils/session";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarcode,
  faBoxesStacked,
  faCalendarDays,
  faCartShopping,
  faIndustry,
  faListOl,
  faQrcode,
  faSitemap,
} from "@fortawesome/free-solid-svg-icons";

const items = [
  {
    name: "รายการสินค้า",
    path: "/production/products",
    description: "ดูและจัดการสินค้า / BOM",
    icon: <FontAwesomeIcon icon={faIndustry} />,
  },
  {
    name: "เพิ่ม BOM",
    path: "/production/bom-add",
    description: "สร้างสินค้าและ BOM",
    icon: <FontAwesomeIcon icon={faSitemap} />,
  },
  {
    name: "คำสั่งผลิต / QR ล็อต",
    path: "/production/production-orders",
    description: "ใบสั่งผลิตและ QR ล็อต",
    icon: <FontAwesomeIcon icon={faBarcode} />,
  },
  {
    name: "ยิง QR ตามแผนก",
    path: "/production/dept-step-scan",
    description: "Scan lot QR to start/complete the step for your department",
    icon: <FontAwesomeIcon icon={faQrcode} />,
  },
  {
    name: "ลำดับขั้นตอนผลิต",
    path: "/production/production-steps",
    description: "กำหนดเส้นทางขั้นตอนต่อสินค้า",
    icon: <FontAwesomeIcon icon={faListOl} />,
  },
  {
    name: "กระบวนการผลิต (Master)",
    path: "/master-data/production-processes",
    description: "CRUD production_processes",
    icon: <FontAwesomeIcon icon={faListOl} />,
  },
  {
    name: "ขั้นตอนผลิตต่อสินค้า (Master CRUD)",
    path: "/master-data/product-production-steps",
    description: "จัดการ product_production_steps แบบตาราง",
    icon: <FontAwesomeIcon icon={faListOl} />,
  },
  {
    name: "จัดงานล่วงหน้า (แผน)",
    path: "/production/schedule",
    description: "แผนการผลิตและจองวัตถุดิบ",
    icon: <FontAwesomeIcon icon={faCalendarDays} />,
  },
  {
    name: "ยอดคงเหลือ สินค้าขาย",
    path: "/production/product-stock",
    description: "สต็อกสินค้าสำเร็จรูป",
    icon: <FontAwesomeIcon icon={faBoxesStacked} />,
  },
  {
    name: "ติดตามสถานะการผลิต",
    path: "/pc/production-tracking",
    description: "มุมมองติดตาม (ฝั่งสายการผลิต)",
    icon: <FontAwesomeIcon icon={faQrcode} />,
  },
];

export default function ProductionOverviewPage() {
  const hydrated = useClientHydrated();
  const visibleItems = useMemo(() => {
    if (!hydrated) return [];
    const session = getSession();
    const context = {
      isAdmin: isAdmin(),
      permissions: session?.permissions ?? [],
      departmentCode: session?.user?.department?.code ?? null,
      departmentCodes: getUserDepartmentCodes(),
    };
    return items.filter((item) => {
      const policy = getRouteAccessPolicy(item.path);
      if (!policy) return true;
      return canAccessPolicy(policy, context);
    });
  }, [hydrated]);

  return (
    <div>
      <PageBreadcrumb pageTitle="ภาพรวมสินค้า" />
      <div className="space-y-8">
        <OverviewHubSection
          title="Production — สินค้าและงานผลิต"
          sectionDescription="สรุปเมนูย่อยภายใต้กลุ่ม Production ในระบบ (รูปแบบการ์ดเดียวกับ /master-data)"
          icon={<FontAwesomeIcon icon={faIndustry} />}
          items={visibleItems}
        />
      </div>
    </div>
  );
}
