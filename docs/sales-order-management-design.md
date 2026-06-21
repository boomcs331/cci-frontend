# CCI Sales Order Management System - Design Specification

## Design System

### Color Palette

#### Status Colors
- **Blue (Normal/Processing)**: `#3B82F6` (Tailwind blue-500)
- **Green (Success/Completed)**: `#10B981` (Tailwind emerald-500)
- **Orange (Pending/Waiting)**: `#F59E0B` (Tailwind amber-500)
- **Red (Error/Critical)**: `#EF4444` (Tailwind red-500)
- **Gray (Neutral)**: `#6B7280` (Tailwind gray-500)

#### Dark Mode Variants
- Blue: `#60A5FA` (blue-400)
- Green: `#34D399` (emerald-400)
- Orange: `#FBBF24` (amber-400)
- Red: `#F87171` (red-400)
- Gray: `#9CA3AF` (gray-400)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: Bold, 600-700 weight
- **Body**: Regular, 400-500 weight
- **Monospace**: For codes, QR, barcodes (JetBrains Mono, monospace)

### Button Sizes (Large for Factory Use)
- **Extra Large**: `h-16 px-8 text-lg` (Primary actions)
- **Large**: `h-14 px-6 text-base` (Secondary actions)
- **Medium**: `h-12 px-5 text-sm` (Tertiary actions)
- **Small**: `h-10 px-4 text-xs` (Compact actions)

### Component Library

#### Status Badge
```tsx
interface StatusBadgeProps {
  status: 'upload' | 'generated' | 'printed' | 'kanban' | 'picking' | 'shipping' | 'completed' | 'error';
  size?: 'sm' | 'md' | 'lg';
}
```

#### Progress Timeline
```tsx
interface TimelineStep {
  step: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  actor?: string;
  timestamp?: string;
  icon?: ReactNode;
}
```

#### Lot Card
```tsx
interface LotCardProps {
  lotNumber: number;
  quantity: number;
  status: 'ready' | 'printed' | 'picking' | 'shipped';
  kanbanNumber?: string;
  qrCode?: string;
  onPrint?: () => void;
}
```

---

## Screen 1: Sales Dashboard

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Sales Order Management  [Refresh] [Export]        │
├─────────────────────────────────────────────────────────────┤
│  Summary Cards (6 cards, 2 rows of 3)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │Total     │ │Waiting   │ │Waiting   │                    │
│  │Orders    │ │Print     │ │Picking   │                    │
│  │  1,234   │ │   45     │ │   78     │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │Ready to  │ │Completed │ │Stock     │                    │
│  │Ship      │ │   890    │ │Pending   │                    │
│  │   156    │ │          │ │   23     │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
├─────────────────────────────────────────────────────────────┤
│  Search & Filter Bar                                        │
│  [Search: Order/Customer/Kanban/Product/QR]                │
│  [Date Range] [Status] [Location] [Line] [Round] [Apply]   │
├─────────────────────────────────────────────────────────────┤
│  Recent Orders Table (Sticky Header)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Order Code │ Customer │ Product │ Qty │ Status │... │  │
│  └──────────────────────────────────────────────────────┘  │
│  [Pagination]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Summary Card Component
```tsx
<SummaryCard
  title="Total Orders"
  value="1,234"
  icon={<PackageIcon />}
  color="blue"
  trend="+12% from last week"
  link="/sales/orders"
/>
```

### Search Component
```tsx
<SearchBar
  placeholder="Search Order Code, Customer, Kanban, Product, QR..."
  filters={[
    { key: 'dateRange', label: 'Date Range', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'location', label: 'Location', type: 'select' },
    { key: 'line', label: 'Production Line', type: 'select' },
    { key: 'round', label: 'Round', type: 'select' }
  ]}
  onSearch={handleSearch}
  onFilter={handleFilter}
/>
```

---

