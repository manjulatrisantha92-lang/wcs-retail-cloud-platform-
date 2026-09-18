import { UserRole } from './index';

export type PermissionCategory =
  | 'POS_BILLING'
  | 'INVENTORY_PRODUCTS'
  | 'CATEGORIES_FIELDS'
  | 'CUSTOMERS_UDALU'
  | 'SUPPLIERS_PURCHASES'
  | 'FINANCE_EXPENSES'
  | 'STAFF_PAYROLL'
  | 'EXCEL_IMPORT_EXPORT'
  | 'SETTINGS_SYSTEM';

export interface PermissionDefinition {
  key: string;
  category: PermissionCategory;
  name: string;
  description: string;
}

export interface RolePermissions {
  // 1. POS & Billing
  pos_access: boolean;
  pos_discount_override: boolean;
  pos_void_item: boolean;
  pos_change_unit_price: boolean;
  pos_credit_sales: boolean;
  pos_sales_return: boolean;
  pos_view_cash_totals: boolean;

  // 2. Inventory & Products
  inventory_view: boolean;
  inventory_add: boolean;
  inventory_edit: boolean;
  inventory_delete: boolean;
  inventory_view_cost: boolean;
  inventory_stock_adjust: boolean;
  inventory_expiry_batch: boolean;
  barcode_studio: boolean;

  // 3. Categories & Fields
  categories_manage: boolean;
  custom_fields_manage: boolean;

  // 4. Customers & Credit
  customers_view: boolean;
  customers_add_edit: boolean;
  customers_delete: boolean;
  customers_collect_payment: boolean;
  customers_credit_limit_override: boolean;

  // 5. Suppliers & Purchases
  suppliers_view: boolean;
  suppliers_add_edit: boolean;
  suppliers_purchase_orders: boolean;
  suppliers_receive_grn: boolean;
  suppliers_returns: boolean;
  suppliers_payments: boolean;

  // 6. Finance & Expenses
  expenses_view: boolean;
  expenses_add: boolean;
  expenses_delete: boolean;
  payouts_manage: boolean;
  cash_book_view: boolean;

  // 7. Staff & Payroll
  staff_view: boolean;
  staff_manage: boolean;
  payroll_manage: boolean;
  users_manage: boolean;

  // 8. Excel Import & Export
  excel_export: boolean;
  excel_import: boolean;
  reports_view: boolean;

  // 9. Settings & Access Control
  settings_manage: boolean;
  access_control_manage: boolean;
}

