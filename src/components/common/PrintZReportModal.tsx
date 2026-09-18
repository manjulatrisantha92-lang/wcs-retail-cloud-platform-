import React, { useState } from 'react';
import { CounterShift, Tenant, TenantSettings, Language } from '../../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import {
  Printer,
  X,
  CheckCircle2,
  Share2,
  FileText,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  Bluetooth,
  KeyRound,
  ShieldCheck,
  Check,
  Building2,
  Phone,
  Clock,
  User,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
} from 'lucide-react';
import { useRetail } from '../../context/RetailContext';
import { openCleanZReportPrintTab, generateZReportDocumentHtml } from '../../utils/printEngine';
import { printZReportToBluetoothPrinter, isBluetoothSupported, getConnectedBluetoothPrinter } from '../../utils/bluetoothPrinter';

interface PrintZReportModalProps {
  shift: CounterShift | null;
  tenant: Tenant | undefined;
  settings?: TenantSettings | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintZReportModal: React.FC<PrintZReportModalProps> = ({
  shift,
  tenant,
  settings,
  isOpen,
  onClose,
}) => {
  const { language: globalLang, kickCashDrawer } = useRetail();

  const [receiptFormat, setReceiptFormat] = useState<'80mm' | 'a4' | '58mm'>(
    settings?.default_receipt_format || '80mm'
  );
  const [billLang, setBillLang] = useState<Language>(globalLang || 'en');
  const [autoKickDrawer, setAutoKickDrawer] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState(false);
  const [drawerKicked, setDrawerKicked] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);

  if (!isOpen || !shift || !tenant) return null;

  const currencySymbol = tenant.currency_symbol || 'Rs.';

  const handleManualKickDrawer = () => {
    kickCashDrawer(shift.counter_id, shift.counter_name);
    setDrawerKicked(true);
    setTimeout(() => setDrawerKicked(false), 2500);
  };

  // Direct In-Page Print (Any Printer)
  const handlePrintAnyPrinter = () => {
    if (autoKickDrawer) {
      kickCashDrawer(shift.counter_id, shift.counter_name);
    }
    window.print();
  };

  // Standalone Clean Print Tab
  const handlePrintStandaloneTab = () => {
    if (autoKickDrawer) {
      kickCashDrawer(shift.counter_id, shift.counter_name);
    }
    openCleanZReportPrintTab({
      shift,
      tenant,
      settings,
      receiptFormat,
      lang: billLang,
    });
  };

  // Bluetooth ESC/POS Print
  const handleBluetoothPrint = async () => {
    try {
      setBluetoothStatus('Connecting to Bluetooth Thermal Printer...');
      if (autoKickDrawer) {
        kickCashDrawer(shift.counter_id, shift.counter_name);
      }
      await printZReportToBluetoothPrinter({
        shift,
        tenant,
        openCashDrawer: autoKickDrawer,
        width: receiptFormat === '58mm' ? 32 : 48,
      });
      setBluetoothStatus('Z-Report Printed successfully via Bluetooth!');
      setTimeout(() => setBluetoothStatus(null), 3500);
    } catch (err: any) {
      setBluetoothStatus(`Bluetooth Error: ${err.message || 'Printer failed'}`);
      setTimeout(() => setBluetoothStatus(null), 4000);
    }
  };