## Screen 2: Upload Order

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Upload Order  [Back to Dashboard]                  │
├─────────────────────────────────────────────────────────────┤
│  Upload Area (Drag & Drop)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │        [Drag & Drop Excel/CSV File Here]            │  │
│  │              or                                      │  │
│  │        [Browse Files]                               │  │
│  │                                                      │  │
│  │  Supported: .xlsx, .xls, .csv (Max 10MB)             │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Preview Table (After Upload)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Customer │ Product │ Qty │ Location │ Line │ Round   │  │
│  │ ✓ ABC    │ ✓ Prod A │ 74  │ ✓ A01    │ ✓ L02│ ✓ R01  │  │
│  │ ✗ XYZ    │ ✗ Prod B │ 0   │ ✗ Invalid│ -    │ -      │  │
│  └──────────────────────────────────────────────────────┘  │
│  Validation Summary:                                        │
│  ✓ Valid: 45 rows                                          │
│  ✗ Invalid: 3 rows (highlighted in red)                    │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                     │
│  [Cancel] [Import Valid Only] [Import All]                  │
└─────────────────────────────────────────────────────────────┘
```

### Upload Component
```tsx
<FileUpload
  accept=".xlsx,.xls,.csv"
  maxSize={10 * 1024 * 1024} // 10MB
  onUpload={handleFileUpload}
  onError={handleUploadError}
>
  <UploadArea>
    <UploadIcon size={48} />
    <p>Drag & Drop Excel/CSV File Here</p>
    <p>or</p>
    <Button variant="outline">Browse Files</Button>
    <p className="text-sm text-gray-500">
      Supported: .xlsx, .xls, .csv (Max 10MB)
    </p>
  </UploadArea>
</FileUpload>
```

### Preview Table with Validation
```tsx
<PreviewTable
  data={previewData}
  validation={validationResults}
  columns={[
    { key: 'customer', label: 'Customer', required: true },
    { key: 'product', label: 'Product', required: true },
    { key: 'quantity', label: 'Qty', required: true, type: 'number' },
    { key: 'location', label: 'Location', required: true },
    { key: 'line', label: 'Production Line', required: true },
    { key: 'round', label: 'Round', required: true }
  ]}
  onEdit={handleEditRow}
/>
```

---

## Screen 3: Order List

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Order List  [Upload Order] [Export] [Refresh]      │
├─────────────────────────────────────────────────────────────┤
│  Search & Filter Bar                                        │
│  [Search...] [Date] [Status] [Location] [Line] [Round]      │
├─────────────────────────────────────────────────────────────┤
│  Order Table (Sticky Header, Sticky Actions)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │Order   │Customer│Product │Qty │Rem │Status │Picking │ │
│  │Code    │        │        │    │Qty │       │Status  │ │
│  ├────────┼────────┼────────┼────┼────┼───────┼────────┤  │
│  │OR26F...│ABC Co  │Prod A  │74  │20  │🟡Pick │🟡In Prog│  │
│  │[View]  │        │        │    │    │       │        │  │
│  │[Print] │        │        │    │    │        │        │  │
│  │[Kanban]│        │        │    │    │        │        │  │
│  │[Split] │        │        │    │    │        │        │  │
│  │[Ship]  │        │        │    │    │        │        │  │
│  └────────┴────────┴────────┴────┴────┴───────┴────────┘  │
│  [Pagination: Previous 1 2 3 ... 10 Next]                   │
└─────────────────────────────────────────────────────────────┘
```

### Order Table Component
```tsx
<OrderTable
  columns={[
    { key: 'orderCode', label: 'Order Code', width: 150, fixed: true },
    { key: 'customer', label: 'Customer', width: 120 },
    { key: 'product', label: 'Product', width: 150 },
    { key: 'quantity', label: 'Qty', width: 80, align: 'right' },
    { key: 'remainingQty', label: 'Remaining', width: 80, align: 'right' },
    { key: 'status', label: 'Status', width: 100, render: StatusBadge },
    { key: 'pickingStatus', label: 'Picking', width: 100, render: StatusBadge },
    { key: 'shippingStatus', label: 'Shipping', width: 100, render: StatusBadge },
    { key: 'createdDate', label: 'Created', width: 120 },
    { key: 'updatedDate', label: 'Updated', width: 120 },
    { key: 'actions', label: 'Actions', width: 200, fixed: true, sticky: true }
  ]}
  data={orders}
  actions={[
    { label: 'View', icon: <EyeIcon />, onClick: handleView },
    { label: 'Print Order', icon: <PrintIcon />, onClick: handlePrintOrder },
    { label: 'Print Kanban', icon: <TagIcon />, onClick: handlePrintKanban },
    { label: 'Split Lot', icon: <SplitIcon />, onClick: handleSplit },
    { label: 'Shipping', icon: <TruckIcon />, onClick: handleShipping }
  ]}
  pagination={{ current: 1, pageSize: 20, total: 1234 }}
  onSort={handleSort}
  onFilter={handleFilter}
/>
```

