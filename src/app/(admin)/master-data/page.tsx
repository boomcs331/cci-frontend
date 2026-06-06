"use client";
import React from "react";
import { PageContainer, PageHeader } from "@/components/shared";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faBox,
  faGear,
  faListCheck,
  faListOl,
  faLocationDot,
  faRuler,
  faTag,
  faTruck,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

const materialItems = [
  { name: "ประเภทวัตถุดิบ", path: "/master-data/material-types", icon: <FontAwesomeIcon icon={faBox} /> },
  { name: "สถานที่เก็บ (วัตถุดิบ)", path: "/master-data/locations", icon: <FontAwesomeIcon icon={faLocationDot} /> },
  { name: "ผู้จัดจำหน่าย", path: "/master-data/suppliers", icon: <FontAwesomeIcon icon={faBoxesStacked} /> },
  { name: "โมเดล", path: "/master-data/models", icon: <FontAwesomeIcon icon={faGear} /> },
  { name: "ประเภทการส่ง", path: "/master-data/delivery-types", icon: <FontAwesomeIcon icon={faTruck} /> },
  { name: "หน่วย", path: "/master-data/units", icon: <FontAwesomeIcon icon={faRuler} /> },
  { name: "จุดขนถ่าย", path: "/master-data/loading-points", icon: <FontAwesomeIcon icon={faBoxesStacked} /> },
  { name: "สายการผลิต", path: "/master-data/process-lines", icon: <FontAwesomeIcon icon={faGear} /> },
];

const productItems = [
  { name: "ประเภทสินค้า", path: "/master-data/product-types", icon: <FontAwesomeIcon icon={faTag} /> },
  { name: "สถานที่เก็บ (สินค้า)", path: "/master-data/product-locations", icon: <FontAwesomeIcon icon={faLocationDot} /> },
  { name: "ลูกค้า", path: "/master-data/customers", icon: <FontAwesomeIcon icon={faUser} /> },
  {
    name: "กระบวนการผลิต",
    path: "/master-data/production-processes",
    description: "CRUD production_processes",
    icon: <FontAwesomeIcon icon={faGear} />,
  },
  {
    name: "ลำดับขั้นตอนผลิต (รายสินค้า)",
    path: "/master-data/production-steps",
    description: "เลือกสินค้าแล้วตั้งลำดับทั้งชุด",
    icon: <FontAwesomeIcon icon={faListCheck} />,
  },
  {
    name: "ขั้นตอนผลิตต่อสินค้า",
    path: "/master-data/product-production-steps",
    description: "CRUD product_production_steps",
    icon: <FontAwesomeIcon icon={faListOl} />,
  },
  { name: "ประเภทการส่ง (สินค้า)", path: "/master-data/product-delivery-types", icon: <FontAwesomeIcon icon={faTruck} /> },
  { name: "โมเดล (สินค้า)", path: "/master-data/product-models", icon: <FontAwesomeIcon icon={faGear} /> },
  { name: "หน่วย (สินค้า)", path: "/master-data/product-units", icon: <FontAwesomeIcon icon={faRuler} /> },
  { name: "จุดขนถ่าย (สินค้า)", path: "/master-data/product-loading-points", icon: <FontAwesomeIcon icon={faBoxesStacked} /> },
  { name: "สายการผลิต (สินค้า)", path: "/master-data/product-process-lines", icon: <FontAwesomeIcon icon={faGear} /> },
];

export default function MasterDataPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Master Data"
        description="ข้อมูลพื้นฐานสำหรับวัตถุดิบและสินค้า"
      />
      <div className="space-y-8">
        <OverviewHubSection
          title="วัตถุดิบ"
          sectionDescription="ข้อมูลพื้นฐานสำหรับวัตถุดิบและคลังวัตถุดิบ — เมนูย่อยภายใต้ Master Data (กลุ่มวัตถุดิบ)"
          items={materialItems}
          icon={<FontAwesomeIcon icon={faBoxesStacked} />}
        />
        <OverviewHubSection
          title="ผลิตภัณฑ์ / สินค้า"
          sectionDescription="ข้อมูลพื้นฐานสำหรับสินค้าสำเร็จรูป รวมกระบวนการและลำดับขั้นตอนผลิต — เมนูย่อยภายใต้ Master Data (กลุ่มสินค้า)"
          items={productItems}
          icon={<FontAwesomeIcon icon={faBox} />}
        />
      </div>
    </PageContainer>
  );
}
