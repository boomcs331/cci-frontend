"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { getSession, getUserPermissions, isAdmin } from "@/utils/session";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; permission?: string }[];
  permission?: string;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },

  {
    icon: <UserCircleIcon />,
    name: "Session",
    path: "/session",
  },
  {
    icon: <UserCircleIcon />,
    name: "Users Management",
    permission: "CAN_READ",
    subItems: [
      { name: "All Users", path: "/users", pro: false, permission: "CAN_READ" },
      { name: "Add User", path: "/users/add", pro: false, permission: "CAN_CREATE" },
      { name: "User Roles", path: "/users/roles", pro: false, permission: "CAN_READ" },
      { name: "Permissions", path: "/users/permissions", pro: false, permission: "CAN_READ" },
    ],
  },
  {
    icon: <ListIcon />,
    name: "PC",
    permission: "CAN_READ",
    subItems: [
      { name: "ข้อมูลวัตถุดิบ", path: "/pc", pro: false, permission: "CAN_READ" },
      { name: "รายการรับเข้า", path: "/pc/income", pro: false, permission: "CAN_CREATE" },
      { name: "รายการจ่ายออก", path: "/pc/outcome", pro: false, permission: "CAN_READ" },
      { name: "จัดงานล่วงหน้า", path: "/pc/schedule", pro: false, permission: "CAN_READ" },
      { name: "รายงาน", path: "/pc/report", pro: false, permission: "CAN_READ" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Production",
    permission: "CAN_READ",
    subItems: [
      { name: "Products", path: "/production/products", pro: false, permission: "CAN_READ" },
      { name: "BOM", path: "/production/bom", pro: false, permission: "CAN_READ" },
    ],
  },
];


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const session = getSession(); // ใช้ getSession ที่จะตรวจสอบ expiration
    if (!session) {
      router.push('/signin');
    } else {
      const permissions = getUserPermissions();
      setUserPermissions(permissions);
    }
  }, [router, isClient]);

  // ตรวจสอบสิทธิ์การเข้าถึง Users Management (เฉพาะ role id = 1)
  const hasUsersManagementAccess = () => {
    if (!isClient) return false;
    return isAdmin();
  };

  // ตรวจสอบว่า submenu ใดมี active path
  const hasActiveSubItem = (subItems?: { path: string }[]) => {
    if (!subItems) return false;
    return subItems.some(subItem => isActive(subItem.path));
  };

  // ตรวจสอบสิทธิ์การเข้าถึง
  const hasPermission = (permission?: string) => {
    if (!permission) return true; // ไม่ต้องการ permission
    return userPermissions.includes(permission);
  };

  // กรองเมนูตาม permissions
  const filterMenuByPermissions = (items: NavItem[]) => {
    return items.filter(item => {
      // ตรวจสอบพิเศษสำหรับ Users Management
      if (item.name === "Users Management") {
        return hasUsersManagementAccess();
      }

      if (!hasPermission(item.permission)) return false;

      if (item.subItems) {
        // สำหรับ Users Management submenu ก็ตรวจสอบ role id = 1 เหมือนกัน
        if (item.name === "Users Management") {
          item.subItems = item.subItems.filter(() => hasUsersManagementAccess());
        } else {
          item.subItems = item.subItems.filter(subItem => hasPermission(subItem.permission));
        }
        return item.subItems.length > 0;
      }

      return true;
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => {
    if (!isClient) {
      // แสดงเมนูพื้นฐานในช่วง SSR
      return (
        <ul className="flex flex-col gap-4">
          {navItems.map((nav, index) => (
            <li key={nav.name}>
              {nav.subItems ? (
                <div className="menu-item menu-item-inactive">
                  <span className="menu-item-icon-inactive">{nav.icon}</span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </div>
              ) : (
                nav.path && (
                  <Link href={nav.path} className="menu-item menu-item-inactive">
                    <span className="menu-item-icon-inactive">{nav.icon}</span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      );
    }

    const filteredItems = filterMenuByPermissions(navItems);

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group  ${(openSubmenu?.type === menuType && openSubmenu?.index === index) || hasActiveSubItem(nav.subItems)
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={` ${(openSubmenu?.type === menuType && openSubmenu?.index === index) || hasActiveSubItem(nav.subItems)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    if (!isClient) return;

    // Check if the current path matches any submenu item
    let submenuMatched = false;
    const items = filterMenuByPermissions(navItems);
    items.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, userPermissions, isClient]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