---

## Screen 4: Order Detail

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Order Detail - OR26F06-R01-L02-A01  [Back]       │
├─────────────────────────────────────────────────────────────┤
│  Order Information Section                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Customer: ABC Co.    Product: Product A              │  │
│  │ Location: A01         Line: L02                       │  │
│  │ Round: R01            Total Qty: 74                   │  │
│  │ Created: 2026-06-20 09:30                            │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Timeline Progress (Horizontal)                            │
│  [Upload ✓] → [Generate ✓] → [Print ✓] → [Kanban ✓]       │
│  → [Picking 🟡] → [Shipping ⚪] → [Stock ⚪]                │
├─────────────────────────────────────────────────────────────┤
│  Kanban Summary                                              │
│  Total Lots: 4  |  Printed: 4  |  Picking: 2  |  Shipped: 0│
├─────────────────────────────────────────────────────────────┤
│  Lot Cards (Grid Layout)                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Lot 1     │ │Lot 2     │ │Lot 3     │ │Lot 4     │    │
│  │Qty: 20   │ │Qty: 20   │ │Qty: 20   │ │Qty: 14   │    │
│  │Status:   │ │Status:   │ │Status:   │ │Status:   │    │
│  │🟢 Picking│ │🟢 Picking│ │🟡 Ready  │ │🟡 Ready  │    │
│  │KB260...  │ │KB260...  │ │KB260...  │ │KB260...  │    │
│  │[Print]   │ │[Print]   │ │[Print]   │ │[Print]   │    │
│  │[QR]      │ │[QR]      │ │[QR]      │ │[QR]      │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Timeline History (Vertical)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ Upload Order    - John Doe  - 09:30:15             │  │
│  │ ✓ Generate Code    - System    - 09:30:16             │  │
│  │ ✓ Print Order     - Jane Smith - 09:31:00             │  │
│  │ ✓ Print Kanban     - Jane Smith - 09:32:00             │  │
│  │ 🟡 Start Picking   - John Doe  - 10:15:00             │  │
│  │ ⚪ Shipping        - Pending                          │  │
│  │ ⚪ Stock Deduction - Pending                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Timeline Component
```tsx
<Timeline
  steps={[
    { step: 'upload', label: 'Upload Order', status: 'completed', actor: 'John Doe', timestamp: '09:30:15', icon: <UploadIcon /> },
    { step: 'generate', label: 'Generate Code', status: 'completed', actor: 'System', timestamp: '09:30:16', icon: <CodeIcon /> },
    { step: 'print', label: 'Print Order', status: 'completed', actor: 'Jane Smith', timestamp: '09:31:00', icon: <PrintIcon /> },
    { step: 'kanban', label: 'Print Kanban', status: 'completed', actor: 'Jane Smith', timestamp: '09:32:00', icon: <TagIcon /> },
    { step: 'picking', label: 'Picking', status: 'in-progress', actor: 'John Doe', timestamp: '10:15:00', icon: <BoxIcon /> },
    { step: 'shipping', label: 'Shipping', status: 'pending', icon: <TruckIcon /> },
    { step: 'stock', label: 'Stock Deduction', status: 'pending', icon: <WarehouseIcon /> }
  ]}
  orientation="horizontal"
/>
```

### Lot Card Component
```tsx
<LotCard
  lotNumber={1}
  quantity={20}
  status="picking"
  kanbanNumber="KB260600001"
  qrCode="https://api.qrserver.com/v1/create-qr-code/?data=..."
  onPrint={() => handlePrintLot(1)}
  onShowQR={() => handleShowQR(1)}
/>
```

---

