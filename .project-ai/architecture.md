# Architecture — CCI Frontend

## High-Level Architecture

```mermaid
graph TD
    Browser["Browser (React 19)"]
    NextJS["Next.js 16 Server\n:3000"]
    Backend["NestJS Backend\n:3006"]
    DB["PostgreSQL"]
    MQ["RabbitMQ"]

    Browser -->|"HTTP /api/* /uploads/*"| NextJS
    NextJS -->|"Reverse Proxy (rewrites)"| Backend
    Backend --> DB
    Backend --> MQ
```

## Frontend Architecture

```mermaid
graph TD
    RootLayout["RootLayout\nThemeProvider + SidebarProvider + MswLoader"]
    AdminLayout["AdminLayout (admin)\nToastProvider + useSessionCheck"]
    FullWidthLayout["FullWidthLayout\nsingin, signup, select-department"]

    RootLayout --> AdminLayout
    RootLayout --> FullWidthLayout

    AdminLayout --> Pages["Pages\n/pc, /production, /sales, /users, /master-data"]
    Pages --> Components["Components\nshared/, pc/, production/, sales/"]
    Components --> Services["Services\nauthService, materialService, ..."]
    Services --> ApiUtils["Utils: apiFetch / apiFetchJson"]
    ApiUtils -->|"with auth headers"| Proxy["Next.js Proxy"]
```

### Context Provider Tree
```
RootLayout
  ThemeProvider          ← dark/light (localStorage)
    SidebarProvider      ← expanded/collapsed state
      MswLoader          ← MSW dev mocking
        AdminLayout
          ToastProvider  ← publishToast() global notifications
            AdminOverlayProvider  ← overlay counter
              PageTitleProvider   ← page title/description
                AdminLayoutContent
                  AppSidebar
                  AppHeader
                  {page children}
```

## Backend Architecture

NestJS monolith with domain modules:
- `auth/` — login, JWT, roles, permissions, departments, menus
- `masters/` — materials, suppliers, locations, products, customers, units, models
- `pc/` — receiving (inbound), outbound, lots, stock
- `production/` — production orders, lots, processes, steps, scanning
- `sales/` — orders, approvals, customers, export

## Database Architecture (Inferred from Types)

```mermaid
erDiagram
    users {
        string id PK
        string username
        string email
        string departmentId FK
    }
    roles {
        string id PK
        string code
        string name
        string scopeType
    }
    permissions {
        string id PK
        string code
        string module
    }
    departments {
        string id PK
        string code
        string name
    }
    user_roles {
        string userId FK
        string roleId FK
    }
    role_permissions {
        string roleId FK
        string permissionId FK
    }

    materials {
        int id PK
        string matCode
        int matTypeId FK
        int defaultLocationId FK
        int supplierId FK
        string unit
        int lotSize
        bool isActive
    }
    material_types {
        int id PK
        string name
    }
    locations {
        int id PK
        string name
        bool isActive
    }
    suppliers {
        int id PK
        string name
        string email
        string phone
    }
    receivings {
        int id PK
        string receivingNo
        int materialId FK
        int supplierId FK
        int totalQuantity
        string status
    }
    lots {
        int id PK
        string lotNo
        int receivingId FK
        string qrCode
        int quantity
        int remainingQuantity
        int locationId FK
        string status
    }

    production_orders {
        int id PK
        string orderNo
        int productId FK
        int orderQuantity
        int lotSize
        string status
    }
    production_lots {
        int id PK
        int orderId FK
        string lotNo
        string qrCode
        int quantity
        string status
    }
    production_processes {
        int id PK
        string processCode
        string processName
        int sequenceOrder
        bool isActive
    }
    products {
        int id PK
        string productCode
        string productName
        int customerId FK
    }
    customers {
        int id PK
        string code
        string name
    }
    sales_orders {
        string id PK
        string orderNo
        int customerId FK
        string status
        string orderDate
        string grandTotal
    }
    sales_order_items {
        string id PK
        string orderId FK
        int productId FK
        string quantity
        string unitPrice
    }

    users ||--o{ user_roles : has
    roles ||--o{ user_roles : has
    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : has
    users }o--|| departments : belongs_to
    materials }o--|| material_types : has
    materials }o--|| locations : stored_at
    materials }o--o| suppliers : from
    receivings }o--|| materials : for
    receivings }o--o| suppliers : from
    lots }o--|| receivings : part_of
    lots }o--|| locations : at
    production_orders }o--|| products : produces
    production_lots }o--|| production_orders : part_of
    products }o--o| customers : for
    sales_orders }o--|| customers : from
    sales_order_items }o--|| sales_orders : part_of
    sales_order_items }o--|| products : for
```

## Data Flow

### API Request Flow
```
Component
  → apiFetch(endpoint, options)
      → getApiUrl()           // NEXT_PUBLIC_API_BASE_URL + endpoint
      → applySessionAuthHeaders()  // x-user-id, x-username, x-department-id, Bearer
      → AbortController (20s timeout)
      → fetch(url)
          → Next.js Dev Server
              → rewrites: /api/* → http://127.0.0.1:3006/*
                  → NestJS Backend
  ← Response
      → 401: clearSession() + redirect /signin
      → 403: publishToast(forbidden)
      → ok: return Response / throw ApiError
```

### Authentication Flow
```mermaid
sequenceDiagram
    User->>+LoginPage: Enter credentials
    LoginPage->>+Backend: POST /auth/login
    Backend-->>-LoginPage: { token, user, permissions, menus }
    LoginPage->>Session: setSession(data) → localStorage
    Session->>LoginPage: needsDepartmentSelection()?
    alt Multi-department
        LoginPage->>SelectDept: redirect /select-department
        SelectDept->>Session: confirmActiveDepartment(id)
    end
    LoginPage->>Dashboard: redirect /
    Note over Dashboard: useSessionCheck polls every 10s
    Note over Dashboard: apiFetch auto-attaches headers
```
