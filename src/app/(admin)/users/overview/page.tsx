"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { OverviewHubSection } from "@/components/overview/OverviewHubSection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faList,
  faSitemap,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const items = [
  {
    name: "All Users",
    path: "/users",
    description: "รายการผู้ใช้ทั้งหมด",
    icon: <FontAwesomeIcon icon={faUsers} />,
  },
  {
    name: "Add User",
    path: "/users/add",
    description: "เพิ่มผู้ใช้ใหม่",
    icon: <FontAwesomeIcon icon={faUserPlus} />,
  },
  {
    name: "User Roles",
    path: "/users/roles",
    description: "บทบาทและการมอบหมาย",
    icon: <FontAwesomeIcon icon={faSitemap} />,
  },
  {
    name: "Permissions",
    path: "/users/permissions",
    description: "รหัสสิทธิ์ในระบบ",
    icon: <FontAwesomeIcon icon={faKey} />,
  },
  {
    name: "Menus",
    path: "/users/menus",
    description: "โครงเมนูและการมองเห็น",
    icon: <FontAwesomeIcon icon={faList} />,
  },
];

export default function UsersOverviewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="ภาพรวม Users Management" />
      <div className="space-y-8">
        <OverviewHubSection
          title="Users Management"
          sectionDescription="เมนูย่อยภายใต้กลุ่มผู้ใช้ — เลือกการทำงานด้านล่าง (รูปแบบเดียวกับ Master Data)"
          icon={<FontAwesomeIcon icon={faUsers} />}
          items={items}
        />
      </div>
    </div>
  );
}
