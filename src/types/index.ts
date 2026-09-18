export type BusinessType = 
  | 'grocery' 
  | 'motor_parts' 
  | 'restaurant' 
  | 'hotel'
  | 'restaurant_hotel'
  | 'pharmacy' 
  | 'wholesale' 
  | 'retail_clothing' 
  | 'phone_shop'
  | 'computer_shop'
  | 'repair_center'
  | 'hardware_shop'
  | 'hardware'
  | 'vehicle_service'
  | 'automobile_workshop'
  | 'electronics_mobile'
  | 'clothing_apparel'
  | 'general';

export type Language = 'en' | 'si' | 'ta';

export * from './accessControl';

export type LicenseStatus = 
  | 'ACTIVE' 
  | 'WARNING' 
  | 'TEMPORARY_SUSPENDED' 
  | 'SUSPENDED' 
  | 'DEACTIVATED' 
  | 'EXPIRED';

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OWNER' 
  | 'ADMIN' 
  | 'CASHIER' 
  | 'STORE_MANAGER' 
  | 'SALES_ASSOCIATE'
  | 'SHOP_ASSOCIATE'
  | 'ACCOUNTANT' 
  | 'TECHNICIAN'
  | 'MECHANIC'
  | 'KITCHEN' 
  | 'KITCHEN_STAFF'
  | 'DELIVERY';

export type PaymentMethod = 
  | 'CASH' 
  | 'CARD' 
  | 'CREDIT' 
  | 'QR_PAY' 
  | 'BANK_TRANSFER' 
  | 'CHEQUE' 
  | 'SPLIT'
  | 'LOYALTY_POINTS';

export type User = UserAccount;
export type ProductBatch = BatchRecord;

export interface CartItem {
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  discount_amount?: number;
  total_price: number;
  unit: string;
  image_url?: string;
  custom_fields?: Record<string, any>;
}

export interface Tenant {
  tenant_id: string;
  id?: string; // alias for tenant_id compatibility
  shop_name: string;
  company_name: string;
  business_type: BusinessType;
  branch_id: string;
  branch_name: string;
  address: string;
  phone: string;
  email: string;
  br_number: string;
  vat_number: string;
  logo_url: string;
  currency: 'LKR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'INR';
  currency_symbol: string;
  created_at: string;
}

export interface TenantLicense {
  tenant_id: string;
  status: LicenseStatus;
  warning_message?: string;
  suspend_reason?: string;
  license_key: string;
  package_tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  max_branches: number;
  max_users: number;
  max_products: number;
  max_terminals?: number; // Maximum authorized PCs / POS terminals per shop
  duration_months?: 1 | 3 | 6 | 12 | number;
  disabled_message?: string;
  is_device_disabled?: boolean;
  valid_from: string;
  valid_until: string;
  auto_renew: boolean;
  grace_period_days: number;
  last_sync: string;
  offline_grace_hours_remaining: number;
  assigned_shop_name?: string;
  issued_to_client?: string;
  client_contact?: string;
  created_at?: string;
  is_provisioned?: boolean;
  notes?: string;
  allowed_modules?: {
    grocery_weight?: boolean;
    vehicle_parts?: boolean;
    restaurant_kot?: boolean;
    pharmacy_batch?: boolean;
    wholesale_credit?: boolean;
    barcode_studio?: boolean;
    staff_salaries?: boolean;
    expense_tracker?: boolean;
    expiry_manager?: boolean;
    phone_imei_warranty?: boolean;
    computer_specs?: boolean;
    repair_job_sheet?: boolean;
    hardware_metrics?: boolean;
    vehicle_service_station?: boolean;
  };
}

