"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faBoxesStacked,
  faCalendarDays,
  faChartSimple,
  faClipboardList,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";

const items = [
  {
    name: "ข้อมูล / รายการวัตถุดิบ",
    path: "/pc",
    description: "ดูและจัดการรายการวัตถุดิบหลัก",
    icon: <FontAwesomeIcon icon={faClipboardList} />,
  },
  {
    name: "รายการรับเข้า",
    path: "/pc/income",
    description: "บันทึกการรับวัตถุดิบเข้าคลัง",
    icon: <FontAwesomeIcon icon={faArrowRightToBracket} />,
  },
  {
    name: "รายการจ่ายออก",
    path: "/pc/outcome",
    description: "จ่ายวัตถุดิบตามแผน",
    icon: <FontAwesomeIcon icon={faArrowRightFromBracket} />,
  },
  {
    name: "รายการจองวัตถุดิบ",
    path: "/pc/reservations",
    description: "สรุปการจองตามแผนผลิต",
    icon: <FontAwesomeIcon icon={faBoxesStacked} />,
  },
  {
    name: "แผนผลิตที่จองสำเร็จแล้ว",
    path: "/pc/schedule/reservations",
    description: "แผนที่จอง material แล้ว (ฝั่ง WE)",
    icon: <FontAwesomeIcon icon={faCalendarDays} />,
  },
  {
    name: "ยอดคงเหลือ วัตถุดิบ",
    path: "/pc/stock",
    description: "สต็อกคงเหลือและการจอง",
    icon: <FontAwesomeIcon icon={faBoxesStacked} />,
  },
  {
    name: "รายงาน",
    path: "/pc/report",
    description: "รายงานที่เกี่ยวข้องกับคลังวัตถุดิบ",
    icon: <FontAwesomeIcon icon={faChartSimple} />,
  },
  {
    name: "สแกนติดตามการผลิต",
    path: "/pc/production-step-scan",
    description: "สแกน QR ติดตามขั้นตอน",
    icon: <FontAwesomeIcon icon={faQrcode} />,
  },
];

export default function PCMaterialsOverviewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="ภาพรวมวัตถุดิบ" />
      <div className="space-y-8">
        <OverviewHubSection
          title="PC — วัตถุดิบและคลัง"
          sectionDescription="สรุปเมนูย่อยภายใต้กลุ่ม PC ในระบบ (รูปแบบการ์ดเดียวกับ /master-data)"
          icon={<FontAwesomeIcon icon={faBoxesStacked} />}
          items={items}
        />
      </div>
    </div>
  );
}
