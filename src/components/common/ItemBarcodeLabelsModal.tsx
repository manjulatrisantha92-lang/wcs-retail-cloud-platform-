import React, { useState } from 'react';
import { Sale, Tenant } from '../../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { openCleanBarcodePrintTab } from '../../utils/printEngine';
import { X, Printer, Tag, Check, Copy } from 'lucide-react';

interface ItemBarcodeLabelsModalProps {
  sale: Sale;
  tenant?: Tenant;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemBarcodeLabelsModal: React.FC<ItemBarcodeLabelsModalProps> = ({
  sale,
  tenant,
  isOpen,
  onClose,
}) => {
  const [labelSize, setLabelSize] = useState<'38x25' | '50x25' | '50x30' | 'A4_24'>('50x25');
  const [copiesPerItem, setCopiesPerItem] = useState<number>(1);

  if (!isOpen) return null;

  const currencySymbol = tenant?.currency_symbol || 'Rs.';

  const handlePrintLabels = () => {
    const itemsToPrint: Array<{
      storeName?: string;
      productName: string;
      price?: number;
      currencySymbol?: string;
      barcode: string;
      sku?: string;
      expiryDate?: string;
    }> = [];

    (sale.items || []).forEach((item) => {
      for (let i = 0; i < copiesPerItem; i++) {
        itemsToPrint.push({
          storeName: tenant?.shop_name || 'WCS SUPERMARKET & RETAIL POS',
          productName: (item as any).product_name || item.name || 'Item',
          price: item.unit_price || 0,
          currencySymbol,
          barcode: (item as any).barcode || (item as any).sku || sale.invoice_no,
          sku: (item as any).sku || sale.invoice_no,
          expiryDate: '2027-01-30',
        });
      }
    });

    const isA4 = labelSize === 'A4_24';
    const widthMm = labelSize === '38x25' ? 38 : labelSize === '50x25' ? 50 : labelSize === '50x30' ? 50 : 63.5;
    const heightMm = labelSize === '38x25' ? 25 : labelSize === '50x25' ? 25 : labelSize === '50x30' ? 30 : 33.9;
    const columns = isA4 ? 3 : labelSize === '50x25' ? 1 : 1;

    openCleanBarcodePrintTab({
      items: itemsToPrint,
      columns,
      widthMm,
      heightMm,
      colGapMm: 4,
      rowGapMm: 4,
      outerMarginMm: 3,
      fields: {
        showStoreName: true,
        showProductName: true,
        showPrice: true,
        showBarcodeText: true,
        showExpiryDate: true,
        showCustomBadge: false,
        showSku: true,
      },
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4 print:bg-white print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-white">Item Barcode Stickers (Sticky Labels)</h3>
              <p className="text-[11px] text-slate-400">Print barcode price tags for items in Invoice #{sale.invoice_no}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Label Size:</span>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            >
              <option value="38x25">38mm × 25mm (Standard Jewelry/Retail)</option>
              <option value="50x30">50mm × 30mm (Supermarket & Tech)</option>
              <option value="A4_24">A4 Sheet (24 Labels per page)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Copies:</span>
            <input
              type="number"
              min="1"
              max="20"
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
            />
          </div>
        </div>

        {/* Printable Labels Grid */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[50vh] overflow-y-auto print:max-h-none print:p-0 print:border-none print:bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3">
            {(sale.items || []).flatMap((item, idx) =>
              Array.from({ length: copiesPerItem }).map((_, cIdx) => (
                <div
                  key={`${idx}-${cIdx}`}
                  className="bg-white text-slate-900 p-2.5 rounded-lg border border-slate-300 flex flex-col items-center justify-between text-center shadow-xs print:border-slate-400 print:shadow-none min-h-[110px]"
                >
                  <div className="text-[9px] font-bold text-slate-800 uppercase line-clamp-1 w-full">
                    {tenant?.shop_name || 'RETAIL STORE'}
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-950 line-clamp-1 w-full my-0.5">
                    {(item as any).product_name || item.name}
                  </div>
                  <div className="my-1 scale-90">
                    <BarcodeRenderer
                      value={(item as any).barcode || (item as any).sku || sale.invoice_no}
                      height={24}
                      width={1.1}
                      fontSize={8}
                    />
                  </div>
                  <div className="text-[11px] font-black text-slate-950 font-mono">
                    {currencySymbol} {(item.unit_price || 0).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handlePrintLabels}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label Stickers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
