"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { hasMenuPermission, getMenuKeyFromPath, getPermissionsFromRoles, type Role } from "@/lib/permissions";
import { getStoredUserProfile } from "@/lib/auth";
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
import SidebarWidget from "./SidebarWidget";

type SubSubItem = {
  name: string;
  path: string;
  menuKey?: string;
  pro?: boolean;
  new?: boolean;
};

type SubItem = {
  name: string;
  path?: string;
  menuKey?: string;
  pro?: boolean;
  new?: boolean;
  subItems?: SubSubItem[]; // 3rd level items
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  menuKey?: string; // เพิ่ม menuKey สำหรับตรวจสอบสิทธิ์
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    menuKey: "dashboard",
    subItems: [{ 
      name: "Part Control", 
      path: "/dashboard", 
      menuKey: "dashboard",
      pro: false 
    },{ 
      name: "Part Office", 
      path: "/dashboard", 
      menuKey: "dashboard",
      pro: false 
    },{ 
      name: "Part Office Material", 
      path: "/dashboard", 
      menuKey: "dashboard",
      pro: false 
    }],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Materials",
    menuKey: "materials",
    subItems: [
      { 
        name: "PC",
        menuKey: "raw-materials",
        subItems: [
          {
            name: "รายการวัตถุดิบทั้งหมด", 
            path: "/materials/steel-list", 
            menuKey: "steel-view",
            pro: false 
          },
          {
            name: "เพิ่มรายการววัตถุดิบ", 
            path: "/materials/add-steel", 
            menuKey: "steel-insert",
            pro: false 
          },
          {
            name: "รายการ รับเข้า - จ่ายออก", 
            path: "/materials/transaction", 
            menuKey: "steel-transaction",
            pro: false 
          },
          {
            name: "รายงาน", 
            path: "/materials/report", 
            menuKey: "textiles",
            pro: false 
          }
        ]
      },
      { 
        name: "Components",
        menuKey: "components",
        subItems: [
          {
            name: "Electronic Parts", 
            path: "/materials/electronic-parts", 
            menuKey: "electronic-parts",
            pro: false 
          },
          {
            name: "Mechanical Parts", 
            path: "/materials/mechanical-parts", 
            menuKey: "mechanical-parts",
            pro: false 
          },
          {
            name: "Fasteners & Hardware", 
            path: "/materials/fasteners", 
            menuKey: "fasteners",
            pro: false 
          },
          {
            name: "Custom Components", 
            path: "/materials/custom-components", 
            menuKey: "custom-components",
            pro: false 
          }
        ]
      },
      { 
        name: "Finished Products",
        menuKey: "finished-products",
        subItems: [
          {
            name: "Consumer Goods", 
            path: "/materials/consumer-goods", 
            menuKey: "consumer-goods",
            pro: false 
          },
          {
            name: "Industrial Products", 
            path: "/materials/industrial-products", 
            menuKey: "industrial-products",
            pro: false 
          },
          {
            name: "Packaging Materials", 
            path: "/materials/packaging", 
            menuKey: "packaging",
            pro: false 
          },
          {
            name: "Export Products", 
            path: "/materials/export-products", 
            menuKey: "export-products",
            pro: false 
          }
        ]
      }
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Productions",
    menuKey: "production",
    subItems: [
      { 
        name: "Production Lines",
        menuKey: "production-lines",
        subItems: [
          {
            name: "Assembly Line A", 
            path: "/production/assembly-line-a", 
            menuKey: "assembly-line-a",
            pro: false 
          },
          {
            name: "Assembly Line B", 
            path: "/production/assembly-line-b", 
            menuKey: "assembly-line-b",
            pro: false 
          },
          {
            name: "Packaging Line", 
            path: "/production/packaging-line", 
            menuKey: "packaging-line",
            pro: false 
          },
          {
            name: "Testing Station", 
            path: "/production/testing-station", 
            menuKey: "testing-station",
            pro: false 
          }
        ]
      },
      { 
        name: "Manufacturing Process",
        menuKey: "manufacturing-process",
        subItems: [
          {
            name: "Material Processing", 
            path: "/production/material-processing", 
            menuKey: "material-processing",
            pro: false 
          },
          {
            name: "Component Assembly", 
            path: "/production/component-assembly", 
            menuKey: "component-assembly",
            pro: false 
          },
          {
            name: "Quality Testing", 
            path: "/production/quality-testing", 
            menuKey: "quality-testing",
            pro: false 
          },
          {
            name: "Final Inspection", 
            path: "/production/final-inspection", 
            menuKey: "final-inspection",
            pro: false 
          }
        ]
      },
      { 
        name: "Production Control",
        menuKey: "production-control",
        subItems: [
          {
            name: "Work Orders", 
            path: "/production/work-orders", 
            menuKey: "work-orders",
            pro: false 
          },
          {
            name: "Production Schedule", 
            path: "/production/schedule", 
            menuKey: "production-schedule",
            pro: false 
          },
          {
            name: "Machine Monitoring", 
            path: "/production/machine-monitoring", 
            menuKey: "machine-monitoring",
            pro: false 
          },
          {
            name: "Performance Analytics", 
            path: "/production/analytics", 
            menuKey: "production-analytics",
            pro: false 
          }
        ]
      }
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Material Production",
    menuKey: "material-production",
    subItems: [
      { 
        name: "Material Planning",
        menuKey: "material-planning",
        subItems: [
          {
            name: "Material Requirements", 
            path: "/material-production/requirements", 
            menuKey: "material-requirements",
            pro: false 
          },
          {
            name: "Procurement Planning", 
            path: "/material-production/procurement", 
            menuKey: "procurement-planning",
            pro: false 
          },
          {
            name: "Inventory Forecasting", 
            path: "/material-production/forecasting", 
            menuKey: "inventory-forecasting",
            pro: false 
          },
          {
            name: "Supplier Management", 
            path: "/material-production/suppliers", 
            menuKey: "supplier-management",
            pro: false 
          }
        ]
      },
      { 
        name: "Material Processing",
        menuKey: "material-processing-ops",
        subItems: [
          {
            name: "Raw Material Intake", 
            path: "/material-production/intake", 
            menuKey: "raw-material-intake",
            pro: false 
          },
          {
            name: "Material Transformation", 
            path: "/material-production/transformation", 
            menuKey: "material-transformation",
            pro: false 
          },
          {
            name: "Quality Assurance", 
            path: "/material-production/quality-assurance", 
            menuKey: "material-qa",
            pro: false 
          },
          {
            name: "Batch Tracking", 
            path: "/material-production/batch-tracking", 
            menuKey: "batch-tracking",
            pro: false 
          }
        ]
      },
      { 
        name: "Production Integration",
        menuKey: "production-integration",
        subItems: [
          {
            name: "Material Flow Control", 
            path: "/material-production/flow-control", 
            menuKey: "material-flow-control",
            pro: false 
          },
          {
            name: "Production Scheduling", 
            path: "/material-production/scheduling", 
            menuKey: "material-scheduling",
            pro: false 
          },
          {
            name: "Waste Management", 
            path: "/material-production/waste-management", 
            menuKey: "waste-management",
            pro: false 
          },
          {
            name: "Cost Analysis", 
            path: "/material-production/cost-analysis", 
            menuKey: "material-cost-analysis",
            pro: false 
          }
        ]
      }
    ],
  },
  
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
    menuKey: "calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
    menuKey: "profile",
  },
  {
    name: "Forms",
    icon: <ListIcon />,
    menuKey: "forms",
    subItems: [{ 
      name: "Form Elements", 
      path: "/form-elements", 
      menuKey: "form-elements",
      pro: false 
    }],
  },
  {
    name: "Tables",
    icon: <TableIcon />,
    menuKey: "tables",
    subItems: [{ 
      name: "Basic Tables", 
      path: "/basic-tables", 
      menuKey: "basic-tables",
      pro: false 
    }],
  },
  {
    name: "Pages",
    icon: <PageIcon />,
    menuKey: "pages",
    subItems: [
      { 
        name: "Blank Page", 
        path: "/blank", 
        menuKey: "blank",
        pro: false 
      },
      { 
        name: "404 Error", 
        path: "/error-404", 
        menuKey: "error-404",
        pro: false 
      },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    menuKey: "charts",
    subItems: [
      { 
        name: "Line Chart", 
        path: "/line-chart", 
        menuKey: "line-chart",
        pro: false 
      },
      { 
        name: "Bar Chart", 
        path: "/bar-chart", 
        menuKey: "bar-chart",
        pro: false 
      },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    menuKey: "ui-elements",
    subItems: [
      { 
        name: "Alerts", 
        path: "/alerts", 
        menuKey: "alerts",
        pro: false 
      },
      { 
        name: "Avatar", 
        path: "/avatars", 
        menuKey: "avatars",
        pro: false 
      },
      { 
        name: "Badge", 
        path: "/badge", 
        menuKey: "badge",
        pro: false 
      },
      { 
        name: "Buttons", 
        path: "/buttons", 
        menuKey: "buttons",
        pro: false 
      },
      { 
        name: "Images", 
        path: "/images", 
        menuKey: "images",
        pro: false 
      },
      { 
        name: "Videos", 
        path: "/videos", 
        menuKey: "videos",
        pro: false 
      },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    menuKey: "authentication",
    subItems: [
      { 
        name: "Sign In", 
        path: "/signin", 
        menuKey: "signin",
        pro: false 
      },
      { 
        name: "Sign Up", 
        path: "/signup", 
        menuKey: "signup",
        pro: false 
      },
    ],
  },
];

// Admin-only menu items
const adminItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "User Management",
    menuKey: "user-management",
    subItems: [
      { 
        name: "All Users", 
        path: "/admin/users", 
        menuKey: "user-management",
        pro: false 
      },
      { 
        name: "Roles & Permissions", 
        path: "/admin/roles", 
        menuKey: "user-management",
        pro: false 
      },
    ],
  },
  {
    icon: <GridIcon />,
    name: "System Settings",
    path: "/admin/settings",
    menuKey: "system-settings",
  },
  {
    icon: <ListIcon />,
    name: "Security Logs",
    path: "/security-logs",
    menuKey: "security-logs",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user, permissions, getStoredProfile } = useAuth();
  const pathname = usePathname();

  // Get stored profile data for enhanced user info
  const storedProfile = getStoredProfile ? getStoredProfile() : getStoredUserProfile();

  // Get user roles from session or profile (รวมข้อมูลจาก API)
  // Handle both simple string roles and complex API role objects
  let userRoles: string[] = [];
  
  if (user?.roles) {
    if (Array.isArray(user.roles)) {
      // Check if it's array of strings or objects
      if (user.roles.length > 0 && typeof user.roles[0] === 'string') {
        userRoles = user.roles as string[];
      } else if (user.roles.length > 0 && typeof user.roles[0] === 'object') {
        // Extract role codes from API role objects
        userRoles = (user.roles as any[]).map(role => role.code || role);
      }
    } else if (typeof user.roles === 'string') {
      userRoles = [user.roles];
    }
  }
  
  // Also check stored profile for roles
  if (userRoles.length === 0 && storedProfile) {
    // Check direct roles first
    if (storedProfile.roles && Array.isArray(storedProfile.roles)) {
      if (storedProfile.roles.length > 0 && typeof storedProfile.roles[0] === 'string') {
        userRoles = storedProfile.roles;
      } else if (storedProfile.roles.length > 0 && typeof storedProfile.roles[0] === 'object') {
        userRoles = storedProfile.roles.map((role: any) => role.code || role);
      }
    }
    // Check nested user roles
    else if (storedProfile.user?.roles && Array.isArray(storedProfile.user.roles)) {
      userRoles = storedProfile.user.roles.map((role: any) => role.code || role);
    }
  }
    
  // Get permissions from multiple sources (API response takes priority)
  const apiPermissions = Array.isArray(permissions) ? permissions as string[] : [];
  const profilePermissions = storedProfile?.permissions || [];
  
  // Extract permissions from API roles if available
  let roleBasedPermissions: string[] = [];
  if (storedProfile) {
    // Check nested user roles first
    const rolesArray = storedProfile.user?.roles || storedProfile.roles;
    if (rolesArray && Array.isArray(rolesArray)) {
      rolesArray.forEach((role: any) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          const rolePerms = role.permissions.map((perm: any) => perm.code || perm);
          roleBasedPermissions.push(...rolePerms);
        }
      });
    }
  }
  
  // Fallback to role-based permissions
  const fallbackRolePermissions = getPermissionsFromRoles(userRoles as Role[]);
  
  const userPermissions: string[] = [
    // Priority: API permissions > Profile permissions > Role-based permissions > Fallback
    ...apiPermissions,
    ...profilePermissions,
    ...roleBasedPermissions,
    ...fallbackRolePermissions.map(String)
  ];
  
  // Remove duplicates
  const uniquePermissions = Array.from(new Set(userPermissions));

  // Check if user is admin (has access to everything)
  const isAdminUser = userRoles.some(role => 
    role.toUpperCase() === 'ADMIN' || role.toLowerCase() === 'admin'
  ) || uniquePermissions.some(permission => 
    permission.toLowerCase().includes('admin')
  );

  // Debug logging
  console.log('🔍 AppSidebar - User roles:', userRoles);
  console.log('🔍 AppSidebar - API permissions:', apiPermissions);
  console.log('🔍 AppSidebar - Profile permissions:', profilePermissions);
  console.log('🔍 AppSidebar - Role-based permissions:', roleBasedPermissions);
  console.log('🔍 AppSidebar - Final permissions:', uniquePermissions);
  console.log('🔍 AppSidebar - Is Admin User:', isAdminUser);

  // Filter menu items based on API permissions
  const filterMenuItems = (items: NavItem[]): NavItem[] => {
    // Admin users see all menu items
    if (isAdminUser) {
      console.log('🔓 Admin user - showing all menu items');
      return items;
    }

    console.log('🔍 Filtering menu items for non-admin user');

    return items.filter(item => {
      // Check main menu item permission using API data
      const menuKey = item.menuKey || getMenuKeyFromPath(item.path || '');
      const hasMainPermission = hasMenuPermission(menuKey, userRoles, uniquePermissions);
      
      // Temporary: Always show Productions menu for debugging
      if (item.menuKey === 'production') {
        console.log('🔍 Productions menu - forcing visibility for debugging');
      }
      
      if (!hasMainPermission && item.menuKey !== 'production') {
        return false;
      }

      // Filter sub items if they exist
      if (item.subItems) {
        item.subItems = item.subItems.filter(subItem => {
          const subMenuKey = subItem.menuKey || getMenuKeyFromPath(subItem.path || '');
          const hasMainPermission = hasMenuPermission(subMenuKey, userRoles, uniquePermissions);
          
          // If this subItem has its own subItems (3rd level), filter them too
          if (subItem.subItems) {
            console.log(`🔍 Filtering 3rd level items for: ${subItem.name}`);
            const originalCount = subItem.subItems.length;
            subItem.subItems = subItem.subItems.filter(subSubItem => {
              const subSubMenuKey = subSubItem.menuKey || getMenuKeyFromPath(subSubItem.path);
              const hasPermission = hasMenuPermission(subSubMenuKey, userRoles, uniquePermissions);
              console.log(`  - ${subSubItem.name} (${subSubMenuKey}): ${hasPermission ? '✅' : '❌'}`);
              console.log(`    User permissions:`, uniquePermissions);
              
              // Temporary: Always show Productions sub-items for debugging
              if (item.menuKey === 'production') {
                console.log(`    🔍 Productions sub-item - forcing visibility for debugging`);
                return true;
              }
              
              return hasPermission;
            });
            console.log(`  Filtered ${originalCount} → ${subItem.subItems.length} items`);
            // Keep the subItem if it has accessible sub-sub items or if it has main permission
            return subItem.subItems.length > 0 || hasMainPermission;
          }
          
          return hasMainPermission;
        });
        
        // Hide main item if no sub items are accessible
        return item.subItems.length > 0;
      }

      return true;
    });
  };

  // Get filtered menu items using API permissions
  const filteredNavItems = filterMenuItems([...navItems]);
  const filteredOthersItems = filterMenuItems([...othersItems]);
  const filteredAdminItems = filterMenuItems([...adminItems]);

  // Check if user has admin permissions (use the same logic as menu filtering)
  const isAdmin = isAdminUser;

  const renderMenuItems = (
    menuItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {menuItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group menu-material-ripple ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active menu-active-indicator"
                  : "menu-item-inactive menu-material-elevation"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
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
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
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
                className={`menu-item group menu-material-ripple ${
                  isActive(nav.path) ? "menu-item-active menu-active-indicator" : "menu-item-inactive menu-material-elevation"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
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
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "opacity-100"
                  : "max-h-0 opacity-0"
              }`}
              style={{
                maxHeight: openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? `${subMenuHeight[`${menuType}-${index}`] || 1000}px`
                  : '0px'
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem, subIndex) => (
                  <li key={subItem.name}>
                    {subItem.subItems ? (
                      // 3rd level menu item (has sub-sub items)
                      <>
                        <button
                          onClick={() => handleSubSubmenuToggle(index, subIndex, menuType)}
                          className={`menu-dropdown-item menu-material-ripple w-full text-left ${
                            openSubSubmenu?.type === menuType && 
                            openSubSubmenu?.parentIndex === index && 
                            openSubSubmenu?.subIndex === subIndex
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            <ChevronDownIcon
                              className={`w-4 h-4 transition-transform duration-200 ${
                                openSubSubmenu?.type === menuType &&
                                openSubSubmenu?.parentIndex === index &&
                                openSubSubmenu?.subIndex === subIndex
                                  ? "rotate-180 text-brand-500"
                                  : ""
                              }`}
                            />
                          </span>
                        </button>
                        {/* 3rd level submenu */}
                        <div
                          ref={(el) => {
                            subSubMenuRefs.current[`${menuType}-${index}-${subIndex}`] = el;
                          }}
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            openSubSubmenu?.type === menuType &&
                            openSubSubmenu?.parentIndex === index &&
                            openSubSubmenu?.subIndex === subIndex
                              ? "opacity-100"
                              : "max-h-0 opacity-0"
                          }`}
                          style={{
                            maxHeight: openSubSubmenu?.type === menuType &&
                              openSubSubmenu?.parentIndex === index &&
                              openSubSubmenu?.subIndex === subIndex
                                ? `${subSubMenuHeight[`${menuType}-${index}-${subIndex}`] || 500}px`
                                : '0px'
                          }}
                        >
                          <ul className="mt-1 space-y-1 ml-6">
                            {subItem.subItems.map((subSubItem) => (
                              <li key={subSubItem.name}>
                                <Link
                                  href={subSubItem.path}
                                  className={`menu-dropdown-item menu-material-ripple text-sm ${
                                    isActive(subSubItem.path)
                                      ? "menu-dropdown-item-active"
                                      : "menu-dropdown-item-inactive"
                                  }`}
                                >
                                  {subSubItem.name}
                                  <span className="flex items-center gap-1 ml-auto">
                                    {subSubItem.new && (
                                      <span
                                        className={`ml-auto ${
                                          isActive(subSubItem.path)
                                            ? "menu-dropdown-badge-active"
                                            : "menu-dropdown-badge-inactive"
                                        } menu-dropdown-badge `}
                                      >
                                        new
                                      </span>
                                    )}
                                    {subSubItem.pro && (
                                      <span
                                        className={`ml-auto ${
                                          isActive(subSubItem.path)
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
                      </>
                    ) : (
                      // 2nd level menu item (no sub-sub items)
                      subItem.path && (
                        <Link
                          href={subItem.path}
                          className={`menu-dropdown-item menu-material-ripple ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      )
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

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [openSubSubmenu, setOpenSubSubmenu] = useState<{
    type: "main" | "others";
    parentIndex: number;
    subIndex: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const [subSubMenuHeight, setSubSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subSubMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  // Utility function to recalculate all menu heights
  const recalculateHeights = useCallback(() => {
    // Recalculate submenu heights
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const element = subMenuRefs.current[key];
      if (element) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: element.scrollHeight,
        }));
      }
    }

    // Recalculate sub-submenu heights
    if (openSubSubmenu) {
      const key = `${openSubSubmenu.type}-${openSubSubmenu.parentIndex}-${openSubSubmenu.subIndex}`;
      const element = subSubMenuRefs.current[key];
      if (element) {
        setSubSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: element.scrollHeight,
        }));
      }
    }
  }, [openSubmenu, openSubSubmenu]);

  useEffect(() => {
    // Check if the current path matches any submenu item (2nd or 3rd level)
    let submenuMatched = false;
    let subSubmenuMatched = false;
    
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem, subIndex) => {
            // Check 3rd level items first
            if (subItem.subItems) {
              subItem.subItems.forEach((subSubItem) => {
                if (subSubItem.path && isActive(subSubItem.path)) {
                  setOpenSubmenu({
                    type: menuType as "main" | "others",
                    index,
                  });
                  setOpenSubSubmenu({
                    type: menuType as "main" | "others",
                    parentIndex: index,
                    subIndex,
                  });
                  submenuMatched = true;
                  subSubmenuMatched = true;
                }
              });
            }
            // Check 2nd level items
            else if (subItem.path && isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenus
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
    if (!subSubmenuMatched) {
      setOpenSubSubmenu(null);
    }
  }, [pathname, isActive]);

  // Calculate heights when submenu state changes
  useEffect(() => {
    console.log('🔍 Submenu state changed:', openSubmenu);
    if (openSubmenu) {
      setTimeout(() => {
        const key = `${openSubmenu.type}-${openSubmenu.index}`;
        const element = subMenuRefs.current[key];
        if (element) {
          const height = element.scrollHeight;
          console.log('🔍 Updating submenu height for key:', key, 'height:', height);
          setSubMenuHeight((prevHeights) => ({
            ...prevHeights,
            [key]: height,
          }));
        }
      }, 50);
    }
  }, [openSubmenu]);

  useEffect(() => {
    console.log('🔍 Sub-submenu state changed:', openSubSubmenu);
    if (openSubSubmenu) {
      setTimeout(() => {
        const key = `${openSubSubmenu.type}-${openSubSubmenu.parentIndex}-${openSubSubmenu.subIndex}`;
        const element = subSubMenuRefs.current[key];
        if (element) {
          const height = element.scrollHeight;
          console.log('🔍 Updating sub-submenu height for key:', key, 'height:', height);
          setSubSubMenuHeight((prevHeights) => ({
            ...prevHeights,
            [key]: height,
          }));
        }
        
        // Also recalculate parent height
        const parentKey = `${openSubSubmenu.type}-${openSubSubmenu.parentIndex}`;
        const parentElement = subMenuRefs.current[parentKey];
        if (parentElement) {
          setTimeout(() => {
            const parentHeight = parentElement.scrollHeight;
            console.log('🔍 Updating parent submenu height for key:', parentKey, 'height:', parentHeight);
            setSubMenuHeight((prevHeights) => ({
              ...prevHeights,
              [parentKey]: parentHeight,
            }));
          }, 100);
        }
      }, 50);
    }
  }, [openSubSubmenu]);

  // Recalculate heights when sidebar expansion changes
  useEffect(() => {
    if (isExpanded || isHovered || isMobileOpen) {
      setTimeout(() => {
        recalculateHeights();
      }, 100); // Wait for expansion animation to complete
    }
  }, [isExpanded, isHovered, isMobileOpen, recalculateHeights]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      const newState = prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
        ? null
        : { type: menuType, index };
      
      // Calculate height when opening submenu
      if (newState) {
        setTimeout(() => {
          const key = `${menuType}-${index}`;
          const element = subMenuRefs.current[key];
          if (element) {
            const height = element.scrollHeight;
            console.log('🔍 Setting submenu height for key:', key, 'height:', height);
            setSubMenuHeight((prevHeights) => ({
              ...prevHeights,
              [key]: height,
            }));
          }
        }, 10);
      }
      
      return newState;
    });
    // Close any open sub-submenus when toggling main submenu
    setOpenSubSubmenu(null);
  };

  const handleSubSubmenuToggle = (parentIndex: number, subIndex: number, menuType: "main" | "others") => {
    setOpenSubSubmenu((prevOpenSubSubmenu) => {
      const newState = prevOpenSubSubmenu &&
        prevOpenSubSubmenu.type === menuType &&
        prevOpenSubSubmenu.parentIndex === parentIndex &&
        prevOpenSubSubmenu.subIndex === subIndex
        ? null
        : { type: menuType, parentIndex, subIndex };
      
      // Calculate sub-submenu height when opening
      if (newState) {
        setTimeout(() => {
          const key = `${menuType}-${parentIndex}-${subIndex}`;
          const element = subSubMenuRefs.current[key];
          if (element) {
            const height = element.scrollHeight;
            console.log('🔍 Setting sub-submenu height for key:', key, 'height:', height);
            setSubSubMenuHeight((prevHeights) => ({
              ...prevHeights,
              [key]: height,
            }));
          }
        }, 10);
      }
      
      // Recalculate parent submenu height after state change
      setTimeout(() => {
        const parentKey = `${menuType}-${parentIndex}`;
        const parentElement = subMenuRefs.current[parentKey];
        if (parentElement) {
          const parentHeight = parentElement.scrollHeight;
          console.log('🔍 Recalculating parent height after toggle:', parentKey, 'height:', parentHeight);
          setSubMenuHeight((prevHeights) => ({
            ...prevHeights,
            [parentKey]: parentHeight,
          }));
        }
      }, 50); // Slightly longer delay to ensure animation completes
      
      return newState;
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
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
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
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
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar min-h-0 flex-1">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
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
              {renderMenuItems(filteredNavItems, "main")}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(filteredOthersItems, "others")}
            </div>

            {/* Admin Section */}
            {isAdmin && filteredAdminItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-red-500 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Admin"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(filteredAdminItems, "others")}
              </div>
            )}
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