export interface RemoteDevice {
  deviceId: string;
  deviceName: string;
  tenantId: string;
  shopName: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  ipAddress: string;
  locationCity?: string;
  locationCountry?: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'laptop' | 'pos_terminal' | 'tablet' | 'mobile';
  status: 'ONLINE' | 'IDLE' | 'LOCKED' | 'BLOCKED' | 'OFFLINE';
  isAuthorized: boolean;
  isLocked: boolean;
  lockReason?: string;
  lockMessage?: string;
  lastPing: string;
  connectedAt: string;
  appVersion?: string;
  pendingCommand?: 'LOCK' | 'UNLOCK' | 'FORCE_LOGOUT' | 'BLOCK' | 'UNBLOCK' | 'MESSAGE' | null;
  pendingMessage?: string;

  // Compatibility aliases
  device_id?: string;
  device_name?: string;
  tenant_id?: string;
  shop_name?: string;
  current_user_name?: string;
  current_user_role?: string;
  ip_address?: string;
  city?: string;
  country?: string;
  is_locked?: boolean;
  is_blocked?: boolean;
  lock_reason?: string;
  last_heartbeat?: string;
}

export interface RemoteSecurityActionPayload {
  deviceId?: string;
  action?: 'LOCK' | 'UNLOCK' | 'BLOCK' | 'UNBLOCK' | 'FORCE_LOGOUT' | 'SEND_MESSAGE' | 'RENAME' | 'DELETE';
  message?: string;
  newName?: string;
  reason?: string;

  // Compatibility aliases
  targetDeviceId?: string;
  command?: 'LOCK' | 'UNLOCK' | 'BLOCK' | 'UNBLOCK' | 'FORCE_LOGOUT' | 'SEND_MESSAGE' | 'RENAME' | 'DELETE' | string;
  initiatedBy?: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  authType: 'SUPER_ADMIN' | 'SHOP_USER' | null;
  tenantId?: string;
  user?: UserAccount;
  loginTime?: string;
}

export interface TenantSettings {
  tenant_id: string;
  language?: Language;
  invoice_header: string;
  invoice_footer: string;
  thank_you_message: string;
  terms_conditions: string;
  default_tax_rate: number;
  tax_percentage?: number;
  tax_name: string; // e.g. VAT / SVAT
  default_receipt_type: '80mm' | '58mm' | 'a4';
  default_receipt_format?: '80mm' | '58mm' | 'a4';
  show_logo_on_bill: boolean;
  show_associate_on_bill?: boolean;
  associate_title_label?: string; // 'Sales Associate' | 'Sales Person' | 'Served By'
  show_tax_breakdown: boolean;
  allow_negative_stock: boolean;
  allow_credit_sales: boolean;
  enable_loyalty: boolean;
  enable_weighing_scale: boolean;
  sound_effects_enabled: boolean;
  print_bridge_connected: boolean;
  print_bridge_ip?: string;
  enabled_modules: {
    grocery_weight: boolean;
    vehicle_parts: boolean;
    restaurant_kot: boolean;
    pharmacy_batch: boolean;
    wholesale_credit: boolean;
    barcode_studio: boolean;
    staff_salaries: boolean;
    expense_tracker: boolean;
    expiry_manager: boolean;
    phone_imei_warranty?: boolean;
    computer_specs?: boolean;
    repair_job_sheet?: boolean;
    hardware_metrics?: boolean;
    vehicle_service_station?: boolean;
  };
  restaurant_settings?: {
    enable_kot_print?: boolean;
    auto_print_kot_on_bill?: boolean;
    enable_takeaway?: boolean;
    enable_dine_in_table?: boolean;
    enable_delivery?: boolean;
    table_selection_optional?: boolean;
    default_order_type?: 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';
    tables_list?: string[];
    rooms_list?: string[];
    delivery_riders?: string[];
  };
}

export interface CustomFieldDefinition {
  id: string;
  tenant_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: string[];
  is_required: boolean;
  show_in_pos: boolean;
  show_in_invoice: boolean;
  placeholder?: string;
  category_specific?: string;
}

