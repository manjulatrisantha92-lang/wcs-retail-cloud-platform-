import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { openCleanBarcodePrintTab } from '../../utils/printEngine';
import {
  Barcode,
  Printer,
  Download,
  Eye,
  Sliders,
  Grid,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  Check,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from 'lucide-react';

interface LabelPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  defaultCols: number;
  description: string;
}

const LABEL_PRESETS: LabelPreset[] = [
  {
    id: '50x25',
    name: '50mm × 25mm (Standard) — Standard 2"x1" Jewellery / Retail Label (Dual / Single)',
    widthMm: 50,
    heightMm: 25,
    defaultCols: 1,
    description: 'Most popular thermal barcode label in Sri Lanka retail',
  },
  {
    id: '38x25',
    name: '38mm × 25mm — Standard 1-Column Retail Shelf Label',
    widthMm: 38,
    heightMm: 25,
    defaultCols: 1,
    description: 'Standard single-column shelf edge sticker',
  },
  {
    id: '40x30',
    name: '40mm × 30mm — Compact Box & Auto Spare Parts Label',
    widthMm: 40,
    heightMm: 30,
    defaultCols: 1,
    description: 'Auto parts, electronic accessory boxes & pharmacy boxes',
  },
  {
    id: '50x30',
    name: '50mm × 30mm — Master Carton & Wholesale Tag',
    widthMm: 50,
    heightMm: 30,
    defaultCols: 1,
    description: 'Supermarket bulk boxes, clothing price tags & wholesale',
  },
  {
    id: '30x20',
    name: '30mm × 20mm — Small Pharmacy & Electronic Barcode',
    widthMm: 30,
    heightMm: 20,
    defaultCols: 2,
    description: 'Mobile phone repairs, spare parts & medicine strips',
  },
  {
    id: '20x10',
    name: '20mm × 10mm — Micro Jewellery & Tiny Components',
    widthMm: 20,
    heightMm: 10,
    defaultCols: 3,
    description: 'Micro jewelry tags, gold rings, watch batteries',
  },
  {
    id: '100x50',
    name: '100mm × 50mm — Large Shipping & Logistics Label',
    widthMm: 100,
    heightMm: 50,
    defaultCols: 1,
    description: 'Courier parcels, large wholesale sacks & pallet boxes',
  },
  {
    id: 'a4_24',
    name: 'A4 (3x8 = 24 Labels) — Standard A4 Sheet Sticker Paper',
    widthMm: 63.5,
    heightMm: 33.9,
    defaultCols: 3,
    description: 'Standard laser / inkjet sticker paper sheet',
  },
];

interface BatchItem {
  product: Product;
  copies: number;
}

