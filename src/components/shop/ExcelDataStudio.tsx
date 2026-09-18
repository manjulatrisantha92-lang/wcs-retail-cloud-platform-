import React, { useState, useRef } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Layers,
  Package,
  Users,
  DollarSign,
  Database,
  ArrowRight,
  RefreshCw,
  Info,
  ShieldCheck,
  Building2,
  Table,
} from 'lucide-react';
import {
  exportCategoriesToExcel,
  downloadCategoryExcelTemplate,
  parseCategoriesFromFile,
  exportProductsToExcel,
  downloadProductExcelTemplate,
  parseProductsFromFile,
  exportCustomersToExcel,
  downloadCustomerExcelTemplate,
  parseCustomersFromFile,
  exportExpensesToExcel,
  downloadExpenseExcelTemplate,
  parseExpensesFromFile,
  exportCompleteShopWorkbook,
  downloadMasterAllInOneExcelTemplate,
  exportAllShopsMasterWorkbook,
} from '../../utils/excelService';
import { ShopBackupStudio } from '../common/ShopBackupStudio';

export type ExcelStudioTab = 'all' | 'categories' | 'products' | 'customers' | 'expenses';

interface ExcelDataStudioProps {
  initialTab?: ExcelStudioTab;
  onClose?: () => void;
  isModal?: boolean;
}

