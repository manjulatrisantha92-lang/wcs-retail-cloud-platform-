import { Language } from '../types';

export interface Translations {
  // Navigation & Topbar
  dashboard: string;
  sales: string;
  products: string;
  categories: string;
  barcodeStudio: string;
  promotions: string;
  customers: string;
  expenses: string;
  suppliers: string;
  expiryBatches: string;
  customFields: string;
  users: string;
  reports: string;
  settings: string;
  openPos: string;
  closePos: string;
  fullscreen: string;
  exitFullscreen: string;
  language: string;
  search: string;
  notifications: string;
  help: string;
  posTerminal?: string;
  pos_terminal?: string;
  sales_history?: string;
  barcode_studio?: string;
  custom_fields?: string;
  customer_credit?: string;
  batch_expiry?: string;
  expenses_payroll?: string;
  staff_roles?: string;

  // POS
  searchProductsPlaceholder: string;
  cart: string;
  emptyCart: string;
  clearCart: string;
  holdCart: string;
  recallCart: string;
  customer: string;
  walkInCustomer: string;
  selectCustomer: string;
  quickItems: string;
  allCategories: string;
  itemsInCart: string;
  subtotal: string;
  discount: string;
  tax: string;
  grandTotal: string;
  paymentMethod: string;
  cash: string;
  card: string;
  creditUdalu: string;
  qrPay: string;
  bankTransfer: string;
  cheque: string;
  splitPay: string;
  amountPaid: string;
  changeDue: string;
  balanceOwed: string;
  completeSale: string;
  printBill: string;
  shareWhatsApp: string;
  enterCustomerPhone: string;
  sendWhatsAppReceipt: string;
  billSharedSuccess: string;
  newSale: string;
  saleCompleted: string;
  heldCartsCount: string;
  barcodeScanHelp: string;
  stockLeft: string;
  reorderWarning: string;

  // Products
  productCatalog: string;
  addProduct: string;
  editProduct: string;
  deleteProduct: string;
  productName: string;
  productNameEnglish: string;
  productNameSinhala: string;
  productNameTamil: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  wholesalePrice: string;
  stockQty: string;
  reorderLevel: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  active: string;
  inactive: string;
  adjustStock: string;
  save: string;
  cancel: string;
  delete: string;
  confirmDelete: string;
  actions: string;
  searchProductPlaceholder: string;
  selectCategory: string;

  // Categories
  categoryManager: string;
  addCategory: string;
  categoryName: string;
  categoryNameSinhala: string;
  categoryNameTamil: string;
  itemCount: string;

  // Sales & Returns
  salesInvoices: string;
  returnsAndExchanges: string;
  processReturn: string;
  reprintReceipt: string;
  invoiceNumber: string;
  date: string;
  cashier: string;
  itemsCount: string;
  total: string;
  status: string;
  returnItems: string;
  exchangeItems: string;
  refundAmount: string;
  differenceToPay: string;

  // Promotions & Marketing
  marketingStudio: string;
  promotionsTitle: string;
  promotionsSubtitle: string;
  createPromotion: string;
  promoTemplates: string;
  shareToWhatsApp: string;
  shareToFacebook: string;
  copyPromoText: string;
  copiedSuccess: string;
  liveFlyerPreview: string;
  discountBadge: string;
  validUntil: string;
  offerCode: string;
  promoLanguage: string;
  shareWithCustomers: string;
  featuredProduct: string;

  // Finance & Expenses
  financeDashboard: string;
  operatingExpenses: string;
  staffSalaries: string;
  salaryAdvances: string;
  addExpense: string;
  paySalary: string;
  issueAdvance: string;
  monthlyExpenseTotal: string;
  netProfit: string;

  // Purchases & Supplier Returns
  purchaseOrders: string;
  purchaseReturns: string;
  createPurchaseOrder: string;
  receiveStock: string;
  debitNote: string;
  returnToSupplier: string;
  supplierInvoice: string;
  orderDate: string;
  deliveryDate: string;
  poStatus: string;
  paymentStatus: string;
  returnReason: string;

  // Cash Drawer Payouts
  payouts: string;
  recordPayout: string;
  payoutCategory: string;
  payeeName: string;
  payoutSource: string;
  authorizedBy: string;

  // Credit / Udalu
  creditLedger: string;
  customerBalance: string;
  creditLimit: string;
  addCustomer: string;
  recordPayment: string;
  totalReceivables: string;

  // Reports
  businessReports: string;
  dailySales: string;
  monthlyRevenue: string;
  topSellingProducts: string;
  cashDrawerSummary: string;

  // Settings
  shopProfile: string;
  shopName: string;
  phone: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  taxRate: string;
  receiptSize: string;
  logo: string;
  selectLanguage: string;

