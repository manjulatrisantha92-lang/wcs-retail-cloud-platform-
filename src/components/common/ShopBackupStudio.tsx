import React, { useState, useRef, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Building2,
  Layers,
  Package,
  Users,
  DollarSign,
  ShieldCheck,
  X,
  History,
  Trash2,
  Info,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  HardDrive,
  Copy,
  Check,
  Store,
  ShoppingCart,
  Receipt,
  Truck,
  Briefcase,
} from 'lucide-react';
import {
  exportCompleteShopWorkbook,
  downloadMasterAllInOneExcelTemplate,
  parseMasterWorkbookFromFile,
} from '../../utils/excelService';

interface ShopBackupStudioProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

interface ShopLocalSnapshot {
  id: string;
  tenantId: string;
  shopName: string;
  name: string;
  timestamp: string;
  productCount: number;
  customerCount: number;
  salesCount: number;
  dataJson: string;
}

export const ShopBackupStudio: React.FC<ShopBackupStudioProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
}) => {
  const {
    currentTenant,
    currentTenantId,
    categories,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    employees,
    customFields,
    exportShopDatabaseJson,
    importShopDatabaseJson,
    batchImportCategories,
    batchImportProducts,
    batchImportCustomers,
    batchImportExpenses,
    currencySymbol,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'shop_json' | 'shop_excel' | 'snapshots'>('shop_json');
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    title: string;
    text: string;
    stats?: Record<string, number>;
  }>({ type: null, title: '', text: '' });

  // Inspected JSON state
  const [inspectedBackup, setInspectedBackup] = useState<{
    fileName: string;
    rawJson: string;
    parsed: any;
    meta: {
      timestamp?: string;
      version?: string;
      shopName?: string;
      tenantId?: string;
      categoriesCount: number;
      productsCount: number;
      customersCount: number;
      suppliersCount: number;
      salesCount: number;
      expensesCount: number;
      usersCount: number;
    };
  } | null>(null);

  // Inspected Excel state
  const [inspectedExcel, setInspectedExcel] = useState<{
    fileName: string;
    file: File;
    summary: {
      categoriesCount: number;
      productsCount: number;
      customersCount: number;
      expensesCount: number;
      totalRows: number;
      errors: string[];
    };
  } | null>(null);

  // Local shop snapshots in browser storage
  const [snapshots, setSnapshots] = useState<ShopLocalSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('WCS_SHOP_LOCAL_SNAPSHOTS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [snapshotNameInput, setSnapshotNameInput] = useState('');
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Save snapshots to storage
  const saveSnapshotsToStorage = (list: ShopLocalSnapshot[]) => {
    setSnapshots(list);
    try {
      localStorage.setItem('WCS_SHOP_LOCAL_SNAPSHOTS', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save shop snapshots locally', e);
    }
  };

  // Filter snapshots strictly for current tenant
  const currentShopSnapshots = useMemo(() => {
    return snapshots.filter((s) => s.tenantId === currentTenantId);
  }, [snapshots, currentTenantId]);

  // 1. Export Current Shop JSON
  const handleExportShopJson = () => {
    try {
      setIsProcessing(true);
      const jsonStr = exportShopDatabaseJson(currentTenantId);
      const dateStr = new Date().toISOString().split('T')[0];
      const cleanShopName = (currentTenant?.shop_name || 'Shop').replace(/[^a-zA-Z0-9_-]/g, '_');
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WCS_BACKUP_${cleanShopName}_(${currentTenantId})_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        title: 'Shop Backup Exported',
        text: `Backup file for ${currentTenant?.shop_name || currentTenantId} downloaded successfully. Includes ${products.length} products, ${customers.length} customers, and ${sales.length} sales orders.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        title: 'Export Failed',
        text: err?.message || 'Could not export shop JSON backup.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Copy Current Shop JSON to Clipboard
  const handleCopyShopJson = async () => {
    try {
      const jsonStr = exportShopDatabaseJson(currentTenantId);
      await navigator.clipboard.writeText(jsonStr);
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2500);
    } catch {
      setStatusMessage({
        type: 'error',
        title: 'Clipboard Error',
        text: 'Unable to write to clipboard automatically.',
      });
    }
  };

  // 3. Handle Selecting JSON File for Pre-Flight Inspection
  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);

        const catsList = Array.isArray(parsed.categories) ? parsed.categories : [];
        const prodsList = Array.isArray(parsed.products) ? parsed.products : [];
        const custsList = Array.isArray(parsed.customers) ? parsed.customers : [];
        const suppsList = Array.isArray(parsed.suppliers) ? parsed.suppliers : [];
        const salesList = Array.isArray(parsed.sales) ? parsed.sales : [];
        const expsList = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        const usersList = Array.isArray(parsed.users) ? parsed.users : [];

        setInspectedBackup({
          fileName: file.name,
          rawJson,
          parsed,
          meta: {
            timestamp: parsed.timestamp || 'Unknown Date',
            version: parsed.version || '2.6.0',
            shopName: parsed.shop_name || parsed.tenant?.shop_name || currentTenant?.shop_name,
            tenantId: parsed.tenant_id || parsed.tenant?.tenant_id || currentTenantId,
            categoriesCount: catsList.length,
            productsCount: prodsList.length,
            customersCount: custsList.length,
            suppliersCount: suppsList.length,
            salesCount: salesList.length,
            expensesCount: expsList.length,
            usersCount: usersList.length,
          },
        });
        setStatusMessage({ type: null, title: '', text: '' });
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          title: 'Invalid JSON File',
          text: 'The selected file is not a valid JSON document: ' + (err?.message || ''),
        });
        setInspectedBackup(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 4. Commit Shop JSON Restore / Import
  const handleCommitShopJsonRestore = () => {
    if (!inspectedBackup) return;

    setIsProcessing(true);
    try {
      const res = importShopDatabaseJson(inspectedBackup.rawJson, restoreMode, currentTenantId);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          title: 'Shop Data Restored Successfully!',
          text: res.message,
          stats: res.stats,
        });
        setInspectedBackup(null);
      } else {
        setStatusMessage({
          type: 'error',
          title: 'Restore Failed',
          text: res.message,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        title: 'Restore Error',
        text: err?.message || 'An unexpected error occurred during shop restoration.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Handle Selecting Excel File for Multi-Sheet Master Inspection
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const summary = await parseMasterWorkbookFromFile(file);
      setInspectedExcel({
        fileName: file.name,
        file,
        summary,
      });
      setStatusMessage({ type: null, title: '', text: '' });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        title: 'Excel Read Error',
        text: err?.message || 'Could not parse Excel workbook.',
      });
      setInspectedExcel(null);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  // 6. Commit Excel Master Import into Current Shop
  const handleCommitExcelMasterImport = async () => {
    if (!inspectedExcel) return;

    setIsProcessing(true);
    try {
      let importedCats = 0;
      let importedProds = 0;
      let importedCusts = 0;
      let importedExps = 0;

      // Import Categories
      if (inspectedExcel.summary.categoriesCount > 0) {
        const catRes = await importCategoriesFromMasterWorkbook(inspectedExcel.file);
        if (catRes.length > 0) {
          const res = batchImportCategories(catRes);
          importedCats = res.count;
        }
      }

      // Import Products
      if (inspectedExcel.summary.productsCount > 0) {
        const prodRes = await importProductsFromMasterWorkbook(inspectedExcel.file);
        if (prodRes.length > 0) {
          const res = batchImportProducts(prodRes);
          importedProds = res.count;
        }
      }

      // Import Customers
      if (inspectedExcel.summary.customersCount > 0) {
        const custRes = await importCustomersFromMasterWorkbook(inspectedExcel.file);
        if (custRes.length > 0) {
          const res = batchImportCustomers(custRes);
          importedCusts = res.count;
        }
      }

      // Import Expenses
      if (inspectedExcel.summary.expensesCount > 0) {
        const expRes = await importExpensesFromMasterWorkbook(inspectedExcel.file);
        if (expRes.length > 0) {
          const res = batchImportExpenses(expRes);
          importedExps = res.count;
        }
      }

      setStatusMessage({
        type: 'success',
        title: 'Shop Excel Data Imported Successfully!',
        text: `Imported into ${currentTenant?.shop_name}: ${importedCats} categories, ${importedProds} products, ${importedCusts} customers, and ${importedExps} expenses.`,
        stats: {
          categories: importedCats,
          products: importedProds,
          customers: importedCusts,
          expenses: importedExps,
        },
      });
      setInspectedExcel(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        title: 'Excel Import Failed',
        text: err?.message || 'Error occurred while applying Excel data to shop.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper parsers for individual sheets
  const importCategoriesFromMasterWorkbook = async (file: File) => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('categor'));
    if (!sheetName) return [];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows
      .filter((r) => r['Category Name'] || r['name'])
      .map((r) => ({
        tenant_id: currentTenantId,
        name: String(r['Category Name'] || r['name']).trim(),
        name_si: r['Name (Sinhala)'] || r['name_si'] || undefined,
        name_ta: r['Name (Tamil)'] || r['name_ta'] || undefined,
        description: r['Description'] || r['description'] || undefined,
        tax_rate: Number(r['Tax Rate (%)'] || r['tax_rate'] || 0) || 0,
        is_active: true,
      }));
  };

  const importProductsFromMasterWorkbook = async (file: File) => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('product'));
    if (!sheetName) return [];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows
      .filter((r) => r['Product Name'] || r['name'])
      .map((r) => ({
        name: String(r['Product Name'] || r['name']).trim(),
        name_si: r['Name (Sinhala)'] || r['name_si'] || undefined,
        name_ta: r['Name (Tamil)'] || r['name_ta'] || undefined,
        sku: String(r['SKU / Code'] || r['sku'] || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim(),
        barcode: String(r['Barcode'] || r['barcode'] || '').trim() || undefined,
        category: String(r['Category'] || r['category'] || 'General').trim(),
        brand: String(r['Brand'] || r['brand'] || '').trim() || undefined,
        unit: (String(r['Unit'] || r['unit'] || 'pcs').trim().toLowerCase() as any) || 'pcs',
        cost_price: Number(r['Cost Price'] || r['cost_price'] || 0) || 0,
        selling_price: Number(r['Selling Price'] || r['selling_price'] || 0) || 0,
        wholesale_price: Number(r['Wholesale Price'] || r['wholesale_price'] || 0) || undefined,
        stock_quantity: Number(r['Stock Qty'] || r['stock_quantity'] || 0) || 0,
        reorder_level: Number(r['Reorder Level'] || r['reorder_level'] || 5) || 5,
        custom_fields: {},
        is_active: true,
      }));
  };

  const importCustomersFromMasterWorkbook = async (file: File) => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('custom'));
    if (!sheetName) return [];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows
      .filter((r) => r['Customer Name'] || r['name'])
      .map((r) => ({
        name: String(r['Customer Name'] || r['name']).trim(),
        phone: String(r['Phone Number'] || r['phone'] || '').trim(),
        email: r['Email'] || r['email'] || undefined,
        address: r['Address'] || r['address'] || undefined,
        city: r['City'] || r['city'] || undefined,
        credit_limit: Number(r['Credit Limit'] || r['credit_limit'] || 0) || 0,
        current_credit: Number(r['Outstanding Balance'] || r['current_credit'] || 0) || 0,
        current_balance: Number(r['Outstanding Balance'] || r['current_credit'] || 0) || 0,
        loyalty_points: Number(r['Loyalty Points'] || r['loyalty_points'] || 0) || 0,
      }));
  };

  const importExpensesFromMasterWorkbook = async (file: File) => {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('expens'));
    if (!sheetName) return [];
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows
      .filter((r) => r['Amount'] || r['amount'])
      .map((r) => ({
        category: (String(r['Expense Category'] || r['category'] || 'other').trim().toLowerCase() as any) || 'other',
        amount: Number(r['Amount'] || r['amount'] || 0) || 0,
        description: String(r['Description'] || r['description'] || 'Expense').trim(),
        date: String(r['Date (YYYY-MM-DD)'] || r['date'] || new Date().toISOString().split('T')[0]).trim(),
        payment_method: (String(r['Payment Method'] || r['payment_method'] || 'cash').trim().toLowerCase() as any) || 'cash',
      }));
  };

  // 7. Create Local Shop Snapshot
  const handleCreateSnapshot = () => {
    const name = snapshotNameInput.trim() || `Snapshot ${new Date().toLocaleTimeString()}`;
    const newSnapshot: ShopLocalSnapshot = {
      id: `SNP-${Date.now()}`,
      tenantId: currentTenantId,
      shopName: currentTenant?.shop_name || currentTenantId,
      name,
      timestamp: new Date().toISOString(),
      productCount: products.length,
      customerCount: customers.length,
      salesCount: sales.length,
      dataJson: exportShopDatabaseJson(currentTenantId),
    };
    const updated = [newSnapshot, ...snapshots];
    saveSnapshotsToStorage(updated);
    setSnapshotNameInput('');
    setStatusMessage({
      type: 'success',
      title: 'Shop Snapshot Saved',
      text: `Saved local state snapshot "${name}" for ${currentTenant?.shop_name}.`,
    });
  };

  // 8. Restore Local Shop Snapshot
  const handleRestoreSnapshot = (snapshot: ShopLocalSnapshot) => {
    if (
      !window.confirm(
        `Are you sure you want to restore snapshot "${snapshot.name}" taken on ${new Date(
          snapshot.timestamp
        ).toLocaleString()}? This will update only ${currentTenant?.shop_name}.`
      )
    ) {
      return;
    }

    const res = importShopDatabaseJson(snapshot.dataJson, 'replace', currentTenantId);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        title: 'Shop Snapshot Restored!',
        text: res.message,
        stats: res.stats,
      });
    } else {
      setStatusMessage({
        type: 'error',
        title: 'Snapshot Restore Failed',
        text: res.message,
      });
    }
  };

  // 9. Delete Local Snapshot
  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter((s) => s.id !== id);
    saveSnapshotsToStorage(updated);
  };

  if (!isOpen) return null;

  const content = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Bar */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Shop Backup & Data Migration Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
                Shop-by-Shop Isolated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Export, backup, and restore inventory, sales, customers, and expenses strictly for the active shop.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active Shop Identity Banner */}
      <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Current Working Shop:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 font-bold">
              {currentTenant?.shop_name || 'Active Store'}
            </span>
            <span className="text-slate-400">({currentTenantId})</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 capitalize hidden md:inline">
            Type: <strong className="text-slate-300">{currentTenant?.business_type.replace('_', ' ') || 'Retail'}</strong>
          </span>
        </div>

        {/* Live Counters for Active Shop */}
        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span><strong>{products.length}</strong> Prods</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span><strong>{customers.length}</strong> Custs</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span><strong>{sales.length}</strong> Sales</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            <span><strong>{expenses.length}</strong> Exps</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
        <button
          onClick={() => setActiveTab('shop_json')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'shop_json'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Shop JSON Backup & Restore</span>
        </button>

        <button
          onClick={() => setActiveTab('shop_excel')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'shop_excel'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Shop Excel (.xlsx) Master Workbook</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'snapshots'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Local Shop Snapshots</span>
          {currentShopSnapshots.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
              {currentShopSnapshots.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Toast Alert */}
        {statusMessage.type && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                : 'bg-indigo-950/50 border-indigo-500/50 text-indigo-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-sm mb-1">{statusMessage.title}</h4>
              <p>{statusMessage.text}</p>
              {statusMessage.stats && Object.keys(statusMessage.stats).length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 pt-2 border-t border-emerald-800/40">
                  {Object.entries(statusMessage.stats).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700/50 text-[11px] font-mono"
                    >
                      {k}: <strong>{v}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setStatusMessage({ type: null, title: '', text: '' })}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: SHOP JSON BACKUP & RESTORE */}
        {activeTab === 'shop_json' && (
          <div className="space-y-6">
            {/* Safety Notice */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <strong className="text-white">Shop-by-Shop Isolation Guarantee:</strong> Any backup exported or imported here affects <strong>ONLY</strong> <span className="text-indigo-300 font-semibold">{currentTenant?.shop_name} ({currentTenantId})</span>. All other stores in your database remain untouched and completely safe.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* EXPORT CARD */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Export Current Shop Backup</h3>
                        <p className="text-xs text-slate-400">Download single-shop database JSON snapshot</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                      .json
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Generates a complete, structured backup of all data associated with <strong>{currentTenant?.shop_name}</strong>. Includes catalog items, customer credit ledger, receipts, suppliers, custom fields, and shop settings.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs mb-4">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Products</span>
                      <strong className="text-sm text-white font-mono">{products.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Categories</span>
                      <strong className="text-sm text-white font-mono">{categories.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Customers</span>
                      <strong className="text-sm text-white font-mono">{customers.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Suppliers</span>
                      <strong className="text-sm text-white font-mono">{suppliers.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Sales Orders</span>
                      <strong className="text-sm text-white font-mono">{sales.length}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400 block text-[10px] uppercase">Expenses</span>
                      <strong className="text-sm text-white font-mono">{expenses.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={handleExportShopJson}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Shop Backup (.json)</span>
                  </button>

                  <button
                    onClick={handleCopyShopJson}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    title="Copy Raw JSON to Clipboard"
                  >
                    {copiedStatus ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* IMPORT / RESTORE CARD */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Restore Data into This Shop</h3>
                        <p className="text-xs text-slate-400">Import backup JSON into {currentTenant?.shop_name}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                      Target: {currentTenantId}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Select a previously saved backup file. The system will inspect the contents and allow you to safely replace or merge records strictly into this shop.
                  </p>

                  {/* Dropzone / Upload button */}
                  <input
                    type="file"
                    ref={jsonFileInputRef}
                    onChange={handleJsonFileSelected}
                    accept=".json,application/json"
                    className="hidden"
                  />

                  <div
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/40 hover:bg-indigo-950/20 transition-all group"
                  >
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-slate-200 block">
                      Click to Browse or Drag & Drop Shop JSON Backup
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Supports single shop backups and master snapshot files
                    </span>
                  </div>
                </div>

                {/* Pre-flight inspection preview */}
                {inspectedBackup && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {inspectedBackup.fileName}
                        </span>
                      </div>
                      <span className="text-[10px] text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded">
                        Ready to Apply
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-indigo-900/40">
                      <div>
                        <span className="text-slate-400 text-[10px]">Products:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.productsCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Categories:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.categoriesCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Customers:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.customersCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Suppliers:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.suppliersCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Sales:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.salesCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Expenses:</span>{' '}
                        <strong className="text-white font-mono">{inspectedBackup.meta.expensesCount}</strong>
                      </div>
                    </div>

                    {/* Restore Mode Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 block">
                        Select Restore Mode for this Shop:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRestoreMode('replace')}
                          className={`p-2 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                            restoreMode === 'replace'
                              ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                          }`}
                        >
                          <strong className="block text-[11px]">Replace Store Data</strong>
                          <span className="text-[10px] opacity-80">Wipes and replaces data for this shop only</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRestoreMode('merge')}
                          className={`p-2 rounded-lg text-left text-xs transition-all cursor-pointer border ${
                            restoreMode === 'merge'
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                          }`}
                        >
                          <strong className="block text-[11px]">Merge & Append</strong>
                          <span className="text-[10px] opacity-80">Upserts into this shop's existing records</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCommitShopJsonRestore}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>Confirm Restore to {currentTenant?.shop_name}</span>
                      </button>

                      <button
                        onClick={() => setInspectedBackup(null)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHOP EXCEL MASTER WORKBOOK */}
        {activeTab === 'shop_excel' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-200 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-white">Shop Excel Master Workbook:</strong> Export and import four core datasets (Categories, Products, Customers, Expenses) in a single multi-sheet <strong>.xlsx</strong> file for <strong>{currentTenant?.shop_name}</strong>.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* EXPORT EXCEL MASTER */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Export Shop Master Excel (.xlsx)</h3>
                        <p className="text-xs text-slate-400">Multi-sheet workbook for {currentTenant?.shop_name}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      4 Sheets
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Downloads an Excel spreadsheet containing individual sheets for <strong>Categories</strong>, <strong>Products & Inventory</strong>, <strong>Credit Customers</strong>, and <strong>Expenses</strong> for this shop.
                  </p>

                  <div className="space-y-2 py-3 border-y border-slate-800 text-xs mb-4">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Sheet 1: Categories</span>
                      </span>
                      <strong className="font-mono text-white">{categories.length} records</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Sheet 2: Products & Prices</span>
                      </span>
                      <strong className="font-mono text-white">{products.length} records</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sheet 3: Customers & Credit</span>
                      </span>
                      <strong className="font-mono text-white">{customers.length} records</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                        <span>Sheet 4: Expenses</span>
                      </span>
                      <strong className="font-mono text-white">{expenses.length} records</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
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
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Shop Master (.xlsx)</span>
                  </button>

                  <button
                    onClick={downloadMasterAllInOneExcelTemplate}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    title="Download Sample Blank Template"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Template</span>
                  </button>
                </div>
              </div>

              {/* IMPORT EXCEL MASTER */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Import Master Excel into This Shop</h3>
                        <p className="text-xs text-slate-400">Auto-detects and populates all 4 sheets</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Upload an Excel workbook formatted with standard column headers. All rows will be stamped and imported directly into <strong>{currentTenant?.shop_name}</strong>.
                  </p>

                  <input
                    type="file"
                    ref={excelFileInputRef}
                    onChange={handleExcelFileSelected}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />

                  <div
                    onClick={() => excelFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer bg-slate-950/40 hover:bg-emerald-950/20 transition-all group"
                  >
                    <FileSpreadsheet className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                    <span className="text-xs font-semibold text-slate-200 block">
                      Click to Select Excel Workbook (.xlsx)
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Supports Categories, Products, Customers, and Expenses sheets
                    </span>
                  </div>
                </div>

                {/* Pre-flight Excel inspection preview */}
                {inspectedExcel && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">
                          {inspectedExcel.fileName}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                        {inspectedExcel.summary.totalRows} Total Rows
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-emerald-900/40">
                      <div>
                        <span className="text-slate-400 text-[10px]">Categories:</span>{' '}
                        <strong className="text-white font-mono">{inspectedExcel.summary.categoriesCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Products:</span>{' '}
                        <strong className="text-white font-mono">{inspectedExcel.summary.productsCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Customers:</span>{' '}
                        <strong className="text-white font-mono">{inspectedExcel.summary.customersCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Expenses:</span>{' '}
                        <strong className="text-white font-mono">{inspectedExcel.summary.expensesCount}</strong>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCommitExcelMasterImport}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>Commit Excel to {currentTenant?.shop_name}</span>
                      </button>

                      <button
                        onClick={() => setInspectedExcel(null)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL SHOP SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div className="space-y-6">
            {/* Create Snapshot Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Save Quick Local Snapshot</h3>
                  <p className="text-xs text-slate-400">
                    Store instant state checkpoints for {currentTenant?.shop_name} in browser storage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Snapshot name (e.g. Pre-Audit Backup)"
                  value={snapshotNameInput}
                  onChange={(e) => setSnapshotNameInput(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 flex-1 sm:w-64"
                />
                <button
                  onClick={handleCreateSnapshot}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Save Snapshot</span>
                </button>
              </div>
            </div>

            {/* Snapshots List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Saved Snapshots for {currentTenant?.shop_name} ({currentShopSnapshots.length})
              </h4>

              {currentShopSnapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-500 text-xs">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>No local snapshots saved for this shop yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Use the box above to capture a point-in-time state checkpoint before making large edits.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentShopSnapshots.map((snp) => (
                    <div
                      key={snp.id}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-white">{snp.name}</strong>
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[10px] font-mono">
                            {snp.tenantId}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{new Date(snp.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{snp.productCount} prods</span>
                          <span>•</span>
                          <span>{snp.customerCount} custs</span>
                          <span>•</span>
                          <span>{snp.salesCount} sales</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreSnapshot(snp)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Restore this snapshot"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span>Single-Shop Storage Scope: <strong>{currentTenant?.shop_name} ({currentTenantId})</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Format Version: <strong>2.6.0</strong></span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Close Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-5xl h-[88vh] max-h-[850px] shadow-2xl animate-scaleUp">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
