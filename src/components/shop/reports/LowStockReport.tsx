import React, { useState } from 'react';
import { Product, Category, Supplier, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  AlertTriangle,
  Download,
  Printer,
  Search,
  Package,
  DollarSign,
  TrendingDown,
  Truck,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';

interface LowStockReportProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const LowStockReport: React.FC<LowStockReportProps> = ({
  products,
  categories,
  suppliers,
  tenant,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'CRITICAL_LOW' | 'ALL_LOW'>('ALL_LOW');
  const [sortBy, setSortBy] = useState<'DEFICIT_DESC' | 'COST_DESC' | 'STOCK_ASC' | 'NAME_ASC'>('COST_DESC');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter low stock items
  const lowStockItems = products.map((p) => {
    const isOut = (p.stock_quantity || 0) <= 0;
    const isLow = (p.stock_quantity || 0) <= (p.reorder_level || 0);
    const deficitQty = Math.max(0, (p.reorder_level || 0) * 2 - (p.stock_quantity || 0)); // Suggested restock volume
    const replenishmentCost = deficitQty * (p.cost_price || 0);

    return {
      product: p,
      isOut,
      isLow,
      deficitQty,
      replenishmentCost,
    };
  }).filter((item) => {
    if (urgencyFilter === 'OUT_OF_STOCK') return item.isOut;
    if (urgencyFilter === 'CRITICAL_LOW') return item.product.stock_quantity > 0 && item.product.stock_quantity <= Math.ceil(item.product.reorder_level / 2);
    if (urgencyFilter === 'ALL_LOW') return item.isLow;
    return true; // ALL
  });

  // Search & Category filter
  const filteredItems = lowStockItems.filter((item) => {
    const p = item.product;
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'ALL' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Sort
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'DEFICIT_DESC') return b.deficitQty - a.deficitQty;
    if (sortBy === 'COST_DESC') return b.replenishmentCost - a.replenishmentCost;
    if (sortBy === 'STOCK_ASC') return a.product.stock_quantity - b.product.stock_quantity;
    if (sortBy === 'NAME_ASC') return a.product.name.localeCompare(b.product.name);
    return 0;
  });

  // KPI Calculations
  const allOutCount = products.filter((p) => (p.stock_quantity || 0) <= 0).length;
  const allLowCount = products.filter((p) => (p.stock_quantity || 0) <= (p.reorder_level || 0)).length;
  const totalReplenishmentCost = sortedItems.reduce((acc, item) => acc + item.replenishmentCost, 0);
  const totalUnitsNeeded = sortedItems.reduce((acc, item) => acc + item.deficitQty, 0);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Current Stock',
      'Reorder Level',
      'Deficit Qty Needed',
      'Unit',
      'Unit Cost (Rs.)',
      'Replenishment Cost (Rs.)',
      'Status',
    ];

    const rows = sortedItems.map((item) => {
      const p = item.product;
      return [
        `"${p.sku}"`,
        `"${p.barcode || ''}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.stock_quantity,
        p.reorder_level,
        item.deficitQty,
        `"${p.unit || 'pcs'}"`,
        p.cost_price,
        item.replenishmentCost,
        item.isOut ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Low_Stock_Restock_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Critical Out of Stock (0)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {allOutCount} Products
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Causing immediate missed sales opportunities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Total Below Reorder Level</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {allLowCount} SKUs
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1">
            Stock quantity ≤ Reorder threshold
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Restock Capital</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {currencySymbol} {totalReplenishmentCost.toLocaleString()}
          </div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 block">
            To restock {totalUnitsNeeded.toLocaleString()} deficit units
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Catalog Health</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {products.length > 0 ? (((products.length - allLowCount) / products.length) * 100).toFixed(0) : 100}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {products.length - allLowCount} of {products.length} items adequately stocked
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
              placeholder="Search low stock product, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL_LOW">All Low & Out of Stock ({allLowCount})</option>
            <option value="OUT_OF_STOCK">Zero Stock Only ({allOutCount})</option>
            <option value="CRITICAL_LOW">Critical Low (≤ 50% reorder)</option>
            <option value="ALL">Entire Product Catalog ({products.length})</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="COST_DESC">Sort: Capital Needed (High to Low)</option>
            <option value="DEFICIT_DESC">Sort: Deficit Qty (High to Low)</option>
            <option value="STOCK_ASC">Sort: Current Stock (Lowest first)</option>
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

      {/* Main Low Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span>Low Stock Replenishment Register ({sortedItems.length} Products)</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Total Capital Needed: <strong>{currencySymbol} {totalReplenishmentCost.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-center">Reorder Level</th>
                <th className="py-3 px-4 text-center">Deficit Qty Needed</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Replenishment Cost</th>
                <th className="py-3 px-4 text-center">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-emerald-600 font-medium">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    All items in this criteria are sufficiently stocked above reorder thresholds!
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const p = item.product;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.isOut ? 'bg-rose-50/30' : 'bg-amber-50/20'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {p.sku} {p.barcode ? `| ${p.barcode}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                            item.isOut
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.stock_quantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600 font-semibold">
                        {p.reorder_level} {p.unit || 'pcs'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-indigo-700">
                        +{item.deficitQty} {p.unit || 'pcs'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {currencySymbol} {(p.cost_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {currencySymbol} {(p.unit_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 bg-slate-50/50">
                        {currencySymbol} {item.replenishmentCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isOut
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedItems.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Replenishment Total ({sortedItems.length} Products)
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-indigo-900">
                    +{totalUnitsNeeded.toLocaleString()} Units
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono text-slate-950 text-sm">
                    {currencySymbol} {totalReplenishmentCost.toLocaleString()}
                  </td>
                  <td className="py-3 px-4"></td>
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
        reportTitle="Low Stock & Purchase Replenishment Audit"
        reportSubtitle={`Inventory Deficit & Reorder Requirements (${sortedItems.length} Products Listed)`}
        reportCategory="INVENTORY REPLENISHMENT & PROCUREMENT"
        dateRangeText="Live Inventory Stock Reorder Audit"
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Out of Stock Items', value: `${allOutCount} SKUs` },
          { label: 'Total Low Stock SKUs', value: `${allLowCount} SKUs` },
          { label: 'Units Needed to Restock', value: `${totalUnitsNeeded.toLocaleString()} Units` },
          { label: 'Required Restock Capital', value: `${currencySymbol} ${totalReplenishmentCost.toLocaleString()}` },
        ]}
        headers={[
          'SKU / Code',
          'Product Name',
          'Category',
          'Current Stock',
          'Reorder Level',
          'Deficit Qty',
          'Unit Cost',
          'Restock Capital Required',
          'Status',
        ]}
        rows={sortedItems.map((item) => [
          item.product.sku || item.product.barcode || '-',
          item.product.name,
          item.product.category,
          `${item.product.stock_quantity} ${item.product.unit || 'pcs'}`,
          `${item.product.reorder_level} ${item.product.unit || 'pcs'}`,
          `+${item.deficitQty} ${item.product.unit || 'pcs'}`,
          `${currencySymbol} ${(item.product.cost_price || 0).toLocaleString()}`,
          `${currencySymbol} ${item.replenishmentCost.toLocaleString()}`,
          item.isOut ? 'OUT OF STOCK' : 'LOW STOCK',
        ])}
        summaryRows={[
          { label: 'Total Units Needed Across Deficit SKUs', value: `+${totalUnitsNeeded.toLocaleString()} Units`, isBold: true },
          { label: 'Grand Total Estimated Restock Capital Required', value: `${currencySymbol} ${totalReplenishmentCost.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Low_Stock_Replenishment_Report"
      />
    </div>
  );
};