export const BarcodeLabelStudio: React.FC = () => {
  const { products, categories, currentTenant, queuePrintJob } = useRetail();

  const safeProducts = useMemo(() => products || [], [products]);
  const safeCategories = useMemo(() => categories || [], [categories]);

  // Mode: Single vs Batch
  const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single Product State
  const [selectedProductId, setSelectedProductId] = useState<string>(
    safeProducts[0]?.id || ''
  );
  const [singleCopies, setSingleCopies] = useState<number>(2);

  // Batch Mode State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Columns & Gaps
  const [columns, setColumns] = useState<number>(1);
  const [colGapMm, setColGapMm] = useState<number>(4.0);
  const [rowGapMm, setRowGapMm] = useState<number>(4);
  const [outerMarginMm, setOuterMarginMm] = useState<number>(3);

  // Size Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>('50x25');

  // Visible Fields
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBarcodeText, setShowBarcodeText] = useState<boolean>(true);
  const [showExpiryDate, setShowExpiryDate] = useState<boolean>(true);
  const [showCustomBadge, setShowCustomBadge] = useState<boolean>(false);

  // Preview Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Category dropdown for batch
  const [showCatDropdown, setShowCatDropdown] = useState<boolean>(false);

  const selectedPreset =
    LABEL_PRESETS.find((p) => p.id === selectedPresetId) || LABEL_PRESETS[0];

  const selectedProduct =
    safeProducts.find((p) => p.id === selectedProductId) || safeProducts[0];

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  // Default expiry date generator for preview (e.g. 1 year ahead)
  const getProductExpiry = (prod?: Product) => {
    if (prod?.batches && prod.batches.length > 0 && prod.batches[0].expiry_date) {
      return prod.batches[0].expiry_date;
    }
    return '2027-01-30';
  };

  // Compile list of labels to render / print
  const printableLabels = useMemo(() => {
    if (mode === 'SINGLE') {
      if (!selectedProduct) return [];
      return Array.from({ length: singleCopies }).map(() => ({
        storeName: currentTenant?.shop_name || 'WCS SUPERMARKET & RETAIL POS',
        productName: selectedProduct.name,
        price: selectedProduct.selling_price || 0,
        currencySymbol: currencySymbol,
        barcode: selectedProduct.barcode || selectedProduct.sku || '4792011001012',
        sku: selectedProduct.sku || 'SKU-001',
        expiryDate: getProductExpiry(selectedProduct),
        customBadge: showCustomBadge
          ? selectedProduct.brand || selectedProduct.category || 'GENUINE'
          : undefined,
      }));
    } else {
      // Batch mode
      const list: Array<{
        storeName?: string;
        productName: string;
        price: number;
        currencySymbol: string;
        barcode: string;
        sku: string;
        expiryDate: string;
        customBadge?: string;
      }> = [];

      batchItems.forEach((b) => {
        for (let i = 0; i < b.copies; i++) {
          list.push({
            storeName: currentTenant?.shop_name || 'WCS SUPERMARKET & RETAIL POS',
            productName: b.product.name,
            price: b.product.selling_price || 0,
            currencySymbol: currencySymbol,
            barcode: b.product.barcode || b.product.sku || '4792011001012',
            sku: b.product.sku || 'SKU-001',
            expiryDate: getProductExpiry(b.product),
            customBadge: showCustomBadge
              ? b.product.brand || b.product.category || 'GENUINE'
              : undefined,
          });
        }
      });

      return list;
    }
  }, [
    mode,
    selectedProduct,
    singleCopies,
    batchItems,
    currentTenant,
    currencySymbol,
    showCustomBadge,
  ]);

  const totalLabelCount = printableLabels.length;

  // Add low stock items to batch
  const handleAddLowStockToBatch = () => {
    const lowStock = safeProducts.filter(
      (p) => (p.stock_quantity || 0) <= (p.reorder_level || 5)
    );
    if (lowStock.length === 0) {
      alert('All products are currently well-stocked!');
      return;
    }

    const newBatch = [...batchItems];
    lowStock.forEach((p) => {
      const exists = newBatch.find((b) => b.product.id === p.id);
      if (exists) {
        exists.copies += 6;
      } else {
        newBatch.push({ product: p, copies: 6 });
      }
    });

    setBatchItems(newBatch);
    setMode('BATCH');
  };

  // Add all products in a category to batch
  const handleAddCategoryToBatch = (catName: string) => {
    const catProds = safeProducts.filter((p) => p.category === catName);
    if (catProds.length === 0) return;

    const newBatch = [...batchItems];
    catProds.forEach((p) => {
      const exists = newBatch.find((b) => b.product.id === p.id);
      if (exists) {
        exists.copies += 2;
      } else {
        newBatch.push({ product: p, copies: 2 });
      }
    });

    setBatchItems(newBatch);
    setMode('BATCH');
    setShowCatDropdown(false);
  };

  // Print Handler
  const handlePrintLabels = () => {
    if (printableLabels.length === 0) {
      alert('No labels to print. Please select products.');
      return;
    }

    queuePrintJob(
      'BARCODE',
      `Barcode Print (${totalLabelCount} Labels) - ${selectedPreset.name}`,
      `Cols: ${columns} | Gap: ${colGapMm}mm | Preset: ${selectedPreset.id}`
    );

    openCleanBarcodePrintTab({
      items: printableLabels,
      columns: columns,
      widthMm: selectedPreset.widthMm,
      heightMm: selectedPreset.heightMm,
      colGapMm: colGapMm,
      rowGapMm: rowGapMm,
      outerMarginMm: outerMarginMm,
      fields: {
        showStoreName,
        showProductName,
        showPrice,
        showBarcodeText,
        showExpiryDate,
        showCustomBadge,
        showSku: true,
      },
    });
  };

  // Download PDF / HTML Export Handler
  const handleDownloadPdf = () => {
    if (printableLabels.length === 0) return;
    const printWindow = openCleanBarcodePrintTab({
      items: printableLabels,
      columns: columns,
      widthMm: selectedPreset.widthMm,
      heightMm: selectedPreset.heightMm,
      colGapMm: colGapMm,
      rowGapMm: rowGapMm,
      outerMarginMm: outerMarginMm,
      fields: {
        showStoreName,
        showProductName,
        showPrice,
        showBarcodeText,
        showExpiryDate,
        showCustomBadge,
        showSku: true,
      },
    });
    if (printWindow) {
      setTimeout(() => {
        try {
          printWindow.document.title = `Barcode_Labels_${selectedPreset.id}_${new Date().toISOString().slice(0, 10)}`;
        } catch (e) {
          // ignore
        }
      }, 500);
    }
  };

  const getColDescription = (c: number) => {
    switch (c) {
      case 1:
        return 'Single continuous roll tape (1 across)';
      case 2:
        return 'Dual sticker roll (2 across with 4mm gap)';
      case 3:
        return '3 across standard jewellery roll';
      case 4:
        return '4 across barcode labels';
      case 5:
        return '5 across micro component tags';
      default:
        return `${c} columns across roll / sheet`;
    }
  };

  return (
    <div className="bg-[#0b1329] text-slate-100 min-h-screen p-4 sm:p-6 space-y-5 select-none rounded-2xl border border-slate-800/80 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono text-base font-black">
              ||||
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Thermal Barcode & Label Generator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-column thermal roll printing with exact 4mm column spacing & bill item barcode generation
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700/80 flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrintLabels}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Print Labels ({totalLabelCount})</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Category Batch Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0f172a]/90 p-2.5 rounded-2xl border border-slate-800">
        {/* Left Mode Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('SINGLE')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'SINGLE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Single Product Mode</span>
          </button>

          <button
            onClick={() => setMode('BATCH')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              mode === 'BATCH'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch & Bill Items Mode ({batchItems.length} items)</span>
          </button>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={handleAddLowStockToBatch}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Low Stock Batch</span>
          </button>

          {/* Add Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCatDropdown(!showCatDropdown)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Add Category...</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCatDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 max-h-60 overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Queue all products in category
                </div>
                {safeCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAddCategoryToBatch(c.name)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-400">
                      (
                      {
                        safeProducts.filter((p) => p.category === c.name).length
                      }
                      )
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: Column & 4mm Gap Settings */}
          <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-md">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Column & 4mm Gap Settings
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                {columns} Col • {colGapMm}mm Gap
              </span>
            </div>

            {/* Sticker Columns Across */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Sticker Columns across Sheet / Roll
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((col) => (
                  <button
                    key={col}
                    onClick={() => setColumns(col)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      columns === col
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 shadow-inner'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {col} Col{col > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic pt-0.5">
                {getColDescription(columns)}
              </p>
            </div>

            {/* Column-to-Column Gap */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">
                  Column-to-Column Gap (Horizontal spacing)
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {colGapMm.toFixed(1)} mm
                </span>
              </div>

              {/* Quick Gap Chips */}
              <div className="grid grid-cols-5 gap-1.5">
                {[2, 3, 4, 5, 6].map((gap) => (
                  <button
                    key={gap}
                    onClick={() => setColGapMm(gap)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      colGapMm === gap
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {gap}mm{gap === 4 ? '★' : ''}
                  </button>
                ))}
              </div>

              {/* Slider + Input */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={colGapMm}
                  onChange={(e) => setColGapMm(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    value={colGapMm}
                    onChange={(e) =>
                      setColGapMm(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-10 bg-transparent text-xs font-mono font-bold text-emerald-400 text-center focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">mm</span>
                </div>
              </div>
            </div>

            {/* Row Gap & Outer Margin */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Row Gap (Vertical)
                </label>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={rowGapMm}
                    onChange={(e) =>
                      setRowGapMm(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Outer Margin
                </label>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={outerMarginMm}
                    onChange={(e) =>
                      setOuterMarginMm(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-12 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Sticker Size & Source */}
          <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Sticker Size & Source
              </span>
            </div>

            {/* Sticker Preset Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Sticker Preset / Label Size
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {LABEL_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Single Product Selector (When Single Mode) */}
            {mode === 'SINGLE' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Select Product to Print
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {safeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — SKU: {p.sku} ({currencySymbol}{' '}
                      {(p.selling_price || 0).toLocaleString()}) [Stock:{' '}
                      {p.stock_quantity || 0}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Number of Sticker Copies */}
            {mode === 'SINGLE' && (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Number of Sticker Copies
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={singleCopies}
                    onChange={(e) =>
                      setSingleCopies(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-20 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-center text-emerald-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {[6, 12, 24, 48, 100].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setSingleCopies(qty)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          singleCopies === qty
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Batch List Manager (When Batch Mode) */}
            {mode === 'BATCH' && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Queued Products ({batchItems.length})
                  </span>
                  <button
                    onClick={() => setBatchItems([])}
                    className="text-[10px] text-rose-400 hover:text-rose-300"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {batchItems.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                      No items in batch yet. Add via dropdown or Low Stock button.
                    </div>
                  ) : (
                    batchItems.map((b, idx) => (
                      <div
                        key={b.product.id}
                        className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate">
                            {b.product.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {b.product.sku} • {currencySymbol}{' '}
                            {b.product.selling_price}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={b.copies}
                            onChange={(e) => {
                              const val = Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              );
                              const updated = [...batchItems];
                              updated[idx].copies = val;
                              setBatchItems(updated);
                            }}
                            className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-emerald-400 text-xs"
                          />
                          <button
                            onClick={() => {
                              setBatchItems(
                                batchItems.filter((_, i) => i !== idx)
                              );
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add product to batch selector */}
                <div className="pt-2">
                  <select
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const prod = safeProducts.find(
                        (p) => p.id === e.target.value
                      );
                      if (prod) {
                        const exists = batchItems.find(
                          (b) => b.product.id === prod.id
                        );
                        if (exists) {
                          exists.copies += 2;
                          setBatchItems([...batchItems]);
                        } else {
                          setBatchItems([
                            ...batchItems,
                            { product: prod, copies: 2 },
                          ]);
                        }
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
                  >
                    <option value="">+ Add Individual Product to Batch...</option>
                    {safeProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Visible Fields on Sticker */}
          <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Visible Fields on Sticker
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Store Name</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) => setShowProductName(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Product Name</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Selling Price</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBarcodeText}
                  onChange={(e) => setShowBarcodeText(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Barcode Text</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExpiryDate}
                  onChange={(e) => setShowExpiryDate(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Expiry Date</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomBadge}
                  onChange={(e) => setShowCustomBadge(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-slate-200 font-medium">Custom Badge</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Multi-Column Optical Layout Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col h-full min-h-[640px]">
            {/* Live Preview Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live Multi-Column Layout ({columns} Columns Across • {colGapMm}mm Gap)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {totalLabelCount} Labels ({selectedPreset.widthMm}×
                  {selectedPreset.heightMm}mm)
                </span>

                {/* Zoom indicator */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-300">
                  <button
                    onClick={() => setZoomLevel(Math.max(60, zoomLevel - 20))}
                    className="text-slate-400 hover:text-white"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[10px]">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(180, zoomLevel + 20))}
                    className="text-slate-400 hover:text-white"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Simulated Live Sheet / Continuous Roll Viewport */}
            <div className="flex-1 bg-[#050a14] rounded-xl border border-slate-800/80 p-6 flex items-start justify-center overflow-auto max-h-[720px] shadow-inner">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  padding: `${outerMarginMm * 2}px`,
                }}
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex justify-center"
              >
                {/* CSS Grid with dynamic columns and gap matching millimeter scale */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, ${
                      selectedPreset.widthMm * 4.2
                    }px)`,
                    columnGap: `${colGapMm * 4.2}px`,
                    rowGap: `${rowGapMm * 4.2}px`,
                  }}
                >
                  {printableLabels.slice(0, 16).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: `${selectedPreset.widthMm * 4.2}px`,
                        height: `${selectedPreset.heightMm * 4.2}px`,
                        minHeight: `${selectedPreset.heightMm * 4.2}px`,
                      }}
                      className="bg-white text-slate-950 rounded-xs p-2 shadow-2xl border border-slate-300 flex flex-col justify-between text-center select-none font-sans overflow-hidden transition-all"
                    >
                      {/* Store Name Header */}
                      {showStoreName && (
                        <div className="text-[8.5px] font-black uppercase tracking-tight text-slate-800 truncate leading-tight">
                          {item.storeName}
                        </div>
                      )}

                      {/* Product Name */}
                      {showProductName && (
                        <div className="text-[9.5px] font-extrabold text-slate-950 leading-tight my-0.5 line-clamp-2">
                          {item.productName}
                        </div>
                      )}

                      {/* Selling Price */}
                      {showPrice && (
                        <div className="text-[12px] font-black text-slate-950 leading-tight">
                          {item.currencySymbol}{' '}
                          {(item.price || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}

                      {/* Barcode Graphic */}
                      <div className="my-0.5 flex flex-col items-center justify-center overflow-hidden">
                        <BarcodeRenderer
                          value={item.barcode}
                          height={selectedPreset.heightMm > 22 ? 26 : 18}
                          width={1.1}
                          displayValue={showBarcodeText}
                          fontSize={8}
                        />
                      </div>

                      {/* Footer Row: SKU & Expiry Date */}
                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-200 text-[7.5px] font-mono font-bold text-slate-700">
                        <span className="truncate max-w-[95px]">
                          SKU: {item.sku}
                        </span>
                        {showExpiryDate && item.expiryDate && (
                          <span className="truncate">
                            EXP: {item.expiryDate}
                          </span>
                        )}
                        {showCustomBadge && item.customBadge && (
                          <span className="bg-slate-900 text-white px-1 rounded text-[7px]">
                            {item.customBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom notification indicator */}
            {printableLabels.length > 16 && (
              <div className="text-center text-xs text-slate-400 font-semibold pt-2">
                Previewing first 16 labels (+{printableLabels.length - 16} more will print)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
