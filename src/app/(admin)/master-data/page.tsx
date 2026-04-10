"use client";
import React from "react";
import Link from "next/link";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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

function Section({
  title,
  description,
  items,
  icon,
}: {
  title: string;
  description: string;
  items: typeof materialItems;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-3 mb-1">
        {icon ? (
          <span className="mt-1 text-brand-600 dark:text-brand-400 text-lg" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3 text-gray-700 dark:text-gray-200">{item.icon}</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {item.name}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Master Data" />
      <div className="space-y-8">
        <Section
          title="วัตถุดิบ"
          description="ข้อมูลพื้นฐานสำหรับวัตถุดิบและคลังวัตถุดิบ"
          items={materialItems}
          icon={<FontAwesomeIcon icon={faBoxesStacked} />}
        />
        <Section
          title="ผลิตภัณฑ์ / สินค้า"
          description="ข้อมูลพื้นฐานสำหรับสินค้าสำเร็จรูป (คนละชุดกับวัตถุดิบ)"
          items={productItems}
          icon={<FontAwesomeIcon icon={faBox} />}
        />
      </div>
    </div>
  );
}
