# Shared Components Documentation

## Overview
This document describes the shared component library for the CCI Frontend application. All components follow enterprise standards and are designed to be reusable across the application.

## Component Structure

```
src/components/shared/
├── layout/
│   ├── PageContainer.tsx
│   └── PageHeader.tsx
├── card/
│   ├── ContentCard.tsx
│   └── InfoCard.tsx
├── search/
│   └── SearchCard.tsx
├── table/
│   └── DataTable.tsx
├── form/
│   ├── FormSection.tsx
│   └── FormField.tsx
├── button/
│   └── ActionButton.tsx
├── feedback/
│   ├── StatusBadge.tsx
│   ├── LoadingState.tsx
│   ├── EmptyState.tsx
│   └── ErrorState.tsx
└── modal/
    ├── BaseModal.tsx
    └── ConfirmModal.tsx
```

## Layout Components

### PageContainer
Main wrapper for all admin pages. Provides consistent padding and layout structure.

**Props:**
- `children: React.ReactNode` - Page content
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { PageContainer } from '@/components/shared';

<PageContainer>
  <PageHeader title="Page Title" />
  {/* Page content */}
</PageContainer>
```

### PageHeader
Standard header for all admin pages. Includes title, optional description, and action buttons.

**Props:**
- `title: string` - Page title
- `description?: string` - Optional description
- `actions?: React.ReactNode` - Action buttons
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<PageHeader 
  title="Sales Orders" 
  description="Manage sales orders"
  actions={
    <ActionButton variant="primary">Create Order</ActionButton>
  }
/>
```

## Card Components

### ContentCard
Standard card wrapper for content sections with consistent styling.

**Props:**
- `title?: string` - Card title
- `subtitle?: string` - Card subtitle
- `actions?: React.ReactNode` - Action buttons
- `children: React.ReactNode` - Card content
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ContentCard title="Order Details" subtitle="Order #12345">
  <p>Order content here</p>
</ContentCard>
```

### InfoCard
Simple card for displaying key-value information. Used in summary sections and detail views.

**Props:**
- `label: string` - Field label
- `value: string | number` - Field value
- `icon?: React.ReactNode` - Optional icon
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<InfoCard label="Total Orders" value="1,234" />
```

## Search Components

### SearchCard
Standard card for search/filter sections. Wraps search form with consistent styling.

**Props:**
- `children: React.ReactNode` - Search form fields
- `onReset?: () => void` - Reset handler
- `showReset?: boolean` - Show reset button
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<SearchCard onReset={handleReset}>
  <FormField label="Search" name="search" value={search} onChange={setSearch} />
  <FormField label="Status" name="status" type="select" options={statusOptions} />
</SearchCard>
```

## Table Components

### DataTable
Standard data table component with dynamic columns, loading state, and empty state.

**Props:**
- `columns: Column<T>[]` - Table column definitions
- `data: T[]` - Table data
- `loading?: boolean` - Loading state
- `empty?: boolean` - Empty state
- `emptyMessage?: string` - Empty state message
- `onRowClick?: (row: T) => void` - Row click handler
- `rowKey?: keyof T | ((row: T) => string)` - Unique row key
- `className?: string` - Additional CSS classes

**Column Interface:**
```tsx
interface Column<T> {
  key: string;
  title: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}
```

**Usage:**
```tsx
const columns: Column<Order>[] = [
  { key: 'id', title: 'ID' },
  { key: 'orderNo', title: 'Order No' },
  { key: 'status', title: 'Status', render: (value) => <StatusBadge status={value} /> },
];

<DataTable 
  columns={columns} 
  data={orders} 
  loading={loading}
  onRowClick={handleRowClick}
  rowKey="id"
/>
```

## Form Components

### FormSection
Standard form section wrapper with optional title and description.

**Props:**
- `title?: string` - Section title
- `description?: string` - Section description
- `children: React.ReactNode` - Form fields
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<FormSection title="Customer Information" description="Enter customer details">
  <FormField label="Name" name="name" value={name} onChange={setName} />
  <FormField label="Email" name="email" type="email" value={email} onChange={setEmail} />
</FormSection>
```

### FormField
Standard form field component supporting multiple input types.

**Props:**
- `label: string` - Field label
- `name: string` - Field name
- `type?: FormFieldType` - Input type (text, number, email, password, date, select, textarea)
- `value?: string | number` - Field value
- `onChange?: (value: string | number) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Required field
- `disabled?: boolean` - Disabled state
- `error?: string` - Error message
- `options?: { value: string | number; label: string }[]` - Select options
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<FormField 
  label="Customer Name" 
  name="customerName" 
  value={customerName} 
  onChange={setCustomerName}
  required
/>

<FormField 
  label="Status" 
  name="status" 
  type="select" 
  value={status} 
  onChange={setStatus}
  options={[
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
  ]}
/>
```

## Button Components

### ActionButton
Standardized button component with multiple variants, sizes, icons, and loading state.

**Props:**
- `children: React.ReactNode` - Button text or content
- `variant?: ActionButtonVariant` - Button variant (primary, secondary, success, warning, danger, info)
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `icon?: React.ReactNode` - Button icon
- `loading?: boolean` - Loading state
- `disabled?: boolean` - Disabled state
- `onClick?: () => void` - Click handler
- `type?: 'button' | 'submit' | 'reset'` - Button type
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ActionButton variant="primary" onClick={handleSubmit}>
  Save
</ActionButton>

<ActionButton variant="danger" loading={deleting} onClick={handleDelete}>
  Delete
</ActionButton>

<ActionButton variant="secondary" icon={<Icon />}>
  Cancel