## Screen 5: Split Lot

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Split Lot - OR26F06-R01-L02-A01  [Cancel]         │
├─────────────────────────────────────────────────────────────┤
│  Order Information                                          │
│  Product: Product A  |  Total Qty: 74  |  Standard Lot: 20  │
├─────────────────────────────────────────────────────────────┤
│  Split Configuration                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Standard Lot Size: [20]  [Auto Split] [Manual]       │  │
│  │                                                      │  │
│  │ Suggested Split:                                      │  │
│  │  Lot 1: 20  ✓  Lot 2: 20  ✓  Lot 3: 20  ✓  Lot 4: 14 ✓│  │
│  │                                                      │  │
│  │ Manual Split:                                         │  │
│  │  Lot 1: [20]  Lot 2: [20]  Lot 3: [20]  Lot 4: [14]  │  │
│  │  [+ Add Lot]                                          │  │
│  │                                                      │  │
│  │ Total: 74  ✓ (Matches Order Qty)                      │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  QR Code Preview                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  [QR 1]  │ │  [QR 2]  │ │  [QR 3]  │ │  [QR 4]  │    │
│  │  KB260...│ │  KB260...│ │  KB260...│ │  KB260...│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                     │
│  [Cancel] [Preview] [Confirm Split & Generate QR]           │
└─────────────────────────────────────────────────────────────┘
```

### Split Lot Component
```tsx
<SplitLotForm
  orderCode="OR26F06-R01-L02-A01"
  totalQuantity={74}
  standardLotSize={20}
  mode="auto" // or "manual"
  lots={[
    { lotNumber: 1, quantity: 20, kanbanNumber: 'KB260600001' },
    { lotNumber: 2, quantity: 20, kanbanNumber: 'KB260600002' },
    { lotNumber: 3, quantity: 20, kanbanNumber: 'KB260600003' },
    { lotNumber: 4, quantity: 14, kanbanNumber: 'KB260600004' }
  ]}
  onLotChange={handleLotChange}
  onAddLot={handleAddLot}
  onRemoveLot={handleRemoveLot}
  onConfirm={handleConfirmSplit}
/>
```

---

## Screen 6: Print Order & Print Kanban

### Print Order Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Print Order Confirmation                                   │
├─────────────────────────────────────────────────────────────┤
│  Order: OR26F06-R01-L02-A01                                 │
│  Customer: ABC Co.                                          │
│  Product: Product A                                          │
│  Total Qty: 74                                               │
│                                                              │
│  Printer: [Select Printer ▼]                                │
│  Copies: [1]                                                │
│                                                              │
│  Preview:                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SALES ORDER                             │  │
│  │                                                      │  │
│  │  Order Code: OR26F06-R01-L02-A01                    │  │
│  │  Customer: ABC Co.                                  │  │
│  │  Date: 2026-06-20                                    │  │
│  │                                                      │  │
│  │  Product    Qty    Location    Line    Round        │  │
│  │  Product A  74      A01         L02     R01          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Cancel] [Print]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Print Kanban Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Print Kanban Tags                                           │
├─────────────────────────────────────────────────────────────┤
│  Order: OR26F06-R01-L02-A01                                 │
│  Total Lots: 4                                              │
│                                                              │
│  Select Lots to Print:                                       │
│  ☑ Lot 1 (Qty: 20)  KB260600001                            │
│  ☑ Lot 2 (Qty: 20)  KB260600002                            │
│  ☑ Lot 3 (Qty: 20)  KB260600003                            │
│  ☑ Lot 4 (Qty: 14)  KB260600004                            │
│                                                              │
│  Printer: [Select Printer ▼]                                │
│  Copies per Lot: [1]                                         │
│                                                              │
│  Reprint Reason (if reprinting):                             │
│  [Damaged ▼] [Lost ▼] [Other ▼]                             │
│  [Reason: __________________]                               │
│                                                              │
│  Preview:                                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │[QR 1]│ │[QR 2]│ │[QR 3]│ │[QR 4]│                       │
│  │KB260 │ │KB260 │ │KB260 │ │KB260 │                       │
│  │00001 │ │00002 │ │00003 │ │00004 │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                              │
│  [Cancel] [Print] [Log Reprint]                              │
└─────────────────────────────────────────────────────────────┘
```

### Print Modal Component
```tsx
<PrintModal
  type="kanban" // or "order"
  order={orderData}
  lots={lotData}
  printerOptions={printers}
  onPrint={handlePrint}
  onReprint={handleReprint}
  reprintReasons={['Damaged', 'Lost', 'Printer Error', 'Other']}
/>
```