export interface BatchRecord {
  batch_no: string;
  batch_number?: string;
  expiry_date: string;
  quantity?: number;
  stock_quantity?: number;
  cost_price: number;
  selling_price: number;
  supplier_name?: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  branch_id: string;
  sku: string;
  barcode: string;
  name: string;
  name_si?: string; // Sinhala Name e.g. "කීරි සම්බා සහල්"
  name_ta?: string; // Tamil Name e.g. "கீரி சம்பா அரிசி"
  description?: string;
  description_si?: string;
  description_ta?: string;
  category: string;
  category_id?: string;
  category_si?: string;
  category_ta?: string;
  brand: string;
  unit: 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack' | 'dozen' | 'bottle' | 'can' | 'portion' | 'glass';
  cost_price: number;
  selling_price: number;
  unit_price?: number;
  price?: number;
  wholesale_price: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  image_url?: string;
  custom_fields: Record<string, any>;
  batches?: BatchRecord[];
  manufacture_date?: string; // e.g. "2026-01-15" (MFG Date)
  expiry_date?: string;      // e.g. "2027-01-15" (EXP Date)
  damaged_quantity?: number; // Optional damaged/broken stock count
  damaged_reason?: string;   // Optional damage discrepancy notes or cause
  damaged_date?: string;     // Optional date when damage was registered
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  name_si?: string;
  name_ta?: string;
  icon_name?: string;
  color?: string;
}

export interface PromotionCampaign {
  id: string;
  tenant_id: string;
  title: string;
  title_si?: string;
  title_ta?: string;
  description: string;
  description_si?: string;
  description_ta?: string;
  discount_percentage?: number;
  coupon_code?: string;
  valid_from: string;
  valid_until: string;
  category_target?: string;
  featured_product_id?: string;
  banner_color?: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  nic_or_br?: string;
  nic?: string;
  credit_limit: number;
  current_balance: number; // positive = customer owes shop (Udalu)
  loyalty_points: number;
  notes?: string;
  created_at: string;
}

export interface CustomerPayment {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
  reference_no?: string;
  notes?: string;
  payment_date: string;
  received_by: string;
}

export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
  balance_payable: number; // positive = shop owes supplier
  br_number?: string;
  bank_details?: string;
}

export interface SupplierPayment {
  id: string;
  tenant_id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD';
  reference_no?: string;
  notes?: string;
  payment_date: string;
  paid_by: string;
}

export interface SaleItem {
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  weight_unit?: 'kg' | 'g';
  discount_percent: number;
  discount_amount: number;
  total: number;
  total_price?: number;
  batch_no?: string;
  custom_fields_snapshot?: Record<string, any>;
}

export interface Sale {
  id: string;
  invoice_no: string;
  tenant_id: string;
  branch_id: string;
  cashier_id: string;
  cashier_name: string;
  sales_associate_id?: string;
  sales_associate_name?: string;
  sales_associate_code?: string;
  sales_associate_designation?: string;
  sales_associate_phone?: string;
  commission_rate?: number;
  commission_amount?: number;
  counter_id?: string;
  counter_name?: string;
  terminal_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
  subtotal: number;
  discount_amount: number;
  discount_total?: number;
  tax_amount: number;
  tax_total?: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  balance_due: number; // for credit / udalu sales
  balance_amount?: number;
  payment_method: PaymentMethod | 'CASH' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'SPLIT' | 'QR_PAY' | 'CHEQUE' | 'LOYALTY_POINTS';
  payment_split?: {
    cash?: number;
    card?: number;
    credit?: number;
    bank_transfer?: number;
    loyalty_points?: number;
  };
  loyalty_points_earned?: number;
  loyalty_points_redeemed?: number;
  loyalty_points_amount?: number;
  customer_loyalty_balance?: number;
  status: 'COMPLETED' | 'HOLD' | 'RETURNED' | 'PARTIALLY_RETURNED';
  receipt_type: '80mm' | '58mm' | 'a4';
  table_no?: string;
  table_number?: string;
  kot_token?: string;
  order_type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'STANDARD';
  notes?: string;
  created_at: string;
}

