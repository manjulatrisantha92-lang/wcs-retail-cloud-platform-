import React, { useState } from 'react';
import { Expense, Payout, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  DollarSign,
  Download,
  Printer,
  Search,
  Calendar,
  PieChart,
  Tag,
  Wallet,
  ArrowUpDown,
  CreditCard,
} from 'lucide-react';

interface ExpensesReportProps {
  expenses: Expense[];
  payouts: Payout[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const ExpensesReport: React.FC<ExpensesReportProps> = ({
  expenses,
  payouts,
  tenant,
  currencySymbol,
}) => {
  const safeExpenses = expenses || [];
  const safePayouts = payouts || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'AMOUNT_DESC' | 'CATEGORY_ASC'>('DATE_DESC');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Unified list of expense transactions (Expense items + petty cash Payouts)
  const allVouchers = [
    ...safeExpenses.map((e) => ({
      id: e.id,
      date: e.date || new Date().toISOString(),
      category: e.category,
      description: e.description,
      amount: e.amount || 0,
      paymentMethod: e.payment_method || 'CASH',
      recordedBy: e.recorded_by || 'Admin',
      ref: e.receipt_ref || '-',
      type: 'EXPENSE_VOUCHER' as const,
    })),
    ...safePayouts.map((p) => ({
      id: p.id,
      date: p.created_at || new Date().toISOString(),
      category: (p.category || '').replace(/_/g, ' '),
      description: `Payee: ${p.payee_name || 'N/A'}${p.notes ? ` - ${p.notes}` : ''}`,
      amount: p.amount || 0,
      paymentMethod: p.payment_method || 'CASH',
      recordedBy: p.authorized_by || 'Cashier',
      ref: p.payout_no || p.reference_no || '-',
      type: 'DRAWER_PAYOUT' as const,
    })),
  ];

  // Date Filtering
  const dateFilteredVouchers = allVouchers.filter((v) => {
    if (dateFilter === 'ALL') return true;
    const vDate = new Date(v.date);
    const now = new Date();
    if (dateFilter === 'TODAY') {
      return vDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return vDate >= oneWeekAgo;
    }
    if (dateFilter === 'MONTH') {
      return vDate.getMonth() === now.getMonth() && vDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Category & Payment method filter
  const categoriesList = Array.from(new Set(allVouchers.map((v) => v.category))).sort();

  const filteredVouchers = dateFilteredVouchers.filter((v) => {
    const matchesSearch =
      searchTerm === '' ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.recordedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || v.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesPayment =
      paymentMethodFilter === 'ALL' || v.paymentMethod.toUpperCase() === paymentMethodFilter.toUpperCase();

    return matchesSearch && matchesCategory && matchesPayment;
  });

  // Sort
  const sortedVouchers = [...filteredVouchers].sort((a, b) => {
    if (sortBy === 'DATE_DESC') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'AMOUNT_DESC') return b.amount - a.amount;
    if (sortBy === 'CATEGORY_ASC') return a.category.localeCompare(b.category);
    return 0;
  });

  // KPI Calculations
  const grandTotalExpenses = sortedVouchers.reduce((acc, v) => acc + v.amount, 0);
  const totalCashExpenses = sortedVouchers
    .filter((v) => v.paymentMethod === 'CASH')
    .reduce((acc, v) => acc + v.amount, 0);
  const totalBankOrDigital = grandTotalExpenses - totalCashExpenses;

  // Category Breakdown
  const categoryTotals = dateFilteredVouchers.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + v.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories: [string, number][] = (Object.entries(categoryTotals) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  const topExpenseCategory = sortedCategories[0];

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Voucher / Ref',
      'Date',
      'Category',
      'Description / Payee',
      'Payment Method',
      'Recorded By',
      'Amount (Rs.)',
      'Type',
    ];

    const rows = sortedVouchers.map((v) => [
      `"${v.ref}"`,
      new Date(v.date).toLocaleDateString(),
      `"${v.category}"`,
      `"${v.description.replace(/"/g, '""')}"`,
      v.paymentMethod,
      `"${v.recordedBy}"`,
      v.amount,
      v.type,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expenses_List_by_Total_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Operating Expenses</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {currencySymbol} {grandTotalExpenses.toLocaleString()}
          </div>
          <span className="text-xs text-rose-700 font-medium mt-1 block">
            Across {sortedVouchers.length} expense vouchers & payouts
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Cash Drawer Outflows</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalCashExpenses.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Paid directly from cash drawer float
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Bank & Digital Settlements</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {currencySymbol} {totalBankOrDigital.toLocaleString()}
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-1 block">
            Bank transfers, cheques & company cards
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Highest Cost Center</span>
          <div className="text-xl font-black text-slate-900 mt-1 truncate">
            {topExpenseCategory ? topExpenseCategory[0] : 'N/A'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block font-semibold">
            {topExpenseCategory ? `${currencySymbol} ${topExpenseCategory[1].toLocaleString()}` : '-'}
          </span>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {sortedCategories.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span>Category Spending Share</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedCategories.slice(0, 6).map(([cat, amt]) => {
              const numAmt = Number(amt);
              const pct = grandTotalExpenses > 0 ? ((numAmt / grandTotalExpenses) * 100).toFixed(1) : '0';
              return (
                <div key={cat} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block truncate">{cat}</span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {currencySymbol} {amt.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold mt-0.5 block">{pct}% of spend</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, ref, payee..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories ({categoriesList.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash Drawer</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card / POS</option>
            <option value="CHEQUE">Cheque</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DATE_DESC">Sort: Date (Newest first)</option>
            <option value="AMOUNT_DESC">Sort: Amount (High to Low)</option>
            <option value="CATEGORY_ASC">Sort: Category (A-Z)</option>
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

      {/* Main Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-rose-600" />
            <span>Expenses Register ({sortedVouchers.length} Records)</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Total Spend: <strong>{currencySymbol} {grandTotalExpenses.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description / Payee</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No expense vouchers recorded for the selected criteria.
                  </td>
                </tr>
              ) : (
                sortedVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {v.ref}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(v.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md text-[10px] uppercase">
                        {v.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium max-w-[280px]">
                      {v.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                        {v.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {v.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 bg-rose-50/20">
                      {currencySymbol} {v.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sortedVouchers.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={6} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Total Operational Expenses ({sortedVouchers.length} Records)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm">
                    {currencySymbol} {grandTotalExpenses.toLocaleString()}
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
        reportTitle="Operating Expenses & Cash Payouts Ledger"
        reportSubtitle={`Spend Analysis (${sortedVouchers.length} Vouchers Listed)`}
        reportCategory="FINANCIAL EXPENDITURE & PAYOUT AUDIT"
        dateRangeText={dateFilter === 'ALL' ? 'All Historic Dates' : dateFilter}
        tenant={tenant}
        defaultOrientation="portrait"
        kpis={[
          { label: 'Total Expenses', value: `${currencySymbol} ${grandTotalExpenses.toLocaleString()}` },
          { label: 'Cash Drawer Payouts', value: `${currencySymbol} ${totalCashExpenses.toLocaleString()}` },
          { label: 'Bank & Electronic', value: `${currencySymbol} ${totalBankOrDigital.toLocaleString()}` },
          { label: 'Vouchers Count', value: `${sortedVouchers.length} Records` },
        ]}
        headers={[
          'Voucher # / Ref',
          'Date',
          'Category',
          'Description / Payee',
          'Payment Mode',
          'Recorded By',
          'Amount',
        ]}
        rows={sortedVouchers.map((v) => [
          v.ref,
          new Date(v.date).toLocaleDateString(),
          v.category,
          v.description,
          v.paymentMethod,
          v.recordedBy,
          `${currencySymbol} ${v.amount.toLocaleString()}`,
        ])}
        summaryRows={[
          { label: 'Total Cash Drawer Payouts', value: `${currencySymbol} ${totalCashExpenses.toLocaleString()}` },
          { label: 'Total Bank & Digital Transfers', value: `${currencySymbol} ${totalBankOrDigital.toLocaleString()}` },
          { label: 'Grand Total Operating Expenses', value: `${currencySymbol} ${grandTotalExpenses.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Operating_Expenses_Ledger_Report"
      />
    </div>
  );
};
