import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  Product,
  CartItem,
  PaymentMethod,
  Customer,
  Sale,
} from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { PrintReceiptModal } from '../common/PrintReceiptModal';
import { ShopMessagesModal } from '../common/ShopMessagesModal';
import { ShopUrgentMessageBanner } from '../common/ShopUrgentMessageBanner';
import { openCleanKotPrintTab } from '../../utils/printEngine';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Percent,
  CreditCard,
  Banknote,
  QrCode,
  User,
  AlertTriangle,
  CheckCircle2,
  UtensilsCrossed,
  Scale,
  Sparkles,
  Printer,
  ChevronRight,
  X,
  Lock,
  PauseCircle,
  RotateCcw,
  Tag,
  Warehouse,
  Maximize,
  Minimize,
  Globe,
  Check,
  Users,
  Monitor,
  Tv,
  Bell,
  ShieldAlert,
  Vault,
  KeyRound,
  DollarSign,
  Coins,
  Unlock,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  UserCheck,
  BadgePercent,
  IdCard,
  MousePointerClick,
  Hash,
  Type,
  Eye,
  EyeOff,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';

interface PosTerminalProps {
  onClosePos?: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({ onClosePos }) => {
  const {
    currentTenant,
    currentTenantId,
    currentLicense,
    currentUser,
    currentBranch,
    currentSettings,
    products,
    categories,
    customers,
    addCustomer,
    customFields,
    sales,
    counters,
    terminalStation,
    activeCounter,
    activeShift,
    setTerminalStation,
    counterShifts,
    cashDrawerTransactions,
    currentDrawerCashBalance,
    openDayShift,
    closeDayShift,
    recordCashDrawerIn,
    recordCashDrawerOut,
    kickCashDrawer,
    createSale,
    processSaleReturn,
    queuePrintJob,
    language,
    setLanguage,
    t,
    isFullscreen,
    toggleFullscreen,
    unreadTenantMessagesCount,
    employees,
    users,
  } = useRetail();

  // Selected billing counter for this active POS session
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    terminalStation?.counter_id || activeCounter?.id || (counters?.[0]?.id ?? 'CTR-01')
  );

  const activeBillingCounter = useMemo(() => {
    return counters?.find((c) => c.id === selectedCounterId) || counters?.[0];
  }, [counters, selectedCounterId]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('TAKEAWAY');
  const [tableNumber, setTableNumber] = useState<string>('T1');
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isWholesaleTier, setIsWholesaleTier] = useState<boolean>(false);

  // Sales Associate & Commission State for Billing
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>('');
  const [associateCodeInput, setAssociateCodeInput] = useState<string>('');
  const [customCommissionRate, setCustomCommissionRate] = useState<number | null>(null);
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState<boolean>(false);
  const [isCustomRateOpen, setIsCustomRateOpen] = useState<boolean>(false);