export interface SaleReturn {
  id: string;
  return_no: string;
  original_invoice_no: string;
  tenant_id: string;
  customer_id?: string;
  customer_name?: string;
  items: {
    product_id: string;
    name: string;
    unit_price: number;
    return_quantity: number;
    refund_amount: number;
  }[];
  exchange_items?: {
    product_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    total: number;
  }[];
  price_difference?: number; // positive = customer paid extra, negative = store refunded
  total_refund_amount: number;
  refund_type: 'CASH' | 'CREDIT_NOTE' | 'BANK_TRANSFER' | 'EXCHANGE_ITEM';
  reason: string;
  processed_by: string;
  processedBy?: string;
  created_at: string;
}

export interface PurchaseItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  batch_no?: string;
  expiry_date?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  tenant_id: string;
  supplier_id: string;
  supplier_name: string;
  items: PurchaseItem[];
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID';
  payment_method?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
  order_date: string;
  delivery_date?: string;
  notes?: string;
  created_at?: string;
}

export interface PurchaseReturnItem {
  product_id: string;
  sku: string;
  name: string;
  return_quantity: number;
  unit_cost: number;
  total_credit: number;
  batch_no?: string;
  reason: 'EXPIRED' | 'DAMAGED' | 'DEFECTIVE' | 'QUALITY_DEFECT' | 'WRONG_ITEM' | 'OVER_SUPPLIED' | 'EXCESS_STOCK' | 'OTHER';
}

export interface PurchaseReturn {
  id: string;
  return_number: string; // e.g. DN-2026-001 (Debit Note)
  tenant_id: string;
  po_id?: string;
  po_number?: string;
  supplier_id: string;
  supplier_name: string;
  items: PurchaseReturnItem[];
  total_return_amount: number;
  refund_type: 'DEBIT_NOTE' | 'CASH_REFUND' | 'BANK_TRANSFER' | 'REPLACEMENT';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  processed_by: string;
  created_at: string;
}

export type PayoutCategory =
  | 'SUPPLIER_PAYMENT'
  | 'PETTY_CASH'
  | 'UTILITIES'
  | 'DELIVERY_TRANSPORT'
  | 'TEA_SNACKS'
  | 'REPAIR_MAINTENANCE'
  | 'OWNER_DRAWING'
  | 'STAFF_ALLOWANCE'
  | 'CASH_DROP_TO_SAFE'
  | 'OTHER';

export interface Payout {
  id: string;
  payout_no: string; // e.g. PAY-2026-001
  tenant_id: string;
  branch_id?: string;
  category: PayoutCategory;
  payee_name: string;
  amount: number;
  source: 'CASH_DRAWER' | 'PETTY_CASH' | 'BANK_ACCOUNT';
  cash_source?: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  reference_no?: string;
  notes?: string;
  authorized_by: string;
  cashier_id?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  category: 'UTILITIES' | 'RENT' | 'TRANSPORT' | 'MAINTENANCE' | 'TEA_SNACKS' | 'MARKETING' | 'PACKAGING' | 'PETTY_CASH' | 'SALARY' | 'OTHER' | string;
  amount: number;
  description: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  payment_mode?: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE';
  date: string;
  recorded_by: string;
  receipt_ref?: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  name: string;
  designation: string;
  department?: string;
  phone: string;
  email?: string;
  address?: string;
  nic: string;
  join_date: string;
  joined_date?: string;
  base_salary: number;
  allowance: number;
  travel_allowance?: number;
  food_allowance?: number;
  attendance_allowance?: number;
  ot_hourly_rate?: number;
  is_shop_associate?: boolean;
  associate_code?: string;
  code?: string;
  commission_percentage?: number; // e.g. 2.5% on associate sales
  user_account_id?: string;
  epf_etf_applicable?: boolean;
  epf_no?: string;
  bank_name?: string;
  account_no?: string;
  branch_name?: string;
  default_payment_method?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  is_active: boolean;
  notes?: string;
}

