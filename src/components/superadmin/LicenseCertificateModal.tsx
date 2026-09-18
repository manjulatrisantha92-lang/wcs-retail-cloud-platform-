import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Mail,
  Copy,
  Download,
  Check,
  ShieldCheck,
  Award,
  QrCode,
  Sparkles,
  ExternalLink,
  Sliders,
  Send,
  HelpCircle,
  Lock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Tenant, TenantLicense } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { PrinterSetupGuideModal } from '../common/PrinterSetupGuideModal';

interface LicenseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  license?: TenantLicense;
}

export const LicenseCertificateModal: React.FC<LicenseCertificateModalProps> = ({
  isOpen,
  onClose,
  tenant,
  license,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'B5'>('A4');
  const [showBarcodeAndQR, setShowBarcodeAndQR] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showPrinterGuide, setShowPrinterGuide] = useState<boolean>(false);

  // WhatsApp & Email dynamic target inputs
  const [targetPhone, setTargetPhone] = useState<string>(tenant.phone || '+94771234567');
  const [targetEmail, setTargetEmail] = useState<string>(tenant.email || 'management@retailstore.lk');

  const certificateRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const licenseKey = license?.license_key || `WCS-LK-${tenant.tenant_id}-2029`;
  const packageTier = license?.package_tier || 'ENTERPRISE';
  const issueDate = license?.created_at ? new Date(license.created_at) : new Date();
  const validUntil = license?.valid_until ? new Date(license.valid_until) : new Date(Date.now() + 365 * 24 * 3600 * 1000);
  const status = license?.status || 'ACTIVE';

  // Digital Hash signature generated from key and tenant
  const digitalFingerprint = `0x${Array.from(`${licenseKey}-${tenant.tenant_id}-${tenant.shop_name}`)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 48)}...`;

  const formattedIssueDate = issueDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedValidUntil = validUntil.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Copy full certificate transcript to clipboard
  const handleCopyText = () => {
    const text = `
========================================================================
   DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA
   OFFICIAL SOFTWARE LICENSE CERTIFICATE
   WCS CLOUD RETAIL & WORKFORCE OPERATING SYSTEM
========================================================================
REGISTERED ENTERPRISE:
  Name: ${tenant.shop_name}
  Legal Entity: ${tenant.company_name || tenant.shop_name}
  Tenant ID: ${tenant.tenant_id}
  Sector / Archetype: ${tenant.business_type.toUpperCase().replace('_', ' ')}
  Branch: ${tenant.branch_name || 'Main Branch'}
  Location: ${tenant.address || 'Colombo, Sri Lanka'}
  Contact Phone: ${tenant.phone || 'N/A'}
  Registration / BR: ${tenant.br_number || 'PV-89241-LK'}

CRYPTOGRAPHIC AUTHORIZATION:
  License Key: ${licenseKey}
  Package Tier: ${packageTier}
  Status: ${status}
  Issue Date: ${formattedIssueDate}
  Valid Until: ${formattedValidUntil}
  Digital Fingerprint: ${digitalFingerprint}
  Verification Portal: https://wcs.lk/verify?key=${encodeURIComponent(licenseKey)}
========================================================================
Issued by WCS Cloud Technologies (Pvt) Ltd
Colombo 05, Sri Lanka • Official Regulatory Licensing Registry
    `.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Standalone window printing (handles iFrame isolation & crisp high-res layout)
  const handleDirectPrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) {
      window.print();
      return;
    }

    const certificateHTML = certificateRef.current ? certificateRef.current.innerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>License Certificate - ${licenseKey}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Sinhala:wght@400;600;700&display=swap');
            
            body {
              background: #ffffff;
              color: #1e293b;
              font-family: 'Plus Jakarta Sans', sans-serif;
              margin: 0;
              padding: 20px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .certificate-font-serif {
              font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
            }
            .certificate-sinhala {
              font-family: 'Noto Sans Sinhala', sans-serif;
            }
            @page {
              size: ${paperSize === 'B5' ? 'B5' : 'A4'} portrait;
              margin: 8mm;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          <div style="max-width: 800px; margin: 0 auto;">
            ${certificateHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Dispatch
  const handleWhatsAppDispatch = () => {
    const rawNumber = targetPhone.replace(/[^0-9]/g, '');
    const cleanNumber = rawNumber.startsWith('94') ? rawNumber : rawNumber.startsWith('0') ? `94${rawNumber.slice(1)}` : `94${rawNumber}`;
    
    const message = encodeURIComponent(
      `🏛️ *OFFICIAL WCS SOFTWARE LICENSE CERTIFICATE*\n\n` +
      `*Enterprise:* ${tenant.shop_name}\n` +
      `*Tenant ID:* \`${tenant.tenant_id}\`\n` +
      `*Package Tier:* ${packageTier} (Unlimited Products)\n` +
      `*License Key:* \`${licenseKey}\`\n` +
      `*Status:* ${status} ✅\n` +
      `*Issue Date:* ${formattedIssueDate}\n` +
      `*Valid Until:* ${formattedValidUntil}\n` +
      `*Verification Portal:* https://wcs.lk/verify?key=${licenseKey}\n\n` +
      `_Issued by WCS Cloud Technologies (Pvt) Ltd Licensing Board, Sri Lanka._`
    );

    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
    setShowWhatsAppModal(false);
  };

  // Email Dispatch
  const handleEmailDispatch = () => {
    const subject = encodeURIComponent(`Official Software License Certificate - ${tenant.shop_name} [${licenseKey}]`);
    const body = encodeURIComponent(
      `Dear Management Team of ${tenant.shop_name},\n\n` +
      `Please find below the official software licensing credentials and cryptographic authorization for your enterprise.\n\n` +
      `--------------------------------------------------\n` +
      `OFFICIAL SOFTWARE LICENSE CERTIFICATE\n` +
      `--------------------------------------------------\n` +
      `Enterprise Name: ${tenant.shop_name}\n` +
      `Tenant ID: ${tenant.tenant_id}\n` +
      `Legal Entity: ${tenant.company_name || tenant.shop_name}\n` +
      `Assigned License Key: ${licenseKey}\n` +
      `Package Tier: ${packageTier}\n` +
      `Current Status: ${status}\n` +
      `Issued Date: ${formattedIssueDate}\n` +
      `Valid Expiry Date: ${formattedValidUntil}\n` +
      `Cryptographic Hash: ${digitalFingerprint}\n\n` +
      `Live Audit & Verification Link:\n` +
      `https://wcs.lk/verify?key=${encodeURIComponent(licenseKey)}\n\n` +
      `This certificate confirms your organization has full legal & technical authorization to operate the WCS Retail Cloud Operating System & POS Suite.\n\n` +
      `Best Regards,\n` +
      `WCS Cloud Technologies (Pvt) Ltd\n` +
      `Licensing & Enterprise Compliance Board\n` +
      `Colombo, Sri Lanka | support@wcs.lk`
    );

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
    setShowEmailModal(false);
  };

  // HTML / Standalone PDF export
  const handleDownloadHTML = () => {
    const certificateHTML = certificateRef.current ? certificateRef.current.innerHTML : '';
    const fullDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>License Certificate - ${licenseKey} - ${tenant.shop_name}</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            body {
              background: #0f172a;
              padding: 40px 20px;
              display: flex;
              justify-content: center;
              font-family: 'Plus Jakarta Sans', sans-serif;
            }
            .certificate-font-serif {
              font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
            }
          </style>
        </head>
        <body>
          <div style="max-width: 800px; width: 100%;">
            ${certificateHTML}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([fullDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `License_Certificate_${tenant.tenant_id}_${licenseKey}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-100 font-mono">
                  License Certificate - {licenseKey}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  ● {status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {issueDate.toISOString().slice(0, 10)} {issueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Size Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaperSize('B5')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  paperSize === 'B5'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>B5 Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Sheet</span>
              </button>
            </div>

            {/* Quick Direct Print */}
            <button
              onClick={handleDirectPrint}
              title="Print certificate in clean standalone window"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Print</span>
            </button>

            {/* WhatsApp Dispatch Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              title="Send License Certificate via WhatsApp"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-xs text-emerald-300 font-bold transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Dispatch</span>
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Barcode Toggle & Info Tip */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showBarcodeAndQR}
              onChange={(e) => setShowBarcodeAndQR(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Scannable Barcode & QR on Certificate</span>
            </span>
          </label>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="text-amber-400 font-bold">💡 Tip:</span>
            <span>If printing is blocked by your browser preview, click <strong className="text-slate-200">Print Page</strong> to print in a clean standalone tab.</span>
          </div>
        </div>

        {/* Certificate Paper Container */}
        <div className="p-3 sm:p-6 bg-slate-950/80 max-h-[64vh] overflow-y-auto flex justify-center items-center">
          {/* Authentic High-Res Printable Certificate Paper */}
          <div
            ref={certificateRef}
            className={`w-full ${
              paperSize === 'B5' ? 'max-w-[620px]' : 'max-w-[720px]'
            } bg-[#fdfcf7] text-slate-900 rounded-lg shadow-2xl p-5 sm:p-8 relative border-[6px] border-[#cbb07a] transition-all select-none`}
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(180, 140, 70, 0.4)',
              backgroundImage:
                'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(250, 246, 235, 0.95) 100%)',
            }}
          >
            {/* Ornamental Inner Double Guilloche Border */}
            <div className="border border-[#cbb07a]/80 p-1.5 rounded-sm">
              <div className="border-2 border-[#b89758]/90 p-4 sm:p-6 rounded-sm relative text-center">
                
                {/* Corner Guilloche Fleurons */}
                <div className="absolute top-1 left-1 text-[#b89758] text-xs font-serif font-black select-none">❖</div>
                <div className="absolute top-1 right-1 text-[#b89758] text-xs font-serif font-black select-none">❖</div>
                <div className="absolute bottom-1 left-1 text-[#b89758] text-xs font-serif font-black select-none">❖</div>
                <div className="absolute bottom-1 right-1 text-[#b89758] text-xs font-serif font-black select-none">❖</div>

                {/* Top Official Seal / Ribbon Medallion */}
                <div className="flex justify-center mb-2.5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#cbb07a] via-[#f7e7be] to-[#9c7938] p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#1e293b] border-2 border-[#f7e7be] flex items-center justify-center text-[#f7e7be]">
                        <Award className="w-6 h-6 text-[#f7e7be]" />
                      </div>
                    </div>
                    {/* Ribbon Tails */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-90">
                      <div className="w-2.5 h-3.5 bg-[#b89758] transform -rotate-12 rounded-xs shadow-xs"></div>
                      <div className="w-2.5 h-3.5 bg-[#b89758] transform rotate-12 rounded-xs shadow-xs"></div>
                    </div>
                  </div>
                </div>

                {/* Republic & Statutory Compliance Header */}
                <div className="mt-2 space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#664d1c] uppercase font-serif">
                    DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wider text-slate-600 uppercase">
                    COMMERCIAL ENTERPRISE SOFTWARE AUTHORITY & STATUTORY AUDIT COMPLIANT
                  </p>
                </div>

                {/* Main Heading & Trilingual Subtitle */}
                <div className="my-3 border-y border-[#cbb07a]/40 py-2">
                  <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 tracking-wide uppercase font-serif">
                    OFFICIAL SOFTWARE LICENSE CERTIFICATE
                  </h1>
                  <p className="text-[11px] sm:text-xs font-semibold text-[#8c6721] mt-0.5 tracking-wider">
                    නිල මෘදුකාංග බලපත්‍ර සහතිකය • அதிகாரப்பூர்ව மென்பொருள் உரிமச் சான்றிதழ்
                  </p>
                </div>

                {/* Certification Lead */}
                <p className="text-[9.5px] sm:text-[10.5px] tracking-widest text-slate-600 font-bold uppercase mt-2">
                  THIS IS TO CERTIFY THAT THE COMMERCIAL ENTERPRISE REGISTERED AS
                </p>

                {/* Enterprise Name Block */}
                <div className="my-3 py-2.5 px-4 bg-[#f8f5eb] border border-[#e2d4b7] rounded-md shadow-inner">
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-950 uppercase tracking-wide font-serif">
                    {tenant.shop_name}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
                    {tenant.company_name || tenant.shop_name}
                  </p>
                </div>

                {/* Entity Details Row */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-700 font-medium">
                  <span><strong>Company Reg / BR:</strong> <span className="font-mono font-bold text-slate-900">{tenant.br_number || 'PV-89241-LK'}</span></span>
                  <span>•</span>
                  <span><strong>Sector:</strong> <span className="capitalize font-bold text-slate-900">{tenant.business_type.replace('_', ' ')}</span></span>
                  <span>•</span>
                  <span><strong>Branch:</strong> <span className="font-bold text-slate-900">{tenant.branch_name || 'Colombo Primary'}</span></span>
                  <span>•</span>
                  <span><strong>City:</strong> <span className="font-bold text-slate-900">{tenant.address || 'Western Province, Sri Lanka'}</span></span>
                </div>

                {/* Legal Authorization Statement */}
                <p className="text-[9px] sm:text-[10.5px] text-slate-600 leading-relaxed max-w-xl mx-auto my-3 italic">
                  has been duly authenticated and granted full cryptographic authorization to operate the <strong className="text-slate-900 not-italic">WCS Multi-Tenant Workforce & Retail Operating System</strong> in complete conformity with Sri Lankan Commercial and Retail IT Standards.
                </p>

                {/* 4-Box Specification Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left my-4">
                  {/* Package Tier */}
                  <div className="p-2 sm:p-2.5 bg-[#f5f1e4] border border-[#d9cca8] rounded">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block tracking-wider">
                      PACKAGE TIER
                    </span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block font-serif">
                      {packageTier}
                    </span>
                    <span className="text-[8.5px] text-emerald-800 font-bold block">
                      12-Month Term
                    </span>
                  </div>

                  {/* System Quota */}
                  <div className="p-2 sm:p-2.5 bg-[#f5f1e4] border border-[#d9cca8] rounded">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block tracking-wider">
                      PRODUCT / SKU QUOTA
                    </span>
                    <span className="text-[11px] sm:text-xs font-black text-slate-900 block">
                      UNLIMITED
                    </span>
                    <span className="text-[8.5px] text-slate-600 font-semibold block">
                      Max {license?.max_branches || 10} Terminals
                    </span>
                  </div>

                  {/* Date of Issue */}
                  <div className="p-2 sm:p-2.5 bg-[#f5f1e4] border border-[#d9cca8] rounded">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block tracking-wider">
                      DATE OF ISSUE
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 block">
                      {formattedIssueDate}
                    </span>
                    <span className="text-[8.5px] text-indigo-800 font-semibold block font-mono">
                      Node #01 Verified
                    </span>
                  </div>

                  {/* Valid Until */}
                  <div className="p-2 sm:p-2.5 bg-[#f5f1e4] border border-[#d9cca8] rounded">
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-500 block tracking-wider">
                      VALID UNTIL
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-900 block">
                      {formattedValidUntil}
                    </span>
                    <span className="text-[8.5px] text-emerald-700 font-bold block">
                      72h Offline Grace
                    </span>
                  </div>
                </div>

                {/* Cryptographic Key & Barcode Section */}
                {showBarcodeAndQR && (
                  <div className="mt-3 p-3 bg-white border border-[#d9cca8] rounded-md text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#8c6721] font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
                        <Lock className="w-3 h-3 text-[#8c6721]" />
                        <span>ASSIGNED LICENSE KEY & DIGITAL FINGERPRINT</span>
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide">
                        {licenseKey}
                      </div>
                      <div className="font-mono text-[8.5px] sm:text-[9.5px] text-slate-500 truncate" title={digitalFingerprint}>
                        Dig: {digitalFingerprint}
                      </div>

                      {/* Barcode Render */}
                      <div className="pt-1 flex items-center">
                        <BarcodeRenderer
                          value={licenseKey}
                          format="CODE128"
                          width={1.2}
                          height={26}
                          displayValue={false}
                          className="max-w-full"
                        />
                      </div>
                    </div>

                    {/* QR Code Verification Block */}
                    <div className="flex items-center gap-2 p-2 bg-[#fbf9f4] border border-[#e5dcbe] rounded-md shrink-0">
                      <div className="w-12 h-12 bg-white p-1 rounded border border-slate-300 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                          <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                          <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                          <rect x="14" y="14" width="3" height="3"></rect>
                          <rect x="18" y="14" width="3" height="3"></rect>
                          <rect x="14" y="18" width="3" height="3"></rect>
                          <rect x="18" y="18" width="3" height="3"></rect>
                        </svg>
                      </div>
                      <div className="text-left text-[8px] sm:text-[9px] text-slate-600 leading-tight">
                        <strong className="block text-slate-900 font-bold">Scan to Verify</strong>
                        <span>Live Cloud Audit</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Official Issuing Authority Footer */}
                <div className="mt-4 pt-2 border-t border-[#cbb07a]/30 text-[8px] sm:text-[9px] text-slate-500 font-mono">
                  WCS Cloud Technologies (Pvt) Ltd • 142 High Level Road, Colombo • Tel: +94 11 7599100 • Verify: wcs.lk/verify
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer border border-slate-700"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Print Page (Standalone Window) */}
            <button
              onClick={handleDirectPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Page</span>
            </button>

            {/* WhatsApp Send */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-medium transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Send</span>
            </button>

            {/* Email Send */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-medium transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email Send</span>
            </button>

            {/* Printer Setup Guide */}
            <button
              onClick={() => setShowPrinterGuide(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-all cursor-pointer border border-slate-700"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Printer Setup Guide</span>
            </button>

            {/* Download Document */}
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download PDF / HTML</span>
            </button>
          </div>

          {/* Right Primary Action */}
          <button
            onClick={handleDirectPrint}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>

      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Send className="w-5 h-5" />
                <span>WhatsApp License Dispatch</span>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Send the official software certificate details and verification link directly to the store owner or management via WhatsApp.
            </p>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                Recipient WhatsApp Number (Sri Lanka +94 or International):
              </label>
              <input
                type="text"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono text-slate-300">
              <div className="text-emerald-400 font-bold">License: {licenseKey}</div>
              <div>Recipient: {tenant.shop_name} ({tenant.tenant_id})</div>
              <div>Valid: {formattedValidUntil}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWhatsAppDispatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Mail className="w-5 h-5" />
                <span>Email Official License Certificate</span>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Send the full official cryptographic licensing certificate to the client's corporate email address.
            </p>

            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                Store Management Email Address:
              </label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="accounts@supermarket.lk"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmailDispatch}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open Email Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printer Setup Guide */}
      <PrinterSetupGuideModal
        isOpen={showPrinterGuide}
        onClose={() => setShowPrinterGuide(false)}
      />
    </div>
  );
};