  // Daily Opening Briefing & Alerts
  dailyBriefing: string;
  dailyOpeningAlert: string;
  lowStockAlertTitle: string;
  customerBalanceAlertTitle: string;
  openingBriefingSubtitle: string;
  viewDailyBriefing: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    sales: 'Sales & Returns',
    products: 'Products & Stock',
    categories: 'Categories',
    barcodeStudio: 'Barcode Studio',
    promotions: 'Promotions & Share',
    customers: 'Credit Ledger',
    expenses: 'Expenses & Payroll',
    suppliers: 'Suppliers & Purchases',
    expiryBatches: 'Expiry & Batches',
    customFields: 'Custom Fields',
    users: 'Staff & Roles',
    reports: 'Reports',
    settings: 'Shop Settings',
    openPos: 'Open POS Terminal',
    closePos: 'Close POS',
    fullscreen: 'Toggle Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    language: 'Language',
    search: 'Search...',
    notifications: 'Notifications',
    help: 'Keyboard Shortcuts (F1-F12)',

    // POS
    searchProductsPlaceholder: 'Scan barcode or type name (EN / සිංහල / தமிழ்)...',
    cart: 'Active Cart',
    emptyCart: 'Cart is empty. Scan barcode or click items.',
    clearCart: 'Clear Cart',
    holdCart: 'Hold Cart',
    recallCart: 'Recall Held Cart',
    customer: 'Customer',
    walkInCustomer: 'Walk-in Customer (Cash)',
    selectCustomer: 'Select / Add Customer',
    quickItems: 'Quick Items',
    allCategories: 'All Categories',
    itemsInCart: 'Items in Cart',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax / VAT',
    grandTotal: 'Grand Total',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    creditUdalu: 'Credit',
    qrPay: 'LankaQR Pay',
    bankTransfer: 'Bank Transfer',
    cheque: 'Cheque',
    splitPay: 'Split Payment',
    amountPaid: 'Amount Tendered / Paid',
    changeDue: 'Change / Balance Due',
    balanceOwed: 'Credit Balance Added',
    completeSale: 'Complete Sale (F12)',
    printBill: 'Print Receipt',
    shareWhatsApp: 'Send Bill on WhatsApp',
    enterCustomerPhone: 'Enter Customer Mobile Number (+94 / 07X)',
    sendWhatsAppReceipt: 'Open WhatsApp Receipt',
    billSharedSuccess: 'WhatsApp Receipt generated successfully!',
    newSale: 'Start Next Sale',
    saleCompleted: 'Sale Completed Successfully!',
    heldCartsCount: 'Held Carts',
    barcodeScanHelp: 'Press F2 to focus scanner search',
    stockLeft: 'in stock',
    reorderWarning: 'Low Stock Alert!',

    // Products
    productCatalog: 'Products & Inventory',
    addProduct: 'Add New Product',
    editProduct: 'Edit Product',
    deleteProduct: 'Delete Product',
    productName: 'Product Name',
    productNameEnglish: 'Product Name (English)',
    productNameSinhala: 'Sinhala Name (සිංහල නම)',
    productNameTamil: 'Tamil Name (தமிழ் பெயர்)',
    sku: 'SKU Code',
    barcode: 'Barcode / EAN',
    category: 'Category',
    brand: 'Brand / Make',
    unit: 'Unit of Measure',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price (MRP)',
    wholesalePrice: 'Wholesale Price',
    stockQty: 'Current Stock',
    reorderLevel: 'Reorder Level',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    active: 'Active',
    inactive: 'Inactive',
    adjustStock: 'Adjust Stock',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this item?',
    actions: 'Actions',
    searchProductPlaceholder: 'Search by SKU, Barcode, English, Sinhala or Tamil...',
    selectCategory: 'Select Category',

    // Categories
    categoryManager: 'Category Manager',
    addCategory: 'Add Category',
    categoryName: 'Category Name (English)',
    categoryNameSinhala: 'Sinhala Name (සිංහල)',
    categoryNameTamil: 'Tamil Name (தமிழ்)',
    itemCount: 'Items',

    // Sales & Returns
    salesInvoices: 'Sales Invoices & Receipts',
    returnsAndExchanges: 'Returns & Item Exchange',
    processReturn: 'Return / Swap Items',
    reprintReceipt: 'Reprint Bill',
    invoiceNumber: 'Invoice #',
    date: 'Date & Time',
    cashier: 'Cashier',
    itemsCount: 'Items',
    total: 'Total Amount',
    status: 'Status',
    returnItems: 'Return Items',
    exchangeItems: 'Swap Replacement Items',
    refundAmount: 'Refund Amount',
    differenceToPay: 'Difference to Collect',

    // Promotions
    marketingStudio: 'Promotions & Social Share Studio',
    promotionsTitle: 'Boost Shop Sales with WhatsApp & Facebook',
    promotionsSubtitle: 'Create viral flyers, discount offers & share directly to customer WhatsApp and Facebook!',
    createPromotion: 'Create New Campaign',
    promoTemplates: 'Ready Promo Templates',
    shareToWhatsApp: 'Share to WhatsApp',
    shareToFacebook: 'Share on Facebook',
    copyPromoText: 'Copy Promo Text',
    copiedSuccess: 'Promo text copied to clipboard!',
    liveFlyerPreview: 'Live Visual Flyer Preview',
    discountBadge: 'OFF',
    validUntil: 'Offer Valid Until',
    offerCode: 'Coupon Code',
    promoLanguage: 'Promo Language',
    shareWithCustomers: 'Broadcast to Customers',
    featuredProduct: 'Featured Product Deal',

