import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Tenant,
  TenantLicense,
  TenantSettings,
  CustomFieldDefinition,
  Product,
  Category,
  Customer,
  Supplier,
  Sale,
  SaleReturn,
  PurchaseOrder,
  PurchaseReturn,
  Payout,
  Expense,
  Employee,
  SalaryRecord,
  SalaryAdvance,
  UserAccount,
  RiskAlert,
  PrintJob,
  LicenseStatus,
  UserRole,
  CustomerPayment,
  SupplierPayment,
  BatchRecord,
  Language,
  PromotionCampaign,
  RepairJob,
  VehicleServiceJob,
  StockAdjustmentRecord,
  StockAuditSession,
  StockGapReason,
  AuthSession,
  BusinessType,
  RolePermissions,
  PermissionKey,
  DEFAULT_ROLE_PERMISSIONS_MAP,
  DEFAULT_FULL_PERMISSIONS,
  CounterTerminal,
  CounterShift,
  CashDrawerTransaction,
  TerminalStationConfig,
  TerminalStationRole,
  AdminShopMessage,
  RemoteDevice,
  RemoteSecurityActionPayload,
} from '../types';
import { getEffectivePermissions, checkUserPermission } from '../utils/permissionUtils';
import {
  INITIAL_TENANTS,
  INITIAL_LICENSES,
  INITIAL_SETTINGS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_SALARIES,
  INITIAL_ADVANCES,
  INITIAL_EXPENSES,
  INITIAL_SALES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_PAYOUTS,
  INITIAL_RISK_ALERTS,
  INITIAL_ADMIN_SHOP_MESSAGES,
  INITIAL_PROMOTIONS,
  INITIAL_REPAIR_JOBS,
  INITIAL_VEHICLE_SERVICE_JOBS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_STOCK_AUDITS,
  INITIAL_COUNTERS,
  INITIAL_COUNTER_SHIFTS,
  INITIAL_CASH_DRAWER_TRANSACTIONS,
} from '../data/mockDatabase';
import { TRANSLATIONS, Translations } from '../i18n/translations';

interface RetailContextType {
  // Navigation & Role Context
  currentTenantId: string; // 'SUPER_ADMIN' or 'SHOP001', 'SHOP002', etc.
  setCurrentTenantId: (tenantId: string) => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  isSuperAdminMode: boolean;

  // Authentication & Shop Session
  authSession: AuthSession;
  loginShopUser: (credentials: {
    shopIdOrLicense?: string;
    tenantId?: string;
    usernameOrEmail?: string;
    username?: string;
    passwordOrPin?: string;
    password?: string;
    role?: UserRole;
  }) => {
    success: boolean;
    message: string;
    user?: UserAccount;
    tenant?: Tenant;
  };
  logoutSession: () => void;
  generateLicense: (params: {
    tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    clientName: string;
    clientContact?: string;
    customKey?: string;
    durationMonths?: number;
    maxBranches?: number;
    maxUsers?: number;
    maxProducts?: number;
    allowedModules?: Record<string, boolean>;
    notes?: string;
  }) => TenantLicense;
  activateShopWithLicense: (
    licenseKeyOrParams:
      | string
      | {
          license_key: string;
          shop_name: string;
          company_name?: string;
          business_type?: BusinessType;
          owner_full_name?: string;
          owner_username?: string;
          owner_password?: string;
          owner_pin?: string;
        },
    shopData?: Partial<Tenant>,
    ownerData?: {
      fullName: string;
      username: string;
      email?: string;
      password?: string;
      pin_code?: string;
      role?: UserRole;
    }
  ) => { success: boolean; message: string; tenant?: Tenant };
  validateLicenseKey: (licenseKey: string) => {
    isValid: boolean;
    valid?: boolean;
    reason?: string;
    license?: TenantLicense;
    isAlreadyUsed?: boolean;
    message: string;
  };
  allLicensesList: TenantLicense[];
  
  // Current Tenant Info & License
  currentTenant: Tenant | undefined;
  currentBranch?: { id: string; name: string };
  currentLicense: TenantLicense | undefined;
  currentSettings: TenantSettings | undefined;

  // Master Collections (Super Admin Access)
  allTenants: Tenant[];
  allLicenses: Record<string, TenantLicense>;
  allSettings: Record<string, TenantSettings>;
  allRiskAlerts: RiskAlert[];
  adminShopMessages: AdminShopMessage[];

  // Tenant-Scoped Data
  products: Product[];
  categories: Category[];
  customFields: CustomFieldDefinition[];
  customers: Customer[];
  customerPayments: CustomerPayment[];
  suppliers: Supplier[];
  sales: Sale[];
  saleReturns: SaleReturn[];
  purchases: PurchaseOrder[];
  purchaseReturns: PurchaseReturn[];
  payouts: Payout[];
  expenses: Expense[];
  employees: Employee[];
  salaries: SalaryRecord[];
  advances: SalaryAdvance[];
  salaryPayments?: SalaryRecord[];
  salaryAdvances?: SalaryAdvance[];
  currencySymbol?: string;
  users: UserAccount[];
  tenantUsers?: UserAccount[];
  printQueue: PrintJob[];
  batches: BatchRecord[];
  stockAdjustments: StockAdjustmentRecord[];
  stockAudits: StockAuditSession[];
  tenantMessages: AdminShopMessage[];
  unreadTenantMessagesCount: number;
  urgentUnreadMessage?: AdminShopMessage;

