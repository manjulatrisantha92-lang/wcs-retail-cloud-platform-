import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { StockAdjustmentRecord, StockAuditSession, StockGapReason, Product } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  RefreshCw,
  FileText,
  Printer,
  Download,
  Share2,
  Trash2,
  Eye,
  SlidersHorizontal,
  ClipboardList,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  Scale,
  ShieldAlert,
  Package,
  Calendar,
  X,
  Check,
} from 'lucide-react';

const REASON_LABELS: Record<StockGapReason, { label: string; desc: string; color: string; badgeBg: string }> = {
  MISSING_THEFT: {
    label: 'Missing / Theft / Shrinkage',
    desc: 'Unaccounted shortage discovered during shelf or aisle check',
    color: 'text-red-700 border-red-200 bg-red-50',
    badgeBg: 'bg-red-100 text-red-800 border-red-200',
  },
  DAMAGED_BROKEN: {
    label: 'Damaged / Broken / Leaked',
    desc: 'Physical breakage during handling, forklift unloading or customer drops',
    color: 'text-orange-700 border-orange-200 bg-orange-50',
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  EXPIRED_SPOILED: {
    label: 'Expired / Spoiled / Perished',
    desc: 'Past expiry date or spoiled stock disposed safely',
    color: 'text-amber-700 border-amber-200 bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  INTERNAL_USE_TESTING: {
    label: 'Internal Store Use / Testing / Demo',
    desc: 'Consumed for store demonstration, workshop sample or employee use',
    color: 'text-blue-700 border-blue-200 bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  WEIGHT_LOSS_DRYING: {
    label: 'Weight Loss / Evaporation / Drying',
    desc: 'Natural moisture shrinkage in grains, fresh produce, vegetables or bulk sacks',
    color: 'text-cyan-700 border-cyan-200 bg-cyan-50',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  DATA_ENTRY_ERROR: {
    label: 'Data Entry / GRN Count Error',
    desc: 'Correction of previous typo or miscount during purchase receiving',
    color: 'text-purple-700 border-purple-200 bg-purple-50',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  FOUND_SURPLUS: {
    label: 'Found Surplus / Overstock',
    desc: 'Physical count exceeds system stock (unrecorded supplier bonus/return)',
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  SUPPLIER_SHORTAGE: {
    label: 'Supplier Delivery Shortage',
    desc: 'Short delivery discovered after invoice acceptance',
    color: 'text-yellow-700 border-yellow-200 bg-yellow-50',
    badgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  OTHER: {
    label: 'Other Reason',
    desc: 'Custom specific discrepancy reason outlined in notes',
    color: 'text-slate-700 border-slate-200 bg-slate-50',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

export const StockAdjustmentManager: React.FC = () => {
  const {
    products,
    categories,
    stockAdjustments,
    stockAudits,
    currentTenant,
    currentUser,
    recordStockAdjustment,
    batchReconcileStockAudit,
    deleteStockAdjustment,
    deleteStockAuditSession,
    queuePrintJob,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'CORRECT_GAP' | 'STOCK_AUDIT' | 'HISTORY' | 'AUDIT_SESSIONS'>('CORRECT_GAP');
  const currency = currentTenant?.currency_symbol || 'Rs.';

  // --- TAB 1: Single Gap State ---
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchProductQuery, setSearchProductQuery] = useState<string>('');
  const [physicalCountInput, setPhysicalCountInput] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<StockGapReason>('MISSING_THEFT');
  const [discrepancyNotes, setDiscrepancyNotes] = useState<string>('');
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);
  const [lastAdjustedRecord, setLastAdjustedRecord] = useState<StockAdjustmentRecord | null>(null);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return (products || []).find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Filtered product suggestions for rapid picker
  const filteredProductsForSelect = useMemo(() => {
    if (!searchProductQuery.trim()) {
      return (products || []).slice(0, 10);
    }
    const q = searchProductQuery.toLowerCase();
    return (products || []).filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [products, searchProductQuery]);

  // Gap calculations for Single Correction
  const parsedPhysicalCount = physicalCountInput === '' ? (selectedProduct?.stock_quantity ?? 0) : Number(physicalCountInput);
  const currentSystemStock = selectedProduct?.stock_quantity ?? 0;
  const computedGapQty = parsedPhysicalCount - currentSystemStock;
  const computedCostVariance = computedGapQty * (selectedProduct?.cost_price ?? 0);
  const computedRetailVariance = computedGapQty * (selectedProduct?.selling_price ?? 0);

  // Handle single gap submission
  const handleApplySingleCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (isNaN(parsedPhysicalCount) || parsedPhysicalCount < 0) {
      alert('Please enter a valid non-negative physical stock count.');
      return;
    }

    const record = recordStockAdjustment({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      sku: selectedProduct.sku,
      barcode: selectedProduct.barcode,
      category: selectedProduct.category,
      unit: selectedProduct.unit,
      cost_price: selectedProduct.cost_price,
      selling_price: selectedProduct.selling_price,
      system_stock_before: currentSystemStock,
      physical_count: parsedPhysicalCount,
      gap_quantity: computedGapQty,
      financial_variance_cost: computedCostVariance,
      financial_variance_retail: computedRetailVariance,
      reason: selectedReason,
      notes: discrepancyNotes,
    });

    setLastAdjustedRecord(record);
    setIsSuccessNotification(true);
    setTimeout(() => setIsSuccessNotification(false), 5000);

    // Reset inputs
    setPhysicalCountInput('');
    setDiscrepancyNotes('');
  };

  // --- TAB 2: Batch Audit State ---
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [auditTitle, setAuditTitle] = useState<string>(`Audit Count - ${new Date().toLocaleDateString()}`);
  const [auditNotes, setAuditNotes] = useState<string>('');
  const [auditCounts, setAuditCounts] = useState<Record<string, { count: number; reason: StockGapReason; note: string }>>({});
  const [isAuditSubmitting, setIsAuditSubmitting] = useState<boolean>(false);

  // Filtered products for audit table
  const auditProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const matchCat = auditCategoryFilter === 'ALL' || p.category === auditCategoryFilter;
      const q = auditSearchQuery.toLowerCase();
      const matchSearch =
        !auditSearchQuery.trim() ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, auditCategoryFilter, auditSearchQuery]);

  // Initializing or getting physical count for an item in audit
  const getItemAuditState = (prod: Product) => {
    if (auditCounts[prod.id]) {
      return auditCounts[prod.id];
    }
    return {
      count: prod.stock_quantity,
      reason: 'MISSING_THEFT' as StockGapReason,
      note: '',
    };
  };

  const updateItemAuditCount = (prodId: string, count: number, defaultStock: number) => {
    const current = auditCounts[prodId] || {
      count: defaultStock,
      reason: 'MISSING_THEFT' as StockGapReason,
      note: '',
    };
    const validCount = Math.max(0, count);
    const gap = validCount - defaultStock;
    const autoReason: StockGapReason = gap < 0 ? 'MISSING_THEFT' : gap > 0 ? 'FOUND_SURPLUS' : current.reason;

    setAuditCounts((prev) => ({
      ...prev,
      [prodId]: {
        ...current,
        count: validCount,
        reason: autoReason,
      },
    }));
  };

  const updateItemAuditReason = (prodId: string, reason: StockGapReason, defaultStock: number) => {
    const current = auditCounts[prodId] || {
      count: defaultStock,
      reason,
      note: '',
    };
    setAuditCounts((prev) => ({
      ...prev,
      [prodId]: {
        ...current,
        reason,
      },
    }));
  };

  // Batch Audit Metrics calculations
  const auditSummaryMetrics = useMemo(() => {
    let itemsCounted = 0;
    let itemsWithGap = 0;
    let totalMissingQty = 0;
    let totalSurplusQty = 0;
    let totalCostLoss = 0;
    let totalCostGain = 0;

    auditProducts.forEach((p) => {
      itemsCounted++;
      const current = auditCounts[p.id]?.count ?? p.stock_quantity;
      const gap = current - p.stock_quantity;
      if (gap !== 0) {
        itemsWithGap++;
        if (gap < 0) {
          totalMissingQty += Math.abs(gap);
          totalCostLoss += Math.abs(gap * p.cost_price);
        } else {
          totalSurplusQty += gap;
          totalCostGain += gap * p.cost_price;
        }
      }
    });

    return {
      itemsCounted,
      itemsWithGap,
      totalMissingQty,
      totalSurplusQty,
      totalCostLoss,
      totalCostGain,
      netVariance: totalCostGain - totalCostLoss,
    };
  }, [auditProducts, auditCounts]);

  const handleFinalizeBatchAudit = () => {
    if (auditProducts.length === 0) {
      alert('No products available in this category/search to audit.');
      return;
    }

    if (!confirm(`Reconcile stock for ${auditProducts.length} items? ${auditSummaryMetrics.itemsWithGap} items have discrepancies.`)) {
      return;
    }

    setIsAuditSubmitting(true);

    const itemsToReconcile = auditProducts.map((p) => {
      const state = getItemAuditState(p);
      return {
        product_id: p.id,
        physical_count: state.count,
        reason: state.reason,
        notes: state.note,
      };
    });

    const session = batchReconcileStockAudit({
      title: auditTitle,
      category_filter: auditCategoryFilter,
      notes: auditNotes,
      items: itemsToReconcile,
    });

    setIsAuditSubmitting(false);
    alert(`Stock Audit #${session.session_no} reconciled successfully! ${session.items_with_gap} gap adjustments saved.`);
    setAuditCounts({});
    setActiveTab('AUDIT_SESSIONS');
  };

  // --- TAB 3: History & Reports Filter State ---
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyReasonFilter, setHistoryReasonFilter] = useState<string>('ALL');
  const [viewVoucherModalRecord, setViewVoucherModalRecord] = useState<StockAdjustmentRecord | null>(null);
  const [viewSessionModal, setViewSessionModal] = useState<StockAuditSession | null>(null);

  const filteredHistory = useMemo(() => {
    return (stockAdjustments || []).filter((item) => {
      const matchReason = historyReasonFilter === 'ALL' || item.reason === historyReasonFilter;
      const q = historySearchQuery.toLowerCase();
      const matchSearch =
        !historySearchQuery.trim() ||
        (item.adjustment_no || '').toLowerCase().includes(q) ||
        (item.product_name || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q) ||
        (item.barcode || '').toLowerCase().includes(q) ||
        (item.adjusted_by || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q);
      return matchReason && matchSearch;
    });
  }, [stockAdjustments, historyReasonFilter, historySearchQuery]);

  // Overall Discrepancy KPI Summary
  const overallKpi = useMemo(() => {
    let totalAdjustments = (stockAdjustments || []).length;
    let totalShrinkageLoss = 0;
    let totalMissingUnits = 0;
    let totalSurplusUnits = 0;
    let totalSurplusGain = 0;

    (stockAdjustments || []).forEach((adj) => {
      if (adj.gap_quantity < 0) {
        totalMissingUnits += Math.abs(adj.gap_quantity);
        totalShrinkageLoss += Math.abs(adj.financial_variance_cost);
      } else if (adj.gap_quantity > 0) {
        totalSurplusUnits += adj.gap_quantity;
        totalSurplusGain += adj.financial_variance_cost;
      }
    });

    return {
      totalAdjustments,
      totalMissingUnits,
      totalShrinkageLoss,
      totalSurplusUnits,
      totalSurplusGain,
      netCostVariance: totalSurplusGain - totalShrinkageLoss,
    };
  }, [stockAdjustments]);

  // Export History to CSV
  const handleExportCSV = () => {
    if (!filteredHistory.length) {
      alert('No stock adjustment records to export.');
      return;
    }

    const headers = [
      'Adjustment No',
      'Date',
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Unit',
      'Cost Price',
      'Selling Price',
      'System Stock Before',
      'Physical Count',
      'Gap Quantity',
      'Cost Variance (Loss/Gain)',
      'Retail Variance',
      'Reason',
      'Adjusted By',
      'Notes',
    ];

    const rows = filteredHistory.map((r) => [
      r.adjustment_no,
      new Date(r.created_at).toLocaleString(),
      `"${(r.product_name || '').replace(/"/g, '""')}"`,
      r.sku,
      r.barcode,
      r.category,
      r.unit,
      r.cost_price,
      r.selling_price,
      r.system_stock_before,
      r.physical_count,
      r.gap_quantity,
      r.financial_variance_cost,
      r.financial_variance_retail,
      r.reason,
      `"${(r.adjusted_by || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Discrepancy_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share Discrepancy Summary
  const handleWhatsAppShare = (record: StockAdjustmentRecord) => {
    const sign = record.gap_quantity > 0 ? `+${record.gap_quantity}` : `${record.gap_quantity}`;
    const text =
      `*STOCK ADJUSTMENT / GAP REPORT*\n` +
      `Shop: ${currentTenant?.shop_name || 'Retail Store'}\n` +
      `Voucher No: ${record.adjustment_no}\n` +
      `Date: ${new Date(record.created_at).toLocaleString()}\n` +
      `Product: ${record.product_name} (${record.sku})\n` +
      `Reason: ${REASON_LABELS[record.reason]?.label || record.reason}\n` +
      `Before: ${record.system_stock_before} ${record.unit} -> Count: ${record.physical_count} ${record.unit}\n` +
      `Gap / Variance: ${sign} ${record.unit}\n` +
      `Cost Loss/Gain: ${currency} ${(record.financial_variance_cost || 0).toLocaleString()}\n` +
      `Adjusted By: ${record.adjusted_by}\n` +
      (record.notes ? `Notes: ${record.notes}\n` : '') +
      `_Powered by WCS Retail Cloud_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Discrepancy KPI Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Stock Gap & Missing Item Adjustment</h1>
                <p className="text-xs text-slate-500">
                  Reconcile inventory shrinkage, physical shelf count gaps, theft, and damage write-offs with audit trails
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('CORRECT_GAP')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CORRECT_GAP'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Correct Single Item</span>
            </button>
            <button
              onClick={() => setActiveTab('STOCK_AUDIT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'STOCK_AUDIT'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Bulk Stock Audit</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Adjustment Ledger ({stockAdjustments?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('AUDIT_SESSIONS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'AUDIT_SESSIONS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Past Audits ({stockAudits?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Adjustments</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-800">{overallKpi.totalAdjustments}</span>
              <span className="text-[11px] text-slate-500">records logged</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200/70 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">Missing / Shrinkage Units</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-red-700">-{overallKpi.totalMissingUnits}</span>
              <span className="text-[11px] text-red-600 font-medium">units lost</span>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200/70 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">Total Financial Loss (Cost)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-rose-700">
                {currency} {overallKpi.totalShrinkageLoss.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Surplus / Found Value</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-700">
                +{currency} {overallKpi.totalSurplusGain.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {isSuccessNotification && lastAdjustedRecord && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Stock Gap Corrected Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Voucher <span className="font-mono font-bold">#{lastAdjustedRecord.adjustment_no}</span> recorded for{' '}
                <span className="font-semibold">{lastAdjustedRecord.product_name}</span>. Stock updated from{' '}
                <span className="font-bold">{lastAdjustedRecord.system_stock_before}</span> to{' '}
                <span className="font-bold">{lastAdjustedRecord.physical_count}</span> (Variance:{' '}
                <span className="font-bold">
                  {lastAdjustedRecord.gap_quantity > 0 ? `+${lastAdjustedRecord.gap_quantity}` : lastAdjustedRecord.gap_quantity}{' '}
                  {lastAdjustedRecord.unit}
                </span>
                ).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewVoucherModalRecord(lastAdjustedRecord)}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={() => setIsSuccessNotification(false)}
              className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: Single Gap Item Correction */}
      {activeTab === 'CORRECT_GAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product Selector & Quick Barcode Scanner */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <span>1. Select Discrepant Product</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">{(products || []).length} catalog items</span>
              </div>

              {/* Product search box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan barcode, enter SKU, or product name..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-sans"
                />
              </div>

              {/* Product List */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredProductsForSelect.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setPhysicalCountInput(String(prod.stock_quantity));
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{prod.name}</span>
                          {prod.stock_quantity <= 0 ? (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-sm">Out of Stock</span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-sm">
                              {prod.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                          <span>SKU: {prod.sku || 'N/A'}</span>
                          <span>•</span>
                          <span>Barcode: {prod.barcode || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">System Stock</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {prod.stock_quantity} <span className="text-xs font-normal text-slate-500">{prod.unit}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredProductsForSelect.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs">No products matching "{searchProductQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Correction Form & Variance Calculator */}
          <div className="lg:col-span-7 space-y-4">
            {selectedProduct ? (
              <form onSubmit={handleApplySingleCorrection} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Stock Discrepancy Correction</span>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedProduct.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      SKU: {selectedProduct.sku} | Barcode: {selectedProduct.barcode} | Unit: {selectedProduct.unit}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">Unit Valuation</span>
                    <div className="text-xs font-semibold text-slate-700">
                      Cost: {currency} {(selectedProduct.cost_price || 0).toLocaleString()} | Retail: {currency}{' '}
                      {(selectedProduct.selling_price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Stock Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Current System Stock */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">1. System Recorded Stock</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {currentSystemStock} <span className="text-xs font-normal text-slate-500">{selectedProduct.unit}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Prior to correction</span>
                  </div>

                  {/* Physical Count Input */}
                  <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
                    <label className="text-[11px] font-bold text-rose-800 uppercase block">2. Actual Physical Shelf Count</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setPhysicalCountInput(String(Math.max(0, parsedPhysicalCount - 1)))}
                        className="p-1 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={physicalCountInput}
                        onChange={(e) => setPhysicalCountInput(e.target.value)}
                        placeholder="Count..."
                        className="w-full text-center py-1 bg-white border border-rose-300 rounded-lg text-lg font-black text-rose-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setPhysicalCountInput(String(parsedPhysicalCount + 1))}
                        className="p-1 bg-white border border-rose-300 text-rose-700 rounded-lg hover:bg-rose-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-rose-600 font-medium mt-1">
                      <button
                        type="button"
                        onClick={() => setPhysicalCountInput('0')}
                        className="hover:underline cursor-pointer"
                      >
                        Set to Zero (0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhysicalCountInput(String(currentSystemStock))}
                        className="hover:underline cursor-pointer"
                      >
                        Reset to System
                      </button>
                    </div>
                  </div>

                  {/* Computed Gap Variance */}
                  <div
                    className={`p-3.5 rounded-xl border ${
                      computedGapQty < 0
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : computedGapQty > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase block">
                      {computedGapQty < 0 ? 'Shortage / Gap' : computedGapQty > 0 ? 'Surplus / Excess' : 'Status'}
                    </span>
                    <div className="text-2xl font-black mt-1 flex items-center gap-1">
                      {computedGapQty > 0 ? (
                        <>
                          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                          <span>+{computedGapQty}</span>
                        </>
                      ) : computedGapQty < 0 ? (
                        <>
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                          <span>{computedGapQty}</span>
                        </>
                      ) : (
                        <span>0</span>
                      )}
                      <span className="text-xs font-normal opacity-80">{selectedProduct.unit}</span>
                    </div>
                    <span className="text-[10px] font-bold block mt-0.5">
                      Cost Variance: {currency} {computedCostVariance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Discrepancy / Gap Reason</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.keys(REASON_LABELS) as StockGapReason[]).map((reasonKey) => {
                      const isSelected = selectedReason === reasonKey;
                      const info = REASON_LABELS[reasonKey];
                      return (
                        <button
                          key={reasonKey}
                          type="button"
                          onClick={() => setSelectedReason(reasonKey)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-1 ring-rose-500'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                              isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">{info.label}</span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{info.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auditor Notes & Explanations */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Discrepancy Notes / Shrinkage Root Cause Details
                  </label>
                  <textarea
                    rows={2}
                    value={discrepancyNotes}
                    onChange={(e) => setDiscrepancyNotes(e.target.value)}
                    placeholder="e.g., Aisle 3 broken bottle cleaned up by helper; NMRA expired date quarantine; supplier delivery short by 2 packs..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-sans"
                  />
                </div>

                {/* Financial Summary & Submission */}
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">Adjustment Summary</span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      New Stock Level: <span className="text-emerald-400 font-mono">{parsedPhysicalCount} {selectedProduct.unit}</span>
                      <span className="text-slate-400 mx-2">|</span>
                      Financial Impact:{' '}
                      <span className={computedCostVariance < 0 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                        {computedCostVariance > 0 ? '+' : ''}
                        {currency} {computedCostVariance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply Stock Correction</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">No Product Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select an item from the left product list or scan its barcode to enter physical shelf counts and record shrinkage.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Bulk Physical Stock Audit & Batch Reconciliation */}
      {activeTab === 'STOCK_AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>Physical Stock Audit & Count Sheet</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Conduct regular stock counts by category or full store, identify discrepancy gaps, and commit bulk corrections.
              </p>
            </div>

            {/* Category Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                <select
                  value={auditCategoryFilter}
                  onChange={(e) => setAuditCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Categories ({(products || []).length} items)</option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit items..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* Audit Session Setup Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Audit Session Title</label>
              <input
                type="text"
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
                placeholder="e.g. Month End FMCG Shelf Audit"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">General Auditor Notes</label>
              <input
                type="text"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="e.g. Conducted by Aisle 1 & 2 Stock Team"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Audit Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Product & SKU</th>
                    <th className="px-3 py-2.5 text-center">Unit</th>
                    <th className="px-3 py-2.5 text-right">Cost Price</th>
                    <th className="px-3 py-2.5 text-center">System Stock</th>
                    <th className="px-4 py-2.5 text-center w-48">Physical Count</th>
                    <th className="px-3 py-2.5 text-center">Gap Variance</th>
                    <th className="px-3 py-2.5 text-right">Cost Variance</th>
                    <th className="px-3.5 py-2.5">Reason Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {auditProducts.map((prod) => {
                    const itemState = getItemAuditState(prod);
                    const currentCount = itemState.count;
                    const gap = currentCount - prod.stock_quantity;
                    const costVar = gap * prod.cost_price;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {prod.sku || 'N/A'} | Barcode: {prod.barcode || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{prod.unit}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                          {currency} {(prod.cost_price || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center font-extrabold text-slate-800">{prod.stock_quantity}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemAuditCount(prod.id, currentCount - 1, prod.stock_quantity)}
                              className="p-1 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={currentCount}
                              onChange={(e) =>
                                updateItemAuditCount(
                                  prod.id,
                                  e.target.value === '' ? 0 : Number(e.target.value),
                                  prod.stock_quantity
                                )
                              }
                              className="w-16 text-center py-1 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemAuditCount(prod.id, currentCount + 1, prod.stock_quantity)}
                              className="p-1 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Reset to System Stock"
                              onClick={() => updateItemAuditCount(prod.id, prod.stock_quantity, prod.stock_quantity)}
                              className="px-1.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md ml-1 cursor-pointer"
                            >
                              =Sys
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {gap === 0 ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched
                            </span>
                          ) : gap < 0 ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <ArrowDownRight className="w-3 h-3 text-red-600" /> {gap} {prod.unit}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" /> +{gap} {prod.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold">
                          <span className={costVar < 0 ? 'text-red-600' : costVar > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                            {costVar > 0 ? '+' : ''}
                            {currency} {(costVar || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          {gap !== 0 ? (
                            <select
                              value={itemState.reason}
                              onChange={(e) =>
                                updateItemAuditReason(prod.id, e.target.value as StockGapReason, prod.stock_quantity)
                              }
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1 text-[11px] font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {(Object.keys(REASON_LABELS) as StockGapReason[]).map((rKey) => (
                                <option key={rKey} value={rKey}>
                                  {REASON_LABELS[rKey].label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No discrepancy</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Audit Summary & Reconcile Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Counted Items</span>
                <span className="text-sm font-extrabold text-white">{auditSummaryMetrics.itemsCounted} SKUs</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Discrepancy Items</span>
                <span className="text-sm font-extrabold text-amber-400">{auditSummaryMetrics.itemsWithGap} items</span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Shrinkage Loss</span>
                <span className="text-sm font-extrabold text-rose-400">
                  -{currency} {auditSummaryMetrics.totalCostLoss.toLocaleString()}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Net Cost Variance</span>
                <span
                  className={`text-sm font-extrabold ${
                    auditSummaryMetrics.netVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {auditSummaryMetrics.netVariance > 0 ? '+' : ''}
                  {currency} {auditSummaryMetrics.netVariance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinalizeBatchAudit}
                disabled={isAuditSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Commit & Reconcile Audit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: History & Discrepancy Ledger */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Stock Discrepancy & Shrinkage History Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete auditable journal of all item-level write-offs, shrinkage adjustments, and count corrections.
              </p>
            </div>

            {/* Actions: CSV Export */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <select
                value={historyReasonFilter}
                onChange={(e) => setHistoryReasonFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">All Reasons ({stockAdjustments?.length || 0})</option>
                {(Object.keys(REASON_LABELS) as StockGapReason[]).map((rKey) => (
                  <option key={rKey} value={rKey}>
                    {REASON_LABELS[rKey].label}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2.5">Voucher & Date</th>
                    <th className="px-3.5 py-2.5">Product & SKU</th>
                    <th className="px-3 py-2.5">Reason</th>
                    <th className="px-3 py-2.5 text-center">Before &rarr; Physical</th>
                    <th className="px-3 py-2.5 text-center">Gap Qty</th>
                    <th className="px-3 py-2.5 text-right">Cost Variance</th>
                    <th className="px-3 py-2.5">Adjusted By & Notes</th>
                    <th className="px-3.5 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredHistory.map((rec) => {
                    const reasonInfo = REASON_LABELS[rec.reason] || REASON_LABELS.OTHER;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5">
                          <span className="font-mono font-bold text-slate-900 block">{rec.adjustment_no}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rec.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span className="font-bold text-slate-900 block">{rec.product_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {rec.sku || 'N/A'} | {rec.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${reasonInfo.badgeBg}`}>
                            {reasonInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono">
                          <span className="text-slate-500">{rec.system_stock_before}</span>
                          <span className="text-slate-400 mx-1">&rarr;</span>
                          <span className="font-bold text-slate-900">{rec.physical_count}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{rec.unit}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold">
                          <span className={rec.gap_quantity < 0 ? 'text-red-600' : 'text-emerald-600'}>
                            {rec.gap_quantity > 0 ? `+${rec.gap_quantity}` : rec.gap_quantity} {rec.unit}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold">
                          <span className={rec.financial_variance_cost < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {rec.financial_variance_cost > 0 ? '+' : ''}
                            {currency} {(rec.financial_variance_cost || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 max-w-xs">
                          <span className="font-semibold text-slate-800 text-[11px] block">{rec.adjusted_by}</span>
                          {rec.notes && <span className="text-[10px] text-slate-500 block truncate">{rec.notes}</span>}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setViewVoucherModalRecord(rec)}
                              title="View & Print Slip"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(rec)}
                              title="Share on WhatsApp"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete adjustment record #${rec.adjustment_no}?`)) {
                                  deleteStockAdjustment(rec.id);
                                }
                              }}
                              title="Delete Record"
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No stock adjustment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Past Stock Audit Sessions */}
      {activeTab === 'AUDIT_SESSIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Completed Stock Audit Sessions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived stock take sessions with complete store variance statistics and auditor sign-offs.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('STOCK_AUDIT')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Audit Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(stockAudits || []).map((session) => (
              <div
                key={session.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {session.session_no}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{session.title}</h4>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {new Date(session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete audit session #${session.session_no}?`)) {
                        deleteStockAuditSession(session.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Category</span>
                    <span className="font-bold text-slate-800">{session.category_filter}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Counted / Gap</span>
                    <span className="font-bold text-slate-800">
                      {session.items_counted} items (<span className="text-rose-600 font-extrabold">{session.items_with_gap} gaps</span>)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Missing Shrinkage</span>
                    <span className="font-bold text-rose-600">-{session.total_missing_qty} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Cost Variance</span>
                    <span
                      className={`font-bold font-mono ${
                        session.net_financial_variance < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {currency} {(session.net_financial_variance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 truncate max-w-[150px]">By: {session.conducted_by}</span>
                  <button
                    onClick={() => setViewSessionModal(session)}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Breakdown</span>
                  </button>
                </div>
              </div>
            ))}

            {(stockAudits || []).length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs">No audit sessions completed yet. Start your first physical stock audit!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: Thermal / A4 Voucher Preview --- */}
      {viewVoucherModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Stock Adjustment Voucher</h3>
              </div>
              <button
                onClick={() => setViewVoucherModalRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Slip Mock */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <h4 className="font-extrabold text-sm uppercase">{currentTenant?.shop_name || 'Retail Store'}</h4>
                <p className="text-[10px] text-slate-500">{currentTenant?.address || 'Main Branch, Colombo'}</p>
                <p className="text-[10px] font-bold mt-1 text-rose-700">*** INVENTORY DISCREPANCY VOUCHER ***</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Voucher No:</span>
                  <span className="font-bold">{viewVoucherModalRecord.adjustment_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{new Date(viewVoucherModalRecord.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Auditor / By:</span>
                  <span className="font-bold">{viewVoucherModalRecord.adjusted_by}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reason Code:</span>
                  <span className="font-bold">{REASON_LABELS[viewVoucherModalRecord.reason]?.label}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="font-bold text-slate-900">{viewVoucherModalRecord.product_name}</div>
                <div className="text-[10px] text-slate-500">
                  SKU: {viewVoucherModalRecord.sku} | Barcode: {viewVoucherModalRecord.barcode}
                </div>
                <div className="flex justify-between pt-1">
                  <span>Before Count:</span>
                  <span>
                    {viewVoucherModalRecord.system_stock_before} {viewVoucherModalRecord.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Physical Count:</span>
                  <span className="font-bold">
                    {viewVoucherModalRecord.physical_count} {viewVoucherModalRecord.unit}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-rose-700">
                  <span>Variance / Gap:</span>
                  <span>
                    {viewVoucherModalRecord.gap_quantity > 0
                      ? `+${viewVoucherModalRecord.gap_quantity}`
                      : viewVoucherModalRecord.gap_quantity}{' '}
                    {viewVoucherModalRecord.unit}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Cost Loss/Gain:</span>
                  <span>
                    {currency} {(viewVoucherModalRecord.financial_variance_cost || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {viewVoucherModalRecord.notes && (
                <div className="text-[10px] text-slate-600 italic">
                  Note: {viewVoucherModalRecord.notes}
                </div>
              )}

              <div className="pt-4 flex justify-between text-[10px] text-slate-400">
                <div className="text-center">
                  <div className="border-t border-slate-400 w-24 pt-1">Store Auditor</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 w-24 pt-1">Manager Sign</div>
                </div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleWhatsAppShare(viewVoucherModalRecord)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  queuePrintJob(
                    'THERMAL_80',
                    `Adjustment #${viewVoucherModalRecord.adjustment_no}`,
                    `Stock Discrepancy Slip: ${viewVoucherModalRecord.product_name} | Gap: ${viewVoucherModalRecord.gap_quantity}`
                  );
                  alert('Voucher sent to Print Queue (80mm Thermal Receipt).');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Slip</span>
              </button>
              <button
                onClick={() => setViewVoucherModalRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Audit Session Item Breakdown --- */}
      {viewSessionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {viewSessionModal.session_no}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewSessionModal.title}</h3>
                <p className="text-xs text-slate-500">
                  {new Date(viewSessionModal.created_at).toLocaleString()} | Conducted by: {viewSessionModal.conducted_by}
                </p>
              </div>
              <button
                onClick={() => setViewSessionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Counted</span>
                <div className="font-extrabold text-slate-900">{viewSessionModal.items_counted} Items</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Gaps Discovered</span>
                <div className="font-extrabold text-amber-600">{viewSessionModal.items_with_gap} Items</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Shrinkage</span>
                <div className="font-extrabold text-rose-600">-{viewSessionModal.total_missing_qty} units</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Net Cost Variance</span>
                <div
                  className={`font-extrabold font-mono ${
                    viewSessionModal.net_financial_variance < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {currency} {(viewSessionModal.net_financial_variance || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-2">Product</th>
                    <th className="px-3 py-2 text-center">Before &rarr; Count</th>
                    <th className="px-3 py-2 text-center">Gap</th>
                    <th className="px-3 py-2 text-right">Cost Variance</th>
                    <th className="px-3 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {(viewSessionModal.adjustments || []).map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">
                        {adj.product_name}
                        <span className="text-[10px] text-slate-400 font-normal block font-mono">SKU: {adj.sku}</span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono">
                        {adj.system_stock_before} &rarr; {adj.physical_count} {adj.unit}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold">
                        <span className={adj.gap_quantity < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {adj.gap_quantity > 0 ? `+${adj.gap_quantity}` : adj.gap_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        <span className={adj.financial_variance_cost < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {currency} {(adj.financial_variance_cost || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] font-semibold text-slate-700">
                          {REASON_LABELS[adj.reason]?.label || adj.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  queuePrintJob(
                    'A4',
                    `Stock Audit #${viewSessionModal.session_no}`,
                    `Stock Reconciliation Report: ${viewSessionModal.title} | ${viewSessionModal.items_counted} Items Counted | Net Variance: ${currency} ${(viewSessionModal.net_financial_variance || 0).toLocaleString()}`
                  );
                  alert('Official Audit Sheet sent to Print Queue (A4 format).');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Audit Sheet (A4)</span>
              </button>
              <button
                onClick={() => setViewSessionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustmentManager;