  // Available Shop Associates for this Tenant
  const tenantAssociates = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      code: string;
      rate: number;
      designation: string;
      phone?: string;
      source: 'employee' | 'user';
    }> = [];

    const seenKeys = new Set<string>();

    // 1. Check employees
    (employees || [])
      .filter((e) => e && (e.is_active !== false))
      .forEach((emp) => {
        const isAssoc = emp.is_shop_associate || (emp.commission_percentage !== undefined && emp.commission_percentage > 0) || (emp.designation && emp.designation.toLowerCase().includes('associate'));
        if (isAssoc) {
          const code = (emp.associate_code || emp.code || `SA-${emp.id.replace(/\D/g, '').slice(-2) || '01'}`).toUpperCase();
          const key = `${emp.name.toLowerCase()}_${code}`;
          if (!seenKeys.has(key)) {
            list.push({
              id: emp.id,
              name: emp.name,
              code: code,
              rate: emp.commission_percentage !== undefined ? emp.commission_percentage : 3.5,
              designation: emp.designation || 'Sales Associate',
              phone: emp.phone,
              source: 'employee',
            });
            seenKeys.add(key);
            seenKeys.add(emp.id);
            if (emp.user_account_id) seenKeys.add(emp.user_account_id);
          }
        }
      });

    // 2. Check users
    (users || [])
      .filter((u) => u && (u.is_active !== false))
      .forEach((usr) => {
        const isAssoc = usr.is_shop_associate || usr.role === 'SHOP_ASSOCIATE' || usr.role === 'SALES_ASSOCIATE' || (usr.commission_percentage !== undefined && usr.commission_percentage > 0);
        if (isAssoc && !seenKeys.has(usr.id)) {
          const code = (usr.associate_code || `SA-${usr.id.replace(/\D/g, '').slice(-2) || '01'}`).toUpperCase();
          const key = `${usr.full_name.toLowerCase()}_${code}`;
          if (!seenKeys.has(key)) {
            list.push({
              id: usr.id,
              name: usr.full_name,
              code: code,
              rate: usr.commission_percentage !== undefined ? usr.commission_percentage : 5.0,
              designation: 'Shop Sales Associate',
              phone: usr.phone,
              source: 'user',
            });
            seenKeys.add(key);
            seenKeys.add(usr.id);
          }
        }
      });

    // Fallback default associates if none configured so demo/testing works immediately
    if (list.length === 0) {
      list.push(
        {
          id: 'ASSOC-DEMO-01',
          name: 'Nimal Bandara (Floor Lead)',
          code: 'SA-01',
          rate: 3.5,
          designation: 'Senior Sales Associate',
          source: 'employee',
        },
        {
          id: 'ASSOC-DEMO-02',
          name: 'Sanjeewa Kumara (Showroom)',
          code: 'SA-02',
          rate: 5.0,
          designation: 'Sales Associate',
          source: 'employee',
        }
      );
    }

    return list;
  }, [employees, users]);

  // Selected Active Associate
  const activeAssociate = useMemo(() => {
    if (selectedAssociateId) {
      return tenantAssociates.find((a) => a.id === selectedAssociateId) || null;
    }
    if (associateCodeInput.trim()) {
      const match = tenantAssociates.find(
        (a) =>
          a.code.toUpperCase() === associateCodeInput.trim().toUpperCase() ||
          a.name.toLowerCase().includes(associateCodeInput.trim().toLowerCase())
      );
      return match || null;
    }
    return null;
  }, [selectedAssociateId, associateCodeInput, tenantAssociates]);

  const effectiveCommissionRate = customCommissionRate !== null 
    ? customCommissionRate 
    : (activeAssociate?.rate || 0);

  // Active Special Modals
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);
  const [weighWeightKg, setWeighWeightKg] = useState<number | string>(1);
  const weighInputRef = useRef<HTMLInputElement>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState<boolean>(false);
  const [quickCustName, setQuickCustName] = useState<string>('');
  const [quickCustPhone, setQuickCustPhone] = useState<string>('+94 7');
  const [quickCustCreditLimit, setQuickCustCreditLimit] = useState<number>(25000);
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [customerSearchMode, setCustomerSearchMode] = useState<'ALL' | 'NAME' | 'PHONE'>('ALL');
  const [showCustomerSearchDropdown, setShowCustomerSearchDropdown] = useState<boolean>(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target as Node)) {
        setShowCustomerSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-focus and select weight input when weighing modal opens
  useEffect(() => {
    if (weighingProduct) {
      setWeighWeightKg(1);
      const timer = setTimeout(() => {
        if (weighInputRef.current) {
          weighInputRef.current.focus();
          weighInputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [weighingProduct]);

  // Headquarter Messages Modal State
  const [isPosMessagesOpen, setIsPosMessagesOpen] = useState(false);

  // Cash Drawer & Shift Modals State in POS
  const [isDayOpenModalOpen, setIsDayOpenModalOpen] = useState(false);
  const [isDayEndModalOpen, setIsDayEndModalOpen] = useState(false);
  const [isCashInOutModalOpen, setIsCashInOutModalOpen] = useState(false);
  const [cashInOutType, setCashInOutType] = useState<'IN' | 'OUT'>('IN');

  const [posDayOpenFloat, setPosDayOpenFloat] = useState(5000);
  const [posDayOpenNotes, setPosDayOpenNotes] = useState('');

  const [posDayEndActualCash, setPosDayEndActualCash] = useState(0);
  const [posDayEndWithdrawal, setPosDayEndWithdrawal] = useState(0);
  const [posDayEndRetainedFloat, setPosDayEndRetainedFloat] = useState(0);
  const [posDayEndWithdrawalNotes, setPosDayEndWithdrawalNotes] = useState('POS Shift closing cash drop to safe');

  const [posCashInOutAmount, setPosCashInOutAmount] = useState(2000);
  const [posCashInOutReason, setPosCashInOutReason] = useState('Change replenishment');
  const [posCashInOutCategory, setPosCashInOutCategory] = useState<any>('CHANGE_REPLENISH');

  // Completed Receipt Modal & Recent Bills Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isRecentBillsModalOpen, setIsRecentBillsModalOpen] = useState(false);
  const [recentBillsSearch, setRecentBillsSearch] = useState('');

  // POS In-Terminal Return & Exchange State
  const [isPosReturnModalOpen, setIsPosReturnModalOpen] = useState(false);
  const [posReturnLookupInput, setPosReturnLookupInput] = useState('');
  const [posSelectedReturnSale, setPosSelectedReturnSale] = useState<Sale | null>(null);
  const [posReturnItemsState, setPosReturnItemsState] = useState<
    {
      product_id: string;
      name: string;
      unit_price: number;
      sold_quantity: number;
      return_quantity: number;
    }[]
  >([]);
  const [posReturnMode, setPosReturnMode] = useState<'REFUND' | 'EXCHANGE'>('REFUND');
  const [posRefundType, setPosRefundType] = useState<'CASH' | 'CREDIT_NOTE' | 'BANK_TRANSFER' | 'EXCHANGE_ITEM'>('CASH');
  const [posReturnReason, setPosReturnReason] = useState('Customer requested return at POS counter');
  const [posSelectedExchangeProduct, setPosSelectedExchangeProduct] = useState<Product | null>(null);
  const [posExchangeQuantity, setPosExchangeQuantity] = useState<number>(1);
  const [posReturnSuccessMessage, setPosReturnSuccessMessage] = useState<string | null>(null);

  // Item Selection Method State (User Request: Barcode Scanning, Item Name Type, Item Code Type, Click Item Optional)
  type SelectionMode = 'SMART' | 'BARCODE' | 'CODE' | 'NAME';
  const [itemSelectMode, setItemSelectMode] = useState<SelectionMode>('SMART');
  const [itemCodeInput, setItemCodeInput] = useState('');
  const [itemNameInput, setItemNameInput] = useState('');
  const [selectionQty, setSelectionQty] = useState<number>(1);
  const [isVisualGridVisible, setIsVisualGridVisible] = useState<boolean>(true);
  const [isClickItemActive, setIsClickItemActive] = useState<boolean>(true);
  // Item image display size in sales panel: 'small' (48px thumbnail - default) | 'mini' (32px icon) | 'hidden' (text only)
  const [itemImageSize, setItemImageSize] = useState<'small' | 'mini' | 'hidden'>(() => {
    return (localStorage.getItem('wcs_pos_item_image_size') as any) || 'small';
  });
  const [selectionFeedback, setSelectionFeedback] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const toggleItemImageSize = () => {
    setItemImageSize((prev) => {
      const next = prev === 'small' ? 'mini' : prev === 'mini' ? 'hidden' : 'small';
      localStorage.setItem('wcs_pos_item_image_size', next);
      showSelectionToast(
        next === 'small'
          ? 'Item Image Display: Small Thumbnail (Default)'
          : next === 'mini'
          ? 'Item Image Display: Mini Icon'
          : 'Item Image Display: Hidden (Text Only)',
        'success'
      );
      return next;
    });
  };

  // Input Refs for keyboard auto-focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const itemCodeInputRef = useRef<HTMLInputElement>(null);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const smartSearchInputRef = useRef<HTMLInputElement>(null);

  const showSelectionToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setSelectionFeedback({ message, type });
    setTimeout(() => {
      setSelectionFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const isSi = language === 'si';
  const isTa = language === 'ta';

  // Check if locked
  const isLicenseLocked =
    currentLicense &&
    (currentLicense.status === 'TEMPORARY_SUSPENDED' ||
      currentLicense.status === 'SUSPENDED' ||
      currentLicense.status === 'DEACTIVATED');

  // Business archetype modules
  const enabledMods = currentSettings?.enabled_modules || {
    grocery_weight: true,
    vehicle_parts: false,
    restaurant_kot: false,
    pharmacy_batch: false,
    wholesale_credit: true,
    barcode_studio: true,
    expiry_manager: true,
    staff_salaries: false,
  };

  // Filter products
  const safeProducts = products || [];
  const safeCategories = categories || [];
  const safeCustomers = customers || [];
  const safeSales = sales || [];

  // Compute current search text based on active selection mode
  const currentSearchText = useMemo(() => {
    if (itemSelectMode === 'BARCODE') return barcodeInput.trim();
    if (itemSelectMode === 'CODE') return itemCodeInput.trim();
    if (itemSelectMode === 'NAME') return itemNameInput.trim();
    return searchQuery.trim();
  }, [itemSelectMode, barcodeInput, itemCodeInput, itemNameInput, searchQuery]);

  const filteredProducts = useMemo(() => {
    const q = currentSearchText.toLowerCase();
    return safeProducts.filter((p) => {
      if (!p) return false;
      const customFieldsStr = p.custom_fields
        ? Object.values(p.custom_fields).filter(Boolean).join(' ').toLowerCase()
        : '';

      let matchesSearch = true;
      if (q) {
        if (itemSelectMode === 'BARCODE') {
          matchesSearch = (p.barcode || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
        } else if (itemSelectMode === 'CODE') {
          matchesSearch = (p.sku || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q);
        } else if (itemSelectMode === 'NAME') {
          matchesSearch =
            (p.name || '').toLowerCase().includes(q) ||
            (p.name_si || '').toLowerCase().includes(q) ||
            (p.name_ta || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q);
        } else {
          matchesSearch =
            (p.name || '').toLowerCase().includes(q) ||
            (p.name_si || '').toLowerCase().includes(q) ||
            (p.name_ta || '').toLowerCase().includes(q) ||
            (p.barcode || '').toLowerCase().includes(q) ||
            (p.sku || '').toLowerCase().includes(q) ||
            (p.brand || '').toLowerCase().includes(q) ||
            customFieldsStr.includes(q);
        }
      }

      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [safeProducts, currentSearchText, itemSelectMode, selectedCategory]);

  // Add Product to Cart
  const handleAddToCart = (product: Product, quantity = 1, unitPriceOverride?: number) => {
    // If grocery product by KG and no weight selected yet, open scale modal
    if (
      (product.unit === 'kg' || product.unit === 'g') &&
      enabledMods.grocery_weight &&
      quantity === 1 &&
      !weighingProduct
    ) {
      setWeighingProduct(product);
      setWeighWeightKg(1);
      return;
    }

    const effectivePrice =
      unitPriceOverride !== undefined
        ? unitPriceOverride
        : isWholesaleTier && product.wholesale_price
        ? product.wholesale_price
        : product.selling_price;

    const localizedName =
      isSi && product.name_si ? product.name_si : isTa && product.name_ta ? product.name_ta : product.name;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: Number((item.quantity + quantity).toFixed(3)),
                total_price: (item.quantity + quantity) * item.unit_price - (item.discount_amount || 0),
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          product_id: product.id,
          product_name: localizedName,
          sku: product.sku,
          barcode: product.barcode,
          unit_price: effectivePrice,
          cost_price: product.cost_price,
          quantity: quantity,
          discount_amount: 0,
          total_price: quantity * effectivePrice,
          unit: product.unit,
          image_url: product.image_url,
          custom_fields: product.custom_fields,
        };
        return [newItem, ...prev];
      }
    });

    showSelectionToast(`Added ${quantity}x ${localizedName} (${product.sku || product.barcode || 'Item'})`);
  };

  // Add weight scale product
  const handleConfirmWeighing = () => {
    if (!weighingProduct) return;
    const qty = Math.max(0.001, parseFloat(String(weighWeightKg)) || 1);
    const effectivePrice =
      isWholesaleTier && weighingProduct.wholesale_price
        ? weighingProduct.wholesale_price
        : weighingProduct.selling_price;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product_id === weighingProduct.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === weighingProduct.id
            ? {
                ...item,
                quantity: Number((item.quantity + qty).toFixed(3)),
                total_price: Number(((item.quantity + qty) * item.unit_price).toFixed(2)),
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          product_id: weighingProduct.id,
          product_name: weighingProduct.name,
          sku: weighingProduct.sku,
          barcode: weighingProduct.barcode,
          unit_price: effectivePrice,
          cost_price: weighingProduct.cost_price,
          quantity: qty,
          discount_amount: 0,
          total_price: Number((qty * effectivePrice).toFixed(2)),
          unit: weighingProduct.unit,
          custom_fields: weighingProduct.custom_fields,
        };
        return [newItem, ...prev];
      }
    });

    setWeighingProduct(null);
  };

  // 1. Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let qty = selectionQty > 0 ? selectionQty : 1;
    let code = raw;

    // Support qty prefix like 3*89012345
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        code = parts.slice(1).join('*').trim();
      }
    }

    const query = code.toLowerCase();
    const matched = safeProducts.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.sku && p.sku.toLowerCase() === query)
    );

    if (matched) {
      handleAddToCart(matched, qty);
      setBarcodeInput('');
      setSelectionQty(1);
    } else {
      showSelectionToast(`Barcode "${code}" not found in catalog.`, 'warning');
    }
  };

  // 2. Handle Item Code (SKU) Type / Enter
  const handleItemCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = itemCodeInput.trim();
    if (!raw) return;

    let qty = selectionQty > 0 ? selectionQty : 1;
    let code = raw;

    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        code = parts.slice(1).join('*').trim();
      }
    }

    const query = code.toLowerCase();
    const matched = safeProducts.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === query) ||
        (p.id && p.id.toLowerCase() === query) ||
        (p.barcode && p.barcode.toLowerCase() === query) ||
        (p.custom_fields && Object.values(p.custom_fields).some((val) => String(val).toLowerCase() === query))
    ) || safeProducts.find((p) => p.sku && p.sku.toLowerCase().includes(query));

    if (matched) {
      handleAddToCart(matched, qty);
      setItemCodeInput('');
      setSelectionQty(1);
    } else {
      showSelectionToast(`Item Code (SKU) "${code}" not found in catalog.`, 'warning');
    }
  };

  // 3. Handle Item Name Type / Enter
  const handleItemNameSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = itemNameInput.trim();
    if (!raw) return;

    let qty = selectionQty > 0 ? selectionQty : 1;
    let nameQuery = raw;

    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        nameQuery = parts.slice(1).join('*').trim();
      }
    }

    const query = nameQuery.toLowerCase();
    const matched = safeProducts.find(
      (p) =>
        (p.name && p.name.toLowerCase() === query) ||
        (p.name_si && p.name_si.toLowerCase() === query) ||
        (p.name_ta && p.name_ta.toLowerCase() === query)
    ) || safeProducts.find(
      (p) =>
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.name_si && p.name_si.toLowerCase().includes(query)) ||
        (p.name_ta && p.name_ta.toLowerCase().includes(query)) ||
        (p.brand && p.brand.toLowerCase().includes(query))
    );

    if (matched) {
      handleAddToCart(matched, qty);
      setItemNameInput('');
      setSelectionQty(1);
    } else {
      showSelectionToast(`Item Name "${nameQuery}" not found in catalog.`, 'warning');
    }
  };

  // 4. Handle Smart Unified Search / Enter
  const handleSmartSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = searchQuery.trim();
    if (!raw) return;

    let qty = selectionQty > 0 ? selectionQty : 1;
    let qStr = raw;

    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseFloat(parts[0]);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        qStr = parts.slice(1).join('*').trim();
      }
    }

    const q = qStr.toLowerCase();
    // 1. Check barcode
    let matched = safeProducts.find((p) => p.barcode && p.barcode.toLowerCase() === q);
    // 2. Check SKU
    if (!matched) {
      matched = safeProducts.find((p) => p.sku && p.sku.toLowerCase() === q);
    }
    // 3. Check exact name
    if (!matched) {
      matched = safeProducts.find(
        (p) =>
          (p.name && p.name.toLowerCase() === q) ||
          (p.name_si && p.name_si.toLowerCase() === q) ||
          (p.name_ta && p.name_ta.toLowerCase() === q)
      );
    }
    // 4. Check partial search
    if (!matched) {
      matched = safeProducts.find(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (matched) {
      handleAddToCart(matched, qty);
      setSearchQuery('');
      setSelectionQty(1);
    } else {
      showSelectionToast(`Item "${qStr}" not found (Check Barcode, Code, or Name).`, 'warning');
    }
  };

  // Update Cart Item Quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = Math.max(0.001, Number((item.quantity + delta).toFixed(3)));
            return {
              ...item,
              quantity: newQty,
              total_price: newQty * item.unit_price - (item.discount_amount || 0),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove Item
  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total_price, 0);
  const discountTotal = (subtotal * globalDiscountPercent) / 100;
  const taxRate = currentSettings?.tax_percentage ?? currentSettings?.default_tax_rate ?? 0;
  const taxTotal = ((subtotal - discountTotal) * taxRate) / 100;
  const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);
  const changeDue = Math.max(0, paidAmount - grandTotal);

  // Commission calculation for selected sales associate
  const eligibleCommissionBase = Math.max(0, subtotal - discountTotal);
  const commissionAmount = activeAssociate && effectiveCommissionRate > 0
    ? Number(((eligibleCommissionBase * effectiveCommissionRate) / 100).toFixed(2))
    : 0;

  // Keyboard shortcut listener for F1 (Smart), F2 (Barcode), F3 (Code), F4 (Name), F8 (Pay & Print), F9 (Recent/Return), and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setItemSelectMode('SMART');
        setTimeout(() => smartSearchInputRef.current?.focus(), 50);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setItemSelectMode('BARCODE');
        setTimeout(() => barcodeInputRef.current?.focus(), 50);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setItemSelectMode('CODE');
        setTimeout(() => itemCodeInputRef.current?.focus(), 50);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setItemSelectMode('NAME');
        setTimeout(() => itemNameInputRef.current?.focus(), 50);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (isPaymentModalOpen) {
          handleCompleteSale();
        } else if (cartItems.length > 0) {
          handleOpenPayment();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        setIsRecentBillsModalOpen(true);
      } else if (e.key === 'Escape') {
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
        } else if (isReceiptOpen) {
          setIsReceiptOpen(false);
        } else if (weighingProduct) {
          setWeighingProduct(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentModalOpen, isReceiptOpen, weighingProduct, cartItems, paidAmount, paymentMethod, grandTotal, subtotal]);


  // Open Checkout
  const handleOpenPayment = () => {
    if (cartItems.length === 0) return;
    setPaidAmount(Math.ceil(grandTotal));
    setShowQuickAddCustomer(false);
    setIsPaymentModalOpen(true);
  };

  // Complete Sale
  const handleCompleteSale = () => {
    if (cartItems.length === 0) return;

    const customerLoyaltyBalance = Number(selectedCustomer?.loyalty_points) || 0;
    const isLoyaltyMethod = paymentMethod === 'LOYALTY_POINTS';

    // Loyalty points to redeem (1 pt = 1 LKR discount / tender)
    const pointsToRedeem = (useLoyaltyPoints || isLoyaltyMethod) && selectedCustomer
      ? Math.min(
          loyaltyPointsToRedeem > 0 ? loyaltyPointsToRedeem : Math.min(customerLoyaltyBalance, Math.ceil(grandTotal)),
          customerLoyaltyBalance,
          Math.ceil(grandTotal)
        )
      : 0;

    const loyaltyAmount = pointsToRedeem;
    const netPayable = Math.max(0, Number((grandTotal - loyaltyAmount).toFixed(2)));

    const isPureCredit = paymentMethod === 'CREDIT';
    const isPureLoyalty = isLoyaltyMethod && loyaltyAmount >= grandTotal;

    // Remaining balance after loyalty points and cash/card paid
    let balanceDue = 0;
    let actualPaid = 0;
    let changeAmount = 0;

    if (isPureCredit) {
      balanceDue = netPayable;
      actualPaid = 0;
      changeAmount = 0;
    } else if (isPureLoyalty) {
      balanceDue = 0;
      actualPaid = 0;
      changeAmount = 0;
    } else if (isLoyaltyMethod) {
      // Loyalty points didn't cover full bill - remainder can be paid via paidAmount or goes to credit
      if (paidAmount >= netPayable) {
        actualPaid = netPayable;
        changeAmount = Math.max(0, Number((paidAmount - netPayable).toFixed(2)));
        balanceDue = 0;
      } else {
        actualPaid = Number(paidAmount);
        balanceDue = Number((netPayable - paidAmount).toFixed(2));
      }
    } else {
      // Standard Cash/Card/QR/Split, possibly with partial loyalty points deduction
      const isHalfOrPartial = paidAmount > 0 && paidAmount < netPayable;
      if (isHalfOrPartial) {
        actualPaid = Number(paidAmount);
        balanceDue = Number((netPayable - paidAmount).toFixed(2));
        changeAmount = 0;
      } else if (paidAmount >= netPayable) {
        actualPaid = netPayable;
        changeAmount = Math.max(0, Number((paidAmount - netPayable).toFixed(2)));
        balanceDue = 0;
      } else {
        // paidAmount is 0 and not pure credit
        balanceDue = netPayable;
      }
    }

    // If there is a balance due to add to the customer's credit ledger, customer must be selected
    if (balanceDue > 0 && !selectedCustomer) {
      alert(
        `Customer Required: To record the remaining balance of ${currencySymbol} ${balanceDue.toLocaleString()} into the Credit Ledger, please select or quick-register a customer.`
      );
      return;
    }

    // Calculate loyalty points earned (1 pt per 100 LKR, only if customer selected and loyalty enabled)
    const pointsEarned = currentSettings?.enable_loyalty !== false && selectedCustomer
      ? Math.floor(grandTotal / 100)
      : 0;

    const isHalfOrPartialPay = !isPureCredit && !isPureLoyalty && balanceDue > 0 && actualPaid > 0;
    const halfPayNote = isHalfOrPartialPay
      ? `Split Pay: Paid ${currencySymbol} ${actualPaid.toLocaleString()} via ${paymentMethod}${loyaltyAmount > 0 ? ` + ${currencySymbol} ${loyaltyAmount.toLocaleString()} via ${pointsToRedeem} Loyalty Pts` : ''} | Balance ${currencySymbol} ${balanceDue.toLocaleString()} added to Customer Credit Ledger`
      : loyaltyAmount > 0
      ? `Loyalty Redemption: Redeemed ${pointsToRedeem} pts (${currencySymbol} ${loyaltyAmount.toLocaleString()})${actualPaid > 0 ? ` + Paid ${currencySymbol} ${actualPaid.toLocaleString()} via ${paymentMethod}` : ''}`
      : undefined;
    const finalNotes = [notes, halfPayNote].filter(Boolean).join(' | ');

    const effectivePaymentMethod: PaymentMethod = isPureCredit
      ? 'CREDIT'
      : isPureLoyalty
      ? 'LOYALTY_POINTS'
      : (loyaltyAmount > 0 && actualPaid > 0) || (balanceDue > 0 && actualPaid > 0)
      ? 'SPLIT'
      : isLoyaltyMethod
      ? 'LOYALTY_POINTS'
      : paymentMethod;

    const newSale = createSale({
      customer_id: selectedCustomer?.id,
      customer_name: selectedCustomer?.name || 'Walk-in Retail Customer',
      customer_phone: selectedCustomer?.phone,
      cashier_id: currentUser?.id || 'USR-01',
      cashier_name: currentUser?.full_name || 'Cashier',
      counter_id: activeBillingCounter?.id || 'CTR-01',
      counter_name: activeBillingCounter?.name || 'Counter 01',
      receipt_type: (activeBillingCounter?.default_printer_type as any) || '80mm',
      items: cartItems.map((item) => ({
        product_id: item.product_id,
        sku: item.sku || '',
        barcode: item.barcode || '',
        name: item.product_name,
        unit: item.unit || 'pcs',
        unit_price: item.unit_price,
        cost_price: item.cost_price,
        quantity: item.quantity,
        discount_percent: globalDiscountPercent || 0,
        discount_amount: item.discount_amount || 0,
        total: item.total_price,
        total_price: item.total_price,
        custom_fields_snapshot: item.custom_fields,
      })),
      subtotal,
      discount_amount: discountTotal,
      discount_total: discountTotal,
      tax_amount: taxTotal,
      tax_total: taxTotal,
      grand_total: grandTotal,
      paid_amount: actualPaid,
      change_amount: changeAmount,
      balance_due: balanceDue,
      balance_amount: balanceDue > 0 ? balanceDue : changeAmount,
      payment_method: effectivePaymentMethod,
      payment_split: {
        cash: (paymentMethod === 'CASH' || effectivePaymentMethod === 'SPLIT') ? (paymentMethod === 'CASH' ? actualPaid : 0) : undefined,
        card: paymentMethod === 'CARD' ? actualPaid : undefined,
        bank_transfer: paymentMethod === 'QR_PAY' ? actualPaid : undefined,
        credit: balanceDue > 0 ? balanceDue : undefined,
        loyalty_points: loyaltyAmount > 0 ? loyaltyAmount : undefined,
      },
      loyalty_points_earned: pointsEarned,
      loyalty_points_redeemed: pointsToRedeem,
      loyalty_points_amount: loyaltyAmount,
      customer_loyalty_balance: selectedCustomer ? Math.max(0, customerLoyaltyBalance - pointsToRedeem + pointsEarned) : undefined,
      status: 'COMPLETED',
      order_type: orderType,
      table_number: enabledMods.restaurant_kot ? tableNumber : undefined,
      notes: finalNotes || undefined,
      sales_associate_id: activeAssociate?.id,
      sales_associate_name: activeAssociate?.name,
      sales_associate_code: activeAssociate?.code,
      sales_associate_designation: activeAssociate?.designation,
      commission_rate: activeAssociate ? effectiveCommissionRate : undefined,
      commission_amount: activeAssociate ? commissionAmount : undefined,
    });

    // Automatically send print job to WCS Print Bridge
    queuePrintJob(
      'THERMAL_80',
      `Sale Invoice #${newSale.invoice_no}`,
      `Invoice #${newSale.invoice_no} | Total: ${currencySymbol} ${(grandTotal || 0).toLocaleString()}`
    );

    // Open physical cash drawer for cash transactions / splits prior to bill printout
    if (paymentMethod === 'CASH' || effectivePaymentMethod === 'SPLIT' || actualPaid > 0) {
      kickCashDrawer(
        activeBillingCounter?.id || 'CTR-01',
        activeBillingCounter?.name || 'Counter 01'
      );
    }

    // If Restaurant KOT enabled, also dispatch KOT kitchen ticket
    if (enabledMods.restaurant_kot) {
      queuePrintJob(
        'KITCHEN',
        `KOT Kitchen Slip #${newSale.invoice_no} (${tableNumber})`,
        `Table: ${tableNumber} | Items: ${cartItems.length}`
      );
    }

    setCompletedSale(newSale);
    setCartItems([]);
    setSelectedCustomer(null);
    setSelectedAssociateId('');
    setAssociateCodeInput('');
    setCustomCommissionRate(null);
    setNotes('');
    setGlobalDiscountPercent(0);
    setUseLoyaltyPoints(false);
    setLoyaltyPointsToRedeem(0);
    setIsPaymentModalOpen(false);
    setIsReceiptOpen(true);
  };

  // Open POS Return Modal for a specific sale
  const handleOpenPosReturn = (sale: Sale) => {
    setPosSelectedReturnSale(sale);
    setPosReturnItemsState(
      (sale.items || []).map((item) => ({
        product_id: item.product_id,
        name: (item as any).product_name || item.name || 'Item',
        unit_price: item.unit_price || 0,
        sold_quantity: item.quantity || 1,
        return_quantity: 0,
      }))
    );
    setPosReturnMode('REFUND');
    setPosRefundType('CASH');
    setPosSelectedExchangeProduct(null);
    setPosExchangeQuantity(1);
    setPosReturnReason('Customer requested item exchange / return at counter');
    setIsPosReturnModalOpen(true);
  };

  // Handle Quick Return Lookup by invoice number
  const handlePosLookupAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const q = posReturnLookupInput.trim().toUpperCase();
    if (!q) return;

    const matched = safeSales.find(
      (s) => s && (s.invoice_no?.toUpperCase() === q || s.invoice_no?.toUpperCase().includes(q))
    );

    if (matched) {
      handleOpenPosReturn(matched);
      setPosReturnLookupInput('');
    } else {
      alert(`No sales invoice found matching "${q}". Please verify invoice number.`);
    }
  };

  // Calculate POS Return values
  const posTotalReturnRefundValue = posReturnItemsState.reduce(
    (acc, item) => acc + item.return_quantity * item.unit_price,
    0
  );

  const posExchangeProductTotal = posSelectedExchangeProduct
    ? (posSelectedExchangeProduct.selling_price || 0) * posExchangeQuantity
    : 0;

  const posExchangePriceDifference = posExchangeProductTotal - posTotalReturnRefundValue;

  // Submit POS Return / Exchange
  const handleProcessPosReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posSelectedReturnSale) return;

    const itemsToReturn = posReturnItemsState
      .filter((i) => i.return_quantity > 0)
      .map((i) => ({
        product_id: i.product_id,
        name: i.name,
        unit_price: i.unit_price,
        return_quantity: i.return_quantity,
        refund_amount: i.return_quantity * i.unit_price,
      }));

    if (itemsToReturn.length === 0) {
      alert('Please specify a return quantity of at least 1 item.');
      return;
    }

    if (posReturnMode === 'EXCHANGE' && !posSelectedExchangeProduct) {
      alert('Please select a replacement product from the store catalog.');
      return;
    }

    const exchangeItemsData =
      posReturnMode === 'EXCHANGE' && posSelectedExchangeProduct
        ? [
            {
              product_id: posSelectedExchangeProduct.id,
              name: posSelectedExchangeProduct.name,
              unit_price: posSelectedExchangeProduct.selling_price,
              quantity: posExchangeQuantity,
              total: posExchangeProductTotal,
            },
          ]
        : undefined;

    const finalRefundAmount =
      posReturnMode === 'EXCHANGE'
        ? Math.max(0, -posExchangePriceDifference)
        : posTotalReturnRefundValue;

    const newReturnRecord = processSaleReturn({
      original_invoice_no: posSelectedReturnSale.invoice_no,
      customer_id: posSelectedReturnSale.customer_id,
      customer_name: posSelectedReturnSale.customer_name,
      items: itemsToReturn,
      exchange_items: exchangeItemsData,
      price_difference: posReturnMode === 'EXCHANGE' ? posExchangePriceDifference : 0,
      total_refund_amount: finalRefundAmount,
      refund_type: posReturnMode === 'EXCHANGE' ? 'EXCHANGE_ITEM' : posRefundType,
      reason: posReturnReason,
    });

    setIsPosReturnModalOpen(false);
    setPosReturnSuccessMessage(
      `Return #${(newReturnRecord as any)?.return_no || 'RTN'} processed! Restocked & refund recorded.`
    );
    setTimeout(() => setPosReturnSuccessMessage(null), 5000);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] flex flex-col select-none">
      {/* Urgent Super Admin Broadcast Notice Banner */}
      <ShopUrgentMessageBanner onOpenMessagesModal={() => setIsPosMessagesOpen(true)} />

      {/* Top POS Header Toolbar - Line 1: Store & Station Status */}
      <div className="bg-slate-900 border-b border-slate-800/90 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Branch & Active Cashier */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold text-slate-200 uppercase tracking-wide">
              {currentTenant?.shop_name}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">({currentBranch?.name})</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 rounded-lg text-slate-300">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cashier: <strong className="text-white">{currentUser?.full_name || 'Cashier'}</strong></span>
          </div>

          {/* Active Billing Counter Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/40 rounded-lg text-indigo-200">
            <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-slate-300 hidden md:inline">Counter:</span>
            <select
              value={selectedCounterId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedCounterId(newId);
                const found = (counters || []).find((c) => c.id === newId);
                if (found) {
                  setTerminalStation({
                    counter_id: found.id,
                    counter_name: found.name,
                    default_printer_type: found.default_printer_type,
                  });
                }
              }}
              className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer text-xs"
            >
              {(counters || []).map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.counter_code} - {c.name} ({c.default_printer_type || '80mm'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Language, Fullscreen & Notices */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value as 'en' | 'si' | 'ta';
                setLanguage(newLang);
                if ((window as any).__setAppLanguage) {
                  (window as any).__setAppLanguage(newLang);
                }
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden pr-1 py-0.5 cursor-pointer text-[11px]"
            >
              <option value="en" className="bg-slate-900 text-white">EN (English)</option>
              <option value="si" className="bg-slate-900 text-white">සිං (Sinhala)</option>
              <option value="ta" className="bg-slate-900 text-white">தமி (Tamil)</option>
            </select>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {/* HQ Direct Notices Button */}
          <button
            onClick={() => setIsPosMessagesOpen(true)}
            title={`WCS Headquarter Notices (${unreadTenantMessagesCount} unread)`}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              unreadTenantMessagesCount > 0
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${unreadTenantMessagesCount > 0 ? 'text-white' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Notices</span>
            {unreadTenantMessagesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[10px] rounded-full">
                {unreadTenantMessagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top POS Header Toolbar - Line 2 (Next Line): Cash Drawer Shift Operations & Action Controls */}
      <div className="bg-[#091122] border-b border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Left: Cash Drawer & Operational Modes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cash Drawer & Shift Controls in POS */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg">
            {activeShift ? (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Drawer: {currencySymbol} {currentDrawerCashBalance.toLocaleString()}</span>
                </span>

                <button
                  onClick={() => {
                    const shiftTxs = cashDrawerTransactions.filter((t) => t.shift_id === activeShift.id);
                    const midDayIn = shiftTxs.filter((t) => t.type === 'CASH_IN_DEPOSIT').reduce((s, t) => s + (t.amount || 0), 0);
                    const midDayOut = shiftTxs.filter((t) => t.type === 'CASH_OUT_PAYOUT' || t.type === 'DAY_END_WITHDRAWAL').reduce((s, t) => s + (t.amount || 0), 0);
                    const expectedCash = (activeShift.opening_float || 0) + (activeShift.total_cash_sales || 0) + midDayIn - Math.max(midDayOut, activeShift.total_payouts || 0) - (activeShift.total_refunds || 0);

                    setPosDayEndActualCash(Math.max(0, expectedCash));
                    setPosDayEndWithdrawal(Math.max(0, expectedCash));
                    setPosDayEndRetainedFloat(0);
                    setIsDayEndModalOpen(true);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Day End Shift Close & Cash Withdrawal"
                >
                  <Lock className="w-3 h-3" />
                  <span>Day End</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPosDayOpenFloat(activeBillingCounter?.current_float || 5000);
                  setIsDayOpenModalOpen(true);
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                title="Start Cashier Shift with Cash Float Deposit"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Day Open (Deposit Float)</span>
              </button>
            )}

            {/* Cash In (+) */}
            <button
              onClick={() => {
                setCashInOutType('IN');
                setPosCashInOutCategory('CHANGE_REPLENISH');
                setPosCashInOutReason('Change replenishment');
                setPosCashInOutAmount(2000);
                setIsCashInOutModalOpen(true);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
              title="Cash In (Deposit)"
            >
              + In
            </button>

            {/* Cash Out (-) */}
            <button
              onClick={() => {
                setCashInOutType('OUT');
                setPosCashInOutCategory('PETTY_CASH');
                setPosCashInOutReason('Petty cash expense');
                setPosCashInOutAmount(1000);
                setIsCashInOutModalOpen(true);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
              title="Cash Out (Payout)"
            >
              - Out
            </button>

            {/* Physical Drawer Kick */}
            <button
              onClick={() => kickCashDrawer(activeBillingCounter?.id, activeBillingCounter?.name)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer"
              title="Open Physical Cash Drawer (Pulse)"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Restaurant Dine-in / Takeaway Switcher */}
          {enabledMods.restaurant_kot && (
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg">
              {(['TAKEAWAY', 'DINE_IN', 'DELIVERY'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    orderType === t ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
              {orderType === 'DINE_IN' && (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Table"
                  className="w-12 bg-slate-950 px-1.5 py-0.5 text-[10px] rounded text-center text-amber-300 font-bold border border-slate-700"
                />
              )}
            </div>
          )}

          {/* Wholesale Pricing Tier Switcher */}
          {enabledMods.wholesale_credit && (
            <button
              onClick={() => setIsWholesaleTier(!isWholesaleTier)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                isWholesaleTier
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Warehouse className="w-3 h-3" />
              <span>{isWholesaleTier ? 'Wholesale Pricing Active' : 'Retail Price'}</span>
            </button>
          )}
        </div>

        {/* Right: Recent Bills, Return Bill, Exit POS */}
        <div className="flex items-center gap-2">
          {/* Recent Bills (sales.length) Button */}
          <button
            onClick={() => setIsRecentBillsModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="View & Reprint Recent Invoices"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent Bills ({sales.length})</span>
          </button>

          {/* Return Bill (F9) Button */}
          <button
            onClick={() => setIsPosReturnModalOpen(true)}
            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Customer Return / Item Exchange (F9)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Return Bill (F9)</span>
          </button>

          {/* Exit POS Button */}
          {onClosePos && (
            <button
              onClick={onClosePos}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Close POS & Return to Shop Back Office"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit POS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Side: Product Browser, Scanner & Categories (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col gap-3 border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-7rem)]">
          {/* Item Selection Method & Mode Toolbar (User Request: Barcode Scanning, Item Name Type, Item Code Type, Click Item Optional) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
            {/* Row 1: Selection Mode Tabs & Optional Click/Grid Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Mode Switchers: Smart, Barcode, Item Code, Item Name */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setItemSelectMode('SMART');
                    setTimeout(() => smartSearchInputRef.current?.focus(), 50);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    itemSelectMode === 'SMART'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Smart Search across Barcode, Code and Name simultaneously (F1)"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Smart (F1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemSelectMode('BARCODE');
                    setTimeout(() => barcodeInputRef.current?.focus(), 50);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    itemSelectMode === 'BARCODE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Barcode Scanning Mode: Direct laser scanner or manual barcode entry (F2)"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Barcode Scan (F2)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemSelectMode('CODE');
                    setTimeout(() => itemCodeInputRef.current?.focus(), 50);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    itemSelectMode === 'CODE'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Item Code / SKU Typing Mode: High-speed product code entry (F3)"
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Item Code (F3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemSelectMode('NAME');
                    setTimeout(() => itemNameInputRef.current?.focus(), 50);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    itemSelectMode === 'NAME'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Item Name Typing Mode: Multilingual English/Sinhala/Tamil search (F4)"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Item Name (F4)</span>
                </button>
              </div>

              {/* Right: Quantity Box & Optional Click Item / Grid Toggles */}
              <div className="flex items-center gap-2">
                {/* Quantity Pre-setter */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs">
                  <span className="text-slate-400 font-medium mr-1.5 text-[11px]">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={selectionQty}
                    onChange={(e) => setSelectionQty(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-10 bg-transparent text-white font-mono font-bold text-center focus:outline-hidden text-xs"
                    title="Quantity multiplier applied when scanning, typing code, or clicking item"
                  />
                  <div className="flex items-center gap-0.5 ml-1">
                    {[1, 2, 5].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectionQty(q)}
                        className={`px-1 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                          selectionQty === q ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Item Image Display Size Toggle */}
                <button
                  type="button"
                  onClick={toggleItemImageSize}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    itemImageSize === 'small'
                      ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/80'
                      : itemImageSize === 'mini'
                      ? 'bg-sky-950/80 border-sky-500/50 text-sky-300 hover:bg-sky-900/80'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`Item Image Display: ${
                    itemImageSize === 'small'
                      ? 'Small Size (Click to switch to Mini)'
                      : itemImageSize === 'mini'
                      ? 'Mini Size (Click to hide images)'
                      : 'Hidden (Click to show Small images)'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Photo:</span>
                  <span
                    className={`text-[10px] font-black uppercase px-1 py-0.2 rounded ${
                      itemImageSize === 'small'
                        ? 'bg-indigo-500 text-white'
                        : itemImageSize === 'mini'
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {itemImageSize === 'small' ? 'Small' : itemImageSize === 'mini' ? 'Mini' : 'Off'}
                  </span>
                </button>

                {/* Visual Grid / Compact View Toggle */}
                <button
                  type="button"
                  onClick={() => setIsVisualGridVisible(!isVisualGridVisible)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title={isVisualGridVisible ? 'Switch to High-Density Compact Table' : 'Switch to Visual Card Grid'}
                >
                  {isVisualGridVisible ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Row 2: Active Input Field based on Selected Mode */}
            <div className="relative">
              {/* 1. Barcode Scanning Input */}
              {itemSelectMode === 'BARCODE' && (
                <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Barcode className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold hidden sm:inline">[Scanner]</span>
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode with laser or type and press Enter (e.g. 89012345 or 3*89012345)..."
                    className="w-full bg-slate-950 border-2 border-emerald-500/80 rounded-xl pl-12 sm:pl-28 pr-24 py-2.5 text-xs text-emerald-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 font-mono"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {barcodeInput && (
                      <button
                        type="button"
                        onClick={() => setBarcodeInput('')}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Scan [Enter]
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Item Code (SKU) Typing Input */}
              {itemSelectMode === 'CODE' && (
                <form onSubmit={handleItemCodeSubmit} className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Hash className="w-4 h-4 text-sky-400" />
                    <span className="text-[10px] font-mono text-sky-400 uppercase font-bold hidden sm:inline">[Item Code]</span>
                  </div>
                  <input
                    ref={itemCodeInputRef}
                    type="text"
                    value={itemCodeInput}
                    onChange={(e) => setItemCodeInput(e.target.value)}
                    placeholder="Type Item Code / SKU (e.g. ITM-001, PRD-04, or 2*ITM-001) & press Enter..."
                    className="w-full bg-slate-950 border-2 border-sky-500/80 rounded-xl pl-12 sm:pl-32 pr-24 py-2.5 text-xs text-sky-200 placeholder-slate-500 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 font-mono"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {itemCodeInput && (
                      <button
                        type="button"
                        onClick={() => setItemCodeInput('')}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Add Code [Enter]
                    </button>
                  </div>
                </form>
              )}

              {/* 3. Item Name Typing Input */}
              {itemSelectMode === 'NAME' && (
                <form onSubmit={handleItemNameSubmit} className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Type className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-sans text-amber-400 uppercase font-bold hidden sm:inline">[Item Name]</span>
                  </div>
                  <input
                    ref={itemNameInputRef}
                    type="text"
                    value={itemNameInput}
                    onChange={(e) => setItemNameInput(e.target.value)}
                    placeholder="Type item name in English, Sinhala, or Tamil (e.g. White Sugar, කිරි පිටි, பால்) & press Enter..."
                    className="w-full bg-slate-950 border-2 border-amber-500/80 rounded-xl pl-12 sm:pl-32 pr-24 py-2.5 text-xs text-amber-100 placeholder-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 font-sans"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {itemNameInput && (
                      <button
                        type="button"
                        onClick={() => setItemNameInput('')}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Add Name [Enter]
                    </button>
                  </div>
                </form>
              )}

              {/* 4. Smart Unified Search Input */}
              {itemSelectMode === 'SMART' && (
                <form onSubmit={handleSmartSearchSubmit} className="relative flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <Search className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-sans text-indigo-400 uppercase font-bold hidden sm:inline">[Smart Search]</span>
                  </div>
                  <input
                    ref={smartSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Scan barcode, type item code/SKU, or product name & press Enter to add..."
                    className="w-full bg-slate-950 border-2 border-indigo-500/70 rounded-xl pl-12 sm:pl-34 pr-24 py-2.5 text-xs text-indigo-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                    autoFocus
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      Add Item [Enter]
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Match Indicator / Status Hint */}
            <div className="flex flex-wrap items-center justify-between text-[11px] px-1 text-slate-400">
              <div className="flex items-center gap-2">
                {currentSearchText && filteredProducts.length > 0 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5 flex-wrap">
                    {filteredProducts[0].image_url && itemImageSize !== 'hidden' && (
                      <img
                        src={filteredProducts[0].image_url}
                        alt="Top match"
                        className="w-5 h-5 rounded object-cover border border-emerald-500/50 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span>⚡ Top Match:</span>
                    <strong className="text-white underline">
                      {isSi && filteredProducts[0].name_si ? filteredProducts[0].name_si : isTa && filteredProducts[0].name_ta ? filteredProducts[0].name_ta : filteredProducts[0].name}
                    </strong>
                    <span className="text-slate-400">({filteredProducts[0].sku || filteredProducts[0].barcode})</span>
                    <span className="text-indigo-300 font-bold">{currencySymbol} {filteredProducts[0].selling_price}</span>
                    <span className="text-slate-400 font-mono text-[10px]">— Press [Enter] to add {selectionQty > 1 ? `${selectionQty}x` : ''}</span>
                  </span>
                ) : currentSearchText && filteredProducts.length === 0 ? (
                  <span className="text-rose-400 font-medium">
                    ⚠️ No item matches "{currentSearchText}". Check barcode, code, or spelling.
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-2">
                    <span>Quick Select:</span>
                    <span className="text-slate-300 font-mono">[F1] Smart</span>
                    <span className="text-emerald-400 font-mono">[F2] Barcode</span>
                    <span className="text-sky-400 font-mono">[F3] Code</span>
                    <span className="text-amber-400 font-mono">[F4] Name</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">
                  Showing {filteredProducts.length} of {safeProducts.length} items
                </span>
                {!isClickItemActive && (
                  <span className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-bold rounded">
                    Keyboard Mode (Click Disabled)
                  </span>
                )}
              </div>
            </div>

            {/* Live Selection Action Toast */}
            {selectionFeedback && (
              <div
                className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                  selectionFeedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                }`}
              >
                <span>{selectionFeedback.message}</span>
                <button
                  onClick={() => setSelectionFeedback(null)}
                  className="text-slate-400 hover:text-white px-1 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              All Items ({safeProducts.length})
            </button>
            {safeCategories.map((c) => {
              const catDisplay = isSi && c.name_si ? c.name_si : isTa && c.name_ta ? c.name_ta : c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === c.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {catDisplay}
                </button>
              );
            })}
          </div>

          {/* Product Catalog Display: Visual Grid OR Compact High-Density Table */}
          {isVisualGridVisible ? (
            /* Visual Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 flex-1 overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const displayPrice = isWholesaleTier && p.wholesale_price ? p.wholesale_price : p.selling_price;
                const isWeighable = (p.unit === 'kg' || p.unit === 'g') && enabledMods.grocery_weight;
                const displayName =
                  isSi && p.name_si ? p.name_si : isTa && p.name_ta ? p.name_ta : p.name;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p, selectionQty)}
                    className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 rounded-xl p-2.5 transition-all flex flex-col justify-between group active:scale-98 relative shadow-sm overflow-hidden cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start gap-2.5">
                        {/* Small Size Product Image Display */}
                        {itemImageSize !== 'hidden' && p.image_url && (
                          <div
                            className={`${
                              itemImageSize === 'mini' ? 'w-8 h-8 rounded-md' : 'w-12 h-12 rounded-lg'
                            } bg-slate-950 overflow-hidden shrink-0 relative border border-slate-800 group-hover:border-indigo-500/50 shadow-xs transition-colors`}
                          >
                            <img
                              src={p.image_url}
                              alt={displayName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                            {isWeighable && (
                              <span className="absolute bottom-0 right-0 bg-emerald-950/95 text-emerald-300 px-0.5 rounded text-[7px] font-bold border border-emerald-700 leading-none">
                                KG
                              </span>
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {/* Header Badge */}
                          <div className="flex items-center justify-between mb-0.5 text-[9px]">
                            <span className="text-slate-400 font-mono truncate max-w-[70px]" title={`Code: ${p.sku}`}>
                              {p.sku || p.barcode || 'NO-CODE'}
                            </span>
                            {isWeighable && (!p.image_url || itemImageSize === 'hidden') && (
                              <span className="bg-emerald-950 text-emerald-300 px-1 rounded flex items-center gap-0.5 border border-emerald-800 text-[8px]">
                                <Scale className="w-2 h-2" /> KG
                              </span>
                            )}
                            {isClickItemActive && (
                              <span className="text-[8px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-950/80 px-1 rounded">
                                + Add {selectionQty > 1 ? `(${selectionQty})` : ''}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-slate-200 text-xs line-clamp-2 group-hover:text-indigo-300 transition-colors leading-tight">
                            {displayName}
                          </h4>

                          {/* Barcode & Custom Attributes Preview */}
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                            {p.barcode ? `BC: ${p.barcode}` : p.brand || p.sku}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-baseline justify-between">
                      <div>
                        <span className="font-black text-indigo-400 text-xs">
                          {currencySymbol} {(displayPrice || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] text-slate-500 ml-1">/{p.unit}</span>
                      </div>

                      <span
                        className={`text-[9px] font-mono ${
                          p.stock_quantity <= p.reorder_level ? 'text-amber-400' : 'text-slate-500'
                        }`}
                      >
                        {p.stock_quantity} left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-Density Compact Table View */
            <div className="flex-1 overflow-y-auto pr-1 bg-slate-900/60 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-mono">
                  <tr>
                    <th className="p-2.5">Code / SKU</th>
                    <th className="p-2.5">Product Name</th>
                    <th className="p-2.5">Barcode</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Stock</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map((p) => {
                    const displayPrice = isWholesaleTier && p.wholesale_price ? p.wholesale_price : p.selling_price;
                    const displayName = isSi && p.name_si ? p.name_si : isTa && p.name_ta ? p.name_ta : p.name;
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-800/70 transition-colors ${
                          isClickItemActive ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (isClickItemActive) handleAddToCart(p, selectionQty);
                        }}
                      >
                        <td className="p-2.5 font-mono text-sky-400 font-bold">{p.sku}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {itemImageSize !== 'hidden' && p.image_url && (
                              <img
                                src={p.image_url}
                                alt={displayName}
                                className="w-7 h-7 rounded-md object-cover border border-slate-800 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <span className="font-semibold text-white">{displayName}</span>
                          </div>
                        </td>
                        <td className="p-2.5 font-mono text-emerald-400 text-[11px]">{p.barcode || '—'}</td>
                        <td className="p-2.5 text-right font-black text-indigo-400">
                          {currencySymbol} {(displayPrice || 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-400">{p.stock_quantity}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(p, selectionQty);
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            + Add ({selectionQty})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Cashier Billing Cart & Checkout Engine (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 flex flex-col justify-between border-l border-slate-800">
          {/* Cart Header & Customer Selector */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950/40">
            {/* Customer Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value) || null;
                    setSelectedCustomer(cust);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 font-medium"
                >
                  <option value="">👤 Walk-in Retail Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Credit: {currencySymbol} {(c.current_balance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  title="Clear Cart"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Customer Loyalty Points Account Info */}
            {selectedCustomer && (
              <div className="flex items-center justify-between text-[10px] bg-slate-950/80 border border-amber-500/30 rounded-lg px-2.5 py-1.5 text-amber-300">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Loyalty Account: <strong className="text-white">{(selectedCustomer.loyalty_points || 0).toLocaleString()} pts</strong> ({currencySymbol} {(selectedCustomer.loyalty_points || 0).toLocaleString()})</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  +{Math.floor(grandTotal / 100)} pts
                </span>
              </div>
            )}

            {/* Sales Associate Code & Commission Generator Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sales Associate Code:</span>
                  <span className="text-[9px] font-normal text-slate-400 bg-slate-800 px-1 py-0.2 rounded">Optional</span>
                </div>

                {activeAssociate ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsCustomRateOpen(true)}
                      className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Adjust Commission %"
                    >
                      <Percent className="w-2.5 h-2.5" />
                      <span>{effectiveCommissionRate}%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssociateId('');
                        setAssociateCodeInput('');
                        setCustomCommissionRate(null);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      title="Remove Associate"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAssociateModalOpen(true)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <span>Browse All ({tenantAssociates.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Associate Selector Dropdown */}
                <div className="relative flex-1">
                  <select
                    value={selectedAssociateId || (activeAssociate ? activeAssociate.id : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedAssociateId(val);
                      const found = tenantAssociates.find((a) => a.id === val);
                      if (found) {
                        setAssociateCodeInput(found.code);
                        setCustomCommissionRate(null);
                      } else {
                        setAssociateCodeInput('');
                        setCustomCommissionRate(null);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                  >
                    <option value="">🏷️ Direct Cashier (No Associate Code - Optional)</option>
                    {tenantAssociates.map((assoc) => (
                      <option key={assoc.id} value={assoc.id}>
                        [{assoc.code}] {assoc.name} — {assoc.rate}% Comm
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Associate Code Input Box */}
                <div className="w-24 relative shrink-0">
                  <input
                    type="text"
                    value={associateCodeInput}
                    onChange={(e) => {
                      const codeVal = e.target.value.toUpperCase();
                      setAssociateCodeInput(codeVal);
                      const matched = tenantAssociates.find(
                        (a) => a.code.toUpperCase() === codeVal.trim()
                      );
                      if (matched) {
                        setSelectedAssociateId(matched.id);
                        setCustomCommissionRate(null);
                      } else if (codeVal === '') {
                        setSelectedAssociateId('');
                      }
                    }}
                    placeholder="Code (Opt)"
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-mono font-bold uppercase placeholder:text-slate-600 placeholder:normal-case text-center focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30"
                    title="Type Associate Code (Optional, e.g. SA-01, SA-02)"
                  />
                </div>
              </div>

              {/* Active Associate Live Commission Banner */}
              {activeAssociate && (
                <div className="px-2.5 py-1.5 bg-gradient-to-r from-amber-950/60 to-slate-900 border border-amber-500/40 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-mono font-black text-[10px] rounded shrink-0 shadow-xs">
                      {activeAssociate.code}
                    </span>
                    <span className="font-semibold text-slate-200 truncate text-[11px]">
                      {activeAssociate.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[11px] font-bold text-amber-400">
                    Comm: {currencySymbol} {commissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-[9px] text-amber-500/80 font-normal ml-1">({effectiveCommissionRate}%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Restaurant Order Mode & Table Selector (Shown only when Restaurant KOT Module is Enabled) */}
            {enabledMods.restaurant_kot && (
              <div className="grid grid-cols-12 gap-2 bg-[#0a111e] p-2 rounded-xl border border-amber-500/30">
                <div className="col-span-6 flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                  {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`flex-1 py-1 rounded-md transition-colors ${
                        orderType === type
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                    </button>
                  ))}
                </div>

                {orderType === 'DINE_IN' ? (
                  <div className="col-span-6 flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-amber-300 shrink-0">Table:</span>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-amber-200 font-mono font-bold"
                    >
                      {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'VIP-1', 'VIP-2', 'Garden-1', 'Garden-2'].map((t) => (
                        <option key={t} value={t}>
                          Table {t}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-span-6 flex items-center">
                    <span className="text-[10px] text-amber-300/80 font-medium italic">
                      🍴 {orderType === 'TAKEAWAY' ? 'Parcel / Takeaway Order' : 'Rider Delivery Order'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Customer Credit Summary Pill (if customer selected) */}
            {selectedCustomer && (
              <div className="p-2 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-[11px] flex items-center justify-between text-indigo-200">
                <div>
                  <span>Current Outstanding Credit: </span>
                  <strong className="text-amber-300">
                    {currencySymbol} {(selectedCustomer.current_balance || 0).toLocaleString()}
                  </strong>
                </div>
                <div className="text-[10px] text-indigo-300">
                  Limit: {currencySymbol} {(selectedCustomer.credit_limit || 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[42vh] divide-y divide-slate-800/60">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 space-y-2">
                <ShoppingCart className="w-10 h-10 text-slate-700" />
                <p className="text-xs">Cart is empty. Scan barcode or click item to start billing.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.product_id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.image_url && (
                      <div className="w-8 h-8 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-200 truncate">{item.product_name}</h5>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currencySymbol} {(item.unit_price || 0).toLocaleString()} × {item.quantity} {item.unit}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => handleUpdateQty(item.product_id, -1)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-slate-100 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.product_id, 1)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[70px]">
                    <div className="font-black text-slate-100">
                      {currencySymbol} {(item.total_price || 0).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Checkout Trigger */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            {/* Subtotal / Discount / Tax */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} items):</span>
                <span className="font-mono text-slate-200">
                  {currencySymbol} {(subtotal || 0).toLocaleString()}
                </span>
              </div>

              {/* Discount Selector */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>Discount:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15].map((d) => (
                    <button
                      key={d}
                      onClick={() => setGlobalDiscountPercent(d)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        globalDiscountPercent === d
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                  {discountTotal > 0 && (
                    <span className="text-emerald-400 font-mono text-[11px] ml-1">
                      -{currencySymbol} {discountTotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span>VAT ({taxRate}%):</span>
                  <span className="font-mono text-slate-200">
                    {currencySymbol} {taxTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Associate Commission Generated on this bill */}
              {activeAssociate && commissionAmount > 0 && (
                <div className="flex justify-between items-center py-1 px-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300">
                  <span className="flex items-center gap-1 text-[11px] font-semibold">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Associate Comm ({activeAssociate.code} • {effectiveCommissionRate}%):</span>
                  </span>
                  <span className="font-mono font-bold text-xs">
                    +{currencySymbol} {commissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-slate-100">
                <span className="font-bold text-sm">Grand Total:</span>
                <span className="font-black text-2xl text-emerald-400 tracking-tight">
                  {currencySymbol} {(grandTotal || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* License Lock Warning if applicable */}
            {isLicenseLocked ? (
              <div className="p-3 bg-rose-950/80 border border-rose-600 rounded-xl text-center text-xs text-rose-200 space-y-1">
                <Lock className="w-5 h-5 text-rose-400 mx-auto" />
                <p className="font-bold">POS Billing Locked by Super Admin</p>
                <p className="text-[11px] text-rose-300">
                  {currentLicense?.suspend_reason || 'License verification pending. Please contact WCS.'}
                </p>
              </div>
            ) : (
              <button
                disabled={cartItems.length === 0}
                onClick={handleOpenPayment}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Banknote className="w-5 h-5" />
                <span>PAY & COMPLETE ({currencySymbol} {(grandTotal || 0).toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scale & Weighing Modal (Grocery KG Mode) */}
      {weighingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-sm w-full p-6 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Weighing Scale Input</h3>
              </div>
              <button 
                type="button"
                onClick={() => setWeighingProduct(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {weighingProduct.image_url && (
                <img
                  src={weighingProduct.image_url}
                  alt={weighingProduct.name}
                  className="w-11 h-11 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-200 text-sm truncate">{weighingProduct.name}</div>
                <div className="text-xs text-emerald-400 font-bold mt-0.5">
                  Rate: {currencySymbol} {(weighingProduct.selling_price || 0).toLocaleString()} / KG
                </div>
              </div>
            </div>

            {/* Quick Weight Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[0.25, 0.5, 1.0, 2.0, 2.5, 5.0].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setWeighWeightKg(w);
                    setTimeout(() => {
                      weighInputRef.current?.focus();
                      weighInputRef.current?.select();
                    }, 10);
                  }}
                  className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    Number(weighWeightKg) === w
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {w} kg
                </button>
              ))}
            </div>

            {/* Form wrapping Custom Weight Input & Submit */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmWeighing();
              }}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-slate-400 uppercase font-semibold">
                    Weight in Kilograms (KG):
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Press ↵ Enter to add
                  </span>
                </div>
                <input
                  ref={weighInputRef}
                  type="number"
                  step="0.005"
                  min="0.001"
                  value={weighWeightKg}
                  onChange={(e) => setWeighWeightKg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmWeighing();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setWeighingProduct(null);
                    }
                  }}
                  autoFocus
                  placeholder="e.g. 1.0"
                  className="w-full bg-slate-950 border-2 border-emerald-500/70 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-2xl font-black text-emerald-400 text-center font-mono focus:outline-hidden ring-2 ring-emerald-500/20"
                />
              </div>

              {/* Calculated Price */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Price:</span>
                <span className="text-base font-black text-white font-mono">
                  {currencySymbol} {((parseFloat(String(weighWeightKg)) || 0) * (isWholesaleTier && weighingProduct.wholesale_price ? weighingProduct.wholesale_price : weighingProduct.selling_price)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeighingProduct(null)}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <span>Add Weighed Item to Cart</span>
                  <span className="text-[10px] bg-emerald-700/70 px-1.5 py-0.5 rounded text-emerald-100 font-mono">↵ Enter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method & Cash Tender Modal (Fully Detailed & Responsive) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-[#101726] border border-slate-800 rounded-2xl max-w-xl w-full max-h-[94vh] flex flex-col text-slate-100 shadow-2xl animate-in zoom-in-95 overflow-hidden">
            {/* Modal Fixed Top Bar */}
            <div className="shrink-0 px-5 py-3 border-b border-slate-800/80 bg-[#0b111e] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Payment & Checkout</h3>
                  <p className="text-[10px] text-slate-400">Full pay, half pay, or pay any value with customer credit ledger</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-lg text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">Grand Total</span>
                  <span className="text-sm font-black text-amber-400 font-mono leading-tight">
                    {currencySymbol} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
              {/* Customer Info & Selection Header */}
              <div className="p-3 bg-[#0a101d] rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">
                        {selectedCustomer ? selectedCustomer.name : 'Walk-in Retail Customer'}
                      </div>
                      {selectedCustomer ? (
                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          <span>Tel: {selectedCustomer.phone}</span>
                          <span className="text-amber-400 font-semibold font-mono">
                            Debt: {currencySymbol} {(selectedCustomer.current_balance || 0).toLocaleString()}
                          </span>
                          <span className="text-amber-300 font-semibold font-mono inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Loyalty: {(selectedCustomer.loyalty_points || 0).toLocaleString()} pts ({currencySymbol} {(selectedCustomer.loyalty_points || 0).toLocaleString()})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Select customer to enable credit ledger balance & earn loyalty points</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 relative" ref={customerSearchRef}>
                    {/* Customer Search & Select Combobox */}
                    <div className="relative min-w-[240px] sm:min-w-[280px]">
                      {selectedCustomer ? (
                        <div className="flex items-center justify-between gap-1.5 bg-slate-950 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-[11px] text-amber-200">
                          <div className="truncate flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{selectedCustomer.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({selectedCustomer.phone})</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(null);
                                setCustomerSearchQuery('');
                                setShowCustomerSearchDropdown(true);
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded-sm hover:bg-slate-800 transition-colors"
                              title="Change customer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {/* Optional Search Mode Switcher: All, Customer Name, Phone Number */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-slate-400 font-medium">Search for:</span>
                            <button
                              type="button"
                              onClick={() => setCustomerSearchMode('ALL')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                customerSearchMode === 'ALL'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              All
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerSearchMode('NAME')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                customerSearchMode === 'NAME'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              Customer Name
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomerSearchMode('PHONE')}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                                customerSearchMode === 'PHONE'
                                  ? 'bg-amber-500 text-slate-950 font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              Phone Number
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              value={customerSearchQuery}
                              onChange={(e) => {
                                setCustomerSearchQuery(e.target.value);
                                setShowCustomerSearchDropdown(true);
                              }}
                              onFocus={() => setShowCustomerSearchDropdown(true)}
                              placeholder={
                                customerSearchMode === 'NAME'
                                  ? '🔍 Search customer by name...'
                                  : customerSearchMode === 'PHONE'
                                  ? '🔍 Search customer by phone number...'
                                  : '🔍 Search name or phone number...'
                              }
                              className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 text-[11px] rounded-lg pl-7 pr-7 py-1.5 focus:border-amber-400 focus:outline-hidden"
                            />
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
                            {customerSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCustomerSearchQuery('')}
                                className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dropdown Results List */}
                      {showCustomerSearchDropdown && (
                        <div className="absolute right-0 top-full mt-1 w-full sm:w-[320px] max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 divide-y divide-slate-800">
                          {/* Walk-in Retail option */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setShowCustomerSearchDropdown(false);
                              setCustomerSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 text-[11px] flex items-center justify-between hover:bg-slate-800 transition-colors ${
                              !selectedCustomer ? 'bg-slate-800/60 text-amber-300 font-semibold' : 'text-slate-300'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Walk-in Retail Customer
                            </span>
                            {!selectedCustomer && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </button>

                          {/* Filtered Customers List */}
                          {(() => {
                            const q = customerSearchQuery.trim().toLowerCase();
                            const matches = customers.filter((c) => {
                              if (!q) return true;
                              if (customerSearchMode === 'NAME') {
                                return (
                                  (c.name || '').toLowerCase().includes(q) ||
                                  (c.nic_or_br && c.nic_or_br.toLowerCase().includes(q))
                                );
                              }
                              if (customerSearchMode === 'PHONE') {
                                return (c.phone || '').toLowerCase().includes(q);
                              }
                              return (
                                (c.name || '').toLowerCase().includes(q) ||
                                (c.phone || '').toLowerCase().includes(q) ||
                                (c.nic_or_br && c.nic_or_br.toLowerCase().includes(q)) ||
                                (c.nic && c.nic.toLowerCase().includes(q))
                              );
                            });

                            if (matches.length === 0) {
                              return (
                                <div className="px-3 py-2.5 text-[11px] text-slate-400 text-center">
                                  No customer found for "{customerSearchQuery}".
                                  <div className="text-[10px] text-amber-400 mt-0.5">Use "+ Quick Add" to create.</div>
                                </div>
                              );
                            }

                            return matches.map((c) => {
                              const isSelected = selectedCustomer?.id === c.id;
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setShowCustomerSearchDropdown(false);
                                    setCustomerSearchQuery('');
                                  }}
                                  className={`w-full text-left px-3 py-2 text-[11px] flex items-center justify-between hover:bg-slate-800 transition-colors ${
                                    isSelected ? 'bg-amber-950/40 text-amber-300 border-l-2 border-amber-400' : 'text-slate-200'
                                  }`}
                                >
                                  <div className="truncate pr-2">
                                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                                      <span>{c.name}</span>
                                      {c.loyalty_points ? (
                                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-normal">
                                          {c.loyalty_points} pts
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                      <span>Tel: {c.phone}</span>
                                      {(c.current_balance || 0) > 0 && (
                                        <span className="text-rose-400 font-mono">
                                          Debt: {currencySymbol} {(c.current_balance || 0).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Quick Add Customer Button */}
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-lg text-[11px] font-bold transition-colors shrink-0 whitespace-nowrap"
                    >
                      {showQuickAddCustomer ? 'Cancel' : '+ Quick Add'}
                    </button>
                  </div>
                </div>

                {/* Inline Quick Add Customer Form */}
                {showQuickAddCustomer && (
                  <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl text-left space-y-2 text-xs animate-in fade-in-50">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Quick Register Customer for Credit Ledger:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Customer Name *</label>
                        <input
                          type="text"
                          value={quickCustName}
                          onChange={(e) => setQuickCustName(e.target.value)}
                          placeholder="e.g. Sunil Perera"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Phone Number *</label>
                        <input
                          type="text"
                          value={quickCustPhone}
                          onChange={(e) => setQuickCustPhone(e.target.value)}
                          placeholder="077 123 4567"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Default Credit Limit: {currencySymbol} {quickCustCreditLimit.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!quickCustName.trim()) {
                            alert('Please enter customer name');
                            return;
                          }
                          const newCust = addCustomer({
                            name: quickCustName.trim(),
                            phone: quickCustPhone.trim() || 'N/A',
                            credit_limit: Number(quickCustCreditLimit) || 25000,
                            current_balance: 0,
                            loyalty_points: 0,
                            notes: 'Quick-registered at POS Checkout',
                          });
                          setSelectedCustomer(newCust);
                          setShowQuickAddCustomer(false);
                          setQuickCustName('');
                          setQuickCustPhone('+94 7');
                        }}
                        className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                      >
                        Save & Select Customer
                      </button>
                    </div>
                  </div>
                )}

                {/* Associate Assignment (Optional) */}
                <div className="text-[11px] text-slate-400 pt-0.5">
                  {activeAssociate ? (
                    <span className="text-amber-300 inline-flex items-center gap-1 font-semibold">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Associate: <strong className="text-white">[{activeAssociate.code}] {activeAssociate.name}</strong></span>
                      <span className="text-amber-400 font-mono">(Comm: {currencySymbol} {commissionAmount.toFixed(2)})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">Direct Cashier (No Associate Code - Optional)</span>
                  )}
                </div>
              </div>

              {/* Customer Loyalty Points (Optional Pay & Redeem System) */}
              <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 rounded-xl border border-amber-500/40 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                        <span>Customer Loyalty Account</span>
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-normal">Optional Pay</span>
                      </div>
                      {selectedCustomer ? (
                        <div className="text-[10px] text-slate-300">
                          Balance: <strong className="text-white font-mono">{(selectedCustomer.loyalty_points || 0).toLocaleString()} pts</strong> (Value: <strong className="text-emerald-400 font-mono">{currencySymbol} {(selectedCustomer.loyalty_points || 0).toLocaleString()}</strong>)
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">
                          Select customer above to earn points on this bill or redeem points.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Points Earned Preview */}
                  {selectedCustomer && (
                    <div className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 rounded-md text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                      <span>+{Math.floor(grandTotal / 100)} pts will be added</span>
                    </div>
                  )}
                </div>

                {/* Optional Loyalty Points Redemption Controls */}
                {selectedCustomer && (selectedCustomer.loyalty_points || 0) > 0 ? (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useLoyaltyPoints}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setUseLoyaltyPoints(checked);
                            if (checked) {
                              const maxPts = Math.min(selectedCustomer.loyalty_points || 0, Math.ceil(grandTotal));
                              setLoyaltyPointsToRedeem(maxPts);
                              const rem = Math.max(0, Number((grandTotal - maxPts).toFixed(2)));
                              setPaidAmount(rem);
                            } else {
                              setLoyaltyPointsToRedeem(0);
                              setPaidAmount(Number(grandTotal.toFixed(2)));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
                        />
                        <span className="font-bold text-amber-300 text-xs">
                          Pay / Redeem Loyalty Points for this Bill (Optional)
                        </span>
                      </label>

                      {useLoyaltyPoints && loyaltyPointsToRedeem > 0 && (
                        <span className="text-[11px] text-emerald-400 font-mono font-bold">
                          -{currencySymbol} {loyaltyPointsToRedeem.toLocaleString()} Discount
                        </span>
                      )}
                    </div>

                    {useLoyaltyPoints && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-400">Points to pay:</span>
                        <input
                          type="number"
                          min="1"
                          max={Math.min(selectedCustomer.loyalty_points || 0, Math.ceil(grandTotal))}
                          value={loyaltyPointsToRedeem || ''}
                          onChange={(e) => {
                            const maxLimit = Math.min(selectedCustomer.loyalty_points || 0, Math.ceil(grandTotal));
                            const entered = Math.max(0, Math.min(Number(e.target.value) || 0, maxLimit));
                            setLoyaltyPointsToRedeem(entered);
                            const rem = Math.max(0, Number((grandTotal - entered).toFixed(2)));
                            setPaidAmount(rem);
                          }}
                          className="w-24 bg-slate-900 border border-amber-500/60 rounded-md px-2 py-1 text-center font-mono font-bold text-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const maxPts = Math.min(selectedCustomer.loyalty_points || 0, Math.ceil(grandTotal));
                            setLoyaltyPointsToRedeem(maxPts);
                            const rem = Math.max(0, Number((grandTotal - maxPts).toFixed(2)));
                            setPaidAmount(rem);
                          }}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-md text-[10px] font-bold transition-colors"
                        >
                          Use Max ({Math.min(selectedCustomer.loyalty_points || 0, Math.ceil(grandTotal))})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLoyaltyPointsToRedeem(0);
                            setPaidAmount(Number(grandTotal.toFixed(2)));
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Explicit Total - Loyalty = Balance Calculation Display */}
                    {useLoyaltyPoints && loyaltyPointsToRedeem > 0 && (
                      <div className="p-2.5 bg-[#0a101d] rounded-lg border border-amber-500/40 text-[11px] font-mono space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span>Total:</span>
                          <span>{currencySymbol} {grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-amber-400">
                          <span>(-) Loyalty Points Redeemed:</span>
                          <span>-{currencySymbol} {loyaltyPointsToRedeem.toFixed(2)} ({loyaltyPointsToRedeem} pts)</span>
                        </div>
                        <div className="flex justify-between font-black text-emerald-400 border-t border-slate-800 pt-1 text-xs">
                          <span>(=) Balance (Total - Loyalty):</span>
                          <span>{currencySymbol} {Math.max(0, Number((grandTotal - loyaltyPointsToRedeem).toFixed(2))).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedCustomer ? (
                  <div className="bg-slate-950/60 p-2 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Customer currently has 0 points.</span>
                    <span className="text-emerald-400 font-semibold">Paying this bill will add +{Math.floor(grandTotal / 100)} points to their account!</span>
                  </div>
                ) : null}
              </div>

              {/* 5 Payment Method Cards (Grid Row) */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'CREDIT', label: 'Credit', icon: Users },
                  { id: 'QR_PAY', label: 'LankaQR', icon: QrCode },
                  { id: 'LOYALTY_POINTS', label: 'Loyalty Pay', icon: Sparkles },
                ].map((m) => {
                  const IconComponent = m.icon;
                  const isActive = paymentMethod === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => {
                        if (m.id === 'LOYALTY_POINTS') {
                          if (!selectedCustomer) {
                            alert('Please select a customer first to pay with Loyalty Points.');
                            return;
                          }
                          const custPts = selectedCustomer.loyalty_points || 0;
                          if (custPts <= 0) {
                            alert(`${selectedCustomer.name} has 0 loyalty points currently.`);
                            return;
                          }
                          setPaymentMethod('LOYALTY_POINTS');
                          setUseLoyaltyPoints(true);
                          const maxRedeem = Math.min(custPts, Math.ceil(grandTotal));
                          setLoyaltyPointsToRedeem(maxRedeem);
                          const rem = Math.max(0, Number((grandTotal - maxRedeem).toFixed(2)));
                          setPaidAmount(rem);
                          return;
                        }

                        setPaymentMethod(m.id as PaymentMethod);
                        if (m.id === 'CREDIT') {
                          setPaidAmount(0);
                        } else if (paidAmount === 0) {
                          const netToPay = useLoyaltyPoints ? Math.max(0, Number((grandTotal - loyaltyPointsToRedeem).toFixed(2))) : Math.ceil(grandTotal);
                          setPaidAmount(netToPay);
                        }
                      }}
                      className={`py-2 px-1 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-[#0a101d] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-slate-950' : m.id === 'LOYALTY_POINTS' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold truncate w-full">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tender & Amount Received Box (Allows paying ANY value) */}
              {paymentMethod !== 'CREDIT' && (
                <div className="bg-[#0a101d] border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>Amount Received Now ({paymentMethod}):</span>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                        Pay Any Value
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const netTarget = useLoyaltyPoints ? Math.max(0, Number((grandTotal - loyaltyPointsToRedeem).toFixed(2))) : Number(grandTotal.toFixed(2));
                          setPaidAmount(netTarget);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                        title="Set net balance payable"
                      >
                        Net Balance: {currencySymbol} {(useLoyaltyPoints ? Math.max(0, grandTotal - loyaltyPointsToRedeem) : grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(0)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Big Numeric Tender Input with Yellow Ring - Pay Any Value */}
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={paidAmount || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setPaidAmount(val);
                      }}
                      placeholder="Enter ANY payment amount"
                      className="w-full bg-[#111928] border-2 border-amber-400 rounded-xl px-4 py-2.5 text-2xl font-black text-white text-center font-mono focus:outline-hidden ring-2 ring-amber-400/20"
                    />
                  </div>

                  {/* Quick Denominations and Add-Value Increments */}
                  <div className="space-y-1.5">
                    {/* Currency Notes */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {[100, 500, 1000, 2000, 5000].map((val) => (
                        <button
                          type="button"
                          key={`denom-${val}`}
                          onClick={() => setPaidAmount(val)}
                          className="py-1 px-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-bold rounded-lg text-center transition-colors font-mono truncate cursor-pointer"
                        >
                          {currencySymbol} {val.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {/* Quick +Increment buttons for easily typing any value */}
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                      <span className="text-[9px] uppercase font-bold text-slate-500">Quick Add:</span>
                      {[100, 500, 1000].map((inc) => (
                        <button
                          type="button"
                          key={`inc-${inc}`}
                          onClick={() => {
                            const newAmt = Number(((paidAmount || 0) + inc).toFixed(2));
                            setPaidAmount(newAmt);
                          }}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono font-bold cursor-pointer transition-colors"
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Calculation & Credit Ledger Breakdown (Full Details Display) */}
                  {paidAmount < grandTotal && paidAmount > 0 ? (
                    /* HALF PAY / ANY VALUE PARTIAL PAY DETECTED */
                    <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2 text-xs animate-in fade-in-50">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Partial / Split Pay Active (Pay Any Value)</span>
                        </span>
                        <span className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-500/30 uppercase font-mono font-bold">
                          Split to Credit Ledger
                        </span>
                      </div>

                      {/* 3-Column Financial Grid */}
                      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-950/80 rounded-lg text-center font-mono border border-slate-800">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Bill Total</div>
                          <div className="text-white font-bold text-sm">
                            {currencySymbol} {grandTotal.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-emerald-400 uppercase font-bold">Paid Now ({paymentMethod})</div>
                          <div className="text-emerald-400 font-bold text-sm">
                            -{currencySymbol} {paidAmount.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-rose-400 uppercase font-bold">Balance to Credit Ledger</div>
                          <div className="text-rose-400 font-black text-sm">
                            +{currencySymbol} {(grandTotal - paidAmount).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Clear Mathematical Formula Explanation */}
                      <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 text-center">
                        <span className="text-slate-400">Calculation: </span>
                        <span>{grandTotal.toFixed(2)} (Total) - {paidAmount.toFixed(2)} (Paid) = </span>
                        <strong className="text-rose-400 font-bold">+{(grandTotal - paidAmount).toFixed(2)} (Credit Ledger)</strong>
                      </div>

                      {/* Customer Ledger Notice & Balance Preview */}
                      <div className="text-[11px] pt-1">
                        {selectedCustomer ? (
                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-500/30 text-slate-200 space-y-1">
                            <div>
                              <span>Remaining balance <strong className="text-rose-400 font-mono text-xs">{currencySymbol} {(grandTotal - paidAmount).toFixed(2)}</strong> will be added to </span>
                              <strong className="text-amber-300 font-bold">{selectedCustomer.name}</strong>'s credit ledger (Udalu).
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                              <span>Customer: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.phone})</span>
                              <span>New Total Debt: <strong className="text-white font-mono">{currencySymbol} {((selectedCustomer.current_balance || 0) + (grandTotal - paidAmount)).toLocaleString()}</strong></span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-200 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-rose-300 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Customer Required for Credit Ledger:</span>
                            </div>
                            <p className="text-[11px] text-rose-200/90 leading-tight">
                              Please select a customer from the dropdown above or click <strong>+ Quick Add</strong> to assign this <strong>{currencySymbol} {(grandTotal - paidAmount).toFixed(2)}</strong> balance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : paidAmount >= grandTotal ? (
                    /* FULL PAY / CHANGE OUTPUT */
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">Change / Balance to Return:</span>
                        <span
                          className={`font-mono text-base font-black ${
                            changeDue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {currencySymbol} {changeDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-medium">
                        ✓ Bill fully settled ({paymentMethod}). No credit ledger debt added.
                      </div>
                    </div>
                  ) : (
                    /* PAID AMOUNT IS ZERO */
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs text-center">
                      Enter any tender amount received above. If customer pays Rs. 0 now, select <strong>100% Credit</strong>.
                    </div>
                  )}
                </div>
              )}

              {/* 100% Credit Warning */}
              {paymentMethod === 'CREDIT' && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 space-y-2 animate-in fade-in-50">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>100% Customer Credit Sale (Udalu):</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    {selectedCustomer ? (
                      <div className="space-y-1">
                        <p>
                          The entire bill of <strong className="text-amber-300 font-mono">{currencySymbol} {grandTotal.toFixed(2)}</strong> will be recorded as outstanding debt for <strong className="text-white">{selectedCustomer.name}</strong>.
                        </p>
                        <div className="text-[11px] text-slate-400 mt-1 pt-1 border-t border-amber-500/20 flex items-center justify-between">
                          <span>Current Debt: {currencySymbol} {(selectedCustomer.current_balance || 0).toLocaleString()}</span>
                          <span>➜ New Total Debt: <strong className="text-amber-300 font-mono text-xs">{currencySymbol} {((selectedCustomer.current_balance || 0) + grandTotal).toLocaleString()}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Please select or register a customer above to record this credit transaction into their ledger.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Fixed Sticky Bottom Action Bar (Always Visible!) */}
            <div className="shrink-0 border-t border-slate-800 bg-[#0a101d] px-5 py-3 flex items-center justify-between gap-3">
              {/* Live Status Summary */}
              <div className="text-xs">
                {paymentMethod === 'CREDIT' ? (
                  <span className="text-amber-400 font-bold font-mono">
                    100% Credit: {currencySymbol} {grandTotal.toFixed(2)}
                  </span>
                ) : useLoyaltyPoints && loyaltyPointsToRedeem > 0 ? (
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-slate-300">Total: {currencySymbol} {grandTotal.toFixed(2)}</span>
                    <span className="text-amber-400 font-bold">- Loyalty: {currencySymbol} {loyaltyPointsToRedeem.toFixed(2)}</span>
                    <span className="text-emerald-400 font-black">= Balance: {currencySymbol} {Math.max(0, Number((grandTotal - loyaltyPointsToRedeem).toFixed(2))).toFixed(2)}</span>
                  </div>
                ) : paidAmount > 0 && paidAmount < grandTotal ? (
                  <div className="space-x-1 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">Paid: {currencySymbol} {paidAmount.toFixed(2)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-rose-400 font-bold">Ledger: +{currencySymbol} {(grandTotal - paidAmount).toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Tendered: <strong className="text-white">{currencySymbol} {(paidAmount || 0).toFixed(2)}</strong>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {/* Optional KOT Kitchen Slip Button */}
                {enabledMods.restaurant_kot && (
                  <button
                    type="button"
                    onClick={() => {
                      queuePrintJob(
                        'KITCHEN',
                        `KOT Kitchen Slip (${tableNumber || 'Takeaway'})`,
                        `Items: ${cartItems.length} | Table: ${tableNumber}`
                      );
                      openCleanKotPrintTab({
                        tenant: currentTenant,
                        tableNumber: orderType === 'DINE_IN' ? tableNumber : orderType,
                        orderType,
                        cashierName: currentUser?.full_name || 'Cashier',
                        customerName: selectedCustomer?.name,
                        notes,
                        items: cartItems.map((ci) => ({
                          product_name: ci.product_name,
                          quantity: ci.quantity,
                          unit: ci.unit,
                        })),
                      });
                    }}
                    className="px-3 py-2.5 bg-[#141d2d] hover:bg-[#1a263b] text-amber-400 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print Kitchen Order Ticket (KOT)"
                  >
                    <span>🍴</span>
                    <span>KOT Only</span>
                  </button>
                )}

                {/* Big PAY & PRINT BILL [F8] in Gold */}
                <button
                  type="button"
                  onClick={handleCompleteSale}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>PAY & PRINT BILL [F8]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {completedSale && (
        <PrintReceiptModal
          sale={completedSale}
          tenant={currentTenant}
          settings={currentSettings}
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}

      {/* Quick Recent Bills & Reprint Modal */}
      {isRecentBillsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Recent POS Invoices & Bill Reprint</h3>
              </div>
              <button
                onClick={() => setIsRecentBillsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 bg-slate-950/50">
              <input
                type="text"
                value={recentBillsSearch}
                onChange={(e) => setRecentBillsSearch(e.target.value)}
                placeholder="Search recent invoice # or customer..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {safeSales
                .filter((s) => {
                  if (!s) return false;
                  const q = recentBillsSearch.toLowerCase();
                  return (
                    (s.invoice_no || '').toLowerCase().includes(q) ||
                    (s.customer_name || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 20)
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-400">{s.invoice_no}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-bold">
                          {s.payment_method}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {s.customer_name || 'Walk-in'} • {(s.items || []).length} items
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-white font-mono">
                          {currencySymbol} {(s.grand_total || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">by {s.cashier_name}</div>
                      </div>

                      <button
                        onClick={() => {
                          setCompletedSale(s);
                          setIsReceiptOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Reprint</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsRecentBillsModalOpen(false);
                          handleOpenPosReturn(s);
                        }}
                        className="px-2.5 py-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-700/60 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors"
                        title="Process Return / Exchange for this Bill"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>Return</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* POS DAY OPEN (FLOAT DEPOSIT) MODAL */}
      {isDayOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  Morning Cash Float
                </span>
                <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-emerald-400" />
                  <span>Day Open — Start Shift Float</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDayOpenModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                openDayShift({
                  counter_id: activeBillingCounter?.id,
                  counter_name: activeBillingCounter?.name,
                  cashier_id: currentUser?.id,
                  cashier_name: currentUser?.full_name,
                  opening_float: Number(posDayOpenFloat),
                  notes: posDayOpenNotes || 'Day Open starting float deposit',
                });
                setIsDayOpenModalOpen(false);
                alert(`✅ Day Open Shift started on ${activeBillingCounter?.name} with Rs. ${posDayOpenFloat.toLocaleString()} float!`);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">
                  Counter: <span className="text-white">{activeBillingCounter?.name}</span>
                </label>
                <div className="mt-1 text-xs text-slate-300">
                  Cashier: <strong className="text-white">{currentUser?.full_name}</strong>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Starting Cash Float / Deposit ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={posDayOpenFloat}
                  onChange={(e) => setPosDayOpenFloat(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-lg font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-1.5 mt-2">
                  {[2000, 5000, 10000, 15000, 20000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPosDayOpenFloat(val)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                    >
                      Rs. {val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Verified change coins and 100 notes"
                  value={posDayOpenNotes}
                  onChange={(e) => setPosDayOpenNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDayOpenModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  Open Shift & Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS DAY END (CASH WITHDRAWAL & Z-REPORT) MODAL */}
      {isDayEndModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                  Shift Close & Settlement
                </span>
                <h3 className="text-base font-black text-white mt-1 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <span>Day End Close & Cash Withdrawal</span>
                </h3>
              </div>
              <button
                onClick={() => setIsDayEndModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                closeDayShift({
                  shift_id: activeShift.id,
                  closing_cash_actual: Number(posDayEndActualCash),
                  cash_withdrawal_amount: Number(posDayEndWithdrawal),
                  retained_float_for_next_day: Number(posDayEndRetainedFloat),
                  withdrawal_notes: posDayEndWithdrawalNotes,
                });
                setIsDayEndModalOpen(false);
                alert(`✅ Day End Shift closed successfully and Z-Report generated!`);
              }}
              className="space-y-4"
            >
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Shift ID / Counter:</span>
                  <span className="font-mono text-white font-bold">{activeShift.id} ({activeShift.counter_name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Opening Float:</span>
                  <span className="text-slate-200">Rs. {activeShift.opening_float.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cash Sales:</span>
                  <span className="text-emerald-400 font-bold">+ Rs. {activeShift.total_cash_sales.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Physical Counted Cash in Drawer ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={posDayEndActualCash}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPosDayEndActualCash(val);
                    setPosDayEndWithdrawal(Math.max(0, val - posDayEndRetainedFloat));
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-base font-black text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="bg-rose-950/40 p-3.5 rounded-xl border border-rose-800/40 space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-rose-300 uppercase">
                    Cash Withdrawal to Safe / Bank ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={posDayEndWithdrawal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPosDayEndWithdrawal(val);
                      setPosDayEndRetainedFloat(Math.max(0, posDayEndActualCash - val));
                    }}
                    className="w-full mt-1 bg-slate-950 border border-rose-700/60 rounded-xl px-3 py-1.5 text-base font-bold text-rose-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Retained Float for Tomorrow's Shift ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={posDayEndRetainedFloat}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPosDayEndRetainedFloat(val);
                      setPosDayEndWithdrawal(Math.max(0, posDayEndActualCash - val));
                    }}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Withdrawal Notes</label>
                <input
                  type="text"
                  value={posDayEndWithdrawalNotes}
                  onChange={(e) => setPosDayEndWithdrawalNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDayEndModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
                >
                  Close Shift & Print Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS CASH IN / CASH OUT MODAL */}
      {isCashInOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  cashInOutType === 'IN'
                    ? 'text-teal-400 bg-teal-950/80 border-teal-500/30'
                    : 'text-amber-400 bg-amber-950/80 border-amber-500/30'
                }`}>
                  {cashInOutType === 'IN' ? 'Cash Inflow Deposit' : 'Cash Outflow Payout'}
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {cashInOutType === 'IN' ? 'Cash In (Deposit)' : 'Cash Out (Payout Voucher)'}
                </h3>
              </div>
              <button
                onClick={() => setIsCashInOutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cashInOutType === 'IN') {
                  recordCashDrawerIn({
                    counter_id: activeBillingCounter?.id,
                    amount: Number(posCashInOutAmount),
                    category: posCashInOutCategory,
                    reason: posCashInOutReason,
                  });
                  alert(`✅ Cash In deposit of Rs. ${posCashInOutAmount.toLocaleString()} recorded!`);
                } else {
                  recordCashDrawerOut({
                    counter_id: activeBillingCounter?.id,
                    amount: Number(posCashInOutAmount),
                    category: posCashInOutCategory,
                    reason: posCashInOutReason,
                  });
                  alert(`✅ Cash Out payout of Rs. ${posCashInOutAmount.toLocaleString()} recorded!`);
                }
                setIsCashInOutModalOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={posCashInOutAmount}
                  onChange={(e) => setPosCashInOutAmount(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-base font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">Category</label>
                <select
                  value={posCashInOutCategory}
                  onChange={(e) => setPosCashInOutCategory(e.target.value as any)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {cashInOutType === 'IN' ? (
                    <>
                      <option value="CHANGE_REPLENISH">Change Replenish</option>
                      <option value="FLOAT">Additional Shift Float</option>
                      <option value="PETTY_CASH">Petty Cash Deposit</option>
                      <option value="OTHER">Other Deposit</option>
                    </>
                  ) : (
                    <>
                      <option value="PETTY_CASH">Petty Cash / Refreshments</option>
                      <option value="SUPPLIER_PAYMENT">Supplier Direct Cash Payment</option>
                      <option value="BANK_DROP">Mid-Day Safe Drop</option>
                      <option value="OWNER_DRAW">Owner / Manager Cash Draw</option>
                      <option value="OTHER">Other Payout</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 uppercase">Reason / Payee</label>
                <input
                  type="text"
                  required
                  value={posCashInOutReason}
                  onChange={(e) => setPosCashInOutReason(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCashInOutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all cursor-pointer ${
                    cashInOutType === 'IN' ? 'bg-teal-600 hover:bg-teal-500' : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  Save & Print Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Headquarter Direct Messages & Notices Modal in POS */}
      <ShopMessagesModal
        isOpen={isPosMessagesOpen}
        onClose={() => setIsPosMessagesOpen(false)}
      />

      {/* Browse & Select Shop Associate Modal */}
      {isAssociateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Select Shop Sales Associate</h3>
              </div>
              <button
                onClick={() => setIsAssociateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select or search an associate code to credit commission on this checkout:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tenantAssociates.map((assoc) => {
                const isSelected = activeAssociate?.id === assoc.id || activeAssociate?.code === assoc.code;
                return (
                  <div
                    key={assoc.id}
                    onClick={() => {
                      setSelectedAssociateId(assoc.id);
                      setAssociateCodeInput(assoc.code);
                      setCustomCommissionRate(null);
                      setIsAssociateModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-950/50 border-amber-500/80 text-white shadow-md'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {assoc.code}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{assoc.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{assoc.designation}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-mono font-black">
                        {assoc.rate}% Comm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedAssociateId('');
                  setAssociateCodeInput('');
                  setCustomCommissionRate(null);
                  setIsAssociateModalOpen(false);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Clear Selection (Direct Cashier)
              </button>
              <button
                type="button"
                onClick={() => setIsAssociateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS RETURN & ITEM EXCHANGE MODAL */}
      {isPosReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">POS Return & Exchange Terminal</h3>
                  <p className="text-[11px] text-slate-400">Process item returns, restock inventory & issue refunds or product replacements</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPosReturnModalOpen(false);
                  setPosSelectedReturnSale(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If no sale selected yet, show invoice search */}
            {!posSelectedReturnSale ? (
              <div className="space-y-4 py-2">
                <form onSubmit={handlePosLookupAndReturn} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      autoFocus
                      required
                      placeholder="Enter Sales Invoice No (e.g. INV-2025-001 or last 4 digits)..."
                      value={posReturnLookupInput}
                      onChange={(e) => setPosReturnLookupInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Invoice</span>
                  </button>
                </form>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Or select from Recent Bills ({safeSales.slice(0, 5).length}):</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {safeSales.slice(0, 8).map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => handleOpenPosReturn(sale)}
                        className="p-3 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div>
                          <div className="font-bold text-xs text-white font-mono">{sale.invoice_no}</div>
                          <div className="text-[11px] text-slate-400">
                            {sale.customer_name || 'Walk-in Customer'} • {(sale.items || []).length} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs text-rose-400 font-mono">
                            {currencySymbol} {(sale.grand_total || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(sale.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Selected sale details & return item list */
              <form onSubmit={handleProcessPosReturnSubmit} className="space-y-4">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-rose-400">{posSelectedReturnSale.invoice_no}</span>
                      <span className="text-slate-500">•</span>
                      <span>{posSelectedReturnSale.customer_name || 'Walk-in Customer'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Date: {new Date(posSelectedReturnSale.created_at).toLocaleString()} • Original Total: {currencySymbol} {(posSelectedReturnSale.grand_total || 0).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPosSelectedReturnSale(null)}
                    className="text-xs text-slate-400 hover:text-white underline font-medium"
                  >
                    Change Invoice
                  </button>
                </div>

                {/* Return Items Selection Table */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select Items & Quantity to Return:
                  </label>
                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-center">Sold Qty</th>
                          <th className="p-2.5 text-center">Return Qty</th>
                          <th className="p-2.5 text-right">Refund Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {posReturnItemsState.map((item, idx) => {
                          const refundForThis = item.return_quantity * item.unit_price;
                          return (
                            <tr key={`${item.product_id}-${idx}`} className="hover:bg-slate-800/40">
                              <td className="p-2.5 font-medium text-slate-200">{item.name}</td>
                              <td className="p-2.5 text-right font-mono text-slate-300">
                                {currencySymbol} {item.unit_price.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-400">{item.sold_quantity}</td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPosReturnItemsState((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, return_quantity: Math.max(0, it.return_quantity - 1) } : it
                                        )
                                      );
                                    }}
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-mono font-bold text-rose-300 text-sm">
                                    {item.return_quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPosReturnItemsState((prev) =>
                                        prev.map((it, i) =>
                                          i === idx ? { ...it, return_quantity: Math.min(it.sold_quantity, it.return_quantity + 1) } : it
                                        )
                                      );
                                    }}
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                                {currencySymbol} {refundForThis.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Return Mode Selection */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPosReturnMode('REFUND')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      posReturnMode === 'REFUND'
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>💸 Direct Cash / Credit Refund</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Return stock & refund money back to customer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosReturnMode('EXCHANGE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      posReturnMode === 'EXCHANGE'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>🔄 Item Exchange / Replacement</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Swap returned item for a different product</p>
                  </button>
                </div>

                {/* If Mode is REFUND: Choose refund type */}
                {posReturnMode === 'REFUND' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Refund Method:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash Refund' },
                        { id: 'CREDIT_NOTE', label: 'Customer Credit Note' },
                        { id: 'BANK_TRANSFER', label: 'Bank / Card Refund' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setPosRefundType(type.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                            posRefundType === type.id
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* If Mode is EXCHANGE: Choose replacement item */}
                {posReturnMode === 'EXCHANGE' && (
                  <div className="space-y-2 p-3 bg-slate-950/90 border border-slate-800 rounded-xl">
                    <label className="block text-xs font-bold text-indigo-300">
                      Select Replacement Product to Issue:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <select
                          value={posSelectedExchangeProduct?.id || ''}
                          onChange={(e) => {
                            const found = safeProducts.find((p) => p.id === e.target.value);
                            setPosSelectedExchangeProduct(found || null);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="">-- Choose Store Product --</option>
                          {safeProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {currencySymbol} {(p.selling_price || 0).toLocaleString()} (Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="1"
                          value={posExchangeQuantity}
                          onChange={(e) => setPosExchangeQuantity(Math.max(1, Number(e.target.value)))}
                          placeholder="Exchange Qty"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-center text-white"
                        />
                      </div>
                    </div>

                    {posSelectedExchangeProduct && (
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-300 font-medium">
                        <span>New Product Total:</span>
                        <span className="font-mono font-bold text-white">
                          {currencySymbol} {posExchangeProductTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Return / Exchange Reason:
                  </label>
                  <input
                    type="text"
                    required
                    value={posReturnReason}
                    onChange={(e) => setPosReturnReason(e.target.value)}
                    placeholder="e.g. Defective item / customer changed mind / size swap"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Return Summary Banner */}
                <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-300">Total Return Refund Value</span>
                    <div className="text-base font-black text-rose-400 font-mono">
                      {currencySymbol} {posTotalReturnRefundValue.toLocaleString()}
                    </div>
                  </div>

                  {posReturnMode === 'EXCHANGE' && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-indigo-300">
                        {posExchangePriceDifference > 0 ? 'Customer Pays Difference' : 'Shop Refunds Difference'}
                      </span>
                      <div className={`text-base font-black font-mono ${posExchangePriceDifference > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {currencySymbol} {Math.abs(posExchangePriceDifference).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPosReturnModalOpen(false);
                      setPosSelectedReturnSale(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={posTotalReturnRefundValue <= 0}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-rose-900/30 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm & Process Return</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* POS Return Success Floating Banner */}
      {posReturnSuccessMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-900/90 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-5 h-5 text-emerald-300" />
          <div className="text-xs font-bold">{posReturnSuccessMessage}</div>
          <button onClick={() => setPosReturnSuccessMessage(null)} className="text-emerald-300 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {isCustomRateOpen && activeAssociate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full p-5 text-slate-100 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">Override Commission Rate</h3>
              <button
                onClick={() => setIsCustomRateOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Associate: <strong className="text-amber-300">{activeAssociate.name} [{activeAssociate.code}]</strong>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Commission Rate (%):</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={customCommissionRate !== null ? customCommissionRate : activeAssociate.rate}
                  onChange={(e) => setCustomCommissionRate(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-bold font-mono text-amber-300 text-center"
                />
                <span className="text-lg font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[2.5, 3.5, 5.0, 7.5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCustomCommissionRate(r)}
                  className="py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono text-slate-200 rounded-lg"
                >
                  {r}%
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCustomCommissionRate(null);
                  setIsCustomRateOpen(false);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl"
              >
                Reset Default ({activeAssociate.rate}%)
              </button>
              <button
                type="button"
                onClick={() => setIsCustomRateOpen(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