---

## Screen 7: Picking Screen

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Picking - OR26F06-R01-L02-A01  [Back]             │
├─────────────────────────────────────────────────────────────┤
│  Scanner Input (Large, Auto-focus)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Scan QR/Barcode: [_________________________]     │  │
│  │    or type Kanban Number manually                   │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Current Picking Status                                      │
│  Progress: 2/4 Lots (50%)                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Lot List                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ☑ Lot 1  Qty: 20  KB260600001  ✓ Picked              │  │
│  │ ☑ Lot 2  Qty: 20  KB260600002  ✓ Picked              │  │
│  │ ⬜ Lot 3  Qty: 20  KB260600003  ⏳ Ready              │  │
│  │ ⬜ Lot 4  Qty: 14  KB260600004  ⏳ Ready              │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Current Lot Details (Scanned)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Lot 3 - KB260600003                                   │  │
│  │ Product: Product A  Qty: 20                          │  │
│  │ Location: A01  Line: L02  Round: R01                  │  │
│  │                                                      │  │
│  │ [Confirm Pick] [Skip] [Error Report]                  │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                     │
│  [Start Picking] [Pause] [Complete Picking] [Cancel]        │
└─────────────────────────────────────────────────────────────┘
```

### Picking Component
```tsx
<PickingScreen
  orderCode="OR26F06-R01-L02-A01"
  lots={lotData}
  currentLot={3}
  onScan={handleScan}
  onConfirmPick={handleConfirmPick}
  onSkip={handleSkip}
  onErrorReport={handleErrorReport}
  onStart={handleStartPicking}
  onPause={handlePause}
  onComplete={handleComplete}
/>
```

---

## Screen 8: Shipping Screen

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Shipping - OR26F06-R01-L02-A01  [Back]            │
├─────────────────────────────────────────────────────────────┤
│  Scanner Input (Large, Auto-focus)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Scan ERP/Shipping Code: [_____________________]   │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Order Summary                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Order: OR26F06-R01-L02-A01                           │  │
│  │ Customer: ABC Co.                                    │  │
│  │ Total Qty: 74  Shipped: 74  Remaining: 0             │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Shipping Status                                             │
│  Status: 🟡 Ready to Ship                                   │
│  All lots picked and ready for shipping                     │
├─────────────────────────────────────────────────────────────┤
│  Lot Shipping Status                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ Lot 1  Qty: 20  KB260600001  🟢 Shipped           │  │
│  │ ✓ Lot 2  Qty: 20  KB260600002  🟢 Shipped           │  │
│  │ ⬜ Lot 3  Qty: 20  KB260600003  🟡 Ready             │  │
│  │ ⬜ Lot 4  Qty: 14  KB260600004  🟡 Ready             │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Stock Deduction Preview                                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Product A  Current Stock: 1,000  Deduct: 74  New: 926 │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                     │
│  [Confirm Shipping & Deduct Stock] [Cancel]                 │
└─────────────────────────────────────────────────────────────┘
```

### Shipping Component
```tsx
<ShippingScreen
  orderCode="OR26F06-R01-L02-A01"
  lots={lotData}
  stockInfo={stockData}
  onScan={handleScan}
  onConfirmShipping={handleConfirmShipping}
  onCancel={handleCancel}
/>
```

---

