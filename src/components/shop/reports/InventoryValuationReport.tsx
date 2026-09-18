import React, { useState } from 'react';
import { Product, Category, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  DollarSign,
  Download,
  Printer,
  Search,
  Filter,
  TrendingUp,
  Package,
  Layers,
  ArrowUpDown,
  ShieldAlert,
  AlertOctagon,
  Calendar,
} from 'lucide-react';

interface InventoryValuationReportProps {
  products: Product[];
  categories: Category[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const InventoryValuationReport: React.FC<InventoryValuationReportProps> = ({
  products,
  categories,
  tenant,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DAMAGED'
  >('ALL');
  const [sortBy, setSortBy] = useState<'VALUE_DESC' | 'VALUE_ASC' | 'QTY_DESC' | 'NAME_ASC' | 'DAMAGED_DESC'>('VALUE_DESC');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus =
      stockStatusFilter === 'ALL'
        ? true
        : stockStatusFilter === 'IN_STOCK'
        ? p.stock_quantity > p.reorder_level
        : stockStatusFilter === 'LOW_STOCK'
        ? p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level
        : stockStatusFilter === 'OUT_OF_STOCK'
        ? p.stock_quantity <= 0
        : stockStatusFilter === 'DAMAGED'
        ? (p.damaged_quantity || 0) > 0
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const costValueA = (a.cost_price || 0) * (a.stock_quantity || 0);
    const costValueB = (b.cost_price || 0) * (b.stock_quantity || 0);
    if (sortBy === 'VALUE_DESC') return costValueB - costValueA;
    if (sortBy === 'VALUE_ASC') return costValueA - costValueB;
    if (sortBy === 'QTY_DESC') return b.stock_quantity - a.stock_quantity;
    if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
    if (sortBy === 'DAMAGED_DESC') {
      const damValA = (a.damaged_quantity || 0) * (a.cost_price || 0);
      const damValB = (b.damaged_quantity || 0) * (b.cost_price || 0);
      return damValB - damValA;
    }
    return 0;
  });

  // Calculations
  const totalItemsCount = products.length;
  const totalStockQuantity = filteredProducts.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const totalCostValuation = filteredProducts.reduce(
    (acc, p) => acc + (p.cost_price || 0) * (p.stock_quantity || 0),
    0
  );
  const totalRetailValuation = filteredProducts.reduce(
    (acc, p) => acc + (p.unit_price || 0) * (p.stock_quantity || 0),
    0
  );
  const potentialGrossMargin = totalRetailValuation - totalCostValuation;
  const marginPercentage =
    totalRetailValuation > 0 ? ((potentialGrossMargin / totalRetailValuation) * 100).toFixed(1) : '0.0';

  // Damaged calculations
  const totalDamagedUnits = filteredProducts.reduce((acc, p) => acc + (p.damaged_quantity || 0), 0);
  const totalDamagedCostValuation = filteredProducts.reduce(
    (acc, p) => acc + (p.cost_price || 0) * (p.damaged_quantity || 0),
    0
  );
  const totalDamagedRetailValuation = filteredProducts.reduce(
    (acc, p) => acc + (p.unit_price || 0) * (p.damaged_quantity || 0),
    0
  );
  const damagedProductsCount = filteredProducts.filter((p) => (p.damaged_quantity || 0) > 0).length;
  const netSalableCostValuation = totalCostValuation - totalDamagedCostValuation;

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Item Name',
      'Category',
      'Stock Qty',
      'Unit',
      'Damaged Qty',
      'Damage Reason',
      'Damaged Date',
      'Damaged Cost Loss (Rs.)',
      'Unit Cost (Rs.)',
      'Selling Price (Rs.)',
      'Total Cost Valuation (Rs.)',
      'Total Retail Valuation (Rs.)',
      'Net Salable Cost Value (Rs.)',
      'Potential Gross Profit (Rs.)',
      'Margin %',
      'MFG Date',
      'EXP Date',
    ];