export interface SalaryRecord {
  id: string;
  slip_no?: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  designation?: string;
  department?: string;
  month: string; // e.g. "2026-08"
  working_days?: number;
  present_days?: number;
  ot_hours?: number;
  ot_rate?: number;
  ot_amount?: number;
  base_salary: number;
  allowances: number;
  travel_allowance?: number;
  food_allowance?: number;
  performance_bonus?: number;
  is_shop_associate?: boolean;
  associate_sales_total?: number; // Total value of sales attributed to this associate in this month
  commission_rate?: number; // % commission
  sales_commission?: number; // Commission amount added to salary
  gross_salary?: number;
  epf_employee?: number; // EPF 8%
  epf_employer?: number; // EPF 12%
  etf_employer?: number; // ETF 3%
  advances_deducted: number;
  other_deductions?: number;
  total_deductions?: number;
  net_salary: number;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  payment_reference?: string;
  bank_name?: string;
  account_no?: string;
  payment_date: string;
  status: 'PAID' | 'PENDING';
  notes?: string;
  processed_by: string;
  created_at?: string;
  // Aliases for backward compatibility
  basic_salary?: number;
  bonuses?: number;
  advance_deductions?: number;
  is_paid?: boolean;
  paid_date?: string;
  user_id?: string;
}

export interface SalaryAdvance {
  id: string;
  advance_no?: string;
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  request_date: string;
  approved_date?: string;
  reason: string;
  status: 'APPROVED' | 'DEDUCTED' | 'REJECTED' | 'PENDING';
  payment_source?: 'CASH_DRAWER' | 'PETTY_CASH' | 'BANK_TRANSFER';
  payment_method?: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  approved_by: string;
  notes?: string;
  // Aliases for backward compatibility
  date?: string;
  user_id?: string;
}

export interface UserAccount {
  id: string;
  tenant_id: string;
  username: string;
  full_name: string;
  name?: string;
  email: string;
  role: UserRole;
  pin_code?: string;
  password?: string;
  is_active: boolean;
  avatar_color?: string;
  assigned_counter_id?: string;
  is_shop_associate?: boolean;
  associate_code?: string;
  commission_percentage?: number;
  base_salary?: number;
  phone?: string;
}

export type TerminalStationRole = 'ADMIN_WORKSTATION' | 'COUNTER_POS';

export interface TerminalStationConfig {
  station_type: TerminalStationRole;
  role?: TerminalStationRole;
  counter_id: string;
  counter_name: string;
  device_label?: string;
  lock_to_pos?: boolean;
  auto_launch_pos?: boolean;
  default_printer_type?: '80mm' | '58mm' | 'a4';
  installed_at?: string;
}

export interface CounterTerminal {
  id: string;
  tenant_id: string;
  name: string; // e.g. "Counter 01 - Main Checkout"
  counter_code: string; // e.g. "C01"
  location_or_bay?: string; // e.g. "Front Entrance Left"
  default_cashier_id?: string;
  current_cashier_name?: string;
  current_cashier_id?: string;
  status?: 'ONLINE' | 'BILLING' | 'IDLE' | 'CLOSED';
  last_active?: string;
  current_shift_id?: string;
  current_float?: number;
  total_bills_today?: number;
  total_revenue_today?: number;
  default_printer_type?: '80mm' | '58mm' | 'a4';
  is_locked_to_pos?: boolean;
  ip_or_device_name?: string;
  notes?: string;
}

export type CashDrawerTransactionType = 
  | 'DAY_OPEN_FLOAT'       // Day Open starting cash deposit / float
  | 'CASH_IN_DEPOSIT'      // Mid-day cash injection / change replenishment
  | 'CASH_OUT_PAYOUT'      // Cash paid out (supplier / petty cash / expense)
  | 'DAY_END_WITHDRAWAL'   // Day End shift closing cash withdrawal to safe/bank
  | 'MANUAL_DRAWER_KICK';  // Cash drawer open pulse