    // Finance & Expenses
    financeDashboard: 'Financials & Expenses',
    operatingExpenses: 'Operating Expenses',
    staffSalaries: 'Staff Salaries',
    salaryAdvances: 'Salary Advances',
    addExpense: 'Add Expense',
    paySalary: 'Process Salary Slip',
    issueAdvance: 'Issue Advance',
    monthlyExpenseTotal: 'Total Expenses This Month',
    netProfit: 'Estimated Net Profit',

    // Purchases & Supplier Returns
    purchaseOrders: 'Purchase Orders (PO)',
    purchaseReturns: 'Purchase Returns (Debit Notes)',
    createPurchaseOrder: 'Create Purchase Order',
    receiveStock: 'Receive Inward Stock',
    debitNote: 'Debit Note',
    returnToSupplier: 'Return to Supplier',
    supplierInvoice: 'Supplier Invoice / Delivery Order',
    orderDate: 'Order Date',
    deliveryDate: 'Delivery Date',
    poStatus: 'PO Status',
    paymentStatus: 'Payment Status',
    returnReason: 'Return Reason',

    // Cash Drawer Payouts
    payouts: 'Cash Payouts & Drawer Out',
    recordPayout: 'Record Cash Payout',
    payoutCategory: 'Payout Category',
    payeeName: 'Payee / Beneficiary Name',
    payoutSource: 'Cash Source',
    authorizedBy: 'Authorized By',

    // Credit
    creditLedger: 'Customer Credit Ledger',
    customerBalance: 'Current Debt / Balance',
    creditLimit: 'Credit Limit',
    addCustomer: 'Add New Customer',
    recordPayment: 'Record Settlement Payment',
    totalReceivables: 'Total Outstanding Receivables',

    // Reports
    businessReports: 'Reports & Analytics',
    dailySales: 'Daily Sales Total',
    monthlyRevenue: 'Monthly Revenue',
    topSellingProducts: 'Fast Moving Products',
    cashDrawerSummary: 'Cash Drawer Summary',

    // Settings
    shopProfile: 'Shop Profile & Branding',
    shopName: 'Shop Name',
    phone: 'Contact Phone',
    address: 'Store Address',
    receiptHeader: 'Bill Header Greeting',
    receiptFooter: 'Bill Footer Message',
    taxRate: 'Default Tax Rate (%)',
    receiptSize: 'Default Receipt Format',
    logo: 'Shop Logo',
    selectLanguage: 'System Display Language',