</ActionButton>
```

## Feedback Components

### StatusBadge
Standardized status badge component with consistent color mapping.

**Props:**
- `status: StatusType` - Status type
- `className?: string` - Additional CSS classes

**Status Types:**
- `pending` - Yellow badge
- `approved` - Green badge
- `rejected` - Red badge
- `cancelled` - Gray badge
- `draft` - Blue badge
- `processing` - Blue badge
- `completed` - Green badge
- `failed` - Red badge
- `success` - Green badge
- `error` - Red badge
- `warning` - Yellow badge
- `info` - Blue badge

**Usage:**
```tsx
<StatusBadge status="pending" />
<StatusBadge status="approved" />
<StatusBadge status="failed" />
```

### LoadingState
Standard loading indicator for data fetching states.

**Props:**
- `message?: string` - Loading message
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<LoadingState message="กำลังโหลดข้อมูล..." />
```

### EmptyState
Standard empty state component for when no data is available.

**Props:**
- `title?: string` - Empty state title
- `description?: string` - Empty state description
- `icon?: React.ReactNode` - Optional icon
- `action?: React.ReactNode` - Optional action button
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<EmptyState 
  title="ไม่พบข้อมูล"
  description="ไม่มีข้อมูลให้แสดงในขณะนี้"
  action={<ActionButton onClick={handleCreate}>สร้างใหม่</ActionButton>}
/>
```

### ErrorState
Standard error state component for error conditions.

**Props:**
- `title?: string` - Error title
- `description?: string` - Error description
- `onRetry?: () => void` - Retry handler
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<ErrorState 
  title="เกิดข้อผิดพลาด"
  description="ไม่สามารถโหลดข้อมูลได้"
  onRetry={handleRetry}
/>
```

## Modal Components

### BaseModal
Standard modal component used as base for all modals.

**Props:**
- `isOpen: boolean` - Modal open state
- `onClose: () => void` - Close handler
- `title?: string` - Modal title
- `children: React.ReactNode` - Modal content
- `size?: 'sm' | 'md' | 'lg' | 'xl'` - Modal size
- `showCloseButton?: boolean` - Show close button
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<BaseModal isOpen={isOpen} onClose={onClose} title="Edit Order" size="lg">
  <form>
    {/* Form content */}
  </form>
</BaseModal>
```

### ConfirmModal
Standard confirmation modal for confirm, delete, warning, and success actions.

**Props:**
- `isOpen: boolean` - Modal open state
- `onClose: () => void` - Close handler
- `onConfirm: () => void` - Confirm handler
- `title?: string` - Modal title
- `message: string` - Confirmation message
- `type?: ConfirmModalType` - Modal type (confirm, delete, warning, success)
- `confirmText?: string` - Confirm button text
- `cancelText?: string` - Cancel button text
- `loading?: boolean` - Loading state

**Usage:**
```tsx
<ConfirmModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  type="delete"
  message="คุณต้องการลบรายการนี้หรือไม่?"
  loading={deleting}
/>
```

## Design Standards

### Color Scheme
- **Primary:** Brand blue (#3B82F6)
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Danger:** Red (#EF4444)
- **Info:** Blue (#3B82F6)
- **Secondary:** Gray (#6B7280)

### Spacing
- **Card padding:** 24px (p-6)
- **Section margin:** 24px (mb-6)
- **Field gap:** 16px (gap-4)

### Border Radius
- **Cards:** 12px (rounded-xl)
- **Buttons:** 8px (rounded-lg)
- **Inputs:** 8px (rounded-lg)

### Typography
- **Page Title:** 24px (text-2xl font-bold)
- **Card Title:** 18px (text-lg font-semibold)
- **Section Title:** 18px (text-lg font-semibold)
- **Body Text:** 14px (text-sm)
- **Label Text:** 12px (text-xs)

### Responsive Grid
- **Desktop:** 4 columns (lg:grid-cols-4)
- **Tablet:** 2 columns (md:grid-cols-2)
- **Mobile:** 1 column (grid-cols-1)

## Usage Guidelines

### Page Structure
Every page should follow this structure:

```tsx
<PageContainer>
  <PageHeader 
    title="Page Title" 
    description="Page description"
    actions={<ActionButton>Primary Action</ActionButton>}
  />
  
  <SearchCard onReset={handleReset}>
    {/* Search fields */}
  </SearchCard>
  
  <ContentCard>
    <DataTable columns={columns} data={data} />
  </ContentCard>
</PageContainer>
```

### Do's
- Use shared components for all UI elements
- Follow the standard page structure
- Use TypeScript interfaces for all props
- Avoid inline styles
- Use Bootstrap utility classes
- Maintain consistent naming conventions

### Don'ts
- Create custom tables - use DataTable
- Create custom modals - use BaseModal/ConfirmModal
- Create custom badges - use StatusBadge
- Create custom loading states - use LoadingState
- Use inline styles
- Use `any` type

## Migration Guide

When refactoring existing pages:

1. Replace custom page containers with `PageContainer`
2. Replace custom headers with `PageHeader`
3. Replace custom search forms with `SearchCard` and `FormField`
4. Replace custom tables with `DataTable`
5. Replace custom cards with `ContentCard` or `InfoCard`
6. Replace custom badges with `StatusBadge`
7. Replace custom modals with `BaseModal` or `ConfirmModal`
8. Replace custom buttons with `ActionButton`
9. Replace custom loading states with `LoadingState`
10. Replace custom empty states with `EmptyState`

## Future Enhancements

- Add sorting support to DataTable
- Add filtering support to DataTable
- Add export functionality to DataTable
- Add more form field types (date range, multi-select, etc.)
- Add toast notification component
- Add wizard component for multi-step forms
- Add chart components for data visualization
