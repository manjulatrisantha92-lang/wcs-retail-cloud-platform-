# WCS Retail Cloud Platform — AI Agent Development & System Maintenance Guidelines

This document serves as the persistent architectural reference and instructions for AI coding agents and human developers maintaining, modifying, and updating the **WCS Retail Cloud Platform**.

---

## 1. System Architecture Overview

The application is a high-performance, multi-tenant enterprise retail operating system and Point of Sale (POS) suite designed for Sri Lankan and regional retail stores (Groceries, Supermarkets, Pharmacies, Hardware, Automobile Workshops, Electronics & Mobile Retail, and Apparel).

### Core Stack
- **Framework**: React 18+ with Vite & TypeScript
- **Styling**: Tailwind CSS (with clean dark/light mode separation: dark slate for Super Admin, light crisp theme for Shop Managers & POS)
- **Icons**: `lucide-react` (All icons MUST come from `lucide-react`)
- **State Management**: React Context API (`src/context/RetailContext.tsx`) with localStorage persistence and mock database bootstrapping
- **Internationalization**: Trilingual support (English, Sinhala, Tamil) in `src/i18n/translations.ts`

---

## 2. Directory Structure & Key Files

```
├── /metadata.json                  # Application metadata & capabilities
├── /AGENTS.md                      # Persistent AI agent instructions & architecture guide
├── /src/
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces, enums, data contracts
│   ├── data/
│   │   └── mockDatabase.ts         # Initial multi-tenant mock data and seed records
│   ├── i18n/
│   │   └── translations.ts         # Trilingual translation dictionaries (EN, SI, TA)
│   ├── context/
│   │   └── RetailContext.tsx       # Core multi-tenant state store, actions, local persistence
│   ├── components/
│   │   ├── common/                 # Reusable buttons, badges, modals, print helpers
│   │   ├── pos/                    # POS Terminal, quick cash bill, barcode billing, discounts
│   │   ├── shop/                   # Tenant shop modules:
│   │   │   ├── ShopDashboard.tsx       # Live KPI analytics & business overview
│   │   │   ├── ProductManager.tsx      # Inventory, pricing, reorder levels, custom fields
│   │   │   ├── SalesManager.tsx        # Sales orders, invoices, returns, receipts
│   │   │   ├── StockAdjustmentManager.tsx # Stock gap, physical audit, shrinkage reconciliation
│   │   │   ├── ExpiryBatchManager.tsx  # Batch tracking, shelf-life expiry alerts
│   │   │   ├── CustomerCreditManager.tsx # Customer credit ledger (Udalu) & settlements
│   │   │   ├── SupplierPurchasesManager.tsx # Purchase orders, GRN, supplier balances
│   │   │   ├── StaffSalariesManager.tsx # Staff payroll, OT, EPF/ETF, payslips
│   │   │   ├── FinanceExpensesManager.tsx # Expense tracking, cash book, payouts
│   │   │   ├── PromotionsManager.tsx   # Bulk discounts, BOGO, promo campaigns
│   │   │   ├── RepairJobsManager.tsx   # Device repair tickets, job status, technician notes
│   │   │   ├── VehicleServiceManager.tsx # Automobile workshop job cards, vehicle service logs
│   │   │   ├── BarcodeLabelStudio.tsx  # Barcode generator & shelf label printer
│   │   │   ├── CustomFieldsStudio.tsx  # Dynamic custom field attributes manager
│   │   │   ├── CategoryManager.tsx     # Inventory classification & tax categories
│   │   │   ├── UserManager.tsx         # Tenant staff user roles & access control
│   │   │   └── ShopSettingsStudio.tsx  # Shop profile, currency, receipt printer headers
│   │   └── superadmin/             # Super Admin control headquarters:
│   │       ├── SuperAdminDashboard.tsx # Multi-tenant overview, license monitor, kill-switch
│   │       ├── CreateShopModal.tsx     # Provision new customer shops
│   │       ├── LicenseControlModal.tsx # Renew, suspend, expire, or unlock licenses
│   │       ├── ModuleConfigModal.tsx   # Enable/disable features per tenant package
│   │       ├── RiskAlertsCenter.tsx    # Remote broadcast alerts to all POS screens
│   │       └── SystemUpdatesStudio.tsx # System updates, schema migrations, developer tools
│   ├── App.tsx                     # Main layout, tab navigation routing, tenant switcher
│   ├── main.tsx                    # React application entry point
│   └── index.css                   # Global Tailwind CSS entry
```

---

## 3. Multi-Tenant Isolation Pattern

Every entity in the database schema contains a mandatory `tenant_id` string (e.g. `'SHOP001'`, `'SHOP002'`, etc.).

### Context Data Filtering Rule
When reading or mutating state in `RetailContext.tsx`:
1. Master states hold arrays for all tenants.
2. Tenant-scoped derived states filter items by `currentTenantId`:
   ```ts
   const tenantProducts = useMemo(() => 
     products.filter(p => p.tenant_id === currentTenantId), 
     [products, currentTenantId]
   );
   ```
3. Super Admin operations (`allTenants`, `allLicenses`, `setLicenseStatus`, `broadcastRiskAlert`) operate across all tenants.

---

## 4. Checklist for Adding New Features or Modules

Follow this step-by-step procedure whenever modifying the codebase to add a new system capability:

1. **Define TypeScript Types (`/src/types/index.ts`)**:
   - Create interface with mandatory `id`, `tenant_id`, and `created_at`.
   - Export all types and relevant union/enum types.

2. **Add Initial Mock Data (`/src/data/mockDatabase.ts`)**:
   - Create and export `INITIAL_<ENTITY_NAME>` with realistic sample data for demo tenants (`SHOP001`, `SHOP002`, etc.).

3. **Wire into Retail Context (`/src/context/RetailContext.tsx`)**:
   - Add state variable with `localStorage` fallback.
   - Add `useEffect` sync hook with `STORAGE_KEY_PREFIX`.
   - Add CRUD action functions (`addEntity`, `updateEntity`, `deleteEntity`).
   - Create filtered derived state `tenant<Entities>`.
   - Expose in `RetailContextType` interface and context provider `value`.

4. **Create UI Component (`/src/components/shop/` or `/src/components/superadmin/`)**:
   - Use `useRetail()` to access data and actions.
   - Ensure responsive design (`sm:`, `md:`, `lg:`).
   - Ensure accessible color contrast and clean interactive feedback.
   - Use `lucide-react` for all icons.

5. **Register Navigation Tab (`/src/App.tsx`)**:
   - Add tab item in the `TABS` array with an appropriate Lucide icon.
   - Add conditional render block in the tab switcher container.

6. **Add Internationalization (`/src/i18n/translations.ts`)**:
   - Add keys across English (`en`), Sinhala (`si`), and Tamil (`ta`).

7. **Validation & Verification**:
   - Run `lint_applet` to check for syntax and type errors.
   - Run `compile_applet` to confirm the production build succeeds.

---

## 5. Coding Principles & Quality Rules

- **Zero-Breaking-Change Rule**: Never remove existing props, context fields, or data structures that other components rely upon. Add new fields as optional (`?`) when updating schemas.
- **Strict Typing**: No `any` types where avoidable. Define exact interfaces for payloads and action signatures.
- **Direct Action Over Talk**: Implement clean, robust, working code with complete event handlers. Never leave unhandled stubs or placeholder buttons.
