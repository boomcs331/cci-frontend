"use client";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faBox,
  faGear,
  faLocationDot,
  faListCheck,
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
  { name: "ลำดับขั้นตอนผลิต", path: "/master-data/production-steps", icon: <FontAwesomeIcon icon={faListCheck} /> },
  { name: "ประเภทการส่ง (สินค้า)", path: "/master-data/product-delivery-types", icon: <FontAwesomeIcon icon={faTruck} /> },
  { name: "โมเดล (สินค้า)", path: "/master-data/product-models", icon: <FontAwesomeIcon icon={faGear} /> },
  { name: "หน่วย (สินค้า)", path: "/master-data/product-units", icon: <FontAwesomeIcon icon={faRuler} /> },
  { name: "จุดขนถ่าย (สินค้า)", path: "/master-data/product-loading-points", icon: <FontAwesomeIcon icon={faBoxesStacked} /> },
  { name: "สายการผลิต (สินค้า)", path: "/master-data/product-process-lines", icon: <FontAwesomeIcon icon={faGear} /> },
];

export default function MasterDataPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Master Data" />
      <div className="space-y-8">
        <OverviewHubSection
          title="วัตถุดิบ"
          sectionDescription="ข้อมูลพื้นฐานสำหรับวัตถุดิบและคลังวัตถุดิบ — เมนูย่อยภายใต้ Master Data (กลุ่มวัตถุดิบ)"
          items={materialItems}
          icon={<FontAwesomeIcon icon={faBoxesStacked} />}
        />
        <OverviewHubSection
          title="ผลิตภัณฑ์ / สินค้า"
          sectionDescription="ข้อมูลพื้นฐานสำหรับสินค้าสำเร็จรูป (คนละชุดกับวัตถุดิบ) — เมนูย่อยภายใต้ Master Data (กลุ่มสินค้า)"
          items={productItems}
          icon={<FontAwesomeIcon icon={faBox} />}
        />
      </div>
    </div>
  );
}