  // Super Admin Remote Actions & Messaging
  createTenant: (tenantData: Partial<Tenant>, initialPackage?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') => string;
  deleteTenantShop: (tenantId: string) => { success: boolean; message: string };
  batchCreateShops: (shops: Array<{
    shop_name: string;
    company_name?: string;
    business_type: BusinessType;
    package_tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    address?: string;
    phone?: string;
    email?: string;
    owner_full_name?: string;
    owner_username?: string;
    owner_password?: string;
    owner_pin?: string;
  }>) => { success: boolean; count: number; createdTenants: Tenant[]; message: string };
  updateTenantLicense: (tenantId: string, updates: Partial<TenantLicense>) => void;
  setLicenseStatus: (tenantId: string, status: LicenseStatus, warningMsg?: string, reason?: string) => void;
  issueValidLicenseKey: (
    tenantId: string,
    durationMonths: 1 | 3 | 6 | 12 | number,
    tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    notes?: string
  ) => {
    success: boolean;
    newKey: string;
    validUntil: string;
    durationTag: string;
    license: TenantLicense;
  };
  renewShopWithKey: (
    tenantId: string,
    renewalKey: string
  ) => { success: boolean; message: string; license?: TenantLicense };
  disableShopOperatingDevices: (
    tenantId: string,
    disableMessage?: string,
    reason?: string
  ) => Promise<boolean>;
  updateTenantModules: (tenantId: string, modules: Partial<TenantSettings['enabled_modules']>) => void;
  broadcastRiskAlert: (tenantId: string, alert: Omit<RiskAlert, 'id' | 'created_at' | 'is_acknowledged'>) => void;
  acknowledgeRiskAlert: (alertId: string) => void;
  sendAdminShopMessage: (msgData: Omit<AdminShopMessage, 'id' | 'created_at' | 'read_by_tenants' | 'acknowledged_by_tenants'>) => AdminShopMessage;
  markMessageAsRead: (messageId: string, userName?: string) => void;
  acknowledgeMessage: (messageId: string, replyNotes?: string, userName?: string) => void;
  deleteAdminShopMessage: (messageId: string) => void;

  // Super Admin Master Password & Security Control
  isSuperAdminAuthenticated: boolean;
  superAdminPasswordUpdatedAt: string;
  superAdminPasswordHint: string;
  authenticateSuperAdmin: (password: string) => boolean;
  verifySuperAdminPassword: (password: string) => boolean;
  setSuperAdminPassword: (newPassword: string, hint?: string) => void;
  lockSuperAdmin: () => void;
  resetSuperAdminPasswordToDefault: () => void;

  // Product & Inventory Actions
  addProduct: (product: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, newQuantity: number, reason: string) => void;
  recordStockAdjustment: (adjustment: Omit<StockAdjustmentRecord, 'id' | 'adjustment_no' | 'tenant_id' | 'created_at' | 'adjusted_by'>) => StockAdjustmentRecord;
  batchReconcileStockAudit: (sessionData: {
    title: string;
    category_filter?: string;
    notes?: string;
    items: {
      product_id: string;
      physical_count: number;
      reason: StockGapReason;
      notes?: string;
    }[];
  }) => StockAuditSession;
  deleteStockAdjustment: (id: string) => void;
  deleteStockAuditSession: (id: string) => void;

  // Custom Fields Actions
  addCustomField: (field: Omit<CustomFieldDefinition, 'id' | 'tenant_id'>) => void;
  updateCustomField: (id: string, updates: Partial<CustomFieldDefinition>) => void;
  deleteCustomField: (id: string) => void;

  // Categories Actions
  addCategory: (category: Omit<Category, 'id' | 'tenant_id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // POS & Sales Actions
  createSale: (
    saleData: Omit<Sale, 'id' | 'invoice_no' | 'tenant_id' | 'branch_id' | 'created_at'> & {
      cashier_id?: string;
      cashier_name?: string;
    }
  ) => Sale;
  updateSale: (id: string, updates: Partial<Sale>) => void;
  processSaleReturn: (returnData: Omit<SaleReturn, 'id' | 'return_no' | 'tenant_id' | 'created_at' | 'processed_by'>) => void;

  // Customers & Credit / Udalu Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  recordCustomerPayment: (payment: Omit<CustomerPayment, 'id' | 'tenant_id' | 'payment_date' | 'received_by'>) => void;
  adjustCustomerLoyaltyPoints: (customerId: string, pointsDelta: number, reason?: string) => void;

  // Suppliers & Purchases Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'tenant_id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'tenant_id' | 'payment_date' | 'paid_by'>) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'po_number' | 'tenant_id'>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  receivePurchaseOrder: (poId: string) => void;
  processPurchaseReturn: (retData: Omit<PurchaseReturn, 'id' | 'return_number' | 'tenant_id' | 'created_at' | 'processed_by'>) => PurchaseReturn;
  deletePurchaseReturn: (id: string) => void;

  // Payout Actions
  recordPayout: (payout: Omit<Payout, 'id' | 'payout_no' | 'tenant_id' | 'created_at' | 'authorized_by'>) => Payout;
  deletePayout: (id: string) => void;

  // Finance & HR Actions
  addExpense: (expense: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>) => void;
  deleteExpense: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'tenant_id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  recordSalaryPayment: (salary: Omit<SalaryRecord, 'id' | 'tenant_id' | 'processed_by'>) => void;
  updateSalaryPayment: (id: string, updates: Partial<SalaryRecord>) => void;
  deleteSalaryPayment: (id: string) => void;
  requestSalaryAdvance: (advance: Omit<SalaryAdvance, 'id' | 'tenant_id' | 'approved_by'>) => void;
  recordSalaryAdvance?: (advance: Omit<SalaryAdvance, 'id' | 'tenant_id' | 'approved_by'>) => void;
  updateSalaryAdvanceStatus: (id: string, status: SalaryAdvance['status']) => void;
  deleteSalaryAdvance: (id: string) => void;

  // Settings & Printing
  updateSettings: (settingsUpdates: Partial<TenantSettings>) => void;
  updateTenantDetails: (tenantUpdates: Partial<Tenant>) => void;
  queuePrintJob: (printerType: PrintJob['printer_type'], title: string, rawPreview?: string) => void;

  // User Management
  addUserAccount: (user: Omit<UserAccount, 'id' | 'tenant_id'>) => void;
  updateUserAccount: (id: string, updates: Partial<UserAccount>) => void;
  deleteUserAccount: (id: string) => void;
  setUserPassword: (userId: string, newPassword?: string) => void;
  removeUserPassword: (userId: string) => void;

  // Language & i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;

  // Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Promotions & Marketing
  promotions: PromotionCampaign[];
  addPromotion: (promo: Omit<PromotionCampaign, 'id' | 'tenant_id'>) => void;
  updatePromotion: (id: string, updates: Partial<PromotionCampaign>) => void;
  deletePromotion: (id: string) => void;

  // Repair Jobs & Device Service (Phone & Computer Shop)
  repairJobs: RepairJob[];
  addRepairJob: (job: Omit<RepairJob, 'id' | 'job_no' | 'tenant_id' | 'created_at'>) => RepairJob;
  updateRepairJob: (id: string, updates: Partial<RepairJob>) => void;
  deleteRepairJob: (id: string) => void;

  // Vehicle Service Station
  vehicleServiceJobs: VehicleServiceJob[];
  vehicleServiceRecords?: VehicleServiceJob[];
  addVehicleServiceJob: (job: Omit<VehicleServiceJob, 'id' | 'job_no' | 'tenant_id' | 'created_at'>) => VehicleServiceJob;
  updateVehicleServiceJob: (id: string, updates: Partial<VehicleServiceJob>) => void;
  deleteVehicleServiceJob: (id: string) => void;

  // Excel Batch Import & Master Collections
  batchImportCategories: (newCats: Omit<Category, 'id'>[]) => { count: number; imported: Category[] };
  batchImportProducts: (newProds: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[]) => { count: number; imported: Product[] };
  batchImportCustomers: (newCusts: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[]) => { count: number; imported: Customer[] };
  batchImportExpenses: (newExps: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[]) => { count: number; imported: Expense[] };
  allProductsMaster: Product[];
  allCategoriesMaster: Category[];
  allCustomersMaster: Customer[];
  allExpensesMaster: Expense[];

  // Access Control & Permissions Matrix
  rolePermissionsMap: Record<UserRole, RolePermissions>;
  userPermissionOverrides: Record<string, Partial<RolePermissions>>;
  ownerAdminFullAccess: { ownerFullAccess: boolean; adminFullAccess: boolean };
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>, targetTenantId?: string) => void;
  updateUserPermissionOverride: (userId: string, permissions: Partial<RolePermissions> | null) => void;
  setOwnerAdminFullAccess: (role: 'OWNER' | 'ADMIN', fullAccess: boolean, targetTenantId?: string) => void;
  hasPermission: (permissionKey: PermissionKey, customUser?: UserAccount) => boolean;
  getEffectiveUserPermissions: (customUser?: UserAccount) => RolePermissions;
  resetRolePermissionsToDefault: (targetTenantId?: string) => void;

  // System Helpers
  resetToDemoData: () => void;

  // Multi-Counter & Terminal Network (Multiple PCs & Cashier Desks)
  counters: CounterTerminal[];
  allCountersMaster: CounterTerminal[];
  counterShifts: CounterShift[];
  terminalStation: TerminalStationConfig;
  activeCounter?: CounterTerminal;
  activeShift?: CounterShift;
  setTerminalStation: (config: Partial<TerminalStationConfig>) => void;
  openCounterShift: (counterId: string, cashierId: string, cashierName: string, openingFloat: number, notes?: string) => CounterShift;
  closeCounterShift: (shiftId: string, closingCashActual: number, notes?: string) => { shift: CounterShift; summary: any };
  addCounterTerminal: (counterData: Omit<CounterTerminal, 'id' | 'tenant_id'>) => CounterTerminal;
  updateCounterTerminal: (id: string, updates: Partial<CounterTerminal>) => void;
  deleteCounterTerminal: (id: string) => void;
  recordCounterCashDrop: (counterId: string, amount: number, reason: string) => void;

  // Cash Drawer & Shift Management (Day Open Deposit, Mid-day In/Out, Day End Withdrawal)
  cashDrawerTransactions: CashDrawerTransaction[];
  allCashDrawerTransactions: CashDrawerTransaction[];
  currentDrawerCashBalance: number;
  recordCashDrawerTransaction: (tx: Omit<CashDrawerTransaction, 'id' | 'tenant_id' | 'created_at'>) => CashDrawerTransaction;
  openDayShift: (payload: {
    counter_id?: string;
    counter_name?: string;
    cashier_id?: string;
    cashier_name?: string;
    opening_float: number;
    denominations?: Record<string, number>;
    notes?: string;
  }) => CounterShift;
  closeDayShift: (payload: {
    shift_id: string;
    closing_cash_actual: number;
    closing_denominations?: Record<string, number>;
    cash_withdrawal_amount: number;
    retained_float_for_next_day?: number;
    withdrawal_notes?: string;
    notes?: string;
  }) => { shift: CounterShift; summary: any };
  recordCashDrawerIn: (payload: {
    counter_id?: string;
    amount: number;
    reason: string;
    category?: 'FLOAT' | 'PETTY_CASH' | 'SUPPLIER_PAYMENT' | 'BANK_DROP' | 'OWNER_DRAW' | 'CHANGE_REPLENISH' | 'OTHER';
    denominations?: Record<string, number>;
    notes?: string;
  }) => CashDrawerTransaction;
  recordCashDrawerOut: (payload: {
    counter_id?: string;
    amount: number;
    reason: string;
    category?: 'FLOAT' | 'PETTY_CASH' | 'SUPPLIER_PAYMENT' | 'BANK_DROP' | 'OWNER_DRAW' | 'CHANGE_REPLENISH' | 'OTHER';
    denominations?: Record<string, number>;
    notes?: string;
  }) => CashDrawerTransaction;
  kickCashDrawer: (counter_id?: string, counter_name?: string) => void;
  getShopDirectUrl: (tenantId?: string) => string;
  copyShopDirectUrl: (tenantId?: string) => boolean;
  openShopInAddressBar: (tenantId: string) => void;
  exportDatabaseJson: () => string;
  exportShopDatabaseJson: (tenantId?: string) => string;
  importDatabaseJson: (
    jsonData: string | Record<string, any>,
    mode?: 'replace' | 'merge'
  ) => { success: boolean; message: string; stats: Record<string, number> };
  importShopDatabaseJson: (
    jsonData: string | Record<string, any>,
    mode?: 'replace' | 'merge',
    targetTenantId?: string
  ) => { success: boolean; message: string; stats: Record<string, number> };

  // Multi-Computer Cloud Synchronization
  cloudSyncStatus: 'connected' | 'syncing' | 'offline' | 'error';
  lastCloudSync: string | null;
  cloudVersion: number;
  connectedClientsCount: number;
  forceCloudSync: () => Promise<void>;

  // Remote Device & Security Control (Controlling PCs across any location)
  remoteDevices: RemoteDevice[];
  localDeviceId: string;
  localDeviceName: string;
  setLocalDeviceName: (name: string) => void;
  isLocalDeviceLocked: boolean;
  localDeviceLockReason: string;
  localDeviceLockMessage: string;
  isLocalDeviceBlocked: boolean;
  remoteAlertPopup: { title?: string; message: string } | null;
  clearRemoteAlertPopup: () => void;
  fetchRemoteDevices: () => Promise<void>;
  executeDeviceSecurityAction: (payload: RemoteSecurityActionPayload) => Promise<boolean>;
  executeShopLockdown: (tenantId: string, action: 'LOCK_ALL' | 'UNLOCK_ALL' | 'LOGOUT_ALL', message?: string) => Promise<boolean>;
  unlockLocalOverride: (pinOrPassword: string) => Promise<boolean>;
  updateLicenseMaxTerminals: (tenantId: string, maxTerminals: number) => void;
}

const RetailContext = createContext<RetailContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'WCS_RETAIL_CLOUD_V2_';

export const RetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states from localStorage if available
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [licenses, setLicenses] = useState<Record<string, TenantLicense>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'licenses');
    return saved ? JSON.parse(saved) : INITIAL_LICENSES;
  });

  const [settings, setSettings] = useState<Record<string, TenantSettings>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'custom_fields');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_FIELDS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'customer_payments');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_PAYMENTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [salaries, setSalaries] = useState<SalaryRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'salaries');
    return saved ? JSON.parse(saved) : INITIAL_SALARIES;
  });

  const [advances, setAdvances] = useState<SalaryAdvance[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'advances');
    return saved ? JSON.parse(saved) : INITIAL_ADVANCES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'sale_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'purchase_returns');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_RETURNS;
  });

  const [payouts, setPayouts] = useState<Payout[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'payouts');
    return saved ? JSON.parse(saved) : INITIAL_PAYOUTS;
  });

  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'risk_alerts');
    return saved ? JSON.parse(saved) : INITIAL_RISK_ALERTS;
  });

  const [adminShopMessages, setAdminShopMessages] = useState<AdminShopMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'admin_shop_messages');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_SHOP_MESSAGES;
  });

  const [promotions, setPromotions] = useState<PromotionCampaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'promotions');
    return saved ? JSON.parse(saved) : INITIAL_PROMOTIONS;
  });

  const [repairJobs, setRepairJobs] = useState<RepairJob[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'repair_jobs');
    return saved ? JSON.parse(saved) : INITIAL_REPAIR_JOBS;
  });

  const [vehicleServiceJobs, setVehicleServiceJobs] = useState<VehicleServiceJob[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'vehicle_service_jobs');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_SERVICE_JOBS;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustmentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'stock_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENTS;
  });

  const [stockAudits, setStockAudits] = useState<StockAuditSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'stock_audits');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_AUDITS;
  });

  // Multi-Counter & Terminal Network States
  const [counters, setCounters] = useState<CounterTerminal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'counters');
    return saved ? JSON.parse(saved) : INITIAL_COUNTERS;
  });

  const [counterShifts, setCounterShifts] = useState<CounterShift[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'counter_shifts');
    return saved ? JSON.parse(saved) : INITIAL_COUNTER_SHIFTS;
  });

  const [cashDrawerTransactions, setCashDrawerTransactions] = useState<CashDrawerTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'cash_drawer_transactions');
    return saved ? JSON.parse(saved) : INITIAL_CASH_DRAWER_TRANSACTIONS;
  });

  const [terminalStation, setTerminalStationState] = useState<TerminalStationConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'terminal_station');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.station_type) return parsed;
      } catch (err) {
        console.warn('Failed to parse saved terminal station config:', err);
      }
    }
    return {
      station_type: 'ADMIN_WORKSTATION',
      counter_id: 'CTR-SHOP001-01',
      counter_name: 'Counter 01 - Main Checkout',
      device_label: 'Main Office Workstation',
      lock_to_pos: false,
      auto_launch_pos: false,
      default_printer_type: '80mm',
    };
  });

  // Access Control & Role Permissions Matrix State
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<UserRole, RolePermissions>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'role_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_ROLE_PERMISSIONS_MAP;
  });

  const [userPermissionOverrides, setUserPermissionOverrides] = useState<Record<string, Partial<RolePermissions>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'user_permission_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  const [ownerAdminFullAccess, setOwnerAdminFullAccessState] = useState<{ ownerFullAccess: boolean; adminFullAccess: boolean }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'owner_admin_full_access');
    return saved ? JSON.parse(saved) : { ownerFullAccess: true, adminFullAccess: true };
  });

  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);

  // Language state (en / si / ta)
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('WCS_APP_LANGUAGE');
    return (saved === 'si' || saved === 'ta' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('WCS_APP_LANGUAGE', newLang);
  };

  const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.en, [language]);

  // Fullscreen state & toggle
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Authentication & Session State
  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isAuthenticated === 'boolean') {
          return parsed;
        }
      } catch (err) {
        console.warn('Failed to parse saved auth session:', err);
      }
    }
    return {
      isAuthenticated: true,
      authType: 'SHOP_USER',
      tenantId: 'SHOP001',
      user: INITIAL_USERS[1],
      loginTime: new Date().toISOString(),
    };
  });

  // Navigation State & URL Address Bar Parsing
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    // Check browser address bar for pinned/tagged shop parameter (?shop=... or #shop=...)
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlShop = params.get('shop') || params.get('tenant') || params.get('tag') || params.get('pin');
        if (urlShop && urlShop.trim()) {
          return urlShop.trim();
        }
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('shop=')) {
          return hash.split('=')[1];
        } else if (hash.startsWith('tenant=')) {
          return hash.split('=')[1];
        } else if (hash.startsWith('SHOP') || hash.startsWith('STORE')) {
          return hash;
        }
      }
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.tenantId) return parsed.tenantId;
      } catch {}
    }
    return 'SHOP001';
  });
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.user) return parsed.user;
      } catch {}
    }
    return INITIAL_USERS[1];
  });

  // Super Admin Master Password & Security State
  const [superAdminPassword, setSuperAdminPasswordState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'superadmin_password') || 'admin123';
  });

  const [superAdminPasswordHint, setSuperAdminPasswordHintState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'superadmin_password_hint') || 'Default master password: admin123';
  });

  const [superAdminPasswordUpdatedAt, setSuperAdminPasswordUpdatedAtState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'superadmin_password_updated_at') || new Date().toISOString();
  });

  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.authType === 'SUPER_ADMIN' && parsed?.isAuthenticated) {
          return true;
        }
      } catch {}
    }
    return false;
  });

  // Multi-Computer Cloud Synchronization State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [cloudVersion, setCloudVersion] = useState<number>(0);
  const [connectedClientsCount, setConnectedClientsCount] = useState<number>(1);
  const isIncomingRemoteUpdateRef = useRef<boolean>(false);
  const localDbVersionRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const pendingSyncTimeoutRef = useRef<any>(null);

  // Apply state received from centralized server
  const applyRemoteState = (remoteDb: any, newVersion: number) => {
    if (!remoteDb || typeof remoteDb !== 'object') return;
    isIncomingRemoteUpdateRef.current = true;
    localDbVersionRef.current = newVersion;
    setCloudVersion(newVersion);
    setLastCloudSync(new Date().toLocaleTimeString());
    setCloudSyncStatus('connected');

    if (Array.isArray(remoteDb.tenants) && remoteDb.tenants.length > 0) setTenants(remoteDb.tenants);
    if (remoteDb.licenses && typeof remoteDb.licenses === 'object') setLicenses(remoteDb.licenses);
    if (remoteDb.settings && typeof remoteDb.settings === 'object') setSettings(remoteDb.settings);
    if (Array.isArray(remoteDb.customFields)) setCustomFields(remoteDb.customFields);
    if (Array.isArray(remoteDb.categories)) setCategories(remoteDb.categories);
    if (Array.isArray(remoteDb.products)) setProducts(remoteDb.products);
    if (Array.isArray(remoteDb.customers)) setCustomers(remoteDb.customers);
    if (Array.isArray(remoteDb.customerPayments)) setCustomerPayments(remoteDb.customerPayments);
    if (Array.isArray(remoteDb.suppliers)) setSuppliers(remoteDb.suppliers);
    if (Array.isArray(remoteDb.users)) setUsers(remoteDb.users);
    if (Array.isArray(remoteDb.employees)) setEmployees(remoteDb.employees);
    if (Array.isArray(remoteDb.salaries)) setSalaries(remoteDb.salaries);
    if (Array.isArray(remoteDb.advances)) setAdvances(remoteDb.advances);
    if (Array.isArray(remoteDb.expenses)) setExpenses(remoteDb.expenses);
    if (Array.isArray(remoteDb.sales)) setSales(remoteDb.sales);
    if (Array.isArray(remoteDb.saleReturns)) setSaleReturns(remoteDb.saleReturns);
    if (Array.isArray(remoteDb.purchases)) setPurchases(remoteDb.purchases);
    if (Array.isArray(remoteDb.purchaseReturns)) setPurchaseReturns(remoteDb.purchaseReturns);
    if (Array.isArray(remoteDb.payouts)) setPayouts(remoteDb.payouts);
    if (Array.isArray(remoteDb.riskAlerts)) setRiskAlerts(remoteDb.riskAlerts);
    if (Array.isArray(remoteDb.adminShopMessages)) setAdminShopMessages(remoteDb.adminShopMessages);
    if (Array.isArray(remoteDb.promotions)) setPromotions(remoteDb.promotions);
    if (Array.isArray(remoteDb.repairJobs)) setRepairJobs(remoteDb.repairJobs);
    if (Array.isArray(remoteDb.vehicleServiceJobs)) setVehicleServiceJobs(remoteDb.vehicleServiceJobs);
    if (Array.isArray(remoteDb.stockAdjustments)) setStockAdjustments(remoteDb.stockAdjustments);
    if (Array.isArray(remoteDb.stockAudits)) setStockAudits(remoteDb.stockAudits);
    if (Array.isArray(remoteDb.counters)) setCounters(remoteDb.counters);
    if (Array.isArray(remoteDb.counterShifts)) setCounterShifts(remoteDb.counterShifts);
    if (Array.isArray(remoteDb.cashDrawerTransactions)) setCashDrawerTransactions(remoteDb.cashDrawerTransactions);

    setTimeout(() => {
      isIncomingRemoteUpdateRef.current = false;
    }, 300);
  };

  // Explicit function to pull latest server state
  const forceCloudSync = async () => {
    try {
      setCloudSyncStatus('syncing');
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.connectedClients) setConnectedClientsCount(json.connectedClients);
          applyRemoteState(json.data, json.version || 1);
        }
      } else {
        setCloudSyncStatus('offline');
      }
    } catch (err) {
      console.warn('Cloud sync fetch failed (working offline):', err);
      setCloudSyncStatus('offline');
    }
  };

  // Remote Device & Security Control States (Controlling PCs across any location)
  const [localDeviceId] = useState<string>(() => {
    let id = localStorage.getItem(STORAGE_KEY_PREFIX + 'local_device_id');
    if (!id) {
      id = `pc_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      localStorage.setItem(STORAGE_KEY_PREFIX + 'local_device_id', id);
    }
    return id;
  });

  const [localDeviceName, setLocalDeviceNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'local_device_name') || 'Cashier Station - Main PC';
  });

  const setLocalDeviceName = (name: string) => {
    setLocalDeviceNameState(name);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'local_device_name', name);
  };

  const [isLocalDeviceLocked, setIsLocalDeviceLocked] = useState<boolean>(false);
  const [localDeviceLockReason, setLocalDeviceLockReason] = useState<string>('Remotely locked by Headquarters');
  const [localDeviceLockMessage, setLocalDeviceLockMessage] = useState<string>('Terminal access is temporarily restricted by Headquarters.');
  const [isLocalDeviceBlocked, setIsLocalDeviceBlocked] = useState<boolean>(false);
  const [remoteAlertPopup, setRemoteAlertPopup] = useState<{ title?: string; message: string } | null>(null);
  const clearRemoteAlertPopup = () => setRemoteAlertPopup(null);

  const [remoteDevices, setRemoteDevices] = useState<RemoteDevice[]>([]);

  const fetchRemoteDevices = async () => {
    try {
      const res = await fetch('/api/security/devices');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.devices)) {
          const normalized = json.devices.map((d: any) => ({
            ...d,
            deviceId: d.deviceId || d.device_id,
            deviceName: d.deviceName || d.device_name,
            tenantId: d.tenantId || d.tenant_id,
            shopName: d.shopName || d.shop_name,
            currentUserName: d.currentUserName || d.current_user_name,
            currentUserRole: d.currentUserRole || d.current_user_role,
            ipAddress: d.ipAddress || d.ip_address,
            locationCity: d.locationCity || d.city,
            locationCountry: d.locationCountry || d.country,
            isLocked: d.isLocked ?? d.is_locked,
            isAuthorized: d.isAuthorized ?? !d.is_blocked,
            lastPing: d.lastPing || d.last_heartbeat,
            // Aliases
            device_id: d.deviceId || d.device_id,
            device_name: d.deviceName || d.device_name,
            tenant_id: d.tenantId || d.tenant_id,
            shop_name: d.shopName || d.shop_name,
            current_user_name: d.currentUserName || d.current_user_name,
            current_user_role: d.currentUserRole || d.current_user_role,
            ip_address: d.ipAddress || d.ip_address,
            city: d.locationCity || d.city,
            country: d.locationCountry || d.country,
            is_locked: d.isLocked ?? d.is_locked,
            is_blocked: !d.isAuthorized || d.status === 'BLOCKED' || d.is_blocked,
            last_heartbeat: d.lastPing || d.last_heartbeat,
          }));
          setRemoteDevices(normalized);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote devices:', err);
    }
  };

  const executeDeviceSecurityAction = async (payload: RemoteSecurityActionPayload): Promise<boolean> => {
    try {
      const normalizedPayload = {
        deviceId: payload.deviceId || payload.targetDeviceId,
        action: payload.action || payload.command,
        message: payload.message,
        reason: payload.reason,
        newName: payload.newName,
      };
      const res = await fetch('/api/security/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedPayload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRemoteDevices();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to execute security action:', err);
      return false;
    }
  };

  const executeShopLockdown = async (
    tenantId: string,
    action: 'LOCK_ALL' | 'UNLOCK_ALL' | 'LOGOUT_ALL',
    message?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/security/shop-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, action, message }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchRemoteDevices();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to execute shop lockdown:', err);
      return false;
    }
  };

  const unlockLocalOverride = async (pinOrPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/security/unlock-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: localDeviceId, pinOrPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setIsLocalDeviceLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateLicenseMaxTerminals = (tenantId: string, maxTerminals: number) => {
    updateTenantLicense(tenantId, { max_terminals: maxTerminals });
  };

  // Debounced sync to push local changes to server so other computers receive them
  const queueOutgoingCloudSync = (updatedData: Record<string, any>) => {
    if (isIncomingRemoteUpdateRef.current) return;
    if (pendingSyncTimeoutRef.current) {
      clearTimeout(pendingSyncTimeoutRef.current);
    }
    pendingSyncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/sync/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: updatedData }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.version) {
            localDbVersionRef.current = json.version;
            setCloudVersion(json.version);
            setLastCloudSync(new Date().toLocaleTimeString());
            setCloudSyncStatus('connected');
          }
        }
      } catch (err) {
        console.warn('Outgoing sync failed (will retry on next change):', err);
        setCloudSyncStatus('offline');
      }
    }, 400);
  };

  // Sync to localStorage and broadcast to cloud server
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(tenants));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'licenses', JSON.stringify(licenses));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'custom_fields', JSON.stringify(customFields));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'products', JSON.stringify(products));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'customers', JSON.stringify(customers));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'customer_payments', JSON.stringify(customerPayments));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'suppliers', JSON.stringify(suppliers));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'employees', JSON.stringify(employees));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'salaries', JSON.stringify(salaries));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'advances', JSON.stringify(advances));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'expenses', JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sales', JSON.stringify(sales));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sale_returns', JSON.stringify(saleReturns));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'purchases', JSON.stringify(purchases));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'purchase_returns', JSON.stringify(purchaseReturns));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'payouts', JSON.stringify(payouts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'risk_alerts', JSON.stringify(riskAlerts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'admin_shop_messages', JSON.stringify(adminShopMessages));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'promotions', JSON.stringify(promotions));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'repair_jobs', JSON.stringify(repairJobs));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicle_service_jobs', JSON.stringify(vehicleServiceJobs));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'stock_adjustments', JSON.stringify(stockAdjustments));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'stock_audits', JSON.stringify(stockAudits));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'counters', JSON.stringify(counters));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'counter_shifts', JSON.stringify(counterShifts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'terminal_station', JSON.stringify(terminalStation));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'role_permissions', JSON.stringify(rolePermissionsMap));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'user_permission_overrides', JSON.stringify(userPermissionOverrides));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'owner_admin_full_access', JSON.stringify(ownerAdminFullAccess));

    // Send updates to cloud server for other computers
    if (!isIncomingRemoteUpdateRef.current) {
      queueOutgoingCloudSync({
        tenants,
        licenses,
        settings,
        customFields,
        categories,
        products,
        customers,
        customerPayments,
        suppliers,
        users,
        employees,
        salaries,
        advances,
        expenses,
        sales,
        saleReturns,
        purchases,
        purchaseReturns,
        payouts,
        riskAlerts,
        adminShopMessages,
        promotions,
        repairJobs,
        vehicleServiceJobs,
        stockAdjustments,
        stockAudits,
        counters,
        counterShifts,
        cashDrawerTransactions,
      });
    }
  }, [
    tenants,
    licenses,
    settings,
    customFields,
    categories,
    products,
    customers,
    suppliers,
    users,
    employees,
    salaries,
    advances,
    expenses,
    sales,
    saleReturns,
    purchases,
    purchaseReturns,
    payouts,
    riskAlerts,
    adminShopMessages,
    promotions,
    repairJobs,
    vehicleServiceJobs,
    stockAdjustments,
    stockAudits,
    counters,
    counterShifts,
    terminalStation,
    rolePermissionsMap,
    userPermissionOverrides,
    ownerAdminFullAccess,
  ]);

  // Real-Time Multi-Computer & Multi-Tab Synchronization
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial full fetch from centralized cloud server
    forceCloudSync();

    // 2. Real-time Server-Sent Events (SSE) stream for instant push from other computers
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/sync/stream?deviceId=${encodeURIComponent(localDeviceId)}`);
      eventSource.addEventListener('sync', (e) => {
        try {
          const eventData = JSON.parse(e.data);
          if (eventData.version && eventData.version > localDbVersionRef.current) {
            forceCloudSync();
          }
        } catch (err) {
          console.warn('Error parsing SSE sync event:', err);
        }
      });

      // Instant Remote PC Security Command Event Listener
      eventSource.addEventListener('security_command', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          const target = data.targetDeviceId;
          if (!target || target === 'ALL' || target === localDeviceId) {
            if (data.command === 'LOCK') {
              setIsLocalDeviceLocked(true);
              if (data.payload?.reason) setLocalDeviceLockReason(data.payload.reason);
              if (data.payload?.message) setLocalDeviceLockMessage(data.payload.message);
            } else if (data.command === 'UNLOCK') {
              setIsLocalDeviceLocked(false);
            } else if (data.command === 'FORCE_LOGOUT') {
              setAuthSession(null);
              setIsSuperAdminAuthenticated(false);
              localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
              setRemoteAlertPopup({
                title: 'Remote Session Terminated',
                message: data.payload?.message || 'Your session was remotely signed out by Headquarters Security.',
              });
            } else if (data.command === 'MESSAGE') {
              setRemoteAlertPopup({
                title: '🚨 Message from Headquarters Security',
                message: data.payload?.message || 'Important security protocol notification.',
              });
            } else if (data.command === 'BLOCK') {
              setIsLocalDeviceBlocked(true);
            } else if (data.command === 'UNBLOCK') {
              setIsLocalDeviceBlocked(false);
            }
          }
        } catch (err) {
          console.warn('Error parsing SSE security event:', err);
        }
      });

      eventSource.onopen = () => {
        setCloudSyncStatus('connected');
      };
      eventSource.onerror = () => {
        // SSE may reconnect or fallback to background polling
        setCloudSyncStatus((prev) => (prev === 'connected' ? 'syncing' : prev));
      };
    } catch (err) {
      console.warn('SSE stream error:', err);
    }

    // 3. Reliable Interval Polling (every 3.5 seconds) for all devices across the network
    const pollInterval = setInterval(async () => {
      if (!isMountedRef.current) return;
      try {
        const res = await fetch('/api/sync/state');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.version && json.version > localDbVersionRef.current) {
            applyRemoteState(json.data, json.version);
          }
        }
      } catch {}
    }, 3500);

    // 4. Remote PC Heartbeat & Security Status Check (every 7 seconds)
    fetchRemoteDevices();
    const sendHeartbeat = async () => {
      if (!isMountedRef.current) return;
      try {
        const res = await fetch('/api/security/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: localDeviceId,
            deviceName: localDeviceName,
            tenantId: currentTenantId,
            shopName: currentTenant?.shop_name || 'Retail Branch',
            currentUserId: authSession?.user?.id,
            currentUserName: authSession?.user?.name,
            currentUserRole: authSession?.user?.role,
            browser: navigator.userAgent.includes('Chrome')
              ? 'Chrome'
              : navigator.userAgent.includes('Safari')
              ? 'Safari'
              : navigator.userAgent.includes('Firefox')
              ? 'Firefox'
              : 'Browser',
            os: navigator.userAgent.includes('Windows')
              ? 'Windows 11'
              : navigator.userAgent.includes('Mac')
              ? 'macOS'
              : navigator.userAgent.includes('Linux')
              ? 'Linux'
              : 'OS',
            deviceType: window.innerWidth < 768 ? 'tablet' : 'pos_terminal',
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (json.isLocked) {
              setIsLocalDeviceLocked(true);
              if (json.lockReason) setLocalDeviceLockReason(json.lockReason);
              if (json.lockMessage) setLocalDeviceLockMessage(json.lockMessage);
            } else if (!json.isLocked && isLocalDeviceLocked) {
              setIsLocalDeviceLocked(false);
            }
            if (json.isBlocked) {
              setIsLocalDeviceBlocked(true);
            }
            if (json.pendingCommand === 'FORCE_LOGOUT') {
              setAuthSession(null);
              setIsSuperAdminAuthenticated(false);
              localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
              setRemoteAlertPopup({
                title: 'Remote Session Terminated',
                message: json.pendingMessage || 'Your session was remotely signed out by Headquarters.',
              });
            } else if (json.pendingCommand === 'MESSAGE' && json.pendingMessage) {
              setRemoteAlertPopup({
                title: '🚨 Message from Headquarters Security',
                message: json.pendingMessage,
              });
            }
          }
        }
      } catch {}
    };

    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 7500);
    const devicesRefreshInterval = setInterval(fetchRemoteDevices, 8500);

    // 4. Same-browser tab synchronization
    const handleStorageSync = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === STORAGE_KEY_PREFIX + 'sales') {
          setSales(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'products') {
          setProducts(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'counters') {
          setCounters(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'counter_shifts') {
          setCounterShifts(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'cash_drawer_transactions') {
          setCashDrawerTransactions(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'customers') {
          setCustomers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'payouts') {
          setPayouts(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEY_PREFIX + 'stock_adjustments') {
          setStockAdjustments(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.warn('Live storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => {
      isMountedRef.current = false;
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      clearInterval(devicesRefreshInterval);
      if (pendingSyncTimeoutRef.current) clearTimeout(pendingSyncTimeoutRef.current);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  // Derived states
  const isSuperAdminMode = currentTenantId === 'SUPER_ADMIN';
  const currentTenant = useMemo(() => tenants.find((t) => t.tenant_id === currentTenantId), [tenants, currentTenantId]);
  const currentBranch = useMemo(() => ({
    id: currentTenant?.branch_id || 'MAIN',
    name: currentTenant?.branch_name || 'Main Branch',
  }), [currentTenant]);
  const currentLicense = useMemo(() => licenses[currentTenantId], [licenses, currentTenantId]);
  const currentSettings = useMemo(() => settings[currentTenantId], [settings, currentTenantId]);

  // When switching tenants, adjust default user if needed
  useEffect(() => {
    if (currentTenantId === 'SUPER_ADMIN') {
      const superUser = users.find((u) => u.role === 'SUPER_ADMIN') || INITIAL_USERS[0];
      setCurrentUser(superUser);
    } else {
      const tenantUser = users.find((u) => u.tenant_id === currentTenantId && (u.role === 'OWNER' || u.role === 'ADMIN')) || users.find((u) => u.tenant_id === currentTenantId) || {
        id: `USER_${currentTenantId}_DEFAULT`,
        tenant_id: currentTenantId,
        username: 'shop_admin',
        full_name: `${currentTenant?.shop_name || 'Shop'} Admin`,
        email: `admin@${currentTenantId.toLowerCase()}.lk`,
        role: 'OWNER' as UserRole,
        pin_code: '1234',
        is_active: true,
        avatar_color: '#4f46e5',
      };
      setCurrentUser(tenantUser);
    }
  }, [currentTenantId]);

  // Address Bar URL Synchronization: Keeps browser address bar in sync with active shop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (currentTenantId === 'SUPER_ADMIN') {
        url.searchParams.set('shop', 'SUPER_ADMIN');
      } else if (currentTenantId) {
        url.searchParams.set('shop', currentTenantId);
      }
      window.history.replaceState(null, '', url.toString());
    } catch (err) {
      console.warn('Could not update address bar URL:', err);
    }
  }, [currentTenantId]);

  // Helper functions for address bar link and pinning
  const getShopDirectUrl = (tenantId?: string): string => {
    const target = tenantId || currentTenantId || 'SHOP001';
    if (typeof window === 'undefined') return `?shop=${target}`;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('shop', target);
      return url.toString();
    } catch {
      return `${window.location.origin}${window.location.pathname}?shop=${target}`;
    }
  };

  const copyShopDirectUrl = (tenantId?: string): boolean => {
    const directUrl = getShopDirectUrl(tenantId);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(directUrl);
        return true;
      }
    } catch {}
    try {
      const el = document.createElement('textarea');
      el.value = directUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  };

  const openShopInAddressBar = (tenantId: string) => {
    if (!tenantId) return;
    setCurrentTenantId(tenantId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('shop', tenantId);
      window.history.pushState(null, '', url.toString());
    } catch {}
  };

  // Tenant-scoped datasets
  const tenantProducts = useMemo(() => (products || []).filter((p) => p && p.tenant_id === currentTenantId), [products, currentTenantId]);
  const tenantCategories = useMemo(() => (categories || []).filter((c) => c && c.tenant_id === currentTenantId), [categories, currentTenantId]);
  const tenantCustomFields = useMemo(() => (customFields || []).filter((cf) => cf && cf.tenant_id === currentTenantId), [customFields, currentTenantId]);
  const tenantCustomers = useMemo(() => (customers || []).filter((c) => c && c.tenant_id === currentTenantId), [customers, currentTenantId]);
  const tenantCustomerPayments = useMemo(() => (customerPayments || []).filter((cp) => cp && cp.tenant_id === currentTenantId), [customerPayments, currentTenantId]);
  const tenantSuppliers = useMemo(() => (suppliers || []).filter((s) => s && s.tenant_id === currentTenantId), [suppliers, currentTenantId]);
  const tenantSales = useMemo(() => (sales || []).filter((s) => s && s.tenant_id === currentTenantId), [sales, currentTenantId]);
  const tenantSaleReturns = useMemo(() => (saleReturns || []).filter((sr) => sr && sr.tenant_id === currentTenantId), [saleReturns, currentTenantId]);
  const tenantPurchases = useMemo(() => (purchases || []).filter((p) => p && p.tenant_id === currentTenantId), [purchases, currentTenantId]);
  const tenantPurchaseReturns = useMemo(() => (purchaseReturns || []).filter((pr) => pr && pr.tenant_id === currentTenantId), [purchaseReturns, currentTenantId]);
  const tenantPayouts = useMemo(() => (payouts || []).filter((pay) => pay && pay.tenant_id === currentTenantId), [payouts, currentTenantId]);
  const tenantExpenses = useMemo(() => (expenses || []).filter((e) => e && e.tenant_id === currentTenantId), [expenses, currentTenantId]);
  const tenantEmployees = useMemo(() => (employees || []).filter((e) => e && e.tenant_id === currentTenantId), [employees, currentTenantId]);
  const tenantSalaries = useMemo(() => (salaries || []).filter((s) => s && s.tenant_id === currentTenantId), [salaries, currentTenantId]);
  const tenantAdvances = useMemo(() => (advances || []).filter((a) => a && a.tenant_id === currentTenantId), [advances, currentTenantId]);
  const tenantUsers = useMemo(() => (users || []).filter((u) => u && u.tenant_id === currentTenantId), [users, currentTenantId]);
  const tenantPrintQueue = useMemo(() => (printQueue || []).filter((p) => p && p.tenant_id === currentTenantId), [printQueue, currentTenantId]);
  const tenantBatches = useMemo(() => (tenantProducts || []).flatMap((p) => p.batches || []), [tenantProducts]);
  const tenantRepairJobs = useMemo(() => (repairJobs || []).filter((r) => r && r.tenant_id === currentTenantId), [repairJobs, currentTenantId]);
  const tenantVehicleServiceJobs = useMemo(() => (vehicleServiceJobs || []).filter((v) => v && v.tenant_id === currentTenantId), [vehicleServiceJobs, currentTenantId]);
  const tenantStockAdjustments = useMemo(() => (stockAdjustments || []).filter((a) => a && a.tenant_id === currentTenantId), [stockAdjustments, currentTenantId]);
  const tenantStockAudits = useMemo(() => (stockAudits || []).filter((sa) => sa && sa.tenant_id === currentTenantId), [stockAudits, currentTenantId]);
  const tenantCounters = useMemo(() => (counters || []).filter((c) => c && c.tenant_id === currentTenantId), [counters, currentTenantId]);
  const tenantCounterShifts = useMemo(() => (counterShifts || []).filter((cs) => cs && cs.tenant_id === currentTenantId), [counterShifts, currentTenantId]);
  const tenantCashDrawerTransactions = useMemo(() => (cashDrawerTransactions || []).filter((tx) => tx && tx.tenant_id === currentTenantId), [cashDrawerTransactions, currentTenantId]);

  const tenantMessages = useMemo(() => {
    if (isSuperAdminMode) return adminShopMessages || [];
    return (adminShopMessages || []).filter((msg) => {
      if (!msg) return false;
      if (msg.target_type === 'ALL_SHOPS' || msg.target_tenant_ids?.includes('ALL')) return true;
      if (msg.target_tenant_ids?.includes(currentTenantId)) return true;
      if (msg.target_type === 'BUSINESS_TYPE' && msg.target_business_type && currentTenant?.business_type === msg.target_business_type) return true;
      if (msg.target_type === 'LICENSE_STATUS' && msg.target_license_status && currentLicense?.status === msg.target_license_status) return true;
      return false;
    });
  }, [adminShopMessages, currentTenantId, isSuperAdminMode, currentTenant?.business_type, currentLicense?.status]);

  const unreadTenantMessagesCount = useMemo(() => {
    if (isSuperAdminMode) return 0;
    return tenantMessages.filter((m) => !m.read_by_tenants?.[currentTenantId]).length;
  }, [tenantMessages, currentTenantId, isSuperAdminMode]);

  const urgentUnreadMessage = useMemo(() => {
    if (isSuperAdminMode) return undefined;
    return tenantMessages.find((m) => m.priority === 'URGENT' && !m.read_by_tenants?.[currentTenantId]);
  }, [tenantMessages, currentTenantId, isSuperAdminMode]);
  
  const activeCounter = useMemo(() => {
    return tenantCounters.find((c) => c.id === terminalStation.counter_id) || tenantCounters[0];
  }, [tenantCounters, terminalStation.counter_id]);

  const activeShift = useMemo(() => {
    if (!activeCounter?.current_shift_id) {
      // Find open shift on active counter or any open shift for this tenant
      return tenantCounterShifts.find((s) => s.counter_id === activeCounter?.id && s.status === 'OPEN') ||
             tenantCounterShifts.find((s) => s.status === 'OPEN');
    }
    return tenantCounterShifts.find((s) => s.id === activeCounter.current_shift_id && s.status === 'OPEN');
  }, [tenantCounterShifts, activeCounter]);

  // Current physical cash inside the cash drawer (Sri Lankan Rupees)
  const currentDrawerCashBalance = useMemo(() => {
    if (!activeShift) return 0;
    const baseFloat = activeShift.opening_float || 0;
    const cashSales = activeShift.total_cash_sales || 0;
    
    // Shift specific drawer movements
    const shiftTxs = tenantCashDrawerTransactions.filter((t) => t.shift_id === activeShift.id);
    const midDayDeposits = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0);
    const payoutsAndWithdrawals = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT' || t.type === 'DAY_END_WITHDRAWAL').reduce((sum, t) => sum + (t.amount || 0), 0);
    const refunds = activeShift.total_refunds || 0;
    
    // If shift payouts recorded directly
    const shiftPayouts = activeShift.total_payouts || 0;
    const totalDeductions = Math.max(payoutsAndWithdrawals, shiftPayouts);

    return Math.max(0, baseFloat + cashSales + midDayDeposits - totalDeductions - refunds);
  }, [activeShift, tenantCashDrawerTransactions]);

  // --- Super Admin Actions ---
  const getNextTenantId = (existingTenants: Tenant[]): string => {
    const existingIds = new Set((existingTenants || []).map((t) => t.tenant_id));
    let num = 1;
    while (existingIds.has(`SHOP${String(num).padStart(3, '0')}`)) {
      num++;
    }
    return `SHOP${String(num).padStart(3, '0')}`;
  };

  const createTenant = (tenantData: Partial<Tenant>, initialPackage: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'PROFESSIONAL') => {
    const newTenantId = getNextTenantId(tenants);
    const nextNum = parseInt(newTenantId.replace('SHOP', ''), 10) || (tenants.length + 1);
    const newTenant: Tenant = {
      tenant_id: newTenantId,
      shop_name: tenantData.shop_name || `New Retail Shop ${nextNum}`,
      company_name: tenantData.company_name || `${tenantData.shop_name || 'Retail'} Lanka (Pvt) Ltd`,
      business_type: tenantData.business_type || 'grocery',
      branch_id: `BR-${newTenantId}-01`,
      branch_name: 'Main Branch',
      address: tenantData.address || 'Colombo, Sri Lanka',
      phone: tenantData.phone || '+94 11 000 0000',
      email: tenantData.email || `contact@shop${String(nextNum).padStart(3, '0')}.lk`,
      br_number: tenantData.br_number || `PV-${80000 + nextNum}`,
      vat_number: tenantData.vat_number || `VAT-${100000000 + nextNum}`,
      logo_url: tenantData.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
      currency: tenantData.currency || 'LKR',
      currency_symbol: 'Rs.',
      created_at: new Date().toISOString(),
    };

    const newLicense: TenantLicense = {
      tenant_id: newTenantId,
      status: 'ACTIVE',
      warning_message: '',
      suspend_reason: '',
      license_key: `WCS-${initialPackage.substring(0, 3)}-LK-${Math.floor(10000 + Math.random() * 90000)}-2027`,
      package_tier: initialPackage,
      max_branches: initialPackage === 'ENTERPRISE' ? 10 : initialPackage === 'PROFESSIONAL' ? 3 : 1,
      max_users: initialPackage === 'ENTERPRISE' ? 25 : initialPackage === 'PROFESSIONAL' ? 8 : 3,
      max_products: 999999, // Unlimited catalog items & SKUs
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      auto_renew: true,
      grace_period_days: 14,
      last_sync: new Date().toISOString(),
      offline_grace_hours_remaining: 72,
    };

    const isGrocery = newTenant.business_type === 'grocery';
    const isMotor = newTenant.business_type === 'motor_parts';
    const isRestaurant = newTenant.business_type === 'restaurant';
    const isPharmacy = newTenant.business_type === 'pharmacy';
    const isWholesale = newTenant.business_type === 'wholesale';
    const isComputer = newTenant.business_type === 'computer_shop';
    const isPhone = newTenant.business_type === 'phone_shop';
    const isVehicleService = newTenant.business_type === 'vehicle_service';
    const isHardware = newTenant.business_type === 'hardware_shop';

    const header = isComputer
      ? `${newTenant.shop_name} - Computer Systems, Laptops & Chip-Level Repair Center`
      : isPhone
      ? `${newTenant.shop_name} - Genuine Smartphones & Original Accessories`
      : isRestaurant
      ? `${newTenant.shop_name} - Restaurant & Cafe`
      : isMotor
      ? `${newTenant.shop_name} - Genuine Auto Spare Parts & Accessories`
      : `Welcome to ${newTenant.shop_name}`;

    const footer = isComputer
      ? '3 Years Warranty on PC Hardware & Laptops. 90 Days Service Warranty on Repairs. Keep receipt safe.'
      : isPhone
      ? '1 Year Company Warranty on Smartphones. 6 Months Warranty on Fast Chargers. TRCSL Approved.'
      : isPharmacy
      ? 'Medicines cannot be returned once taken outside by NMRA law.'
      : 'Thank you for your business! Please visit us again.';

    const terms = isComputer
      ? 'Warranty void if warranty sticker removed or damaged. Repaired devices must be collected within 30 days.'
      : isPhone
      ? 'Warranty covers hardware manufacturing defects only. Water and physical damages void warranty.'
      : 'Items can be exchanged within 7 days with valid receipt.';

    const newSettings: TenantSettings = {
      tenant_id: newTenantId,
      invoice_header: header,
      invoice_footer: footer,
      thank_you_message: 'Have a great day!',
      terms_conditions: terms,
      default_tax_rate: isRestaurant ? 10 : 0,
      tax_name: isRestaurant ? 'Service Charge 10%' : 'VAT 0%',
      default_receipt_type: isWholesale ? 'a4' : '80mm',
      show_logo_on_bill: true,
      show_tax_breakdown: isRestaurant,
      allow_negative_stock: isMotor || isWholesale || isComputer || isHardware,
      allow_credit_sales: true,
      enable_loyalty: !isMotor,
      enable_weighing_scale: isGrocery || isWholesale || isHardware,
      sound_effects_enabled: true,
      print_bridge_connected: true,
      print_bridge_ip: '127.0.0.1:9100',
      enabled_modules: {
        grocery_weight: isGrocery || isWholesale || isHardware,
        vehicle_parts: isMotor || isVehicleService,
        restaurant_kot: isRestaurant,
        pharmacy_batch: isPharmacy,
        wholesale_credit: isWholesale || isMotor || isGrocery || isComputer || isPhone,
        barcode_studio: true,
        staff_salaries: true,
        expense_tracker: true,
        expiry_manager: isGrocery || isPharmacy || isRestaurant,
        phone_imei_warranty: isPhone,
        computer_specs: isComputer,
        repair_job_sheet: isPhone || isComputer,
        hardware_metrics: isHardware,
        vehicle_service_station: isVehicleService,
      },
    };

    const ownerUser: UserAccount = {
      id: `USER_${newTenantId}_OWNER`,
      tenant_id: newTenantId,
      username: `${newTenantId.toLowerCase()}_owner`,
      full_name: `${newTenant.shop_name} Owner`,
      email: newTenant.email,
      role: 'OWNER',
      pin_code: '1234',
      is_active: true,
      avatar_color: isComputer ? '#0284c7' : isPhone ? '#6366f1' : '#4f46e5',
    };

    // Auto-seed Custom Fields for the new tenant
    const seededCustomFields: CustomFieldDefinition[] = [];
    if (isComputer) {
      seededCustomFields.push(
        {
          id: `CF_${newTenantId}_01`,
          tenant_id: newTenantId,
          field_key: 'processor_spec',
          field_label: 'Processor / CPU',
          field_type: 'text',
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
          placeholder: 'e.g. Intel Core i7 13700H / AMD Ryzen 7 7800X3D',
        },
        {
          id: `CF_${newTenantId}_02`,
          tenant_id: newTenantId,
          field_key: 'ram_capacity',
          field_label: 'RAM Memory',
          field_type: 'select',
          options: ['8GB DDR4', '16GB DDR4', '16GB DDR5', '32GB DDR5', '64GB DDR5'],
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
        },
        {
          id: `CF_${newTenantId}_03`,
          tenant_id: newTenantId,
          field_key: 'storage_drive',
          field_label: 'Primary Storage',
          field_type: 'select',
          options: ['256GB NVMe SSD', '512GB NVMe Gen4', '1TB NVMe Gen4', '2TB NVMe Gen4', '1TB HDD'],
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
        },
        {
          id: `CF_${newTenantId}_04`,
          tenant_id: newTenantId,
          field_key: 'warranty_years',
          field_label: 'Warranty',
          field_type: 'select',
          options: ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years Limited'],
          is_required: true,
          show_in_pos: true,
          show_in_invoice: true,
        }
      );
    } else if (isPhone) {
      seededCustomFields.push(
        {
          id: `CF_${newTenantId}_01`,
          tenant_id: newTenantId,
          field_key: 'imei_number',
          field_label: 'IMEI / Serial No',
          field_type: 'text',
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
          placeholder: 'e.g. 356789123456789',
        },
        {
          id: `CF_${newTenantId}_02`,
          tenant_id: newTenantId,
          field_key: 'storage_capacity',
          field_label: 'Storage',
          field_type: 'select',
          options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
        },
        {
          id: `CF_${newTenantId}_03`,
          tenant_id: newTenantId,
          field_key: 'warranty_months',
          field_label: 'Warranty Period',
          field_type: 'select',
          options: ['No Warranty (Checking only)', '1 Month', '3 Months', '6 Months', '1 Year Company', '2 Years Official'],
          is_required: true,
          show_in_pos: true,
          show_in_invoice: true,
        },
        {
          id: `CF_${newTenantId}_04`,
          tenant_id: newTenantId,
          field_key: 'device_color',
          field_label: 'Color Variant',
          field_type: 'text',
          is_required: false,
          show_in_pos: true,
          show_in_invoice: true,
          placeholder: 'e.g. Space Black / Titanium / Blue',
        }
      );
    }

    // Auto-seed Categories for the new tenant
    const seededCategories: Category[] = [];
    if (isComputer) {
      seededCategories.push(
        { id: `CAT_${newTenantId}_01`, tenant_id: newTenantId, name: 'Laptops & Notebooks', icon_name: 'laptop', color: '#0284c7' },
        { id: `CAT_${newTenantId}_02`, tenant_id: newTenantId, name: 'Desktops & All-In-One', icon_name: 'monitor', color: '#6366f1' },
        { id: `CAT_${newTenantId}_03`, tenant_id: newTenantId, name: 'PC Components & RAM/SSD', icon_name: 'cpu', color: '#8b5cf6' },
        { id: `CAT_${newTenantId}_04`, tenant_id: newTenantId, name: 'Hardware & Chip Repair Services', icon_name: 'wrench', color: '#f59e0b' },
        { id: `CAT_${newTenantId}_05`, tenant_id: newTenantId, name: 'Monitors & Peripherals', icon_name: 'keyboard', color: '#10b981' }
      );
    } else if (isPhone) {
      seededCategories.push(
        { id: `CAT_${newTenantId}_01`, tenant_id: newTenantId, name: 'Smartphones & Flagships', icon_name: 'smartphone', color: '#6366f1' },
        { id: `CAT_${newTenantId}_02`, tenant_id: newTenantId, name: 'Fast Chargers & Cables', icon_name: 'zap', color: '#f59e0b' },
        { id: `CAT_${newTenantId}_03`, tenant_id: newTenantId, name: 'Screen Protectors & Cases', icon_name: 'shield', color: '#ec4899' },
        { id: `CAT_${newTenantId}_04`, tenant_id: newTenantId, name: 'Phone Repair Services', icon_name: 'wrench', color: '#3b82f6' },
        { id: `CAT_${newTenantId}_05`, tenant_id: newTenantId, name: 'Audio & Wireless Earbuds', icon_name: 'headphones', color: '#10b981' }
      );
    }

    // Auto-seed Starter Products for the new tenant
    const seededProducts: Product[] = [];
    if (isComputer) {
      seededProducts.push(
        {
          id: `PROD_${newTenantId}_01`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Lenovo ThinkPad E14 Gen 5 Core i7 16GB/512GB',
          sku: 'LAP-TP-E14',
          barcode: '47901002001',
          category: 'Laptops & Notebooks',
          brand: 'Lenovo',
          cost_price: 265000,
          selling_price: 298000,
          wholesale_price: 285000,
          stock_quantity: 6,
          reorder_level: 2,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            processor_spec: 'Intel Core i7 1355U (10-Core)',
            ram_capacity: '16GB DDR4',
            storage_drive: '512GB NVMe Gen4',
            warranty_years: '3 Years',
          },
        },
        {
          id: `PROD_${newTenantId}_02`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Kingston NV2 1TB PCIe 4.0 NVMe M.2 SSD',
          sku: 'SSD-KNG-1TB',
          barcode: '47901002002',
          category: 'PC Components & RAM/SSD',
          brand: 'Kingston',
          cost_price: 19500,
          selling_price: 24500,
          wholesale_price: 22000,
          stock_quantity: 18,
          reorder_level: 5,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            storage_drive: '1TB NVMe Gen4',
            warranty_years: '3 Years',
          },
        },
        {
          id: `PROD_${newTenantId}_03`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Laptop Full Service & Thermal Paste Overhaul',
          sku: 'SRV-LTP-CLN',
          barcode: '47901002003',
          category: 'Hardware & Chip Repair Services',
          brand: 'Service',
          cost_price: 500,
          selling_price: 3500,
          wholesale_price: 3000,
          stock_quantity: 999,
          reorder_level: 1,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            warranty_years: '1 Year',
          },
        },
        {
          id: `PROD_${newTenantId}_04`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Motherboard Chip-Level Power IC Repair Service',
          sku: 'SRV-MB-CHIP',
          barcode: '47901002004',
          category: 'Hardware & Chip Repair Services',
          brand: 'Service',
          cost_price: 3000,
          selling_price: 14500,
          wholesale_price: 12000,
          stock_quantity: 999,
          reorder_level: 1,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            warranty_years: '6 Months',
          },
        }
      );
    } else if (isPhone) {
      seededProducts.push(
        {
          id: `PROD_${newTenantId}_01`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Apple iPhone 15 Pro 256GB Natural Titanium',
          sku: 'IPH-15P-256',
          barcode: '47902003001',
          category: 'Smartphones & Flagships',
          brand: 'Apple',
          cost_price: 345000,
          selling_price: 379000,
          wholesale_price: 365000,
          stock_quantity: 4,
          reorder_level: 2,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            imei_number: '356789123456789',
            storage_capacity: '256GB',
            warranty_months: '1 Year Company',
            device_color: 'Natural Titanium',
          },
        },
        {
          id: `PROD_${newTenantId}_02`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Anker 65W GaN Fast Charger 3-Port',
          sku: 'ANK-65W-GAN',
          barcode: '47902003002',
          category: 'Fast Chargers & Cables',
          brand: 'Anker',
          cost_price: 11000,
          selling_price: 14500,
          wholesale_price: 13000,
          stock_quantity: 22,
          reorder_level: 5,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            warranty_months: '6 Months',
            device_color: 'Matte Black',
          },
        },
        {
          id: `PROD_${newTenantId}_03`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'iPhone Original OLED Display Replacement Service',
          sku: 'SRV-IPH-DISP',
          barcode: '47902003003',
          category: 'Phone Repair Services',
          brand: 'Service',
          cost_price: 24000,
          selling_price: 32000,
          wholesale_price: 29000,
          stock_quantity: 999,
          reorder_level: 1,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            warranty_months: '3 Months',
          },
        },
        {
          id: `PROD_${newTenantId}_04`,
          tenant_id: newTenantId,
          branch_id: `BR-${newTenantId}-01`,
          name: 'Original 100% Health Battery Replacement Service',
          sku: 'SRV-BAT-ORIG',
          barcode: '47902003004',
          category: 'Phone Repair Services',
          brand: 'Service',
          cost_price: 7500,
          selling_price: 12500,
          wholesale_price: 10500,
          stock_quantity: 999,
          reorder_level: 1,
          unit: 'pcs',
          is_active: true,
          custom_fields: {
            warranty_months: '6 Months',
          },
        }
      );
    }

    // Auto-seed Initial Repair Jobs for Computer & Phone shops
    const seededRepairJobs: RepairJob[] = [];
    if (isComputer) {
      seededRepairJobs.push(
        {
          id: `JOB_${newTenantId}_01`,
          job_no: `REP-${newTenantId.substring(4)}-101`,
          tenant_id: newTenantId,
          customer_name: 'Roshan Samarasinghe',
          customer_phone: '+94 77 123 9988',
          device_type: 'LAPTOP',
          device_brand: 'ASUS',
          device_model: 'ZenBook 14 UX425',
          imei_or_serial: 'SN-ASUS-98214',
          issue_description: 'Display flickering and left hinge mounting broken. Overheating under load.',
          technician_name: 'Nuwan Perera',
          status: 'DIAGNOSING',
          estimated_cost: 18500,
          advance_paid: 5000,
          labor_charge: 6500,
          spare_parts_used: [],
          final_amount: 18500,
          warranty_period: '90 Days Service Warranty',
          notes: 'Customer provided charger. Cleaned interior and inspected hinge.',
          created_at: new Date().toISOString(),
        },
        {
          id: `JOB_${newTenantId}_02`,
          job_no: `REP-${newTenantId.substring(4)}-102`,
          tenant_id: newTenantId,
          customer_name: 'Kavindi Fernando',
          customer_phone: '+94 71 889 2233',
          device_type: 'LAPTOP',
          device_brand: 'HP',
          device_model: 'Pavilion Gaming 15',
          imei_or_serial: 'SN-HP-77120',
          issue_description: 'No power after lightning storm. Charging LED blinking white.',
          technician_name: 'Nuwan Perera',
          status: 'WAITING_FOR_PARTS',
          estimated_cost: 16000,
          advance_paid: 3000,
          labor_charge: 7000,
          spare_parts_used: [],
          final_amount: 16000,
          warranty_period: '90 Days Service Warranty',
          notes: 'Main 19V rail shorted. Awaiting replacement power management IC.',
          created_at: new Date().toISOString(),
        }
      );
    } else if (isPhone) {
      seededRepairJobs.push(
        {
          id: `JOB_${newTenantId}_01`,
          job_no: `REP-${newTenantId.substring(4)}-101`,
          tenant_id: newTenantId,
          customer_name: 'Dinesh Wickramasinghe',
          customer_phone: '+94 77 982 1144',
          device_type: 'MOBILE_PHONE',
          device_brand: 'Apple',
          device_model: 'iPhone 14 Pro 128GB',
          imei_or_serial: '358901234567890',
          security_lock_pin: '2580',
          issue_description: 'Cracked front OLED screen and TrueTone sensor check after heavy drop.',
          technician_name: 'Nuwan Perera',
          status: 'READY_FOR_PICKUP',
          estimated_cost: 38000,
          advance_paid: 10000,
          labor_charge: 6000,
          spare_parts_used: [],
          final_amount: 38000,
          warranty_period: '3 Months Display Warranty',
          notes: 'New OEM OLED screen fitted and TrueTone data programmed.',
          created_at: new Date().toISOString(),
        },
        {
          id: `JOB_${newTenantId}_02`,
          job_no: `REP-${newTenantId.substring(4)}-102`,
          tenant_id: newTenantId,
          customer_name: 'Anoma Jayakody',
          customer_phone: '+94 70 334 5566',
          device_type: 'MOBILE_PHONE',
          device_brand: 'Samsung',
          device_model: 'Galaxy A54 5G',
          imei_or_serial: '351234987654321',
          issue_description: 'Battery draining rapidly in 3 hours & USB-C port loose/not fast charging.',
          technician_name: 'Nuwan Perera',
          status: 'RECEIVED',
          estimated_cost: 14500,
          advance_paid: 2000,
          labor_charge: 4500,
          spare_parts_used: [],
          final_amount: 14500,
          warranty_period: '6 Months Battery Warranty',
          notes: 'Device taken with original silicone cover. Battery health test scheduled.',
          created_at: new Date().toISOString(),
        }
      );
    }

    setTenants((prev) => [...prev, newTenant]);
    setLicenses((prev) => ({ ...prev, [newTenantId]: newLicense }));
    setSettings((prev) => ({ ...prev, [newTenantId]: newSettings }));
    setUsers((prev) => [...prev, ownerUser]);

    if (seededCustomFields.length > 0) {
      setCustomFields((prev) => [...prev, ...seededCustomFields]);
    }
    if (seededCategories.length > 0) {
      setCategories((prev) => [...prev, ...seededCategories]);
    }
    if (seededProducts.length > 0) {
      setProducts((prev) => [...prev, ...seededProducts]);
    }
    if (seededRepairJobs.length > 0) {
      setRepairJobs((prev) => [...prev, ...seededRepairJobs]);
    }

    return newTenantId;
  };

  const deleteTenantShop = (tenantId: string) => {
    if (tenantId === 'SUPER_ADMIN') {
      return { success: false, message: 'Cannot delete Super Admin Headquarters.' };
    }
    if (tenants.length <= 1) {
      return { success: false, message: 'Cannot delete the only remaining store.' };
    }

    const tenantToDelete = tenants.find((t) => t.tenant_id === tenantId);
    const shopName = tenantToDelete?.shop_name || tenantId;

    // Filter out all tenant-specific data
    setTenants((prev) => prev.filter((t) => t.tenant_id !== tenantId));
    setLicenses((prev) => {
      const copy = { ...prev };
      delete copy[tenantId];
      return copy;
    });
    setSettings((prev) => {
      const copy = { ...prev };
      delete copy[tenantId];
      return copy;
    });
    setUsers((prev) => prev.filter((u) => u.tenant_id !== tenantId));
    setProducts((prev) => prev.filter((p) => p.tenant_id !== tenantId));
    setCategories((prev) => prev.filter((c) => c.tenant_id !== tenantId));
    setCustomFields((prev) => prev.filter((cf) => cf.tenant_id !== tenantId));
    setCustomers((prev) => prev.filter((c) => c.tenant_id !== tenantId));
    setSuppliers((prev) => prev.filter((s) => s.tenant_id !== tenantId));
    setSales((prev) => prev.filter((s) => s.tenant_id !== tenantId));
    setSaleReturns((prev) => prev.filter((sr) => sr.tenant_id !== tenantId));
    setPurchases((prev) => prev.filter((p) => p.tenant_id !== tenantId));
    setPurchaseReturns((prev) => prev.filter((pr) => pr.tenant_id !== tenantId));
    setPayouts((prev) => prev.filter((p) => p.tenant_id !== tenantId));
    setExpenses((prev) => prev.filter((e) => e.tenant_id !== tenantId));
    setEmployees((prev) => prev.filter((emp) => emp.tenant_id !== tenantId));
    setSalaries((prev) => prev.filter((sal) => sal.tenant_id !== tenantId));
    setAdvances((prev) => prev.filter((adv) => adv.tenant_id !== tenantId));
    setPromotions((prev) => prev.filter((p) => p.tenant_id !== tenantId));
    setRepairJobs((prev) => prev.filter((rj) => rj.tenant_id !== tenantId));
    setVehicleServiceJobs((prev) => prev.filter((vs) => vs.tenant_id !== tenantId));
    setStockAdjustments((prev) => prev.filter((sa) => sa.tenant_id !== tenantId));
    setStockAudits((prev) => prev.filter((sa) => sa.tenant_id !== tenantId));

    if (currentTenantId === tenantId) {
      const remaining = tenants.filter((t) => t.tenant_id !== tenantId);
      const nextTenant = remaining.find((t) => t.tenant_id !== 'SUPER_ADMIN') || remaining[0];
      const nextId = nextTenant?.tenant_id || 'SUPER_ADMIN';
      setCurrentTenantId(nextId);

      // Find user for the next shop or fallback
      const remainingUsers = users.filter((u) => u.tenant_id !== tenantId);
      const nextUser = remainingUsers.find((u) => u.tenant_id === nextId) || {
        id: `USER_${nextId}_admin`,
        tenant_id: nextId,
        username: 'admin',
        full_name: 'Store Administrator',
        role: 'ADMIN' as const,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setCurrentUser(nextUser as any);
      setAuthSession({
        isAuthenticated: true,
        authType: nextId === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'SHOP_USER',
        tenantId: nextId,
        user: nextUser as any,
        loginTime: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Shop "${shopName}" (${tenantId}) and all associated catalog, sales, and accounting records have been permanently deleted.`,
    };
  };

  const batchCreateShops = (
    shopsToCreate: Array<{
      shop_name: string;
      company_name?: string;
      business_type: BusinessType;
      package_tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
      address?: string;
      phone?: string;
      email?: string;
      owner_full_name?: string;
      owner_username?: string;
      owner_password?: string;
      owner_pin?: string;
    }>
  ) => {
    if (!shopsToCreate || shopsToCreate.length === 0) {
      return { success: false, count: 0, createdTenants: [], message: 'No shop configuration provided.' };
    }

    const createdList: Tenant[] = [];
    let currentPool = [...tenants];
    const newLicensesMap: Record<string, TenantLicense> = {};
    const newSettingsMap: Record<string, TenantSettings> = {};
    const newUsersList: UserAccount[] = [];
    const newCustomFieldsList: CustomFieldDefinition[] = [];
    const newCategoriesList: Category[] = [];
    const newProductsList: Product[] = [];
    const newRepairJobsList: RepairJob[] = [];

    for (const shopItem of shopsToCreate) {
      const newTenantId = getNextTenantId(currentPool);
      const nextNum = parseInt(newTenantId.replace('SHOP', ''), 10) || (currentPool.length + 1);
      const tier = shopItem.package_tier || 'PROFESSIONAL';

      const newTenant: Tenant = {
        tenant_id: newTenantId,
        shop_name: shopItem.shop_name.trim() || `New Store ${nextNum}`,
        company_name: shopItem.company_name?.trim() || `${shopItem.shop_name.trim() || 'Store'} (Pvt) Ltd`,
        business_type: shopItem.business_type || 'grocery',
        branch_id: `BR-${newTenantId}-01`,
        branch_name: 'Main Branch',
        address: shopItem.address?.trim() || 'Colombo, Sri Lanka',
        phone: shopItem.phone?.trim() || '+94 11 200 0000',
        email: shopItem.email?.trim() || `contact@shop${String(nextNum).padStart(3, '0')}.lk`,
        br_number: `PV-${80000 + nextNum}`,
        vat_number: `VAT-${100000000 + nextNum}`,
        logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
        currency: 'LKR',
        currency_symbol: 'Rs.',
        created_at: new Date().toISOString(),
      };

      const newLicense: TenantLicense = {
        tenant_id: newTenantId,
        status: 'ACTIVE',
        warning_message: '',
        suspend_reason: '',
        license_key: `WCS-${tier.substring(0, 3)}-LK-${Math.floor(10000 + Math.random() * 90000)}-2027`,
        package_tier: tier,
        max_branches: tier === 'ENTERPRISE' ? 10 : tier === 'PROFESSIONAL' ? 3 : 1,
        max_users: tier === 'ENTERPRISE' ? 25 : tier === 'PROFESSIONAL' ? 8 : 3,
        max_products: 999999, // Unlimited SKUs & Products
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        grace_period_days: 14,
        last_sync: new Date().toISOString(),
        offline_grace_hours_remaining: 72,
        assigned_shop_name: newTenant.shop_name,
        is_provisioned: true,
      };

      const isGrocery = newTenant.business_type === 'grocery';
      const isMotor = newTenant.business_type === 'motor_parts';
      const isRestaurant = newTenant.business_type === 'restaurant';
      const isPharmacy = newTenant.business_type === 'pharmacy';
      const isWholesale = newTenant.business_type === 'wholesale';
      const isComputer = newTenant.business_type === 'computer_shop';
      const isPhone = newTenant.business_type === 'phone_shop';
      const isVehicleService = newTenant.business_type === 'vehicle_service';
      const isHardware = newTenant.business_type === 'hardware_shop';

      const newSettings: TenantSettings = {
        tenant_id: newTenantId,
        invoice_header: `${newTenant.shop_name} - ${newTenant.company_name}`,
        invoice_footer: 'Thank you for your business! Please visit us again.',
        thank_you_message: 'Have a great day!',
        terms_conditions: 'Items can be exchanged within 7 days with valid receipt.',
        default_tax_rate: isRestaurant ? 10 : 0,
        tax_name: isRestaurant ? 'Service Charge 10%' : 'VAT 0%',
        default_receipt_type: isWholesale ? 'a4' : '80mm',
        show_logo_on_bill: true,
        show_tax_breakdown: isRestaurant,
        allow_negative_stock: isMotor || isWholesale || isComputer || isHardware,
        allow_credit_sales: true,
        enable_loyalty: !isMotor,
        enable_weighing_scale: isGrocery || isWholesale || isHardware,
        sound_effects_enabled: true,
        print_bridge_connected: true,
        print_bridge_ip: '127.0.0.1:9100',
        enabled_modules: {
          grocery_weight: isGrocery || isWholesale || isHardware,
          vehicle_parts: isMotor || isVehicleService,
          restaurant_kot: isRestaurant,
          pharmacy_batch: isPharmacy,
          wholesale_credit: isWholesale || isMotor || isGrocery || isComputer || isPhone,
          barcode_studio: true,
          staff_salaries: true,
          expense_tracker: true,
          expiry_manager: isGrocery || isPharmacy || isRestaurant,
          phone_imei_warranty: isPhone,
          computer_specs: isComputer,
          repair_job_sheet: isPhone || isComputer,
          hardware_metrics: isHardware,
          vehicle_service_station: isVehicleService,
        },
      };

      const ownerUser: UserAccount = {
        id: `USER_${newTenantId}_01`,
        tenant_id: newTenantId,
        username: (shopItem.owner_username?.trim() || `${newTenantId.toLowerCase()}_admin`).toLowerCase(),
        full_name: shopItem.owner_full_name?.trim() || `${newTenant.shop_name} Owner`,
        email: shopItem.email?.trim() || newTenant.email,
        role: 'OWNER',
        pin_code: shopItem.owner_pin?.trim() || '1234',
        password: shopItem.owner_password?.trim() || 'password123',
        is_active: true,
        avatar_color: isComputer ? '#0284c7' : isPhone ? '#6366f1' : isPharmacy ? '#059669' : '#4f46e5',
      };

      currentPool.push(newTenant);
      createdList.push(newTenant);
      newLicensesMap[newTenantId] = newLicense;
      newSettingsMap[newTenantId] = newSettings;
      newUsersList.push(ownerUser);
    }

    // Batch apply updates
    setTenants((prev) => [...prev, ...createdList]);
    setLicenses((prev) => ({ ...prev, ...newLicensesMap }));
    setSettings((prev) => ({ ...prev, ...newSettingsMap }));
    setUsers((prev) => [...prev, ...newUsersList]);

    return {
      success: true,
      count: createdList.length,
      createdTenants: createdList,
      message: `Successfully batch-provisioned ${createdList.length} unlimited shops with isolated environments.`,
    };
  };

  const updateTenantLicense = (tenantId: string, updates: Partial<TenantLicense>) => {
    setLicenses((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        ...updates,
        last_sync: new Date().toISOString(),
      },
    }));
  };

  const setLicenseStatus = (tenantId: string, status: LicenseStatus, warningMsg?: string, reason?: string) => {
    setLicenses((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        status,
        warning_message: warningMsg !== undefined ? warningMsg : prev[tenantId]?.warning_message || '',
        suspend_reason: reason !== undefined ? reason : prev[tenantId]?.suspend_reason || '',
        last_sync: new Date().toISOString(),
      },
    }));
  };

  const updateTenantModules = (tenantId: string, modules: Partial<TenantSettings['enabled_modules']>) => {
    setSettings((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        enabled_modules: {
          ...prev[tenantId].enabled_modules,
          ...modules,
        },
      },
    }));
  };

  const broadcastRiskAlert = (tenantId: string, alert: Omit<RiskAlert, 'id' | 'created_at' | 'is_acknowledged'>) => {
    const newAlert: RiskAlert = {
      id: `ALERT-${Date.now()}`,
      tenant_id: tenantId,
      ...alert,
      created_at: new Date().toISOString(),
      is_acknowledged: false,
    };
    setRiskAlerts((prev) => [newAlert, ...prev]);
  };

  const acknowledgeRiskAlert = (alertId: string) => {
    setRiskAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_acknowledged: true } : a))
    );
  };

  // --- Super Admin to Shop Direct & Multi-Select Messaging ---
  const sendAdminShopMessage = (
    msgData: Omit<AdminShopMessage, 'id' | 'created_at' | 'read_by_tenants' | 'acknowledged_by_tenants'>
  ): AdminShopMessage => {
    const msgId = `MSG-WCS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    let targetNames = msgData.target_shop_names;
    if (!targetNames || targetNames.length === 0) {
      if (msgData.target_type === 'ALL_SHOPS' || msgData.target_tenant_ids?.includes('ALL')) {
        targetNames = ['All Registered Stores'];
      } else {
        targetNames = (msgData.target_tenant_ids || []).map((id) => {
          const matched = tenants.find((t) => t.tenant_id === id);
          return matched ? `${matched.shop_name} (${id})` : id;
        });
      }
    }

    const newMsg: AdminShopMessage = {
      ...msgData,
      id: msgId,
      target_shop_names: targetNames,
      created_at: new Date().toISOString(),
      created_by: currentUser?.full_name || 'Super Admin HQ',
      read_by_tenants: {},
      acknowledged_by_tenants: {},
    };

    setAdminShopMessages((prev) => [newMsg, ...prev]);
    return newMsg;
  };

  const markMessageAsRead = (messageId: string, userName?: string) => {
    const targetShop = currentTenantId;
    const reader = userName || currentUser?.full_name || currentUser?.username || 'Shop User';
    setAdminShopMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const updatedReads = {
            ...(msg.read_by_tenants || {}),
            [targetShop]: {
              read_at: new Date().toISOString(),
              user_name: reader,
            },
          };
          return { ...msg, read_by_tenants: updatedReads };
        }
        return msg;
      })
    );
  };

  const acknowledgeMessage = (messageId: string, replyNotes?: string, userName?: string) => {
    const targetShop = currentTenantId;
    const acknowledger = userName || currentUser?.full_name || currentUser?.username || 'Shop Manager';
    setAdminShopMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const updatedAcks = {
            ...(msg.acknowledged_by_tenants || {}),
            [targetShop]: {
              acknowledged_at: new Date().toISOString(),
              user_name: acknowledger,
              reply_notes: replyNotes || 'Acknowledged and confirmed by store manager.',
            },
          };
          const updatedReads = {
            ...(msg.read_by_tenants || {}),
            [targetShop]: {
              read_at: new Date().toISOString(),
              user_name: acknowledger,
            },
          };
          return { ...msg, acknowledged_by_tenants: updatedAcks, read_by_tenants: updatedReads };
        }
        return msg;
      })
    );
  };

  const deleteAdminShopMessage = (messageId: string) => {
    setAdminShopMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  // --- Super Admin Master Password & Security Controls ---
  const verifySuperAdminPassword = (password: string): boolean => {
    const clean = password ? password.trim() : '';
    if (!clean) return true; // Optional manual password entry
    
    // Check custom master password
    if (superAdminPassword && clean === superAdminPassword.trim()) {
      return true;
    }
    
    // Fallback standard factory defaults for system recovery
    if (clean === 'admin123' || clean === 'admin' || clean === '9999' || clean === 'superadmin') {
      return true;
    }

    // Check against SUPER_ADMIN account in users list
    const superUser = users.find((u) => u.role === 'SUPER_ADMIN');
    if (superUser) {
      if (superUser.password && clean === superUser.password.trim()) return true;
      if (superUser.pin_code && clean === superUser.pin_code.trim()) return true;
    }
    return false;
  };

  const authenticateSuperAdmin = (password: string): boolean => {
    if (verifySuperAdminPassword(password)) {
      setIsSuperAdminAuthenticated(true);
      setCurrentTenantId('SUPER_ADMIN');
      const superUser = users.find((u) => u.role === 'SUPER_ADMIN') || INITIAL_USERS[0];
      if (superUser) {
        setCurrentUser(superUser);
      }
      const adminSession: AuthSession = {
        isAuthenticated: true,
        authType: 'SUPER_ADMIN',
        tenantId: 'SUPER_ADMIN',
        user: superUser,
        loginTime: new Date().toISOString(),
      };
      setAuthSession(adminSession);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_session', JSON.stringify(adminSession));
      return true;
    }
    return false;
  };

  const setSuperAdminPassword = (newPassword: string, hint?: string) => {
    const cleanPw = newPassword.trim();
    if (!cleanPw) return;

    setSuperAdminPasswordState(cleanPw);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'superadmin_password', cleanPw);

    const now = new Date().toISOString();
    setSuperAdminPasswordUpdatedAtState(now);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'superadmin_password_updated_at', now);

    if (hint !== undefined) {
      const cleanHint = hint.trim();
      setSuperAdminPasswordHintState(cleanHint);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'superadmin_password_hint', cleanHint);
    }

    // Sync SUPER_ADMIN user password in users list
    setUsers((prevUsers) => {
      const updated = prevUsers.map((u) =>
        u.role === 'SUPER_ADMIN' ? { ...u, password: cleanPw } : u
      );
      localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated));
      return updated;
    });

    setIsSuperAdminAuthenticated(true);
  };

  const lockSuperAdmin = () => {
    setIsSuperAdminAuthenticated(false);
    if (currentTenantId === 'SUPER_ADMIN') {
      const fallbackTenant = tenants.find((t) => t.tenant_id !== 'SUPER_ADMIN')?.tenant_id || 'SHOP001';
      setCurrentTenantId(fallbackTenant);
      const ownerUser = users.find((u) => u.tenant_id === fallbackTenant && u.role === 'OWNER') || INITIAL_USERS[1];
      if (ownerUser) {
        setCurrentUser(ownerUser);
      }
      const fallbackSession: AuthSession = {
        isAuthenticated: true,
        authType: 'SHOP_USER',
        tenantId: fallbackTenant,
        user: ownerUser,
        loginTime: new Date().toISOString(),
      };
      setAuthSession(fallbackSession);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_session', JSON.stringify(fallbackSession));
    }
  };

  const resetSuperAdminPasswordToDefault = () => {
    setSuperAdminPassword('admin123', 'Default master password: admin123');
  };

  // --- Multi-Tenant Shop Login & Authentication ---
  const loginShopUser = (credentials: {
    shopIdOrLicense?: string;
    tenantId?: string;
    usernameOrEmail?: string;
    username?: string;
    passwordOrPin?: string;
    password?: string;
    role?: UserRole;
  }) => {
    const rawUser = credentials.usernameOrEmail || credentials.username || '';
    const rawPass = credentials.passwordOrPin || credentials.password || '';
    const term = rawUser.trim().toLowerCase().replace(/^@+/, '');
    const secret = rawPass.trim();
    const targetShopId = (credentials.shopIdOrLicense || credentials.tenantId || '').trim().toUpperCase();

    if (!term && !credentials.role) {
      return { success: false, message: 'Please enter your username, email, or select a role.' };
    }

    // Find matching user across database
    let matchedUser: UserAccount | undefined = undefined;

    // 1. Direct username/email match (prefer targetShopId if specified)
    if (term) {
      if (targetShopId) {
        matchedUser = users.find(
          (u) =>
            u.is_active &&
            u.tenant_id.toUpperCase() === targetShopId &&
            (u.username.toLowerCase() === term || u.email.toLowerCase() === term)
        );
      }
      if (!matchedUser) {
        matchedUser = users.find(
          (u) =>
            u.is_active &&
            (u.username.toLowerCase() === term || u.email.toLowerCase() === term)
        );
      }
    }

    // 2. Role alias or direct role match (e.g. 'owner', 'admin', 'cashier', 'user', 'associate', 'sales_associate')
    if (!matchedUser && (credentials.role || term === 'owner' || term === 'admin' || term === 'cashier' || term === 'user' || term === 'associate' || term === 'sales_associate' || term === 'shop_associate')) {
      const isAssocTerm = term === 'associate' || term === 'sales_associate' || term === 'shop_associate' || credentials.role === 'SHOP_ASSOCIATE' || credentials.role === 'SALES_ASSOCIATE';
      const searchRole: UserRole = credentials.role || (
        term === 'owner' ? 'OWNER' :
        term === 'admin' ? 'ADMIN' :
        isAssocTerm ? 'SHOP_ASSOCIATE' :
        term === 'cashier' || term === 'user' ? 'CASHIER' : 'CASHIER'
      );

      if (targetShopId) {
        matchedUser = users.find(
          (u) => u.is_active && u.tenant_id.toUpperCase() === targetShopId && (u.role === searchRole || (isAssocTerm && (u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE' || u.is_shop_associate)))
        );
      }
      if (!matchedUser) {
        const activeTenantId = currentTenantId || 'SHOP001';
        matchedUser = users.find(
          (u) => u.is_active && u.tenant_id === activeTenantId && (u.role === searchRole || (isAssocTerm && (u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE' || u.is_shop_associate)))
        ) || users.find(
          (u) => u.is_active && (u.role === searchRole || (isAssocTerm && (u.role === 'SHOP_ASSOCIATE' || u.role === 'SALES_ASSOCIATE' || u.is_shop_associate)))
        );
      }
    }

    if (!matchedUser) {
      return {
        success: false,
        message: `Account not found for "${rawUser || credentials.role}". Please check your credentials or select a valid shop.`,
      };
    }

    // If Super Admin credentials used in shop login
    if (matchedUser.role === 'SUPER_ADMIN') {
      const isValid = verifySuperAdminPassword(secret) || secret === matchedUser.password || secret === matchedUser.pin_code;
      if (isValid) {
        authenticateSuperAdmin(secret);
        return { success: true, message: 'Super Admin HQ unlocked.', user: matchedUser };
      }
      return { success: false, message: 'Invalid Super Admin password or PIN.' };
    }

    // Check password / PIN matching
    const userPass = matchedUser.password ? matchedUser.password.trim() : '';
    const userPin = matchedUser.pin_code ? matchedUser.pin_code.trim() : '';

    // If user has no password set (password removed), password is not required (or matches if entered)
    const hasNoPassword = !userPass;
    const isPinMatch = userPin && userPin === secret;
    const isPassMatch = hasNoPassword || (userPass && (userPass.toLowerCase() === secret.toLowerCase() || userPass === secret));
    const isStandardDemoPass = !secret || secret === '1234' || secret === 'password123' || secret === 'pass' || secret === 'owner' || secret === 'admin' || secret === 'owner123' || secret === 'admin123' || secret === 'pass123';

    if (!hasNoPassword && !isPinMatch && !isPassMatch && !isStandardDemoPass) {
      return { success: false, message: 'Incorrect password or PIN code. Please try again.' };
    }

    // Check shop ID or License Key restriction if provided
    const shopRestriction = credentials.shopIdOrLicense || credentials.tenantId;
    if (shopRestriction && shopRestriction.trim()) {
      const shopTerm = shopRestriction.trim().toUpperCase();
      const shopTenant = tenants.find((t) => t.tenant_id.toUpperCase() === shopTerm || t.shop_name.toUpperCase().includes(shopTerm));
      const lic = (Object.values(licenses) as TenantLicense[]).find((l: TenantLicense) => l.license_key && l.license_key.toUpperCase() === shopTerm);

      const targetTenantId = shopTenant ? shopTenant.tenant_id : lic ? lic.tenant_id : shopTerm;

      if (matchedUser.tenant_id.toUpperCase() !== targetTenantId.toUpperCase()) {
        return {
          success: false,
          message: `This user account belongs to a different store and is not authorized for ${shopRestriction}.`,
        };
      }
    }

    const tenant = tenants.find((t) => t.tenant_id === matchedUser.tenant_id);
    if (!tenant) {
      return { success: false, message: 'Associated retail shop profile could not be found.' };
    }

    // Check License Status
    const lic = licenses[matchedUser.tenant_id];
    if (lic && (lic.status === 'SUSPENDED' || lic.status === 'DEACTIVATED')) {
      return {
        success: false,
        message: `Store access suspended: ${lic.suspend_reason || 'License subscription inactive'}. Please contact administrator.`,
      };
    }

    // Complete login
    setCurrentTenantId(matchedUser.tenant_id);
    setCurrentUser(matchedUser);
    setIsSuperAdminAuthenticated(false);

    const newSession: AuthSession = {
      isAuthenticated: true,
      authType: 'SHOP_USER',
      tenantId: matchedUser.tenant_id,
      user: matchedUser,
      loginTime: new Date().toISOString(),
    };
    setAuthSession(newSession);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_session', JSON.stringify(newSession));

    return {
      success: true,
      message: `Welcome back, ${matchedUser.full_name}! Connected to ${tenant.shop_name}.`,
      user: matchedUser,
      tenant,
    };
  };

  const logoutSession = () => {
    setIsSuperAdminAuthenticated(false);
    const clearedSession: AuthSession = {
      isAuthenticated: false,
      authType: null,
      tenantId: undefined,
      user: undefined,
    };
    setAuthSession(clearedSession);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_session', JSON.stringify(clearedSession));
  };

  // --- License Generation & Provisioning ---
  const generateLicense = (params: {
    tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    clientName: string;
    clientContact?: string;
    customKey?: string;
    durationMonths?: number;
    maxBranches?: number;
    maxUsers?: number;
    maxProducts?: number;
    allowedModules?: Record<string, boolean>;
    notes?: string;
  }): TenantLicense => {
    const tier = params.tier || 'PROFESSIONAL';
    const prefix = tier === 'ENTERPRISE' ? 'ENT' : tier === 'PROFESSIONAL' ? 'PRO' : 'STR';
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const months = Number(params.durationMonths) || 12;
    const durationTag = months === 1 ? '01M' : months === 3 ? '03M' : months === 6 ? '06M' : months === 12 ? '12M' : `${months}M`;
    const year = new Date().getFullYear();
    const generatedKey = params.customKey?.trim().toUpperCase() || `WCS-${prefix}-${durationTag}-${randomNum}-${year}`;

    const validFrom = new Date().toISOString();
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);
    const validUntil = expDate.toISOString();

    const newLic: TenantLicense = {
      tenant_id: 'UNASSIGNED',
      status: 'ACTIVE',
      warning_message: '',
      suspend_reason: '',
      license_key: generatedKey,
      package_tier: tier,
      duration_months: months,
      is_device_disabled: false,
      disabled_message: '',
      max_branches: params.maxBranches ?? (tier === 'ENTERPRISE' ? 10 : tier === 'PROFESSIONAL' ? 3 : 1),
      max_users: params.maxUsers ?? (tier === 'ENTERPRISE' ? 25 : tier === 'PROFESSIONAL' ? 8 : 3),
      max_products: params.maxProducts ?? 999999, // Unlimited products for all created shops
      valid_from: validFrom,
      valid_until: validUntil,
      auto_renew: true,
      grace_period_days: tier === 'ENTERPRISE' ? 30 : tier === 'PROFESSIONAL' ? 14 : 7,
      last_sync: new Date().toISOString(),
      offline_grace_hours_remaining: tier === 'ENTERPRISE' ? 120 : 72,
      issued_to_client: params.clientName,
      client_contact: params.clientContact || '',
      is_provisioned: false,
      created_at: new Date().toISOString(),
      notes: params.notes || `Generated license for ${params.clientName}`,
      allowed_modules: params.allowedModules,
    };

    const licenseId = `LIC_${generatedKey.replace(/[^A-Z0-9]/g, '_')}`;
    setLicenses((prev) => ({
      ...prev,
      [licenseId]: newLic,
    }));

    return newLic;
  };

  const validateLicenseKey = (licenseKey: string) => {
    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey) {
      return { isValid: false, message: 'Please enter a valid license key.' };
    }

    const allEntries = Object.entries(licenses) as [string, TenantLicense][];
    const found = allEntries.find(([_, lic]) => lic && lic.license_key && lic.license_key.toUpperCase() === cleanKey);

    if (!found) {
      return { isValid: false, valid: false, message: 'License key not recognized in WCS Cloud Registry.', reason: 'License key not recognized in WCS Cloud Registry.' };
    }

    const [_, lic] = found as [string, TenantLicense];

    if (lic.status === 'SUSPENDED' || lic.status === 'DEACTIVATED') {
      const msg = `This license has been ${lic.status.toLowerCase()} by WCS Administration: ${lic.suspend_reason || 'Inactive'}.`;
      return {
        isValid: false,
        valid: false,
        license: lic,
        message: msg,
        reason: msg,
      };
    }

    const isExpired = new Date(lic.valid_until).getTime() < Date.now();
    if (isExpired) {
      const msg = 'This license key has expired. Please contact WCS Sales for renewal.';
      return {
        isValid: false,
        valid: false,
        license: lic,
        message: msg,
        reason: msg,
      };
    }

    const isAlreadyUsed = Boolean(lic.is_provisioned && lic.tenant_id && lic.tenant_id !== 'UNASSIGNED');
    const msg = isAlreadyUsed
      ? `License is active and currently assigned to store: ${lic.assigned_shop_name || lic.tenant_id}.`
      : `Valid ${lic.package_tier} License key! Issued to ${lic.issued_to_client || 'Client'}. Ready for activation.`;

    return {
      isValid: true,
      valid: true,
      license: lic,
      isAlreadyUsed,
      message: msg,
      reason: msg,
    };
  };

  const activateShopWithLicense = (
    licenseKeyOrParams:
      | string
      | {
          license_key: string;
          shop_name: string;
          company_name?: string;
          business_type?: BusinessType;
          owner_full_name?: string;
          owner_username?: string;
          owner_password?: string;
          owner_pin?: string;
        },
    shopDataArg?: Partial<Tenant>,
    ownerDataArg?: {
      fullName: string;
      username: string;
      email?: string;
      password?: string;
      pin_code?: string;
      role?: UserRole;
    }
  ) => {
    let licenseKey: string;
    let shopData: Partial<Tenant>;
    let ownerData: {
      fullName: string;
      username: string;
      email: string;
      password?: string;
      pin_code?: string;
      role?: UserRole;
    };

    if (typeof licenseKeyOrParams === 'object') {
      licenseKey = licenseKeyOrParams.license_key;
      shopData = {
        shop_name: licenseKeyOrParams.shop_name,
        company_name: licenseKeyOrParams.company_name,
        business_type: licenseKeyOrParams.business_type || 'grocery',
      };
      ownerData = {
        fullName: licenseKeyOrParams.owner_full_name || 'Store Owner',
        username: licenseKeyOrParams.owner_username || 'owner',
        email: `${licenseKeyOrParams.owner_username || 'owner'}@shop.lk`,
        password: licenseKeyOrParams.owner_password || 'owner123',
        pin_code: licenseKeyOrParams.owner_pin || '1234',
        role: 'ADMIN',
      };
    } else {
      licenseKey = licenseKeyOrParams;
      shopData = shopDataArg || {};
      ownerData = {
        fullName: ownerDataArg?.fullName || 'Store Owner',
        username: ownerDataArg?.username || 'owner',
        email: ownerDataArg?.email || `${ownerDataArg?.username || 'owner'}@shop.lk`,
        password: ownerDataArg?.password || 'owner123',
        pin_code: ownerDataArg?.pin_code || '1234',
        role: ownerDataArg?.role || 'ADMIN',
      };
    }
    const valResult = validateLicenseKey(licenseKey);
    if (!valResult.isValid || !valResult.license) {
      return { success: false, message: valResult.message };
    }

    const matchedLic: TenantLicense = valResult.license;
    const newTenantId = getNextTenantId(tenants);
    const nextNum = parseInt(newTenantId.replace('SHOP', ''), 10) || (tenants.length + 1);

    const newTenant: Tenant = {
      tenant_id: newTenantId,
      shop_name: shopData.shop_name?.trim() || matchedLic.issued_to_client || `Retail Shop ${nextNum}`,
      company_name: shopData.company_name?.trim() || `${shopData.shop_name || 'Retail'} (Pvt) Ltd`,
      business_type: shopData.business_type || 'grocery',
      branch_id: `BR-${newTenantId}-01`,
      branch_name: shopData.branch_name || 'Main Branch',
      address: shopData.address || 'Colombo, Sri Lanka',
      phone: shopData.phone || matchedLic.client_contact || '+94 11 200 3000',
      email: shopData.email || ownerData.email || `info@shop${String(nextNum).padStart(3, '0')}.lk`,
      br_number: shopData.br_number || `PV-${85000 + nextNum}`,
      vat_number: shopData.vat_number || `VAT-${100000000 + nextNum}`,
      logo_url: shopData.logo_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=160&auto=format&fit=crop&q=80',
      currency: shopData.currency || 'LKR',
      currency_symbol: 'Rs.',
      created_at: new Date().toISOString(),
    };

    const updatedLicense: TenantLicense = {
      ...matchedLic,
      tenant_id: newTenantId,
      status: 'ACTIVE',
      assigned_shop_name: newTenant.shop_name,
      is_provisioned: true,
      last_sync: new Date().toISOString(),
    };

    const isGrocery = newTenant.business_type === 'grocery';
    const isMotor = newTenant.business_type === 'motor_parts';
    const isRestaurant = newTenant.business_type === 'restaurant' || newTenant.business_type === 'restaurant_hotel';
    const isHotel = newTenant.business_type === 'hotel' || newTenant.business_type === 'restaurant_hotel';
    const isPharmacy = newTenant.business_type === 'pharmacy';
    const isWholesale = newTenant.business_type === 'wholesale';
    const isComputer = newTenant.business_type === 'computer_shop';
    const isPhone = newTenant.business_type === 'phone_shop';
    const isVehicleService = newTenant.business_type === 'vehicle_service';
    const isHardware = newTenant.business_type === 'hardware_shop';

    const header = `${newTenant.shop_name} - ${newTenant.company_name}`;
    const footer = 'Thank you for shopping with us! Please come again.';
    const terms = 'Exchanges accepted within 7 days with original receipt in undamaged condition.';

    const newSettings: TenantSettings = {
      tenant_id: newTenantId,
      invoice_header: header,
      invoice_footer: footer,
      thank_you_message: 'Have a great day!',
      terms_conditions: terms,
      default_tax_rate: (isRestaurant || isHotel) ? 10 : 0,
      tax_name: (isRestaurant || isHotel) ? 'Service Charge 10%' : 'VAT 0%',
      default_receipt_type: isWholesale ? 'a4' : '80mm',
      show_logo_on_bill: true,
      show_tax_breakdown: isRestaurant || isHotel,
      allow_negative_stock: isMotor || isWholesale || isComputer || isHardware,
      allow_credit_sales: true,
      enable_loyalty: !isMotor,
      enable_weighing_scale: isGrocery || isWholesale || isHardware,
      sound_effects_enabled: true,
      print_bridge_connected: true,
      print_bridge_ip: '127.0.0.1:9100',
      enabled_modules: {
        grocery_weight: isGrocery || isWholesale || isHardware,
        vehicle_parts: isMotor || isVehicleService,
        restaurant_kot: isRestaurant || isHotel,
        pharmacy_batch: isPharmacy,
        wholesale_credit: isWholesale || isMotor || isGrocery || isComputer || isPhone || isHotel,
        barcode_studio: true,
        staff_salaries: true,
        expense_tracker: true,
        expiry_manager: isGrocery || isPharmacy || isRestaurant || isHotel,
        phone_imei_warranty: isPhone,
        computer_specs: isComputer,
        repair_job_sheet: isPhone || isComputer,
        hardware_metrics: isHardware,
        vehicle_service_station: isVehicleService,
        ...(matchedLic.allowed_modules || {}),
      },
      restaurant_settings: (isRestaurant || isHotel) ? {
        enable_kot_print: true,
        auto_print_kot_on_bill: false,
        enable_takeaway: true,
        enable_dine_in_table: true,
        enable_delivery: true,
        table_selection_optional: true,
        default_order_type: 'TAKEAWAY',
        tables_list: isHotel
          ? ['T1', 'T2', 'T3', 'T4', 'T5', 'VIP Room', 'Room 101', 'Room 102', 'Room 201', 'Room 202', 'Penthouse Suite']
          : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'VIP-1', 'Garden-1'],
      } : undefined,
    };

    const newOwnerUser: UserAccount = {
      id: `USER_${newTenantId}_01`,
      tenant_id: newTenantId,
      username: ownerData.username.trim().toLowerCase(),
      full_name: ownerData.fullName.trim() || 'Store Administrator',
      email: ownerData.email.trim() || newTenant.email,
      role: ownerData.role || 'OWNER',
      pin_code: ownerData.pin_code || '1234',
      password: ownerData.password || 'password123',
      is_active: true,
      avatar_color: isComputer ? '#0284c7' : isPhone ? '#6366f1' : isPharmacy ? '#059669' : '#4f46e5',
    };

    // Add to state
    setTenants((prev) => [...prev, newTenant]);
    setLicenses((prev) => ({
      ...prev,
      [newTenantId]: updatedLicense,
    }));
    setSettings((prev) => ({
      ...prev,
      [newTenantId]: newSettings,
    }));
    setUsers((prev) => [...prev, newOwnerUser]);

    // Set active session ONLY if not operating inside Super Admin portal!
    // When Super Admin creates a shop in WCS Super Admin portal, do NOT display shop screen.
    if (!isSuperAdminAuthenticated && currentTenantId !== 'SUPER_ADMIN') {
      setCurrentTenantId(newTenantId);
      setCurrentUser(newOwnerUser);
      setIsSuperAdminAuthenticated(false);

      const newSession: AuthSession = {
        isAuthenticated: true,
        authType: 'SHOP_USER',
        tenantId: newTenantId,
        user: newOwnerUser,
        loginTime: new Date().toISOString(),
      };
      setAuthSession(newSession);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_session', JSON.stringify(newSession));
    }

    return {
      success: true,
      message: `Shop "${newTenant.shop_name}" created & activated successfully with License #${matchedLic.license_key}!`,
      tenant: newTenant,
    };
  };

  // --- Super Admin License Key Issuing & Remote Device Control ---
  const issueValidLicenseKey = (
    tenantId: string,
    durationMonths: 1 | 3 | 6 | 12 | number = 12,
    tier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    notes?: string
  ) => {
    const targetTenant = tenants.find((t) => t.tenant_id === tenantId);
    const existingLic = licenses[tenantId];
    const pkgTier = tier || existingLic?.package_tier || 'PROFESSIONAL';
    const prefix = pkgTier === 'ENTERPRISE' ? 'ENT' : pkgTier === 'STARTER' ? 'STR' : 'PRO';
    const months = Number(durationMonths) || 12;
    const durationTag = months === 1 ? '01M' : months === 3 ? '03M' : months === 6 ? '06M' : months === 12 ? '12M' : `${months}M`;
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    const newKey = `WCS-${prefix}-${durationTag}-${randomNum}-${year}`;

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);
    const validUntil = expDate.toISOString();

    const updatedLicense: TenantLicense = {
      ...(existingLic || {}),
      tenant_id: tenantId,
      status: 'ACTIVE',
      warning_message: '',
      suspend_reason: '',
      license_key: newKey,
      package_tier: pkgTier,
      max_branches: pkgTier === 'ENTERPRISE' ? 10 : pkgTier === 'PROFESSIONAL' ? 3 : 1,
      max_users: pkgTier === 'ENTERPRISE' ? 25 : pkgTier === 'PROFESSIONAL' ? 8 : 3,
      max_products: existingLic?.max_products || 999999,
      max_terminals: existingLic?.max_terminals || 5,
      duration_months: months,
      is_device_disabled: false,
      disabled_message: '',
      valid_from: new Date().toISOString(),
      valid_until: validUntil,
      auto_renew: true,
      grace_period_days: pkgTier === 'ENTERPRISE' ? 30 : pkgTier === 'PROFESSIONAL' ? 14 : 7,
      last_sync: new Date().toISOString(),
      offline_grace_hours_remaining: 72,
      assigned_shop_name: targetTenant?.shop_name || existingLic?.assigned_shop_name || tenantId,
      issued_to_client: targetTenant?.shop_name || existingLic?.issued_to_client || 'Store Owner',
      client_contact: targetTenant?.phone || existingLic?.client_contact || '',
      is_provisioned: true,
      notes: notes || `Valid ${durationTag} key issued by Super Admin Headquarters on ${new Date().toLocaleDateString()}`,
    };

    setLicenses((prev) => ({
      ...prev,
      [tenantId]: updatedLicense,
    }));

    // Unlock devices remotely for this tenant
    executeShopLockdown(tenantId, 'UNLOCK_ALL', 'License renewed with valid key by Headquarters.');
    setIsLocalDeviceLocked(false);
    setIsLocalDeviceBlocked(false);

    return {
      success: true,
      newKey,
      validUntil,
      durationTag,
      license: updatedLicense,
    };
  };

  const renewShopWithKey = (tenantId: string, renewalKey: string) => {
    const cleanKey = renewalKey.trim().toUpperCase();
    if (!cleanKey) {
      return { success: false, message: 'Please enter a valid license renewal key.' };
    }

    // Determine months from key tag
    let months = 12;
    if (cleanKey.includes('-01M-') || cleanKey.includes('-1M-')) months = 1;
    else if (cleanKey.includes('-03M-') || cleanKey.includes('-3M-')) months = 3;
    else if (cleanKey.includes('-06M-') || cleanKey.includes('-6M-')) months = 6;
    else if (cleanKey.includes('-12M-') || cleanKey.includes('-1Y-') || cleanKey.includes('-1YEAR-')) months = 12;

    // Determine tier from key
    let tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' = 'PROFESSIONAL';
    if (cleanKey.includes('-ENT-')) tier = 'ENTERPRISE';
    else if (cleanKey.includes('-STR-')) tier = 'STARTER';

    // Verify key format
    const isValidFormat = cleanKey.startsWith('WCS-') || cleanKey.split('-').length >= 3;
    if (!isValidFormat) {
      return {
        success: false,
        message: 'Invalid license key format. Key must be issued by Super Admin Headquarters (e.g. WCS-PRO-01M-XXXX-2026).',
      };
    }

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + months);
    const validUntil = expDate.toISOString();

    const existingLic = licenses[tenantId];
    const targetTenant = tenants.find((t) => t.tenant_id === tenantId);

    const updatedLicense: TenantLicense = {
      ...(existingLic || {}),
      tenant_id: tenantId,
      status: 'ACTIVE',
      warning_message: '',
      suspend_reason: '',
      license_key: cleanKey,
      package_tier: tier,
      max_branches: tier === 'ENTERPRISE' ? 10 : tier === 'PROFESSIONAL' ? 3 : 1,
      max_users: tier === 'ENTERPRISE' ? 25 : tier === 'PROFESSIONAL' ? 8 : 3,
      max_products: existingLic?.max_products || 999999,
      max_terminals: existingLic?.max_terminals || 5,
      duration_months: months,
      is_device_disabled: false,
      disabled_message: '',
      valid_from: new Date().toISOString(),
      valid_until: validUntil,
      auto_renew: true,
      grace_period_days: tier === 'ENTERPRISE' ? 30 : 14,
      last_sync: new Date().toISOString(),
      offline_grace_hours_remaining: 72,
      assigned_shop_name: targetTenant?.shop_name || existingLic?.assigned_shop_name || tenantId,
      is_provisioned: true,
      notes: `Renewed via Operating Device Entry with key ${cleanKey} for ${months} month(s)`,
    };

    setLicenses((prev) => ({
      ...prev,
      [tenantId]: updatedLicense,
    }));

    // Unlock local device and remote terminals
    setIsLocalDeviceLocked(false);
    setIsLocalDeviceBlocked(false);
    executeShopLockdown(tenantId, 'UNLOCK_ALL', 'Operating device re-enabled via valid key renewal.');

    return {
      success: true,
      message: `System operating device successfully re-enabled! Valid ${months} Month subscription active until ${expDate.toLocaleDateString()}.`,
      license: updatedLicense,
    };
  };

  const disableShopOperatingDevices = async (
    tenantId: string,
    disableMessage?: string,
    _reason?: string
  ) => {
    const defaultMsg = disableMessage || 'This system operating device has been disabled by Super Admin Headquarters. POS billing, checkout, and inventory operations are suspended.';

    setLicenseStatus(tenantId, 'SUSPENDED', defaultMsg, defaultMsg);
    setLicenses((prev) => {
      const lic = prev[tenantId];
      if (!lic) return prev;
      return {
        ...prev,
        [tenantId]: {
          ...lic,
          status: 'SUSPENDED',
          suspend_reason: defaultMsg,
          disabled_message: defaultMsg,
          is_device_disabled: true,
        },
      };
    });

    const res = await executeShopLockdown(tenantId, 'LOCK_ALL', defaultMsg);
    return res;
  };

  // --- Product & Inventory Actions ---
  const addProduct = (productData: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>) => {
    const newId = `PR-${currentTenantId}-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      tenant_id: currentTenantId,
      branch_id: currentTenant?.branch_id || 'BRANCH01',
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id && p.tenant_id === currentTenantId ? { ...p, ...updates } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => !(p.id === id && p.tenant_id === currentTenantId)));
  };

  const adjustStock = (id: string, newQuantity: number, _reason: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id && p.tenant_id === currentTenantId) {
          return { ...p, stock_quantity: newQuantity };
        }
        return p;
      })
    );
  };

  const recordStockAdjustment = (
    adjustmentData: Omit<StockAdjustmentRecord, 'id' | 'adjustment_no' | 'tenant_id' | 'created_at' | 'adjusted_by'>
  ): StockAdjustmentRecord => {
    const adjNum = `ADJ-${currentTenantId.substring(4) || '01'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: StockAdjustmentRecord = {
      ...adjustmentData,
      id: `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adjustment_no: adjNum,
      tenant_id: currentTenantId,
      adjusted_by: currentUser.full_name || 'Store Manager',
      created_at: new Date().toISOString(),
    };

    // Update the physical stock in the product master
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === newRecord.product_id && p.tenant_id === currentTenantId) {
          return {
            ...p,
            stock_quantity: Math.max(0, newRecord.physical_count),
          };
        }
        return p;
      })
    );

    setStockAdjustments((prev) => [newRecord, ...prev]);

    // Queue thermal print preview
    const sign = newRecord.gap_quantity > 0 ? `+${newRecord.gap_quantity}` : `${newRecord.gap_quantity}`;
    queuePrintJob(
      'THERMAL_80',
      `Stock Adjustment #${newRecord.adjustment_no}`,
      `Stock Gap Corrected: ${newRecord.product_name} | Gap: ${sign} ${newRecord.unit} | Value: ${currentTenant?.currency_symbol || 'Rs.'} ${Math.abs(newRecord.financial_variance_cost || 0).toLocaleString()} | Reason: ${newRecord.reason}`
    );

    return newRecord;
  };

  const batchReconcileStockAudit = (sessionData: {
    title: string;
    category_filter?: string;
    notes?: string;
    items: {
      product_id: string;
      physical_count: number;
      reason: StockGapReason;
      notes?: string;
    }[];
  }): StockAuditSession => {
    const sessionNum = `AUDIT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const createdAdjustments: StockAdjustmentRecord[] = [];

    let itemsWithGap = 0;
    let totalMissing = 0;
    let totalSurplus = 0;
    let totalLoss = 0;
    let totalGain = 0;

    // Process each item
    sessionData.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id && p.tenant_id === currentTenantId);
      if (!prod) return;

      const systemBefore = prod.stock_quantity;
      const physical = item.physical_count;
      const gap = physical - systemBefore;
      const costVariance = gap * prod.cost_price;
      const retailVariance = gap * prod.selling_price;

      if (gap !== 0) {
        itemsWithGap++;
        if (gap < 0) {
          totalMissing += Math.abs(gap);
          totalLoss += Math.abs(costVariance);
        } else {
          totalSurplus += gap;
          totalGain += costVariance;
        }
      }

      const adjRecord: StockAdjustmentRecord = {
        id: `ADJ-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        adjustment_no: `ADJ-${currentTenantId.substring(4) || '01'}-${Math.floor(1000 + Math.random() * 9000)}`,
        tenant_id: currentTenantId,
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        category: prod.category,
        unit: prod.unit,
        cost_price: prod.cost_price,
        selling_price: prod.selling_price,
        system_stock_before: systemBefore,
        physical_count: physical,
        gap_quantity: gap,
        financial_variance_cost: costVariance,
        financial_variance_retail: retailVariance,
        reason: item.reason || (gap < 0 ? 'MISSING_THEFT' : 'FOUND_SURPLUS'),
        notes: item.notes || sessionData.notes,
        adjusted_by: currentUser.full_name || 'Stock Auditor',
        created_at: new Date().toISOString(),
      };

      createdAdjustments.push(adjRecord);
    });

    // Update all product quantities in bulk
    setProducts((prev) =>
      prev.map((p) => {
        if (p.tenant_id !== currentTenantId) return p;
        const matchingItem = sessionData.items.find((i) => i.product_id === p.id);
        if (matchingItem !== undefined) {
          return {
            ...p,
            stock_quantity: Math.max(0, matchingItem.physical_count),
          };
        }
        return p;
      })
    );

    const auditSession: StockAuditSession = {
      id: `AUDIT-SESS-${Date.now()}`,
      session_no: sessionNum,
      tenant_id: currentTenantId,
      title: sessionData.title || `Stock Audit Count ${new Date().toLocaleDateString()}`,
      category_filter: sessionData.category_filter || 'ALL',
      items_counted: sessionData.items.length,
      items_with_gap: itemsWithGap,
      total_missing_qty: totalMissing,
      total_surplus_qty: totalSurplus,
      total_cost_loss: totalLoss,
      total_cost_gain: totalGain,
      net_financial_variance: totalGain - totalLoss,
      conducted_by: currentUser.full_name || 'Store Auditor',
      created_at: new Date().toISOString(),
      notes: sessionData.notes,
      adjustments: createdAdjustments,
    };

    setStockAdjustments((prev) => [...createdAdjustments, ...prev]);
    setStockAudits((prev) => [auditSession, ...prev]);

    queuePrintJob(
      'A4',
      `Audit Summary #${auditSession.session_no}`,
      `Stock Reconciliation Complete: ${auditSession.items_counted} counted, ${itemsWithGap} gap variances. Net Cost Variance: ${currentTenant?.currency_symbol || 'Rs.'} ${(auditSession.net_financial_variance || 0).toLocaleString()}`
    );

    return auditSession;
  };

  const deleteStockAdjustment = (id: string) => {
    setStockAdjustments((prev) => prev.filter((a) => !(a.id === id && a.tenant_id === currentTenantId)));
  };

  const deleteStockAuditSession = (id: string) => {
    setStockAudits((prev) => prev.filter((s) => !(s.id === id && s.tenant_id === currentTenantId)));
  };

  // --- Custom Fields Actions ---
  const addCustomField = (fieldData: Omit<CustomFieldDefinition, 'id' | 'tenant_id'>) => {
    const newField: CustomFieldDefinition = {
      ...fieldData,
      id: `CF_${currentTenantId}_${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomFieldDefinition>) => {
    setCustomFields((prev) =>
      prev.map((cf) => (cf.id === id && cf.tenant_id === currentTenantId ? { ...cf, ...updates } : cf))
    );
  };

  const deleteCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((cf) => !(cf.id === id && cf.tenant_id === currentTenantId)));
  };

  // --- Categories Actions ---
  const addCategory = (categoryData: Omit<Category, 'id' | 'tenant_id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `CAT_${currentTenantId}_${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id && c.tenant_id === currentTenantId ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => !(c.id === id && c.tenant_id === currentTenantId)));
  };

  // --- POS & Sales Actions ---
  const createSale = (
    saleData: Omit<Sale, 'id' | 'invoice_no' | 'tenant_id' | 'branch_id' | 'created_at'> & {
      cashier_id?: string;
      cashier_name?: string;
    }
  ) => {
    const invoiceNum = `INV-${currentTenantId}-${Math.floor(10000 + Math.random() * 90000)}`;
    const chosenCounterId = (saleData as any).counter_id || terminalStation.counter_id || activeCounter?.id || 'CTR-01';
    const chosenCounterName = (saleData as any).counter_name || terminalStation.counter_name || activeCounter?.name || 'Counter 01';
    
    const newSale: Sale = {
      ...saleData,
      id: `SALE-${Date.now()}`,
      invoice_no: invoiceNum,
      tenant_id: currentTenantId,
      branch_id: currentTenant?.branch_id || 'BRANCH01',
      cashier_id: saleData.cashier_id || currentUser?.id || 'USR-01',
      cashier_name: saleData.cashier_name || currentUser?.full_name || 'Cashier',
      counter_id: chosenCounterId,
      counter_name: chosenCounterName,
      terminal_id: terminalStation.station_type === 'COUNTER_POS' ? chosenCounterId : 'ADMIN_STATION',
      created_at: new Date().toISOString(),
    };

    // Deduct stock for items
    setProducts((prev) =>
      prev.map((p) => {
        if (p.tenant_id !== currentTenantId) return p;
        const soldItem = newSale.items.find((item) => item.product_id === p.id);
        if (soldItem) {
          const newQty = Math.max(0, p.stock_quantity - soldItem.quantity);
          return { ...p, stock_quantity: newQty };
        }
        return p;
      })
    );

    // If Credit Sale or has balance due, update Customer balance (Udalu)
    const effectiveBalanceDue = Number(newSale.balance_due) || (newSale.payment_method === 'CREDIT' ? Number(newSale.grand_total) || 0 : 0);
    if (newSale.customer_id && effectiveBalanceDue > 0) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newSale.customer_id && c.tenant_id === currentTenantId) {
            return {
              ...c,
              current_balance: (Number(c.current_balance) || 0) + effectiveBalanceDue,
            };
          }
          return c;
        })
      );
    }

    // Process Customer Loyalty Points (Redeem points used for bill payment & Award points earned)
    if (newSale.customer_id) {
      const redeemedPts = Number(newSale.loyalty_points_redeemed) || 0;
      // Award 1 point per 100 LKR spent on bill, or use explicit points earned
      const earnedPts = newSale.loyalty_points_earned !== undefined
        ? Number(newSale.loyalty_points_earned)
        : (currentSettings?.enable_loyalty !== false ? Math.floor((Number(newSale.grand_total) || 0) / 100) : 0);

      const targetCustomer = customers.find((c) => c.id === newSale.customer_id && c.tenant_id === currentTenantId);
      const currentPts = Number(targetCustomer?.loyalty_points) || 0;
      const nextPts = Math.max(0, currentPts - redeemedPts + earnedPts);

      newSale.loyalty_points_earned = earnedPts;
      newSale.loyalty_points_redeemed = redeemedPts;
      newSale.customer_loyalty_balance = nextPts;

      if (redeemedPts > 0 || earnedPts > 0) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === newSale.customer_id && c.tenant_id === currentTenantId) {
              return { ...c, loyalty_points: nextPts };
            }
            return c;
          })
        );
      }
    }

    // Update Counter Terminal Live Stats & Revenue
    const cashNetReceived = Math.max(0, (Number(newSale.paid_amount) || 0) - (Number(newSale.change_amount) || 0));
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === chosenCounterId && c.tenant_id === currentTenantId) {
          const isCash = newSale.payment_method === 'CASH';
          return {
            ...c,
            status: 'BILLING',
            last_active: new Date().toISOString(),
            current_cashier_id: currentUser.id,
            current_cashier_name: currentUser.full_name,
            total_bills_today: (c.total_bills_today || 0) + 1,
            total_revenue_today: (c.total_revenue_today || 0) + (Number(newSale.grand_total) || 0),
            current_float: isCash ? (Number(c.current_float) || 0) + cashNetReceived : (Number(c.current_float) || 0),
          };
        }
        return c;
      })
    );

    // Update open counter shift if active
    setCounterShifts((prev) =>
      prev.map((s) => {
        if (s.counter_id === chosenCounterId && s.tenant_id === currentTenantId && s.status === 'OPEN') {
          const isCash = newSale.payment_method === 'CASH';
          const isCard = newSale.payment_method === 'CARD';
          const isCredit = newSale.payment_method === 'CREDIT';
          const isBank = newSale.payment_method === 'BANK_TRANSFER';
          return {
            ...s,
            total_bills_count: (s.total_bills_count || 0) + 1,
            total_sales_amount: (Number(s.total_sales_amount) || 0) + (Number(newSale.grand_total) || 0),
            total_cash_sales: isCash ? (Number(s.total_cash_sales) || 0) + cashNetReceived : (Number(s.total_cash_sales) || 0),
            total_card_sales: isCard ? (Number(s.total_card_sales) || 0) + (Number(newSale.grand_total) || 0) : (Number(s.total_card_sales) || 0),
            total_credit_sales: isCredit ? (Number(s.total_credit_sales) || 0) + (Number(newSale.grand_total) || 0) : (Number(s.total_credit_sales) || 0),
            total_qr_bank_sales: isBank ? (Number(s.total_qr_bank_sales) || 0) + (Number(newSale.grand_total) || 0) : (Number(s.total_qr_bank_sales) || 0),
          };
        }
        return s;
      })
    );

    setSales((prev) => [newSale, ...prev]);

    // Dispatch automatic print job simulation
    queuePrintJob(
      newSale.receipt_type === '58mm' ? 'THERMAL_58' : newSale.receipt_type === 'a4' ? 'A4' : 'THERMAL_80',
      `Invoice #${newSale.invoice_no} (${chosenCounterName})`,
      `Receipt printed for ${newSale.invoice_no} at ${chosenCounterName} | Total: Rs. ${(newSale.grand_total || 0).toLocaleString()}`
    );

    return newSale;
  };

  const updateSale = (id: string, updates: Partial<Sale>) => {
    setSales((prev) =>
      prev.map((s) => (s.id === id && s.tenant_id === currentTenantId ? { ...s, ...updates } : s))
    );
  };

  const processSaleReturn = (
    returnData: Omit<SaleReturn, 'id' | 'return_no' | 'tenant_id' | 'created_at' | 'processed_by'>
  ): SaleReturn => {
    const newReturn: SaleReturn = {
      ...returnData,
      id: `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      return_no: `RTN-${currentTenantId}-${Math.floor(1000 + Math.random() * 9000)}`,
      tenant_id: currentTenantId,
      processed_by: currentUser?.full_name || currentUser?.username || 'Cashier',
      created_at: new Date().toISOString(),
    };

    // Restock returned items
    setProducts((prev) =>
      (prev || []).map((p) => {
        if (!p || p.tenant_id !== currentTenantId) return p;
        const returnItem = (newReturn.items || []).find((i) => i && i.product_id === p.id);
        const exchangeItem = (newReturn.exchange_items || []).find((i) => i && i.product_id === p.id);
        
        let newStock = Number(p.stock_quantity) || 0;
        if (returnItem) {
          newStock += Number(returnItem.return_quantity) || 0;
        }
        if (exchangeItem) {
          newStock = Math.max(0, newStock - (Number(exchangeItem.quantity) || 0));
        }
        
        return newStock !== p.stock_quantity ? { ...p, stock_quantity: newStock } : p;
      })
    );

    // If customer credit note or credit sale adjustment
    if (newReturn.customer_id && newReturn.refund_type === 'CREDIT_NOTE') {
      setCustomers((prev) =>
        (prev || []).map((c) => {
          if (c && c.id === newReturn.customer_id && c.tenant_id === currentTenantId) {
            const newBal = Math.max(0, (Number(c.current_balance) || 0) - (Number(newReturn.total_refund_amount) || 0));
            return { ...c, current_balance: newBal };
          }
          return c;
        })
      );
    }

    // Update sale status in sales array
    setSales((prev) =>
      (prev || []).map((s) => {
        if (s && s.invoice_no === newReturn.original_invoice_no && s.tenant_id === currentTenantId) {
          const totalReturnedItemsCount = (newReturn.items || []).reduce((acc, i) => acc + (Number(i.return_quantity) || 0), 0);
          const totalOriginalItemsCount = (s.items || []).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
          const newStatus = totalReturnedItemsCount >= totalOriginalItemsCount ? 'RETURNED' : 'PARTIALLY_RETURNED';
          return { ...s, status: newStatus as any };
        }
        return s;
      })
    );

    // If active shift exists, record refund in shift metrics
    if (activeShift) {
      setCounterShifts((prev) =>
        (prev || []).map((s) => {
          if (s && s.id === activeShift.id) {
            return {
              ...s,
              total_refunds: (Number(s.total_refunds) || 0) + (Number(newReturn.total_refund_amount) || 0),
            };
          }
          return s;
        })
      );
    }

    setSaleReturns((prev) => [newReturn, ...(prev || [])]);

    queuePrintJob(
      'THERMAL_80',
      `Return Note #${newReturn.return_no}`,
      `Return Note #${newReturn.return_no} for Inv #${newReturn.original_invoice_no} | Refund: ${currentTenant?.currency_symbol || 'Rs.'} ${(newReturn.total_refund_amount || 0).toLocaleString()}`
    );

    return newReturn;
  };

  // --- Customers & Credit Actions ---
  const addCustomer = (customerData: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `CUST-${currentTenantId}-${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id && c.tenant_id === currentTenantId ? { ...c, ...updates } : c))
    );
  };

  const recordCustomerPayment = (
    payment: Omit<CustomerPayment, 'id' | 'tenant_id' | 'payment_date' | 'received_by'>
  ) => {
    const newPayment: CustomerPayment = {
      ...payment,
      id: `CPAY-${Date.now()}`,
      tenant_id: currentTenantId,
      payment_date: new Date().toISOString(),
      received_by: currentUser?.full_name || 'Cashier',
    };
    setCustomerPayments((prev) => [newPayment, ...prev]);

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === payment.customer_id && c.tenant_id === currentTenantId) {
          const newBalance = Math.max(0, c.current_balance - payment.amount);
          return { ...c, current_balance: newBalance };
        }
        return c;
      })
    );
  };

  const adjustCustomerLoyaltyPoints = (customerId: string, pointsDelta: number, reason?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId && c.tenant_id === currentTenantId) {
          const currentPts = Number(c.loyalty_points) || 0;
          const nextPts = Math.max(0, currentPts + pointsDelta);
          return { ...c, loyalty_points: nextPts };
        }
        return c;
      })
    );
  };

  // --- Suppliers & Purchase Actions ---
  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'tenant_id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `SUP-${currentTenantId}-${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id && s.tenant_id === currentTenantId ? { ...s, ...updates } : s))
    );
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => !(s.id === id && s.tenant_id === currentTenantId)));
  };

  const recordSupplierPayment = (
    payment: Omit<SupplierPayment, 'id' | 'tenant_id' | 'payment_date' | 'paid_by'>
  ) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === payment.supplier_id && s.tenant_id === currentTenantId) {
          const newBalance = Math.max(0, s.balance_payable - payment.amount);
          return { ...s, balance_payable: newBalance };
        }
        return s;
      })
    );
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'po_number' | 'tenant_id'>) => {
    const poNumber = `PO-${currentTenantId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${Date.now()}`,
      po_number: poNumber,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    };
    setPurchases((prev) => [newPO, ...prev]);

    // If marked received upon creation, update stock & batch records
    if (poData.status === 'RECEIVED') {
      setProducts((prodPrev) =>
        prodPrev.map((p) => {
          if (p.tenant_id !== currentTenantId) return p;
          const poItem = poData.items.find((item) => item.product_id === p.id);
          if (poItem) {
            const newStock = p.stock_quantity + poItem.quantity;
            let updatedBatches = p.batches || [];
            if (poItem.batch_no) {
              updatedBatches = [
                ...updatedBatches,
                {
                  batch_no: poItem.batch_no,
                  expiry_date: poItem.expiry_date || '',
                  quantity: poItem.quantity,
                  stock_quantity: poItem.quantity,
                  cost_price: poItem.unit_cost,
                  selling_price: p.selling_price,
                },
              ];
            }
            return {
              ...p,
              stock_quantity: newStock,
              cost_price: poItem.unit_cost,
              batches: updatedBatches,
            };
          }
          return p;
        })
      );
    }

    // If there is an outstanding balance, update supplier balance_payable
    if (poData.balance_due > 0) {
      setSuppliers((suppPrev) =>
        suppPrev.map((s) => {
          if (s.id === poData.supplier_id && s.tenant_id === currentTenantId) {
            return { ...s, balance_payable: (s.balance_payable || 0) + poData.balance_due };
          }
          return s;
        })
      );
    }

    return newPO;
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchases((prev) =>
      prev.map((po) => (po.id === id && po.tenant_id === currentTenantId ? { ...po, ...updates } : po))
    );
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchases((prev) => prev.filter((po) => !(po.id === id && po.tenant_id === currentTenantId)));
  };

  const receivePurchaseOrder = (poId: string) => {
    setPurchases((prev) =>
      prev.map((po) => {
        if (po.id === poId && po.tenant_id === currentTenantId && po.status !== 'RECEIVED') {
          // Add inward stock to products
          setProducts((prodPrev) =>
            prodPrev.map((p) => {
              if (p.tenant_id !== currentTenantId) return p;
              const poItem = po.items.find((item) => item.product_id === p.id);
              if (poItem) {
                const newStock = p.stock_quantity + poItem.quantity;
                let updatedBatches = p.batches || [];
                if (poItem.batch_no) {
                  updatedBatches = [
                    ...updatedBatches,
                    {
                      batch_no: poItem.batch_no,
                      expiry_date: poItem.expiry_date || '',
                      stock_quantity: poItem.quantity,
                      cost_price: poItem.unit_cost,
                      selling_price: p.selling_price,
                    },
                  ];
                }
                return {
                  ...p,
                  stock_quantity: newStock,
                  cost_price: poItem.unit_cost,
                  batches: updatedBatches,
                };
              }
              return p;
            })
          );

          // If there is outstanding balance due, update supplier payable
          if (po.balance_due > 0) {
            setSuppliers((suppPrev) =>
              suppPrev.map((s) => {
                if (s.id === po.supplier_id && s.tenant_id === currentTenantId) {
                  return { ...s, balance_payable: (s.balance_payable || 0) + po.balance_due };
                }
                return s;
              })
            );
          }

          return { ...po, status: 'RECEIVED' as const };
        }
        return po;
      })
    );
  };

  const processPurchaseReturn = (
    retData: Omit<PurchaseReturn, 'id' | 'return_number' | 'tenant_id' | 'created_at' | 'processed_by'>
  ) => {
    const returnNumber = `DN-${currentTenantId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReturn: PurchaseReturn = {
      ...retData,
      id: `PRTN-${Date.now()}`,
      return_number: returnNumber,
      tenant_id: currentTenantId,
      processed_by: currentUser.full_name,
      created_at: new Date().toISOString(),
    };

    setPurchaseReturns((prev) => [newReturn, ...prev]);

    // Deduct returned stock from inventory
    setProducts((prodPrev) =>
      prodPrev.map((p) => {
        if (p.tenant_id !== currentTenantId) return p;
        const retItem = retData.items.find((item) => item.product_id === p.id);
        if (retItem) {
          const newStock = Math.max(0, p.stock_quantity - retItem.return_quantity);
          return { ...p, stock_quantity: newStock };
        }
        return p;
      })
    );

    // If DEBIT_NOTE, deduct credit amount from supplier's balance_payable
    if (retData.refund_type === 'DEBIT_NOTE') {
      setSuppliers((suppPrev) =>
        suppPrev.map((s) => {
          if (s.id === retData.supplier_id && s.tenant_id === currentTenantId) {
            const newBalance = Math.max(0, (s.balance_payable || 0) - retData.total_return_amount);
            return { ...s, balance_payable: newBalance };
          }
          return s;
        })
      );
    }

    return newReturn;
  };

  const deletePurchaseReturn = (id: string) => {
    setPurchaseReturns((prev) => prev.filter((r) => !(r.id === id && r.tenant_id === currentTenantId)));
  };

  // --- Payout Actions ---
  const recordPayout = (
    payoutData: Omit<Payout, 'id' | 'payout_no' | 'tenant_id' | 'created_at' | 'authorized_by'>
  ) => {
    const payoutNo = `PAY-${currentTenantId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayout: Payout = {
      ...payoutData,
      id: `PAY-${Date.now()}`,
      payout_no: payoutNo,
      tenant_id: currentTenantId,
      authorized_by: currentUser.full_name,
      cashier_id: currentUser.id,
      created_at: new Date().toISOString(),
    };

    setPayouts((prev) => [newPayout, ...prev]);
    return newPayout;
  };

  const deletePayout = (id: string) => {
    setPayouts((prev) => prev.filter((p) => !(p.id === id && p.tenant_id === currentTenantId)));
  };

  // --- Finance & HR Actions ---
  const addExpense = (expenseData: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `EXP-${Date.now()}`,
      tenant_id: currentTenantId,
      recorded_by: currentUser.full_name,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => !(e.id === id && e.tenant_id === currentTenantId)));
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'tenant_id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `EMP-${currentTenantId}-${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
    };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id && e.tenant_id === currentTenantId ? { ...e, ...updates } : e))
    );
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => !(e.id === id && e.tenant_id === currentTenantId)));
  };

  const recordSalaryPayment = (salaryData: Omit<SalaryRecord, 'id' | 'tenant_id' | 'processed_by'>) => {
    const slipNumber = salaryData.slip_no || `SLIP-${currentTenantId}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newSal: SalaryRecord = {
      ...salaryData,
      id: `SAL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      slip_no: slipNumber,
      tenant_id: currentTenantId,
      processed_by: currentUser.full_name,
      created_at: new Date().toISOString(),
    };
    setSalaries((prev) => [newSal, ...prev]);

    // If advances were deducted, mark all approved advances for this employee as DEDUCTED
    const advancesDeductedAmount = salaryData.advances_deducted || salaryData.advance_deductions || 0;
    if (advancesDeductedAmount > 0) {
      setAdvances((prev) =>
        prev.map((adv) =>
          adv.tenant_id === currentTenantId &&
          (adv.employee_id === salaryData.employee_id || (salaryData.user_id && adv.employee_id === salaryData.user_id)) &&
          adv.status === 'APPROVED'
            ? { ...adv, status: 'DEDUCTED' }
            : adv
        )
      );
    }
  };

  const updateSalaryPayment = (id: string, updates: Partial<SalaryRecord>) => {
    setSalaries((prev) =>
      prev.map((s) => (s.id === id && s.tenant_id === currentTenantId ? { ...s, ...updates } : s))
    );
  };

  const deleteSalaryPayment = (id: string) => {
    setSalaries((prev) => prev.filter((s) => !(s.id === id && s.tenant_id === currentTenantId)));
  };

  const requestSalaryAdvance = (advData: Omit<SalaryAdvance, 'id' | 'tenant_id' | 'approved_by'>) => {
    const newAdv: SalaryAdvance = {
      ...advData,
      id: `ADV-${Date.now()}`,
      tenant_id: currentTenantId,
      approved_by: currentUser.full_name,
    };
    setAdvances((prev) => [newAdv, ...prev]);
  };

  const updateSalaryAdvanceStatus = (id: string, status: SalaryAdvance['status']) => {
    setAdvances((prev) =>
      prev.map((adv) => (adv.id === id && adv.tenant_id === currentTenantId ? { ...adv, status } : adv))
    );
  };

  const deleteSalaryAdvance = (id: string) => {
    setAdvances((prev) => prev.filter((adv) => !(adv.id === id && adv.tenant_id === currentTenantId)));
  };

  // --- Settings & Printing ---
  const updateSettings = (settingsUpdates: Partial<TenantSettings>) => {
    setSettings((prev) => ({
      ...prev,
      [currentTenantId]: {
        ...prev[currentTenantId],
        ...settingsUpdates,
      },
    }));
  };

  const updateTenantDetails = (tenantUpdates: Partial<Tenant>) => {
    setTenants((prev) =>
      prev.map((t) => (t.tenant_id === currentTenantId ? { ...t, ...tenantUpdates } : t))
    );
  };

  const queuePrintJob = (printerType: PrintJob['printer_type'], title: string, rawPreview?: string) => {
    const newJob: PrintJob = {
      id: `JOB-${Date.now()}`,
      tenant_id: currentTenantId,
      printer_type: printerType,
      title,
      status: 'SENT',
      timestamp: new Date().toISOString(),
      preview_text: rawPreview,
    };
    setPrintQueue((prev) => [newJob, ...prev.slice(0, 19)]);
  };

  // --- User Management ---
  const addUserAccount = (userData: Omit<UserAccount, 'id' | 'tenant_id'> & { tenant_id?: string }) => {
    const targetTenant = userData.tenant_id || currentTenantId || 'SHOP001';
    const newUser: UserAccount = {
      ...userData,
      id: `USER_${targetTenant}_${Date.now().toString().slice(-4)}`,
      tenant_id: targetTenant,
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const updateUserAccount = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === id);
      if (!exists && updates.tenant_id) {
        // If it was a default generated user not yet in array, add it with updates
        return [...prev, { id, ...updates } as UserAccount];
      }
      return prev.map((u) => (u.id === id ? { ...u, ...updates } : u));
    });
  };

  const deleteUserAccount = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const setUserPassword = (userId: string, newPassword?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, password: newPassword ? newPassword.trim() : undefined };
        }
        return u;
      })
    );
  };

  const removeUserPassword = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u };
          delete updated.password;
          return updated;
        }
        return u;
      })
    );
  };

  // --- Promotions & Marketing ---
  const addPromotion = (promoData: Omit<PromotionCampaign, 'id' | 'tenant_id'>) => {
    const newPromo: PromotionCampaign = {
      ...promoData,
      id: `PROMO-${Date.now().toString().slice(-4)}`,
      tenant_id: currentTenantId,
    };
    setPromotions((prev) => [newPromo, ...prev]);
  };

  const updatePromotion = (id: string, updates: Partial<PromotionCampaign>) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id && p.tenant_id === currentTenantId ? { ...p, ...updates } : p))
    );
  };

  const deletePromotion = (id: string) => {
    setPromotions((prev) => prev.filter((p) => !(p.id === id && p.tenant_id === currentTenantId)));
  };

  // --- Reset to Demo & Export ---
  const resetToDemoData = () => {
    localStorage.clear();
    setTenants(INITIAL_TENANTS);
    setLicenses(INITIAL_LICENSES);
    setSettings(INITIAL_SETTINGS);
    setCustomFields(INITIAL_CUSTOM_FIELDS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setUsers(INITIAL_USERS);
    setEmployees(INITIAL_EMPLOYEES);
    setSalaries(INITIAL_SALARIES);
    setAdvances(INITIAL_ADVANCES);
    setExpenses(INITIAL_EXPENSES);
    setSales(INITIAL_SALES);
    setSaleReturns([]);
    setPurchases(INITIAL_PURCHASE_ORDERS);
    setPurchaseReturns(INITIAL_PURCHASE_RETURNS);
    setPayouts(INITIAL_PAYOUTS);
    setRiskAlerts(INITIAL_RISK_ALERTS);
    setPromotions(INITIAL_PROMOTIONS);
    setCurrentTenantId('SHOP001');
  };

  const exportDatabaseJson = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      platform: 'WCS Retail Cloud Platform',
      version: '2.6.0',
      type: 'MASTER_ALL_SHOPS_BACKUP',
      metadata: {
        total_tenants: tenants.length,
        total_products: products.length,
        total_customers: customers.length,
        total_suppliers: suppliers.length,
        total_sales: sales.length,
        total_users: users.length,
      },
      tenants,
      licenses,
      settings,
      customFields,
      categories,
      products,
      customers,
      suppliers,
      sales,
      saleReturns,
      purchases,
      purchaseReturns,
      payouts,
      expenses,
      employees,
      salaries,
      advances,
      users,
      promotions,
      repairJobs,
      vehicleServiceJobs,
      stockAdjustments,
      stockAudits,
      riskAlerts,
      rolePermissionsMap,
      userPermissionOverrides,
      ownerAdminFullAccess,
    };
    return JSON.stringify(backup, null, 2);
  };

  const exportShopDatabaseJson = (tenantId?: string) => {
    const targetId = tenantId || currentTenantId;
    const targetTenant = tenants.find((t) => t.tenant_id === targetId) || currentTenant;
    const backup = {
      timestamp: new Date().toISOString(),
      platform: 'WCS Retail Cloud Platform',
      version: '2.6.0',
      type: 'SINGLE_SHOP_BACKUP',
      tenant_id: targetId,
      shop_name: targetTenant?.shop_name || 'Shop',
      tenants: tenants.filter((t) => t.tenant_id === targetId),
      licenses: licenses[targetId] ? { [targetId]: licenses[targetId] } : {},
      settings: settings[targetId] ? { [targetId]: settings[targetId] } : {},
      customFields: customFields.filter((c) => c.tenant_id === targetId),
      categories: categories.filter((c) => c.tenant_id === targetId),
      products: products.filter((p) => p.tenant_id === targetId),
      customers: customers.filter((c) => c.tenant_id === targetId),
      suppliers: suppliers.filter((s) => s.tenant_id === targetId),
      sales: sales.filter((s) => s.tenant_id === targetId),
      saleReturns: saleReturns.filter((s) => s.tenant_id === targetId),
      purchases: purchases.filter((p) => p.tenant_id === targetId),
      purchaseReturns: purchaseReturns.filter((p) => p.tenant_id === targetId),
      payouts: payouts.filter((p) => p.tenant_id === targetId),
      expenses: expenses.filter((e) => e.tenant_id === targetId),
      employees: employees.filter((e) => e.tenant_id === targetId),
      salaries: salaries.filter((s) => s.tenant_id === targetId),
      advances: advances.filter((a) => a.tenant_id === targetId),
      users: users.filter((u) => u.tenant_id === targetId),
      promotions: promotions.filter((p) => p.tenant_id === targetId),
      repairJobs: repairJobs.filter((r) => r.tenant_id === targetId),
      vehicleServiceJobs: vehicleServiceJobs.filter((v) => v.tenant_id === targetId),
      stockAdjustments: stockAdjustments.filter((s) => s.tenant_id === targetId),
      stockAudits: stockAudits.filter((s) => s.tenant_id === targetId),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJson = (
    jsonData: string | Record<string, any>,
    mode: 'replace' | 'merge' = 'replace'
  ): { success: boolean; message: string; stats: Record<string, number> } => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.', stats: {} };
      }

      const stats: Record<string, number> = {};

      if (mode === 'replace') {
        if (Array.isArray(data.tenants)) {
          setTenants(data.tenants);
          stats.tenants = data.tenants.length;
        }
        if (data.licenses && typeof data.licenses === 'object') {
          setLicenses(data.licenses);
          stats.licenses = Object.keys(data.licenses).length;
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings(data.settings);
          stats.settings = Object.keys(data.settings).length;
        }
        if (Array.isArray(data.customFields)) {
          setCustomFields(data.customFields);
          stats.customFields = data.customFields.length;
        }
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
          stats.categories = data.categories.length;
        }
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          stats.products = data.products.length;
        }
        if (Array.isArray(data.customers)) {
          setCustomers(data.customers);
          stats.customers = data.customers.length;
        }
        if (Array.isArray(data.suppliers)) {
          setSuppliers(data.suppliers);
          stats.suppliers = data.suppliers.length;
        }
        if (Array.isArray(data.sales)) {
          setSales(data.sales);
          stats.sales = data.sales.length;
        }
        if (Array.isArray(data.saleReturns)) {
          setSaleReturns(data.saleReturns);
          stats.saleReturns = data.saleReturns.length;
        }
        if (Array.isArray(data.purchases)) {
          setPurchases(data.purchases);
          stats.purchases = data.purchases.length;
        }
        if (Array.isArray(data.purchaseReturns)) {
          setPurchaseReturns(data.purchaseReturns);
          stats.purchaseReturns = data.purchaseReturns.length;
        }
        if (Array.isArray(data.payouts)) {
          setPayouts(data.payouts);
          stats.payouts = data.payouts.length;
        }
        if (Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
          stats.expenses = data.expenses.length;
        }
        if (Array.isArray(data.employees)) {
          setEmployees(data.employees);
          stats.employees = data.employees.length;
        }
        if (Array.isArray(data.salaries)) {
          setSalaries(data.salaries);
          stats.salaries = data.salaries.length;
        }
        if (Array.isArray(data.advances)) {
          setAdvances(data.advances);
          stats.advances = data.advances.length;
        }
        if (Array.isArray(data.users)) {
          setUsers(data.users);
          stats.users = data.users.length;
        }
        if (Array.isArray(data.promotions)) {
          setPromotions(data.promotions);
          stats.promotions = data.promotions.length;
        }
        if (Array.isArray(data.repairJobs)) {
          setRepairJobs(data.repairJobs);
          stats.repairJobs = data.repairJobs.length;
        }
        if (Array.isArray(data.vehicleServiceJobs)) {
          setVehicleServiceJobs(data.vehicleServiceJobs);
          stats.vehicleServiceJobs = data.vehicleServiceJobs.length;
        }
        if (Array.isArray(data.stockAdjustments)) {
          setStockAdjustments(data.stockAdjustments);
          stats.stockAdjustments = data.stockAdjustments.length;
        }
        if (Array.isArray(data.stockAudits)) {
          setStockAudits(data.stockAudits);
          stats.stockAudits = data.stockAudits.length;
        }
        if (Array.isArray(data.riskAlerts)) {
          setRiskAlerts(data.riskAlerts);
        }
        if (data.rolePermissionsMap) {
          setRolePermissionsMap(data.rolePermissionsMap);
        }
        if (data.userPermissionOverrides) {
          setUserPermissionOverrides(data.userPermissionOverrides);
        }
        if (data.ownerAdminFullAccess) {
          setOwnerAdminFullAccessState(data.ownerAdminFullAccess);
        }

        // Set active tenant if available
        if (Array.isArray(data.tenants) && data.tenants.length > 0) {
          const firstTenant = data.tenants[0];
          if (firstTenant?.tenant_id) {
            setCurrentTenantId(firstTenant.tenant_id);
          }
        }
      } else {
        // MERGE MODE
        const mergeArraysById = <T extends { id?: string; tenant_id?: string }>(
          existing: T[],
          incoming: T[] = []
        ): T[] => {
          const map = new Map<string, T>();
          existing.forEach((item) => {
            if (item.id) map.set(item.id, item);
          });
          incoming.forEach((item) => {
            const key = item.id || `${item.tenant_id}_${Math.random()}`;
            map.set(key, item);
          });
          return Array.from(map.values());
        };

        if (Array.isArray(data.tenants)) {
          setTenants((prev) => {
            const map = new Map<string, Tenant>();
            prev.forEach((t) => map.set(t.tenant_id, t));
            data.tenants.forEach((t: Tenant) => map.set(t.tenant_id, t));
            const merged = Array.from(map.values());
            stats.tenants = merged.length;
            return merged;
          });
        }
        if (data.licenses && typeof data.licenses === 'object') {
          setLicenses((prev) => ({ ...prev, ...data.licenses }));
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
        if (Array.isArray(data.customFields)) {
          setCustomFields((prev) => mergeArraysById(prev, data.customFields));
        }
        if (Array.isArray(data.categories)) {
          setCategories((prev) => {
            const res = mergeArraysById(prev, data.categories);
            stats.categories = res.length;
            return res;
          });
        }
        if (Array.isArray(data.products)) {
          setProducts((prev) => {
            const res = mergeArraysById(prev, data.products);
            stats.products = res.length;
            return res;
          });
        }
        if (Array.isArray(data.customers)) {
          setCustomers((prev) => {
            const res = mergeArraysById(prev, data.customers);
            stats.customers = res.length;
            return res;
          });
        }
        if (Array.isArray(data.suppliers)) {
          setSuppliers((prev) => {
            const res = mergeArraysById(prev, data.suppliers);
            stats.suppliers = res.length;
            return res;
          });
        }
        if (Array.isArray(data.sales)) {
          setSales((prev) => {
            const res = mergeArraysById(prev, data.sales);
            stats.sales = res.length;
            return res;
          });
        }
        if (Array.isArray(data.saleReturns)) {
          setSaleReturns((prev) => mergeArraysById(prev, data.saleReturns));
        }
        if (Array.isArray(data.purchases)) {
          setPurchases((prev) => mergeArraysById(prev, data.purchases));
        }
        if (Array.isArray(data.purchaseReturns)) {
          setPurchaseReturns((prev) => mergeArraysById(prev, data.purchaseReturns));
        }
        if (Array.isArray(data.payouts)) {
          setPayouts((prev) => mergeArraysById(prev, data.payouts));
        }
        if (Array.isArray(data.expenses)) {
          setExpenses((prev) => {
            const res = mergeArraysById(prev, data.expenses);
            stats.expenses = res.length;
            return res;
          });
        }
        if (Array.isArray(data.employees)) {
          setEmployees((prev) => mergeArraysById(prev, data.employees));
        }
        if (Array.isArray(data.salaries)) {
          setSalaries((prev) => mergeArraysById(prev, data.salaries));
        }
        if (Array.isArray(data.advances)) {
          setAdvances((prev) => mergeArraysById(prev, data.advances));
        }
        if (Array.isArray(data.users)) {
          setUsers((prev) => mergeArraysById(prev, data.users));
        }
        if (Array.isArray(data.promotions)) {
          setPromotions((prev) => mergeArraysById(prev, data.promotions));
        }
        if (Array.isArray(data.repairJobs)) {
          setRepairJobs((prev) => mergeArraysById(prev, data.repairJobs));
        }
        if (Array.isArray(data.vehicleServiceJobs)) {
          setVehicleServiceJobs((prev) => mergeArraysById(prev, data.vehicleServiceJobs));
        }
        if (Array.isArray(data.stockAdjustments)) {
          setStockAdjustments((prev) => mergeArraysById(prev, data.stockAdjustments));
        }
        if (Array.isArray(data.stockAudits)) {
          setStockAudits((prev) => mergeArraysById(prev, data.stockAudits));
        }
      }

      return {
        success: true,
        message:
          mode === 'replace'
            ? 'Complete database snapshot restored successfully!'
            : 'Backup records merged and updated successfully!',
        stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to parse backup data.',
        stats: {},
      };
    }
  };

  const importShopDatabaseJson = (
    jsonData: string | Record<string, any>,
    mode: 'replace' | 'merge' = 'replace',
    targetTenantId?: string
  ): { success: boolean; message: string; stats: Record<string, number> } => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file format.', stats: {} };
      }

      const targetId = targetTenantId || currentTenantId;
      const targetTenantObj = tenants.find((t) => t.tenant_id === targetId) || currentTenant;
      const targetShopName = targetTenantObj?.shop_name || targetId;
      const stats: Record<string, number> = {};

      const extractArrayForShop = (arr: any): any[] => {
        if (!Array.isArray(arr)) return [];
        return arr.map((item) => {
          if (typeof item === 'object' && item !== null) {
            return { ...item, tenant_id: targetId };
          }
          return item;
        });
      };

      const incomingCategories = extractArrayForShop(data.categories);
      const incomingProducts = extractArrayForShop(data.products);
      const incomingCustomers = extractArrayForShop(data.customers);
      const incomingSuppliers = extractArrayForShop(data.suppliers);
      const incomingSales = extractArrayForShop(data.sales);
      const incomingSaleReturns = extractArrayForShop(data.saleReturns);
      const incomingPurchases = extractArrayForShop(data.purchases);
      const incomingPurchaseReturns = extractArrayForShop(data.purchaseReturns);
      const incomingPayouts = extractArrayForShop(data.payouts);
      const incomingExpenses = extractArrayForShop(data.expenses);
      const incomingEmployees = extractArrayForShop(data.employees);
      const incomingSalaries = extractArrayForShop(data.salaries);
      const incomingAdvances = extractArrayForShop(data.advances);
      const incomingUsers = extractArrayForShop(data.users);
      const incomingPromotions = extractArrayForShop(data.promotions);
      const incomingRepairJobs = extractArrayForShop(data.repairJobs);
      const incomingVehicleServiceJobs = extractArrayForShop(data.vehicleServiceJobs);
      const incomingStockAdjustments = extractArrayForShop(data.stockAdjustments);
      const incomingStockAudits = extractArrayForShop(data.stockAudits);
      const incomingCustomFields = extractArrayForShop(data.customFields);

      if (mode === 'replace') {
        // REPLACE ONLY FOR THIS TARGET SHOP (Leave other shops intact)
        if (incomingCategories.length > 0 || Array.isArray(data.categories)) {
          setCategories((prev) => [...prev.filter((c) => c.tenant_id !== targetId), ...incomingCategories]);
          stats.categories = incomingCategories.length;
        }
        if (incomingProducts.length > 0 || Array.isArray(data.products)) {
          setProducts((prev) => [...prev.filter((p) => p.tenant_id !== targetId), ...incomingProducts]);
          stats.products = incomingProducts.length;
        }
        if (incomingCustomers.length > 0 || Array.isArray(data.customers)) {
          setCustomers((prev) => [...prev.filter((c) => c.tenant_id !== targetId), ...incomingCustomers]);
          stats.customers = incomingCustomers.length;
        }
        if (incomingSuppliers.length > 0 || Array.isArray(data.suppliers)) {
          setSuppliers((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingSuppliers]);
          stats.suppliers = incomingSuppliers.length;
        }
        if (incomingSales.length > 0 || Array.isArray(data.sales)) {
          setSales((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingSales]);
          stats.sales = incomingSales.length;
        }
        if (incomingSaleReturns.length > 0 || Array.isArray(data.saleReturns)) {
          setSaleReturns((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingSaleReturns]);
          stats.saleReturns = incomingSaleReturns.length;
        }
        if (incomingPurchases.length > 0 || Array.isArray(data.purchases)) {
          setPurchases((prev) => [...prev.filter((p) => p.tenant_id !== targetId), ...incomingPurchases]);
          stats.purchases = incomingPurchases.length;
        }
        if (incomingPurchaseReturns.length > 0 || Array.isArray(data.purchaseReturns)) {
          setPurchaseReturns((prev) => [...prev.filter((p) => p.tenant_id !== targetId), ...incomingPurchaseReturns]);
          stats.purchaseReturns = incomingPurchaseReturns.length;
        }
        if (incomingPayouts.length > 0 || Array.isArray(data.payouts)) {
          setPayouts((prev) => [...prev.filter((p) => p.tenant_id !== targetId), ...incomingPayouts]);
          stats.payouts = incomingPayouts.length;
        }
        if (incomingExpenses.length > 0 || Array.isArray(data.expenses)) {
          setExpenses((prev) => [...prev.filter((e) => e.tenant_id !== targetId), ...incomingExpenses]);
          stats.expenses = incomingExpenses.length;
        }
        if (incomingEmployees.length > 0 || Array.isArray(data.employees)) {
          setEmployees((prev) => [...prev.filter((e) => e.tenant_id !== targetId), ...incomingEmployees]);
          stats.employees = incomingEmployees.length;
        }
        if (incomingSalaries.length > 0 || Array.isArray(data.salaries)) {
          setSalaries((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingSalaries]);
          stats.salaries = incomingSalaries.length;
        }
        if (incomingAdvances.length > 0 || Array.isArray(data.advances)) {
          setAdvances((prev) => [...prev.filter((a) => a.tenant_id !== targetId), ...incomingAdvances]);
          stats.advances = incomingAdvances.length;
        }
        if (incomingUsers.length > 0 || Array.isArray(data.users)) {
          setUsers((prev) => [...prev.filter((u) => u.tenant_id !== targetId), ...incomingUsers]);
          stats.users = incomingUsers.length;
        }
        if (incomingPromotions.length > 0 || Array.isArray(data.promotions)) {
          setPromotions((prev) => [...prev.filter((p) => p.tenant_id !== targetId), ...incomingPromotions]);
          stats.promotions = incomingPromotions.length;
        }
        if (incomingRepairJobs.length > 0 || Array.isArray(data.repairJobs)) {
          setRepairJobs((prev) => [...prev.filter((r) => r.tenant_id !== targetId), ...incomingRepairJobs]);
          stats.repairJobs = incomingRepairJobs.length;
        }
        if (incomingVehicleServiceJobs.length > 0 || Array.isArray(data.vehicleServiceJobs)) {
          setVehicleServiceJobs((prev) => [...prev.filter((v) => v.tenant_id !== targetId), ...incomingVehicleServiceJobs]);
          stats.vehicleServiceJobs = incomingVehicleServiceJobs.length;
        }
        if (incomingStockAdjustments.length > 0 || Array.isArray(data.stockAdjustments)) {
          setStockAdjustments((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingStockAdjustments]);
          stats.stockAdjustments = incomingStockAdjustments.length;
        }
        if (incomingStockAudits.length > 0 || Array.isArray(data.stockAudits)) {
          setStockAudits((prev) => [...prev.filter((s) => s.tenant_id !== targetId), ...incomingStockAudits]);
          stats.stockAudits = incomingStockAudits.length;
        }
        if (incomingCustomFields.length > 0 || Array.isArray(data.customFields)) {
          setCustomFields((prev) => [...prev.filter((c) => c.tenant_id !== targetId), ...incomingCustomFields]);
          stats.customFields = incomingCustomFields.length;
        }

        // Settings
        if (data.settings) {
          const shopSettings = data.settings[targetId] || (data.settings.shop_name ? data.settings : null);
          if (shopSettings) {
            setSettings((prev) => ({ ...prev, [targetId]: { ...prev[targetId], ...shopSettings, tenant_id: targetId } }));
            stats.settings = 1;
          }
        }
      } else {
        // MERGE MODE (Scoped to this target shop)
        const mergeArraysById = <T extends { id?: string; tenant_id?: string }>(
          existing: T[],
          incoming: T[] = []
        ): T[] => {
          const otherTenantsItems = existing.filter((item) => item.tenant_id !== targetId);
          const thisTenantMap = new Map<string, T>();
          existing
            .filter((item) => item.tenant_id === targetId)
            .forEach((item) => {
              if (item.id) thisTenantMap.set(item.id, item);
            });
          incoming.forEach((item) => {
            const key = item.id || `${targetId}_${Math.random()}`;
            thisTenantMap.set(key, { ...item, tenant_id: targetId });
          });
          return [...otherTenantsItems, ...Array.from(thisTenantMap.values())];
        };

        if (incomingCategories.length > 0) {
          setCategories((prev) => {
            const res = mergeArraysById(prev, incomingCategories);
            stats.categories = incomingCategories.length;
            return res;
          });
        }
        if (incomingProducts.length > 0) {
          setProducts((prev) => {
            const res = mergeArraysById(prev, incomingProducts);
            stats.products = incomingProducts.length;
            return res;
          });
        }
        if (incomingCustomers.length > 0) {
          setCustomers((prev) => {
            const res = mergeArraysById(prev, incomingCustomers);
            stats.customers = incomingCustomers.length;
            return res;
          });
        }
        if (incomingSuppliers.length > 0) {
          setSuppliers((prev) => {
            const res = mergeArraysById(prev, incomingSuppliers);
            stats.suppliers = incomingSuppliers.length;
            return res;
          });
        }
        if (incomingSales.length > 0) {
          setSales((prev) => {
            const res = mergeArraysById(prev, incomingSales);
            stats.sales = incomingSales.length;
            return res;
          });
        }
        if (incomingSaleReturns.length > 0) {
          setSaleReturns((prev) => mergeArraysById(prev, incomingSaleReturns));
        }
        if (incomingPurchases.length > 0) {
          setPurchases((prev) => {
            const res = mergeArraysById(prev, incomingPurchases);
            stats.purchases = incomingPurchases.length;
            return res;
          });
        }
        if (incomingPurchaseReturns.length > 0) {
          setPurchaseReturns((prev) => mergeArraysById(prev, incomingPurchaseReturns));
        }
        if (incomingPayouts.length > 0) {
          setPayouts((prev) => mergeArraysById(prev, incomingPayouts));
        }
        if (incomingExpenses.length > 0) {
          setExpenses((prev) => {
            const res = mergeArraysById(prev, incomingExpenses);
            stats.expenses = incomingExpenses.length;
            return res;
          });
        }
        if (incomingEmployees.length > 0) {
          setEmployees((prev) => mergeArraysById(prev, incomingEmployees));
        }
        if (incomingSalaries.length > 0) {
          setSalaries((prev) => mergeArraysById(prev, incomingSalaries));
        }
        if (incomingAdvances.length > 0) {
          setAdvances((prev) => mergeArraysById(prev, incomingAdvances));
        }
        if (incomingUsers.length > 0) {
          setUsers((prev) => mergeArraysById(prev, incomingUsers));
        }
        if (incomingPromotions.length > 0) {
          setPromotions((prev) => mergeArraysById(prev, incomingPromotions));
        }
        if (incomingRepairJobs.length > 0) {
          setRepairJobs((prev) => mergeArraysById(prev, incomingRepairJobs));
        }
        if (incomingVehicleServiceJobs.length > 0) {
          setVehicleServiceJobs((prev) => mergeArraysById(prev, incomingVehicleServiceJobs));
        }
        if (incomingStockAdjustments.length > 0) {
          setStockAdjustments((prev) => mergeArraysById(prev, incomingStockAdjustments));
        }
        if (incomingStockAudits.length > 0) {
          setStockAudits((prev) => mergeArraysById(prev, incomingStockAudits));
        }
        if (incomingCustomFields.length > 0) {
          setCustomFields((prev) => mergeArraysById(prev, incomingCustomFields));
        }
        if (data.settings) {
          const shopSettings = data.settings[targetId] || (data.settings.shop_name ? data.settings : null);
          if (shopSettings) {
            setSettings((prev) => ({ ...prev, [targetId]: { ...prev[targetId], ...shopSettings, tenant_id: targetId } }));
          }
        }
      }

      return {
        success: true,
        message:
          mode === 'replace'
            ? `Shop data for "${targetShopName}" (${targetId}) replaced successfully! Other shops remain untouched.`
            : `Shop records merged into "${targetShopName}" (${targetId}) successfully!`,
        stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to parse shop backup data.',
        stats: {},
      };
    }
  };

  const tenantPromotions = useMemo(
    () => (promotions || []).filter((p) => p && p.tenant_id === currentTenantId),
    [promotions, currentTenantId]
  );

  // Repair Job actions
  const addRepairJob = (jobData: Omit<RepairJob, 'id' | 'job_no' | 'tenant_id' | 'created_at'>): RepairJob => {
    const jobCount = repairJobs.filter((r) => r.tenant_id === currentTenantId).length + 1;
    const prefix = currentTenant?.business_type === 'phone_shop' ? 'REP-PHN' : 'REP-CMP';
    const newJob: RepairJob = {
      ...jobData,
      id: `REP-${Date.now()}`,
      job_no: `${prefix}-2026-${String(jobCount).padStart(3, '0')}`,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    };
    setRepairJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const updateRepairJob = (id: string, updates: Partial<RepairJob>) => {
    setRepairJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  };

  const deleteRepairJob = (id: string) => {
    setRepairJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Vehicle Service Job actions
  const addVehicleServiceJob = (jobData: Omit<VehicleServiceJob, 'id' | 'job_card_no' | 'tenant_id' | 'created_at'>): VehicleServiceJob => {
    const count = vehicleServiceJobs.filter((v) => v.tenant_id === currentTenantId).length + 1;
    const newJob: VehicleServiceJob = {
      ...jobData,
      id: `VS-${Date.now()}`,
      job_card_no: `JC-2026-${String(count).padStart(3, '0')}`,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    };
    setVehicleServiceJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const updateVehicleServiceJob = (id: string, updates: Partial<VehicleServiceJob>) => {
    setVehicleServiceJobs((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const deleteVehicleServiceJob = (id: string) => {
    setVehicleServiceJobs((prev) => prev.filter((v) => v.id !== id));
  };

  // --- Excel Batch Import Actions ---
  const batchImportCategories = (newCats: Omit<Category, 'id'>[]) => {
    const created: Category[] = newCats.map((cat, idx) => ({
      ...cat,
      id: `CAT-${Date.now().toString().slice(-4)}-${idx + 1}`,
      tenant_id: currentTenantId,
    }));
    setCategories((prev) => [...prev, ...created]);
    return { count: created.length, imported: created };
  };

  const batchImportProducts = (newProds: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[]) => {
    const branchId = currentTenant?.branch_id || `BR-${currentTenantId}-01`;
    const created: Product[] = newProds.map((prod, idx) => ({
      ...prod,
      id: `PRD-${Date.now().toString().slice(-4)}-${idx + 1}`,
      tenant_id: currentTenantId,
      branch_id: branchId,
    }));
    setProducts((prev) => [...prev, ...created]);
    return { count: created.length, imported: created };
  };

  const batchImportCustomers = (newCusts: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[]) => {
    const created: Customer[] = newCusts.map((cust, idx) => ({
      ...cust,
      id: `CUST-${Date.now().toString().slice(-4)}-${idx + 1}`,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    }));
    setCustomers((prev) => [...prev, ...created]);
    return { count: created.length, imported: created };
  };

  const batchImportExpenses = (newExps: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[]) => {
    const recorder = currentUser?.full_name || currentUser?.username || 'Admin';
    const created: Expense[] = newExps.map((exp, idx) => ({
      ...exp,
      id: `EXP-${Date.now().toString().slice(-4)}-${idx + 1}`,
      tenant_id: currentTenantId,
      recorded_by: recorder,
    }));
    setExpenses((prev) => [...prev, ...created]);
    return { count: created.length, imported: created };
  };

  // --- Access Control & Permissions Methods ---
  const updateRolePermissions = (role: UserRole, permissions: Partial<RolePermissions>, targetTenantId?: string) => {
    setRolePermissionsMap((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || DEFAULT_ROLE_PERMISSIONS_MAP[role] || DEFAULT_FULL_PERMISSIONS),
        ...permissions,
      },
    }));
  };

  const updateUserPermissionOverride = (userId: string, permissions: Partial<RolePermissions> | null) => {
    setUserPermissionOverrides((prev) => {
      const next = { ...prev };
      if (!permissions || Object.keys(permissions).length === 0) {
        delete next[userId];
      } else {
        next[userId] = permissions;
      }
      return next;
    });
  };

  const setOwnerAdminFullAccess = (role: 'OWNER' | 'ADMIN', fullAccess: boolean, targetTenantId?: string) => {
    setOwnerAdminFullAccessState((prev) => ({
      ...prev,
      [role === 'OWNER' ? 'ownerFullAccess' : 'adminFullAccess']: fullAccess,
    }));
  };

  const hasPermission = (permissionKey: PermissionKey, customUser?: UserAccount): boolean => {
    const userToCheck = customUser || currentUser;
    return checkUserPermission(userToCheck, permissionKey, rolePermissionsMap, userPermissionOverrides, ownerAdminFullAccess);
  };

  const getEffectiveUserPermissions = (customUser?: UserAccount): RolePermissions => {
    const userToCheck = customUser || currentUser;
    return getEffectivePermissions(userToCheck, rolePermissionsMap, userPermissionOverrides, ownerAdminFullAccess);
  };

  const resetRolePermissionsToDefault = (targetTenantId?: string) => {
    setRolePermissionsMap(DEFAULT_ROLE_PERMISSIONS_MAP);
    setUserPermissionOverrides({});
    setOwnerAdminFullAccessState({ ownerFullAccess: true, adminFullAccess: true });
  };

  // --- Multi-Counter & Terminal Network Actions ---
  const setTerminalStation = (config: Partial<TerminalStationConfig>) => {
    setTerminalStationState((prev) => {
      const updated = { ...prev, ...config };
      localStorage.setItem(STORAGE_KEY_PREFIX + 'terminal_station', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync cashDrawerTransactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'cash_drawer_transactions', JSON.stringify(cashDrawerTransactions));
    } catch (err) {
      console.warn('Failed to save cash drawer transactions to localStorage:', err);
    }
  }, [cashDrawerTransactions]);

  // Sync counterShifts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'counter_shifts', JSON.stringify(counterShifts));
    } catch (err) {
      console.warn('Failed to save counter shifts to localStorage:', err);
    }
  }, [counterShifts]);

  // Sync counters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'counters', JSON.stringify(counters));
    } catch (err) {
      console.warn('Failed to save counters to localStorage:', err);
    }
  }, [counters]);

  // --- Cash Drawer & Shift Management Action Handlers ---
  const recordCashDrawerTransaction = (
    txData: Omit<CashDrawerTransaction, 'id' | 'tenant_id' | 'created_at'>
  ): CashDrawerTransaction => {
    const txId = `CDT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newTx: CashDrawerTransaction = {
      ...txData,
      id: txId,
      tenant_id: currentTenantId,
      performed_by: txData.performed_by || currentUser?.full_name || currentUser?.username || 'Cashier',
      performed_by_role: txData.performed_by_role || currentUser?.role || 'CASHIER',
      reference_no: txData.reference_no || `REF-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString(),
    };

    setCashDrawerTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const openDayShift = (payload: {
    counter_id?: string;
    counter_name?: string;
    cashier_id?: string;
    cashier_name?: string;
    opening_float: number;
    denominations?: Record<string, number>;
    notes?: string;
  }): CounterShift => {
    const targetCounterId = payload.counter_id || terminalStation.counter_id || counters[0]?.id || 'CTR-01';
    const counterObj = counters.find((c) => c.id === targetCounterId);
    const counterName = payload.counter_name || counterObj?.name || 'Counter 01 - Main POS';
    const cashierId = payload.cashier_id || currentUser?.id || 'USR-DEFAULT';
    const cashierName = payload.cashier_name || currentUser?.full_name || currentUser?.username || 'Cashier';
    const shiftId = `SHIFT-${currentTenantId}-${Date.now().toString().slice(-6)}`;

    const newShift: CounterShift = {
      id: shiftId,
      tenant_id: currentTenantId,
      counter_id: targetCounterId,
      counter_name: counterName,
      cashier_id: cashierId,
      cashier_name: cashierName,
      opened_at: new Date().toISOString(),
      opening_float: payload.opening_float,
      opening_denominations: payload.denominations,
      total_cash_sales: 0,
      total_card_sales: 0,
      total_credit_sales: 0,
      total_qr_bank_sales: 0,
      total_sales_amount: 0,
      total_bills_count: 0,
      total_payouts: 0,
      total_cash_in: 0,
      total_cash_out: 0,
      total_refunds: 0,
      status: 'OPEN',
      notes: payload.notes || `Day Open Cash Deposit: Rs. ${payload.opening_float.toLocaleString()} verified by ${cashierName}`,
    };

    setCounterShifts((prev) => [newShift, ...prev]);

    // Record formal Day Open Cash Deposit transaction
    recordCashDrawerTransaction({
      shift_id: shiftId,
      counter_id: targetCounterId,
      counter_name: counterName,
      type: 'DAY_OPEN_FLOAT',
      amount: payload.opening_float,
      denominations: payload.denominations,
      reason: `Day Open starting cash deposit / float for ${counterName}`,
      category: 'FLOAT',
      performed_by: cashierName,
      performed_by_role: currentUser?.role || 'CASHIER',
      reference_no: `FLT-${Date.now().toString().slice(-6)}`,
      notes: payload.notes,
    });

    // Update Counter Terminal status to ONLINE
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === targetCounterId && c.tenant_id === currentTenantId) {
          return {
            ...c,
            status: 'ONLINE',
            last_active: new Date().toISOString(),
            current_cashier_id: cashierId,
            current_cashier_name: cashierName,
            current_shift_id: shiftId,
            current_float: payload.opening_float,
          };
        }
        return c;
      })
    );

    // Queue Day Open thermal slip
    queuePrintJob(
      'THERMAL_80',
      `Day Open Cash Deposit: ${counterName}`,
      `DAY OPEN / STARTING FLOAT\nShift #${shiftId}\nCounter: ${counterName}\nCashier: ${cashierName}\nOpening Cash Float: Rs. ${payload.opening_float.toLocaleString()}\nTime: ${new Date().toLocaleTimeString()}`
    );

    return newShift;
  };

  const closeDayShift = (payload: {
    shift_id: string;
    closing_cash_actual: number;
    closing_denominations?: Record<string, number>;
    cash_withdrawal_amount: number;
    retained_float_for_next_day?: number;
    withdrawal_notes?: string;
    notes?: string;
  }): { shift: CounterShift; summary: any } => {
    let closedShiftObj: CounterShift | null = null;
    let shiftSummary: any = null;
    const zReportNo = `ZREP-${currentTenantId}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    setCounterShifts((prev) =>
      prev.map((s) => {
        if (s.id === payload.shift_id) {
          const shiftTxs = cashDrawerTransactions.filter((t) => t.shift_id === s.id);
          const midDayIn = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((sum, t) => sum + (t.amount || 0), 0);
          const midDayOut = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT').reduce((sum, t) => sum + (t.amount || 0), 0);
          
          const expectedCash = (s.opening_float || 0) + (s.total_cash_sales || 0) + midDayIn - Math.max(midDayOut, s.total_payouts || 0) - (s.total_refunds || 0);
          const variance = payload.closing_cash_actual - expectedCash;

          const updated: CounterShift = {
            ...s,
            closed_at: new Date().toISOString(),
            status: 'CLOSED',
            closing_cash_actual: payload.closing_cash_actual,
            closing_denominations: payload.closing_denominations,
            expected_cash_in_drawer: expectedCash,
            cash_variance: variance,
            cash_withdrawal_amount: payload.cash_withdrawal_amount,
            retained_float_for_next_day: payload.retained_float_for_next_day || 0,
            withdrawal_notes: payload.withdrawal_notes,
            z_report_no: zReportNo,
            notes: payload.notes || s.notes,
          };
          closedShiftObj = updated;
          shiftSummary = {
            shiftId: updated.id,
            zReportNo,
            counter: updated.counter_name,
            cashier: updated.cashier_name,
            openingFloat: updated.opening_float,
            totalSales: updated.total_sales_amount,
            totalCash: updated.total_cash_sales,
            totalCard: updated.total_card_sales,
            totalCredit: updated.total_credit_sales,
            totalQr: updated.total_qr_bank_sales,
            billsCount: updated.total_bills_count,
            expectedCash,
            actualCash: payload.closing_cash_actual,
            variance,
            withdrawalAmount: payload.cash_withdrawal_amount,
            retainedFloat: payload.retained_float_for_next_day || 0,
          };
          return updated;
        }
        return s;
      })
    );

    // Record formal Day End Cash Withdrawal transaction
    if (payload.cash_withdrawal_amount > 0) {
      recordCashDrawerTransaction({
        shift_id: payload.shift_id,
        counter_id: closedShiftObj?.counter_id,
        counter_name: closedShiftObj?.counter_name,
        type: 'DAY_END_WITHDRAWAL',
        amount: payload.cash_withdrawal_amount,
        reason: `Day End shift closing cash withdrawal to safe / bank deposit (${payload.withdrawal_notes || 'EOD Settlement'})`,
        category: 'BANK_DROP',
        performed_by: currentUser?.full_name || currentUser?.username || 'Store Manager',
        performed_by_role: currentUser?.role || 'STORE_MANAGER',
        reference_no: `WTH-${Date.now().toString().slice(-6)}`,
        notes: `Z-Report: ${zReportNo}. Retained float left in drawer: Rs. ${(payload.retained_float_for_next_day || 0).toLocaleString()}`,
      });
    }

    // Update Counter Terminal status to CLOSED
    if (closedShiftObj) {
      const closedShift: CounterShift = closedShiftObj;
      setCounters((prev) =>
        prev.map((c) => {
          if (c.id === closedShift.counter_id) {
            return {
              ...c,
              status: 'CLOSED',
              current_shift_id: undefined,
              current_cashier_id: undefined,
              current_cashier_name: undefined,
              current_float: payload.retained_float_for_next_day || 0,
              last_active: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      queuePrintJob(
        'THERMAL_80',
        `Z-Report & Day End Close: ${closedShift.counter_name}`,
        `================================\nDAY END Z-REPORT #${zReportNo}\nCounter: ${closedShift.counter_name}\nCashier: ${closedShift.cashier_name}\nOpened: ${new Date(closedShift.opened_at).toLocaleTimeString()}\nClosed: ${new Date().toLocaleTimeString()}\n--------------------------------\nOpening Float:    Rs. ${closedShift.opening_float.toLocaleString()}\nTotal Sales:      Rs. ${closedShift.total_sales_amount.toLocaleString()} (${closedShift.total_bills_count} bills)\nCash Sales:       Rs. ${closedShift.total_cash_sales.toLocaleString()}\nCard Sales:       Rs. ${closedShift.total_card_sales.toLocaleString()}\nCredit:           Rs. ${closedShift.total_credit_sales.toLocaleString()}\n--------------------------------\nExpected in Drawer: Rs. ${closedShift.expected_cash_in_drawer?.toLocaleString()}\nActual Count:       Rs. ${payload.closing_cash_actual.toLocaleString()}\nCash Variance:      Rs. ${closedShift.cash_variance?.toLocaleString()}\n================================\nDAY END WITHDRAWAL: Rs. ${payload.cash_withdrawal_amount.toLocaleString()}\nRETAINED FLOAT:     Rs. ${(payload.retained_float_for_next_day || 0).toLocaleString()}\n================================`
      );
    }

    return { shift: closedShiftObj || ({} as CounterShift), summary: shiftSummary };
  };

  const recordCashDrawerIn = (payload: {
    counter_id?: string;
    amount: number;
    reason: string;
    category?: 'FLOAT' | 'PETTY_CASH' | 'SUPPLIER_PAYMENT' | 'BANK_DROP' | 'OWNER_DRAW' | 'CHANGE_REPLENISH' | 'OTHER';
    denominations?: Record<string, number>;
    notes?: string;
  }): CashDrawerTransaction => {
    const counterId = payload.counter_id || activeCounter?.id || 'CTR-01';
    const counterName = counters.find((c) => c.id === counterId)?.name || 'Counter Terminal';
    const currentShift = counterShifts.find((s) => s.counter_id === counterId && s.status === 'OPEN') || activeShift;

    const tx = recordCashDrawerTransaction({
      shift_id: currentShift?.id,
      counter_id: counterId,
      counter_name: counterName,
      type: 'CASH_IN_DEPOSIT',
      amount: payload.amount,
      denominations: payload.denominations,
      reason: payload.reason,
      category: payload.category || 'CHANGE_REPLENISH',
      performed_by: currentUser?.full_name || currentUser?.username || 'Cashier',
      performed_by_role: currentUser?.role || 'CASHIER',
      reference_no: `CIN-${Date.now().toString().slice(-6)}`,
      notes: payload.notes,
    });

    if (currentShift) {
      setCounterShifts((prev) =>
        prev.map((s) => (s.id === currentShift.id ? { ...s, total_cash_in: (s.total_cash_in || 0) + payload.amount } : s))
      );
    }

    queuePrintJob(
      'THERMAL_80',
      `Cash In / Deposit: Rs. ${payload.amount.toLocaleString()}`,
      `CASH IN DEPOSIT VOUCHER\nCounter: ${counterName}\nAmount: Rs. ${payload.amount.toLocaleString()}\nReason: ${payload.reason}\nBy: ${currentUser?.full_name}\nTime: ${new Date().toLocaleTimeString()}`
    );

    return tx;
  };

  const recordCashDrawerOut = (payload: {
    counter_id?: string;
    amount: number;
    reason: string;
    category?: 'FLOAT' | 'PETTY_CASH' | 'SUPPLIER_PAYMENT' | 'BANK_DROP' | 'OWNER_DRAW' | 'CHANGE_REPLENISH' | 'OTHER';
    denominations?: Record<string, number>;
    notes?: string;
  }): CashDrawerTransaction => {
    const counterId = payload.counter_id || activeCounter?.id || 'CTR-01';
    const counterName = counters.find((c) => c.id === counterId)?.name || 'Counter Terminal';
    const currentShift = counterShifts.find((s) => s.counter_id === counterId && s.status === 'OPEN') || activeShift;

    const tx = recordCashDrawerTransaction({
      shift_id: currentShift?.id,
      counter_id: counterId,
      counter_name: counterName,
      type: 'CASH_OUT_PAYOUT',
      amount: payload.amount,
      denominations: payload.denominations,
      reason: payload.reason,
      category: payload.category || 'PETTY_CASH',
      performed_by: currentUser?.full_name || currentUser?.username || 'Cashier',
      performed_by_role: currentUser?.role || 'CASHIER',
      reference_no: `COUT-${Date.now().toString().slice(-6)}`,
      notes: payload.notes,
    });

    if (currentShift) {
      setCounterShifts((prev) =>
        prev.map((s) => (s.id === currentShift.id ? {
          ...s,
          total_payouts: (s.total_payouts || 0) + payload.amount,
          total_cash_out: (s.total_cash_out || 0) + payload.amount
        } : s))
      );
    }

    // Also register in general payouts ledger
    recordPayout({
      payee_name: payload.reason,
      amount: payload.amount,
      notes: `Cash Drawer Payout: ${payload.reason} (${payload.notes || ''})`,
      category: payload.category === 'OWNER_DRAW' ? 'OWNER_DRAWING' : (payload.category === 'SUPPLIER_PAYMENT' ? 'SUPPLIER_PAYMENT' : (payload.category === 'PETTY_CASH' ? 'PETTY_CASH' : 'OTHER')),
      source: 'CASH_DRAWER',
      payment_method: 'CASH',
    });

    queuePrintJob(
      'THERMAL_80',
      `Cash Out / Payout: Rs. ${payload.amount.toLocaleString()}`,
      `CASH OUT PAYOUT VOUCHER\nCounter: ${counterName}\nAmount: Rs. ${payload.amount.toLocaleString()}\nReason: ${payload.reason}\nAuthorized By: ${currentUser?.full_name}\nTime: ${new Date().toLocaleTimeString()}`
    );

    return tx;
  };

  const kickCashDrawer = (counterId?: string, counterName?: string) => {
    const targetCounterId = counterId || activeCounter?.id || 'CTR-01';
    const targetName = counterName || counters.find((c) => c.id === targetCounterId)?.name || 'Counter Drawer';

    recordCashDrawerTransaction({
      shift_id: activeShift?.id,
      counter_id: targetCounterId,
      counter_name: targetName,
      type: 'MANUAL_DRAWER_KICK',
      amount: 0,
      reason: 'Manual Cash Drawer Kick Trigger from POS / Dashboard',
      performed_by: currentUser?.full_name || currentUser?.username || 'Cashier',
      performed_by_role: currentUser?.role || 'CASHIER',
      notes: 'ESC/POS Pin 2/5 Drawer Kick Pulse sent.',
    });

    queuePrintJob(
      'THERMAL_80',
      `Drawer Kick Pulse: ${targetName}`,
      `\x1B\x70\x00\x19\xFA` // ESC/POS drawer open command pulse
    );
  };

  const openCounterShift = (
    counterId: string,
    cashierId: string,
    cashierName: string,
    openingFloat: number,
    notes?: string
  ): CounterShift => {
    return openDayShift({
      counter_id: counterId,
      cashier_id: cashierId,
      cashier_name: cashierName,
      opening_float: openingFloat,
      notes,
    });
  };

  const closeCounterShift = (
    shiftId: string,
    closingCashActual: number,
    notes?: string
  ): { shift: CounterShift; summary: any } => {
    return closeDayShift({
      shift_id: shiftId,
      closing_cash_actual: closingCashActual,
      cash_withdrawal_amount: closingCashActual, // By default withdraw all to safe if not specified
      retained_float_for_next_day: 0,
      notes,
    });
  };

  const addCounterTerminal = (counterData: Omit<CounterTerminal, 'id' | 'tenant_id'>): CounterTerminal => {
    const nextNum = counters.filter((c) => c.tenant_id === currentTenantId).length + 1;
    const newCounter: CounterTerminal = {
      ...counterData,
      id: `CTR-${currentTenantId}-${String(nextNum).padStart(2, '0')}`,
      tenant_id: currentTenantId,
      counter_code: counterData.counter_code || `POS-${String(nextNum).padStart(2, '0')}`,
      status: 'IDLE',
      last_active: new Date().toISOString(),
      current_float: 0,
      total_bills_today: 0,
      total_revenue_today: 0,
    };
    setCounters((prev) => [...prev, newCounter]);
    return newCounter;
  };

  const updateCounterTerminal = (id: string, updates: Partial<CounterTerminal>) => {
    setCounters((prev) =>
      prev.map((c) => (c.id === id && c.tenant_id === currentTenantId ? { ...c, ...updates } : c))
    );
  };

  const deleteCounterTerminal = (id: string) => {
    setCounters((prev) => prev.filter((c) => !(c.id === id && c.tenant_id === currentTenantId)));
  };

  const recordCounterCashDrop = (counterId: string, amount: number, reason: string) => {
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === counterId && c.tenant_id === currentTenantId) {
          const newFloat = Math.max(0, (c.current_float || 0) - amount);
          return { ...c, current_float: newFloat };
        }
        return c;
      })
    );
    setCounterShifts((prev) =>
      prev.map((s) => {
        if (s.counter_id === counterId && s.tenant_id === currentTenantId && s.status === 'OPEN') {
          return {
            ...s,
            total_payouts: (s.total_payouts || 0) + amount,
          };
        }
        return s;
      })
    );
    // Also record in expense/payouts
    recordPayout({
      payee_name: `Cash Vault Drop - Counter ${counterId}`,
      amount,
      notes: `Mid-day cash drop from counter drawer to safe: ${reason}`,
      category: 'CASH_DROP_TO_SAFE',
      source: 'CASH_DRAWER',
      payment_method: 'CASH',
    });
  };

  const allLicensesList = useMemo(() => Object.values(licenses || {}), [licenses]);

  return (
    <RetailContext.Provider
      value={{
        currentTenantId,
        setCurrentTenantId,
        currentUser,
        setCurrentUser,
        isSuperAdminMode,
        authSession,
        loginShopUser,
        logoutSession,
        generateLicense,
        activateShopWithLicense,
        validateLicenseKey,
        allLicensesList,
        currentTenant,
        currentBranch,
        currentLicense,
        currentSettings,
        allTenants: tenants,
        allLicenses: licenses,
        allSettings: settings,
        allRiskAlerts: riskAlerts,
        adminShopMessages,
        products: tenantProducts,
        categories: tenantCategories,
        customFields: tenantCustomFields,
        customers: tenantCustomers,
        customerPayments: tenantCustomerPayments,
        suppliers: tenantSuppliers,
        sales: tenantSales,
        saleReturns: tenantSaleReturns,
        purchases: tenantPurchases,
        purchaseReturns: tenantPurchaseReturns,
        payouts: tenantPayouts,
        expenses: tenantExpenses,
        employees: tenantEmployees,
        salaries: tenantSalaries,
        salaryPayments: tenantSalaries,
        advances: tenantAdvances,
        salaryAdvances: tenantAdvances,
        currencySymbol: currentTenant?.currency_symbol || 'Rs.',
        users: tenantUsers,
        tenantUsers,
        printQueue: tenantPrintQueue,
        batches: tenantBatches,
        stockAdjustments: tenantStockAdjustments,
        stockAudits: tenantStockAudits,
        tenantMessages,
        unreadTenantMessagesCount,
        urgentUnreadMessage,
        createTenant,
        deleteTenantShop,
        batchCreateShops,
        updateTenantLicense,
        setLicenseStatus,
        updateTenantModules,
        broadcastRiskAlert,
        acknowledgeRiskAlert,
        sendAdminShopMessage,
        markMessageAsRead,
        acknowledgeMessage,
        deleteAdminShopMessage,
        isSuperAdminAuthenticated,
        superAdminPasswordUpdatedAt,
        superAdminPasswordHint,
        authenticateSuperAdmin,
        verifySuperAdminPassword,
        setSuperAdminPassword,
        lockSuperAdmin,
        resetSuperAdminPasswordToDefault,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordStockAdjustment,
        batchReconcileStockAudit,
        deleteStockAdjustment,
        deleteStockAuditSession,
        addCustomField,
        updateCustomField,
        deleteCustomField,
        addCategory,
        updateCategory,
        deleteCategory,
        createSale,
        updateSale,
        processSaleReturn,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        adjustCustomerLoyaltyPoints,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordSupplierPayment,
        createPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrder,
        processPurchaseReturn,
        deletePurchaseReturn,
        recordPayout,
        deletePayout,
        addExpense,
        deleteExpense,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        recordSalaryPayment,
        updateSalaryPayment,
        deleteSalaryPayment,
        requestSalaryAdvance,
        recordSalaryAdvance: requestSalaryAdvance,
        updateSalaryAdvanceStatus,
        deleteSalaryAdvance,
        updateSettings,
        updateTenantDetails,
        queuePrintJob,
        addUserAccount,
        updateUserAccount,
        deleteUserAccount,
        setUserPassword,
        removeUserPassword,
        language,
        setLanguage,
        t,
        isFullscreen,
        toggleFullscreen,
        promotions: tenantPromotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        repairJobs: tenantRepairJobs,
        addRepairJob,
        updateRepairJob,
        deleteRepairJob,
        vehicleServiceJobs: tenantVehicleServiceJobs,
        vehicleServiceRecords: tenantVehicleServiceJobs,
        addVehicleServiceJob,
        updateVehicleServiceJob,
        deleteVehicleServiceJob,
        batchImportCategories,
        batchImportProducts,
        batchImportCustomers,
        batchImportExpenses,
        allProductsMaster: products,
        allCategoriesMaster: categories,
        allCustomersMaster: customers,
        allExpensesMaster: expenses,
        rolePermissionsMap,
        userPermissionOverrides,
        ownerAdminFullAccess,
        updateRolePermissions,
        updateUserPermissionOverride,
        setOwnerAdminFullAccess,
        hasPermission,
        getEffectiveUserPermissions,
        resetRolePermissionsToDefault,
        resetToDemoData,
        counters: tenantCounters,
        allCountersMaster: counters,
        counterShifts: tenantCounterShifts,
        cashDrawerTransactions: tenantCashDrawerTransactions,
        allCashDrawerTransactions: cashDrawerTransactions,
        currentDrawerCashBalance,
        terminalStation,
        activeCounter,
        activeShift,
        setTerminalStation,
        openCounterShift,
        closeCounterShift,
        openDayShift,
        closeDayShift,
        recordCashDrawerIn,
        recordCashDrawerOut,
        kickCashDrawer,
        getShopDirectUrl,
        copyShopDirectUrl,
        openShopInAddressBar,
        recordCashDrawerTransaction,
        addCounterTerminal,
        updateCounterTerminal,
        deleteCounterTerminal,
        recordCounterCashDrop,
        exportDatabaseJson,
        exportShopDatabaseJson,
        importDatabaseJson,
        importShopDatabaseJson,
        cloudSyncStatus,
        lastCloudSync,
        cloudVersion,
        connectedClientsCount,
        forceCloudSync,
        remoteDevices,
        localDeviceId,
        localDeviceName,
        setLocalDeviceName,
        isLocalDeviceLocked,
        localDeviceLockReason,
        localDeviceLockMessage,
        isLocalDeviceBlocked,
        remoteAlertPopup,
        clearRemoteAlertPopup,
        fetchRemoteDevices,
        executeDeviceSecurityAction,
        executeShopLockdown,
        unlockLocalOverride,
        updateLicenseMaxTerminals,
        issueValidLicenseKey,
        renewShopWithKey,
        disableShopOperatingDevices,
      }}
    >
      {children}
    </RetailContext.Provider>
  );
};

export const useRetail = () => {
  const context = useContext(RetailContext);
  if (!context) {
    throw new Error('useRetail must be used within a RetailProvider');
  }
  return context;
};
