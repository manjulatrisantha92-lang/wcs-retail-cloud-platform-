import * as XLSX from 'xlsx';
import { Category, Product, Customer, Expense, Tenant, Sale, PurchaseOrder } from '../types';

/**
 * Format helper to trigger browser download of a workbook
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  const cleanName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, cleanName);
}

/**
 * Helper to style worksheet column widths
 */
function autoFitColumns(data: Record<string, any>[]): { wch: number }[] {
  if (!data || data.length === 0) return [{ wch: 15 }];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        if (strVal.length > maxLen) {
          maxLen = Math.min(strVal.length, 50); // cap max column width
        }
      }
    });
    return { wch: Math.max(maxLen + 3, 12) };
  });
}

/* ==========================================================================
   1. CATEGORIES IMPORT & EXPORT
   ========================================================================== */

export function exportCategoriesToExcel(
  categories: Category[],
  products: Product[] = [],
  tenant?: Tenant
) {
  const exportData = categories.map((cat, idx) => {
    const productCount = products.filter(
      (p) => p.category?.toLowerCase() === cat.name?.toLowerCase()
    ).length;
    return {
      'Category #': idx + 1,
      'Category Name (English)': cat.name || '',
      'Category Name (Sinhala)': cat.name_si || '',
      'Category Name (Tamil)': cat.name_ta || '',
      'Color Hex': cat.color || '#4f46e5',
      'Total Products': productCount,
      'Tenant ID': cat.tenant_id || tenant?.tenant_id || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Categories');

  const shopName = tenant?.shop_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Shop';
  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `${shopName}_Categories_${dateStr}.xlsx`);
}

export function downloadCategoryExcelTemplate() {
  const sampleData = [
    {
      'Category Name': 'Fresh Beverages',
      'Sinhala Name': 'බීම වර්ග',
      'Tamil Name': 'குளிர்பானங்கள்',
      'Color Hex': '#ea580c',
    },
    {
      'Category Name': 'Snacks & Biscuits',
      'Sinhala Name': 'කෙටි කෑම සහ බිස්කට්',
      'Tamil Name': 'சிற்றுண்டிகள்',
      'Color Hex': '#db2777',
    },
    {
      'Category Name': 'Personal Care',
      'Sinhala Name': 'පුද්ගලික සත්කාර',
      'Tamil Name': 'தனிப்பட்ட பராமரிப்பு',
      'Color Hex': '#0d9488',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = autoFitColumns(sampleData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Category_Template');
  downloadWorkbook(wb, 'WCS_Category_Import_Template.xlsx');
}

export async function parseCategoriesFromFile(
  file: File,
  tenantId: string
): Promise<{ imported: Omit<Category, 'id'>[]; errors: string[]; totalRows: number }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const imported: Omit<Category, 'id'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const name =
      row['Category Name'] ||
      row['Category Name (English)'] ||
      row['Category'] ||
      row['name'] ||
      row['Name'] ||
      '';

    if (!String(name).trim()) {
      errors.push(`Row ${rowNum}: Category Name is missing or empty.`);
      return;
    }

    const nameSi = row['Sinhala Name'] || row['Category Name (Sinhala)'] || row['name_si'] || '';
    const nameTa = row['Tamil Name'] || row['Category Name (Tamil)'] || row['name_ta'] || '';
    const color = row['Color Hex'] || row['color'] || '#4f46e5';

    imported.push({
      tenant_id: tenantId,
      name: String(name).trim(),
      name_si: String(nameSi).trim() || undefined,
      name_ta: String(nameTa).trim() || undefined,
      color: String(color).trim() || '#4f46e5',
      icon_name: 'Folder',
    });
  });

  return { imported, errors, totalRows: rows.length };
}

/* ==========================================================================
   2. PRODUCTS IMPORT & EXPORT
   ========================================================================== */

export function exportProductsToExcel(
  products: Product[],
  categories: Category[] = [],
  tenant?: Tenant
) {
  const exportData = products.map((p, idx) => ({
    '#': idx + 1,
    'SKU': p.sku || '',
    'Barcode': p.barcode || '',
    'Product Name (English)': p.name || '',
    'Product Name (Sinhala)': p.name_si || '',
    'Product Name (Tamil)': p.name_ta || '',
    'Category': p.category || 'General',
    'Brand': p.brand || '',
    'Unit': p.unit || 'pcs',
    'Cost Price (Rs)': Number(p.cost_price || 0),
    'Selling Price (Rs)': Number(p.selling_price || 0),
    'Wholesale Price (Rs)': Number(p.wholesale_price || 0),
    'Stock Quantity': Number(p.stock_quantity || 0),
    'Reorder Level': Number(p.reorder_level || 5),
    'Status': p.is_active ? 'Active' : 'Inactive',
    'Tenant ID': p.tenant_id || tenant?.tenant_id || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const shopName = tenant?.shop_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Shop';
  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `${shopName}_Products_${dateStr}.xlsx`);
}

export function downloadProductExcelTemplate() {
  const sampleData = [
    {
      'SKU': 'SKU-1001',
      'Barcode': '4792001001234',
      'Product Name': 'Keeri Samba Rice 5kg',
      'Sinhala Name': 'කීරි සම්බා සහල් 5kg',
      'Tamil Name': 'கீரி சம்பா அரிசி 5kg',
      'Category': 'Rice & Grains',
      'Brand': 'Araliya',
      'Unit': 'pack',
      'Cost Price': 1250,
      'Selling Price': 1480,
      'Wholesale Price': 1380,
      'Stock Quantity': 50,
      'Reorder Level': 10,
    },
    {
      'SKU': 'SKU-1002',
      'Barcode': '4792001005678',
      'Product Name': 'Full Cream Milk Powder 400g',
      'Sinhala Name': 'කිරිපිටි 400g',
      'Tamil Name': 'பால் மா 400g',
      'Category': 'Dairy & Milk',
      'Brand': 'Anchor',
      'Unit': 'pack',
      'Cost Price': 980,
      'Selling Price': 1120,
      'Wholesale Price': 1050,
      'Stock Quantity': 35,
      'Reorder Level': 8,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = autoFitColumns(sampleData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products_Template');
  downloadWorkbook(wb, 'WCS_Products_Import_Template.xlsx');
}

export async function parseProductsFromFile(
  file: File,
  tenantId: string
): Promise<{ imported: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[]; errors: string[]; totalRows: number }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const imported: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const name =
      row['Product Name'] ||
      row['Product Name (English)'] ||
      row['Name'] ||
      row['name'] ||
      row['Item Name'] ||
      '';

    if (!String(name).trim()) {
      errors.push(`Row ${rowNum}: Product Name is missing.`);
      return;
    }

    const sku =
      String(row['SKU'] || row['sku'] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const barcode =
      String(
        row['Barcode'] ||
          row['barcode'] ||
          `479${Math.floor(1000000000 + Math.random() * 9000000000)}`
      ).trim();
    const nameSi = row['Sinhala Name'] || row['Product Name (Sinhala)'] || row['name_si'] || '';
    const nameTa = row['Tamil Name'] || row['Product Name (Tamil)'] || row['name_ta'] || '';
    const category =
      String(row['Category'] || row['category'] || 'General').trim() || 'General';
    const brand = String(row['Brand'] || row['brand'] || '').trim();
    const unit = String(row['Unit'] || row['unit'] || 'pcs').toLowerCase() as Product['unit'];

    const costPrice = Number(row['Cost Price'] || row['Cost Price (Rs)'] || row['cost_price'] || 0) || 0;
    const sellingPrice =
      Number(row['Selling Price'] || row['Selling Price (Rs)'] || row['selling_price'] || 0) || 0;
    const wholesalePrice =
      Number(
        row['Wholesale Price'] || row['Wholesale Price (Rs)'] || row['wholesale_price'] || sellingPrice
      ) || sellingPrice;
    const stockQuantity =
      Number(row['Stock Quantity'] || row['stock_quantity'] || row['Stock'] || row['Qty'] || 0) || 0;
    const reorderLevel =
      Number(row['Reorder Level'] || row['reorder_level'] || 5) || 5;

    imported.push({
      sku,
      barcode,
      name: String(name).trim(),
      name_si: String(nameSi).trim() || undefined,
      name_ta: String(nameTa).trim() || undefined,
      category,
      brand,
      unit: (['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'dozen', 'bottle', 'can'].includes(unit)
        ? unit
        : 'pcs') as Product['unit'],
      cost_price: costPrice,
      selling_price: sellingPrice,
      wholesale_price: wholesalePrice,
      stock_quantity: stockQuantity,
      reorder_level: reorderLevel,
      is_active: true,
      custom_fields: {},
    });
  });

  return { imported, errors, totalRows: rows.length };
}

/* ==========================================================================
   3. CUSTOMERS & CREDIT IMPORT & EXPORT
   ========================================================================== */

export function exportCustomersToExcel(customers: Customer[], tenant?: Tenant) {
  const exportData = customers.map((c, idx) => ({
    '#': idx + 1,
    'Customer Name': c.name || '',
    'Phone Number': c.phone || '',
    'Email Address': c.email || '',
    'Address / Location': c.address || '',
    'NIC / BR Number': c.nic_or_br || '',
    'Credit Limit (Rs)': Number(c.credit_limit || 0),
    'Current Credit Balance (Rs)': Number(c.current_balance || 0),
    'Loyalty Points': Number(c.loyalty_points || 0),
    'Notes / Remarks': c.notes || '',
    'Tenant ID': c.tenant_id || tenant?.tenant_id || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');

  const shopName = tenant?.shop_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Shop';
  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `${shopName}_Customers_${dateStr}.xlsx`);
}

export function downloadCustomerExcelTemplate() {
  const sampleData = [
    {
      'Customer Name': 'Kasun Perera',
      'Phone Number': '0771234567',
      'Email Address': 'kasun.p@gmail.com',
      'Address': '45 Galle Road, Colombo 03',
      'NIC or BR': '199012345678',
      'Credit Limit': 50000,
      'Opening Balance': 0,
      'Loyalty Points': 120,
      'Notes': 'Regular VIP customer',
    },
    {
      'Customer Name': 'Dilshan Weerasinghe',
      'Phone Number': '0719876543',
      'Email Address': 'dilshan.w@yahoo.com',
      'Address': '12 Temple Road, Kandy',
      'NIC or BR': '198576543210',
      'Credit Limit': 25000,
      'Opening Balance': 4500,
      'Loyalty Points': 45,
      'Notes': 'Monthly credit account',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = autoFitColumns(sampleData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers_Template');
  downloadWorkbook(wb, 'WCS_Customers_Import_Template.xlsx');
}

export async function parseCustomersFromFile(
  file: File,
  tenantId: string
): Promise<{ imported: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[]; errors: string[]; totalRows: number }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const imported: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const name =
      row['Customer Name'] ||
      row['Name'] ||
      row['name'] ||
      row['Full Name'] ||
      '';

    if (!String(name).trim()) {
      errors.push(`Row ${rowNum}: Customer Name is missing.`);
      return;
    }

    const phone =
      String(row['Phone Number'] || row['Phone'] || row['phone'] || row['Mobile'] || '').trim();
    const email = String(row['Email Address'] || row['Email'] || row['email'] || '').trim();
    const address = String(row['Address / Location'] || row['Address'] || row['address'] || '').trim();
    const nic = String(row['NIC / BR Number'] || row['NIC or BR'] || row['NIC'] || row['nic_or_br'] || '').trim();

    const creditLimit = Number(row['Credit Limit (Rs)'] || row['Credit Limit'] || row['credit_limit'] || 0) || 0;
    const balance =
      Number(
        row['Current Credit Balance (Rs)'] ||
          row['Current Udalu Balance (Rs)'] ||
          row['Opening Balance'] ||
          row['Current Balance'] ||
          row['current_balance'] ||
          0
      ) || 0;
    const loyalty = Number(row['Loyalty Points'] || row['loyalty_points'] || 0) || 0;
    const notes = String(row['Notes / Remarks'] || row['Notes'] || row['notes'] || '').trim();

    imported.push({
      name: String(name).trim(),
      phone: phone || '0700000000',
      email: email || undefined,
      address: address || undefined,
      nic_or_br: nic || undefined,
      credit_limit: creditLimit,
      current_balance: balance,
      loyalty_points: loyalty,
      notes: notes || undefined,
    });
  });

  return { imported, errors, totalRows: rows.length };
}

/* ==========================================================================
   4. EXPENSES & PAYOUTS IMPORT & EXPORT
   ========================================================================== */

export function exportExpensesToExcel(expenses: Expense[], tenant?: Tenant) {
  const exportData = expenses.map((e, idx) => ({
    '#': idx + 1,
    'Date': e.date || '',
    'Category': e.category || 'OTHER',
    'Amount (Rs)': Number(e.amount || 0),
    'Description': e.description || '',
    'Payment Method': e.payment_method || 'CASH',
    'Recorded By': e.recorded_by || 'Admin',
    'Receipt Ref / Bill #': e.receipt_ref || '',
    'Tenant ID': e.tenant_id || tenant?.tenant_id || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = autoFitColumns(exportData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

  const shopName = tenant?.shop_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Shop';
  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `${shopName}_Expenses_${dateStr}.xlsx`);
}

export function downloadExpenseExcelTemplate() {
  const sampleData = [
    {
      'Date': '2026-09-01',
      'Category': 'UTILITIES',
      'Amount': 8500,
      'Description': 'Ceylon Electricity Board Bill - August',
      'Payment Method': 'BANK_TRANSFER',
      'Receipt Ref': 'CEB-AUG-991',
    },
    {
      'Date': '2026-09-02',
      'Category': 'TEA_SNACKS',
      'Amount': 750,
      'Description': 'Staff Tea & Snacks Daily Payout',
      'Payment Method': 'CASH',
      'Receipt Ref': 'PETTY-001',
    },
    {
      'Date': '2026-09-02',
      'Category': 'PACKAGING',
      'Amount': 3200,
      'Description': 'Polythene carry bags & thermal rolls',
      'Payment Method': 'CASH',
      'Receipt Ref': 'PACK-104',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = autoFitColumns(sampleData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses_Template');
  downloadWorkbook(wb, 'WCS_Expenses_Import_Template.xlsx');
}

export async function parseExpensesFromFile(
  file: File,
  tenantId: string
): Promise<{ imported: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[]; errors: string[]; totalRows: number }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const imported: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const amount = Number(row['Amount'] || row['Amount (Rs)'] || row['amount'] || 0);

    if (!amount || isNaN(amount) || amount <= 0) {
      errors.push(`Row ${rowNum}: Invalid expense amount.`);
      return;
    }

    const description =
      String(
        row['Description'] || row['description'] || row['Reason'] || row['Expense Details'] || 'Shop Expense'
      ).trim();
    const category = String(row['Category'] || row['category'] || 'OTHER').toUpperCase();
    const date =
      String(row['Date'] || row['date'] || new Date().toISOString().split('T')[0]).trim();
    const method = String(row['Payment Method'] || row['payment_method'] || 'CASH').toUpperCase();
    const ref = String(row['Receipt Ref / Bill #'] || row['Receipt Ref'] || row['receipt_ref'] || '').trim();

    imported.push({
      category: category || 'OTHER',
      amount,
      description: description || 'Expense Entry',
      payment_method: (['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE'].includes(method)
        ? method
        : 'CASH') as Expense['payment_method'],
      date: date || new Date().toISOString().split('T')[0],
      receipt_ref: ref || undefined,
    });
  });

  return { imported, errors, totalRows: rows.length };
}

/* ==========================================================================
   5. COMPLETE SHOP ALL-IN-ONE MULTI-SHEET WORKBOOK
   ========================================================================== */

export function exportCompleteShopWorkbook(data: {
  tenant?: Tenant;
  categories: Category[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  sales?: Sale[];
  purchases?: PurchaseOrder[];
}) {
  const wb = XLSX.utils.book_new();
  const { tenant, categories, products, customers, expenses, sales } = data;

  // 1. Overview Sheet
  const overviewData = [
    { Parameter: 'Shop Name', Value: tenant?.shop_name || 'Retail Shop' },
    { Parameter: 'Tenant ID', Value: tenant?.tenant_id || '' },
    { Parameter: 'Business Type', Value: tenant?.business_type || '' },
    { Parameter: 'Branch', Value: tenant?.branch_name || '' },
    { Parameter: 'Address', Value: tenant?.address || '' },
    { Parameter: 'Phone', Value: tenant?.phone || '' },
    { Parameter: 'Export Date', Value: new Date().toLocaleString() },
    { Parameter: 'Total Categories', Value: categories.length },
    { Parameter: 'Total Products', Value: products.length },
    {
      Parameter: 'Total Stock Value (Retail)',
      Value: products.reduce((acc, p) => acc + (p.stock_quantity || 0) * (p.selling_price || 0), 0),
    },
    { Parameter: 'Total Customers', Value: customers.length },
    {
      Parameter: 'Total Customer Credit Owed',
      Value: customers.reduce((acc, c) => acc + (c.current_balance || 0), 0),
    },
    { Parameter: 'Total Logged Expenses', Value: expenses.length },
    {
      Parameter: 'Total Expenses Sum',
      Value: expenses.reduce((acc, e) => acc + (e.amount || 0), 0),
    },
  ];
  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Shop_Overview');

  // 2. Categories Sheet
  const catData = categories.map((c, i) => ({
    '#': i + 1,
    'Category Name': c.name,
    'Sinhala Name': c.name_si || '',
    'Tamil Name': c.name_ta || '',
    'Color': c.color || '#4f46e5',
  }));
  const wsCat = XLSX.utils.json_to_sheet(catData);
  wsCat['!cols'] = autoFitColumns(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Categories');

  // 3. Products Sheet
  const prodData = products.map((p, i) => ({
    '#': i + 1,
    'SKU': p.sku,
    'Barcode': p.barcode,
    'Product Name': p.name,
    'Sinhala Name': p.name_si || '',
    'Tamil Name': p.name_ta || '',
    'Category': p.category,
    'Brand': p.brand,
    'Unit': p.unit,
    'Cost Price': p.cost_price,
    'Selling Price': p.selling_price,
    'Wholesale Price': p.wholesale_price,
    'Stock Quantity': p.stock_quantity,
    'Reorder Level': p.reorder_level,
    'Stock Value': (p.stock_quantity || 0) * (p.selling_price || 0),
  }));
  const wsProd = XLSX.utils.json_to_sheet(prodData);
  wsProd['!cols'] = autoFitColumns(prodData);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Products');

  // 4. Customers Sheet
  const custData = customers.map((c, i) => ({
    '#': i + 1,
    'Customer Name': c.name,
    'Phone': c.phone,
    'Email': c.email || '',
    'Address': c.address || '',
    'NIC/BR': c.nic_or_br || '',
    'Credit Limit': c.credit_limit,
    'Current Credit Balance': c.current_balance,
    'Loyalty Points': c.loyalty_points,
    'Notes': c.notes || '',
  }));
  const wsCust = XLSX.utils.json_to_sheet(custData);
  wsCust['!cols'] = autoFitColumns(custData);
  XLSX.utils.book_append_sheet(wb, wsCust, 'Customers');

  // 5. Expenses Sheet
  const expData = expenses.map((e, i) => ({
    '#': i + 1,
    'Date': e.date,
    'Category': e.category,
    'Amount': e.amount,
    'Description': e.description,
    'Payment Method': e.payment_method,
    'Recorded By': e.recorded_by,
    'Receipt Ref': e.receipt_ref || '',
  }));
  const wsExp = XLSX.utils.json_to_sheet(expData);
  wsExp['!cols'] = autoFitColumns(expData);
  XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');

  // 6. Recent Sales Sheet (if available)
  if (sales && sales.length > 0) {
    const saleData = sales.map((s, i) => ({
      '#': i + 1,
      'Invoice No': s.invoice_no,
      'Date': s.created_at,
      'Cashier': s.cashier_name,
      'Customer': s.customer_name || 'Walk-in',
      'Items Count': s.items?.length || 0,
      'Grand Total': s.grand_total,
      'Paid': s.paid_amount,
      'Balance Due': s.balance_due,
      'Payment Method': s.payment_method,
      'Status': s.status,
    }));
    const wsSale = XLSX.utils.json_to_sheet(saleData);
    wsSale['!cols'] = autoFitColumns(saleData);
    XLSX.utils.book_append_sheet(wb, wsSale, 'Sales_Invoices');
  }

  const shopName = tenant?.shop_name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Shop';
  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `${shopName}_Master_Workbook_${dateStr}.xlsx`);
}

/* ==========================================================================
   6. ALL SHOPS MASTER BACKUP WORKBOOK (SUPER ADMIN / ENTERPRISE)
   ========================================================================== */

export function exportAllShopsMasterWorkbook(
  allTenants: Tenant[],
  allCategories: Category[],
  allProducts: Product[],
  allCustomers: Customer[],
  allExpenses: Expense[]
) {
  const wb = XLSX.utils.book_new();

  // 1. All Tenants Sheet
  const tenantsData = allTenants.map((t, idx) => ({
    '#': idx + 1,
    'Tenant ID': t.tenant_id,
    'Shop Name': t.shop_name,
    'Company': t.company_name,
    'Business Type': t.business_type,
    'Branch': t.branch_name,
    'Phone': t.phone,
    'Email': t.email,
    'Address': t.address,
    'BR Number': t.br_number || '',
    'VAT Number': t.vat_number || '',
    'Currency': t.currency || 'LKR',
  }));
  const wsTenants = XLSX.utils.json_to_sheet(tenantsData);
  wsTenants['!cols'] = autoFitColumns(tenantsData);
  XLSX.utils.book_append_sheet(wb, wsTenants, 'All_Shops');

  // 2. All Categories
  const catData = allCategories.map((c, i) => ({
    '#': i + 1,
    'Tenant ID': c.tenant_id,
    'Category Name': c.name,
    'Sinhala': c.name_si || '',
    'Tamil': c.name_ta || '',
    'Color': c.color || '',
  }));
  const wsCat = XLSX.utils.json_to_sheet(catData);
  wsCat['!cols'] = autoFitColumns(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'All_Categories');

  // 3. All Products
  const prodData = allProducts.map((p, i) => ({
    '#': i + 1,
    'Tenant ID': p.tenant_id,
    'SKU': p.sku,
    'Barcode': p.barcode,
    'Product Name': p.name,
    'Sinhala': p.name_si || '',
    'Tamil': p.name_ta || '',
    'Category': p.category,
    'Brand': p.brand,
    'Unit': p.unit,
    'Cost Price': p.cost_price,
    'Selling Price': p.selling_price,
    'Wholesale Price': p.wholesale_price,
    'Stock Qty': p.stock_quantity,
    'Reorder Level': p.reorder_level,
  }));
  const wsProd = XLSX.utils.json_to_sheet(prodData);
  wsProd['!cols'] = autoFitColumns(prodData);
  XLSX.utils.book_append_sheet(wb, wsProd, 'All_Products');

  // 4. All Customers
  const custData = allCustomers.map((c, i) => ({
    '#': i + 1,
    'Tenant ID': c.tenant_id,
    'Customer Name': c.name,
    'Phone': c.phone,
    'Email': c.email || '',
    'Address': c.address || '',
    'NIC/BR': c.nic_or_br || '',
    'Credit Limit': c.credit_limit,
    'Current Balance': c.current_balance,
    'Loyalty Points': c.loyalty_points,
  }));
  const wsCust = XLSX.utils.json_to_sheet(custData);
  wsCust['!cols'] = autoFitColumns(custData);
  XLSX.utils.book_append_sheet(wb, wsCust, 'All_Customers');

  // 5. All Expenses
  const expData = allExpenses.map((e, i) => ({
    '#': i + 1,
    'Tenant ID': e.tenant_id,
    'Date': e.date,
    'Category': e.category,
    'Amount': e.amount,
    'Description': e.description,
    'Payment Method': e.payment_method,
    'Recorded By': e.recorded_by,
  }));
  const wsExp = XLSX.utils.json_to_sheet(expData);
  wsExp['!cols'] = autoFitColumns(expData);
  XLSX.utils.book_append_sheet(wb, wsExp, 'All_Expenses');

  const dateStr = new Date().toISOString().split('T')[0];
  downloadWorkbook(wb, `WCS_Retail_Cloud_ALL_SHOPS_MASTER_EXPORT_${dateStr}.xlsx`);
}

export function downloadMasterAllInOneExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Instructions
  const instructions = [
    { Step: '1', Guide: 'Fill in the Categories sheet first with all department / group names.' },
    { Step: '2', Guide: 'Fill in the Products sheet. Make sure Category matches a Category name exactly.' },
    { Step: '3', Guide: 'Fill in Customers sheet with phone numbers and credit limits.' },
    { Step: '4', Guide: 'Fill in Expenses sheet with past operating bills and payouts.' },
    { Step: '5', Guide: 'Upload this file into the WCS Excel Import Studio to bulk populate your shop!' },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 10 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

  // Sheet 2: Categories
  const catData = [
    { 'Category Name': 'Beverages & Drinks', 'Sinhala Name': 'බීම වර්ග', 'Tamil Name': 'குளிர்பானங்கள்', 'Color Hex': '#ea580c' },
    { 'Category Name': 'Grocery Essentials', 'Sinhala Name': 'අත්‍යවශ්‍ය ද්‍රව්‍ය', 'Tamil Name': 'அத்தியாவசிய பொருட்கள்', 'Color Hex': '#059669' },
  ];
  const wsCat = XLSX.utils.json_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Categories');

  // Sheet 3: Products
  const prodData = [
    { 'SKU': 'SKU-001', 'Barcode': '4790001001', 'Product Name': 'Sample Product 1', 'Sinhala Name': '', 'Tamil Name': '', 'Category': 'Grocery Essentials', 'Brand': 'BrandA', 'Unit': 'pcs', 'Cost Price': 100, 'Selling Price': 150, 'Wholesale Price': 140, 'Stock Quantity': 25, 'Reorder Level': 5 },
  ];
  const wsProd = XLSX.utils.json_to_sheet(prodData);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Products');

  // Sheet 4: Customers
  const custData = [
    { 'Customer Name': 'Sample Customer', 'Phone Number': '0770000000', 'Email Address': '', 'Address': '', 'NIC or BR': '', 'Credit Limit': 10000, 'Opening Balance': 0, 'Loyalty Points': 0, 'Notes': '' },
  ];
  const wsCust = XLSX.utils.json_to_sheet(custData);
  XLSX.utils.book_append_sheet(wb, wsCust, 'Customers');

  // Sheet 5: Expenses
  const expData = [
    { 'Date': '2026-09-01', 'Category': 'PETTY_CASH', 'Amount': 500, 'Description': 'Tea and refreshments', 'Payment Method': 'CASH', 'Receipt Ref': '' },
  ];
  const wsExp = XLSX.utils.json_to_sheet(expData);
  XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');

  downloadWorkbook(wb, 'WCS_All_In_One_Master_Shop_Template.xlsx');
}

/**
 * Multi-Sheet Master Workbook Parser
 * Reads sheets: All_Shops/Tenants, Categories/All_Categories, Products/All_Products, Customers/All_Customers, Expenses/All_Expenses
 */
export async function parseMasterWorkbookFromFile(
  file: File,
  defaultTenantId: string = 'SHOP001'
): Promise<{
  tenants: Partial<Tenant>[];
  categories: Omit<Category, 'id'>[];
  products: Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[];
  customers: Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[];
  expenses: Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[];
  errors: string[];
  totalRows: number;
  categoriesCount: number;
  productsCount: number;
  customersCount: number;
  expensesCount: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result = {
          tenants: [] as Partial<Tenant>[],
          categories: [] as Omit<Category, 'id'>[],
          products: [] as Omit<Product, 'id' | 'tenant_id' | 'branch_id'>[],
          customers: [] as Omit<Customer, 'id' | 'tenant_id' | 'created_at'>[],
          expenses: [] as Omit<Expense, 'id' | 'tenant_id' | 'recorded_by'>[],
          errors: [] as string[],
          totalRows: 0,
          categoriesCount: 0,
          productsCount: 0,
          customersCount: 0,
          expensesCount: 0,
        };

        const sheetNames = workbook.SheetNames;

        // 1. Categories Sheet
        const catSheetName = sheetNames.find((s) => /categor/i.test(s));
        if (catSheetName) {
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[catSheetName]);
          rows.forEach((row, i) => {
            const name = String(row['Category Name'] || row['Category Name (English)'] || row['name'] || '').trim();
            if (name) {
              result.categories.push({
                name,
                name_si: String(row['Sinhala Name'] || row['Category Name (Sinhala)'] || row['name_si'] || row['Sinhala'] || '').trim() || undefined,
                name_ta: String(row['Tamil Name'] || row['Category Name (Tamil)'] || row['name_ta'] || row['Tamil'] || '').trim() || undefined,
                color: String(row['Color Hex'] || row['color'] || row['Color'] || '#4f46e5').trim(),
                tenant_id: String(row['Tenant ID'] || defaultTenantId).trim(),
              });
              result.totalRows++;
            } else {
              result.errors.push(`Categories Row #${i + 2}: Skipped due to missing category name.`);
            }
          });
        }

        // 2. Products Sheet
        const prodSheetName = sheetNames.find((s) => /product/i.test(s));
        if (prodSheetName) {
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[prodSheetName]);
          rows.forEach((row, i) => {
            const name = String(row['Product Name'] || row['name'] || '').trim();
            if (name) {
              result.products.push({
                name,
                name_si: String(row['Sinhala Name'] || row['Sinhala'] || row['name_si'] || '').trim() || undefined,
                name_ta: String(row['Tamil Name'] || row['Tamil'] || row['name_ta'] || '').trim() || undefined,
                sku: String(row['SKU'] || row['sku'] || `SKU-${Date.now().toString().slice(-4)}-${i + 1}`).trim(),
                barcode: String(row['Barcode'] || row['barcode'] || '').trim() || undefined,
                category: String(row['Category'] || row['category'] || 'General').trim(),
                brand: String(row['Brand'] || row['brand'] || '').trim() || undefined,
                unit: (String(row['Unit'] || row['unit'] || 'pcs').trim().toLowerCase() as any) || 'pcs',
                cost_price: Number(row['Cost Price'] || row['cost_price'] || 0) || 0,
                selling_price: Number(row['Selling Price'] || row['selling_price'] || row['Price'] || 0) || 0,
                wholesale_price: Number(row['Wholesale Price'] || row['wholesale_price'] || 0) || undefined,
                stock_quantity: Number(row['Stock Quantity'] || row['Stock Qty'] || row['stock_quantity'] || 0) || 0,
                reorder_level: Number(row['Reorder Level'] || row['reorder_level'] || 5) || 5,
                custom_fields: {},
                is_active: true,
              });
              result.totalRows++;
            } else {
              result.errors.push(`Products Row #${i + 2}: Skipped due to missing product name.`);
            }
          });
        }

        // 3. Customers Sheet
        const custSheetName = sheetNames.find((s) => /customer/i.test(s));
        if (custSheetName) {
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[custSheetName]);
          rows.forEach((row, i) => {
            const name = String(row['Customer Name'] || row['name'] || '').trim();
            const phone = String(row['Phone Number'] || row['Phone'] || row['phone'] || '').trim();
            if (name) {
              result.customers.push({
                name,
                phone: phone || '0770000000',
                email: String(row['Email Address'] || row['Email'] || row['email'] || '').trim() || undefined,
                address: String(row['Address'] || row['address'] || '').trim() || undefined,
                nic_or_br: String(row['NIC or BR'] || row['NIC/BR'] || row['nic_or_br'] || '').trim() || undefined,
                credit_limit: Number(row['Credit Limit'] || row['credit_limit'] || 10000) || 10000,
                current_balance: Number(row['Current Balance'] || row['Opening Balance'] || row['current_balance'] || 0) || 0,
                loyalty_points: Number(row['Loyalty Points'] || row['loyalty_points'] || 0) || 0,
                notes: String(row['Notes'] || row['notes'] || '').trim() || undefined,
              });
              result.totalRows++;
            } else {
              result.errors.push(`Customers Row #${i + 2}: Skipped due to missing customer name.`);
            }
          });
        }

        // 4. Expenses Sheet
        const expSheetName = sheetNames.find((s) => /expense/i.test(s));
        if (expSheetName) {
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[expSheetName]);
          rows.forEach((row, i) => {
            const amount = Number(row['Amount'] || row['amount'] || 0);
            if (amount > 0) {
              result.expenses.push({
                date: String(row['Date'] || row['date'] || new Date().toISOString().split('T')[0]).trim(),
                category: (String(row['Category'] || row['category'] || 'OTHER').toUpperCase() as any),
                amount,
                description: String(row['Description'] || row['description'] || 'Operating Expense').trim(),
                payment_method: (String(row['Payment Method'] || row['payment_method'] || 'CASH').toUpperCase() as any),
                receipt_ref: String(row['Receipt Ref'] || row['receipt_ref'] || '').trim() || undefined,
              });
              result.totalRows++;
            } else {
              result.errors.push(`Expenses Row #${i + 2}: Skipped due to zero/missing amount.`);
            }
          });
        }

        result.categoriesCount = result.categories.length;
        result.productsCount = result.products.length;
        result.customersCount = result.customers.length;
        result.expensesCount = result.expenses.length;

        resolve(result);
      } catch (err: any) {
        reject(new Error(err?.message || 'Failed to parse master Excel file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsArrayBuffer(file);
  });
}