export type PermissionKey = keyof RolePermissions;

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // POS & Billing
  { key: 'pos_access', category: 'POS_BILLING', name: 'Access POS Screen', description: 'Can launch cash register and process sales bills' },
  { key: 'pos_discount_override', category: 'POS_BILLING', name: 'Apply Custom Discounts', description: 'Can apply bill or line item manual discounts' },
  { key: 'pos_void_item', category: 'POS_BILLING', name: 'Void / Remove Cart Items', description: 'Can remove already rung items or clear cart' },
  { key: 'pos_change_unit_price', category: 'POS_BILLING', name: 'Override Unit Selling Price', description: 'Can adjust selling prices dynamically on POS' },
  { key: 'pos_credit_sales', category: 'POS_BILLING', name: 'Issue Credit Bills', description: 'Can finalize sales with unpaid balance due' },
  { key: 'pos_sales_return', category: 'POS_BILLING', name: 'Process Sales Returns & Refunds', description: 'Can accept customer returns and issue refunds' },
  { key: 'pos_view_cash_totals', category: 'POS_BILLING', name: 'View Shift Cash Totals', description: 'Can view current register drawer totals and day-end summary' },

  // Inventory & Products
  { key: 'inventory_view', category: 'INVENTORY_PRODUCTS', name: 'View Product Inventory', description: 'Can see product lists, barcodes, and stock levels' },
  { key: 'inventory_add', category: 'INVENTORY_PRODUCTS', name: 'Add New Products', description: 'Can create new items in inventory' },
  { key: 'inventory_edit', category: 'INVENTORY_PRODUCTS', name: 'Edit Product Details', description: 'Can modify product names, prices, and barcodes' },
  { key: 'inventory_delete', category: 'INVENTORY_PRODUCTS', name: 'Delete Products', description: 'Can permanently remove products from catalog' },
  { key: 'inventory_view_cost', category: 'INVENTORY_PRODUCTS', name: 'View Cost & Profit Margins', description: 'Can view supplier purchase costs and margin %' },
  { key: 'inventory_stock_adjust', category: 'INVENTORY_PRODUCTS', name: 'Stock Gap & Physical Count Audit', description: 'Can record inventory shrinkage and adjust physical stock' },
  { key: 'inventory_expiry_batch', category: 'INVENTORY_PRODUCTS', name: 'Batch & Shelf Expiry Control', description: 'Can create and monitor expiring product batches' },
  { key: 'barcode_studio', category: 'INVENTORY_PRODUCTS', name: 'Barcode & Shelf Label Generator', description: 'Can generate and print barcode sticker labels' },

  // Categories & Fields
  { key: 'categories_manage', category: 'CATEGORIES_FIELDS', name: 'Manage Categories', description: 'Can add, edit, and delete product categories' },
  { key: 'custom_fields_manage', category: 'CATEGORIES_FIELDS', name: 'Dynamic Custom Fields', description: 'Can configure custom item attributes (IMEI, warranty, vehicle model)' },

  // Customers & Credit
  { key: 'customers_view', category: 'CUSTOMERS_UDALU', name: 'View Customer Ledger', description: 'Can browse customer contact info and credit history' },
  { key: 'customers_add_edit', category: 'CUSTOMERS_UDALU', name: 'Add / Edit Customers', description: 'Can register new customer profiles and credit limits' },
  { key: 'customers_delete', category: 'CUSTOMERS_UDALU', name: 'Delete Customer Records', description: 'Can remove customer accounts' },
  { key: 'customers_collect_payment', category: 'CUSTOMERS_UDALU', name: 'Collect Credit Settlements', description: 'Can accept customer credit balance payments' },
  { key: 'customers_credit_limit_override', category: 'CUSTOMERS_UDALU', name: 'Override Credit Limits', description: 'Can approve credit sales exceeding customer ceiling' },

  // Suppliers & Purchases
  { key: 'suppliers_view', category: 'SUPPLIERS_PURCHASES', name: 'View Supplier Directory', description: 'Can view supplier contacts and payable balances' },
  { key: 'suppliers_add_edit', category: 'SUPPLIERS_PURCHASES', name: 'Add / Edit Suppliers', description: 'Can register new vendor profiles' },
  { key: 'suppliers_purchase_orders', category: 'SUPPLIERS_PURCHASES', name: 'Create Purchase Orders (PO)', description: 'Can issue purchase orders to distributors' },
  { key: 'suppliers_receive_grn', category: 'SUPPLIERS_PURCHASES', name: 'Receive Stock & GRN', description: 'Can verify incoming goods and update stock' },
  { key: 'suppliers_returns', category: 'SUPPLIERS_PURCHASES', name: 'Supplier Debit Notes & Returns', description: 'Can return damaged/expired goods to suppliers' },
  { key: 'suppliers_payments', category: 'SUPPLIERS_PURCHASES', name: 'Record Supplier Payments', description: 'Can record vendor settlement disbursements' },

  // Finance & Expenses
  { key: 'expenses_view', category: 'FINANCE_EXPENSES', name: 'View Expenses & Cash Book', description: 'Can see shop expenditure logs and petty cash flows' },
  { key: 'expenses_add', category: 'FINANCE_EXPENSES', name: 'Record New Expenses', description: 'Can enter daily shop operating expenditures' },
  { key: 'expenses_delete', category: 'FINANCE_EXPENSES', name: 'Delete Expense Records', description: 'Can remove logged expenses' },
  { key: 'payouts_manage', category: 'FINANCE_EXPENSES', name: 'Drawer Cash Payouts & Drops', description: 'Can disburse petty cash from register or drop to safe' },
  { key: 'cash_book_view', category: 'FINANCE_EXPENSES', name: 'Access Cash Flow Reports', description: 'Can review financial cash book analysis' },

  // Staff & Payroll
  { key: 'staff_view', category: 'STAFF_PAYROLL', name: 'View Staff & Payroll', description: 'Can view employee directory and salary summaries' },
  { key: 'staff_manage', category: 'STAFF_PAYROLL', name: 'Manage Staff Profiles', description: 'Can hire, edit, or terminate employee profiles' },
  { key: 'payroll_manage', category: 'STAFF_PAYROLL', name: 'Process Salaries & OT Payslips', description: 'Can calculate EPF/ETF, salary advances, and payslips' },
  { key: 'users_manage', category: 'STAFF_PAYROLL', name: 'Manage User Logins & Passwords', description: 'Can create shop staff logins and reset passwords' },

  // Excel Import & Export
  { key: 'excel_export', category: 'EXCEL_IMPORT_EXPORT', name: 'Export to Excel (.xlsx)', description: 'Can download Categories, Products, Customers, Expenses to Excel' },
  { key: 'excel_import', category: 'EXCEL_IMPORT_EXPORT', name: 'Import from Excel (.xlsx / .csv)', description: 'Can bulk upload products, categories, customers, and expenses' },
  { key: 'reports_view', category: 'EXCEL_IMPORT_EXPORT', name: 'View Business Analytics & Reports', description: 'Can review sales, profit & loss, and audit reports' },

  // Settings & System
  { key: 'settings_manage', category: 'SETTINGS_SYSTEM', name: 'Shop Profile & Receipt Settings', description: 'Can modify shop address, taxes, printer format, and logo' },
  { key: 'access_control_manage', category: 'SETTINGS_SYSTEM', name: 'Access Control & Permissions Panel', description: 'Can modify role permissions and user privileges' },
];

