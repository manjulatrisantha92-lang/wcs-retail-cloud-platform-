import React, { useState } from 'react';
import { Sale, SaleReturn, Tenant } from '../../../types';
import { openCleanReportPrintTab } from '../../../utils/printEngine';
import { PrintReportModal } from '../../common/PrintReportModal';
import {
  Receipt,
  RotateCcw,
  Download,
  Printer,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SalesAndReturnsReportProps {
  sales: Sale[];
  saleReturns: SaleReturn[];
  tenant?: Tenant;
  currencySymbol: string;
}

export const SalesAndReturnsReport: React.FC<SalesAndReturnsReportProps> = ({
  sales,
  saleReturns,
  tenant,
  currencySymbol,
}) => {
  const [activeSubView, setActiveSubView] = useState<'ALL' | 'SALES' | 'RETURNS' | 'RETURNED_ITEMS'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Date filtering
  const filterByDate = (dateStr: string) => {
    if (dateFilter === 'ALL') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'TODAY') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo;
    }
    if (dateFilter === 'MONTH') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredSales = sales.filter((s) => {
    const matchesDate = filterByDate(s.created_at);
    const matchesSearch =
      searchTerm === '' ||
      s.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.cashier_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const filteredReturns = saleReturns.filter((r) => {
    const matchesDate = filterByDate(r.created_at);
    const matchesSearch =
      searchTerm === '' ||
      r.return_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.original_invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.processed_by.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // KPI Calculations
  const grossSalesTotal = filteredSales.reduce((acc, s) => acc + (s.grand_total || 0), 0);
  const totalDiscounts = filteredSales.reduce(
    (acc, s) => acc + ((s as any).discount_total ?? s.discount_amount ?? 0),
    0
  );
  const totalTax = filteredSales.reduce(
    (acc, s) => acc + ((s as any).tax_total ?? s.tax_amount ?? 0),
    0
  );
  const totalRefunds = filteredReturns.reduce((acc, r) => acc + (r.total_refund_amount || 0), 0);
  const netRevenue = grossSalesTotal - totalRefunds;
  const returnRate = grossSalesTotal > 0 ? ((totalRefunds / grossSalesTotal) * 100).toFixed(1) : '0.0';

  // Flat list of returned products
  const returnedProductsList = filteredReturns.flatMap((r) =>
    (r.items || []).map((item) => ({
      returnNo: r.return_no,
      invoiceNo: r.original_invoice_no,
      date: r.created_at,
      productName: item.name,
      returnQty: item.return_quantity,
      unitPrice: item.unit_price,
      refundAmount: item.refund_amount,
      reason: r.reason,
      processedBy: r.processed_by,
      refundType: r.refund_type,
    }))
  );

  // CSV Export
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeSubView === 'RETURNED_ITEMS') {
      headers = [
        'Return Note #',
        'Original Invoice #',
        'Date',
        'Returned Product',
        'Return Qty',
        'Unit Price (Rs.)',
        'Refund Amount (Rs.)',
        'Reason',
        'Refund Type',
        'Processed By',
      ];
      rows = returnedProductsList.map((item) => [
        `"${item.returnNo}"`,
        `"${item.invoiceNo}"`,
        new Date(item.date).toLocaleDateString(),
        `"${item.productName.replace(/"/g, '""')}"`,
        item.returnQty,
        item.unitPrice,
        item.refundAmount,
        `"${item.reason}"`,
        item.refundType,
        `"${item.processedBy}"`,
      ]);
    } else if (activeSubView === 'RETURNS') {
      headers = [
        'Return No',
        'Original Invoice No',
        'Date',
        'Customer',
        'Items Count',
        'Refund Type',
        'Reason',
        'Refund Amount (Rs.)',
        'Processed By',
      ];
      rows = filteredReturns.map((r) => [
        `"${r.return_no}"`,
        `"${r.original_invoice_no}"`,
        new Date(r.created_at).toLocaleDateString(),
        `"${r.customer_name || 'Walk-in'}"`,
        (r.items || []).length,
        r.refund_type,
        `"${r.reason.replace(/"/g, '""')}"`,
        r.total_refund_amount,
        `"${r.processedBy || (r as any).processed_by}"`,
      ]);
    } else {
      headers = [
        'Type',
        'Ref Number',
        'Date',
        'Customer',
        'Staff',
        'Payment / Refund Method',
        'Gross Amount (Rs.)',
        'Discounts / Deductions',
        'Net Impact (Rs.)',
      ];
      const salesRows = filteredSales.map((s) => [
        'SALE_INVOICE',
        `"${s.invoice_no}"`,
        new Date(s.created_at).toLocaleDateString(),
        `"${s.customer_name || 'Walk-in'}"`,
        `"${s.cashier_name}"`,
        s.payment_method,
        s.grand_total,
        (s as any).discount_amount || 0,
        s.grand_total,
      ]);
      const returnRows = filteredReturns.map((r) => [
        'SALE_RETURN',
        `"${r.return_no} (Inv: ${r.original_invoice_no})"`,
        new Date(r.created_at).toLocaleDateString(),
        `"${r.customer_name || 'Walk-in'}"`,
        `"${r.processed_by}"`,
        r.refund_type,
        0,
        r.total_refund_amount,
        -r.total_refund_amount,
      ]);
      rows = [...salesRows, ...returnRows];
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_and_Returns_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Gross Sales Turnover</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {grossSalesTotal.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            {filteredSales.length} billed invoices
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Sales Returns & Refunds</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            -{currencySymbol} {totalRefunds.toLocaleString()}
          </div>
          <span className="text-xs text-rose-600 font-semibold mt-1 block">
            {filteredReturns.length} return credit notes issued ({returnRate}% rate)
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 shadow-xs">
          <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Net Realized Revenue</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {currencySymbol} {netRevenue.toLocaleString()}
          </div>
          <span className="text-xs text-indigo-600 font-medium mt-1 block">
            After deducting all returns & refunds
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Discounts & Deductions</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {currencySymbol} {totalDiscounts.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Promotional & staff discounts
          </span>
        </div>
      </div>

      {/* Filter & View Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice, return #, customer..."
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

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveSubView('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubView === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActiveSubView('SALES')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubView === 'SALES'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Only ({filteredSales.length})
            </button>
            <button
              onClick={() => setActiveSubView('RETURNS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubView === 'RETURNS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returns Only ({filteredReturns.length})
            </button>
            <button
              onClick={() => setActiveSubView('RETURNED_ITEMS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubView === 'RETURNED_ITEMS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returned Items ({returnedProductsList.length})
            </button>
          </div>
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

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>
              {activeSubView === 'RETURNED_ITEMS'
                ? `Returned Products Breakdown (${returnedProductsList.length} Items)`
                : activeSubView === 'RETURNS'
                ? `Sales Returns & Credit Notes (${filteredReturns.length} Returns)`
                : activeSubView === 'SALES'
                ? `Sales Invoices Register (${filteredSales.length} Bills)`
                : `Combined Sales & Returns Register (${filteredSales.length + filteredReturns.length} Transactions)`}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Net Turnover: <strong>{currencySymbol} {netRevenue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubView === 'RETURNED_ITEMS' ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Return # / Inv #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Returned Product Name</th>
                  <th className="py-3 px-4 text-center">Return Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Refund Value</th>
                  <th className="py-3 px-4">Return Reason</th>
                  <th className="py-3 px-4">Refund Mode</th>
                  <th className="py-3 px-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnedProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No returned item details found.
                    </td>
                  </tr>
                ) : (
                  returnedProductsList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-rose-600">{item.returnNo}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Inv: {item.invoiceNo}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.productName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                        -{item.returnQty} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {currencySymbol} {(item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 bg-rose-50/20">
                        -{currencySymbol} {(item.refundAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium text-[11px]">
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                          {item.refundType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.processedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Transaction / Ref #</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Payment / Refund Mode</th>
                  <th className="py-3 px-4 text-right">Gross Total</th>
                  <th className="py-3 px-4 text-right">Net Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSubView !== 'RETURNS' &&
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {s.invoice_no}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                          SALE INVOICE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">{s.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-slate-600">{s.cashier_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        +{currencySymbol} {(s.grand_total || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}

                {activeSubView !== 'SALES' &&
                  filteredReturns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors bg-rose-50/20">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-rose-600">{r.return_no}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Inv: {r.original_invoice_no}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                          SALE RETURN
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">{r.customer_name || 'Walk-in'}</td>
                      <td className="py-3 px-4 text-slate-600">{r.processed_by}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">
                          {r.refund_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                        -{currencySymbol} {(r.total_refund_amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={6} className="py-3 px-4 uppercase text-[10px] text-slate-600">
                    Grand Net Sales Realization
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {currencySymbol} {grossSalesTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-900 text-sm">
                    {currencySymbol} {netRevenue.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* A4 Report Print Step Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportTitle="Sales Revenue & Returns Realization Audit"
        reportSubtitle={`Date Period: ${dateFilter === 'ALL' ? 'All Time' : dateFilter} (${filteredSales.length} Invoices, ${filteredReturns.length} Returns)`}
        reportCategory="SALES REVENUE & RETURN AUDIT"
        dateRangeText={dateFilter === 'ALL' ? 'All Historic Dates' : dateFilter}
        tenant={tenant}
        defaultOrientation="landscape"
        kpis={[
          { label: 'Gross Turnover', value: `${currencySymbol} ${grossSalesTotal.toLocaleString()}` },
          { label: 'Sales Returns', value: `-${currencySymbol} ${totalRefunds.toLocaleString()}` },
          { label: 'Net Realized Revenue', value: `${currencySymbol} ${netRevenue.toLocaleString()}` },
          { label: 'Return Rate', value: `${returnRate}% of turnover` },
        ]}
        headers={[
          'Document #',
          'Date / Time',
          'Customer',
          'Staff',
          'Type',
          'Tender / Mode',
          'Gross Total',
          'Return Refund',
          'Net Realized',
        ]}
        rows={[
          ...filteredSales.map((s) => [
            s.invoice_no,
            new Date(s.created_at).toLocaleDateString(),
            s.customer_name || 'Walk-in',
            s.cashier_name,
            'SALE INVOICE',
            s.payment_method,
            `${currencySymbol} ${(s.grand_total || 0).toLocaleString()}`,
            '-',
            `${currencySymbol} ${(s.grand_total || 0).toLocaleString()}`,
          ]),
          ...filteredReturns.map((r) => [
            `${r.return_no} (Inv: ${r.original_invoice_no})`,
            new Date(r.created_at).toLocaleDateString(),
            r.customer_name || 'Walk-in',
            r.processed_by,
            'SALES RETURN',
            r.refund_type,
            '-',
            `-${currencySymbol} ${(r.total_refund_amount || 0).toLocaleString()}`,
            `-${currencySymbol} ${(r.total_refund_amount || 0).toLocaleString()}`,
          ]),
        ]}
        summaryRows={[
          { label: 'Total Gross Sales Turnover', value: `${currencySymbol} ${grossSalesTotal.toLocaleString()}`, isBold: true },
          { label: 'Total Returns & Refunds Granted', value: `-${currencySymbol} ${totalRefunds.toLocaleString()}` },
          { label: 'Grand Total Net Realized Revenue', value: `${currencySymbol} ${netRevenue.toLocaleString()}`, isGrandTotal: true },
        ]}
        csvFileName="Sales_and_Returns_Report"
      />
    </div>
  );
};