export interface CashDrawerTransaction {
  id: string;
  tenant_id: string;
  shift_id?: string;
  counter_id?: string;
  counter_name?: string;
  type: CashDrawerTransactionType;
  amount: number;
  denominations?: Record<string, number>; // e.g. { '5000': 2, '1000': 5, ... }
  reason: string;
  category?: 'FLOAT' | 'PETTY_CASH' | 'SUPPLIER_PAYMENT' | 'BANK_DROP' | 'OWNER_DRAW' | 'CHANGE_REPLENISH' | 'OTHER';
  performed_by: string;
  performed_by_role?: string;
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export interface CounterShift {
  id: string;
  tenant_id: string;
  counter_id: string;
  counter_name: string;
  cashier_id: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  opening_denominations?: Record<string, number>;
  closing_cash_actual?: number;
  closing_denominations?: Record<string, number>;
  expected_cash_in_drawer?: number;
  cash_variance?: number; // actual - expected
  cash_withdrawal_amount?: number; // amount withdrawn to bank/safe at day end
  retained_float_for_next_day?: number; // float left in drawer
  withdrawal_notes?: string;
  z_report_no?: string;
  total_cash_sales: number;
  total_card_sales: number;
  total_credit_sales: number;
  total_qr_bank_sales: number;
  total_sales_amount: number;
  total_bills_count: number;
  total_payouts: number;
  total_cash_in?: number;
  total_cash_out?: number;
  total_refunds: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface RiskAlert {
  id: string;
  tenant_id?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT';
  title: string;
  message: string;
  action_required: string;
  created_at: string;
  is_acknowledged: boolean;
}

export type MessageCategory =
  | 'GENERAL_ANNOUNCEMENT'
  | 'MAINTENANCE_UPDATE'
  | 'BILLING_INVOICE'
  | 'SECURITY_ADVISORY'
  | 'FEATURE_UPDATE'
  | 'DIRECT_INQUIRY'
  | 'SYSTEM_ALERT';

export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface AdminShopMessage {
  id: string;
  sender_name: string;
  sender_role?: string;
  target_type: 'ALL_SHOPS' | 'SELECTED_SHOPS' | 'BUSINESS_TYPE' | 'LICENSE_STATUS';
  target_tenant_ids: string[];
  target_shop_names?: string[];
  target_business_type?: BusinessType;
  target_license_status?: LicenseStatus;
  category: MessageCategory;
  priority: MessagePriority;
  title: string;
  message: string;
  action_required?: string;
  action_label?: string;
  action_url_or_tab?: string;
  requires_acknowledgment?: boolean;
  created_at: string;
  created_by?: string;
  read_by_tenants?: Record<string, { read_at: string; user_name?: string }>;
  acknowledged_by_tenants?: Record<string, { acknowledged_at: string; user_name: string; reply_notes?: string }>;
}

export interface PrintJob {
  id: string;
  tenant_id: string;
  printer_type: 'THERMAL_80' | 'THERMAL_58' | 'BARCODE' | 'KITCHEN' | 'A4';
  title: string;
  status: 'SENT' | 'PRINTED' | 'FAILED';
  timestamp: string;
  preview_text?: string;
}

export type BarcodeLabelSize = 
  | '20x10' 
  | '30x20' 
  | '38x25' 
  | '50x25' 
  | '40x30' 
  | '50x30';

export interface BarcodeLabelConfig {
  label_size: BarcodeLabelSize;
  show_name: boolean;
  show_price: boolean;
  show_sku: boolean;
  show_company: boolean;
  show_custom_field?: string;
  font_scale: number;
  print_qty: number;
}

export type RepairJobStatus = 
  | 'RECEIVED' 
  | 'DIAGNOSING' 
  | 'WAITING_FOR_PARTS' 
  | 'IN_PROGRESS' 
  | 'READY_FOR_PICKUP' 
  | 'DELIVERED' 
  | 'CANCELLED';

export interface RepairJob {
  id: string;
  tenant_id: string;
  job_no: string; // e.g. REP-2026-0042
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  device_type: 'MOBILE_PHONE' | 'LAPTOP' | 'DESKTOP' | 'TABLET' | 'PRINTER' | 'ACCESSORY' | 'OTHER';
  device_brand: string; // e.g. Apple, Samsung, Asus, Dell
  device_model: string; // e.g. iPhone 14 Pro, ThinkPad E14
  imei_or_serial: string;
  security_lock_pin?: string;
  issue_description: string;
  technician_name: string;
  status: RepairJobStatus;
  estimated_cost: number;
  advance_paid: number;
  labor_charge: number;
  spare_parts_used: {
    product_id?: string;
    name: string;
    cost: number;
    price: number;
    quantity: number;
  }[];
  final_amount: number;
  warranty_period?: string; // e.g. "3 Months Service Warranty"
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export type VehicleServiceStatus = 
  | 'RECEIVED' 
  | 'IN_BAY' 
  | 'SERVICE_DONE' 
  | 'WASHING' 
  | 'READY' 
  | 'DELIVERED'
  | 'COMPLETED';

export interface VehicleServiceJob {
  id: string;
  tenant_id: string;
  job_card_no?: string; // e.g. JC-2026-0088
  job_no?: string;
  customer_name: string;
  customer_phone: string;
  vehicle_number: string; // e.g. WP CA-8890
  vehicle_make_model: string; // e.g. Toyota Prius, Honda Vezel
  vehicle_type: 'CAR' | 'VAN' | 'SUV' | 'BIKE' | 'LORRY' | 'THREE_WHEELER';
  current_mileage_km: number;
  next_service_due_km: number;
  next_service_due_date?: string;
  technician_or_mechanic: string;
  service_package: 'FULL_SERVICE' | 'LUBE_AND_OIL' | 'WASH_AND_VACUUM' | 'BODY_WASH' | 'ENGINE_TUNEUP' | 'WHEEL_ALIGNMENT' | 'BRAKE_SERVICE' | 'CUSTOM';
  services_performed: {
    service_name: string;
    labor_cost: number;
  }[];
  parts_and_lubricants: {
    product_id?: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
  status: VehicleServiceStatus;
  total_labor: number;
  total_parts: number;
  total_cost?: number;
  grand_total: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: string;
}

export type StockGapReason =
  | 'MISSING_THEFT' // Missing / Unaccounted / Shoplifting
  | 'DAMAGED_BROKEN' // Damaged / Broken / Defective
  | 'EXPIRED_SPOILED' // Expired / Rotten / Spoiled
  | 'WEIGHT_LOSS_DRYING' // Evaporation / Weight loss (Produce, Grains, Vegetables)
  | 'INTERNAL_USE_TESTING' // Store demonstration / Testing sample / Staff internal consumption
  | 'DATA_ENTRY_ERROR' // Previous billing or GRN count mistake
  | 'FOUND_SURPLUS' // Unrecorded inventory found / Extra
  | 'SUPPLIER_SHORTAGE' // Supplier dispatched less than invoiced
  | 'OTHER';

export interface StockAdjustmentRecord {
  id: string;
  adjustment_no: string; // e.g. "ADJ-2026-001"
  tenant_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  system_stock_before: number;
  physical_count: number;
  gap_quantity: number; // physical_count - system_stock_before (negative = missing/shortage, positive = surplus)
  financial_variance_cost: number; // gap_quantity * cost_price (negative = loss, positive = gain)
  financial_variance_retail: number; // gap_quantity * selling_price
  reason: StockGapReason;
  notes?: string;
  batch_no?: string;
  adjusted_by: string;
  created_at: string;
}

export interface StockAuditSession {
  id: string;
  session_no: string; // e.g. "AUDIT-2026-08"
  tenant_id: string;
  title: string;
  category_filter?: string;
  items_counted: number;
  items_with_gap: number;
  total_missing_qty: number;
  total_surplus_qty: number;
  total_cost_loss: number;
  total_cost_gain: number;
  net_financial_variance: number;
  conducted_by: string;
  created_at: string;
  notes?: string;
  adjustments: StockAdjustmentRecord[];
}

export interface SuperAdminSecurityConfig {
  password_hash?: string;
  hint?: string;
  updated_at: string;
  require_auth_on_entry: boolean;
}