## Screen 9: Kanban Log

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Kanban Log  [Export Excel] [Refresh]               │
├─────────────────────────────────────────────────────────────┤
│  Search & Filter                                             │
│  [Search Kanban/Order...] [Date Range] [User] [Status]      │
├─────────────────────────────────────────────────────────────┤
│  Log Table                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │Kanban   │Order   │Lot │Print By│Print Time│Reprint │ │
│  │Number   │Code    │   │        │         │Count   │ │
│  ├─────────┼────────┼────┼────────┼─────────┼────────┤  │
│  │KB260... │OR26... │1   │Jane    │09:32:00 │0       │  │
│  │KB260... │OR26... │2   │Jane    │09:32:01 │0       │  │
│  │KB260... │OR26... │3   │John    │10:00:00 │1       │  │
│  └─────────┴────────┴────┴────────┴─────────┴────────┘  │
│  [Pagination]                                               │
└─────────────────────────────────────────────────────────────┘
```

### Log Table Component
```tsx
<LogTable
  type="kanban"
  columns={[
    { key: 'kanbanNumber', label: 'Kanban Number' },
    { key: 'orderCode', label: 'Order Code' },
    { key: 'lotNumber', label: 'Lot' },
    { key: 'printedBy', label: 'Print By' },
    { key: 'printTime', label: 'Print Time' },
    { key: 'reprintCount', label: 'Reprint Count' },
    { key: 'lastReprintReason', label: 'Last Reprint Reason' },
    { key: 'printer', label: 'Printer' }
  ]}
  data={kanbanLogs}
  filters={[
    { key: 'dateRange', label: 'Date Range', type: 'date' },
    { key: 'user', label: 'User', type: 'select' },
    { key: 'status', label: 'Status', type: 'select' }
  ]}
  onExport={handleExport}
/>
```

---

## Screen 10: Stock Movement Log

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Stock Movement Log  [Export Excel] [Refresh]       │
├─────────────────────────────────────────────────────────────┤
│  Search & Filter                                             │
│  [Search...] [Date Range] [Product] [Type] [User]           │
├─────────────────────────────────────────────────────────────┤
│  Log Table                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │Date     │Product │Type │Qty │Before │After │User   │ │
│  ├─────────┼────────┼─────┼────┼───────┼──────┼───────┤  │
│  │06-20    │Prod A  │Deduct│74  │1,000  │926   │John  │  │
│  │06-20    │Prod B  │Add  │100 │500    │600   │Jane  │  │
│  └─────────┴────────┴─────┴────┴───────┴──────┴───────┘  │
│  [Pagination]                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Screen 11: Timeline History

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Timeline History - OR26F06-R01-L02-A01  [Back]    │
├─────────────────────────────────────────────────────────────┤
│  Vertical Timeline                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ● Upload Order                                        │  │
│  │   Actor: John Doe                                     │  │
│  │   Time: 2026-06-20 09:30:15                           │  │
│  │   Status: Completed ✓                                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ● Generate Order Code                                 │  │
│  │   Actor: System                                       │  │
│  │   Time: 2026-06-20 09:30:16                           │  │
│  │   Status: Completed ✓                                 │  │
│  │   Details: OR26F06-R01-L02-A01                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ● Print Sales Order                                   │  │
│  │   Actor: Jane Smith                                   │  │
│  │   Time: 2026-06-20 09:31:00                           │  │
│  │   Status: Completed ✓                                 │  │
│  │   Printer: HP LaserJet Pro M404n                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ● Print Kanban Tags                                   │  │
│  │   Actor: Jane Smith                                   │  │
│  │   Time: 2026-06-20 09:32:00                           │  │
│  │   Status: Completed ✓                                 │  │
│  │   Lots: 4 (KB260600001-004)                           │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ● Start Picking                                       │  │
│  │   Actor: John Doe                                     │  │
│  │   Time: 2026-06-20 10:15:00                           │  │
│  │   Status: In Progress 🟡                              │  │
│  │   Progress: 2/4 lots (50%)                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⚪ Shipping                                           │  │
│  │   Status: Pending                                     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⚪ Stock Deduction                                    │  │
│  │   Status: Pending                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Timeline Component
```tsx
<TimelineHistory
  orderCode="OR26F06-R01-L02-A01"
  events={[
    {
      id: 1,
      type: 'upload',
      label: 'Upload Order',
      actor: 'John Doe',
      timestamp: '2026-06-20 09:30:15',
      status: 'completed',
      icon: <UploadIcon />
    },
    {
      id: 2,
      type: 'generate',
      label: 'Generate Order Code',
      actor: 'System',
      timestamp: '2026-06-20 09:30:16',
      status: 'completed',
      details: 'OR26F06-R01-L02-A01',
      icon: <CodeIcon />
    },
    // ... more events
  ]}
