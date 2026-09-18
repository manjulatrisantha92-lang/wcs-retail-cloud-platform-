import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Sale, SaleReturn, Product, CartItem } from '../../types';
import { PrintReceiptModal } from '../common/PrintReceiptModal';
import { sendReceiptViaWhatsApp } from '../../utils/whatsappReceipt';
import {
  Receipt,
  RotateCcw,
  Printer,
  Search,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  User,
  DollarSign,
  Package,
  X,
  FileText,
  Filter,
  Check,
  ShoppingBag,
  Share2,
} from 'lucide-react';

interface SalesManagerProps {
  onOpenPos?: () => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({ onOpenPos }) => {
  const {
    sales,
    saleReturns,
    products,
    customers,
    currentTenant,
    currentSettings,
    currentUser,
    processSaleReturn,
  } = useRetail();

  // Active Tab: INVOICES, RETURNS_LOG
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'RETURNS_LOG'>('INVOICES');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reprint Bill State
  const [selectedSaleForReprint, setSelectedSaleForReprint] = useState<Sale | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Return / Change Item Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [quickReturnInvoiceInput, setQuickReturnInvoiceInput] = useState('');
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<
    {
      product_id: string;
      name: string;
      unit_price: number;
      sold_quantity: number;
      return_quantity: number;
    }[]
  >([]);
  const [returnMode, setReturnMode] = useState<'REFUND' | 'EXCHANGE'>('REFUND');
  const [refundType, setRefundType] = useState<'CASH' | 'CREDIT_NOTE' | 'BANK_TRANSFER' | 'EXCHANGE_ITEM'>('CASH');
  const [returnReason, setReturnReason] = useState('Customer requested exchange / return');

  // Exchange Product Selection
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<Product | null>(null);
  const [exchangeQuantity, setExchangeQuantity] = useState<number>(1);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Return Receipt Modal Preview
  const [completedReturnVoucher, setCompletedReturnVoucher] = useState<SaleReturn | null>(null);
  const [isReturnVoucherModalOpen, setIsReturnVoucherModalOpen] = useState(false);

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const safeSales = sales || [];
  const safeSaleReturns = saleReturns || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];

  // Metrics Calculations
  const totalSalesRevenue = safeSales.reduce((acc, s) => acc + (s && s.grand_total || 0), 0);
  const totalRefundsGiven = safeSaleReturns.reduce((acc, r) => acc + (r && r.total_refund_amount || 0), 0);
  const netSalesRevenue = totalSalesRevenue - totalRefundsGiven;

  // Filtered Sales
  const filteredSales = safeSales.filter((s) => {
    if (!s) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (s.invoice_no || '').toLowerCase().includes(q) ||
      (s.customer_name || '').toLowerCase().includes(q) ||
      (s.cashier_name || '').toLowerCase().includes(q) ||
      (s.sales_associate_name || '').toLowerCase().includes(q) ||
      (s.sales_associate_code || '').toLowerCase().includes(q);

    const matchesPayment = paymentFilter === 'ALL' || s.payment_method === paymentFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && (!s.status || s.status === 'COMPLETED')) ||
      s.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Filtered Returns Log
  const filteredReturns = safeSaleReturns.filter((r) => {
    if (!r) return false;
    const q = (searchQuery || '').toLowerCase();
    return (
      (r.return_no || '').toLowerCase().includes(q) ||
      (r.original_invoice_no || '').toLowerCase().includes(q) ||
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.processed_by || '').toLowerCase().includes(q)
    );
  });

  // Trigger Reprint
  const handleOpenReprint = (sale: Sale) => {
    setSelectedSaleForReprint(sale);
    setIsReprintModalOpen(true);
  };

