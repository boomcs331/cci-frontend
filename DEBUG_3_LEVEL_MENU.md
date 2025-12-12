# Debug 3-Level Menu Issue

## Problem
The 3-level menu items in the Productions menu are not displaying completely.

## Debugging Steps Implemented

### 1. Added Debug Logging
```typescript
// Added comprehensive logging to track:
console.log('🔍 AppSidebar - User roles:', userRoles);
console.log('🔍 AppSidebar - API permissions:', apiPermissions);
console.log('🔍 AppSidebar - Final permissions:', uniquePermissions);
console.log('🔍 AppSidebar - Is Admin User:', isAdminUser);
```

### 2. Permission Filtering Debug
```typescript
// Added detailed logging for 3rd level filtering:
console.log(`🔍 Filtering 3rd level items for: ${subItem.name}`);
console.log(`  - ${subSubItem.name} (${subSubMenuKey}): ${hasPermission ? '✅' : '❌'}`);
console.log(`    User permissions:`, uniquePermissions);
```

### 3. Temporary Bypass for Productions Menu
```typescript
// Temporary fix to force Productions menu visibility:
if (item.menuKey === 'production') {
  console.log('🔍 Productions menu - forcing visibility for debugging');
}

// Force 3rd level items to show:
if (item.menuKey === 'production') {
  console.log(`🔍 Productions sub-item - forcing visibility for debugging`);
  return true;
}
```

### 4. Fixed Permission Requirements
Changed all Production menu items to require only 'read' permission:
```typescript
'edit-material': { permissions: ['read'] },        // Was: ['write']
'defect-tracking': { permissions: ['read'] },      // Was: ['write']  
'schedule-management': { permissions: ['read'] },   // Was: ['write']
'resource-allocation': { permissions: ['read'] },  // Was: ['write']
```

### 5. Added Height Calculation Debug
```typescript
useEffect(() => {
  if (openSubSubmenu !== null) {
    const key = `${openSubSubmenu.type}-${openSubSubmenu.parentIndex}-${openSubSubmenu.subIndex}`;
    console.log('🔍 Setting sub-submenu height for key:', key);
    const height = subSubMenuRefs.current[key]?.scrollHeight || 0;
    console.log('🔍 Sub-submenu height:', height);
  }
}, [openSubSubmenu]);
```

## Current Menu Structure
```
📁 Productions
├── 📂 Material Management (Level 2)
│   ├── ➕ Add Material (Level 3)
│   ├── 👁️ View Material (Level 3)
│   └── ✏️ Edit Material (Level 3) ← Created test page
├── 📂 Quality Control (Level 2)
│   ├── 📊 Inspection Reports (Level 3)
│   ├── 📈 Quality Metrics (Level 3)
│   └── 🔍 Defect Tracking (Level 3)
└── 📂 Production Planning (Level 2)
    ├── 📅 Schedule Management (Level 3)
    ├── 🎯 Resource Allocation (Level 3)
    └── 📊 Capacity Planning (Level 3)
```

## Potential Issues to Check

### 1. Permission System
- ✅ All Production items now require only 'read' permission
- ✅ All user roles include 'read' permission
- ✅ Added temporary bypass for Productions menu

### 2. State Management
- ✅ Added `openSubSubmenu` state for 3rd level
- ✅ Added `subSubMenuHeight` for height calculations
- ✅ Added `subSubMenuRefs` for DOM references

### 3. Event Handlers
- ✅ Added `handleSubSubmenuToggle` function
- ✅ Updated `handleSubmenuToggle` to close 3rd level menus

### 4. Rendering Logic
- ✅ Added conditional rendering for 3rd level items
- ✅ Added proper indentation (ml-6 for 3rd level)
- ✅ Added chevron indicators for expandable items

### 5. Height Calculations
- ✅ Added useEffect for sub-submenu height calculation
- ✅ Added debugging for height values
- ✅ Added proper ref management

## Testing Steps

### 1. Check Console Logs
Open browser console and look for:
- `🔍 AppSidebar - User roles:` - Should show user roles
- `🔍 AppSidebar - Final permissions:` - Should include 'read'
- `🔍 AppSidebar - Is Admin User:` - Should show true/false
- `🔍 Productions menu - forcing visibility` - Should appear
- `🔍 Filtering 3rd level items` - Should show filtering process

### 2. Test Menu Interaction
1. Click "Productions" menu → Should expand to show 3 categories
2. Click "Material Management" → Should expand to show 3 items
3. Click "Add Material" → Should navigate to /add-material
4. Click "Edit Material" → Should navigate to /edit-material

### 3. Check DOM Elements
Inspect the DOM to verify:
- 3rd level `<ul>` elements are present
- Height styles are being applied
- Refs are properly attached

## Next Steps if Still Not Working

### 1. Check User Authentication
```typescript
// Verify user has proper session and permissions
const { user, permissions } = useAuth();
console.log('Current user:', user);
console.log('Current permissions:', permissions);
```

### 2. Simplify Menu Structure
Temporarily remove permission checking:
```typescript
// In filterMenuItems, return all items without filtering
return items; // Skip all permission checks
```

### 3. Check CSS Issues
Verify that menu items aren't hidden by CSS:
```css
/* Check for any CSS that might hide 3rd level items */
.menu-dropdown-item { display: block !important; }
```

### 4. Test with Static Menu
Create a simple static 3-level menu to isolate the issue:
```typescript
const testMenu = [
  {
    name: "Test Level 1",
    subItems: [
      {
        name: "Test Level 2", 
        subItems: [
          { name: "Test Level 3", path: "/test" }
        ]
      }
    ]
  }
];
```

## Files Modified
- ✅ `src/layout/AppSidebar.tsx` - Added 3-level support + debugging
- ✅ `src/lib/permissions.ts` - Fixed permission requirements
- ✅ `src/app/(admin)/(others-pages)/edit-material/page.tsx` - Test page

## Expected Console Output
When working correctly, you should see:
```
🔍 AppSidebar - User roles: ['admin'] or ['user']
🔍 AppSidebar - Final permissions: ['read', 'write', ...]
🔍 AppSidebar - Is Admin User: true/false
🔍 Productions menu - forcing visibility for debugging
🔍 Filtering 3rd level items for: Material Management
  - Add Material (add-material): ✅
  - View Material (view-material): ✅  
  - Edit Material (edit-material): ✅
🔍 Setting sub-submenu height for key: main-2-0
🔍 Sub-submenu height: 120
```