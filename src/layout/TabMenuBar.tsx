"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faUsers,
  faBoxesStacked,
  faIndustry,
  faDatabase,
  faWarehouse,
  faCartShopping,
} from "@fortawesome/free-solid-svg-icons";

type TabItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

const TAB_ITEMS: TabItem[] = [
  { name: "Dashboard", path: "/", icon: <FontAwesomeIcon icon={faGauge} /> },
  { name: "Users", path: "/users", icon: <FontAwesomeIcon icon={faUsers} /> },
  { name: "PC", path: "/pc", icon: <FontAwesomeIcon icon={faBoxesStacked} /> },
  { name: "Production", path: "/production", icon: <FontAwesomeIcon icon={faIndustry} /> },
  { name: "Stock", path: "/stock", icon: <FontAwesomeIcon icon={faWarehouse} /> },
  { name: "Master Data", path: "/master-data", icon: <FontAwesomeIcon icon={faDatabase} /> },
  { name: "Sales", path: "/sales", icon: <FontAwesomeIcon icon={faCartShopping} /> },
];

const TabMenuBar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-16 z-40 w-full bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="px-4 lg:px-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TAB_ITEMS.map((tab) => (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${isActive(tab.path)
                  ? "text-brand-500 border-brand-500"
                  : "text-gray-600 border-transparent hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabMenuBar;