  // Open Return / Exchange Modal
  const handleOpenReturnModal = (sale: Sale) => {
    setSelectedSaleForReturn(sale);
    setReturnItemsState(
      (sale.items || []).map((item) => ({
        product_id: item.product_id,
        name: (item as any).product_name || item.name || 'Item',
        unit_price: item.unit_price || 0,
        sold_quantity: item.quantity || 1,
        return_quantity: 0,
      }))
    );
    setReturnMode('REFUND');
    setRefundType('CASH');
    setSelectedExchangeProduct(null);
    setExchangeQuantity(1);
    setReturnReason('Customer requested item exchange / return');
    setIsReturnModalOpen(true);
  };

  const handleQuickFindAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickReturnInvoiceInput.trim().toUpperCase();
    if (!query) return;

    const matched = safeSales.find(
      (s) => s && (s.invoice_no?.toUpperCase() === query || s.invoice_no?.toUpperCase().includes(query))
    );

    if (matched) {
      handleOpenReturnModal(matched);
      setQuickReturnInvoiceInput('');
    } else {
      alert(`No sales invoice found matching "${query}". Please check the invoice number.`);
    }
  };

  // Calculate Total Return Amount for selected items
  const totalReturnRefundValue = returnItemsState.reduce(
    (acc, item) => acc + item.return_quantity * item.unit_price,
    0
  );

  // Exchange Product Price Total
  const exchangeProductTotal = selectedExchangeProduct
    ? (selectedExchangeProduct.selling_price || 0) * exchangeQuantity
    : 0;

  // Price difference: If positive, customer pays difference; If negative, store refunds difference
  const exchangePriceDifference = exchangeProductTotal - totalReturnRefundValue;

  // Submit Return / Exchange
  const handleProcessReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForReturn) return;

    const itemsToReturn = returnItemsState
      .filter((i) => i.return_quantity > 0)
      .map((i) => ({
        product_id: i.product_id,
        name: i.name,
        unit_price: i.unit_price,
        return_quantity: i.return_quantity,
        refund_amount: i.return_quantity * i.unit_price,
      }));

    if (itemsToReturn.length === 0) {
      alert('Please specify a return quantity of at least 1 item to return.');
      return;
    }

    if (returnMode === 'EXCHANGE' && !selectedExchangeProduct) {
      alert('Please select a replacement product from the catalog for the exchange.');
      return;
    }

    const exchangeItemsData =
      returnMode === 'EXCHANGE' && selectedExchangeProduct
        ? [
            {
              product_id: selectedExchangeProduct.id,
              name: selectedExchangeProduct.name,
              unit_price: selectedExchangeProduct.selling_price,
              quantity: exchangeQuantity,
              total: exchangeProductTotal,
            },
          ]
        : undefined;

    const finalRefundAmount =
      returnMode === 'EXCHANGE'
        ? Math.max(0, -exchangePriceDifference)
        : totalReturnRefundValue;

    const newReturnRecord = processSaleReturn({
      original_invoice_no: selectedSaleForReturn.invoice_no,
      customer_id: selectedSaleForReturn.customer_id,
      customer_name: selectedSaleForReturn.customer_name,
      items: itemsToReturn,
      exchange_items: exchangeItemsData,
      price_difference: returnMode === 'EXCHANGE' ? exchangePriceDifference : 0,
      total_refund_amount: finalRefundAmount,
      refund_type: returnMode === 'EXCHANGE' ? 'EXCHANGE_ITEM' : refundType,
      reason: returnReason,
    });

    setIsReturnModalOpen(false);
    setSuccessMessage(
      `Return & ${returnMode === 'EXCHANGE' ? 'Item Exchange' : 'Refund'} processed successfully! Return Note #${(newReturnRecord as any)?.return_no || 'RTN'}`
    );
    setTimeout(() => setSuccessMessage(null), 5000);

    // Open Return Voucher
    setCompletedReturnVoucher(newReturnRecord as any);
    setIsReturnVoucherModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Sales Management & Terminal
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Sales Invoices, Returns, Item Exchange & Bill Reprint
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Search invoices, reprint thermal/A4 bills, process customer returns, exchange products with automated inventory restock and refund tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPos && (
            <button
              onClick={onOpenPos}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Open POS Billing</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales Turnover</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {currencySymbol} {(totalSalesRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {sales.length} completed transactions
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Returns & Refunds</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {currencySymbol} {(totalRefundsGiven || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {saleReturns.length} return notes issued
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Net Realized Sales</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {currencySymbol} {(netSalesRevenue || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
            After deducting returns and refunds
          </span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'INVOICES'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Sales Invoices & Bill Reprint ({sales.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RETURNS_LOG')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
              activeTab === 'RETURNS_LOG'
                ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-xs -mb-[1px]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns & Item Exchange History ({saleReturns.length})</span>
          </button>
        </div>

        {/* Toolbar (Search & Filter + Quick Return Finder) */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'INVOICES'
                    ? 'Search by Invoice #, Customer name, Cashier...'
                    : 'Search by Return #, Original Invoice #, Cashier...'
                }
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Quick Find & Process Return by Invoice # */}
            <form onSubmit={handleQuickFindAndReturn} className="flex items-center gap-1.5">
              <input
                type="text"
                value={quickReturnInvoiceInput}
                onChange={(e) => setQuickReturnInvoiceInput(e.target.value)}
                placeholder="Return Invoice # e.g. INV-..."
                className="w-48 px-3 py-2 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-rose-950 font-mono placeholder:text-rose-400 focus:outline-hidden focus:border-rose-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Find & Return</span>
              </button>
            </form>
          </div>

          {activeTab === 'INVOICES' && (
            <div className="flex items-center gap-2">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold"
              >
                <option value="ALL">All Payment Channels</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CREDIT">Credit</option>
                <option value="QR_PAY">QR Pay</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold"
              >
                <option value="ALL">All Invoice Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PARTIALLY_RETURNED">Partially Returned</option>
                <option value="RETURNED">Fully Returned</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Sales Invoices List */}
        {activeTab === 'INVOICES' && (
          <div className="overflow-x-auto">
            {filteredSales.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="font-semibold text-sm text-slate-600">No Sales Invoices Found</p>
                <p className="text-xs">Adjust your search filters or start a new sale from the POS.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                    <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Cashier / Associate</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => {
                    const isReturned = sale.status === 'RETURNED';
                    const isPartial = sale.status === 'PARTIALLY_RETURNED';

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                          {sale.invoice_no}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(sale.created_at).toLocaleDateString()} {' '}
                          <span className="text-[10px]">
                            {new Date(sale.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {sale.customer_name || 'Walk-in Customer'}
                          </div>
                          {sale.customer_phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {sale.customer_phone}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 font-medium">{sale.cashier_name}</div>
                          {sale.sales_associate_name ? (
                            <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              <span className="font-mono text-[9px] bg-amber-200/70 text-amber-900 px-1 rounded">{sale.sales_associate_code}</span>
                              <span className="truncate max-w-[90px]">{sale.sales_associate_name}</span>
                              {sale.commission_amount ? (
                                <span className="text-amber-700 font-mono text-[9px]">({currencySymbol}{sale.commission_amount.toFixed(0)})</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Direct</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                            {(sale.items || []).length} items
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sale.payment_method === 'CASH'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sale.payment_method === 'CARD'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : sale.payment_method === 'CREDIT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {sale.payment_method}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {currencySymbol} {(sale.grand_total || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isReturned ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-200">
                              Returned
                            </span>
                          ) : isPartial ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold border border-amber-200">
                              Partial Return
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Share Bill */}
                            <button
                              onClick={() => {
                                if (currentTenant) {
                                  sendReceiptViaWhatsApp(sale, sale.customer_phone || '', currentTenant, 'en');
                                }
                              }}
                              title="Share Bill via WhatsApp"
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-emerald-200 transition-all"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            {/* Bill Reprint Button */}
                            <button
                              onClick={() => handleOpenReprint(sale)}
                              title="Reprint Bill / Invoice"
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Reprint</span>
                            </button>

                            {/* Return / Change Item Button */}
                            {!isReturned && (
                              <button
                                onClick={() => handleOpenReturnModal(sale)}
                                title="Process Item Return or Exchange"
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-rose-200 transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Return / Change</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Returns & Item Exchange Log */}
        {activeTab === 'RETURNS_LOG' && (
          <div className="overflow-x-auto">
            {filteredReturns.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <RotateCcw className="w-12 h-12 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="font-semibold text-sm text-slate-600">No Return Records Yet</p>
                <p className="text-xs">
                  Processed customer returns and item exchanges will appear here with full audit history.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Return #</th>
                    <th className="py-3 px-4">Orig. Invoice #</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items Returned</th>
                    <th className="py-3 px-4">Exchange / Type</th>
                    <th className="py-3 px-4">Processed By</th>
                    <th className="py-3 px-4 text-right">Refund / Diff</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{ret.return_no}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {ret.original_invoice_no}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(ret.created_at).toLocaleDateString()} {' '}
                        <span className="text-[10px]">
                          {new Date(ret.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {ret.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {(ret.items || []).map((item, idx) => (
                            <div key={idx} className="text-[11px] text-slate-800">
                              • {item.name} <strong className="text-rose-600">x{item.return_quantity}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {ret.refund_type === 'EXCHANGE_ITEM' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded text-[10px] border border-purple-200">
                              Item Exchange
                            </span>
                            {(ret.exchange_items || []).map((ei, idx) => (
                              <div key={idx} className="text-[10px] text-purple-900 font-semibold">
                                + {ei.name} x{ei.quantity}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                            {ret.refund_type}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ret.processed_by}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {currencySymbol} {(ret.total_refund_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setCompletedReturnVoucher(ret);
                            setIsReturnVoucherModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all ml-auto"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Voucher</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Return & Change Item Modal */}
      {isReturnModalOpen && selectedSaleForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                  Process Sales Return & Item Exchange
                </h2>
                <p className="text-xs text-slate-500">
                  Original Invoice #{selectedSaleForReturn.invoice_no} • {selectedSaleForReturn.customer_name || 'Walk-in'}
                </p>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessReturnSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Return Action Choice */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setReturnMode('REFUND')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    returnMode === 'REFUND'
                      ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs">1. Direct Cash / Credit Refund</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Restock returned item and refund money to customer.
                  </p>
                </div>

                <div
                  onClick={() => setReturnMode('EXCHANGE')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    returnMode === 'EXCHANGE'
                      ? 'border-purple-600 bg-purple-50/60 font-bold text-purple-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">2. Change Item / Exchange</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Swap for replacement item; calculate price difference.
                  </p>
                </div>
              </div>

              {/* Items to Return Table */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">
                  Select Items & Return Quantities:
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500 text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-right">Sold Price</th>
                        <th className="py-2.5 px-3 text-center">Sold Qty</th>
                        <th className="py-2.5 px-3 text-center">Return Qty</th>
                        <th className="py-2.5 px-3 text-right">Refund Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnItemsState.map((item, idx) => (
                        <tr key={`${item.product_id}-${idx}`} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{item.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {currencySymbol} {item.unit_price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.sold_quantity}</td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.sold_quantity}
                              step="any"
                              value={item.return_quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const clamped = Math.min(item.sold_quantity, Math.max(0, val));
                                setReturnItemsState((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, return_quantity: clamped } : it))
                                );
                              }}
                              className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                            {currencySymbol} {(item.return_quantity * item.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end text-xs font-bold text-slate-800 pt-1">
                  <span>Total Value of Returned Goods: <strong className="text-rose-600 font-mono">{currencySymbol} {totalReturnRefundValue.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* If Exchange Mode: Choose replacement product */}
              {returnMode === 'EXCHANGE' && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3">
                  <h3 className="font-bold text-purple-900 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                    Select Replacement Product from Store:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-semibold mb-1">
                        Choose Replacement Item:
                      </label>
                      <select
                        value={selectedExchangeProduct?.id || ''}
                        onChange={(e) => {
                          const matched = products.find((p) => p.id === e.target.value);
                          setSelectedExchangeProduct(matched || null);
                        }}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                      >
                        <option value="">-- Choose Replacement Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({currencySymbol} {p.selling_price} | Stock: {p.stock_quantity} {p.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Exchange Qty:
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={exchangeQuantity}
                        onChange={(e) => setExchangeQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  {selectedExchangeProduct && (
                    <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>New Product Value:</span>
                        <span className="font-mono">{currencySymbol} {exchangeProductTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-100">
                        <span>Net Difference:</span>
                        {exchangePriceDifference > 0 ? (
                          <span className="text-amber-700 font-mono">
                            Customer Pays Extra: +{currencySymbol} {exchangePriceDifference.toFixed(2)}
                          </span>
                        ) : exchangePriceDifference < 0 ? (
                          <span className="text-emerald-700 font-mono">
                            Refund to Customer: {currencySymbol} {Math.abs(exchangePriceDifference).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-indigo-700 font-mono">Even Exchange (0.00)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Refund Method Selection if in Refund mode */}
              {returnMode === 'REFUND' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['CASH', 'CREDIT_NOTE', 'BANK_TRANSFER'] as const).map((method) => (
                    <div
                      key={method}
                      onClick={() => setRefundType(method)}
                      className={`p-3 rounded-xl border cursor-pointer text-center font-bold ${
                        refundType === method
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{method.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason for Return / Exchange:
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Size exchange, customer change of mind, defective"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Return & Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Voucher Modal */}
      {isReturnVoucherModalOpen && completedReturnVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Sales Return / Exchange Voucher
              </h2>
              <button
                onClick={() => setIsReturnVoucherModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h1 className="font-bold text-base uppercase text-slate-950">
                  {currentTenant?.shop_name}
                </h1>
                <p className="text-[10px] text-slate-500 font-sans">{currentTenant?.address}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-rose-50 text-rose-800 font-bold rounded-full border border-rose-200 uppercase text-[10px]">
                  OFFICIAL RETURN & EXCHANGE NOTE
                </div>
              </div>

              <div className="space-y-1 text-slate-700 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Voucher #:</span>
                  <strong className="text-slate-900">{completedReturnVoucher.return_no}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Invoice #:</span>
                  <span>{completedReturnVoucher.original_invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{new Date(completedReturnVoucher.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span>{completedReturnVoucher.customer_name || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Processed By:</span>
                  <span>{completedReturnVoucher.processed_by}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <span className="font-bold text-[11px] text-slate-800 block">Returned Items (Restocked):</span>
                {(completedReturnVoucher.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{item.name} (x{item.return_quantity})</span>
                    <span className="font-bold">{currencySymbol} {(item.refund_amount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Exchange Items if any */}
              {completedReturnVoucher.exchange_items && completedReturnVoucher.exchange_items.length > 0 && (
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                  <span className="font-bold text-[11px] text-purple-900 block">Exchange Items Given:</span>
                  {completedReturnVoucher.exchange_items.map((ei, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-purple-900">
                      <span>{ei.name} (x{ei.quantity})</span>
                      <span className="font-bold">{currencySymbol} {(ei.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 text-slate-800 pt-1">
                <div className="flex justify-between font-bold text-sm text-slate-950">
                  <span>Refund Disbursed ({completedReturnVoucher.refund_type}):</span>
                  <span>{currencySymbol} {(completedReturnVoucher.total_refund_amount || 0).toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-sans pt-1">
                  Reason: {completedReturnVoucher.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setIsReturnVoucherModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Return Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Reprint Modal */}
      {selectedSaleForReprint && (
        <PrintReceiptModal
          sale={selectedSaleForReprint}
          tenant={currentTenant}
          settings={currentSettings}
          isOpen={isReprintModalOpen}
          onClose={() => {
            setIsReprintModalOpen(false);
            setSelectedSaleForReprint(null);
          }}
        />
      )}
    </div>
  );
};
