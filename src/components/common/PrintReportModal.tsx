import React, { useState } from 'react';
import { Tenant, TenantSettings } from '../../types';
import { useRetail } from '../../context/RetailContext';
import {
  Printer,
  X,
  FileText,
  Download,
  Copy,
  Check,
  Building2,
  Calendar,
  Share2,
  Eye,
  CheckCircle2,
  Table,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  generateReportDocumentHtml,
  openCleanReportPrintTab,
} from '../../utils/printEngine';

export interface ReportKpi {
  label: string;
  value: string;
  sublabel?: string;
  color?: 'default' | 'emerald' | 'rose' | 'indigo' | 'amber' | 'purple';
}

export interface ReportSummaryRow {
  label: string;
  value: string;
  isBold?: boolean;
  isGrandTotal?: boolean;
}

export interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportSubtitle?: string;
  reportCategory?: string;
  dateRangeText?: string;
  tenant?: Tenant;
  settings?: TenantSettings;
  kpis?: ReportKpi[];
  headers: string[];
  rows: (string | number)[][];
  summaryRows?: ReportSummaryRow[];
  footerNotes?: string;
  defaultOrientation?: 'portrait' | 'landscape';
  defaultFormat?: 'a4' | '80mm';
  csvFileName?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  reportSubtitle,
  reportCategory = 'BUSINESS INTELLIGENCE REPORT',
  dateRangeText,
  tenant,
  settings,
  kpis = [],
  headers,
  rows,
  summaryRows = [],
  footerNotes,
  defaultOrientation = 'portrait',
  defaultFormat = 'a4',
  csvFileName,
}) => {
  const { currentTenant, currentSettings, currentUser } = useRetail();

  const activeTenant = tenant || currentTenant;
  const activeSettings = settings || currentSettings;

  const [paperFormat, setPaperFormat] = useState<'a4' | '80mm'>(defaultFormat);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showKpis, setShowKpis] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !activeTenant) return null;

  const currencySymbol = activeTenant.currency_symbol || 'Rs.';
  const generatedDateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const printedByName = currentUser?.full_name || 'Authorized Manager';

  // Direct In-Page Print
  const handleDirectPrint = () => {
    openCleanReportPrintTab({
      title: reportTitle,
      subtitle: reportSubtitle,
      category: reportCategory,
      dateRangeText,
      tenant: activeTenant,
      settings: activeSettings,
      kpis: showKpis ? kpis : [],
      headers,
      rows,
      summaryRows,
      footerNotes,
      isLandscape: orientation === 'landscape',
      format: paperFormat === '80mm' ? '80mm' : orientation === 'landscape' ? 'a4_landscape' : 'a4_portrait',
      showSignatures,
      showLogo,
      printedBy: printedByName,
    });
  };

  // Standalone Clean Print Tab
  const handleOpenCleanTab = () => {
    openCleanReportPrintTab({
      title: reportTitle,
      subtitle: reportSubtitle,
      category: reportCategory,
      dateRangeText,
      tenant: activeTenant,
      settings: activeSettings,
      kpis: showKpis ? kpis : [],
      headers,
      rows,
      summaryRows,
      footerNotes,
      isLandscape: orientation === 'landscape',
      format: paperFormat === '80mm' ? '80mm' : orientation === 'landscape' ? 'a4_landscape' : 'a4_portrait',
      showSignatures,
      showLogo,
      printedBy: printedByName,
    });
  };

  // Download HTML File
  const handleDownloadHtml = () => {
    const htmlContent = generateReportDocumentHtml({
      title: reportTitle,
      subtitle: reportSubtitle,
      category: reportCategory,
      dateRangeText,
      tenant: activeTenant,
      settings: activeSettings,
      kpis: showKpis ? kpis : [],
      headers,
      rows,
      summaryRows,
      footerNotes,
      isLandscape: orientation === 'landscape',
      format: paperFormat === '80mm' ? '80mm' : orientation === 'landscape' ? 'a4_landscape' : 'a4_portrait',
      showSignatures,
      showLogo,
      printedBy: printedByName,
    });
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(csvFileName || reportTitle).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvRows: string[][] = [];
    // Header block
    csvRows.push([activeTenant.shop_name]);
    csvRows.push([reportTitle, dateRangeText || '']);
    csvRows.push([`Generated: ${generatedDateStr}`, `By: ${printedByName}`]);
    csvRows.push([]);

    // KPIs
    if (kpis.length > 0) {
      csvRows.push(['KPI Summary']);
      kpis.forEach((k) => csvRows.push([k.label, `"${k.value}"`]));
      csvRows.push([]);
    }

    // Table Data
    csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`));
    rows.forEach((r) => {
      csvRows.push(r.map((c) => `"${String(c).replace(/"/g, '""')}"`));
    });

    if (summaryRows.length > 0) {
      csvRows.push([]);
      summaryRows.forEach((s) => csvRows.push([`"${s.label}"`, `"${s.value}"`]));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(csvFileName || reportTitle).replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Plain Text Summary
  const handleCopyText = () => {
    let text = `===============================\n`;
    text += `${activeTenant.shop_name.toUpperCase()}\n`;
    text += `${reportTitle}\n`;
    if (dateRangeText) text += `Period: ${dateRangeText}\n`;
    text += `Generated: ${generatedDateStr}\n`;
    text += `===============================\n\n`;

    if (kpis.length > 0) {
      text += `[EXECUTIVE SUMMARY]\n`;
      kpis.forEach((k) => {
        text += `• ${k.label}: ${k.value}\n`;
      });
      text += `\n`;
    }

    text += `[TOTAL RECORDS: ${rows.length}]\n`;
    if (summaryRows.length > 0) {
      summaryRows.forEach((s) => {
        text += `${s.label}: ${s.value}\n`;
      });
    }

    text += `\nReport issued by WCS Retail Cloud Operating System.`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[96vh] text-slate-100 print:max-h-none print:shadow-none print:border-none print:w-full print:bg-white animate-in zoom-in-95">
        
        {/* Top Modal Header Bar (Matching Screenshot 2 & Bill Step) */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#0c1626] print:hidden gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white tracking-wide uppercase">
                  {reportTitle}
                </h2>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[9px] font-bold rounded-md uppercase">
                  A4 Paper Step
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {dateRangeText ? `${dateRangeText} • ` : ''}Generated: {generatedDateStr} • {rows.length} Rows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Size & Layout Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 gap-1">
              <button
                onClick={() => {
                  setPaperFormat('a4');
                  setOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  paperFormat === 'a4' && orientation === 'portrait'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Portrait</span>
              </button>

              <button
                onClick={() => {
                  setPaperFormat('a4');
                  setOrientation('landscape');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  paperFormat === 'a4' && orientation === 'landscape'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>A4 Landscape</span>
              </button>

              <button
                onClick={() => setPaperFormat('80mm')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  paperFormat === '80mm'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>80mm Slip</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Controls / Right Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#080d17]">
          
          {/* Left Configuration & Actions Panel */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            
            {/* Quick Action Print Button */}
            <div className="bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-4.5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>One-Click Printout</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click below to launch the official formatted A4 document printout with shop header, BR/VAT details, KPI summary, and verification signatures.
              </p>

              <button
                onClick={handleDirectPrint}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Printer className="w-4 h-4" />
                <span>Print A4 Document (Direct)</span>
              </button>

              <button
                onClick={handleOpenCleanTab}
                className="w-full py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Clean Standalone Print Tab</span>
              </button>
            </div>

            {/* Document Options */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Document Formatting Options
              </span>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950">
                  <span className="text-slate-300 font-medium">Include Shop Logo</span>
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950">
                  <span className="text-slate-300 font-medium">Include KPI Summary Cards</span>
                  <input
                    type="checkbox"
                    checked={showKpis}
                    onChange={(e) => setShowKpis(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950">
                  <span className="text-slate-300 font-medium">Authorized Signature Lines</span>
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                  />
                </label>
              </div>
            </div>

            {/* Export & Download Tools */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Export & Share Tools
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportCsv}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel / CSV</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/90 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save HTML</span>
                </button>
              </div>

              <button
                onClick={handleCopyText}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700/90 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Plain Text Summary</span>
                  </>
                )}
              </button>
            </div>

            {/* System Security Watermark Notice */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Certified tamper-evident enterprise report document</span>
            </div>
          </div>

          {/* Right: Live A4 Physical Paper Preview */}
          <div className="lg:col-span-8 flex flex-col items-center justify-start overflow-x-auto pb-4">
            
            <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center gap-2 self-start print:hidden">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Live Paper Sheet Preview • {paperFormat === '80mm' ? '80mm POS Thermal Slip' : `A4 (${orientation === 'landscape' ? '297mm × 210mm Landscape' : '210mm × 297mm Portrait'})`}
              </span>
            </div>

            {/* Paper Sheet Container */}
            <div
              className={`bg-white text-slate-950 shadow-2xl border border-slate-300 rounded-xs p-6 sm:p-8 transition-all ${
                paperFormat === '80mm'
                  ? 'w-full max-w-[340px] font-mono text-[11px]'
                  : orientation === 'landscape'
                  ? 'w-full max-w-4xl text-[11px]'
                  : 'w-full max-w-3xl text-[11px]'
              }`}
              style={{
                fontFamily: paperFormat === '80mm' ? 'monospace' : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              }}
            >
              {/* Official Store Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-4">
                <div className="flex items-center gap-3.5">
                  {showLogo && activeTenant.logo_url && (
                    <img
                      src={activeTenant.logo_url}
                      alt={activeTenant.shop_name}
                      className="h-14 w-auto max-w-[120px] object-contain rounded-md border border-slate-200 p-1"
                      referrerPolicy="no-referrer"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  )}
                  <div>
                    <div className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-tight">
                      {activeTenant.shop_name}
                    </div>
                    {activeTenant.company_name && (
                      <div className="text-[10px] text-slate-600 font-semibold">
                        {activeTenant.company_name}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600">
                      {activeTenant.address} {activeTenant.phone ? `• Tel: ${activeTenant.phone}` : ''}
                    </div>
                    {activeTenant.br_number && (
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        BR: {activeTenant.br_number} {activeTenant.vat_number ? `• VAT: ${activeTenant.vat_number}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                    {reportCategory}
                  </span>
                  <div className="text-sm sm:text-base font-black text-slate-900 uppercase mt-1">
                    {reportTitle}
                  </div>
                  {dateRangeText && (
                    <div className="text-[10px] text-slate-600 font-medium">
                      Period: <span className="font-bold text-slate-800">{dateRangeText}</span>
                    </div>
                  )}
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Generated: {generatedDateStr}
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              {showKpis && kpis.length > 0 && (
                <div
                  className={`grid gap-2.5 mb-5 ${
                    kpis.length === 2
                      ? 'grid-cols-2'
                      : kpis.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {kpis.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-md p-2.5 space-y-0.5"
                    >
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        {kpi.label}
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        {kpi.value}
                      </div>
                      {kpi.sublabel && (
                        <div className="text-[9px] text-slate-500 font-medium">
                          {kpi.sublabel}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Table Data */}
              <div className="overflow-x-auto mb-4 border border-slate-300 rounded-sm">
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                      {headers.map((h, i) => (
                        <th
                          key={i}
                          className={`p-2 font-black uppercase text-[9.5px] tracking-wide border-r border-slate-200 last:border-r-0 ${
                            h.toLowerCase().includes('price') ||
                            h.toLowerCase().includes('cost') ||
                            h.toLowerCase().includes('total') ||
                            h.toLowerCase().includes('amount') ||
                            h.toLowerCase().includes('balance') ||
                            h.toLowerCase().includes('value') ||
                            h.toLowerCase().includes('margin') ||
                            h.toLowerCase().includes('qty') ||
                            h.toLowerCase().includes('count')
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                      >
                        {row.map((cell, colIdx) => {
                          const strCell = String(cell);
                          const isNumeric =
                            typeof cell === 'number' ||
                            strCell.startsWith(currencySymbol) ||
                            strCell.startsWith('$') ||
                            strCell.startsWith('Rs.') ||
                            strCell.endsWith('%') ||
                            (!isNaN(Number(strCell)) && strCell.trim() !== '');

                          return (
                            <td
                              key={colIdx}
                              className={`p-2 border-r border-slate-200 last:border-r-0 text-slate-800 ${
                                isNumeric ? 'text-right font-mono font-medium' : 'text-left'
                              }`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Rows / Totals */}
              {summaryRows.length > 0 && (
                <div className="bg-slate-50 border border-slate-300 rounded-sm p-3 mb-5 space-y-1 text-xs">
                  {summaryRows.map((s, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center ${
                        s.isGrandTotal
                          ? 'pt-1.5 border-t border-slate-300 font-black text-sm text-indigo-950'
                          : s.isBold
                          ? 'font-bold text-slate-900'
                          : 'text-slate-600'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className="font-mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Signatures & Verification Block */}
              {showSignatures && (
                <div className="grid grid-cols-3 gap-6 pt-6 mt-6 border-t border-slate-300 text-center text-[10px] text-slate-700">
                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <div className="font-bold uppercase">Prepared By</div>
                    <div className="text-[9px] text-slate-500">{printedByName}</div>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <div className="font-bold uppercase">Checked & Verified By</div>
                    <div className="text-[9px] text-slate-500">Store Supervisor</div>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 mb-1 pb-4"></div>
                    <div className="font-bold uppercase">Authorized Signatory</div>
                    <div className="text-[9px] text-slate-500">Managing Director</div>
                  </div>
                </div>
              )}

              {/* Official Document Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 pt-4 mt-6 border-t border-slate-200">
                <div>{footerNotes || 'Official WCS Retail Cloud Document • All figures verified'}</div>
                <div className="font-mono">Page 1 of 1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0c1626] flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-400 font-mono">
            Format: <span className="text-slate-200 font-bold uppercase">{paperFormat} ({orientation})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDirectPrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Now</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