/>
```

---

## Screen 12: Report Dashboard

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Report Dashboard  [Export All] [Refresh]          │
├─────────────────────────────────────────────────────────────┤
│  Date Range Picker                                          │
│  [From: 2026-06-01] [To: 2026-06-30] [Apply]               │
├─────────────────────────────────────────────────────────────┤
│  Summary Charts (2x2 Grid)                                  │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │ Orders by Status │ │ Orders by Line   │                │
│  │ [Pie Chart]      │ │ [Bar Chart]      │                │
│  └──────────────────┘ └──────────────────┘                │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │ Picking Performance│ │ Shipping Time    │                │
│  │ [Line Chart]     │ │ [Bar Chart]      │                │
│  └──────────────────┘ └──────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  Detailed Reports Table                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │Metric          │Today │This Week│This Month│Total   │ │
│  ├────────────────┼──────┼──────────┼──────────┼────────┤  │
│  │Total Orders    │45    │312       │1,234     │5,678   │  │
│  │Printed         │40    │280       │1,100     │5,500   │  │
│  │Picking In Prog │12    │45        │78        │156     │  │
│  │Shipped         │38    │265       │890       │5,200   │  │
│  │Stock Deducted  │38    │265       │890       │5,200   │  │
│  └────────────────┴──────┴──────────┴──────────┴────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Quick Export                                                │
│  [Export Orders] [Export Kanban Logs] [Export Stock Movements]│
└─────────────────────────────────────────────────────────────┘
```

---

## Screen 13: Report Dashboard (Continued)

### Performance Metrics
```
┌─────────────────────────────────────────────────────────────┐
│  Performance Metrics                                         │
├─────────────────────────────────────────────────────────────┤
│  Average Picking Time: 15 min/order                          │
│  Average Shipping Time: 5 min/order                          │
│  Picking Accuracy: 99.5%                                     │
│  Shipping Accuracy: 99.8%                                    │
│  Reprint Rate: 2.3%                                          │
├─────────────────────────────────────────────────────────────┤
│  Top Performers                                               │
│  🥇 Jane Smith - 156 orders shipped                          │
│  🥈 John Doe - 145 orders shipped                           │
│  🥉 Mike Johnson - 132 orders shipped                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Components

### Modal/Dialog
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
  size="md" // sm, md, lg, xl
>
  <ModalContent>
    <p>Are you sure you want to proceed?</p>
  </ModalContent>
  <ModalFooter>
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

### Toast Notification
```tsx
<Toast
  type="success" // success, warning, error, info
  message="Order successfully created"
  duration={3000}
  onClose={handleClose}
/>
```

### Loading Skeleton
```tsx
<SkeletonLoader>
  <SkeletonCard />
  <SkeletonTable rows={5} />
</SkeletonLoader>
```

### Scanner Input
```tsx
<ScannerInput
  placeholder="Scan QR/Barcode..."
  autoFocus={true}
  onScan={handleScan}
  onError={handleScanError}
/>
```

---

## UX Patterns

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New order
- `Ctrl/Cmd + P`: Print
- `Ctrl/Cmd + R`: Refresh
- `Esc`: Close modal/dialog
- `Enter`: Confirm action
- `Tab`: Navigate between fields

### Barcode Scanner Support
- Auto-focus input fields
- Handle scanner input as keyboard events
- Support various scanner types (1D, 2D, QR)
- Debounce rapid scans
- Visual feedback on successful scan

### Responsive Design
- Desktop: Full features, multi-column layouts
- Tablet: Adjusted layouts, larger touch targets
- Mobile: Simplified views, stacked layouts

### Dark Mode
- Automatic system preference detection
- Manual toggle in settings
- Consistent color contrast ratios (WCAG AA)
- Smooth transitions between modes

---

## Implementation Notes

### File Structure
```
src/
├── app/
│   └── (admin)/
│       └── sales/
│           ├── page.tsx              # Dashboard
│           ├── upload/page.tsx        # Upload Order
│           ├── orders/page.tsx        # Order List
│           ├── orders/[id]/page.tsx  # Order Detail
│           ├── picking/page.tsx       # Picking Screen
│           ├── shipping/page.tsx      # Shipping Screen
│           ├── logs/
│           │   ├── kanban/page.tsx   # Kanban Log
│           │   ├── stock/page.tsx    # Stock Log
│           │   └── timeline/page.tsx # Timeline History
│           └── reports/page.tsx       # Report Dashboard
├── components/
│   └── sales/
│       ├── SummaryCard.tsx
│       ├── StatusBadge.tsx
│       ├── Timeline.tsx
│       ├── LotCard.tsx
│       ├── SplitLotForm.tsx
│       ├── PrintModal.tsx
│       ├── PickingScreen.tsx
│       ├── ShippingScreen.tsx
│       ├── LogTable.tsx
│       └── ScannerInput.tsx
└── types/
    └── sales/
        ├── order.ts
        ├── kanban.ts
        └── log.ts
