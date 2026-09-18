import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Supplier, PurchaseOrder, PurchaseReturn, Product } from '../../types';
import {
  Truck,
  Plus,
  Search,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  Building,
  Phone,
  Mail,
  MapPin,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  CreditCard,
  Share2,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  RotateCcw,
  Calendar,
  Eye,
  Send,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { getLocalizedProductName } from '../../i18n/translations';

interface POLineItemDraft {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  batch_no: string;
  expiry_date: string;
}

interface ReturnLineItemDraft {
  product_id: string;
  sku: string;
  name: string;
  return_quantity: number;
  unit_cost: number;
  total_credit: number;
  batch_no: string;
  reason: 'DAMAGED' | 'EXPIRED' | 'WRONG_ITEM' | 'EXCESS_STOCK' | 'QUALITY_DEFECT' | 'OTHER';
}

export const SupplierPurchasesManager: React.FC = () => {
  const {
    suppliers,
    purchases,
    purchaseReturns,
    products,
    currentTenant,
    currentUser,
    language,
    t,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSupplierPayment,
    createPurchaseOrder,
    receivePurchaseOrder,
    deletePurchaseOrder,
    processPurchaseReturn,
    deletePurchaseReturn,
    queuePrintJob,
  } = useRetail();

  const safeSuppliers = suppliers || [];
  const safePurchases = purchases || [];
  const safePurchaseReturns = purchaseReturns || [];
  const safeProducts = products || [];

  // Active Tab
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'PURCHASE_ORDERS' | 'PURCHASE_RETURNS'>('SUPPLIERS');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Supplier Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // Supplier Form State
  const [supplierName, setSupplierName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('+94 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [brNumber, setBrNumber] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  // Settle Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Purchase Order Create Modal State
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(safeSuppliers[0]?.id || '');
  const [poOrderDate, setPoOrderDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [poDeliveryDate, setPoDeliveryDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [poPaymentMethod, setPoPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT'>('CREDIT');
  const [poPaidAmount, setPoPaidAmount] = useState<number>(0);
  const [poStatus, setPoStatus] = useState<'PENDING' | 'RECEIVED'>('PENDING');
  const [poNotes, setPoNotes] = useState<string>('');
  const [poItems, setPoItems] = useState<POLineItemDraft[]>([]);

  // Item selector for PO
  const [selectedProductId, setSelectedProductId] = useState<string>(safeProducts[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemUnitCost, setItemUnitCost] = useState<number>(safeProducts[0]?.cost_price || 100);
  const [itemBatchNo, setItemBatchNo] = useState<string>(`B-${new Date().toISOString().slice(2, 7).replace('-', '')}`);
  const [itemExpiryDate, setItemExpiryDate] = useState<string>(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Purchase Return (Debit Note) Create Modal State
  const [isCreateReturnModalOpen, setIsCreateReturnModalOpen] = useState(false);
  const [returnSupplierId, setReturnSupplierId] = useState<string>(safeSuppliers[0]?.id || '');
  const [returnPoId, setReturnPoId] = useState<string>('');
  const [refundType, setRefundType] = useState<'DEBIT_NOTE' | 'CASH_REFUND' | 'REPLACEMENT'>('DEBIT_NOTE');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const [returnItems, setReturnItems] = useState<ReturnLineItemDraft[]>([]);

  // Return Item draft
  const [retProductId, setRetProductId] = useState<string>(safeProducts[0]?.id || '');
  const [retQty, setRetQty] = useState<number>(1);
  const [retUnitCost, setRetUnitCost] = useState<number>(safeProducts[0]?.cost_price || 100);
  const [retBatchNo, setRetBatchNo] = useState<string>('');
  const [retReason, setRetReason] = useState<ReturnLineItemDraft['reason']>('DAMAGED');

  // Preview & Voucher Modals
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [viewingReturn, setViewingReturn] = useState<PurchaseReturn | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- Supplier Actions ---
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setCompany('');
    setPhone('+94 ');
    setEmail('');
    setAddress('');
    setOpeningBalance(0);
    setBrNumber('');
    setBankDetails('');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierName(s.name);
    setCompany(s.company);
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setOpeningBalance(s.balance_payable || 0);
    setBrNumber(s.br_number || '');
    setBankDetails(s.bank_details || '');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      showToast('Please enter supplier contact name', 'error');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: supplierName.trim(),
        company: company.trim() || supplierName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        balance_payable: Number(openingBalance),
        br_number: brNumber.trim() || undefined,
        bank_details: bankDetails.trim() || undefined,
      });
      showToast(`Supplier "${supplierName}" updated successfully!`);
    } else {
      addSupplier({
        name: supplierName.trim(),
        company: company.trim() || supplierName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        balance_payable: Number(openingBalance),
        br_number: brNumber.trim() || undefined,
        bank_details: bankDetails.trim() || undefined,
      });
      showToast(`New supplier "${supplierName}" added successfully!`);
    }

    setIsSupplierModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    showToast(`Supplier "${supplierToDelete.name}" removed from directory.`);
    setSupplierToDelete(null);
  };

  const handleOpenPayment = (s: Supplier) => {
    setPayingSupplier(s);
    setPaymentAmount(s.balance_payable > 0 ? s.balance_payable : 1000);
    setPaymentMethod('CASH');
    setPaymentRef('');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || paymentAmount <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    recordSupplierPayment({
      supplier_id: payingSupplier.id,
      supplier_name: payingSupplier.name,
      amount: Number(paymentAmount),
      payment_method: paymentMethod,
      reference_no: paymentRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    showToast(`Payment of ${currencySymbol} ${paymentAmount.toLocaleString()} settled to ${payingSupplier.name}!`);
    setIsPaymentModalOpen(false);
  };

  // --- Purchase Order Draft & Save ---
  const handleProductSelectForPO = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = safeProducts.find((p) => p.id === prodId);
    if (prod) {
      setItemUnitCost(prod.cost_price || 0);
    }
  };

  const handleAddItemToPO = () => {
    const prod = safeProducts.find((p) => p.id === selectedProductId);
    if (!prod) {
      showToast('Please select a product', 'error');
      return;
    }
    if (itemQty <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    const newItem: POLineItemDraft = {
      product_id: prod.id,
      sku: prod.sku,
      name: prod.name,
      quantity: Number(itemQty),
      unit_cost: Number(itemUnitCost),
      total_cost: Number(itemQty) * Number(itemUnitCost),
      batch_no: itemBatchNo.trim() || `B-${Date.now().toString().slice(-4)}`,
      expiry_date: itemExpiryDate || '',
    };

    setPoItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItemFromPO = (index: number) => {
    setPoItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const poTotalAmount = useMemo(() => poItems.reduce((acc, it) => acc + it.total_cost, 0), [poItems]);
  const poBalanceDue = Math.max(0, poTotalAmount - Number(poPaidAmount));

  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (poItems.length === 0) {
      showToast('Please add at least one line item to the purchase order', 'error');
      return;
    }

    const supp = safeSuppliers.find((s) => s.id === selectedSupplierId);
    const supplierName = supp ? `${supp.name} (${supp.company})` : 'Supplier';

    const paymentStatus =
      Number(poPaidAmount) >= poTotalAmount ? 'PAID' : Number(poPaidAmount) > 0 ? 'PARTIAL' : 'UNPAID';

    const createdPO = createPurchaseOrder({
      supplier_id: selectedSupplierId,
      supplier_name: supplierName,
      items: poItems,
      total_amount: poTotalAmount,
      paid_amount: Number(poPaidAmount),
      balance_due: poBalanceDue,
      status: poStatus,
      payment_status: paymentStatus,
      payment_method: poPaymentMethod,
      order_date: poOrderDate,
      delivery_date: poDeliveryDate,
      notes: poNotes.trim() || undefined,
    });

    showToast(`Purchase Order ${createdPO.po_number} created successfully!`);
    setIsCreatePOModalOpen(false);
    setPoItems([]);
    setPoPaidAmount(0);
    setPoNotes('');
  };

  // --- Purchase Return Draft & Save ---
  const handleProductSelectForReturn = (prodId: string) => {
    setRetProductId(prodId);
    const prod = safeProducts.find((p) => p.id === prodId);
    if (prod) {
      setRetUnitCost(prod.cost_price || 0);
      if (prod.batches && prod.batches.length > 0) {
        setRetBatchNo(prod.batches[0].batch_no);
      }
    }
  };

  const handleAddItemToReturn = () => {
    const prod = safeProducts.find((p) => p.id === retProductId);
    if (!prod) {
      showToast('Please select a product', 'error');
      return;
    }
    if (retQty <= 0) {
      showToast('Return quantity must be greater than 0', 'error');
      return;
    }

    const newItem: ReturnLineItemDraft = {
      product_id: prod.id,
      sku: prod.sku,
      name: prod.name,
      return_quantity: Number(retQty),
      unit_cost: Number(retUnitCost),
      total_credit: Number(retQty) * Number(retUnitCost),
      batch_no: retBatchNo.trim() || 'DEFAULT',
      reason: retReason,
    };

    setReturnItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItemFromReturn = (index: number) => {
    setReturnItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const returnTotalAmount = useMemo(() => returnItems.reduce((acc, it) => acc + it.total_credit, 0), [returnItems]);

  const handleSavePurchaseReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    if (returnItems.length === 0) {
      showToast('Please add items to return', 'error');
      return;
    }

    const supp = safeSuppliers.find((s) => s.id === returnSupplierId);
    const supplierName = supp ? `${supp.name} (${supp.company})` : 'Supplier';

    const relatedPO = safePurchases.find((p) => p.id === returnPoId);

    const createdReturn = processPurchaseReturn({
      po_id: returnPoId || undefined,
      po_number: relatedPO?.po_number || undefined,
      supplier_id: returnSupplierId,
      supplier_name: supplierName,
      items: returnItems,
      total_return_amount: returnTotalAmount,
      refund_type: refundType,
      status: 'COMPLETED',
      notes: returnNotes.trim() || undefined,
    });

    showToast(`Debit Note ${createdReturn.return_number} issued successfully!`);
    setIsCreateReturnModalOpen(false);
    setReturnItems([]);
    setReturnNotes('');
  };

  // --- WhatsApp & Print Helpers ---
  const handleSharePOWhatsApp = (po: PurchaseOrder) => {
    const supp = safeSuppliers.find((s) => s.id === po.supplier_id);
    const phone = supp?.phone?.replace(/[^0-9]/g, '') || '';

    const itemsText = po.items
      .map((it, idx) => `${idx + 1}. ${it.name} | Qty: ${it.quantity} @ Rs.${(it.unit_cost || 0).toLocaleString()} = Rs.${(it.total_cost || 0).toLocaleString()}`)
      .join('\n');

    const msg =
      `*PURCHASE ORDER (PO)*\n` +
      `*${currentTenant?.shop_name}*\n` +
      `--------------------------------\n` +
      `*PO Number:* ${po.po_number}\n` +
      `*Date:* ${po.order_date}\n` +
      `*Expected Delivery:* ${po.delivery_date || 'ASAP'}\n` +
      `*Supplier:* ${po.supplier_name}\n` +
      `--------------------------------\n` +
      `*ITEMS ORDERED:*\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `*Total Amount:* Rs. ${(po.total_amount || 0).toLocaleString()}\n` +
      `*Paid Advance:* Rs. ${(po.paid_amount || 0).toLocaleString()}\n` +
      `*Balance Due:* Rs. ${(po.balance_due || 0).toLocaleString()}\n` +
      `*Status:* ${po.status}\n` +
      `--------------------------------\n` +
      `Please confirm order dispatch. Thank you!`;

    const url = `https://api.whatsapp.com/send?phone=${phone ? phone : ''}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleShareDebitNoteWhatsApp = (ret: PurchaseReturn) => {
    const supp = safeSuppliers.find((s) => s.id === ret.supplier_id);
    const phone = supp?.phone?.replace(/[^0-9]/g, '') || '';

    const itemsText = ret.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} | Return Qty: ${it.return_quantity} @ Rs.${(it.unit_cost || 0).toLocaleString()} = Rs.${(it.total_credit || 0).toLocaleString()} [Reason: ${it.reason}]`
      )
      .join('\n');

    const msg =
      `*DEBIT NOTE / PURCHASE RETURN VOUCHER*\n` +
      `*${currentTenant?.shop_name}*\n` +
      `--------------------------------\n` +
      `*Debit Note No:* ${ret.return_number}\n` +
      `*Date:* ${ret.created_at.slice(0, 10)}\n` +
      `*Supplier:* ${ret.supplier_name}\n` +
      (ret.po_number ? `*Ref PO:* ${ret.po_number}\n` : '') +
      `--------------------------------\n` +
      `*RETURNED ITEMS:*\n` +
      `${itemsText}\n` +
      `--------------------------------\n` +
      `*Total Return Credit:* Rs. ${(ret.total_return_amount || 0).toLocaleString()}\n` +
      `*Refund/Credit Type:* ${ret.refund_type}\n` +
      (ret.notes ? `*Notes:* ${ret.notes}\n` : '') +
      `--------------------------------\n` +
      `Please credit this to our ledger account. Thank you!`;

    const url = `https://api.whatsapp.com/send?phone=${phone ? phone : ''}&text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Printing PO / Debit Note
  const handlePrintPO = (po: PurchaseOrder) => {
    queuePrintJob(
      'THERMAL_80',
      `Purchase Order #${po.po_number}`,
      `PO: ${po.po_number}\nSupplier: ${po.supplier_name}\nTotal: Rs. ${po.total_amount}`
    );
    showToast(`Print job sent for PO ${po.po_number}`);
  };

  const handlePrintDebitNote = (ret: PurchaseReturn) => {
    queuePrintJob(
      'THERMAL_80',
      `Debit Note #${ret.return_number}`,
      `Debit Note: ${ret.return_number}\nSupplier: ${ret.supplier_name}\nCredit: Rs. ${ret.total_return_amount}`
    );
    showToast(`Print job sent for Debit Note ${ret.return_number}`);
  };

  // Filtering
  const q = (searchQuery || '').toLowerCase();

  const filteredSuppliers = safeSuppliers.filter(
    (s) =>
      s &&
      ((s.name || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        (s.company && s.company.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)))
  );

  const filteredPurchases = safePurchases.filter((po) => {
    if (!po) return false;
    const matchQuery =
      (po.po_number || '').toLowerCase().includes(q) ||
      (po.supplier_name || '').toLowerCase().includes(q) ||
      (po.notes && po.notes.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const filteredReturns = safePurchaseReturns.filter((r) => {
    if (!r) return false;
    return (
      (r.return_number || '').toLowerCase().includes(q) ||
      (r.supplier_name || '').toLowerCase().includes(q) ||
      (r.po_number && r.po_number.toLowerCase().includes(q)) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  });

  const totalSupplierPayables = safeSuppliers.reduce((acc, s) => acc + (s.balance_payable || 0), 0);
  const totalPOAmount = safePurchases.reduce((acc, p) => acc + (p.total_amount || 0), 0);
  const totalReturnsAmount = safePurchaseReturns.reduce((acc, r) => acc + (r.total_return_amount || 0), 0);

  return (
    <div className="space-y-6 pb-12" id="supplier-purchases-container">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          id="sp-toast"
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

      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              {t.suppliers}
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {t.suppliers} &amp; {t.purchaseReturns}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Manage vendor relations, raise purchase orders, receive inward inventory, issue supplier debit notes (purchase returns), and track payables.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'SUPPLIERS' && (
            <button
              id="btn-add-supplier"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
            </button>
          )}

          {activeTab === 'PURCHASE_ORDERS' && (
            <button
              id="btn-create-po"
              onClick={() => {
                if (safeSuppliers.length > 0) setSelectedSupplierId(safeSuppliers[0].id);
                if (safeProducts.length > 0) handleProductSelectForPO(safeProducts[0].id);
                setPoItems([]);
                setIsCreatePOModalOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.createPurchaseOrder}</span>
            </button>
          )}

          {activeTab === 'PURCHASE_RETURNS' && (
            <button
              id="btn-create-return"
              onClick={() => {
                if (safeSuppliers.length > 0) setReturnSupplierId(safeSuppliers[0].id);
                if (safeProducts.length > 0) handleProductSelectForReturn(safeProducts[0].id);
                setReturnItems([]);
                setIsCreateReturnModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Issue Debit Note (Return)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Active Suppliers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{safeSuppliers.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] text-rose-700 font-semibold uppercase block">
            Total Accounts Payable (To Suppliers)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {currencySymbol} {totalSupplierPayables.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-[10px] text-indigo-700 font-semibold uppercase block">
            Total Purchases Value (PO)
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {currencySymbol} {totalPOAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{safePurchases.length} Purchase Orders</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-semibold uppercase block">
            Total Purchase Returns (Debit Notes)
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {currencySymbol} {totalReturnsAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{safePurchaseReturns.length} Return Debit Notes</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          id="tab-suppliers"
          onClick={() => setActiveTab('SUPPLIERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'SUPPLIERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Vendor Directory ({safeSuppliers.length})</span>
        </button>

        <button
          id="tab-purchase-orders"
          onClick={() => setActiveTab('PURCHASE_ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'PURCHASE_ORDERS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t.purchaseOrders} ({safePurchases.length})</span>
        </button>

        <button
          id="tab-purchase-returns"
          onClick={() => setActiveTab('PURCHASE_RETURNS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'PURCHASE_RETURNS'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.purchaseReturns} ({safePurchaseReturns.length})</span>
        </button>
      </div>

      {/* 1. SUPPLIERS DIRECTORY TAB */}
      {activeTab === 'SUPPLIERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Vendor &amp; Supplier Directory ({filteredSuppliers.length})
            </h3>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplier, company, phone..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Supplier / Contact</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Phone &amp; Email</th>
                  <th className="py-3 px-4">Address / Warehouse</th>
                  <th className="py-3 px-4 text-right">Payable Balance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No suppliers found. Click "Add New Supplier" to register one.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => {
                    const hasPayable = (s.balance_payable || 0) > 0;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 font-bold flex items-center justify-center border border-sky-200 shrink-0 text-xs">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                              {s.br_number && <div className="text-[10px] text-slate-400">BR: {s.br_number}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-800 font-medium">{s.company || '—'}</td>

                        <td className="py-3 px-4">
                          <div className="text-slate-800 font-medium">{s.phone}</div>
                          {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{s.address || '—'}</td>

                        <td className="py-3 px-4 text-right">
                          <span className={`font-bold ${hasPayable ? 'text-rose-600' : 'text-slate-800'}`}>
                            {currencySymbol} {(s.balance_payable || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasPayable && (
                              <button
                                onClick={() => handleOpenPayment(s)}
                                title="Pay Supplier Balance"
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors"
                              >
                                Settle
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(s)}
                              title="Edit Supplier"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSupplierToDelete(s)}
                              title="Remove Supplier"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      )}

      {/* 2. PURCHASE ORDERS TAB */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                {t.purchaseOrders} ({filteredPurchases.length})
              </h3>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px]">
                {['ALL', 'PENDING', 'RECEIVED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                      statusFilter === st ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO #, supplier, items..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number &amp; Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items / Qty</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Paid / Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders recorded yet. Click "{t.createPurchaseOrder}" to issue one.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((po) => {
                    const isPending = po.status === 'PENDING';
                    const isReceived = po.status === 'RECEIVED';
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono text-xs">{po.po_number}</div>
                          <div className="text-[10px] text-slate-400">Ordered: {po.order_date}</div>
                          {po.delivery_date && (
                            <div className="text-[10px] text-indigo-600 font-medium">
                              Due: {po.delivery_date}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{po.supplier_name}</div>
                          {po.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{po.notes}</div>}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-[11px] text-slate-700">
                            {po.items.length} item{po.items.length > 1 ? 's' : ''} (
                            {po.items.reduce((acc, it) => acc + it.quantity, 0)} units)
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-black text-slate-900">
                          {currencySymbol} {(po.total_amount || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="text-emerald-600 font-bold text-[11px]">
                            Paid: {currencySymbol} {(po.paid_amount || 0).toLocaleString()}
                          </div>
                          {(po.balance_due || 0) > 0 && (
                            <div className="text-rose-600 font-bold text-[10px]">
                              Due: {currencySymbol} {(po.balance_due || 0).toLocaleString()}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-800'
                                : isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {po.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPending && (
                              <button
                                onClick={() => {
                                  receivePurchaseOrder(po.id);
                                  showToast(`Stock received for PO ${po.po_number}! Products updated.`);
                                }}
                                title="Receive Goods into Inventory"
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold border border-indigo-200 transition-colors flex items-center gap-1"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span>{t.receiveStock}</span>
                              </button>
                            )}

                            <button
                              onClick={() => setViewingPO(po)}
                              title="View PO Details"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handlePrintPO(po)}
                              title="Print PO Receipt"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSharePOWhatsApp(po)}
                              title="Share on WhatsApp"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete Purchase Order ${po.po_number}?`)) {
                                  deletePurchaseOrder(po.id);
                                  showToast(`Purchase order deleted.`);
                                }
                              }}
                              title="Delete PO"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      )}

      {/* 3. PURCHASE RETURNS (DEBIT NOTES) TAB */}
      {activeTab === 'PURCHASE_RETURNS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              {t.purchaseReturns} ({filteredReturns.length})
            </h3>

            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search debit note #, supplier, PO..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Debit Note # &amp; Date</th>
                  <th className="py-3 px-4">Supplier &amp; Ref PO</th>
                  <th className="py-3 px-4">Returned Items</th>
                  <th className="py-3 px-4">Credit / Refund Type</th>
                  <th className="py-3 px-4 text-right">Total Debit Credit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No purchase returns or debit notes issued yet.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-rose-700 font-mono text-xs">{ret.return_number}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(ret.created_at).toLocaleDateString()} {new Date(ret.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-500">By: {ret.processed_by}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{ret.supplier_name}</div>
                        {ret.po_number && (
                          <div className="text-[10px] text-indigo-600 font-mono">PO: {ret.po_number}</div>
                        )}
                        {ret.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{ret.notes}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {ret.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 font-medium">
                              • {it.name} x {it.return_quantity} ({it.reason})
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {ret.refund_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                        {currencySymbol} {(ret.total_return_amount || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingReturn(ret)}
                            title="View Debit Note"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintDebitNote(ret)}
                            title="Print Debit Note"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleShareDebitNoteWhatsApp(ret)}
                            title="Send Debit Note to Supplier on WhatsApp"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete Debit Note ${ret.return_number}?`)) {
                                deletePurchaseReturn(ret.id);
                                showToast(`Debit note removed.`);
                              }
                            }}
                            title="Delete Return Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {isCreatePOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">{t.createPurchaseOrder}</h3>
              </div>
              <button
                onClick={() => setIsCreatePOModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Select Supplier: *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    {safeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.company} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status:</label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="PENDING">PENDING (Ordered)</option>
                    <option value="RECEIVED">RECEIVED (Inward Stock In)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.orderDate}:</label>
                  <input
                    type="date"
                    required
                    value={poOrderDate}
                    onChange={(e) => setPoOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">{t.deliveryDate}:</label>
                  <input
                    type="date"
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Term:</label>
                  <select
                    value={poPaymentMethod}
                    onChange={(e) => setPoPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  >
                    <option value="CREDIT">Supplier Credit (Pay later)</option>
                    <option value="CASH">Spot Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              {/* Add Line Items Section */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add Products To Order</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Product:</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectForPO(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {safeProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getLocalizedProductName(p, language)} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Unit Cost ({currencySymbol}):</label>
                    <input
                      type="number"
                      step="any"
                      value={itemUnitCost}
                      onChange={(e) => setItemUnitCost(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToPO}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Added Items Table */}
                {poItems.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3 text-right">Qty</th>
                          <th className="py-2 px-3 text-right">Unit Cost</th>
                          <th className="py-2 px-3 text-right">Total</th>
                          <th className="py-2 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {poItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {it.name}
                              <span className="block text-[10px] text-slate-400 font-normal">{it.sku}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">{it.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              {currencySymbol} {(it.unit_cost || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              {currencySymbol} {(it.total_cost || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromPO(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    No items added yet. Choose a product and click "Add Item".
                  </div>
                )}
              </div>

              {/* Summary and Advance Payment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Notes / Instructions:</label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Deliver to rear gate between 8am-11am"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Grand Total Cost:</span>
                    <span className="text-slate-900 font-mono font-black text-sm">
                      {currencySymbol} {poTotalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <span className="text-slate-600">Advance Paid:</span>
                    <input
                      type="number"
                      step="any"
                      value={poPaidAmount}
                      onChange={(e) => setPoPaidAmount(Number(e.target.value))}
                      className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-bold font-mono text-emerald-600"
                    />
                  </div>

                  <div className="flex justify-between text-xs font-bold border-t border-slate-200 pt-1.5">
                    <span className="text-rose-600">Balance Due (Payable):</span>
                    <span className="text-rose-600 font-mono font-black">
                      {currencySymbol} {poBalanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePOModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm &amp; Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE RETURN (DEBIT NOTE) */}
      {isCreateReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base">Issue Purchase Return (Debit Note)</h3>
              </div>
              <button
                onClick={() => setIsCreateReturnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseReturn} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Return To Supplier: *</label>
                  <select
                    value={returnSupplierId}
                    onChange={(e) => setReturnSupplierId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                  >
                    {safeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.company} (Payable: {currencySymbol} {(s.balance_payable || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Refund / Credit Type:</label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="DEBIT_NOTE">Debit Note (Deduct from balance)</option>
                    <option value="CASH_REFUND">Cash Refund</option>
                    <option value="REPLACEMENT">Stock Replacement</option>
                  </select>
                </div>
              </div>

              {/* Reference Purchase Order */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Related Purchase Order (Optional):</label>
                <select
                  value={returnPoId}
                  onChange={(e) => setReturnPoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                >
                  <option value="">None / Direct Return from Warehouse</option>
                  {safePurchases
                    .filter((p) => !returnSupplierId || p.supplier_id === returnSupplierId)
                    .map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} ({po.order_date}) - {currencySymbol} {(po.total_amount || 0).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* Return Item Picker */}
              <div className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-200 space-y-3">
                <div className="font-bold text-xs text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>Select Item &amp; Return Reason</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Product:</label>
                    <select
                      value={retProductId}
                      onChange={(e) => handleProductSelectForReturn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      {safeProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getLocalizedProductName(p, language)} (Stock: {p.stock_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">Return Qty:</label>
                    <input
                      type="number"
                      min="1"
                      value={retQty}
                      onChange={(e) => setRetQty(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">{t.returnReason}:</label>
                    <select
                      value={retReason}
                      onChange={(e) => setRetReason(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                    >
                      <option value="DAMAGED">Damaged in Transit</option>
                      <option value="EXPIRED">Near Expiry / Expired</option>
                      <option value="QUALITY_DEFECT">Quality Defect / Spoiled</option>
                      <option value="WRONG_ITEM">Wrong Item Sent</option>
                      <option value="EXCESS_STOCK">Excess Stock</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToReturn}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add To Return</span>
                    </button>
                  </div>
                </div>

                {/* Return Items Table */}
                {returnItems.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-2">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item &amp; Reason</th>
                          <th className="py-2 px-3 text-right">Return Qty</th>
                          <th className="py-2 px-3 text-right">Unit Cost</th>
                          <th className="py-2 px-3 text-right">Total Credit</th>
                          <th className="py-2 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {returnItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {it.name}
                              <span className="block text-[10px] text-rose-600 font-medium">Reason: {it.reason}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">{it.return_quantity}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              {currencySymbol} {(it.unit_cost || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                              {currencySymbol} {(it.total_credit || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemFromReturn(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    No return items added yet. Select product and click "Add To Return".
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Return Remarks / Notes:</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Torn bags rejected at delivery dock; debit note issued"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 text-xs">Total Debit Note Credit Value:</span>
                <span className="font-mono font-black text-rose-600 text-base">
                  {currencySymbol} {returnTotalAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateReturnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Issue Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PO DETAILS */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600">Purchase Order Summary</span>
                <h3 className="font-bold text-base text-slate-900">{viewingPO.po_number}</h3>
              </div>
              <button onClick={() => setViewingPO(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Supplier:</span>
                <span className="font-bold text-slate-900">{viewingPO.supplier_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Order Date:</span>
                <span className="font-bold text-slate-900">{viewingPO.order_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">PO Status:</span>
                <span className="font-bold text-slate-900">{viewingPO.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Payment Status:</span>
                <span className="font-bold text-emerald-600">{viewingPO.payment_status}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Cost</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {currencySymbol} {(it.unit_cost || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {currencySymbol} {(it.total_cost || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono">{currencySymbol} {(viewingPO.total_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Paid Amount:</span>
                <span className="font-mono">{currencySymbol} {(viewingPO.paid_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-t border-slate-200 pt-1">
                <span>Balance Due:</span>
                <span className="font-mono">{currencySymbol} {(viewingPO.balance_due || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleSharePOWhatsApp(viewingPO)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp PO</span>
              </button>
              <button
                onClick={() => handlePrintPO(viewingPO)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DEBIT NOTE DETAILS */}
      {viewingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600">Debit Note Voucher</span>
                <h3 className="font-bold text-base text-slate-900">{viewingReturn.return_number}</h3>
              </div>
              <button onClick={() => setViewingReturn(null)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Supplier:</span>
                <span className="font-bold text-slate-900">{viewingReturn.supplier_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Issued Date:</span>
                <span className="font-bold text-slate-900">{viewingReturn.created_at.slice(0, 10)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Refund Type:</span>
                <span className="font-bold text-slate-900">{viewingReturn.refund_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Processed By:</span>
                <span className="font-bold text-slate-900">{viewingReturn.processed_by}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Item &amp; Reason</th>
                    <th className="py-2 px-3 text-right">Return Qty</th>
                    <th className="py-2 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingReturn.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {it.name}
                        <span className="block text-[10px] text-rose-600">[{it.reason}]</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{it.return_quantity}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        {currencySymbol} {(it.total_credit || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs font-bold text-rose-900">
              <span>Total Debit Note Amount:</span>
              <span className="font-mono text-base">{currencySymbol} {(viewingReturn.total_return_amount || 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleShareDebitNoteWhatsApp(viewingReturn)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Debit Note</span>
              </button>
              <button
                onClick={() => handlePrintDebitNote(viewingReturn)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">
                  {editingSupplier ? 'Edit Supplier / Vendor' : 'Add New Supplier / Vendor'}
                </h3>
              </div>
              <button onClick={() => setIsSupplierModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact Person / Representative Name: *
                </label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Silva / Priyantha"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Company / Enterprise:</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Ceylon Agro Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Telephone / Mobile: *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@supplier.lk"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">BR / Tax Reg No:</label>
                  <input
                    type="text"
                    value={brNumber}
                    onChange={(e) => setBrNumber(e.target.value)}
                    placeholder="PV-12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Address / Warehouse:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 45 Old Moor Street, Colombo 11"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bank Payment Details:</label>
                <input
                  type="text"
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="e.g. Commercial Bank 8001234567 - Pettah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payable Balance ({currencySymbol}):</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  {editingSupplier ? 'Save Changes' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SETTLE SUPPLIER PAYMENT */}
      {isPaymentModalOpen && payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base">Settle Supplier Payable</h3>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-800">{payingSupplier.name}</div>
                <div className="text-slate-500 text-[10px]">{payingSupplier.company}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Current Due</div>
                <div className="font-black text-rose-600 text-sm">
                  {currencySymbol} {(payingSupplier.balance_payable || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount ({currencySymbol}): *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                  <option value="CARD">Card / Debit</option>
                  <option value="CHEQUE">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / Cheque No:</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Cheque #492819 / Ref 83921"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Remarks:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Settled for GRN #1024"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE SUPPLIER */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Remove Supplier?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{supplierToDelete.name}"</strong> ({supplierToDelete.company}) from your vendor list?
                {(supplierToDelete.balance_payable || 0) > 0 && (
                  <span className="block mt-2 p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-medium border border-rose-200">
                    Warning: There is an outstanding payable balance of {currencySymbol} {(supplierToDelete.balance_payable || 0).toLocaleString()}.
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Remove Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
