import React, { useState } from 'react';
import { Sale, SaleReturn, UserAccount, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  Users,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  CheckCircle2,
  Percent,
} from 'lucide-react';

interface UserSalesReportProps {
  sales: Sale[];
  saleReturns: SaleReturn[];
  users: UserAccount[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const UserSalesReport: React.FC<UserSalesReportProps> = ({
  sales,
  saleReturns,
  users,
  tenant,
  currencySymbol,
}) => {
  const safeSales = sales || [];
  const safeSaleReturns = saleReturns || [];
  const safeUsers = users || [];

  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedCashier, setSelectedCashier] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingUserInvoices, setViewingUserInvoices] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter sales by date
  const filteredSales = safeSales.filter((s) => {
    if (!s) return false;
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

  // Unique list of cashiers from sales + users list
  const cashierNames = Array.from(
    new Set([
      ...safeSales.map((s) => s && s.cashier_name).filter(Boolean),
      ...safeUsers.map((u) => u && (u.name || (u as any).full_name)).filter(Boolean),
    ])
  );

  // Group metrics by user/cashier
  const userMetrics = cashierNames.map((cashierName) => {
    const userSales = filteredSales.filter(
      (s) => (s.cashier_name || '').toLowerCase() === cashierName.toLowerCase()
    );
    const userReturns = safeSaleReturns.filter(
      (r) => r && (r.processed_by || '').toLowerCase() === cashierName.toLowerCase()
    );

    const invoicesCount = userSales.length;
    const grossSales = userSales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
    const discountsGiven = userSales.reduce(
      (acc, s) => acc + ((s as any).discount_total ?? s.discount_amount ?? 0),
      0
    );
    const taxCollected = userSales.reduce(
      (acc, s) => acc + ((s as any).tax_total ?? s.tax_amount ?? 0),
      0
    );
    const returnsAmount = userReturns.reduce((acc, r) => acc + (r.total_refund_amount || 0), 0);
    const netSales = grossSales - returnsAmount;

    // Payment breakdowns
    const cashCollected = userSales
      .filter((s) => s.payment_method === 'CASH')
      .reduce((acc, s) => acc + (s.grand_total || 0), 0);
    const cardCollected = userSales
      .filter((s) => s.payment_method === 'CARD')
      .reduce((acc, s) => acc + (s.grand_total || 0), 0);
    const otherCollected = grossSales - cashCollected - cardCollected;

    const avgBillValue = invoicesCount > 0 ? grossSales / invoicesCount : 0;

    return {
      cashierName,
      invoicesCount,
      grossSales,
      discountsGiven,
      taxCollected,
      returnsAmount,
      netSales,
      cashCollected,
      cardCollected,
      otherCollected,
      avgBillValue,
      userSales,
    };
  });

  // Filtered cashier list
  const filteredMetrics = userMetrics.filter((m) => {
    const matchesCashier = selectedCashier === 'ALL' || m.cashierName === selectedCashier;
    const matchesSearch =
      searchTerm === '' || m.cashierName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCashier && matchesSearch;
  });

  // Grand totals
  const totalInvoices = filteredMetrics.reduce((acc, m) => acc + m.invoicesCount, 0);
  const totalGrossSales = filteredMetrics.reduce((acc, m) => acc + m.grossSales, 0);
  const totalDiscounts = filteredMetrics.reduce((acc, m) => acc + m.discountsGiven, 0);
  const totalReturns = filteredMetrics.reduce((acc, m) => acc + m.returnsAmount, 0);
  const totalNetSales = filteredMetrics.reduce((acc, m) => acc + m.netSales, 0);
  const topPerformer = [...filteredMetrics].sort((a, b) => b.grossSales - a.grossSales)[0];

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Cashier / User',
      'Invoices Count',
      'Gross Sales (Rs.)',
      'Discounts Granted (Rs.)',
      'Returns Deducted (Rs.)',
      'Net Realized Sales (Rs.)',
      'Cash Collected (Rs.)',
      'Card Collected (Rs.)',
      'Avg Ticket Size (Rs.)',
    ];

    const rows = filteredMetrics.map((m) => [
      `"${m.cashierName}"`,
      m.invoicesCount,
      m.grossSales,
      m.discountsGiven,
      m.returnsAmount,
      m.netSales,
      m.cashCollected,
      m.cardCollected,
      m.avgBillValue.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `User_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print A4
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total User Turnover</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalGrossSales.toLocaleString()}
          </div>
          <span className="text-xs text-indigo-600 font-semibold mt-1 block">
            Across {totalInvoices} processed invoices
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Discounts Granted</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {currencySymbol} {totalDiscounts.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Staff promotion & manual discounts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Top Sales Performer</span>
          <div className="text-xl font-black text-indigo-700 mt-1 truncate">
            {topPerformer ? topPerformer.cashierName : 'N/A'}
          </div>
          <span className="text-xs text-slate-600 mt-1 block font-medium">
            {topPerformer ? `${currencySymbol} ${topPerformer.grossSales.toLocaleString()} (${topPerformer.invoicesCount} bills)` : '-'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Net Sales Realized</span>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {currencySymbol} {totalNetSales.toLocaleString()}
          </div>
          <span className="text-xs text-rose-600 font-medium mt-1 block">
            After -{currencySymbol} {totalReturns.toLocaleString()} refunds
          </span>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cashier name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === d
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d === 'ALL' ? 'All Time' : d === 'TODAY' ? 'Today' : d === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <select
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Cashiers ({cashierNames.length})</option>
            {cashierNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
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

      {/* Cashier Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Cashier & Staff Sales Ledger ({filteredMetrics.length} Users)</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Click on any user to view invoice drilldown
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Cashier Name</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-4 text-right">Discounts Given</th>
                <th className="py-3 px-4 text-right">Returns</th>
                <th className="py-3 px-4 text-right">Net Sales</th>
                <th className="py-3 px-4 text-right">Cash Received</th>
                <th className="py-3 px-4 text-right">Card / Digital</th>
                <th className="py-3 px-4 text-right">Avg Bill</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No sales data found for the selected cashier criteria.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m) => (
                  <tr key={m.cashierName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {m.cashierName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{m.cashierName}</div>
                          <span className="text-[10px] text-slate-400">Cashier Terminal</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2.5 py-0.5 bg-slate-100 rounded-full font-bold text-slate-800 text-xs">
                        {m.invoicesCount} bills
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {currencySymbol} {m.grossSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                      -{currencySymbol} {m.discountsGiven.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold">
                      {m.returnsAmount > 0 ? `-${currencySymbol} ${m.returnsAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 bg-indigo-50/30">
                      {currencySymbol} {m.netSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      {currencySymbol} {m.cashCollected.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-700 font-medium">
                      {currencySymbol} {(m.cardCollected + m.otherCollected).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 font-medium">
                      {currencySymbol} {Math.round(m.avgBillValue).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          setViewingUserInvoices(
                            viewingUserInvoices === m.cashierName ? null : m.cashierName
                          )
                        }
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                      >
                        {viewingUserInvoices === m.cashierName ? 'Hide Bills' : 'View Bills'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredMetrics.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-4 uppercase text-[10px] text-slate-600">Grand Total</td>
                  <td className="py-3 px-4 text-center font-mono">{totalInvoices} bills</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-950">
                    {currencySymbol} {totalGrossSales.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    -{currencySymbol} {totalDiscounts.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700">
                    -{currencySymbol} {totalReturns.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-900">
                    {currencySymbol} {totalNetSales.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {currencySymbol} {filteredMetrics.reduce((a, b) => a + b.cashCollected, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {currencySymbol} {filteredMetrics.reduce((a, b) => a + b.cardCollected + b.otherCollected, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {currencySymbol} {totalInvoices > 0 ? Math.round(totalGrossSales / totalInvoices).toLocaleString() : '0'}
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Invoice Drilldown Modal / Section */}
      {viewingUserInvoices && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Invoices Generated by {viewingUserInvoices}
              </h3>
            </div>
            <button
              onClick={() => setViewingUserInvoices(null)}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold px-2 py-1 bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date / Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items Count</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales
                  .filter((s) => (s.cashier_name || '').toLowerCase() === viewingUserInvoices.toLowerCase())
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{s.invoice_no}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">{s.customer_name || 'Walk-in'}</td>
                      <td className="py-2.5 px-3 font-mono">{(s.items || []).length} items</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                        {currencySymbol} {(s.discount_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950">
                        {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A4 Report Print Step Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Staff & Cashier Sales Performance Audit"
        reportSubtitle={`Date Period: ${dateFilter === 'ALL' ? 'All Time' : dateFilter} (${filteredMetrics.length} Cashiers Audited)`}
        reportCategory="STAFF PERFORMANCE & REVENUE AUDIT"
        dateRangeText={dateFilter === 'ALL' ? 'All Historic Dates' : dateFilter}
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Total Invoices', value: `${totalInvoices} Bills` },
          { label: 'Total Gross Turnover', value: `${currencySymbol} ${totalGrossSales.toLocaleString()}` },
          { label: 'Total Discounts Given', value: `${currencySymbol} ${totalDiscounts.toLocaleString()}` },
          { label: 'Net Realized Revenue', value: `${currencySymbol} ${totalNetSales.toLocaleString()}` },
        ]}
        headers={[
          'Cashier / Staff Name',
          'Invoices',
          'Gross Sales',
          'Discounts',
          'Returns',
          'Net Sales',
          'Cash In-Hand',
          'Card / Non-Cash',
          'Avg Bill Value',
        ]}
        rows={filteredMetrics.map((m) => [
          m.cashierName,
          m.invoicesCount,
          `${currencySymbol} ${m.grossSales.toLocaleString()}`,
          `-${currencySymbol} ${m.discountsGiven.toLocaleString()}`,
          `-${currencySymbol} ${m.returnsAmount.toLocaleString()}`,
          `${currencySymbol} ${m.netSales.toLocaleString()}`,
          `${currencySymbol} ${m.cashCollected.toLocaleString()}`,
          `${currencySymbol} ${(m.cardCollected + m.otherCollected).toLocaleString()}`,
          `${currencySymbol} ${Math.round(m.avgBillValue).toLocaleString()}`,
        ])}
        summaryRows={[
          { label: 'Grand Total Gross Sales', value: `${currencySymbol} ${totalGrossSales.toLocaleString()}`, isBold: true },
          { label: 'Total Discounts Granted to Customers', value: `-${currencySymbol} ${totalDiscounts.toLocaleString()}` },
          { label: 'Total Returns / Refunds Deducted', value: `-${currencySymbol} ${totalReturns.toLocaleString()}` },
          { label: 'Grand Total Net Realized Cashier Sales', value: `${currencySymbol} ${totalNetSales.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="User_Sales_Performance_Report"
      />
    </div>
  );
};
