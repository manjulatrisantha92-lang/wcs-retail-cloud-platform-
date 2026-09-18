import React, { useState } from 'react';
import { Supplier, PurchaseOrder, PurchaseReturn, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  Truck,
  Download,
  Printer,
  Search,
  DollarSign,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  ArrowRight,
} from 'lucide-react';

interface SupplierBalanceReportProps {
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  purchaseReturns: PurchaseReturn[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const SupplierBalanceReport: React.FC<SupplierBalanceReportProps> = ({
  suppliers,
  purchases,
  purchaseReturns,
  tenant,
  currencySymbol,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'HAS_BALANCE' | 'ZERO_BALANCE'>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute metrics for each supplier
  const supplierMetrics = suppliers.map((sup) => {
    const supPOs = purchases.filter(
      (po) =>
        po.supplier_id === sup.id ||
        po.supplier_name.toLowerCase() === sup.name.toLowerCase() ||
        po.supplier_name.toLowerCase() === sup.company.toLowerCase()
    );

    const supReturns = purchaseReturns.filter(
      (pr) =>
        pr.supplier_id === sup.id ||
        pr.supplier_name.toLowerCase() === sup.name.toLowerCase()
    );

    const totalOrdersAmount = supPOs.reduce((acc, po) => acc + (po.total_amount || 0), 0);
    const totalPaidAmount = supPOs.reduce((acc, po) => acc + (po.paid_amount || 0), 0);
    const totalDebitNotes = supReturns.reduce((acc, pr) => acc + (pr.total_return_amount || 0), 0);

    // If balance_payable is tracked directly on supplier or derived from POs
    const computedBalance =
      typeof sup.balance_payable === 'number' && sup.balance_payable > 0
        ? sup.balance_payable
        : Math.max(0, totalOrdersAmount - totalPaidAmount - totalDebitNotes);

    return {
      supplier: sup,
      posCount: supPOs.length,
      totalOrdersAmount,
      totalPaidAmount,
      totalDebitNotes,
      balancePayable: computedBalance,
      pos: supPOs,
      returns: supReturns,
    };
  });

  // Filter list
  const filteredSuppliers = supplierMetrics.filter((m) => {
    const matchesSearch =
      searchTerm === '' ||
      m.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.supplier.phone && m.supplier.phone.includes(searchTerm)) ||
      (m.supplier.email && m.supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesBalance =
      balanceFilter === 'ALL'
        ? true
        : balanceFilter === 'HAS_BALANCE'
        ? m.balancePayable > 0
        : m.balancePayable <= 0;

    return matchesSearch && matchesBalance;
  });

  // Grand totals
  const totalSuppliersCount = suppliers.length;
  const totalPurchasesVolume = supplierMetrics.reduce((acc, m) => acc + m.totalOrdersAmount, 0);
  const totalSettledPayments = supplierMetrics.reduce((acc, m) => acc + m.totalPaidAmount, 0);
  const totalOutstandingPayable = supplierMetrics.reduce((acc, m) => acc + m.balancePayable, 0);
  const suppliersWithDues = supplierMetrics.filter((m) => m.balancePayable > 0).length;

  // Selected supplier drilldown
  const activeSupplierData = supplierMetrics.find((m) => m.supplier.id === selectedSupplierId);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Supplier Name',
      'Company Name',
      'Phone',
      'Email',
      'BR Number',
      'Bank Account Info',
      'Total POs Count',
      'Total Purchased Value (Rs.)',
      'Total Paid (Rs.)',
      'Debit Notes (Rs.)',
      'Outstanding Balance Payable (Rs.)',
      'Status',
    ];

    const rows = filteredSuppliers.map((m) => [
      `"${m.supplier.name.replace(/"/g, '""')}"`,
      `"${m.supplier.company.replace(/"/g, '""')}"`,
      `"${m.supplier.phone || ''}"`,
      `"${m.supplier.email || ''}"`,
      `"${m.supplier.br_number || ''}"`,
      `"${(m.supplier.bank_details || '').replace(/"/g, '""')}"`,
      m.posCount,
      m.totalOrdersAmount,
      m.totalPaidAmount,
      m.totalDebitNotes,
      m.balancePayable,
      m.balancePayable > 0 ? 'PAYABLE_DUE' : 'CLEARED',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Balance_Accounts_Payable_${new Date().toISOString().slice(0, 10)}.csv`);
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
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Outstanding Payable</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {currencySymbol} {totalOutstandingPayable.toLocaleString()}
          </div>
          <span className="text-xs text-rose-700 font-semibold mt-1 block">
            Owed across {suppliersWithDues} suppliers
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Purchases (All POs)</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {totalPurchasesVolume.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Gross procurement spend
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Settled to Suppliers</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {currencySymbol} {totalSettledPayments.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            Paid via Cash, Cheque & Bank
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Supplier Directory Count</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {totalSuppliersCount} Vendors
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {suppliers.length - suppliersWithDues} suppliers zero-balance
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Balance Filter, Export & Print */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search supplier, company, phone..."
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
            <option value="ALL">All Suppliers ({suppliers.length})</option>
            <option value="HAS_BALANCE">With Outstanding Balance ({suppliersWithDues})</option>
            <option value="ZERO_BALANCE">Zero Balance / Settled</option>
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

      {/* Supplier Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Supplier Accounts Payable Ledger ({filteredSuppliers.length} Vendors)</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Total Payable: <strong>{currencySymbol} {totalOutstandingPayable.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Supplier & Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Bank / Registration</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Debit Notes</th>
                <th className="py-3 px-4 text-right">Balance Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No suppliers matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((m) => {
                  const hasDebt = m.balancePayable > 0;
                  return (
                    <tr key={m.supplier.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.supplier.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{m.supplier.company}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {m.supplier.phone || '-'}
                        </div>
                        {m.supplier.email && <div className="text-[10px] text-slate-400">{m.supplier.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-700 font-medium max-w-[180px] truncate">
                          {m.supplier.bank_details || '-'}
                        </div>
                        {m.supplier.br_number && (
                          <div className="text-[10px] text-slate-400 font-mono">BR: {m.supplier.br_number}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-semibold text-[11px]">
                          {m.posCount} POs
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currencySymbol} {m.totalOrdersAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {currencySymbol} {m.totalPaidAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600">
                        {m.totalDebitNotes > 0 ? `${currencySymbol} ${m.totalDebitNotes.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div
                          className={`font-black text-sm ${
                            hasDebt ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          {currencySymbol} {m.balancePayable.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            hasDebt
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {hasDebt ? 'PAYABLE DUE' : 'CLEARED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            setSelectedSupplierId(
                              selectedSupplierId === m.supplier.id ? null : m.supplier.id
                            )
                          }
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          {selectedSupplierId === m.supplier.id ? 'Close' : 'Ledger'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredSuppliers.length > 0 && (
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Accounts Payable Total
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {filteredSuppliers.reduce((a, b) => a + b.posCount, 0)} POs
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-950">
                    {currencySymbol} {filteredSuppliers.reduce((a, b) => a + b.totalOrdersAmount, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800">
                    {currencySymbol} {filteredSuppliers.reduce((a, b) => a + b.totalPaidAmount, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-800">
                    {currencySymbol} {filteredSuppliers.reduce((a, b) => a + b.totalDebitNotes, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-700 text-sm">
                    {currencySymbol} {totalOutstandingPayable.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Supplier Ledger Drilldown Modal */}
      {activeSupplierData && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Supplier Account Statement: {activeSupplierData.supplier.name}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {activeSupplierData.supplier.company} | Tel: {activeSupplierData.supplier.phone} | Bank: {activeSupplierData.supplier.bank_details || 'N/A'}
              </p>
            </div>
            <button
              onClick={() => setSelectedSupplierId(null)}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold px-2.5 py-1 bg-slate-100 rounded-lg"
            >
              Close Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Purchases</span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {currencySymbol} {activeSupplierData.totalOrdersAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Paid</span>
              <div className="text-lg font-black text-emerald-600 mt-1">
                {currencySymbol} {activeSupplierData.totalPaidAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Payable</span>
              <div className="text-lg font-black text-rose-600 mt-1">
                {currencySymbol} {activeSupplierData.balancePayable.toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Purchase Orders & GRN History</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">PO Number</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Payment Method</th>
                    <th className="py-2 px-3 text-right">PO Total</th>
                    <th className="py-2 px-3 text-right">Paid</th>
                    <th className="py-2 px-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSupplierData.pos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400">
                        No purchase orders recorded yet for this supplier.
                      </td>
                    </tr>
                  ) : (
                    activeSupplierData.pos.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-600">{po.po_number}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{po.order_date}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                            {po.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-600">{po.payment_method || 'CREDIT'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {currencySymbol} {(po.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600 font-semibold">
                          {currencySymbol} {(po.paid_amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">
                          {currencySymbol} {(po.balance_due || 0).toLocaleString()}
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

      {/* A4 Report Print Modal Step */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Supplier Accounts & Balance Payable Report"
        reportSubtitle={`Accounts Payable Ledger (${filteredSuppliers.length} Suppliers Listed)`}
        reportCategory="ACCOUNTS PAYABLE & PROCUREMENT AUDIT"
        dateRangeText="Active Supplier Ledgers"
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Total Suppliers', value: `${totalSuppliersCount} Vendors` },
          { label: 'Total Purchases Volume', value: `${currencySymbol} ${totalPurchasesVolume.toLocaleString()}` },
          { label: 'Total Settled Payments', value: `${currencySymbol} ${totalSettledPayments.toLocaleString()}` },
          { label: 'Total Outstanding Payable', value: `${currencySymbol} ${totalOutstandingPayable.toLocaleString()}` },
        ]}
        headers={[
          'Supplier / Vendor Name',
          'Company & Contact',
          'Bank Details / BR',
          'Orders (POs)',
          'Total Purchases',
          'Total Paid',
          'Debit Notes',
          'Balance Payable (Owed)',
          'Status',
        ]}
        rows={filteredSuppliers.map((m) => [
          m.supplier.name,
          `${m.supplier.company} | ${m.supplier.phone || '-'}`,
          m.supplier.bank_details || m.supplier.br_number || '-',
          m.posCount,
          `${currencySymbol} ${m.totalOrdersAmount.toLocaleString()}`,
          `${currencySymbol} ${m.totalPaidAmount.toLocaleString()}`,
          `${currencySymbol} ${m.totalDebitNotes.toLocaleString()}`,
          `${currencySymbol} ${m.balancePayable.toLocaleString()}`,
          m.balancePayable > 0 ? 'PAYABLE DUE' : 'CLEARED',
        ])}
        summaryRows={[
          { label: 'Grand Total Purchases Volume', value: `${currencySymbol} ${totalPurchasesVolume.toLocaleString()}`, isBold: true },
          { label: 'Total Settled Payments to Vendors', value: `${currencySymbol} ${totalSettledPayments.toLocaleString()}` },
          { label: 'Grand Total Outstanding Accounts Payable (Owed)', value: `${currencySymbol} ${totalOutstandingPayable.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Supplier_Accounts_Payable_Report"
      />
    </div>
  );
};