    const rows = sortedProducts.map((p) => {
      const costVal = (p.cost_price || 0) * (p.stock_quantity || 0);
      const retVal = (p.unit_price || 0) * (p.stock_quantity || 0);
      const damCostLoss = (p.cost_price || 0) * (p.damaged_quantity || 0);
      const netCost = costVal - damCostLoss;
      const profit = retVal - costVal;
      const margin = retVal > 0 ? ((profit / retVal) * 100).toFixed(1) : '0';

      return [
        `"${p.sku}"`,
        `"${p.barcode || ''}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.stock_quantity,
        `"${p.unit || 'pcs'}"`,
        p.damaged_quantity || 0,
        `"${p.damaged_reason || ''}"`,
        `"${p.damaged_date || ''}"`,
        damCostLoss,
        p.cost_price,
        p.unit_price,
        costVal,
        retVal,
        netCost,
        profit,
        `${margin}%`,
        `"${p.manufacture_date || ''}"`,
        `"${p.expiry_date || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Valuation_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Inventory Valuation (Cost)</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalCostValuation.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            Across {sortedProducts.length} items ({totalStockQuantity.toLocaleString()} units)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Retail Valuation (Selling)</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {currencySymbol} {totalRetailValuation.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1">
            Realizable value at store prices
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Potential Gross Profit</span>
          <div className="text-xl font-black text-indigo-700 mt-1">
            {currencySymbol} {potentialGrossMargin.toLocaleString()}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1">
            Markup spread: {marginPercentage}% overall
          </span>
        </div>

        {/* Damaged Stock Valuation Loss KPI */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Damaged Stock Loss (Cost)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">
            {currencySymbol} {totalDamagedCostValuation.toLocaleString()}
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-1 block">
            {totalDamagedUnits} damaged units ({damagedProductsCount} items)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Salable Valuation</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {currencySymbol} {netSalableCostValuation.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Cost value excluding recorded damage
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Category, Status, Sort, Export */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">Adequate Stock</option>
            <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            <option value="DAMAGED">Damaged Products ({damagedProductsCount})</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="VALUE_DESC">Sort: Value (High to Low)</option>
            <option value="VALUE_ASC">Sort: Value (Low to High)</option>
            <option value="QTY_DESC">Sort: Qty (High to Low)</option>
            <option value="NAME_ASC">Sort: Name (A-Z)</option>
            <option value="DAMAGED_DESC">Sort: Damaged Loss (Highest)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Inventory Valuation Register ({sortedProducts.length} Items)</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-600">
              Total Stock: <strong>{currencySymbol} {totalCostValuation.toLocaleString()}</strong>
            </span>
            {totalDamagedCostValuation > 0 && (
              <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                Damaged Loss: -{currencySymbol} {totalDamagedCostValuation.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">In-Stock Qty</th>
                <th className="py-3 px-4 text-center">Damaged Units</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Valuation</th>
                <th className="py-3 px-4 text-right">Damaged Loss</th>
                <th className="py-3 px-4 text-right">Expected Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No inventory items matched your search criteria.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p) => {
                  const costVal = (p.cost_price || 0) * (p.stock_quantity || 0);
                  const retVal = (p.unit_price || 0) * (p.stock_quantity || 0);
                  const damCostVal = (p.cost_price || 0) * (p.damaged_quantity || 0);
                  const marginVal = retVal - costVal;
                  const marginPct = retVal > 0 ? ((marginVal / retVal) * 100).toFixed(1) : '0';
                  const isLow = p.stock_quantity <= p.reorder_level;
                  const isOut = p.stock_quantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800">{p.sku}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400 font-mono">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {p.brand && <span>{p.brand}</span>}
                          {p.expiry_date && (
                            <span className="text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                              EXP: {p.expiry_date}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock_quantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      {/* Damaged Units Column */}
                      <td className="py-3 px-4 text-center font-mono">
                        {(p.damaged_quantity || 0) > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertOctagon className="w-2.5 h-2.5 text-rose-500" />
                              {p.damaged_quantity} {p.unit || 'pcs'}
                            </span>
                            {p.damaged_reason && (
                              <div className="text-[9px] text-slate-400 truncate max-w-[120px] mx-auto mt-0.5" title={p.damaged_reason}>
                                {p.damaged_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {currencySymbol} {(p.cost_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {currencySymbol} {(p.unit_price || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                        {currencySymbol} {costVal.toLocaleString()}
                      </td>
                      {/* Damaged Loss Column */}
                      <td className="py-3 px-4 text-right font-mono">
                        {damCostVal > 0 ? (
                          <div className="font-bold text-rose-700">
                            -{currencySymbol} {damCostVal.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-indigo-700">
                          +{currencySymbol} {marginVal.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">({marginPct}%)</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sortedProducts.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Valuation Total ({sortedProducts.length} Items)
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{totalStockQuantity.toLocaleString()} Units</td>
                  <td className="py-3 px-4 text-center font-mono text-rose-700">
                    {totalDamagedUnits > 0 ? `${totalDamagedUnits.toLocaleString()} Units` : '-'}
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono text-slate-950">
                    {currencySymbol} {totalCostValuation.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700">
                    {totalDamagedCostValuation > 0 ? `-${currencySymbol} ${totalDamagedCostValuation.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-800">
                    +{currencySymbol} {potentialGrossMargin.toLocaleString()} ({marginPercentage}%)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* A4 Report Print Modal Step */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Inventory Valuation & Asset Report"
        reportSubtitle={`Current Stock Value Breakdown with Damaged Losses (${sortedProducts.length} Items Listed)`}
        reportCategory="INVENTORY ASSET VALUATION"
        dateRangeText="Current Live Stock Status"
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Total Stock Units', value: `${totalStockQuantity.toLocaleString()} Units` },
          { label: 'Total Cost Value', value: `${currencySymbol} ${totalCostValuation.toLocaleString()}` },
          { label: 'Damaged Stock Loss', value: `${currencySymbol} ${totalDamagedCostValuation.toLocaleString()} (${totalDamagedUnits} units)` },
          { label: 'Net Salable Cost Value', value: `${currencySymbol} ${netSalableCostValuation.toLocaleString()}` },
          { label: 'Expected Gross Margin', value: `${currencySymbol} ${potentialGrossMargin.toLocaleString()} (${marginPercentage}%)` },
        ]}
        headers={[
          'SKU / Code',
          'Product Description',
          'Category',
          'In-Stock Qty',
          'Damaged Units',
          'Unit Cost',
          'Selling Price',
          'Total Cost Value',
          'Damaged Cost Loss',
          'Expected Margin',
        ]}
        rows={sortedProducts.map((p) => {
          const costVal = (p.cost_price || 0) * (p.stock_quantity || 0);
          const damLoss = (p.cost_price || 0) * (p.damaged_quantity || 0);
          const retVal = (p.unit_price || 0) * (p.stock_quantity || 0);
          const profit = retVal - costVal;
          return [
            p.sku || p.barcode || '-',
            p.name,
            p.category,
            `${p.stock_quantity} ${p.unit || 'pcs'}`,
            p.damaged_quantity ? `${p.damaged_quantity} ${p.unit || 'pcs'}` : '0',
            `${currencySymbol} ${(p.cost_price || 0).toLocaleString()}`,
            `${currencySymbol} ${(p.unit_price || 0).toLocaleString()}`,
            `${currencySymbol} ${costVal.toLocaleString()}`,
            damLoss > 0 ? `-${currencySymbol} ${damLoss.toLocaleString()}` : '-',
            `${currencySymbol} ${profit.toLocaleString()}`,
          ];
        })}
        summaryRows={[
          { label: 'Total Gross Inventory Cost Valuation', value: `${currencySymbol} ${totalCostValuation.toLocaleString()}`, isBold: true },
          { label: 'Total Damaged Inventory Value Loss (Write-Off)', value: `-${currencySymbol} ${totalDamagedCostValuation.toLocaleString()}`, isBold: true },
          { label: 'Net Salable Inventory Cost Valuation', value: `${currencySymbol} ${netSalableCostValuation.toLocaleString()}`, isBold: true },
          { label: 'Total Inventory Retail Valuation', value: `${currencySymbol} ${totalRetailValuation.toLocaleString()}`, isBold: true },
          { label: 'Expected Realizable Gross Margin', value: `${currencySymbol} ${potentialGrossMargin.toLocaleString()} (${marginPercentage}%)`, isGrandTotal: true },
        ]}
        csvFileName="Inventory_Valuation_Report"
      />
    </div>
  );
};
