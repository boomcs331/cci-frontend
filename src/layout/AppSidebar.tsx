"use client";
import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  getSession,
  getUserDepartmentCode,
  getUserDepartmentCodes,
  getUserMenus,
  getUserPermissions,
  isAdmin,
  setSession,
} from "@/utils/session";
import { apiFetch } from "@/utils/api";
import { AccessPolicy, canAccessPolicy, getRouteAccessPolicy } from "@/utils/accessControl";
import type { MenuItem } from "@/types/user";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxesStacked,
  faCartShopping,
  faDatabase,
  faGauge,
  faIndustry,
  faUsers,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";

type AccessConfig = AccessPolicy;

type NestedMenuItem = AccessConfig & {
  name: string;
  path: string;
};

type SubMenuItem = AccessConfig & {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  isCollapsible?: boolean;
  items?: NestedMenuItem[];
};

type NavItem = AccessConfig & {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubMenuItem[];
};

const ICON_MAP = {
  gauge: faGauge,
  users: faUsers,
  boxes: faBoxesStacked,
  industry: faIndustry,
  database: faDatabase,
  warehouse: faWarehouse,
  cart: faCartShopping,
} as const;

const toIconNode = (iconKey?: string | null): React.ReactNode => {
  const icon = ICON_MAP[(iconKey ?? '').toLowerCase() as keyof typeof ICON_MAP] ?? faGauge;
  return <FontAwesomeIcon icon={icon} />;
};

const mapMenuItemToSubItem = (item: MenuItem): SubMenuItem => {
  if (item.children.length > 0) {
    return {
      name: item.label,
      path: item.path ?? "",
      isCollapsible: true,
      items: item.children.map((child) => ({
        name: child.label,
        path: child.path ?? "",
      })),
    };
  }

  return {
    name: item.label,
    path: item.path ?? "",
  };
};

const mapMenuToNavItems = (menuItems: MenuItem[]): NavItem[] => {
  return menuItems.map((item) => {
    if (item.children.length > 0) {
      return {
        name: item.label,
        icon: toIconNode(item.iconKey),
        path: item.path ?? undefined,
        subItems: item.children.map(mapMenuItemToSubItem),
      };
    }

    return {
      name: item.label,
      icon: toIconNode(item.iconKey),
      path: item.path ?? undefined,
    };
  });
};

const MENU_DISPLAY_ORDER = [
  "Dashboard",
  "Users Management",
  "PC",
  "Production",
  "Stock",
  "Master Data",
] as const;

const MENU_ORDER_INDEX = new Map(
  MENU_DISPLAY_ORDER.map((name, index) => [name.toLowerCase(), index]),
);

const sortNavItemsByDisplayOrder = (items: NavItem[]): NavItem[] => {
  return [...items].sort((a, b) => {
    const aOrder = MENU_ORDER_INDEX.get(a.name.toLowerCase());
    const bOrder = MENU_ORDER_INDEX.get(b.name.toLowerCase());

    if (aOrder === undefined && bOrder === undefined) return 0;
    if (aOrder === undefined) return 1;
    if (bOrder === undefined) return -1;

    return aOrder - bOrder;
  });
};


