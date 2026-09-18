import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Upload,
  Image as ImageIcon,
  Eye,
  FolderPlus,
  Sparkles,
  FileSpreadsheet,
  Download,
  Check,
  Keyboard,
  Save,
  Calendar,
  ShieldAlert,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import { ExcelDataStudio } from './ExcelDataStudio';

interface ProductManagerProps {
  onOpenBarcodeStudio?: () => void;
  onOpenCategoryStudio?: () => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  onOpenBarcodeStudio,
  onOpenCategoryStudio,
}) => {
  const {
    products,
    categories,
    customFields,
    currentTenant,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    language,
    t,
  } = useRetail();

  const safeProducts = products || [];
  const safeCategories = categories || [];

  // Curated list of suggested brands for hardware, automobile, electronics, grocery, and all retail
  const suggestedHardwareBrands = useMemo(() => {
    const fromInventory = Array.from(
      new Set(safeProducts.map((p) => p.brand?.trim()).filter((b): b is string => !!b && b.length > 0))
    );

    const defaultPresets = [
      'S-Lon',
      'Orange',
      'Tokyo Cement',
      'Lanwa Steel',
      'Bosch',
      'Makita',
      'DeWalt',
      'Stanley',
      'Total Tools',
      'Ingco',
      'Crown',
      'Alumex',
      'Anton',
      'Kevilton',
      'Kelani Cables',
      'ACL Cables',
      'National',
      'Schneider Electric',
      'INSEE Cement',
      'Rhino Roofing',
      'Dulux',
      'Nippon Paint',
      'Multilac',
      'Asian Paints',
      'St. Anthony\'s',
      'Finlays',
      'Hayleys',
      'DSI',
      'Toyota',
      'Nissan',
      'Honda',
      'Samsung',
      'Apple',
      'Huawei',
      'Xiaomi',
      'Munchee',
      'Maliban',
      'Nestle',
      'Unilever',
    ];

    return Array.from(new Set([...fromInventory, ...defaultPresets]));
  }, [safeProducts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'IN_STOCK' | 'DAMAGED' | 'EXPIRED' | 'EXPIRING_SOON'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelStudioOpen, setIsExcelStudioOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Category Modal State
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Delete State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Image Preview Lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nameSi, setNameSi] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(safeCategories[0]?.name || 'General');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState<Product['unit']>('pcs');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Manufacture & Expiry Date states
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Optional Damaged Product states
  const [damagedQuantity, setDamagedQuantity] = useState<number>(0);
  const [damagedReason, setDamagedReason] = useState('');
  const [damagedDate, setDamagedDate] = useState('');
  const [isDamagedSectionOpen, setIsDamagedSectionOpen] = useState(false);

  // Quick Damaged Stock Log Modal for individual table rows
  const [damageModalProduct, setDamageModalProduct] = useState<Product | null>(null);
  const [quickDamagedQty, setQuickDamagedQty] = useState<number>(0);
  const [quickDamagedReason, setQuickDamagedReason] = useState<string>('Broken Packaging / Transit');

  // File upload & form input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Preset Expiry Calculator (+3M, +6M, +1Y, +2Y, +3Y)
  const applyExpiryPreset = (monthsToAdd: number) => {
    const base = manufactureDate ? new Date(manufactureDate) : new Date();
    if (isNaN(base.getTime())) return;
    const future = new Date(base);
    future.setMonth(future.getMonth() + monthsToAdd);
    setExpiryDate(future.toISOString().slice(0, 10));
  };

  // Expiry status calculator
  const getExpiryStatus = (expDate?: string) => {
    if (!expDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    if (isNaN(exp.getTime())) return null;
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'EXPIRED' as const,
        days: Math.abs(diffDays),
        label: `Expired (${expDate})`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    }
    if (diffDays <= 30) {
      return {
        status: 'CRITICAL' as const,
        days: diffDays,
        label: `Expires in ${diffDays}d!`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      };
    }
    if (diffDays <= 60) {
      return {
        status: 'WARNING' as const,
        days: diffDays,
        label: `Exp: ${expDate} (${diffDays}d)`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    return {
      status: 'GOOD' as const,
      days: diffDays,
      label: `EXP: ${expDate}`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Save quick damage log from table row
  const handleSaveQuickDamage = () => {
    if (!damageModalProduct) return;
    const qty = Number(quickDamagedQty);
    if (isNaN(qty) || qty < 0) {
      showToast('Please enter a valid non-negative damaged quantity', 'error');
      return;
    }
    updateProduct(damageModalProduct.id, {
      damaged_quantity: qty,
      damaged_reason: quickDamagedReason.trim() || undefined,
      damaged_date: qty > 0 ? new Date().toISOString().slice(0, 10) : undefined,
    });
    showToast(
      qty > 0
        ? `Logged ${qty} ${damageModalProduct.unit} damaged for "${damageModalProduct.name}". Reflects in Stock Valuation Report!`
        : `Cleared damaged stock record for "${damageModalProduct.name}"`
    );
    setDamageModalProduct(null);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setNameSi('');
    setNameTa('');
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode(`479${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setCategory(safeCategories[0]?.name || 'General');
    setBrand('');
    setUnit(currentTenant?.business_type === 'grocery' ? 'kg' : 'pcs');
    setCostPrice(0);
    setSellingPrice(0);
    setWholesalePrice(0);
    setStockQuantity(10);
    setReorderLevel(5);
    setImageUrl('');
    setCustomFieldValues({});
    setManufactureDate('');
    setExpiryDate('');
    setDamagedQuantity(0);
    setDamagedReason('');
    setDamagedDate('');
    setIsDamagedSectionOpen(false);
    setIsModalOpen(true);
    setTimeout(() => {
      productNameInputRef.current?.focus();
    }, 60);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setNameSi(p.name_si || '');
    setNameTa(p.name_ta || '');
    setSku(p.sku);
    setBarcode(p.barcode);
    setCategory(p.category);
    setBrand(p.brand);
    setUnit(p.unit);
    setCostPrice(p.cost_price);
    setSellingPrice(p.selling_price);
    setWholesalePrice(p.wholesale_price);
    setStockQuantity(p.stock_quantity);
    setReorderLevel(p.reorder_level);
    setImageUrl(p.image_url || '');
    setCustomFieldValues(p.custom_fields || {});
    setManufactureDate(p.manufacture_date || '');
    setExpiryDate(p.expiry_date || '');
    setDamagedQuantity(p.damaged_quantity || 0);
    setDamagedReason(p.damaged_reason || '');
    setDamagedDate(p.damaged_date || '');
    setIsDamagedSectionOpen((p.damaged_quantity || 0) > 0);
    setIsModalOpen(true);
    setTimeout(() => {
      productNameInputRef.current?.focus();
    }, 60);
  };

  // Image Upload File Handler (JPG, PNG, WebP)
  const processImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid JPG or image file format', 'error');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
      showToast(`JPG Image "${file.name}" loaded successfully!`);
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveProduct = (e?: React.FormEvent, shouldClose: boolean = true) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a product title / name', 'error');
      productNameInputRef.current?.focus();
      return false;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: name.trim(),
        name_si: nameSi.trim() || undefined,
        name_ta: nameTa.trim() || undefined,
        sku: sku.trim(),
        barcode: barcode.trim(),
        category,
        brand: brand.trim(),
        unit,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        wholesale_price: Number(wholesalePrice || sellingPrice),
        stock_quantity: Number(stockQuantity),
        reorder_level: Number(reorderLevel),
        image_url: imageUrl.trim() || undefined,
        custom_fields: customFieldValues,
        manufacture_date: manufactureDate.trim() || undefined,
        expiry_date: expiryDate.trim() || undefined,
        damaged_quantity: Number(damagedQuantity) > 0 ? Number(damagedQuantity) : 0,
        damaged_reason: damagedReason.trim() || undefined,
        damaged_date: Number(damagedQuantity) > 0 ? (damagedDate || new Date().toISOString().slice(0, 10)) : undefined,
      });
      showToast(`Product "${name}" updated successfully!`);
    } else {
      addProduct({
        name: name.trim(),
        name_si: nameSi.trim() || undefined,
        name_ta: nameTa.trim() || undefined,
        sku: sku.trim(),
        barcode: barcode.trim(),
        category,
        brand: brand.trim(),
        unit,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        wholesale_price: Number(wholesalePrice || sellingPrice),
        stock_quantity: Number(stockQuantity),
        reorder_level: Number(reorderLevel),
        is_active: true,
        image_url: imageUrl.trim() || undefined,
        custom_fields: customFieldValues,
        manufacture_date: manufactureDate.trim() || undefined,
        expiry_date: expiryDate.trim() || undefined,
        damaged_quantity: Number(damagedQuantity) > 0 ? Number(damagedQuantity) : 0,
        damaged_reason: damagedReason.trim() || undefined,
        damaged_date: Number(damagedQuantity) > 0 ? (damagedDate || new Date().toISOString().slice(0, 10)) : undefined,
      });
      showToast(
        shouldClose
          ? `New master product "${name}" added to catalog!`
          : `Saved "${name}"! Ready to add next master product.`
      );
    }

    if (shouldClose) {
      setIsModalOpen(false);
    } else {
      // Save & Add New: Keep modal open, generate fresh codes, and reset form for the next product
      setEditingProduct(null);
      setName('');
      setNameSi('');
      setNameTa('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(`479${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setBrand('');
      setCostPrice(0);
      setSellingPrice(0);
      setWholesalePrice(0);
      setStockQuantity(10);
      setReorderLevel(5);
      setImageUrl('');
      setCustomFieldValues({});
      setManufactureDate('');
      setExpiryDate('');
      setDamagedQuantity(0);
      setDamagedReason('');
      setDamagedDate('');
      setIsDamagedSectionOpen(false);
      setTimeout(() => {
        productNameInputRef.current?.focus();
      }, 60);
    }

    return true;
  };

  // Keyboard Shortcuts Listener:
  // - When modal is closed: F2, Alt+N, or Insert opens "Add Master Product"
  // - When modal is open:
  //    * F2 or Ctrl+S: Save & Close
  //    * Ctrl+Enter or F3: Save & Add New (Continue adding master products)
  //    * Escape: Cancel / Close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. When Master Product Modal is OPEN:
      if (isModalOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsModalOpen(false);
        } else if (e.key === 'F2' || ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S'))) {
          e.preventDefault();
          handleSaveProduct(undefined, true);
        } else if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
          e.preventDefault();
          handleSaveProduct(undefined, false);
        }
      } else {
        // 2. When Master Product Modal is CLOSED:
        if (e.key === 'F2' || (e.altKey && (e.key === 'n' || e.key === 'N')) || e.key === 'Insert') {
          // Verify no other popups are active
          if (!isExcelStudioOpen && !isQuickCategoryOpen && !productToDelete && !lightboxImage) {
            e.preventDefault();
            handleOpenAdd();
          }
        } else if (e.key === 'Escape') {
          if (lightboxImage) setLightboxImage(null);
          else if (productToDelete) setProductToDelete(null);
          else if (isQuickCategoryOpen) setIsQuickCategoryOpen(false);
          else if (isExcelStudioOpen) setIsExcelStudioOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalOpen,
    isExcelStudioOpen,
    isQuickCategoryOpen,
    productToDelete,
    lightboxImage,
    name,
    nameSi,
    nameTa,
    sku,
    barcode,
    category,
    brand,
    unit,
    costPrice,
    sellingPrice,
    wholesalePrice,
    stockQuantity,
    reorderLevel,
    imageUrl,
    customFieldValues,
    editingProduct,
  ]);

  const handleConfirmDelete = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    showToast(`Product "${productToDelete.name}" deleted from catalog.`);
    setProductToDelete(null);
  };

  const handleQuickAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;

    addCategory({
      name: quickCategoryName.trim(),
      color: '#4f46e5',
    });

    setCategory(quickCategoryName.trim());
    setQuickCategoryName('');
    setIsQuickCategoryOpen(false);
    showToast(`Category "${quickCategoryName}" created!`);
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter Products
  const filteredProducts = safeProducts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = p.stock_quantity <= p.reorder_level;
    } else if (stockFilter === 'IN_STOCK') {
      matchesStock = p.stock_quantity > p.reorder_level;
    } else if (stockFilter === 'DAMAGED') {
      matchesStock = (p.damaged_quantity || 0) > 0;
    } else if (stockFilter === 'EXPIRED') {
      if (!p.expiry_date) {
        matchesStock = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(p.expiry_date);
        exp.setHours(0, 0, 0, 0);
        matchesStock = exp.getTime() < today.getTime();
      }
    } else if (stockFilter === 'EXPIRING_SOON') {
      if (!p.expiry_date) {
        matchesStock = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(p.expiry_date);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        matchesStock = diffDays >= 0 && diffDays <= 60;
      }
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = safeProducts.filter((p) => p.stock_quantity <= p.reorder_level).length;
  const damagedProductsCount = safeProducts.filter((p) => (p.damaged_quantity || 0) > 0).length;
  const totalDamagedQuantity = safeProducts.reduce((acc, p) => acc + (p.damaged_quantity || 0), 0);
  const totalDamagedCostLoss = safeProducts.reduce(
    (acc, p) => acc + (p.damaged_quantity || 0) * (p.cost_price || 0),
    0
  );

  const expiredProductsCount = safeProducts.filter((p) => {
    if (!p.expiry_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(p.expiry_date);
    exp.setHours(0, 0, 0, 0);
    return exp.getTime() < today.getTime();
  }).length;

  const expiringSoonCount = safeProducts.filter((p) => {
    if (!p.expiry_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(p.expiry_date);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 ${
            toastMsg.type === 'error'
              ? 'bg-rose-900 text-white border border-rose-700'
              : 'bg-emerald-900 text-white border border-emerald-700'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Item Master Catalog
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Unlimited Products (No Limit)
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Products & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Add, update, or remove products, upload JPG item photos, configure barcode tags, track live stock levels, and customize industry attributes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenCategoryStudio && (
            <button
              onClick={onOpenCategoryStudio}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Unlimited Categories ({safeCategories.length})</span>
            </button>
          )}

          {onOpenBarcodeStudio && (
            <button
              onClick={onOpenBarcodeStudio}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Barcode className="w-4 h-4 text-slate-600" />
              <span>Print Barcodes</span>
            </button>
          )}

          <button
            onClick={() => setIsExcelStudioOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Import / Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
            title="Create new master product catalog item (Shortcut: F2 or Alt+N)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Master Product</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-indigo-700/80 text-indigo-100 rounded font-mono font-bold tracking-tight">
              F2
            </kbd>
          </button>
        </div>
      </div>

      {/* Quick KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Catalog Items</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{safeProducts.length}</div>
          <span className="text-[10px] text-slate-400">{safeCategories.length} categories</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-emerald-600 font-semibold uppercase block">In-Stock Items</span>
          <div className="text-xl font-black text-emerald-700 mt-0.5">
            {safeProducts.filter((p) => p.stock_quantity > p.reorder_level).length}
          </div>
          <span className="text-[10px] text-emerald-600">Salable inventory</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-amber-600 font-semibold uppercase block">Low Stock Alert</span>
          <div className="text-xl font-black text-amber-600 mt-0.5">{lowStockCount}</div>
          <span className="text-[10px] text-amber-600">Reorder needed</span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-600 font-semibold uppercase block">Damaged Stock Loss</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-700 mt-0.5">
            {currencySymbol} {totalDamagedCostLoss.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">
            {totalDamagedQuantity} units ({damagedProductsCount} items)
          </span>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-600 font-semibold uppercase block">Expiry Risks</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            <span className={expiredProductsCount > 0 ? 'text-rose-600' : 'text-slate-900'}>
              {expiredProductsCount}
            </span>
            <span className="text-xs font-semibold text-slate-400 font-normal"> / {expiringSoonCount} soon</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {expiredProductsCount > 0 ? `${expiredProductsCount} expired discard` : 'All dates healthy'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, barcode, brand..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="ALL">All Categories ({safeProducts.length})</option>
            {safeCategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden focus:border-indigo-500"
          >
            <option value="ALL">All Stock Levels ({safeProducts.length})</option>
            <option value="LOW">Low Stock Alerts Only ({lowStockCount})</option>
            <option value="IN_STOCK">Adequate Stock Only</option>
            <option value="DAMAGED">Damaged Stock Only ({damagedProductsCount} items)</option>
            <option value="EXPIRED">Expired Items Only ({expiredProductsCount})</option>
            <option value="EXPIRING_SOON">Expiring in 60 Days ({expiringSoonCount})</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-2xs">
            <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shortcut: <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-indigo-600 text-[10px]">F2</kbd> or <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono font-bold text-indigo-600 text-[10px]">Alt+N</kbd> for Add Master Product</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong>{filteredProducts.length}</strong> of {safeProducts.length} products
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Item / Photo</th>
                <th className="py-3 px-4">Category & Brand</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Stock & Damaged</th>
                <th className="py-3 px-4">MFG / Expiry Date</th>
                <th className="py-3 px-4">Attributes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting filters or press <kbd className="font-mono font-bold text-indigo-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">F2</kbd> to add a master product.
                    </p>
                    <button
                      onClick={handleOpenAdd}
                      className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Master Product [F2]</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock_quantity <= p.reorder_level;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <div
                              onClick={() => setLightboxImage({ url: p.image_url!, title: p.name })}
                              className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 cursor-pointer group relative shadow-2xs hover:ring-2 hover:ring-indigo-500 transition-all"
                            >
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Eye className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{language === 'si' && p.name_si ? p.name_si : language === 'ta' && p.name_ta ? p.name_ta : p.name}</span>
                              {p.image_url && (
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                                  JPG
                                </span>
                              )}
                            </div>
                            {(p.name_si || p.name_ta) && (
                              <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                                {p.name_si && <span className="text-slate-600 font-sinhala">{p.name_si}</span>}
                                {p.name_si && p.name_ta && <span className="text-slate-300">•</span>}
                                {p.name_ta && <span className="text-slate-600 font-tamil">{p.name_ta}</span>}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Unit: <span className="font-semibold text-slate-600 uppercase">{p.unit}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {p.category}
                        </span>
                        {p.brand && <div className="text-[10px] text-slate-400 mt-0.5">{p.brand}</div>}
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-800 font-medium">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.barcode}</div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">
                          {currencySymbol} {(p.selling_price || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {currencySymbol} {(p.cost_price || 0).toLocaleString()}
                        </div>
                        {p.wholesale_price && p.wholesale_price !== p.selling_price && (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            WS: {currencySymbol} {p.wholesale_price.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Stock & Damaged */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs ${
                              p.stock_quantity === 0
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {p.stock_quantity} {p.unit}
                          </span>
                          {isLow && (
                            <span
                              className="p-0.5 rounded bg-amber-100 text-amber-700"
                              title="Low stock threshold reached"
                            >
                              <AlertTriangle className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Reorder at: {p.reorder_level}</div>
                        {(p.damaged_quantity || 0) > 0 && (
                          <div className="mt-1 pt-1 border-t border-rose-100 flex flex-col gap-0.5">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit"
                              title={p.damaged_reason ? `Reason: ${p.damaged_reason} (${p.damaged_date || 'N/A'})` : 'Recorded damaged/breakage'}
                            >
                              <AlertOctagon className="w-2.5 h-2.5 text-rose-500" />
                              {p.damaged_quantity} {p.unit} Damaged
                            </span>
                            <span className="text-[9px] text-rose-600 font-medium">
                              Loss: {currencySymbol} {((p.damaged_quantity || 0) * (p.cost_price || 0)).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* MFG & Expiry Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.expiry_date ? (
                          <div className="space-y-1">
                            {(() => {
                              const expStatus = getExpiryStatus(p.expiry_date);
                              return expStatus ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] border font-medium ${expStatus.badgeClass}`}
                                >
                                  {expStatus.label}
                                </span>
                              ) : null;
                            })()}
                            {p.manufacture_date && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>MFG: {p.manufacture_date}</span>
                              </div>
                            )}
                          </div>
                        ) : p.manufacture_date ? (
                          <div className="text-[10px] text-slate-600">
                            MFG: <strong className="text-slate-800">{p.manufacture_date}</strong>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Custom Attributes Snapshot */}
                      <td className="py-3 px-4 max-w-xs">
                        {p.custom_fields && Object.keys(p.custom_fields).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(p.custom_fields).map(([k, val]) => (
                              <span
                                key={k}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[140px]"
                                title={`${k}: ${val}`}
                              >
                                <strong>{k.replace('_', ' ')}:</strong> {String(val)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setDamageModalProduct(p);
                              setQuickDamagedQty(p.damaged_quantity || 0);
                              setQuickDamagedReason(p.damaged_reason || 'Broken Packaging / Transit');
                            }}
                            title="Log or adjust damaged stock (breakage, leakage, discard)"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              (p.damaged_quantity || 0) > 0
                                ? 'text-rose-700 bg-rose-100 hover:bg-rose-200'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit product"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(p)}
                            title="Delete product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {editingProduct ? 'Edit Product Item' : 'Add New Master Product'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {editingProduct
                      ? 'Update item details, prices, barcode, or industry custom fields'
                      : 'Create a new master catalog item with instant SKU, barcode, and pricing'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-200/70 border border-slate-300/60 px-2.5 py-1 rounded-lg">
                  <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
                  <span><kbd className="font-mono font-bold text-slate-900">F2</kbd> Save & Close</span>
                  <span className="text-slate-400">•</span>
                  <span><kbd className="font-mono font-bold text-slate-900">Ctrl+↵</kbd> Save & Add New</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleSaveProduct(e, true)} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Product Image JPG Upload Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Product Item Photo (JPG / Image):</span>
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Image Preview Box */}
                  <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0 relative group">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                        <span className="text-[9px] block">No JPG</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2">
                    {/* Drag & Drop File Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                        isDraggingFile
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold">
                        <Upload className="w-4 h-4" />
                        <span>Upload JPG / Image from Device</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Drag and drop JPG file here or click to browse (up to 5MB)
                      </p>
                    </div>

                    {/* Or URL input */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Or Image URL:</span>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Basic Details & Multilingual Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center justify-between">
                    <span>Product Title (English): *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Primary catalog name</span>
                  </label>
                  <input
                    ref={productNameInputRef}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Keeri Samba Rice 5kg / Toyota Brake Pad Set"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                {/* Multilingual Names (Sinhala & Tamil) */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                    <span className="text-xs">🇱🇰</span>
                    <span>Sinhala Name (සිංහල නම):</span>
                  </label>
                  <input
                    type="text"
                    value={nameSi}
                    onChange={(e) => setNameSi(e.target.value)}
                    placeholder="උදා: කීරි සම්බා සහල් 5kg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-sinhala"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                    <span className="text-xs">🇱🇰</span>
                    <span>Tamil Name (தமிழ் பெயர்):</span>
                  </label>
                  <input
                    type="text"
                    value={nameTa}
                    onChange={(e) => setNameTa(e.target.value)}
                    placeholder="எ.கா: கீரி சம்பா அரிசி 5kg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white font-tamil"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU / Item Code: *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Barcode (EAN-13 / Code 128): *
                  </label>
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>

                {/* Category with Quick Add Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Category:</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCategoryOpen(true)}
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    {safeCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand / Manufacturer (Manual Add & Select Optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-semibold text-xs">
                      Brand / Manufacturer <span className="text-slate-400 font-normal">(Optional):</span>
                    </label>
                    {brand && (
                      <button
                        type="button"
                        onClick={() => setBrand('')}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                      >
                        Clear Brand
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      list="brand-suggestions-list"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Type manually or select brand (e.g. S-Lon, Bosch, Orange, Toyota)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <datalist id="brand-suggestions-list">
                      {suggestedHardwareBrands.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  {/* Quick select brand chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                    {suggestedHardwareBrands.slice(0, 6).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrand(b)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-colors cursor-pointer ${
                          brand === b
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Unit of Measure:</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="pack">Pack</option>
                    <option value="box">Box / Carton</option>
                    <option value="can">Can / Bottle</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reorder Alert Level:</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Pricing & Stock Grid */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Pricing & Inventory Control ({currencySymbol})
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[10px] font-semibold mb-1">Cost Price:</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-semibold mb-1">
                      Selling Price (POS):
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full bg-white border border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-indigo-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-semibold mb-1">Wholesale Price:</label>
                    <input
                      type="number"
                      step="any"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-semibold mb-1">Current Stock Qty:</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* MANUFACTURE & EXPIRY DATE (MFG / EXP) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Manufacture & Expiry Dates (MFG / EXP)
                  </div>
                  {expiryDate && (
                    <div>
                      {(() => {
                        const status = getExpiryStatus(expiryDate);
                        return status ? (
                          <span className={`px-2 py-0.5 rounded border text-[10px] ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 text-[10px] font-semibold mb-1">
                      Manufacture Date (MFG):
                    </label>
                    <input
                      type="date"
                      value={manufactureDate}
                      onChange={(e) => setManufactureDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Date product was manufactured or packed</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 text-[10px] font-semibold">
                        Expiry Date (EXP):
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-400 font-medium">Quick +</span>
                        <button
                          type="button"
                          onClick={() => applyExpiryPreset(3)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          title="Set expiry date to +3 months"
                        >
                          +3M
                        </button>
                        <button
                          type="button"
                          onClick={() => applyExpiryPreset(6)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          title="Set expiry date to +6 months"
                        >
                          +6M
                        </button>
                        <button
                          type="button"
                          onClick={() => applyExpiryPreset(12)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          title="Set expiry date to +1 year"
                        >
                          +1Y
                        </button>
                        <button
                          type="button"
                          onClick={() => applyExpiryPreset(24)}
                          className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-bold cursor-pointer"
                          title="Set expiry date to +2 years"
                        >
                          +2Y
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">Tracked in Expiry Item reports & batch alerts</span>
                  </div>
                </div>
              </div>

              {/* DAMAGED STOCK / SHRINKAGE (OPTIONAL) */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Damaged / Broken Stock (Optional)
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDamagedSectionOpen(!isDamagedSectionOpen)}
                    className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                  >
                    {isDamagedSectionOpen
                      ? 'Hide Details'
                      : damagedQuantity > 0
                      ? `${damagedQuantity} ${unit} logged`
                      : '+ Log Damaged Units'}
                  </button>
                </div>

                <p className="text-[11px] text-amber-800/90 leading-tight">
                  Record breakage, seal failure, leaks, or spoiled units. This damaged value is <strong>automatically reflected in the Official Stock Valuation Report</strong>.
                </p>

                {(isDamagedSectionOpen || damagedQuantity > 0) && (
                  <div className="space-y-3 pt-2 border-t border-amber-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 text-[10px] font-semibold mb-1">
                          Damaged Units ({unit}):
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={damagedQuantity}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setDamagedQuantity(val);
                            if (val > 0 && !damagedDate) {
                              setDamagedDate(new Date().toISOString().slice(0, 10));
                            }
                          }}
                          placeholder="0"
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-rose-700 font-bold focus:outline-hidden focus:border-rose-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 text-[10px] font-semibold mb-1">
                          Damage Reason / Cause:
                        </label>
                        <select
                          value={damagedReason}
                          onChange={(e) => setDamagedReason(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-rose-500"
                        >
                          <option value="">-- Select Cause --</option>
                          <option value="Broken Packaging / Transit">Broken Packaging / Transit</option>
                          <option value="Leaked / Seal Broken">Leaked / Seal Broken</option>
                          <option value="Handling / Dropped in Store">Handling / Dropped in Store</option>
                          <option value="Rodent / Pest Damage">Rodent / Pest Damage</option>
                          <option value="Water / Moisture Damage">Water / Moisture Damage</option>
                          <option value="Perished / Spoiled Goods">Perished / Spoiled Goods</option>
                          <option value="Other / Factory Defect">Other / Factory Defect</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 text-[10px] font-semibold mb-1">
                          Date Identified:
                        </label>
                        <input
                          type="date"
                          value={damagedDate}
                          onChange={(e) => setDamagedDate(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {damagedQuantity > 0 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                          <span className="text-rose-900 font-bold">
                            Recorded Loss: {damagedQuantity} {unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-600">
                            Cost Loss: <strong className="text-rose-700">{currencySymbol} {(damagedQuantity * costPrice).toLocaleString()}</strong>
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600">
                            Retail Loss: <strong className="text-rose-700">{currencySymbol} {(damagedQuantity * sellingPrice).toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DYNAMIC CUSTOM FIELDS SECTION */}
              {customFields.length > 0 && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-indigo-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                      Dynamic Custom Attributes for {currentTenant?.business_type.replace('_', ' ')}:
                    </div>
                    <span className="text-[10px] text-indigo-600 font-medium">Auto-configured</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFields.map((cf) => {
                      const currentVal = customFieldValues[cf.field_key] ?? '';
                      return (
                        <div key={cf.id}>
                          <label className="block text-slate-700 text-[11px] font-semibold mb-1">
                            {cf.field_label} {cf.is_required && <span className="text-rose-500">*</span>}
                          </label>

                          {cf.field_type === 'select' ? (
                            <select
                              value={currentVal}
                              required={cf.is_required}
                              onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            >
                              <option value="">-- Select {cf.field_label} --</option>
                              {cf.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : cf.field_type === 'number' ? (
                            <input
                              type="number"
                              required={cf.is_required}
                              value={currentVal}
                              onChange={(e) => handleCustomFieldChange(cf.field_key, Number(e.target.value))}
                              placeholder={cf.placeholder}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          ) : (
                            <input
                              type="text"
                              required={cf.is_required}
                              value={currentVal}
                              onChange={(e) => handleCustomFieldChange(cf.field_key, e.target.value)}
                              placeholder={cf.placeholder}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form Actions with Save & Add New and Save & Close buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 bg-slate-50/70 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
                {/* Keyboard Shortcuts Legend Bar */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                  <Keyboard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Shortcuts:</span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-medium">
                    <kbd className="font-mono text-indigo-600 font-bold">F2</kbd> or <kbd className="font-mono text-indigo-600 font-bold">Ctrl+S</kbd> Save & Close
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-medium">
                    <kbd className="font-mono text-emerald-600 font-bold">Ctrl+↵</kbd> or <kbd className="font-mono text-emerald-600 font-bold">F3</kbd> Save & Add New
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-medium">
                    <kbd className="font-mono text-slate-600 font-bold">Esc</kbd> Cancel
                  </span>
                </div>

                {/* Buttons Group */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Cancel</span>
                    <kbd className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-500 rounded font-mono">Esc</kbd>
                  </button>

                  {/* Save & Add New (Create Another) Button */}
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(undefined, false)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
                    title="Save current item and immediately reset form for the next master product (Shortcut: Ctrl+Enter or F3)"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Save & Add New</span>
                    <kbd className="px-1.5 py-0.5 text-[9px] bg-emerald-700/80 rounded font-mono text-emerald-100 font-bold">
                      Ctrl+↵
                    </kbd>
                  </button>

                  {/* Save & Close Button */}
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(undefined, true)}
                    className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
                    title="Save current item and close modal (Shortcut: F2 or Ctrl+S)"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{editingProduct ? 'Save Changes' : 'Save & Close'}</span>
                    <kbd className="px-1.5 py-0.5 text-[9px] bg-indigo-700/80 rounded font-mono text-indigo-100 font-bold">
                      F2
                    </kbd>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {isQuickCategoryOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>Create New Category</span>
              </h3>
              <button onClick={() => setIsQuickCategoryOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category Name:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="e.g. Dairy Products, Beverages, Brake Parts"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickCategoryOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{productToDelete.name}"</strong> (SKU: {productToDelete.sku}) from your product catalog?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 cursor-default"
          >
            <div className="flex items-center justify-between p-3 bg-slate-900 text-white">
              <span className="font-bold text-xs truncate max-w-xs">{lightboxImage.title}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Damaged Stock Modal */}
      {damageModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-amber-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Log Damaged Stock</h3>
                  <p className="text-[11px] text-slate-500">Record breakage & loss for stock reports</p>
                </div>
              </div>
              <button
                onClick={() => setDamageModalProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{damageModalProduct.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>
                    SKU: <strong className="font-mono text-slate-700">{damageModalProduct.sku}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    System Stock: <strong className="text-slate-800">{damageModalProduct.stock_quantity} {damageModalProduct.unit}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">
                  Damaged / Broken Quantity ({damageModalProduct.unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={quickDamagedQty}
                  onChange={(e) => setQuickDamagedQty(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-rose-700 focus:outline-hidden focus:border-rose-500 font-mono"
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">
                  Damage Reason:
                </label>
                <select
                  value={quickDamagedReason}
                  onChange={(e) => setQuickDamagedReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-rose-500"
                >
                  <option value="Broken Packaging / Transit">Broken Packaging / Transit</option>
                  <option value="Leaked / Seal Broken">Leaked / Seal Broken</option>
                  <option value="Handling / Dropped in Store">Handling / Dropped in Store</option>
                  <option value="Rodent / Pest Damage">Rodent / Pest Damage</option>
                  <option value="Water / Moisture Damage">Water / Moisture Damage</option>
                  <option value="Perished / Spoiled Goods">Perished / Spoiled Goods</option>
                  <option value="Other / Discard">Other / Discard</option>
                </select>
              </div>

              {quickDamagedQty > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cost Value Loss:</span>
                    <span className="font-mono font-bold text-rose-700">
                      {currencySymbol} {(quickDamagedQty * (damageModalProduct.cost_price || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Retail Value Loss:</span>
                    <span className="font-mono font-bold text-rose-700">
                      {currencySymbol} {(quickDamagedQty * (damageModalProduct.selling_price || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-rose-200">
                    ℹ️ This loss value is automatically reflected in the Stock Valuation Report.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {damageModalProduct.damaged_quantity && damageModalProduct.damaged_quantity > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDamagedQty(0);
                      updateProduct(damageModalProduct.id, {
                        damaged_quantity: 0,
                        damaged_reason: undefined,
                        damaged_date: undefined,
                      });
                      showToast(`Cleared damaged stock record for "${damageModalProduct.name}"`);
                      setDamageModalProduct(null);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl mr-auto cursor-pointer"
                  >
                    Clear Damaged
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDamageModalProduct(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickDamage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Damaged Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import/Export Modal */}
      {isExcelStudioOpen && (
        <ExcelDataStudio
          isModal={true}
          initialTab="products"
          onClose={() => setIsExcelStudioOpen(false)}
        />
      )}
    </div>
  );
};
