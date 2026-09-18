import React from 'react';
import { X, Printer, CheckCircle2, Sliders, HelpCircle, Usb } from 'lucide-react';

interface PrinterSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinterSetupGuideModal: React.FC<PrinterSetupGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">POS Thermal Printer Setup Guide</h3>
              <p className="text-[11px] text-slate-400">Settings for 80mm, 58mm ESC/POS, XP-80, Epson, Xprinter & USB</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1: Chrome Print Dialog Settings */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              1. Chrome / Edge Print Dialog Settings (Crucial)
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li><strong>Destination:</strong> Select your thermal printer (e.g. <code>XP-80</code>, <code>POS-80</code>, <code>Epson TM-T88</code>).</li>
              <li><strong>Paper Size:</strong> Choose <code>80mm x Receipt</code> or <code>Roll Paper 80 x 297 mm</code>.</li>
              <li><strong>Margins:</strong> Set to <strong>None</strong> or <strong>Minimum</strong> (avoids extra blank paper roll feeds).</li>
              <li><strong>Headers and Footers:</strong> Uncheck to remove date/URL stamps at the top and bottom.</li>
            </ul>
          </div>

          {/* Step 2: Standalone Tab Printing */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" />
              2. Clean Standalone Tab Printing
            </div>
            <p className="text-[11px] text-slate-300">
              Clicking <strong>"Print Page"</strong> generates an isolated high-resolution document in a separate browser tab, completely eliminating iFrame borders or scaling artifacts for crisp barcode and text reproduction.
            </p>
          </div>

          {/* Step 3: Direct USB / Cash Drawer Auto Kick */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Usb className="w-4 h-4" />
              3. Direct USB Thermal & Cash Drawer Auto-Open
            </div>
            <p className="text-[11px] text-slate-300">
              When connected to an RJ11/RJ12 Cash Drawer via your POS printer, configure your printer driver’s <strong>Device Settings &gt; Cash Drawer &gt; Open Before Printing (Pin 2 / Pin 5)</strong> for automatic drawer pop upon sale confirmation.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
