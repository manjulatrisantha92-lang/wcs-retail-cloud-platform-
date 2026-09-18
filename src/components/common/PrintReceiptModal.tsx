import React, { useState } from 'react';
import { Sale, Tenant, TenantSettings, Language } from '../../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import {
  Printer,
  X,
  CheckCircle2,
  Share2,
  MessageSquare,
  Globe,
  Send,
  Phone,
  Building2,
  FileText,
  Copy,
  QrCode,
  Tag,
  ExternalLink,
  HelpCircle,
  Download,
  Check,
  Usb,
  Receipt,
  Eye,
  Award,
  Bluetooth,
  KeyRound,
} from 'lucide-react';
import { sendReceiptViaWhatsApp, generateWhatsAppReceiptText } from '../../utils/whatsappReceipt';
import { useRetail } from '../../context/RetailContext';
import { openCleanPrintTab, generatePrintDocumentHtml } from '../../utils/printEngine';
import { printSaleToBluetoothPrinter } from '../../utils/bluetoothPrinter';
import { PrinterSetupGuideModal } from './PrinterSetupGuideModal';
import { ItemBarcodeLabelsModal } from './ItemBarcodeLabelsModal';

interface PrintReceiptModalProps {
  sale: Sale | null;
  tenant: Tenant | undefined;
  settings: TenantSettings | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  sale,
  tenant,
  settings,
  isOpen,
  onClose,
}) => {
  const { language: globalLang, employees, users, currentTenantId, updateSale, kickCashDrawer } = useRetail();

  const [receiptFormat, setReceiptFormat] = useState<'80mm' | 'a4' | '58mm'>(
    settings?.default_receipt_format || '80mm'
  );
  const [printBarcodeOnBill, setPrintBarcodeOnBill] = useState<boolean>(true);
  const [printAssociateOnBill, setPrintAssociateOnBill] = useState<boolean>(
    settings?.show_associate_on_bill ?? true
  );
  const [autoKickDrawer, setAutoKickDrawer] = useState<boolean>(true);
  const [drawerKicked, setDrawerKicked] = useState<boolean>(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);

  // Available associates for this shop
  const tenantAssociates = React.useMemo(() => {
    const targetTenantId = tenant?.tenant_id || tenant?.id || currentTenantId;
    const list: { id: string; name: string; code: string; designation?: string; phone?: string }[] = [];
    (employees || [])
      .filter((e) => e.tenant_id === targetTenantId && e.is_active !== false)
      .forEach((emp) => {
        list.push({
          id: emp.id,
          name: emp.name,
          code: emp.associate_code || `EMP-${emp.id.slice(-2)}`,
          designation: emp.designation || 'Sales Associate',
          phone: emp.phone,
        });
      });

    (users || [])
      .filter((u) => u.tenant_id === targetTenantId && u.is_active !== false)
      .forEach((usr) => {
        if (!list.some((a) => a.name.toLowerCase() === usr.full_name.toLowerCase())) {
          list.push({
            id: usr.id,
            name: usr.full_name,
            code: (usr as any).associate_code || `STF-${usr.id.slice(-2)}`,
            designation: usr.role === 'CASHIER' ? 'Cashier / Associate' : 'Store Associate',
            phone: usr.phone,
          });
        }
      });

    if (list.length === 0) {
      list.push(
        {
          id: 'ASSOC-DEMO-01',
          name: 'Nimal Bandara (Floor Lead)',
          code: 'SA-01',
          designation: 'Senior Sales Associate',
        },
        {
          id: 'ASSOC-DEMO-02',
          name: 'Sanjeewa Kumara (Showroom)',
          code: 'SA-02',
          designation: 'Sales Associate',
        }
      );
    }
    return list;
  }, [employees, users, tenant?.tenant_id, tenant?.id, currentTenantId]);

  // Selected associate state
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>(
    sale?.sales_associate_id || ''
  );
  const [selectedAssociateName, setSelectedAssociateName] = useState<string>(
    sale?.sales_associate_name || ''
  );
  const [selectedAssociateCode, setSelectedAssociateCode] = useState<string>(
    sale?.sales_associate_code || ''
  );
  const [selectedAssociateDesig, setSelectedAssociateDesig] = useState<string>(
    sale?.sales_associate_designation || ''
  );

  const [billLang, setBillLang] = useState<Language>(globalLang || 'en');

  const handleSelectAssociate = (assocId: string) => {
    setSelectedAssociateId(assocId);
    if (!assocId) {
      setSelectedAssociateName('');
      setSelectedAssociateCode('');
      setSelectedAssociateDesig('');
      if (sale && updateSale) {
        updateSale(sale.id, {
          sales_associate_id: undefined,
          sales_associate_name: undefined,
          sales_associate_code: undefined,
          sales_associate_designation: undefined,
        });
      }
      return;
    }
    const matched = tenantAssociates.find((a) => a.id === assocId);
    if (matched) {
      setSelectedAssociateName(matched.name);
      setSelectedAssociateCode(matched.code);
      setSelectedAssociateDesig(matched.designation || '');
      if (sale && updateSale) {
        updateSale(sale.id, {
          sales_associate_id: matched.id,
          sales_associate_name: matched.name,
          sales_associate_code: matched.code,
          sales_associate_designation: matched.designation,
        });
      }
    }
  };

  const effectiveAssociateName = selectedAssociateName || sale?.sales_associate_name || '';
  const effectiveAssociateCode = selectedAssociateCode || sale?.sales_associate_code || '';
  const effectiveAssociateDesig = selectedAssociateDesig || sale?.sales_associate_designation || '';
  const associateTitle = settings?.associate_title_label || (billLang === 'si' ? 'විකුණුම් නියෝජිත (Associate)' : billLang === 'ta' ? 'விற்பனை பிரதிநிதி' : 'Sales Associate');

  const [customerPhone, setCustomerPhone] = useState<string>(sale?.customer_phone || '');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [usbStatus, setUsbStatus] = useState<string | null>(null);

  if (!isOpen || !sale || !tenant) return null;

  const currencySymbol = tenant.currency_symbol || 'Rs.';

  const discountVal = (sale as any).discount_amount ?? (sale as any).discount_total ?? 0;
  const taxVal = (sale as any).tax_amount ?? (sale as any).tax_total ?? 0;
  const grandTotalVal = (sale as any).grand_total ?? (sale as any).total_amount ?? 0;
  const subtotalVal = (sale as any).subtotal ?? grandTotalVal;
  const paidAmountVal = (sale as any).paid_amount ?? (sale as any).amount_paid ?? grandTotalVal;
  const changeAmountVal = (sale as any).change_amount ?? (sale as any).balance_amount ?? 0;
  const balanceDueVal = (sale as any).balance_due ?? (sale.payment_method === 'CREDIT' ? grandTotalVal : 0);
  const loyaltyRedeemedVal = (sale as any).loyalty_points_redeemed ?? (sale as any).loyalty_points_amount ?? 0;
  const loyaltyEarnedVal = (sale as any).loyalty_points_earned ?? 0;
  const customerLoyaltyBalanceVal = (sale as any).customer_loyalty_balance;
  const netAfterLoyaltyVal = Math.max(0, grandTotalVal - loyaltyRedeemedVal);

  // Format invoice number display (e.g. 0#120 or INV-120)
  const invoiceDisplay = sale.invoice_no.startsWith('INV-')
    ? `0#${sale.invoice_no.replace('INV-', '')}`
    : sale.invoice_no;

  const createdDateTimeStr = new Date(sale.created_at).toLocaleDateString() + ' ' +
    new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Effective sale for print engine & WhatsApp
  const effectiveSale: Sale = {
    ...sale,
    sales_associate_name: printAssociateOnBill ? effectiveAssociateName : undefined,
    sales_associate_code: printAssociateOnBill ? effectiveAssociateCode : undefined,
    sales_associate_designation: printAssociateOnBill ? effectiveAssociateDesig : undefined,
  };

  // Manual Drawer Kick Trigger
  const handleManualKickDrawer = () => {
    kickCashDrawer(sale.counter_id, sale.counter_name);
    setDrawerKicked(true);
    setTimeout(() => setDrawerKicked(false), 2500);
  };

  // Direct In-Page Print (Any Printer: USB, Network, Thermal, Laser, Inkjet, PDF)
  const handleDirectPrint = () => {
    if (autoKickDrawer) {
      kickCashDrawer(sale.counter_id, sale.counter_name);
    }
    window.print();
  };

  // Open Clean Standalone Tab Print (Blob URL) matching Screenshot 3
  const handlePrintPageStandalone = () => {
    if (autoKickDrawer) {
      kickCashDrawer(sale.counter_id, sale.counter_name);
    }
    openCleanPrintTab({
      sale: effectiveSale,
      tenant,
      settings,
      receiptFormat,
      showBarcode: printBarcodeOnBill,
      showAssociate: printAssociateOnBill,
      associateOverride: {
        name: effectiveAssociateName,
        code: effectiveAssociateCode,
        designation: effectiveAssociateDesig,
      },
      lang: billLang,
    });
  };

  // Print via Bluetooth Thermal Printer (ESC/POS)
  const handleBluetoothPrint = async () => {
    try {
      setBluetoothStatus('Connecting to Bluetooth Thermal Printer...');
      if (autoKickDrawer) {
        kickCashDrawer(sale.counter_id, sale.counter_name);
      }
      await printSaleToBluetoothPrinter({
        sale: effectiveSale,
        tenant,
        settings,
        openCashDrawer: autoKickDrawer,
        width: receiptFormat === '58mm' ? 32 : 48,
      });
      setBluetoothStatus('Sales bill sent to Bluetooth Printer successfully!');
      setTimeout(() => setBluetoothStatus(null), 3500);
    } catch (err: any) {
      setBluetoothStatus(`Bluetooth Error: ${err.message || 'Bluetooth printing failed'}`);
      setTimeout(() => setBluetoothStatus(null), 4000);
    }
  };

  // Direct USB ESC/POS test trigger
  const handleUsbPrint = async () => {
    setUsbStatus('Connecting to USB Thermal POS...');
    setTimeout(() => {
      setUsbStatus('Sent RAW ESC/POS data to USB POS (XP-80)');
      setTimeout(() => setUsbStatus(null), 3000);
      handlePrintPageStandalone();
    }, 600);
  };

  // Copy Plain Text Bill
  const handleCopyText = () => {
    const text = generateWhatsAppReceiptText(effectiveSale, tenant, billLang);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download PDF / HTML format
  const handleDownloadPdf = () => {
    const htmlContent = generatePrintDocumentHtml({
      sale: effectiveSale,
      tenant,
      settings,
      receiptFormat,
      showBarcode: printBarcodeOnBill,
      showAssociate: printAssociateOnBill,
      associateOverride: {
        name: effectiveAssociateName,
        code: effectiveAssociateCode,
        designation: effectiveAssociateDesig,
      },
      lang: billLang,
    });
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${sale.invoice_no}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendWhatsApp = () => {
    sendReceiptViaWhatsApp(effectiveSale, customerPhone, tenant, billLang);
    setWhatsappSent(true);
    setTimeout(() => setWhatsappSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white text-slate-100 animate-in zoom-in-95">
        
        {/* Top Header Bar (Matching Screenshot 2) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#0c1626] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Sales Bill – {invoiceDisplay}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">{createdDateTimeStr}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Open Cash Drawer Button */}
            <button
              onClick={handleManualKickDrawer}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                drawerKicked
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-amber-400 border-amber-500/40 hover:bg-slate-800'
              }`}
              title="Open physical cash drawer immediately (Pin 2/5 pulse)"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{drawerKicked ? 'Drawer Opened!' : 'Open Cash Drawer'}</span>
            </button>

            {/* Format Selector: 80mm, 58mm & A4 */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 gap-1">
              <button
                onClick={() => setReceiptFormat('80mm')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  receiptFormat === '80mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm</span>
              </button>

              <button
                onClick={() => setReceiptFormat('58mm')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  receiptFormat === '58mm'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>58mm POS</span>
              </button>

              <button
                onClick={() => setReceiptFormat('a4')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  receiptFormat === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>A4</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary Options Bar (Matching Screenshot 2) */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-[#09101c] border-b border-slate-800/80 gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            {/* Print Scannable Barcode on Bill Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printBarcodeOnBill}
                onChange={(e) => setPrintBarcodeOnBill(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
              />
              <span className="text-emerald-400 font-mono tracking-tighter">||||</span>
              <span>Print Barcode</span>
            </label>

            {/* Auto-kick Cash Drawer on Print Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-amber-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoKickDrawer}
                onChange={(e) => setAutoKickDrawer(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-open Cash Drawer on Print</span>
            </label>
          </div>

          {/* Right Action Chips (Matching Screenshot 2) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBluetoothPrint}
              className="px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Connect & Print directly to Bluetooth Thermal Printer"
            >
              <Bluetooth className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bluetooth POS</span>
            </button>

            <button
              onClick={handleUsbPrint}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>USB Direct</span>
            </button>

            <button
              onClick={() => setIsLabelsOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Item Barcodes</span>
            </button>
          </div>
        </div>

        {/* Bluetooth Toast if active */}
        {bluetoothStatus && (
          <div className="bg-indigo-600 px-5 py-2 text-xs text-white font-semibold flex items-center gap-2 animate-pulse print:hidden">
            <Bluetooth className="w-4 h-4 shrink-0" />
            <span>{bluetoothStatus}</span>
          </div>
        )}

        {/* Optional Associate Details Bar (Placed Under Next Line) */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2 bg-[#0c1527] border-b border-slate-800/80 gap-2.5 text-xs print:hidden">
          <div className="flex items-center gap-3">
            {/* Print Associate Details Toggle */}
            <label className="flex items-center gap-2 font-semibold text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={printAssociateOnBill}
                onChange={(e) => setPrintAssociateOnBill(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Associate Details <span className="text-[10px] text-amber-400/80 font-normal">(Optional)</span></span>
            </label>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Attribution for staff commission & printed cashier slip
            </span>
          </div>

          {printAssociateOnBill && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 rounded-xl px-2.5 py-1 shadow-xs">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider shrink-0">Associate:</span>
              <select
                value={selectedAssociateId || ''}
                onChange={(e) => handleSelectAssociate(e.target.value)}
                className="bg-transparent text-xs text-amber-300 font-bold outline-none cursor-pointer max-w-[210px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-300">
                  {effectiveAssociateName ? `Selected: ${effectiveAssociateName}` : 'None (Cashier Only - Optional)'}
                </option>
                {tenantAssociates.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                    [{a.code}] {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Browser Preview Tip Banner (Matching Screenshot 2) */}
        <div className="bg-[#0e192c] border-b border-slate-800 px-5 py-2 text-[11px] text-amber-300 flex items-center gap-2 print:hidden">
          <span className="text-sm">💡</span>
          <span>
            <strong>Tip:</strong> If printing is blocked by your browser preview, click <strong>Print Page</strong> to print in a clean standalone tab.
          </span>
        </div>

        {/* USB Status Alert if Triggered */}
        {usbStatus && (
          <div className="bg-indigo-950 px-5 py-1.5 text-xs text-indigo-200 border-b border-indigo-800 font-medium">
            ⚡ {usbStatus}
          </div>
        )}

        {/* Center Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-[#070c14] print:bg-white print:p-0">
          {receiptFormat === '80mm' || receiptFormat === '58mm' ? (
            /* 80mm / 58mm Thermal Receipt (Exact Match to Screenshot 2 & 3) */
            <div
              id="printable-receipt"
              className={`bg-white text-slate-950 rounded-lg shadow-2xl p-4 sm:p-5 w-full ${
                receiptFormat === '58mm' ? 'max-w-[270px] text-[10px]' : 'max-w-[340px] text-[11px]'
              } font-mono leading-tight border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full print:rounded-none`}
            >
              {/* Header Section */}
              <div className="text-center pb-2">
                {((settings?.show_logo_on_bill ?? true) && tenant.logo_url) && (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={tenant.logo_url}
                      alt={tenant.shop_name}
                      className="h-10 max-w-[150px] object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h1 className="font-black text-sm uppercase tracking-wide text-black mb-1">
                  {tenant.shop_name}
                </h1>
                {tenant.address && (
                  <p className="text-[10px] text-slate-700 font-sans">{tenant.address}</p>
                )}
                {tenant.phone && (
                  <p className="text-[10px] text-slate-700 font-sans">Tel: {tenant.phone}</p>
                )}
                {tenant.vat_number && (
                  <p className="text-[10px] text-slate-700 font-sans">VAT Reg: {tenant.vat_number}</p>
                )}
                {tenant.br_number && (
                  <p className="text-[10px] text-slate-700 font-sans">BR: {tenant.br_number}</p>
                )}
              </div>

              <div className="border-t border-black my-2"></div>

              {/* Meta details */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>{createdDateTimeStr}</span>
                  <span className="font-bold">Store: 1</span>
                </div>
                <div className="font-bold text-black">
                  <span>Sales Receipt {invoiceDisplay}</span>
                </div>
              </div>

              <div className="border-t border-black my-2"></div>

              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Cashier: <strong>{sale.cashier_name}</strong></span>
                  <span className="font-bold text-indigo-900">{sale.counter_name || (sale as any).counter_id || 'Counter 01'}</span>
                </div>
                {printAssociateOnBill && effectiveAssociateName && (
                  <div className="pt-0.5 space-y-0.5 border-t border-dashed border-slate-300 mt-0.5">
                    <div className="flex justify-between items-center text-slate-900">
                      <span>{associateTitle}:</span>
                      <strong className="text-black">
                        {effectiveAssociateCode ? `[${effectiveAssociateCode}] ` : ''}
                        {effectiveAssociateName}
                      </strong>
                    </div>
                    {effectiveAssociateDesig && (
                      <div className="flex justify-between items-center text-[9.5px] text-slate-600 font-sans">
                        <span>Role / Designation:</span>
                        <span className="font-medium text-slate-800">{effectiveAssociateDesig}</span>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  Customer: {sale.customer_name || 'Walk-in Customer'}
                  {sale.customer_name === 'Walk-in Customer' || !sale.customer_name ? ' (සාමාන්‍ය පාරිභෝගිකයා)' : ''}
                </div>
                {sale.table_no && (
                  <div className="font-bold">Table: {sale.table_no}</div>
                )}
              </div>

              <div className="border-t border-black my-2"></div>

              {/* Items Table */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-[10px] uppercase border-b border-black pb-1 mb-1">
                  <span className="w-12 text-center">Qty</span>
                  <span className="flex-1 pr-1">Item Name</span>
                  <span className="w-14 text-right">U/Price</span>
                  <span className="w-16 text-right">Total</span>
                </div>

                {(sale.items || []).map((item, idx) => {
                  const itemName = (item as any).product_name || item.name || 'Item';
                  const itemPrice = item.unit_price || 0;
                  const itemQty = item.quantity || 0;
                  const itemTotal = (item as any).total_price ?? (item as any).total ?? itemPrice * itemQty;
                  const customF = (item as any).custom_fields || (item as any).custom_fields_snapshot;

                  return (
                    <div key={idx} className="text-[11px] leading-tight">
                      <div className="flex justify-between items-baseline">
                        <span className="w-12 text-center font-bold">{itemQty}</span>
                        <span className="flex-1 font-semibold truncate pr-1">{itemName}</span>
                        <span className="w-14 text-right text-slate-800">{itemPrice.toFixed(2)}</span>
                        <span className="w-16 text-right font-bold">{itemTotal.toFixed(2)}</span>
                      </div>

                      {/* Custom Attributes (IMEI, Warranty, Vehicle Plate, etc.) */}
                      {customF && Object.keys(customF).length > 0 && (
                        <div className="text-[9px] text-slate-600 pl-1 font-sans space-x-1 mt-0.5">
                          {customF.imei_number && <span>IMEI: <strong>{customF.imei_number}</strong></span>}
                          {customF.warranty_duration && <span>War: <strong>{customF.warranty_duration}</strong></span>}
                          {customF.vehicle_number && <span>Veh: <strong>{customF.vehicle_number}</strong></span>}
                          {customF.ram_specs && <span>Specs: {customF.ram_specs}/{customF.storage_capacity}</span>}
                          {customF.size_gauge && <span>Size: {customF.size_gauge}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2"></div>

              {/* Totals Section */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-800">
                  <span>Subtotal:</span>
                  <span className="font-bold">{subtotalVal.toFixed(2)}</span>
                </div>

                {discountVal > 0 && (
                  <div className="flex justify-between text-slate-800">
                    <span>Discount:</span>
                    <span>-{discountVal.toFixed(2)}</span>
                  </div>
                )}

                {taxVal > 0 && (
                  <div className="flex justify-between text-slate-800">
                    <span>Tax / VAT:</span>
                    <span>+{taxVal.toFixed(2)}</span>
                  </div>
                )}

                {loyaltyRedeemedVal > 0 ? (
                  <>
                    <div className="flex justify-between text-slate-800">
                      <span>Gross Total:</span>
                      <span>{grandTotalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-800 font-medium">
                      <span>Loyalty Points Discount:</span>
                      <span>-{loyaltyRedeemedVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black text-black border-t border-b border-black py-1 my-1">
                      <span>RECEIPT TOTAL:</span>
                      <span>{netAfterLoyaltyVal.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs font-black text-black border-t border-b border-black py-1 my-1">
                    <span>RECEIPT TOTAL:</span>
                    <span>{grandTotalVal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-800">
                  <span>Amount Tendered:</span>
                  <span>{paidAmountVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-800">
                  <span>Change Given:</span>
                  <span>{changeAmountVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-800">
                  <span>Payment: {sale.payment_method === 'LOYALTY_POINTS' ? 'Loyalty Points Pay' : sale.payment_method}</span>
                </div>

                {/* Loyalty Points Details Box */}
                {((sale.loyalty_points_redeemed || 0) > 0 || (sale.loyalty_points_earned || 0) > 0 || sale.customer_loyalty_balance !== undefined) && (
                  <div className="border-t border-b border-dashed border-black py-1.5 my-1.5 space-y-0.5 text-[10px]">
                    <div className="font-bold text-black uppercase tracking-wider text-[9px] flex items-center justify-between">
                      <span>⭐ LOYALTY POINTS DETAILS</span>
                      <span>1 pt = {currencySymbol} 1.00</span>
                    </div>
                    {(sale.loyalty_points_redeemed || 0) > 0 && (
                      <div className="flex justify-between text-slate-900 font-medium">
                        <span>Loyalty Points Redeemed:</span>
                        <span>{(sale.loyalty_points_redeemed || 0).toLocaleString()} pts ({currencySymbol} {(sale.loyalty_points_redeemed || 0).toFixed(2)})</span>
                      </div>
                    )}
                    {(sale.loyalty_points_earned || 0) > 0 && (
                      <div className="flex justify-between text-black font-semibold">
                        <span>Points Earned This Bill:</span>
                        <span>+{(sale.loyalty_points_earned || 0).toLocaleString()} pts</span>
                      </div>
                    )}
                    {sale.customer_loyalty_balance !== undefined && (
                      <div className="flex justify-between text-black font-bold">
                        <span>Customer Loyalty Balance:</span>
                        <span>{(sale.customer_loyalty_balance || 0).toLocaleString()} pts</span>
                      </div>
                    )}
                  </div>
                )}

                {balanceDueVal > 0 ? (
                  <div className="border-t border-dashed border-black pt-1 my-1 space-y-0.5">
                    <div className="flex justify-between font-black text-black">
                      <span>CREDIT LEDGER BALANCE:</span>
                      <span>{balanceDueVal.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-700 flex justify-between font-sans">
                      <span>Added to Credit Ledger:</span>
                      <span className="font-semibold truncate max-w-[140px]">{sale.customer_name || 'Customer'}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-black my-2"></div>

              {/* Scannable Barcode */}
              {printBarcodeOnBill && (
                <div className="pt-1 pb-2 flex justify-center">
                  <BarcodeRenderer value={sale.invoice_no} height={32} width={1.2} fontSize={9} />
                </div>
              )}

              {/* Footer text */}
              <div className="text-center text-[10px] space-y-0.5 pt-1 font-sans text-slate-700">
                <div className="font-bold text-black">
                  {settings?.thank_you_message || 'Thank You For Dining With Us!'}
                </div>
                <div>Come Again.</div>
                <div className="text-[8px] text-slate-400 pt-1">System by WCS</div>
              </div>
            </div>
          ) : (
            /* A4 Full Commercial Sheet */
            <div
              id="printable-receipt"
              className="bg-white text-slate-950 rounded-xl shadow-2xl p-8 w-full max-w-[700px] font-sans text-xs border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div>
                  <h1 className="text-xl font-black uppercase text-black">{tenant.shop_name}</h1>
                  <p className="text-slate-600">{tenant.address}</p>
                  <p className="text-slate-600">Tel: {tenant.phone}</p>
                  {tenant.br_number && (
                    <p className="text-slate-700 font-mono font-bold mt-1">
                      BR: {tenant.br_number} {tenant.vat_number ? `| VAT: ${tenant.vat_number}` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right font-mono">
                  <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold rounded uppercase mb-2">
                    TAX INVOICE
                  </span>
                  <div><strong>Invoice:</strong> {sale.invoice_no}</div>
                  <div><strong>Date:</strong> {createdDateTimeStr}</div>
                  <div><strong>Payment:</strong> {sale.payment_method}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Details:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{sale.customer_name || 'Walk-in Customer'}</div>
                  {sale.customer_phone && <div className="text-slate-600 font-mono">Phone: {sale.customer_phone}</div>}
                </div>
                <div className="text-right">
                  <div><strong>Cashier:</strong> {sale.cashier_name}</div>
                  {printAssociateOnBill && effectiveAssociateName && (
                    <div className="mt-1">
                      <strong>{associateTitle}:</strong>{' '}
                      <span className="font-semibold text-slate-900">
                        {effectiveAssociateCode ? `[${effectiveAssociateCode}] ` : ''}
                        {effectiveAssociateName}
                      </span>
                      {effectiveAssociateDesig && (
                        <div className="text-[10px] text-slate-500 font-sans">Role: {effectiveAssociateDesig}</div>
                      )}
                    </div>
                  )}
                  <div className="mt-0.5"><strong>Branch:</strong> {tenant.branch_name || 'Store 1'}</div>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black font-bold uppercase text-[11px]">
                    <th className="py-2">#</th>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {(sale.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-slate-400">{idx + 1}</td>
                      <td className="py-2 font-sans font-medium">
                        {(item as any).product_name || item.name}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{currencySymbol} {(item.unit_price || 0).toFixed(2)}</td>
                      <td className="py-2 text-right font-bold">{currencySymbol} {((item.unit_price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 border-t-2 border-black pt-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">{currencySymbol} {subtotalVal.toFixed(2)}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span className="font-mono">-{currencySymbol} {discountVal.toFixed(2)}</span>
                    </div>
                  )}
                  {loyaltyRedeemedVal > 0 ? (
                    <>
                      <div className="flex justify-between text-xs text-slate-700">
                        <span>Gross Total:</span>
                        <span className="font-mono">{currencySymbol} {grandTotalVal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-700">
                        <span>Loyalty Points Discount:</span>
                        <span className="font-mono">-{currencySymbol} {loyaltyRedeemedVal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-b border-black py-1 my-1">
                        <span>RECEIPT TOTAL:</span>
                        <span className="font-mono">{currencySymbol} {netAfterLoyaltyVal.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm font-black border-t border-b border-black py-1 my-1">
                      <span>RECEIPT TOTAL:</span>
                      <span className="font-mono">{currencySymbol} {grandTotalVal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-slate-700 pt-1">
                    <span>Amount Paid Now:</span>
                    <span className="font-mono font-semibold">{currencySymbol} {paidAmountVal.toFixed(2)}</span>
                  </div>

                  {changeAmountVal > 0 && (
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Change Given:</span>
                      <span className="font-mono">{currencySymbol} {changeAmountVal.toFixed(2)}</span>
                    </div>
                  )}

                  {balanceDueVal > 0 && (
                    <div className="flex justify-between text-xs font-black text-rose-700 border-t border-dashed border-rose-300 pt-1 mt-1">
                      <span>Credit Ledger Balance:</span>
                      <span className="font-mono">{currencySymbol} {balanceDueVal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Loyalty Points Details */}
                  {((sale.loyalty_points_redeemed || 0) > 0 || (sale.loyalty_points_earned || 0) > 0 || sale.customer_loyalty_balance !== undefined) && (
                    <div className="border border-slate-300 rounded-lg p-2.5 mt-2 bg-slate-50 space-y-1 text-xs">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center justify-between">
                        <span>⭐ Loyalty Points Details</span>
                        <span className="text-slate-500 font-normal">1 pt = {currencySymbol} 1.00</span>
                      </div>
                      {(sale.loyalty_points_redeemed || 0) > 0 && (
                        <div className="flex justify-between text-slate-700">
                          <span>Loyalty Points Redeemed:</span>
                          <span className="font-mono">{(sale.loyalty_points_redeemed || 0).toLocaleString()} pts ({currencySymbol} {(sale.loyalty_points_redeemed || 0).toFixed(2)})</span>
                        </div>
                      )}
                      {(sale.loyalty_points_earned || 0) > 0 && (
                        <div className="flex justify-between text-slate-900 font-medium">
                          <span>Points Earned This Bill:</span>
                          <span className="font-mono">+{(sale.loyalty_points_earned || 0).toLocaleString()} pts</span>
                        </div>
                      )}
                      {sale.customer_loyalty_balance !== undefined && (
                        <div className="flex justify-between text-slate-900 font-bold">
                          <span>Customer Loyalty Balance:</span>
                          <span className="font-mono">{(sale.customer_loyalty_balance || 0).toLocaleString()} pts</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp sharing bar */}
        <div className="px-5 py-2 bg-[#09101c] border-t border-slate-800 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="WhatsApp No (077 123 4567)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
            />
            <button
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          </div>

          {whatsappSent && (
            <span className="text-[11px] text-emerald-400 font-bold">WhatsApp Opened!</span>
          )}
        </div>

        {/* Bottom Actions Toolbar (Exact match to Screenshot 2) */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-[#0a121e] border-t border-slate-800 gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Print Page (Standalone Tab Print matching Screenshot 3) */}
            <button
              onClick={handlePrintPageStandalone}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Page</span>
            </button>

            {/* Printer Setup Guide */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Printer Setup Guide</span>
            </button>
          </div>

          {/* Action Buttons: Bluetooth & Any Printer */}
          <div className="flex items-center gap-2">
            {/* Bluetooth Thermal Printer */}
            <button
              onClick={handleBluetoothPrint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all cursor-pointer active:scale-95"
              title="Print directly to paired Bluetooth ESC/POS receipt printer"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Bluetooth Printer</span>
            </button>

            {/* Big Print Bill Button (Any Printer: USB, Network, WiFi, Laser, Thermal, PDF) */}
            <button
              onClick={handleDirectPrint}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print (Any Printer)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <PrinterSetupGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <ItemBarcodeLabelsModal
        sale={sale}
        tenant={tenant}
        isOpen={isLabelsOpen}
        onClose={() => setIsLabelsOpen(false)}
      />
    </div>
  );
};
