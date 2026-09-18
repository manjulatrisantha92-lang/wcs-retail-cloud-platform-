import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { InventoryValuationReport } from './reports/InventoryValuationReport';
import { UserSalesReport } from './reports/UserSalesReport';
import { SupplierBalanceReport } from './reports/SupplierBalanceReport';
import { ExpiryItemsReport } from './reports/ExpiryItemsReport';
import { LowStockReport } from './reports/LowStockReport';
import { ExpensesReport } from './reports/ExpensesReport';
import { SalesAndReturnsReport } from './reports/SalesAndReturnsReport';
import { CustomerBalanceReport } from './reports/CustomerBalanceReport';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Calendar,
  Layers,
  PieChart,
  Store,
  FileSpreadsheet,
  Wrench,
  Car,
  Package,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileText,
  X,
  Users,
  Truck,
  RotateCcw,
  Wallet,
  Grid,
} from 'lucide-react';

export type ReportTabType =
  | 'INVENTORY_VALUATION'
  | 'USER_SALES'
  | 'SUPPLIER_BALANCE'
  | 'EXPIRY_VALUATION'
  | 'LOW_STOCK'
  | 'EXPENSES_TOTAL'
  | 'SALES_RETURNS'
  | 'CUSTOMER_BALANCE'
  | 'FINANCIAL'
  | 'Z_REPORT'
  | 'SHOP_SPECIFIC';

