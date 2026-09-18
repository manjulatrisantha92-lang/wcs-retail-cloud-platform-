import React, { useState } from 'react';
import { Customer, Sale, CustomerPayment, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  Users,
  Download,
  Printer,
  Search,
  DollarSign,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  FileText,
  UserCheck,
  Percent,
} from 'lucide-react';

interface CustomerBalanceReportProps {
  customers: Customer[];
  sales: Sale[];
  customerPayments: CustomerPayment[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const CustomerBalanceReport: React.FC<CustomerBalanceReportProps> = ({
  customers,
  sales,
  customerPayments,
  tenant,
  currencySymbol,
}) => {
  const safeCustomers = customers || [];
  const safeSales = sales || [];
  const safeCustomerPayments = customerPayments || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'HAS_BALANCE' | 'OVER_LIMIT' | 'ZERO_BALANCE'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Calculate detailed metrics for each customer
  const customerRows = safeCustomers.map((c) => {
    const custSales = safeSales.filter(
      (s) =>
        s &&
        (s.customer_id === c.id ||
          (s.customer_name && s.customer_name.toLowerCase() === (c.name || '').toLowerCase()) ||
          (s.customer_phone && s.customer_phone === c.phone))
    );

    const custPayments = safeCustomerPayments.filter(
      (p) => p && (p.customer_id === c.id || (p.customer_name && p.customer_name.toLowerCase() === (c.name || '').toLowerCase()))
    );

    const totalPurchased = custSales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
    const totalCreditPurchased = custSales
      .filter((s) => s.payment_method === 'CREDIT' || (s.balance_due && s.balance_due > 0))
      .reduce((acc, s) => acc + (s.balance_due || s.grand_total || 0), 0);
    const totalSettled = custPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const currentBalance = c.current_balance ?? Math.max(0, totalCreditPurchased - totalSettled);
    const creditLimit = c.credit_limit || 0;
    const availableCredit = Math.max(0, creditLimit - currentBalance);
    const isOverLimit = creditLimit > 0 && currentBalance > creditLimit;
    const hasDebt = currentBalance > 0;
    const utilizationPct = creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0;

    return {
      customer: c,
      totalPurchased,
      totalCreditPurchased,
      totalSettled,
      currentBalance,
      creditLimit,
      availableCredit,
      isOverLimit,
      hasDebt,
      utilizationPct,
      invoicesCount: custSales.length,
      sales: custSales,
      payments: custPayments,
    };
  });

  // Filter
  const filteredCustomers = customerRows.filter((r) => {
    const c = r.customer;
    const matchesSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.nic_or_br && c.nic_or_br.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBalance =
      balanceFilter === 'ALL'
        ? true
        : balanceFilter === 'HAS_BALANCE'
        ? r.hasDebt
        : balanceFilter === 'OVER_LIMIT'
        ? r.isOverLimit
        : !r.hasDebt;

    return matchesSearch && matchesBalance;
  });

  // KPI calculations
  const totalOutstandingDebtors = customerRows.reduce((acc, r) => acc + r.currentBalance, 0);
  const totalLifetimePurchases = customerRows.reduce((acc, r) => acc + r.totalPurchased, 0);
  const totalSettledByAllCustomers = customerRows.reduce((acc, r) => acc + r.totalSettled, 0);
  const customersWithDebt = customerRows.filter((r) => r.hasDebt).length;
  const customersOverLimit = customerRows.filter((r) => r.isOverLimit).length;

  const activeCustomerDetail = customerRows.find((r) => r.customer.id === selectedCustomerId);

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Customer Name',
      'Phone Number',
      'Email',
      'Address',
      'NIC / BR Number',
      'Credit Limit (Rs.)',
      'Total Purchased (Rs.)',
      'Total Settled (Rs.)',
      'Outstanding Balance Due (Rs.)',
      'Available Credit (Rs.)',
      'Credit Utilization %',
      'Loyalty Points',
      'Status',
    ];

    const rows = filteredCustomers.map((r) => [
      `"${r.customer.name.replace(/"/g, '""')}"`,
      `"${r.customer.phone || ''}"`,
      `"${r.customer.email || ''}"`,
      `"${(r.customer.address || '').replace(/"/g, '""')}"`,
      `"${r.customer.nic_or_br || ''}"`,
      r.creditLimit,
      r.totalPurchased,
      r.totalSettled,
      r.currentBalance,
      r.availableCredit,
      `${r.utilizationPct}%`,
      r.customer.loyalty_points || 0,
      r.isOverLimit ? 'OVER_CREDIT_LIMIT' : r.hasDebt ? 'DEBTOR_DUE' : 'SETTLED',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Accounts_and_Balance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Receivables (Debtors)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {currencySymbol} {totalOutstandingDebtors.toLocaleString()}
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 block">
            Owed by {customersWithDebt} customers with active credit
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Customer Purchases</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalLifetimePurchases.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across customer database
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Over Credit Limit Risk</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {customersOverLimit} Accounts
          </div>
          <span className="text-xs text-amber-700 font-medium mt-1">
            Balance exceeds approved credit limit
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Registered Customers</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {customers.length} Profiles
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-1 block">
            {customers.length - customersWithDebt} zero-balance profiles
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
              placeholder="Search name, phone, NIC, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Customers ({customers.length})</option>
            <option value="HAS_BALANCE">With Outstanding Balance ({customersWithDebt})</option>
            <option value="OVER_LIMIT">Over Credit Limit ({customersOverLimit})</option>
            <option value="ZERO_BALANCE">Zero Balance / Cleared</option>
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

      {/* Main Customers Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Customer Receivables & Balance Register ({filteredCustomers.length} Customers)</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Total Receivables: <strong>{currencySymbol} {totalOutstandingDebtors.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone & NIC / BR</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Settled Payments</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Credit Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((r) => {
                  const c = r.customer;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.phone || '-'}
                        </div>
                        {c.nic_or_br && (
                          <div className="text-[10px] text-slate-400 font-mono">NIC: {c.nic_or_br}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[180px] truncate">
                        {c.address || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {currencySymbol} {r.creditLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currencySymbol} {r.totalPurchased.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {currencySymbol} {r.totalSettled.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div
                          className={`font-black text-sm ${
                            r.hasDebt ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {currencySymbol} {r.currentBalance.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.isOverLimit
                              ? 'bg-rose-100 text-rose-800'
                              : r.hasDebt
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.isOverLimit ? 'OVER LIMIT' : r.hasDebt ? 'DUE BALANCE' : 'CLEARED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setSelectedCustomerId(
                              selectedCustomerId === c.id ? null : c.id
                            )
                          }
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          {selectedCustomerId === c.id ? 'Close' : 'Ledger'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredCustomers.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Customer Receivables Total
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {currencySymbol} {filteredCustomers.reduce((a, b) => a + b.creditLimit, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {currencySymbol} {filteredCustomers.reduce((a, b) => a + b.totalPurchased, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800">
                    {currencySymbol} {filteredCustomers.reduce((a, b) => a + b.totalSettled, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm">
                    {currencySymbol} {totalOutstandingDebtors.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Customer Ledger Statement Drilldown Modal */}
      {activeCustomerDetail && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Customer Ledger Statement: {activeCustomerDetail.customer.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tel: {activeCustomerDetail.customer.phone} | Address: {activeCustomerDetail.customer.address || 'N/A'} | NIC/BR: {activeCustomerDetail.customer.nic_or_br || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => setSelectedCustomerId(null)}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold px-2.5 py-1 bg-slate-100 rounded-lg"
            >
              Close Statement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Approved Credit Limit</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {currencySymbol} {activeCustomerDetail.creditLimit.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Lifetime Purchases</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {currencySymbol} {activeCustomerDetail.totalPurchased.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Settled Payments</span>
              <div className="text-lg font-black text-emerald-600 mt-1">
                {currencySymbol} {activeCustomerDetail.totalSettled.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-rose-200 bg-rose-50/30">
              <span className="text-[10px] text-rose-700 font-bold uppercase">Outstanding Balance Due</span>
              <div className="text-lg font-black text-rose-600 mt-1">
                {currencySymbol} {activeCustomerDetail.currentBalance.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Invoice & Payment History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Invoice / Ref #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Payment Method</th>
                    <th className="py-2 px-3 text-right">Invoice Total</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCustomerDetail.sales.length === 0 && activeCustomerDetail.payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No transactions recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    activeCustomerDetail.sales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600">{s.invoice_no}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                            SALE INVOICE
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-600">{s.payment_method}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">
                          {currencySymbol} {(s.paid_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">
                          {currencySymbol} {(s.balance_due || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* A4 Report Print Step Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Customer Accounts Receivable & Credit Ledger Report"
        reportSubtitle={`Accounts Receivable Ledger (${filteredCustomers.length} Customers Listed)`}
        reportCategory="ACCOUNTS RECEIVABLE & CREDIT RECOVERY AUDIT"
        dateRangeText="Active Customer Credit Ledgers"
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Total Receivables', value: `${currencySymbol} ${totalOutstandingDebtors.toLocaleString()}` },
          { label: 'Customers with Due', value: `${customersWithDebt} of ${customers.length} Accounts` },
          { label: 'Over Credit Limit', value: `${customersOverLimit} Accounts` },
          { label: 'Total Purchase Volume', value: `${currencySymbol} ${totalLifetimePurchases.toLocaleString()}` },
        ]}
        headers={[
          'Customer Name & Contact',
          'Address / NIC',
          'Credit Limit',
          'Total Purchases',
          'Settled Paid',
          'Outstanding Balance (Due)',
          'Available Credit',
          'Status',
        ]}
        rows={filteredCustomers.map((r) => [
          `${r.customer.name} | Tel: ${r.customer.phone}`,
          `${r.customer.address || '-'} ${r.customer.nic_or_br ? `(NIC: ${r.customer.nic_or_br})` : ''}`,
          `${currencySymbol} ${r.creditLimit.toLocaleString()}`,
          `${currencySymbol} ${r.totalPurchased.toLocaleString()}`,
          `${currencySymbol} ${r.totalSettled.toLocaleString()}`,
          `${currencySymbol} ${r.currentBalance.toLocaleString()}`,
          `${currencySymbol} ${r.availableCredit.toLocaleString()}`,
          r.isOverLimit ? 'OVER LIMIT' : r.hasDebt ? 'DUE BALANCE' : 'CLEARED',
        ])}
        summaryRows={[
          { label: 'Grand Total Customer Purchases', value: `${currencySymbol} ${totalLifetimePurchases.toLocaleString()}`, isBold: true },
          { label: 'Grand Total Customer Payments Settled', value: `${currencySymbol} ${totalSettledByAllCustomers.toLocaleString()}` },
          { label: 'Grand Total Outstanding Receivables', value: `${currencySymbol} ${totalOutstandingDebtors.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Customer_Receivables_Credit_Report"
      />
    </div>
  );
};