```

### API Endpoints (Backend)
```
POST   /api/sales/orders/upload
GET    /api/sales/orders
GET    /api/sales/orders/:id
POST   /api/sales/orders/:id/split
POST   /api/sales/orders/:id/print
POST   /api/sales/orders/:id/kanban/print
POST   /api/sales/orders/:id/picking/start
POST   /api/sales/orders/:id/picking/confirm
POST   /api/sales/orders/:id/shipping
GET    /api/sales/logs/kanban
GET    /api/sales/logs/stock
GET    /api/sales/reports
```

---

## Status Definitions

### Order Status
- `upload`: Order uploaded, awaiting processing
- `generated`: Order code generated
- `printed`: Sales order printed
- `kanban`: Kanban tags printed
- `picking`: Picking in progress
- `shipping`: Shipping in progress
- `completed`: Order completed
- `error`: Error occurred

### Lot Status
- `ready`: Ready for picking
- `printed`: Kanban printed
- `picking`: Being picked
- `picked`: Picked, ready for shipping
- `shipped`: Shipped

### Picking Status
- `pending`: Not started
- `in-progress`: Currently picking
- `completed`: All lots picked

### Shipping Status
- `pending`: Not shipped
- `in-progress`: Shipping in progress
- `completed`: Shipped

---

## Icons (Lucide React)

- `Package`: Orders
- `Printer`: Print
- `Tag`: Kanban
- `Scissors`: Split
- `Truck`: Shipping
- `Box`: Picking
- `Warehouse`: Stock
- `Upload`: Upload
- `Download`: Export
- `Search`: Search
- `Filter`: Filter
- `Refresh`: Refresh
- `CheckCircle`: Success
- `AlertCircle`: Warning
- `XCircle`: Error
- `Clock`: Pending
- `User`: User
- `Calendar`: Date
- `Barcode`: Barcode/QR
- `FileText`: Document
- `Eye`: View
- `Edit`: Edit
- `Trash`: Delete

---

## Color Usage Guidelines

### Primary Actions
- Create, Save, Confirm: Green
- Print, Export: Blue
- Delete, Cancel: Red/Gray

### Status Indicators
- Success/Completed: Green
- In Progress/Processing: Blue
- Pending/Waiting: Orange
- Error/Critical: Red
- Neutral/Info: Gray

### Interactive Elements
- Hover: Darken by 10%
- Active: Darken by 20%
- Disabled: 50% opacity
- Focus: Blue ring (2px)

---

## Accessibility

- All interactive elements keyboard accessible
- ARIA labels for screen readers
- Focus indicators visible
- Color contrast ratio ≥ 4.5:1
- Alt text for images
- Semantic HTML structure
- Skip to main content link
- Error messages associated with form fields

---

## Performance Considerations

- Lazy load images and QR codes
- Virtual scrolling for large tables
- Debounce search inputs (300ms)
- Cache API responses
- Optimistic UI updates
- Progressive loading for large datasets
- Web Workers for heavy computations
- Service Worker for offline support

---

## Security

- Input validation on client and server
- XSS prevention
- CSRF protection
- Rate limiting on API endpoints
- Audit logging for sensitive actions
- Role-based access control
- Secure file upload validation
- Encrypted data transmission (HTTPS)

---

## Testing Strategy

- Unit tests for components
- Integration tests for workflows
- E2E tests for critical paths
- Accessibility testing
- Performance testing
- Cross-browser testing
- Mobile/tablet testing
- Scanner hardware testing

---

## Future Enhancements

- Mobile app for warehouse staff
- Voice commands for hands-free operation
- AR for warehouse navigation
- Real-time stock synchronization
- Predictive analytics for demand
- Integration with ERP systems
- Automated reorder points
- Multi-warehouse support
- Advanced reporting and BI
- API for third-party integrations