export const ReportsManager: React.FC = () => {
  const {
    sales,
    saleReturns,
    products,
    categories,
    suppliers,
    purchases,
    purchaseReturns,
    customers,
    users,
    expenses,
    payouts,
    repairJobs,
    vehicleServiceJobs,
    currentTenant,
    currentSettings,
    currentUser,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<ReportTabType>('INVENTORY_VALUATION');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [isZReportPrintOpen, setIsZReportPrintOpen] = useState(false);

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const safeSales = sales || [];
  const safeSaleReturns = saleReturns || [];
  const safeProducts = products || [];
  const safeCategories = categories || [];
  const safeSuppliers = suppliers || [];
  const safePurchases = purchases || [];
  const safePurchaseReturns = purchaseReturns || [];
  const safeCustomers = customers || [];
  const safeUsers = users || [];
  const safeExpenses = expenses || [];
  const safePayouts = payouts || [];
  const safeRepairJobs = repairJobs || [];
  const safeVehicleServiceJobs = vehicleServiceJobs || [];

  const filteredSales = safeSales.filter((s) => {
    if (dateFilter === 'ALL') return true;
    const saleDate = new Date(s.created_at);
    const now = new Date();
    if (dateFilter === 'TODAY') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= oneWeekAgo;
    }
    if (dateFilter === 'MONTH') {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
  const totalDiscounts = filteredSales.reduce((acc, s) => acc + ((s as any).discount_total ?? (s as any).discount_amount ?? 0), 0);
  const totalTax = filteredSales.reduce((acc, s) => acc + ((s as any).tax_total ?? (s as any).tax_amount ?? 0), 0);
  const totalExpenses = safeExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalPayouts = safePayouts.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Profit calculation
  const totalCost = filteredSales.reduce((acc, s) => {
    const saleCost = (s.items || []).reduce(
      (iAcc, item) => iAcc + ((item.cost_price || 0) * (item.quantity || 0)),
      0
    );
    return acc + saleCost;
  }, 0);

  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;

  // Breakdown by payment method
  const paymentBreakdown = filteredSales.reduce((acc, s) => {
    const method = s.payment_method || 'CASH';
    acc[method] = (acc[method] || 0) + (s.grand_total || 0);
    return acc;
  }, {} as Record<string, number>);

  const cashSales = paymentBreakdown['CASH'] || 0;
  const cardSales = paymentBreakdown['CARD'] || 0;
  const creditSales = paymentBreakdown['CREDIT'] || 0;
  const qrSales = paymentBreakdown['QR_PAY'] || 0;

  // Export CSV for Financial summary
  const handleExportCsv = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Cashier', 'Payment Method', 'Items Count', 'Grand Total'];
    const rows = filteredSales.map((s) => [
      s.invoice_no,
      new Date(s.created_at).toLocaleDateString(),
      `"${s.customer_name || 'Walk-in'}"`,
      `"${s.cashier_name}"`,
      s.payment_method,
      (s.items || []).length,
      s.grand_total || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${currentTenant?.tenant_id || 'shop'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPhoneOrComputer = currentTenant?.business_type === 'phone_shop' || currentTenant?.business_type === 'computer_shop';
  const isVehicleService = currentTenant?.business_type === 'vehicle_service';
  const isHardware = currentTenant?.business_type === 'hardware' || currentTenant?.business_type === 'hardware_shop';

  const reportTabsConfig = [
    { id: 'INVENTORY_VALUATION', label: 'Inventory List by Value', icon: Package, badge: `${safeProducts.length} Items` },
    { id: 'USER_SALES', label: 'User Sales Report', icon: Users, badge: `${safeSales.length} Bills` },
    { id: 'SUPPLIER_BALANCE', label: 'Supplier Details & Balance', icon: Truck, badge: `${safeSuppliers.length} Suppliers` },
    { id: 'EXPIRY_VALUATION', label: 'Expired Items by Value', icon: Calendar, badge: 'Valuation' },
    { id: 'LOW_STOCK', label: 'Low Stock Report', icon: AlertTriangle, badge: 'Reorder' },
    { id: 'EXPENSES_TOTAL', label: 'Expenses List by Total', icon: Wallet, badge: 'Vouchers' },
    { id: 'SALES_RETURNS', label: 'Sales & Sales Return', icon: RotateCcw, badge: 'Refunds' },
    { id: 'CUSTOMER_BALANCE', label: 'Customer Details with Balance', icon: Users, badge: `${safeCustomers.length} Debtors` },
    { id: 'FINANCIAL', label: 'P&L Overview', icon: DollarSign, badge: 'Profit' },
    { id: 'Z_REPORT', label: 'Z-Report / Shift', icon: Receipt, badge: '80mm' },
    ...(isPhoneOrComputer || isVehicleService || isHardware
      ? [{ id: 'SHOP_SPECIFIC' as ReportTabType, label: 'Industry Operations', icon: Wrench, badge: 'Jobs' }]
      : []),
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Official Business Report Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 print:border-none print:shadow-none print:p-0">
        <div className="flex items-center gap-5">
          {currentTenant?.logo_url ? (
            <img
              src={currentTenant.logo_url}
              alt={currentTenant.shop_name}
              className="h-16 w-auto max-w-[160px] object-contain rounded-xl border border-slate-200 p-1 bg-slate-50 print:border-none"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Store className="w-7 h-7" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                Official Business Intelligence & Reports Center
              </span>
              <span className="text-slate-400 text-xs">
                Generated {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
              {currentTenant?.shop_name}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {currentTenant?.address} | Tel: {currentTenant?.phone}
            </p>
            {currentTenant?.br_number && (
              <p className="text-[10px] text-slate-500 font-mono">
                BR: {currentTenant.br_number} {currentTenant.vat_number ? `| VAT: ${currentTenant.vat_number}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => setIsZReportPrintOpen(true)}
            className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs border border-purple-200 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-purple-600" />
            <span>Daily Z-Report Slip</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Current View</span>
          </button>
        </div>
      </div>

      {/* Reports Directory Tab Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {reportTabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTabType)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive ? 'bg-indigo-500 text-indigo-50' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* REPORT 1: Inventory Valuation & Cost List */}
      {activeTab === 'INVENTORY_VALUATION' && (
        <InventoryValuationReport
          products={safeProducts}
          categories={safeCategories}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 2: User / Staff Sales */}
      {activeTab === 'USER_SALES' && (
        <UserSalesReport
          sales={safeSales}
          saleReturns={safeSaleReturns}
          users={safeUsers}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 3: Supplier Account Details & Balance */}
      {activeTab === 'SUPPLIER_BALANCE' && (
        <SupplierBalanceReport
          suppliers={safeSuppliers}
          purchases={safePurchases}
          purchaseReturns={safePurchaseReturns}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 4: Expire Item List by Value */}
      {activeTab === 'EXPIRY_VALUATION' && (
        <ExpiryItemsReport
          products={safeProducts}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 5: Low Stock Report & Reorder Audit */}
      {activeTab === 'LOW_STOCK' && (
        <LowStockReport
          products={safeProducts}
          categories={safeCategories}
          suppliers={safeSuppliers}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 6: Expenses List by Total */}
      {activeTab === 'EXPENSES_TOTAL' && (
        <ExpensesReport
          expenses={safeExpenses}
          payouts={safePayouts}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 7: Sales and Sales Return Audit */}
      {activeTab === 'SALES_RETURNS' && (
        <SalesAndReturnsReport
          sales={safeSales}
          saleReturns={safeSaleReturns}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* REPORT 8: Customer by Details with Balance */}
      {activeTab === 'CUSTOMER_BALANCE' && (
        <CustomerBalanceReport
          customers={safeCustomers}
          sales={safeSales}
          customerPayments={[]}
          tenant={currentTenant}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Financial & P&L Overview */}
      {activeTab === 'FINANCIAL' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Financial Performance & Margins
            </h3>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
              {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    dateFilter === d
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d === 'ALL' ? 'All Time' : d === 'TODAY' ? 'Today' : d === 'WEEK' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Gross Sales Turnover</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {currencySymbol} {(totalRevenue || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                {filteredSales.length} transactions completed
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Estimated Gross Margin</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {currencySymbol} {(grossProfit || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {totalRevenue > 0 ? (((grossProfit || 0) / totalRevenue) * 100).toFixed(1) : '0.0'}% markup margin
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Operating Expenses</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {currencySymbol} {(totalExpenses || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">{safeExpenses.length} expense vouchers</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-indigo-200 bg-indigo-50/20 shadow-xs">
              <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Net Operating Profit</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">
                {currencySymbol} {(netProfit || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
                Bottom line net yield
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Revenue by Tender Mode</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Cash Payments</span>
                    <span className="text-slate-900 font-mono">{currencySymbol} {(cashSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (cashSales / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Card POS (Visa/Mastercard)</span>
                    <span className="text-slate-900 font-mono">{currencySymbol} {(cardSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (cardSales / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Customer Credit</span>
                    <span className="text-slate-900 font-mono">{currencySymbol} {(creditSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (creditSales / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">LankaQR / PromptPay</span>
                    <span className="text-slate-900 font-mono">{currencySymbol} {(qrSales || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (qrSales / totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Audit Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>Recent Sales Register</span>
                </h3>
                <button
                  onClick={handleExportCsv}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Invoice</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Tender</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{s.invoice_no}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.customer_name || 'Walk-in'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                            {s.payment_method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Shift / Z-Report Tab */}
      {activeTab === 'Z_REPORT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Active Cashier Shift Summary</span>
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Terminal ID:</span>
                <span className="font-mono font-bold text-slate-800">POS-STATION-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier on Duty:</span>
                <span className="font-bold text-slate-800">{currentUser?.full_name || 'Admin User'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Started:</span>
                <span className="font-mono text-slate-700">Today, 08:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoices Billed:</span>
                <span className="font-bold text-indigo-600">{filteredSales.length} Bills</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="font-medium text-slate-600">Opening Cash Float:</span>
                <span className="font-mono font-bold text-slate-900">{currencySymbol} 10,000.00</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="font-medium text-slate-600">+ Total Cash Sales:</span>
                <span className="font-mono font-bold text-emerald-600">+{currencySymbol} {(cashSales || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-slate-100">
                <span className="font-medium text-slate-600">- Petty Cash Payouts:</span>
                <span className="font-mono font-bold text-rose-600">-{currencySymbol} {(totalPayouts || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold py-2 bg-indigo-50 px-3 rounded-xl text-indigo-950">
                <span>Calculated Closing Cash:</span>
                <span className="font-mono">{currencySymbol} {(10000 + (cashSales || 0) - (totalPayouts || 0)).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setIsZReportPrintOpen(true)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Preview & Print 80mm Z-Report Slip</span>
            </button>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Shift Closing Checklist
            </h3>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Count all physical bank notes and coins in the drawer.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Reconcile EDC card machine settlement batch with Card Total ({currencySymbol} {(cardSales || 0).toLocaleString()}).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Verify all {safePayouts.length} petty cash payout vouchers have manager signatures.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Print Z-Report slip and deposit envelope to the shop safe.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Industry Specific Operations Tab */}
      {activeTab === 'SHOP_SPECIFIC' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            {isPhoneOrComputer
              ? 'Device Repair Station Metrics'
              : isVehicleService
              ? 'Vehicle Service Station Throughput'
              : 'Category Performance Analysis'}
          </h3>

          {isPhoneOrComputer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Repair Tickets</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{safeRepairJobs.length} Jobs</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Ready for Pickup</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {safeRepairJobs.filter((j) => j.status === 'READY_FOR_PICKUP').length} Devices
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">In Diagnostics / Repair</span>
                <div className="text-2xl font-black text-amber-600 mt-1">
                  {safeRepairJobs.filter((j) => j.status === 'DIAGNOSING' || j.status === 'IN_PROGRESS').length} Devices
                </div>
              </div>
            </div>
          )}

          {isVehicleService && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Job Cards Serviced</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{safeVehicleServiceJobs.length} Vehicles</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Service Revenue</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {currencySymbol}{' '}
                  {safeVehicleServiceJobs
                    .reduce((acc, j) => acc + (j.total_cost ?? j.grand_total ?? 0), 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Active in Bay</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {safeVehicleServiceJobs.filter((j) => j.status === 'WASHING' || j.status === 'IN_BAY').length} Vehicles
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 80mm Z-Report Print Modal */}
      {isZReportPrintOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-800">80mm Daily Z-Report Slip Preview</h3>
              </div>
              <button
                onClick={() => setIsZReportPrintOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 flex justify-center max-h-[70vh] overflow-y-auto">
              <div className="w-[340px] bg-white p-5 shadow-md border border-slate-300 font-mono text-[11px] leading-relaxed text-slate-900 space-y-3">
                <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  <div className="font-black text-sm uppercase tracking-tight">{currentTenant?.shop_name}</div>
                  <div className="text-[9px] text-slate-500">{currentTenant?.address}</div>
                  <div className="font-bold text-purple-700 text-xs mt-1">*** DAILY Z-REPORT AUDIT ***</div>
                  <div className="text-[9px] text-slate-400">Generated: {new Date().toLocaleString()}</div>
                </div>

                <div className="space-y-1 text-slate-600 border-b border-dashed border-slate-300 pb-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold text-slate-900">{currentUser?.full_name || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminal:</span>
                    <span className="font-mono">POS-STATION-01</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Financial Summary:</div>
                  <div className="flex justify-between">
                    <span>Gross Sales:</span>
                    <span>{currencySymbol} {totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discounts:</span>
                    <span>-{currencySymbol} {totalDiscounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes / VAT:</span>
                    <span>{currencySymbol} {totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 pt-1 border-t border-slate-200">
                    <span>NET SALES:</span>
                    <span>{currencySymbol} {totalRevenue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Tender Breakdown:</div>
                  <div className="flex justify-between">
                    <span>Cash Collected:</span>
                    <span>{currencySymbol} {cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card (Visa/Master):</span>
                    <span>{currencySymbol} {cardSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LankaQR / Prompt:</span>
                    <span>{currencySymbol} {qrSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Credit:</span>
                    <span>{currencySymbol} {creditSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Cash Drawer Reconciliation:</div>
                  <div className="flex justify-between text-slate-600">
                    <span>Opening Float:</span>
                    <span>{currencySymbol} 10,000.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>+ Cash Sales:</span>
                    <span>{currencySymbol} {cashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>- Cash Payouts:</span>
                    <span>{currencySymbol} {totalPayouts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-950 pt-1 border-t border-slate-200">
                    <span>CLOSING CASH COUNT:</span>
                    <span>{currencySymbol} {(10000 + cashSales - totalPayouts).toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center pt-2 font-sans space-y-1 text-[9px] text-slate-400">
                  <div>Report Hash: {Date.now().toString(36).toUpperCase()}-ZREP</div>
                  <p>*** END OF Z-REPORT AUDIT ***</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50 print:hidden">
              <button
                onClick={() => setIsZReportPrintOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const zHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Z-Report - ${new Date().toLocaleDateString()}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 8px 10px; width: 340px; color: #000; font-size: 11px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
  </style>
</head>
<body>
  <div class="center">
    <h2 style="margin: 0; text-transform: uppercase;">${currentTenant?.shop_name}</h2>
    <div style="font-size: 10px;">${currentTenant?.address}</div>
    <div class="bold" style="margin-top: 4px;">*** DAILY Z-REPORT ***</div>
    <div style="font-size: 9px;">${new Date().toLocaleString()}</div>
  </div>
  <div class="divider"></div>
  <div class="row"><span>Cashier:</span><span>${currentUser?.full_name || 'Admin'}</span></div>
  <div class="row"><span>Terminal:</span><span>POS-STATION-01</span></div>
  <div class="divider"></div>
  <div class="bold">FINANCIAL TOTALS:</div>
  <div class="row"><span>Gross Sales:</span><span>${currencySymbol} ${totalRevenue.toFixed(2)}</span></div>
  <div class="row"><span>Discounts:</span><span>-${currencySymbol} ${totalDiscounts.toFixed(2)}</span></div>
  <div class="row"><span>Tax / VAT:</span><span>+${currencySymbol} ${totalTax.toFixed(2)}</span></div>
  <div class="row bold" style="font-size: 12px; border-top: 1px solid #000; padding-top: 2px;"><span>NET SALES:</span><span>${currencySymbol} ${totalRevenue.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="bold">TENDER BREAKDOWN:</div>
  <div class="row"><span>Cash:</span><span>${currencySymbol} ${cashSales.toFixed(2)}</span></div>
  <div class="row"><span>Card:</span><span>${currencySymbol} ${cardSales.toFixed(2)}</span></div>
  <div class="row"><span>QR Pay:</span><span>${currencySymbol} ${qrSales.toFixed(2)}</span></div>
  <div class="row"><span>Credit:</span><span>${currencySymbol} ${creditSales.toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="bold">DRAWER RECONCILIATION:</div>
  <div class="row"><span>Opening Float:</span><span>${currencySymbol} 10,000.00</span></div>
  <div class="row"><span>+ Cash Sales:</span><span>${currencySymbol} ${cashSales.toFixed(2)}</span></div>
  <div class="row"><span>- Payouts:</span><span>${currencySymbol} ${totalPayouts.toFixed(2)}</span></div>
  <div class="row bold" style="border-top: 1px solid #000; padding-top: 2px;"><span>DRAWER TOTAL:</span><span>${currencySymbol} ${(10000 + cashSales - totalPayouts).toFixed(2)}</span></div>
  <div class="divider"></div>
  <div class="center" style="font-size: 9px; margin-top: 8px;">
    <div>*** END OF Z-REPORT AUDIT ***</div>
  </div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 200); };</script>
</body>
</html>`;
                  const blob = new Blob([zHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5"
              >
                <span>Open Tab</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Z-Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