export const ExcelDataStudio: React.FC<ExcelDataStudioProps> = ({
  initialTab = 'products',
  onClose,
  isModal = false,
}) => {
  const {
    currentTenant,
    currentUser,
    categories,
    products,
    customers,
    expenses,
    sales,
    purchases,
    batchImportCategories,
    batchImportProducts,
    batchImportCustomers,
    batchImportExpenses,
    allTenants,
    allCategoriesMaster,
    allProductsMaster,
    allCustomersMaster,
    allExpensesMaster,
    hasPermission,
    isSuperAdminMode,
    currencySymbol,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<ExcelStudioTab>(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBackupStudioOpen, setIsBackupStudioOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });

  // Preview states for parsed files
  const [parsedPreview, setParsedPreview] = useState<{
    target: 'categories' | 'products' | 'customers' | 'expenses';
    data: any[];
    errors: string[];
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canExport = hasPermission('excel_export');
  const canImport = hasPermission('excel_import');

  // Total metrics
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalCustomers = customers.length;
  const totalExpenses = expenses.length;
  const totalStockValue = products.reduce(
    (acc, p) => acc + (p.stock_quantity || 0) * (p.selling_price || 0),
    0
  );
  const totalUdalu = customers.reduce((acc, c) => acc + (c.current_balance || 0), 0);

  // File selection & parse handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus({ type: null, message: '' });

    try {
      const tenantId = currentTenant?.tenant_id || 'SHOP001';

      if (activeTab === 'categories') {
        const res = await parseCategoriesFromFile(file, tenantId);
        setParsedPreview({
          target: 'categories',
          data: res.imported,
          errors: res.errors,
          fileName: file.name,
        });
      } else if (activeTab === 'products') {
        const res = await parseProductsFromFile(file, tenantId);
        setParsedPreview({
          target: 'products',
          data: res.imported,
          errors: res.errors,
          fileName: file.name,
        });
      } else if (activeTab === 'customers') {
        const res = await parseCustomersFromFile(file, tenantId);
        setParsedPreview({
          target: 'customers',
          data: res.imported,
          errors: res.errors,
          fileName: file.name,
        });
      } else if (activeTab === 'expenses') {
        const res = await parseExpensesFromFile(file, tenantId);
        setParsedPreview({
          target: 'expenses',
          data: res.imported,
          errors: res.errors,
          fileName: file.name,
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'Failed to parse Excel file. Please ensure the format matches the sample template.',
        details: [err.message || String(err)],
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Commit imported rows to database
  const handleCommitImport = () => {
    if (!parsedPreview || parsedPreview.data.length === 0) return;

    setIsProcessing(true);
    try {
      if (parsedPreview.target === 'categories') {
        const res = batchImportCategories(parsedPreview.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${res.count} categories into ${currentTenant?.shop_name || 'shop'}!`,
        });
      } else if (parsedPreview.target === 'products') {
        const res = batchImportProducts(parsedPreview.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${res.count} products into inventory!`,
        });
      } else if (parsedPreview.target === 'customers') {
        const res = batchImportCustomers(parsedPreview.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${res.count} customers into directory!`,
        });
      } else if (parsedPreview.target === 'expenses') {
        const res = batchImportExpenses(parsedPreview.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${res.count} expense records!`,
        });
      }
      setParsedPreview(null);
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'An error occurred during database batch insert.',
        details: [err.message || String(err)],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm'
          : 'space-y-6'
      }
    >
      <div
        className={`flex flex-col bg-white ${
          isModal
            ? 'w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-200'
            : 'rounded-2xl border border-slate-200 shadow-sm p-6'
        }`}
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">
                  Excel Data Studio (Import & Export)
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  .XLSX Supported
                </span>
              </div>
              <p className="text-xs text-slate-500">
                1-Click Excel export, template generation, and bulk data import for Categories, Products, Customers & Expenses
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* All Shops Master Backup Button */}
            <button
              onClick={() => setIsBackupStudioOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Database className="h-4 w-4 text-indigo-400" />
              <span>Shop Backup (JSON & Excel)</span>
            </button>

            {/* Quick Export Master Workbook Button */}
            {canExport && (
              <button
                onClick={() =>
                  exportCompleteShopWorkbook({
                    tenant: currentTenant,
                    categories,
                    products,
                    customers,
                    expenses,
                    sales,
                    purchases,
                  })
                }
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Store Workbook (.xlsx)</span>
              </button>
            )}

            {isModal && onClose && (
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {importStatus.type && (
          <div
            className={`mx-6 mt-4 flex items-start gap-3 rounded-xl p-4 text-sm ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{importStatus.message}</p>
              {importStatus.details && importStatus.details.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs space-y-1">
                  {importStatus.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setImportStatus({ type: null, message: '' })}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-200 px-6 pt-3">
          <button
            onClick={() => {
              setActiveTab('products');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Products & Inventory ({totalProducts})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'categories'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Categories ({totalCategories})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('customers');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'customers'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Customers & Credit ({totalCustomers})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('expenses');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'expenses'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Expenses & Payouts ({totalExpenses})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('all');
              setParsedPreview(null);
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Multi-Sheet Master Workbooks</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Permission warning if needed */}
          {!canExport && !canImport && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm">
                Your role ({currentUser?.role || 'Staff'}) currently has restricted Excel access. An Administrator or Store Owner can grant Excel permissions via the Access Control Panel.
              </p>
            </div>
          )}

          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{totalProducts}</div>
                      <div className="text-xs text-slate-500">Total Live Products</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {currencySymbol} {totalStockValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Retail Inventory Valuation</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{totalCategories}</div>
                      <div className="text-xs text-slate-500">Assigned Categories</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Export Card */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Download className="h-5 w-5 text-emerald-600" />
                      <span>Export Products to Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Download your entire product catalog including SKUs, barcodes, cost, selling prices, and stock counts into an Excel sheet.
                    </p>
                  </div>
                  <button
                    disabled={!canExport}
                    onClick={() => exportProductsToExcel(products, categories, currentTenant)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Products Excel (.xlsx)</span>
                  </button>
                </div>

                {/* Template & Import Card */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Import Products from Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload an Excel file (.xlsx, .xls, .csv) with your items. Download our sample template to see the required column format.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={downloadProductExcelTemplate}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>Sample Template</span>
                    </button>

                    <label
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all ${
                        !canImport ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose File to Import</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Download className="h-5 w-5 text-emerald-600" />
                      <span>Export Categories to Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Download all category groups, Sinhala & Tamil names, color codes, and product counts.
                    </p>
                  </div>
                  <button
                    disabled={!canExport}
                    onClick={() => exportCategoriesToExcel(categories, products, currentTenant)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Categories Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Import Categories from Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Bulk create product categories with names and colors using an Excel spreadsheet.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={downloadCategoryExcelTemplate}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>Sample Template</span>
                    </button>

                    <label
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all ${
                        !canImport ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose File to Import</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">{totalCustomers}</div>
                      <div className="text-xs text-slate-500">Registered Customer Accounts</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-800">
                        {currencySymbol} {totalUdalu.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Total Customer Credit Outstanding</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Download className="h-5 w-5 text-emerald-600" />
                      <span>Export Customer Ledger to Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Download full customer directory, contact numbers, NIC/BR, credit limits, and current credit balances.
                    </p>
                  </div>
                  <button
                    disabled={!canExport}
                    onClick={() => exportCustomersToExcel(customers, currentTenant)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Customers Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Import Customers from Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Bulk import customer profiles, phone numbers, and starting credit limits into your system.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={downloadCustomerExcelTemplate}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>Sample Template</span>
                    </button>

                    <label
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all ${
                        !canImport ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose File to Import</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Download className="h-5 w-5 text-emerald-600" />
                      <span>Export Expenses to Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Export daily shop expenditures, petty cash logs, and payment voucher records.
                    </p>
                  </div>
                  <button
                    disabled={!canExport}
                    onClick={() => exportExpensesToExcel(expenses, currentTenant)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Expenses Excel (.xlsx)</span>
                  </button>
                </div>

                <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-base mb-1">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Import Expenses from Excel</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload past expense logs, utility payments, and petty cash entries in batch.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={downloadExpenseExcelTemplate}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span>Sample Template</span>
                    </button>

                    <label
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer transition-all ${
                        !canImport ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Choose File to Import</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MULTI-SHEET MASTER WORKBOOKS */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-600 p-2 text-white mt-0.5">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-emerald-950">
                      Complete Multi-Tab Shop Master Workbook
                    </h3>
                    <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                      Generates a complete Microsoft Excel (.xlsx) workbook with dedicated tabs for Overview, Categories, Products, Customers, Expenses, and Recent Sales Invoices in a single downloadable file.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          exportCompleteShopWorkbook({
                            tenant: currentTenant,
                            categories,
                            products,
                            customers,
                            expenses,
                            sales,
                            purchases,
                          })
                        }
                        className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Current Shop Full Workbook (.xlsx)</span>
                      </button>

                      <button
                        onClick={downloadMasterAllInOneExcelTemplate}
                        className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-all"
                      >
                        <FileText className="h-4 w-4 text-emerald-600" />
                        <span>Download Blank Multi-Sheet Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Super Admin / Master Enterprise Backup Section */}
              {isSuperAdminMode && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-purple-600 p-2 text-white mt-0.5">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-purple-950">
                        Enterprise All-Shops Master Backup (.xlsx)
                      </h3>
                      <p className="mt-1 text-xs text-purple-800 leading-relaxed">
                        Export database records across all provisioned retail shops into a single master Excel document (Tenants Directory, All Products, All Customers, All Expenses).
                      </p>

                      <div className="mt-4">
                        <button
                          onClick={() =>
                            exportAllShopsMasterWorkbook(
                              allTenants,
                              allCategoriesMaster,
                              allProductsMaster,
                              allCustomersMaster,
                              allExpensesMaster
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-800 transition-all"
                        >
                          <Download className="h-4 w-4" />
                          <span>Export ALL Shops Master Backup (.xlsx)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARSED PREVIEW MODAL / DRAWER */}
          {parsedPreview && (
            <div className="mt-6 rounded-2xl border-2 border-blue-400 bg-blue-50/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Table className="h-5 w-5 text-blue-700" />
                    <h4 className="text-base font-bold text-blue-950">
                      Import Preview: {parsedPreview.fileName}
                    </h4>
                    <span className="rounded-full bg-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                      {parsedPreview.data.length} Valid Rows Ready
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Review the parsed data before saving it into your live {currentTenant?.shop_name} catalog.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setParsedPreview(null)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommitImport}
                    disabled={isProcessing || parsedPreview.data.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Commit & Import {parsedPreview.data.length} Items</span>
                  </button>
                </div>
              </div>

              {/* Warning/Error Logs if any */}
              {parsedPreview.errors.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span>{parsedPreview.errors.length} skipped rows or formatting notes:</span>
                  </div>
                  <ul className="list-disc pl-5 max-h-24 overflow-y-auto space-y-0.5">
                    {parsedPreview.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {parsedPreview.errors.length > 10 && (
                      <li className="font-semibold">
                        ...and {parsedPreview.errors.length - 10} more notes
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Quick Data Table Preview */}
              <div className="mt-4 max-h-60 overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      {parsedPreview.data[0] &&
                        Object.keys(parsedPreview.data[0])
                          .filter((k) => k !== 'custom_fields' && k !== 'tenant_id')
                          .map((header) => (
                            <th key={header} className="px-3 py-2 capitalize whitespace-nowrap">
                              {header.replace(/_/g, ' ')}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.data.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-400">{idx + 1}</td>
                        {Object.entries(row)
                          .filter(([k]) => k !== 'custom_fields' && k !== 'tenant_id')
                          .map(([key, val], cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 whitespace-nowrap">
                              {typeof val === 'boolean'
                                ? val
                                  ? 'Yes'
                                  : 'No'
                                : String(val ?? '')}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreview.data.length > 8 && (
                <div className="mt-2 text-center text-xs text-slate-500 italic">
                  Showing first 8 of {parsedPreview.data.length} rows...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shop Backup Studio Modal (Current Shop Scoped) */}
      <ShopBackupStudio
        isOpen={isBackupStudioOpen}
        isModal={true}
        onClose={() => setIsBackupStudioOpen(false)}
      />
    </div>
  );
};
