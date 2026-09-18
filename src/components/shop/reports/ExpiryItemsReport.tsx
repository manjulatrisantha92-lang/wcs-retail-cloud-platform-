import React, { useState } from 'react';
import { Product, BatchRecord, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  Calendar,
  AlertTriangle,
  Download,
  Printer,
  Search,
  DollarSign,
  Package,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface ExpiryItemsReportProps {
  products: Product[];
  tenant?: Tenant;
  currencySymbol: string;
}

interface ExpiryItemRow {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  category: string;
  batchNo: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'GOOD';
  quantity: number;
  unit: string;
  costPrice: number;
  unitPrice: number;
  totalCostValue: number;
  totalRetailValue: number;
  supplierName?: string;
}

export const ExpiryItemsReport: React.FC<ExpiryItemsReportProps> = ({
  products,
  tenant,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING'>('ALL');
  const [sortBy, setSortBy] = useState<'DAYS_ASC' | 'VALUE_DESC' | 'QTY_DESC' | 'NAME_ASC'>('DAYS_ASC');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const safeProducts = products || [];

  // Extract all batch records + calculate days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryRows: ExpiryItemRow[] = [];

  safeProducts.forEach((p) => {
    if (!p) return;
    // If product has explicit batches
    if (p.batches && p.batches.length > 0) {
      p.batches.forEach((b) => {
        if (!b.expiry_date) return;
        const expDate = new Date(b.expiry_date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'GOOD' = 'GOOD';
        if (daysRemaining < 0) {
          status = 'EXPIRED';
        } else if (daysRemaining <= 7) {
          status = 'CRITICAL';
        } else if (daysRemaining <= 30) {
          status = 'WARNING';
        } else if (daysRemaining <= 90) {
          status = 'UPCOMING';
        }

        const qty = b.quantity || 0;
        const cost = b.cost_price || p.cost_price || 0;
        const selling = b.selling_price || p.unit_price || 0;

        expiryRows.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category,
          batchNo: b.batch_no || 'DEFAULT',
          expiryDate: b.expiry_date,
          daysRemaining,
          status,
          quantity: qty,
          unit: p.unit || 'pcs',
          costPrice: cost,
          unitPrice: selling,
          totalCostValue: cost * qty,
          totalRetailValue: selling * qty,
          supplierName: b.supplier_name,
        });
      });
    } else {
      // Product top-level expiry date or custom field check
      const customExpiry = p.expiry_date || (p.custom_fields as any)?.expiry_date;
      if (customExpiry) {
        const expDate = new Date(customExpiry);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'GOOD' = 'GOOD';
        if (daysRemaining < 0) {
          status = 'EXPIRED';
        } else if (daysRemaining <= 7) {
          status = 'CRITICAL';
        } else if (daysRemaining <= 30) {
          status = 'WARNING';
        } else if (daysRemaining <= 90) {
          status = 'UPCOMING';
        }

        const qty = p.stock_quantity || 0;
        const cost = p.cost_price || 0;
        const selling = p.unit_price || 0;

        expiryRows.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          barcode: p.barcode,
          category: p.category,
          batchNo: (p.custom_fields as any)?.batch_no || 'MAIN',
          expiryDate: customExpiry,
          daysRemaining,
          status,
          quantity: qty,
          unit: p.unit || 'pcs',
          costPrice: cost,
          unitPrice: selling,
          totalCostValue: cost * qty,
          totalRetailValue: selling * qty,
        });
      }
    }
  });

  // Filter
  const filteredRows = expiryRows.filter((r) => {
    const matchesSearch =
      searchTerm === '' ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.barcode && r.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'EXPIRED'
        ? r.status === 'EXPIRED'
        : statusFilter === 'CRITICAL'
        ? r.status === 'CRITICAL'
        : statusFilter === 'WARNING'
        ? r.status === 'WARNING'
        : r.status === 'UPCOMING';

    return matchesSearch && matchesStatus;
  });

  // Sort
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === 'DAYS_ASC') return a.daysRemaining - b.daysRemaining;
    if (sortBy === 'VALUE_DESC') return b.totalCostValue - a.totalCostValue;
    if (sortBy === 'QTY_DESC') return b.quantity - a.quantity;
    if (sortBy === 'NAME_ASC') return a.productName.localeCompare(b.productName);
    return 0;
  });

  // KPI Calculations
  const expiredItems = expiryRows.filter((r) => r.status === 'EXPIRED');
  const criticalItems = expiryRows.filter((r) => r.status === 'CRITICAL');
  const warningItems = expiryRows.filter((r) => r.status === 'WARNING');

  const totalExpiredCostValue = expiredItems.reduce((acc, r) => acc + r.totalCostValue, 0);
  const totalExpiringSoonCostValue = [...criticalItems, ...warningItems].reduce((acc, r) => acc + r.totalCostValue, 0);
  const totalRetailLossRisk = [...expiredItems, ...criticalItems, ...warningItems].reduce((acc, r) => acc + r.totalRetailValue, 0);

  const totalFilteredCostValue = sortedRows.reduce((acc, r) => acc + r.totalCostValue, 0);
  const totalFilteredRetailValue = sortedRows.reduce((acc, r) => acc + r.totalRetailValue, 0);
  const totalFilteredQty = sortedRows.reduce((acc, r) => acc + r.quantity, 0);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Item Name',
      'Batch No',
      'Expiry Date',
      'Days Remaining',
      'Status',
      'Stock Qty',
      'Unit',
      'Cost Price (Rs.)',
      'Selling Price (Rs.)',
      'Total Cost Value (Rs.)',
      'Total Retail Value (Rs.)',
      'Supplier',
    ];

    const rows = sortedRows.map((r) => [
      `"${r.sku}"`,
      `"${r.barcode || ''}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.batchNo}"`,
      r.expiryDate,
      r.daysRemaining,
      r.status,
      r.quantity,
      `"${r.unit}"`,
      r.costPrice,
      r.unitPrice,
      r.totalCostValue,
      r.totalRetailValue,
      `"${r.supplierName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expiry_Items_Report_by_Value_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Expired Value (Cost)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {currencySymbol} {totalExpiredCostValue.toLocaleString()}
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {expiredItems.length} batches past expiry date (Write-off)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Expiring in ≤30 Days (Cost)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {currencySymbol} {totalExpiringSoonCostValue.toLocaleString()}
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {criticalItems.length + warningItems.length} batches requiring quick clearance / discount
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Retail Value at Risk</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalRetailLossRisk.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Potential loss of realized consumer sales
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tracked Expiry Batches</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {expiryRows.length} Batches
          </div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 block">
            Across active inventory items
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product, SKU, batch no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Expiry Statuses ({expiryRows.length})</option>
            <option value="EXPIRED">Already Expired ({expiredItems.length})</option>
            <option value="CRITICAL">Critical ≤7 Days ({criticalItems.length})</option>
            <option value="WARNING">Warning ≤30 Days ({warningItems.length})</option>
            <option value="UPCOMING">Upcoming ≤90 Days</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DAYS_ASC">Sort: Nearest Expiry Date</option>
            <option value="VALUE_DESC">Sort: Value at Risk (High to Low)</option>
            <option value="QTY_DESC">Sort: Quantity (High to Low)</option>
            <option value="NAME_ASC">Sort: Product Name (A-Z)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Expiry Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span>Expiry Valuation Register ({sortedRows.length} Batches)</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Total Valuation: <strong>{currencySymbol} {totalFilteredCostValue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Item Name</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Status / Timeline</th>
                <th className="py-3 px-4 text-center">Stock Quantity</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Value (Loss)</th>
                <th className="py-3 px-4 text-right">Retail Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No batch or expiry records matched your criteria.
                  </td>
                </tr>
              ) : (
                sortedRows.map((r, idx) => {
                  const isExp = r.status === 'EXPIRED';
                  const isCrit = r.status === 'CRITICAL';
                  const isWarn = r.status === 'WARNING';

                  return (
                    <tr
                      key={`${r.productId}-${r.batchNo}-${idx}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExp ? 'bg-rose-50/30' : isCrit ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {r.sku} {r.barcode ? `| ${r.barcode}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800 text-[11px]">
                          {r.batchNo}
                        </span>
                        {r.supplierName && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {r.supplierName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.expiryDate}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isExp
                              ? 'bg-rose-100 text-rose-800'
                              : isCrit
                              ? 'bg-amber-100 text-amber-800'
                              : isWarn
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExp
                            ? `EXPIRED (${Math.abs(r.daysRemaining)}d ago)`
                            : isCrit
                            ? `CRITICAL (${r.daysRemaining}d left)`
                            : isWarn
                            ? `WARNING (${r.daysRemaining}d left)`
                            : `GOOD (${r.daysRemaining}d left)`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {r.quantity} {r.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {currencySymbol} {r.costPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {currencySymbol} {r.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 bg-rose-50/20">
                        {currencySymbol} {r.totalCostValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {currencySymbol} {r.totalRetailValue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedRows.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Valuation of Expired & At-Risk Items ({sortedRows.length} Batches)
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{totalFilteredQty.toLocaleString()} Units</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm">
                    {currencySymbol} {totalFilteredCostValue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-950">
                    {currencySymbol} {totalFilteredRetailValue.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* A4 Report Print Step Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Expiry Item List by Valuation & Loss Risk"
        reportSubtitle={`Audit of Expired & Near-Expiry Batches (${sortedRows.length} Batches Listed)`}
        reportCategory="SHELF-LIFE EXPIRY & LOSS MITIGATION AUDIT"
        dateRangeText="Active Batch Expiry Registry"
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Expired Cost Loss', value: `${currencySymbol} ${totalExpiredCostValue.toLocaleString()}` },
          { label: 'At-Risk (≤30 Days)', value: `${currencySymbol} ${totalExpiringSoonCostValue.toLocaleString()}` },
          { label: 'Total Retail Value Risk', value: `${currencySymbol} ${totalRetailLossRisk.toLocaleString()}` },
          { label: 'Batches Listed', value: `${sortedRows.length} Batches (${totalFilteredQty.toLocaleString()} Units)` },
        ]}
        headers={[
          'SKU / Code',
          'Item Description',
          'Batch No',
          'Expiry Date',
          'Timeline',
          'Status',
          'Stock Qty',
          'Unit Cost',
          'Total Cost Value',
          'Retail Loss Value',
        ]}
        rows={sortedRows.map((r) => [
          r.sku || r.barcode || '-',
          r.productName,
          r.batchNo,
          r.expiryDate,
          r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)} days OVERDUE` : `${r.daysRemaining} days remaining`,
          r.status,
          `${r.quantity} ${r.unit}`,
          `${currencySymbol} ${r.costPrice.toLocaleString()}`,
          `${currencySymbol} ${r.totalCostValue.toLocaleString()}`,
          `${currencySymbol} ${r.totalRetailValue.toLocaleString()}`,
        ])}
        summaryRows={[
          { label: 'Total Cost Value of Expired Items (Loss)', value: `${currencySymbol} ${totalExpiredCostValue.toLocaleString()}`, isBold: true },
          { label: 'Total Cost Value of At-Risk Items (≤30 Days)', value: `${currencySymbol} ${totalExpiringSoonCostValue.toLocaleString()}` },
          { label: 'Grand Total Potential Retail Loss Exposure', value: `${currencySymbol} ${totalRetailLossRisk.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Expiry_Items_Valuation_Report"
      />
    </div>
  );
};