const emptySubscribe = () => () => undefined;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [menuTick, setMenuTick] = useState(0);
  const userPermissions = isHydrated ? getUserPermissions() : [];
  const userDepartmentCode = isHydrated ? getUserDepartmentCode() : null;
  const isAdminUser = isHydrated ? isAdmin() : false;
  const navItems = React.useMemo(
    () =>
      isHydrated
        ? sortNavItemsByDisplayOrder(mapMenuToNavItems(getUserMenus()))
        : [],
    [isHydrated, menuTick],
  );

  useEffect(() => {
    if (!isHydrated) return;

    const session = getSession();
    if (!session) {
      router.push('/signin');
      return;
    }

    const departmentId = session.user?.departmentId ?? session.user?.department?.id;
    const headers: HeadersInit = { 'x-user-id': session.user!.id };
    if (departmentId) {
      headers['x-department-id'] = String(departmentId);
    }

    void apiFetch('/auth/menu', { headers })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { menus?: MenuItem[] };
        if (!Array.isArray(data.menus)) return;
        const current = getSession();
        if (!current) return;
        setSession({ ...current, menus: data.menus });
        setMenuTick((t) => t + 1);
      })
      .catch(() => undefined);
  }, [router, isHydrated, pathname]);

  // ตรวจสอบว่า submenu ใดมี active path
  const hasActiveSubItem = (subItems?: SubMenuItem[]) => {
    if (!subItems) return false;
    return subItems.some((subItem) => {
      if (subItem.isCollapsible && subItem.items) {
        return subItem.items.some((nestedItem) => isActive(nestedItem.path));
      }
      return isActive(subItem.path);
    });
  };

  const userDepartmentCodes = isHydrated ? getUserDepartmentCodes() : [];

  const accessContext = {
    isAdmin: isAdminUser,
    permissions: userPermissions,
    departmentCode: userDepartmentCode,
    departmentCodes: userDepartmentCodes,
  };

  const resolvePolicy = (path?: string, extra?: AccessConfig): AccessPolicy => {
    if (path) {
      const routePolicy = getRouteAccessPolicy(path);
      if (routePolicy) return routePolicy;
    }
    return extra ?? {};
  };

  const canAccess = (path?: string, extra?: AccessConfig): boolean => {
    return canAccessPolicy(resolvePolicy(path, extra), accessContext, path);
  };

  const filterSubItem = (subItem: SubMenuItem): SubMenuItem | null => {
    if (!canAccess(subItem.path, subItem)) {
      return null;
    }

    if (subItem.isCollapsible && subItem.items) {
      const allowedNestedItems = subItem.items.filter((nestedItem) =>
        canAccess(nestedItem.path, nestedItem),
      );
      if (allowedNestedItems.length === 0) {
        return null;
      }

      return {
        ...subItem,
        items: allowedNestedItems,
      };
    }

    return subItem;
  };

  const filterMenuByPermissions = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (!canAccess(item.path, item)) {
          return null;
        }

        if (!item.subItems || item.subItems.length === 0) {
          return item;
        }

        const allowedSubItems = item.subItems
          .map((subItem) => filterSubItem(subItem))
          .filter((subItem): subItem is SubMenuItem => subItem !== null);

        if (allowedSubItems.length === 0) {
          return null;
        }

        return {
          ...item,
          subItems: allowedSubItems,
        };
      })
      .filter((item): item is NavItem => item !== null);
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => {
    if (!isHydrated) {
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
                  {nav.subItems.map((subItem, subIndex) => (
                    <li key={subItem.name}>
                      {subItem.isCollapsible && subItem.items ? (
                        <div>
                          <button
                            onClick={() => {
                              const key = `${menuType}-${index}-${subIndex}`;
                              setOpenNestedSubmenu(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                          >
                            {subItem.name}
                            <ChevronDownIcon
                              className={`w-4 h-4 transition-transform ${openNestedSubmenu[`${menuType}-${index}-${subIndex}`] ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {openNestedSubmenu[`${menuType}-${index}-${subIndex}`] && (
                            <ul className="ml-4 mt-1 space-y-1">
                              {subItem.items.map((nestedItem) => (
                                <li key={nestedItem.name}>
                                  <Link
                                    href={nestedItem.path}
                                    className={`menu-dropdown-item ${isActive(nestedItem.path)
                                      ? "menu-dropdown-item-active"
                                      : "menu-dropdown-item-inactive"
                                      }`}
                                  >
                                    {nestedItem.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : (
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
                      )}
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
  const [openNestedSubmenu, setOpenNestedSubmenu] = useState<Record<string, boolean>>({});
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

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

  useLayoutEffect(() => {
    // When nested submenus open/close, the parent submenu height must be recalculated
    // otherwise the nested list can be rendered but clipped by the fixed height.
    if (openSubmenu === null) return;
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const el = subMenuRefs.current[key];
    if (!el) return;

    setSubMenuHeight((prevHeights) => ({
      ...prevHeights,
      [key]: el.scrollHeight || 0,
    }));
  }, [openSubmenu, openNestedSubmenu]);

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