export const DEFAULT_FULL_PERMISSIONS: RolePermissions = {
  pos_access: true,
  pos_discount_override: true,
  pos_void_item: true,
  pos_change_unit_price: true,
  pos_credit_sales: true,
  pos_sales_return: true,
  pos_view_cash_totals: true,

  inventory_view: true,
  inventory_add: true,
  inventory_edit: true,
  inventory_delete: true,
  inventory_view_cost: true,
  inventory_stock_adjust: true,
  inventory_expiry_batch: true,
  barcode_studio: true,

  categories_manage: true,
  custom_fields_manage: true,

  customers_view: true,
  customers_add_edit: true,
  customers_delete: true,
  customers_collect_payment: true,
  customers_credit_limit_override: true,

  suppliers_view: true,
  suppliers_add_edit: true,
  suppliers_purchase_orders: true,
  suppliers_receive_grn: true,
  suppliers_returns: true,
  suppliers_payments: true,

  expenses_view: true,
  expenses_add: true,
  expenses_delete: true,
  payouts_manage: true,
  cash_book_view: true,

  staff_view: true,
  staff_manage: true,
  payroll_manage: true,
  users_manage: true,

  excel_export: true,
  excel_import: true,
  reports_view: true,

  settings_manage: true,
  access_control_manage: true,
};

export const DEFAULT_STAFF_PERMISSIONS: RolePermissions = {
  // 1. POS & Billing (sale, sales return, reprint, discounts)
  pos_access: true,
  pos_discount_override: true,
  pos_void_item: true,
  pos_change_unit_price: true,
  pos_credit_sales: true,
  pos_sales_return: true,
  pos_view_cash_totals: true,

  // 2. Inventory & Products (product add/remove/edit, barcode generate/print)
  inventory_view: true,
  inventory_add: true,
  inventory_edit: true,
  inventory_delete: true,
  inventory_view_cost: false,
  inventory_stock_adjust: false,
  inventory_expiry_batch: false,
  barcode_studio: true,

  // 3. Categories & Fields (category create/remove)
  categories_manage: true,
  custom_fields_manage: false,

  // 4. Customers & Credit (customer add & balance pay)
  customers_view: true,
  customers_add_edit: true,
  customers_delete: false,
  customers_collect_payment: true,
  customers_credit_limit_override: false,

  // 5. Suppliers & Purchases (Owner/Admin only)
  suppliers_view: false,
  suppliers_add_edit: false,
  suppliers_purchase_orders: false,
  suppliers_receive_grn: false,
  suppliers_returns: false,
  suppliers_payments: false,

  // 6. Finance & Expenses (expenses and payout add, cash balance report)
  expenses_view: true,
  expenses_add: true,
  expenses_delete: false,
  payouts_manage: true,
  cash_book_view: true,

  // 7. Staff & Payroll (Owner/Admin only)
  staff_view: false,
  staff_manage: false,
  payroll_manage: false,
  users_manage: false,

  // 8. Excel Import & Export (Owner/Admin only)
  excel_export: false,
  excel_import: false,
  reports_view: false,

  // 9. Settings & System (Owner/Admin only)
  settings_manage: false,
  access_control_manage: false,
};

// Aliases for compatibility
export const DEFAULT_CASHIER_PERMISSIONS: RolePermissions = { ...DEFAULT_STAFF_PERMISSIONS };
export const DEFAULT_STORE_MANAGER_PERMISSIONS: RolePermissions = { ...DEFAULT_STAFF_PERMISSIONS };
export const DEFAULT_ACCOUNTANT_PERMISSIONS: RolePermissions = { ...DEFAULT_STAFF_PERMISSIONS };

export const DEFAULT_ROLE_PERMISSIONS_MAP: Record<UserRole, RolePermissions> = {
  SUPER_ADMIN: { ...DEFAULT_FULL_PERMISSIONS },
  OWNER: { ...DEFAULT_FULL_PERMISSIONS },
  ADMIN: { ...DEFAULT_FULL_PERMISSIONS },
  STORE_MANAGER: { ...DEFAULT_STAFF_PERMISSIONS },
  SALES_ASSOCIATE: { ...DEFAULT_STAFF_PERMISSIONS },
  SHOP_ASSOCIATE: { ...DEFAULT_STAFF_PERMISSIONS },
  CASHIER: { ...DEFAULT_STAFF_PERMISSIONS },
  ACCOUNTANT: { ...DEFAULT_STAFF_PERMISSIONS },
  TECHNICIAN: { ...DEFAULT_STAFF_PERMISSIONS },
  MECHANIC: { ...DEFAULT_STAFF_PERMISSIONS },
  KITCHEN: { ...DEFAULT_STAFF_PERMISSIONS },
  KITCHEN_STAFF: { ...DEFAULT_STAFF_PERMISSIONS },
  DELIVERY: { ...DEFAULT_STAFF_PERMISSIONS },
};