  // Copy Plain Text Slip
  const handleCopyText = () => {
    const text = `================================================
          WCS RETAIL CLOUD PLATFORM
       DAY END Z-REPORT & VAULT SETTLEMENT
================================================
Shop:       ${tenant.shop_name}
Z-Report #: ${shift.z_report_no || `Z-${shift.id}`}
Shift ID:   ${shift.id}
Counter:    ${shift.counter_name}
Cashier:    ${shift.cashier_name}
Opened At:  ${new Date(shift.opened_at).toLocaleString()}
Closed At:  ${shift.closed_at ? new Date(shift.closed_at).toLocaleString() : 'ACTIVE'}
------------------------------------------------
Opening Cash Float:   Rs. ${shift.opening_float.toLocaleString()}
Total Sales Revenue:  Rs. ${shift.total_sales_amount.toLocaleString()} (${shift.total_bills_count} bills)
- Total Cash Sales:   Rs. ${shift.total_cash_sales.toLocaleString()}
- Total Card Sales:   Rs. ${shift.total_card_sales.toLocaleString()}
- Total Credit Sales: Rs. ${shift.total_credit_sales.toLocaleString()}
- Total Refunds:      Rs. ${(shift.total_refunds || 0).toLocaleString()}
------------------------------------------------
Expected In Drawer:   Rs. ${(shift.expected_cash_in_drawer || 0).toLocaleString()}
Actual Counted Cash:  Rs. ${(shift.closing_cash_actual || 0).toLocaleString()}
Cash Variance:        Rs. ${(shift.cash_variance || 0).toLocaleString()}
================================================
DAY END CASH WITHDRAWAL: Rs. ${(shift.cash_withdrawal_amount || 0).toLocaleString()}
RETAINED FLOAT (NEXT DAY):Rs. ${(shift.retained_float_for_next_day || 0).toLocaleString()}
================================================
Notes: ${shift.notes || 'None'}
Authorized Signature: _________________________`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download HTML Slip
  const handleDownloadHtml = () => {
    const html = generateZReportDocumentHtml({
      shift,
      tenant,
      settings,
      receiptFormat,
      lang: billLang,
    });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZReport-${shift.z_report_no || shift.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const variance = shift.cash_variance ?? 0;
  const isBalanced = variance === 0;
  const isSurplus = variance > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Shift Z-Report & Audit Slip</h3>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {shift.z_report_no || `Z-${shift.id}`}
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Closed Shift
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Counter: {shift.counter_name} • Cashier: {shift.cashier_name} • Follows identical thermal bill printout step
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Kick Drawer Button */}
            <button
              onClick={handleManualKickDrawer}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                drawerKicked
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-amber-400 border-amber-500/40 hover:bg-slate-750'
              }`}
              title="Kick cash drawer pulse immediately"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{drawerKicked ? 'Drawer Kicked!' : 'Open Cash Drawer'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {bluetoothStatus && (
          <div className="bg-indigo-600/90 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4" />
              {bluetoothStatus}
            </span>
          </div>
        )}

        {/* Modal Body: Left Controls, Right Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/40">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Printout Options Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Slip Format & Sizing
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReceiptFormat('80mm')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                    receiptFormat === '80mm'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>80mm Thermal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptFormat('58mm')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                    receiptFormat === '58mm'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>58mm Roll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptFormat('a4')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer border ${
                    receiptFormat === 'a4'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>A4 Audit Sheet</span>
                </button>
              </div>

              {/* Language Selection */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-xs text-slate-400">Slip Language:</span>
                <div className="flex gap-1">
                  {(['en', 'si', 'ta'] as Language[]).map((lng) => (
                    <button
                      key={lng}
                      type="button"
                      onClick={() => setBillLang(lng)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        billLang === lng
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lng}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Cash Drawer Option */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoKickDrawer}
                    onChange={(e) => setAutoKickDrawer(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                  />
                  <span className="font-semibold">Auto-open Cash Drawer on Print (Pin 2/5 pulse)</span>
                </label>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
              {/* Print to Any Printer */}
              <button
                onClick={handlePrintAnyPrinter}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-5 h-5" />
                <span>Print to Any Printer (System Dialog)</span>
              </button>

              {/* Bluetooth Thermal Printer */}
              <button
                onClick={handleBluetoothPrint}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Bluetooth className="w-5 h-5" />
                <span>Print to Bluetooth Thermal Printer (ESC/POS)</span>
              </button>

              {/* Standalone Clean Tab */}
              <button
                onClick={handlePrintStandaloneTab}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>Open Clean Standalone Tab Print</span>
              </button>
            </div>

            {/* Auxiliary Tools */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyText}
                className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied Slip' : 'Copy Plain Text'}</span>
              </button>

              <button
                onClick={handleDownloadHtml}
                className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HTML</span>
              </button>
            </div>

            {/* Quick Shift Summary Cards */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Gross Revenue:</span>
                <span className="font-bold text-white">Rs. {shift.total_sales_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Expected In Drawer:</span>
                <span className="font-bold text-slate-300">Rs. {(shift.expected_cash_in_drawer || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Actual Counted Cash:</span>
                <span className="font-bold text-emerald-400">Rs. {(shift.closing_cash_actual || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300">Variance:</span>
                <span className={`font-black ${isBalanced ? 'text-emerald-400' : isSurplus ? 'text-teal-400' : 'text-rose-400'}`}>
                  {isBalanced ? 'Rs. 0 (MATCH)' : isSurplus ? `+Rs. ${variance.toLocaleString()}` : `-Rs. ${Math.abs(variance).toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Thermal Receipt Preview Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div
              className={`bg-white text-slate-950 font-mono shadow-2xl rounded-xl p-5 border border-slate-300 transition-all ${
                receiptFormat === '58mm' ? 'w-[280px] text-[10px]' : receiptFormat === 'a4' ? 'w-full max-w-[480px] text-[12px]' : 'w-[360px] text-[11px]'
              }`}
            >
              {/* Store Header */}
              <div className="text-center space-y-0.5">
                {tenant.logo_url && (
                  <img src={tenant.logo_url} alt="Shop Logo" className="h-9 mx-auto object-contain mb-1" />
                )}
                <div className="font-black text-sm uppercase tracking-wide">{tenant.shop_name}</div>
                {tenant.branch_name && <div className="text-[10px] text-slate-600">{tenant.branch_name}</div>}
                {tenant.address && <div className="text-[10px] text-slate-600">{tenant.address}</div>}
                {tenant.phone && <div className="text-[10px] text-slate-600">Tel: {tenant.phone}</div>}
                {tenant.vat_number && <div className="text-[10px] text-slate-600">VAT: {tenant.vat_number}</div>}
                <div className="my-1.5 inline-block border border-slate-950 px-2 py-0.5 font-bold uppercase text-[10px]">
                  DAY END Z-REPORT & AUDIT
                </div>
              </div>

              <div className="border-b-2 border-slate-950 my-2"></div>

              {/* Meta */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold">Z-Report No:</span>
                  <span className="font-bold">{shift.z_report_no || `Z-${shift.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift ID:</span>
                  <span>{shift.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Counter:</span>
                  <span>{shift.counter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Cashier:</span>
                  <span className="font-bold">{shift.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opened:</span>
                  <span>{new Date(shift.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Closed:</span>
                  <span>{shift.closed_at ? new Date(shift.closed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ACTIVE'}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2"></div>

              {/* Collections Breakdown */}
              <div className="space-y-1">
                <div className="font-bold bg-slate-100 px-1 py-0.5 text-[10px] uppercase">
                  Sales Revenue & Collections
                </div>
                <div className="flex justify-between">
                  <span>Opening Cash Float:</span>
                  <span className="font-bold">{currencySymbol} {shift.opening_float.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Bills:</span>
                  <span className="font-bold">{shift.total_bills_count} bills</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200">
                  <span>GROSS SALES REVENUE:</span>
                  <span>{currencySymbol} {shift.total_sales_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-2">
                  <span>• Cash Sales:</span>
                  <span>{currencySymbol} {shift.total_cash_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-2">
                  <span>• Card Terminal:</span>
                  <span>{currencySymbol} {shift.total_card_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 pl-2">
                  <span>• Credit (Udalu):</span>
                  <span>{currencySymbol} {shift.total_credit_sales.toLocaleString()}</span>
                </div>
                {(shift.total_refunds || 0) > 0 && (
                  <div className="flex justify-between text-rose-700 pl-2">
                    <span>• Refunds / Returns:</span>
                    <span>-{currencySymbol} {(shift.total_refunds || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-b-2 border-slate-950 my-2"></div>

              {/* Physical Cash Drawer Audit */}
              <div className="space-y-1">
                <div className="font-bold bg-slate-100 px-1 py-0.5 text-[10px] uppercase">
                  Physical Cash Drawer Audit
                </div>
                <div className="flex justify-between">
                  <span>Expected In Drawer:</span>
                  <span className="font-bold">{currencySymbol} {(shift.expected_cash_in_drawer || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted Cash:</span>
                  <span className="font-bold">{currencySymbol} {(shift.closing_cash_actual || 0).toLocaleString()}</span>
                </div>

                <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 my-1.5">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Cash Drawer Variance</div>
                  <div className={`text-sm font-black ${isBalanced ? 'text-emerald-700' : isSurplus ? 'text-teal-700' : 'text-rose-700'}`}>
                    {isBalanced ? 'BALANCED (Rs. 0)' : isSurplus ? `SURPLUS (+Rs. ${variance.toLocaleString()})` : `SHORTAGE (-Rs. ${Math.abs(variance).toLocaleString()})`}
                  </div>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2"></div>

              {/* Safe Settlement */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Safe Withdrawal / Drop:</span>
                  <span className="text-rose-700">{currencySymbol} {(shift.cash_withdrawal_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Retained Float (Tomorrow):</span>
                  <span className="text-teal-700">{currencySymbol} {(shift.retained_float_for_next_day || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Barcode */}
              <div className="my-3 text-center">
                <BarcodeRenderer
                  value={shift.z_report_no || `ZREP-${shift.id}`}
                  format="CODE128"
                  width={1.2}
                  height={32}
                  displayValue={true}
                  className="mx-auto"
                />
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-2 text-center text-[9px] text-slate-600">
                <div className="border-t border-dashed border-slate-400 pt-1">
                  Cashier Signature<br />
                  <strong>{shift.cashier_name}</strong>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-1">
                  Manager Signature<br />
                  <strong>Store Supervisor</strong>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 mt-4 border-t border-slate-200 pt-2">
                Official WCS Retail Cloud System Document
                <br />
                *** END OF SHIFT REPORT ***
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