    // Daily Opening Briefing & Alerts
    dailyBriefing: 'Daily Opening Briefing',
    dailyOpeningAlert: 'Daily Store Opening Alerts',
    lowStockAlertTitle: 'Low Stock & Reorder Alert',
    customerBalanceAlertTitle: 'Customer Credit Balances',
    openingBriefingSubtitle: 'Automated daily inventory restocking checklist and outstanding customer credit balance monitor.',
    viewDailyBriefing: 'Open Daily Briefing',
  },

  si: {
    // Navigation (සිංහල)
    dashboard: 'පාලක පුවරුව',
    sales: 'විකුණුම් සහ ආපසු බාරගැනීම්',
    products: 'භාණ්ඩ සහ තොග කළමනාකරණය',
    categories: 'ප්‍රවර්ග (කාණ්ඩ)',
    barcodeStudio: 'බාර්කෝඩ් ලේබල් මුද්‍රණය',
    promotions: 'ප්‍රවර්ධන සහ බෙදාගැනීම්',
    customers: 'ණය පොත (උදලු)',
    expenses: 'වියදම් සහ වැටුප්',
    suppliers: 'සැපයුම්කරුවන් සහ ඇණවුම්',
    expiryBatches: 'කල් ඉකුත්වීම් සහ කාණ්ඩ',
    customFields: 'අභිරුචි ක්ෂේත්‍ර',
    users: 'කාර්ය මණ්ඩලය සහ භූමිකාවන්',
    reports: 'වාර්තා (Reports)',
    settings: 'වෙළඳසැල් සැකසුම්',
    openPos: 'POS විකුණුම් තිරය අරින්න',
    closePos: 'POS වසන්න',
    fullscreen: 'සම්පූර්ණ තිරය (Fullscreen)',
    exitFullscreen: 'සාමාන්‍ය තිරය',
    language: 'භාෂාව (Language)',
    search: 'සොයන්න...',
    notifications: 'දැනුම්දීම්',
    help: 'කෙටිමං යතුරු (F1-F12)',

    // POS
    searchProductsPlaceholder: 'බාර්කෝඩ් ස්කෑන් කරන්න හෝ නම (සිංහල / EN / தமிழ்) ටයිප් කරන්න...',
    cart: 'ක්‍රියාකාරී කරත්තය',
    emptyCart: 'කරත්තය හිස්ය. බාර්කෝඩ් ස්කෑන් කරන්න හෝ භාණ්ඩයක් තෝරන්න.',
    clearCart: 'කරත්තය හිස් කරන්න',
    holdCart: 'කරත්තය රඳවන්න',
    recallCart: 'රඳවාගත් කරත්තය ගන්න',
    customer: 'ගනුදෙනුකරු',
    walkInCustomer: 'සාමාන්‍ය ගනුදෙනුකරු (මුදල්)',
    selectCustomer: 'ගනුදෙනුකරු තෝරන්න / අලුත් අයෙක්',
    quickItems: 'නිතර අලෙවිවන භාණ්ඩ',
    allCategories: 'සියලු ප්‍රවර්ග',
    itemsInCart: 'කරත්තයේ ඇති භාණ්ඩ',
    subtotal: 'උප එකතුව',
    discount: 'වට්ටම්',
    tax: 'බදු (VAT)',
    grandTotal: 'මුළු මුදල',
    paymentMethod: 'ගෙවීම් ක්‍රමය',
    cash: 'මුදලින්',
    card: 'කාඩ්පත්',
    creditUdalu: 'ණයට',
    qrPay: 'LankaQR ගෙවීම්',
    bankTransfer: 'බැංකු හුවමාරුව',
    cheque: 'චෙක්පත්',
    splitPay: 'මිශ්‍ර ගෙවීම්',
    amountPaid: 'ලැබුණු මුදල',
    changeDue: 'ඉතිරි මුදල',
    balanceOwed: 'ණය මුදලට එකතු විය',
    completeSale: 'විකිණීම සම්පූර්ණ කරන්න (F12)',
    printBill: 'බිල්පත මුද්‍රණය',
    shareWhatsApp: 'WhatsApp මඟින් බිල යවන්න',
    enterCustomerPhone: 'ගනුදෙනුකරුගේ දුරකථන අංකය (+94 / 07X)',
    sendWhatsAppReceipt: 'WhatsApp බිල විවෘත කරන්න',
    billSharedSuccess: 'WhatsApp බිල්පත සාර්ථකව ජනනය විය!',
    newSale: 'ඊළඟ විකිණීම අරඹන්න',
    saleCompleted: 'විකිණීම සාර්ථකව අවසන් විය!',
    heldCartsCount: 'රඳවාගත් කරත්ත',
    barcodeScanHelp: 'ස්කෑනරය සක්‍රිය කිරීමට F2 ඔබන්න',
    stockLeft: 'තොග ඇත',
    reorderWarning: 'තොග අඩුවීමේ අනතුරු ඇඟවීමක්!',

    // Products
    productCatalog: 'භාණ්ඩ සහ තොග නාමාවලිය',
    addProduct: 'නව භාණ්ඩයක් එක් කරන්න',
    editProduct: 'භාණ්ඩය සංස්කරණය කරන්න',
    deleteProduct: 'භාණ්ඩය ඉවත් කරන්න',
    productName: 'භාණ්ඩයේ නම',
    productNameEnglish: 'භාණ්ඩයේ නම (English)',
    productNameSinhala: 'සිංහල නම (Sinhala Name)',
    productNameTamil: 'දෙමළ නම (Tamil Name)',
    sku: 'SKU කේතය',
    barcode: 'බාර්කෝඩ් / EAN අංකය',
    category: 'ප්‍රවර්ගය',
    brand: 'සන්නාමය / නිෂ්පාදකයා',
    unit: 'මිනුම් ඒකකය (Unit)',
    costPrice: 'ගැනුම් මිල',
    sellingPrice: 'විකුණුම් මිල (සිල්ලර)',
    wholesalePrice: 'තොග මිල',
    stockQty: 'දැනට පවතින තොගය',
    reorderLevel: 'නැවත ඇණවුම් සීමාව',
    inStock: 'තොග පවතී',
    lowStock: 'අඩු තොග',
    outOfStock: 'තොග අවසන්',
    active: 'සක්‍රිය',
    inactive: 'අක්‍රිය',
    adjustStock: 'තොග ගැලපීම',
    save: 'සුරකින්න',
    cancel: 'අවලංගු කරන්න',
    delete: 'මකන්න',
    confirmDelete: 'මෙම භාණ්ඩය මකා දැමීමට ඔබට විශ්වාසද?',
    actions: 'ක්‍රියා',
    searchProductPlaceholder: 'SKU, බාර්කෝඩ්, ඉංග්‍රීසි, සිංහල හෝ දෙමළ නමින් සොයන්න...',
    selectCategory: 'ප්‍රවර්ගය තෝරන්න',

    // Categories
    categoryManager: 'ප්‍රවර්ග කළමනාකරු',
    addCategory: 'ප්‍රවර්ගයක් එක් කරන්න',
    categoryName: 'ප්‍රවර්ගයේ නම (English)',
    categoryNameSinhala: 'සිංහල නම',
    categoryNameTamil: 'දෙමළ නම',
    itemCount: 'භාණ්ඩ ගණන',

    // Sales & Returns
    salesInvoices: 'විකුණුම් ඉන්වොයිස් සහ බිල්පත්',
    returnsAndExchanges: 'ආපසු බාරගැනීම් සහ භාණ්ඩ මාරුකිරීම්',
    processReturn: 'භාණ්ඩ ආපසු ගැනීම / මාරු කිරීම',
    reprintReceipt: 'බිල්පත නැවත මුද්‍රණය',
    invoiceNumber: 'ඉන්වොයිස් #',
    date: 'දිනය සහ වේලාව',
    cashier: 'කැෂියර්',
    itemsCount: 'භාණ්ඩ',
    total: 'මුළු මුදල',
    status: 'තත්ත්වය',
    returnItems: 'ආපසු භාරගන්නා භාණ්ඩ',
    exchangeItems: 'ඒ වෙනුවට ලබාදෙන භාණ්ඩ',
    refundAmount: 'ආපසු ගෙවිය යුතු මුදල',
    differenceToPay: 'අයකරගත යුතු වෙනස',

    // Promotions
    marketingStudio: 'ප්‍රවර්ධන සහ සමාජ මාධ්‍ය ප්‍රචාරක මැදිරිය',
    promotionsTitle: 'WhatsApp සහ Facebook මඟින් වෙළඳසැලේ අලෙවිය ඉහළ නංවන්න',
    promotionsSubtitle: 'ප්‍රවර්ධන පත්‍රිකා සහ වට්ටම් නිර්මාණය කර කෙලින්ම පාරිභෝගික WhatsApp සහ Facebook වෙත යවන්න!',
    createPromotion: 'නව ප්‍රවර්ධනයක් සාදන්න',
    promoTemplates: 'සූදානම් ප්‍රවර්ධන සැකිලි',
    shareToWhatsApp: 'WhatsApp වෙත යවන්න',
    shareToFacebook: 'Facebook හි බෙදාගන්න',
    copyPromoText: 'පෙළ පිටපත් කරන්න',
    copiedSuccess: 'ප්‍රවර්ධන පෙළ පිටපත් කරන ලදී!',
    liveFlyerPreview: 'සජීවී පත්‍රිකා පෙරදසුන',
    discountBadge: 'වට්ටම්',
    validUntil: 'වලංගු අවසන් දිනය',
    offerCode: 'කූපන් කේතය',
    promoLanguage: 'ප්‍රවර්ධන භාෂාව',
    shareWithCustomers: 'පාරිභෝගිකයන්ට යවන්න',
    featuredProduct: 'විශේෂ භාණ්ඩ දීමනාව',

    // Finance & Expenses
    financeDashboard: 'මූල්‍ය සහ වියදම් පාලනය',
    operatingExpenses: 'මෙහෙයුම් වියදම්',
    staffSalaries: 'කාර්ය මණ්ඩල වැටුප්',
    salaryAdvances: 'වැටුප් අත්තිකාරම්',
    addExpense: 'වියදමක් එක් කරන්න',
    paySalary: 'වැටුප් පත්‍රිකාව සකසන්න',
    issueAdvance: 'අත්තිකාරම් ලබාදෙන්න',
    monthlyExpenseTotal: 'මේ මස මුළු වියදම්',
    netProfit: 'ඇස්තමේන්තුගත ශුද්ධ ලාභය',

    // Purchases & Supplier Returns (සිංහල)
    purchaseOrders: 'මිලදී ගැනීමේ ඇණවුම් (PO)',
    purchaseReturns: 'සැපයුම්කරුට භාණ්ඩ ආපසු යැවීම් (Debit Notes)',
    createPurchaseOrder: 'මිලදී ගැනීමේ ඇණවුමක් සාදන්න',
    receiveStock: 'තොග ගබඩාවට බාරගන්න (Receive)',
    debitNote: 'හර පත (Debit Note)',
    returnToSupplier: 'සැපයුම්කරුට ආපසු යවන්න',
    supplierInvoice: 'සැපයුම්කරුගේ ඉන්වොයිසිය / බෙදාහැරීමේ පත්‍රිකාව',
    orderDate: 'ඇණවුම් දිනය',
    deliveryDate: 'බෙදාහැරීමේ දිනය',
    poStatus: 'ඇණවුම් තත්ත්වය',
    paymentStatus: 'ගෙවීම් තත්ත්වය',
    returnReason: 'ආපසු යැවීමට හේතුව',

    // Cash Drawer Payouts (සිංහල)
    payouts: 'මුදල් ලාච්චුවෙන් පිටතට ගෙවීම් (Payouts)',
    recordPayout: 'ලාච්චු මුදල් ගෙවීමක් සටහන් කරන්න',
    payoutCategory: 'ගෙවීම් කාණ්ඩය',
    payeeName: 'මුදල් ලබන්නාගේ නම',
    payoutSource: 'මුදල් ලබාගත් මූලාශ්‍රය',
    authorizedBy: 'අනුමත කළේ',

    // Credit
    creditLedger: 'පාරිභෝගික ණය පොත',
    customerBalance: 'ගෙවිය යුතු ණය මුදල',
    creditLimit: 'ණය සීමාව',
    addCustomer: 'නව පාරිභෝගිකයෙක් එක් කරන්න',
    recordPayment: 'ණය පියවීම් සටහන් කරන්න',
    totalReceivables: 'ලැබිය යුතු මුළු ණය එකතුව',

    // Reports
    businessReports: 'ව්‍යාපාරික වාර්තා සහ විශ්ලේෂණ',
    dailySales: 'දෛනික විකුණුම් එකතුව',
    monthlyRevenue: 'මාසික ආදායම',
    topSellingProducts: 'වැඩිපුරම අලෙවිවන භාණ්ඩ',
    cashDrawerSummary: 'මුදල් පෙට්ටියේ ශේෂය',

    // Settings
    shopProfile: 'වෙළඳසැල් විස්තර සහ සන්නාමය',
    shopName: 'වෙළඳසැලේ නම',
    phone: 'දුරකථන අංකය',
    address: 'ලිපිනය',
    receiptHeader: 'බිල්පත් ශීර්ෂය',
    receiptFooter: 'බිල්පත් පාදකය (ස්තුතිය)',
    taxRate: 'පෙරනිමි බදු ප්‍රතිශතය (%)',
    receiptSize: 'පෙරනිමි බිල්පත් ප්‍රමාණය',
    logo: 'වෙළඳසැල් ලාංඡනය',
    selectLanguage: 'පද්ධතියේ ප්‍රදර්ශන භාෂාව',

    // Daily Opening Briefing & Alerts (සිංහල)
    dailyBriefing: 'දෛනික ආරම්භක සමාලෝචනය',
    dailyOpeningAlert: 'දෛනික වෙළඳසැල් ආරම්භක දැනුම්දීම්',
    lowStockAlertTitle: 'අඩු තොග සහ නැවත ඇණවුම් දැනුම්දීම',
    customerBalanceAlertTitle: 'පාරිභෝගික ණය ශේෂ',
    openingBriefingSubtitle: 'ස්වයංක්‍රීය දෛනික තොග පිරික්සුම සහ හිඟ පාරිභෝගික ණය ශේෂ නිරීක්ෂණය.',
    viewDailyBriefing: 'දෛනික සමාලෝචනය බලන්න',
  },

  ta: {
    // Navigation (தமிழ்)
    dashboard: 'டாஷ்போர்டு',
    sales: 'விற்பனை & திரும்பப் பெறுதல்',
    products: 'பொருட்கள் & இருப்பு மேலாண்மை',
    categories: 'வகைகள் (பிரிவுகள்)',
    barcodeStudio: 'பார்கோடு லேபிள் அச்சிடுதல்',
    promotions: 'விளம்பரங்கள் & பகிர்வு',
    customers: 'கடன் புத்தகம் (உடலு)',
    expenses: 'செலவுகள் & சம்பளம்',
    suppliers: 'சப்ளையர்கள் & கொள்முதல்',
    expiryBatches: 'காலாவதி & தொகுதிகள்',
    customFields: 'தனிப்பயன் புலங்கள்',
    users: 'ஊழியர்கள் & பாத்திரங்கள்',
    reports: 'அறிக்கைகள் (Reports)',
    settings: 'கடை அமைப்புகள்',
    openPos: 'POS விற்பனை திரை',
    closePos: 'POS மூடவும்',
    fullscreen: 'முழுத்திரை (Fullscreen)',
    exitFullscreen: 'சாதாரண திரை',
    language: 'மொழி (Language)',
    search: 'தேடுக...',
    notifications: 'அறிவிப்புகள்',
    help: 'குறுக்குவழிகள் (F1-F12)',

    // POS
    searchProductsPlaceholder: 'பார்கோடு ஸ்கேன் அல்லது பெயர் (தமிழ் / EN / සිංහල)...',
    cart: 'நடப்பு வண்டி',
    emptyCart: 'வண்டி காலியாக உள்ளது. பார்கோடு ஸ்கேன் செய்யவும்.',
    clearCart: 'வண்டியை அழிக்கவும்',
    holdCart: 'வண்டியை நிறுத்துக',
    recallCart: 'நிறுத்தப்பட்ட வண்டி',
    customer: 'வாடிக்கையாளர்',
    walkInCustomer: 'வழக்கமான வாடிக்கையாளர் (ரொக்கம்)',
    selectCustomer: 'வாடிக்கையாளரைத் தேர்ந்தெடுக்கவும்',
    quickItems: 'விரைவுப் பொருட்கள்',
    allCategories: 'அனைத்து பிரிவுகள்',
    itemsInCart: 'வண்டியிலுள்ள பொருட்கள்',
    subtotal: 'கூட்டுத்தொகை',
    discount: 'தள்ளுபடி',
    tax: 'வரி (VAT)',
    grandTotal: 'மொத்த தொகை',
    paymentMethod: 'பணம் செலுத்தும் முறை',
    cash: 'ரொக்கம்',
    card: 'அட்டை',
    creditUdalu: 'கடன்',
    qrPay: 'LankaQR கட்டணம்',
    bankTransfer: 'வங்கி பரிமாற்றம்',
    cheque: 'காசோலை',
    splitPay: 'கூட்டு கட்டணம்',
    amountPaid: 'பெறப்பட்ட தொகை',
    changeDue: 'மீதி தொகை',
    balanceOwed: 'கடன் தொகையில் சேர்க்கப்பட்டது',
    completeSale: 'விற்பனையை முடிக்கவும் (F12)',
    printBill: 'ரசீதை அச்சிடுக',
    shareWhatsApp: 'WhatsApp மூலம் ரசீதை அனுப்பவும்',
    enterCustomerPhone: 'வாடிக்கையாளர் மொபைல் எண் (+94 / 07X)',
    sendWhatsAppReceipt: 'WhatsApp ரசீதை திறக்கவும்',
    billSharedSuccess: 'WhatsApp ரசீது வெற்றிகரமாக உருவாக்கப்பட்டது!',
    newSale: 'அடுத்த விற்பனை',
    saleCompleted: 'விற்பனை வெற்றிகரமாக முடிந்தது!',
    heldCartsCount: 'நிறுத்தப்பட்ட வண்டிகள்',
    barcodeScanHelp: 'ஸ்கேனரை இயக்க F2 அழுத்தவும்',
    stockLeft: 'இருப்பில் உள்ளது',
    reorderWarning: 'குறைந்த இருப்பு எச்சரிக்கை!',

    // Products
    productCatalog: 'பொருட்கள் & இருப்பு அட்டவணை',
    addProduct: 'புதிய பொருளைச் சேர்க்கவும்',
    editProduct: 'பொருளைத் திருத்தவும்',
    deleteProduct: 'பொருளை நீக்கவும்',
    productName: 'பொருளின் பெயர்',
    productNameEnglish: 'பொருளின் பெயர் (English)',
    productNameSinhala: 'சிங்களப் பெயர் (Sinhala)',
    productNameTamil: 'தமிழ் பெயர் (Tamil Name)',
    sku: 'SKU குறியீடு',
    barcode: 'பார்கோடு / EAN',
    category: 'பிரிவு',
    brand: 'பிராண்ட் / உற்பத்தியாளர்',
    unit: 'அளவீட்டு அலகு (Unit)',
    costPrice: 'வாங்கிய விலை',
    sellingPrice: 'விற்பனை விலை',
    wholesalePrice: 'மொத்த விலை',
    stockQty: 'தற்போதைய இருப்பு',
    reorderLevel: 'மீண்டும் ஆர்டர் வரம்பு',
    inStock: 'இருப்பில் உள்ளது',
    lowStock: 'குறைந்த இருப்பு',
    outOfStock: 'இருப்பு இல்லை',
    active: 'செயலில்',
    inactive: 'செயலற்றது',
    adjustStock: 'இருப்பை சரிசெய்',
    save: 'சேமிக்கவும்',
    cancel: 'ரத்துசெய்',
    delete: 'நீக்கு',
    confirmDelete: 'இந்தப் பொருளை நீக்க விரும்புகிறீர்களா?',
    actions: 'செயல்கள்',
    searchProductPlaceholder: 'SKU, பார்கோடு, தமிழ், ஆங்கிலம் அல்லது சிங்களத்தில் தேடுக...',
    selectCategory: 'பிரிவைத் தேர்ந்தெடுக்கவும்',

    // Categories
    categoryManager: 'பிரிவு மேலாளர்',
    addCategory: 'பிரிவைச் சேர்க்கவும்',
    categoryName: 'பிரிவு பெயர் (English)',
    categoryNameSinhala: 'சிங்களப் பெயர்',
    categoryNameTamil: 'தமிழ் பெயர்',
    itemCount: 'பொருட்கள்',

    // Sales & Returns
    salesInvoices: 'விற்பனை இன்வாய்ஸ்கள் & ரசீதுகள்',
    returnsAndExchanges: 'திரும்பப் பெறுதல் & மாற்றீடு',
    processReturn: 'பொருட்களை திரும்பப்பெறு / மாற்று',
    reprintReceipt: 'ரசீதை மீண்டும் அச்சிடுக',
    invoiceNumber: 'இன்வாய்ஸ் #',
    date: 'தேதி & நேரம்',
    cashier: 'காசாளர்',
    itemsCount: 'பொருட்கள்',
    total: 'மொத்த தொகை',
    status: 'நிலை',
    returnItems: 'திரும்பப் பெறும் பொருட்கள்',
    exchangeItems: 'பதிலாக வழங்கும் பொருட்கள்',
    refundAmount: 'திரும்ப அளிக்க வேண்டிய தொகை',
    differenceToPay: 'செலுத்த வேண்டிய வித்தியாசம்',

    // Promotions
    marketingStudio: 'விளம்பரங்கள் & சமூக ஊடக பகிர்வு',
    promotionsTitle: 'WhatsApp & Facebook மூலம் கடை விற்பனையை அதிகரிக்கவும்',
    promotionsSubtitle: 'கவர்ச்சிகரமான சுவரொட்டிகள் மற்றும் தள்ளுபடி சலுகைகளை உருவாக்கி நேரடியாக WhatsApp மற்றும் Facebook இல் பகிரவும்!',
    createPromotion: 'புதிய விளம்பரத்தை உருவாக்கு',
    promoTemplates: 'தயாரான விளம்பர வார்ப்புருக்கள்',
    shareToWhatsApp: 'WhatsApp இல் பகிரவும்',
    shareToFacebook: 'Facebook இல் பகிரவும்',
    copyPromoText: 'உரையை நகலெடுக்கவும்',
    copiedSuccess: 'விளம்பர உரை நகலெடுக்கப்பட்டது!',
    liveFlyerPreview: 'சுவரொட்டி நேரலை மாதிரிக்காட்சி',
    discountBadge: 'தள்ளுபடி',
    validUntil: 'செல்லுபடியாகும் கடைசி நாள்',
    offerCode: 'கூப்பன் குறியீடு',
    promoLanguage: 'விளம்பர மொழி',
    shareWithCustomers: 'வாடிக்கையாளர்களுக்கு அனுப்பவும்',
    featuredProduct: 'சிறப்புப் பொருள் சலுகை',

    // Finance & Expenses
    financeDashboard: 'நிதி & செலவு மேலாண்மை',
    operatingExpenses: 'செயல்பாட்டுச் செலவுகள்',
    staffSalaries: 'ஊழியர் சம்பளம்',
    salaryAdvances: 'சம்பள முன்பணம்',
    addExpense: 'செலவைச் சேர்க்கவும்',
    paySalary: 'சம்பள சீட்டை உருவாக்கவும்',
    issueAdvance: 'முன்பணம் வழங்கவும்',
    monthlyExpenseTotal: 'இந்த மாத மொத்த செலவுகள்',
    netProfit: 'மதிப்பிடப்பட்ட நிகர லாபம்',

    // Purchases & Supplier Returns (தமிழ்)
    purchaseOrders: 'கொள்முதல் ஆணைகள் (PO)',
    purchaseReturns: 'சப்ளையர் திரும்ப ஒப்படைப்பு (Debit Notes)',
    createPurchaseOrder: 'கொள்முதல் ஆணை உருவாக்கு',
    receiveStock: 'பொருட்களை இருப்புக்குள் பெறுக',
    debitNote: 'பற்று குறிப்பு (Debit Note)',
    returnToSupplier: 'சப்ளையருக்கு திரும்ப அனுப்பு',
    supplierInvoice: 'சப்ளையர் விலைப்பட்டியல் / டெலிவரி குறிப்பு',
    orderDate: 'ஆணை தேதி',
    deliveryDate: 'டெலிவரி தேதி',
    poStatus: 'ஆணை நிலை',
    paymentStatus: 'கட்டண நிலை',
    returnReason: 'திரும்பப் பெறுவதற்கான காரணம்',

    // Cash Drawer Payouts (தமிழ்)
    payouts: 'பணப் பெட்டியிலிருந்து பணம் செலுத்துதல் (Payouts)',
    recordPayout: 'பணப் பட்டுவாடாவை பதிவு செய்',
    payoutCategory: 'செலுத்தல் வகை',
    payeeName: 'பணம் பெறுபவர் பெயர்',
    payoutSource: 'பண ஆதாரம்',
    authorizedBy: 'அனுமதித்தவர்',

    // Credit
    creditLedger: 'வாடிக்கையாளர் கடன் புத்தகம்',
    customerBalance: 'செலுத்த வேண்டிய கடன்',
    creditLimit: 'கடன் வரம்பு',
    addCustomer: 'புதிய வாடிக்கையாளர்',
    recordPayment: 'கடன் செலுத்துதலைப் பதிவு செய்',
    totalReceivables: 'மொத்த வரவு தொகை',

    // Reports
    businessReports: 'வணிக அறிக்கைகள் & பகுப்பாய்வு',
    dailySales: 'தினசரி விற்பனை மொத்தம்',
    monthlyRevenue: 'மாதாந்திர வருவாய்',
    topSellingProducts: 'அதிகம் விற்கப்படும் பொருட்கள்',
    cashDrawerSummary: 'பணப் பெட்டி இருப்பு',

    // Settings
    shopProfile: 'கடை விவரங்கள் & பிராண்டிங்',
    shopName: 'கடையின் பெயர்',
    phone: 'தொலைபேசி எண்',
    address: 'முகவரி',
    receiptHeader: 'ரசீது தலைப்பு செய்தி',
    receiptFooter: 'ரசீது முடிவு செய்தி (நன்றி)',
    taxRate: 'இயல்புநிலை வரி (%)',
    receiptSize: 'இயல்புநிலை ரசீது அளவு',
    logo: 'கடை லோகோ',
    selectLanguage: 'காட்சி மொழி',

    // Daily Opening Briefing & Alerts (தமிழ்)
    dailyBriefing: 'தினசரி திறப்பு சுருக்கம்',
    dailyOpeningAlert: 'தினசரி கடை திறப்பு எச்சரிக்கைகள்',
    lowStockAlertTitle: 'குறைந்த இருப்பு மற்றும் மறுவரிசை எச்சரிக்கை',
    customerBalanceAlertTitle: 'வாடிக்கையாளர் கடன் நிலுவைகள்',
    openingBriefingSubtitle: 'தானியங்கி தினசரி சரக்கு சரிபார்ப்பு மற்றும் நிலுவையில் உள்ள வாடிக்கையாளர் கடன் கண்காணிப்பு.',
    viewDailyBriefing: 'தினசரி சுருக்கத்தைத் திறக்கவும்',
  },
};

/**
 * Helper to get localized product name based on active language
 */
export function getLocalizedProductName(
  product: { name: string; name_si?: string; name_ta?: string },
  lang: Language
): string {
  if (lang === 'si' && product.name_si) return product.name_si;
  if (lang === 'ta' && product.name_ta) return product.name_ta;
  return product.name;
}

/**
 * Helper to get localized category name
 */
export function getLocalizedCategoryName(
  category: { name: string; name_si?: string; name_ta?: string },
  lang: Language
): string {
  if (lang === 'si' && category.name_si) return category.name_si;
  if (lang === 'ta' && category.name_ta) return category.name_ta;
  return category.name;
}
