import React, { useState, useMemo, useEffect } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  AdminShopMessage,
  BusinessType,
  LicenseStatus,
  MessageCategory,
  MessagePriority,
  Tenant,
} from '../../types';
import {
  Send,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Bell,
  X,
  Search,
  Check,
  Building2,
  Radio,
  FileText,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface SuperAdminMessagingStudioProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedTenantId?: string | null;
}

export const SuperAdminMessagingStudio: React.FC<SuperAdminMessagingStudioProps> = ({
  isOpen,
  onClose,
  initialSelectedTenantId,
}) => {
  const {
    allTenants,
    allLicenses,
    adminShopMessages,
    sendAdminShopMessage,
    deleteAdminShopMessage,
  } = useRetail();

  const safeTenants = allTenants || [];
  const safeLicenses = allLicenses || {};
  const [activeTab, setActiveTab] = useState<'COMPOSE' | 'OUTBOX'>('COMPOSE');

  // Compose Form State
  const [targetType, setTargetType] = useState<'SELECTED_SHOPS' | 'ALL_SHOPS' | 'BUSINESS_TYPE' | 'LICENSE_STATUS'>('SELECTED_SHOPS');
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>(() =>
    initialSelectedTenantId ? [initialSelectedTenantId] : []
  );
  const [targetBusinessType, setTargetBusinessType] = useState<BusinessType>('grocery');
  const [targetLicenseStatus, setTargetLicenseStatus] = useState<LicenseStatus>('ACTIVE');
  const [shopSearch, setShopSearch] = useState('');

  const [category, setCategory] = useState<MessageCategory>('GENERAL_ANNOUNCEMENT');
  const [priority, setPriority] = useState<MessagePriority>('NORMAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionRequired, setActionRequired] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(false);

  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedOutboxMsg, setSelectedOutboxMsg] = useState<AdminShopMessage | null>(null);
  const [outboxSearch, setOutboxSearch] = useState('');

  // Pre-select if opened for a specific shop or default to ALL_SHOPS
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedTenantId) {
        setTargetType('SELECTED_SHOPS');
        setSelectedTenantIds([initialSelectedTenantId]);
      } else {
        setTargetType('ALL_SHOPS');
      }
      setActiveTab('COMPOSE');
      setFeedbackNotice(null);
    }
  }, [initialSelectedTenantId, isOpen]);

  // Filtered shops list for selection checklist
  const filteredShops = useMemo(() => {
    return safeTenants.filter((t) => {
      const q = shopSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        t.shop_name.toLowerCase().includes(q) ||
        t.tenant_id.toLowerCase().includes(q) ||
        t.business_type.toLowerCase().includes(q) ||
        t.branch_name.toLowerCase().includes(q)
      );
    });
  }, [safeTenants, shopSearch]);

  // Compute resolved target shops list based on current targetType
  const resolvedTargetShops = useMemo<Tenant[]>(() => {
    if (targetType === 'ALL_SHOPS') {
      return safeTenants;
    }
    if (targetType === 'SELECTED_SHOPS') {
      return safeTenants.filter((t) => selectedTenantIds.includes(t.tenant_id));
    }
    if (targetType === 'BUSINESS_TYPE') {
      return safeTenants.filter((t) => t.business_type === targetBusinessType);
    }
    if (targetType === 'LICENSE_STATUS') {
      return safeTenants.filter((t) => safeLicenses[t.tenant_id]?.status === targetLicenseStatus);
    }
    return [];
  }, [targetType, selectedTenantIds, targetBusinessType, targetLicenseStatus, safeTenants, safeLicenses]);

  if (!isOpen) return null;

  // Toggle single shop selection
  const toggleTenant = (tenantId: string) => {
    setSelectedTenantIds((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredShops.map((s) => s.tenant_id);
    setSelectedTenantIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deselectAll = () => {
    setSelectedTenantIds([]);
  };

  // Quick Preset Templates
  const applyTemplate = (type: 'MAINTENANCE' | 'BILLING' | 'FEATURE' | 'BACKUP' | 'HOLIDAY' | 'DIRECT') => {
    switch (type) {
      case 'MAINTENANCE':
        setCategory('MAINTENANCE_UPDATE');
        setPriority('NORMAL');
        setTitle('Scheduled Cloud Infrastructure Optimization Notice');
        setMessage('Our engineering team will perform routine cloud database optimizations and security patch deployments tonight from 12:00 AM to 12:30 AM. Your offline POS terminal will operate without disruption and sync immediately upon reconnecting.');
        setActionRequired('No cashier action needed. Offline sales will buffer safely.');
        setActionLabel('View Server Status');
        setRequiresAcknowledgment(false);
        break;

      case 'BILLING':
        setCategory('BILLING_INVOICE');
        setPriority('HIGH');
        setTitle('WCS Retail Cloud Annual Subscription Renewal Notice');
        setMessage('Your annual WCS Retail Cloud Operating System license is scheduled for renewal. Kindly ensure invoice settlement prior to the expiry date to maintain uninterrupted multi-counter checkout and cloud backup privileges.');
        setActionRequired('Please forward bank remittance slip to billing@wcsretailcloud.lk or contact WCS billing hotline.');
        setActionLabel('Contact WCS Billing (+94 11 700 8899)');
        setRequiresAcknowledgment(true);
        break;

      case 'FEATURE':
        setCategory('FEATURE_UPDATE');
        setPriority('NORMAL');
        setTitle('New Update: Multi-Counter Network & Barcode Studio Live');
        setMessage('We have enabled the new Multi-Counter Terminal Station Management and Barcode Label Studio on your retail workspace. You can now configure multiple cashiers and custom shelf price tags seamlessly.');
        setActionRequired('Review Terminal Station settings in the Main Menu.');
        setActionLabel('Open Settings');
        setRequiresAcknowledgment(false);
        break;

      case 'BACKUP':
        setCategory('SECURITY_ADVISORY');
        setPriority('HIGH');
        setTitle('Quarterly Cloud Database Audit & Security Verification');
        setMessage('WCS Cloud Security has performed automated cloud integrity tests on your store catalog and ledger. All records are encrypted and synced.');
        setActionRequired('Verify that all cashier shifts for the month are properly closed.');
        setActionLabel('Verify Shift Records');
        setRequiresAcknowledgment(true);
        break;

      case 'HOLIDAY':
        setCategory('GENERAL_ANNOUNCEMENT');
        setPriority('LOW');
        setTitle('WCS Super Admin Priority Support Hours During Holidays');
        setMessage('Please note that WCS Customer Support and Technical Helpdesk will operate on dedicated 24/7 hotline standby during the upcoming holiday weekend. All cloud backup and remote support channels remain fully operational.');
        setActionRequired('Save emergency support WhatsApp: +94 77 000 8899');
        setActionLabel('Contact Support');
        setRequiresAcknowledgment(false);
        break;

      case 'DIRECT':
        setCategory('DIRECT_INQUIRY');
        setPriority('NORMAL');
        setTitle('Direct Notice from WCS System Administrator');
        setMessage('Please review the latest store stock audit reports and reconcile open supplier balances. Contact headquarters if you require assisted database onboarding.');
        setActionRequired('Acknowledge this message and provide a brief confirmation note.');
        setActionLabel('Reply to HQ');
        setRequiresAcknowledgment(true);
        break;
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      setFeedbackNotice({ type: 'error', text: 'Please fill in both the Subject Title and Message Content.' });
      return;
    }

    if (targetType === 'SELECTED_SHOPS' && selectedTenantIds.length === 0) {
      setFeedbackNotice({ type: 'error', text: 'Please select at least one shop from the checklist to dispatch your message.' });
      return;
    }

    if (resolvedTargetShops.length === 0) {
      setFeedbackNotice({ type: 'error', text: 'No matching customer shops found for the selected criteria.' });
      return;
    }

    const targetTenantIdsArray =
      targetType === 'ALL_SHOPS' ? ['ALL'] : resolvedTargetShops.map((t) => t.tenant_id);

    const targetShopNamesArray =
      targetType === 'ALL_SHOPS'
        ? ['All Registered Stores']
        : resolvedTargetShops.map((t) => `${t.shop_name} (${t.tenant_id})`);

    const dispatched = sendAdminShopMessage({
      sender_name: 'WCS Super Admin Headquarters',
      sender_role: 'Super Administrator',
      target_type: targetType,
      target_tenant_ids: targetTenantIdsArray,
      target_shop_names: targetShopNamesArray,
      target_business_type: targetType === 'BUSINESS_TYPE' ? targetBusinessType : undefined,
      target_license_status: targetType === 'LICENSE_STATUS' ? targetLicenseStatus : undefined,
      category,
      priority,
      title: title.trim(),
      message: message.trim(),
      action_required: actionRequired.trim() || undefined,
      action_label: actionLabel.trim() || undefined,
      requires_acknowledgment: requiresAcknowledgment,
    });

    setFeedbackNotice({
      type: 'success',
      text: `Message #${dispatched.id} successfully dispatched to ${resolvedTargetShops.length} shop${resolvedTargetShops.length > 1 ? 's' : ''}!`,
    });

    // Reset fields
    setTitle('');
    setMessage('');
    setActionRequired('');
    setActionLabel('');
    setRequiresAcknowledgment(false);
    if (targetType === 'SELECTED_SHOPS') {
      setSelectedTenantIds([]);
    }

    // Auto-switch to Outbox tab to view delivery tracking
    setTimeout(() => {
      setActiveTab('OUTBOX');
    }, 900);
  };

  const getPriorityBadge = (p: MessagePriority) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            URGENT (Screen Alert)
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            HIGH PRIORITY
          </span>
        );
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
            NORMAL
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            INFO / LOW
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: MessageCategory) => {
    switch (cat) {
      case 'GENERAL_ANNOUNCEMENT':
        return <span className="text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-medium">📢 General Notice</span>;
      case 'MAINTENANCE_UPDATE':
        return <span className="text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-medium">🛠️ Maintenance</span>;
      case 'BILLING_INVOICE':
        return <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-medium">💳 Billing & License</span>;
      case 'SECURITY_ADVISORY':
        return <span className="text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-medium">🛡️ Security & Backup</span>;
      case 'FEATURE_UPDATE':
        return <span className="text-indigo-400 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-medium">🚀 New Features</span>;
      case 'DIRECT_INQUIRY':
        return <span className="text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-medium">💬 Direct Message</span>;
      case 'SYSTEM_ALERT':
        return <span className="text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-medium">⚠️ System Alert</span>;
    }
  };

  // Filtered Outbox messages
  const filteredOutbox = useMemo(() => {
    return (adminShopMessages || []).filter((msg) => {
      const q = outboxSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        msg.title.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q) ||
        msg.id.toLowerCase().includes(q) ||
        msg.target_shop_names?.some((name) => name.toLowerCase().includes(q))
      );
    });
  }, [adminShopMessages, outboxSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Super Admin Direct Messaging & Communications Hub</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Targeted Shop Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Send targeted announcements, billing updates, maintenance alerts, or direct instructions to specific retail stores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('COMPOSE')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'COMPOSE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compose & Send</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('OUTBOX')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'OUTBOX'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Outbox & Delivery Logs ({adminShopMessages?.length || 0})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackNotice && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between font-medium border-b ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/90 text-rose-300 border-rose-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedbackNotice.text}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-xs hover:underline cursor-pointer opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'COMPOSE' && (
            <form onSubmit={handleDispatch} className="space-y-6">
              {/* Preset Quick Templates */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Quick Message Templates (1-Click Auto Fill):
                  </span>
                  <span className="text-[10px] text-slate-400">Click any preset to prefill fields</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate('MAINTENANCE')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">🛠️ Maintenance</div>
                    <div className="text-[9px] text-slate-400 truncate">Cloud server indexing</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('BILLING')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">💳 License Renewal</div>
                    <div className="text-[9px] text-slate-400 truncate">Invoice & subscription</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('FEATURE')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-indigo-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">🚀 New Features</div>
                    <div className="text-[9px] text-slate-400 truncate">Multi-counter & studio</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('BACKUP')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">🛡️ Cloud Backup</div>
                    <div className="text-[9px] text-slate-400 truncate">Data integrity audit</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('HOLIDAY')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-blue-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">📢 Holiday Hours</div>
                    <div className="text-[9px] text-slate-400 truncate">Support hotline schedule</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('DIRECT')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-left text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-[11px]">💬 Direct Notice</div>
                    <div className="text-[9px] text-slate-400 truncate">Store manager inquiry</div>
                  </button>
                </div>
              </div>

              {/* Section 1: Target Selection */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      1. Select Target Stores & Audience:
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Choose specific shops or broadcast across business archetypes
                    </p>
                  </div>

                  {/* Target Audience Mode Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setTargetType('SELECTED_SHOPS')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        targetType === 'SELECTED_SHOPS'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Selected Shops ({selectedTenantIds.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('ALL_SHOPS')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        targetType === 'ALL_SHOPS'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      📢 All Customer Shops ({safeTenants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('BUSINESS_TYPE')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        targetType === 'BUSINESS_TYPE'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      By Business Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('LICENSE_STATUS')}
                      className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all cursor-pointer ${
                        targetType === 'LICENSE_STATUS'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      By License Status
                    </button>
                  </div>
                </div>

                {/* Sub-UI for Mode: Selected Shops Checklist */}
                {targetType === 'SELECTED_SHOPS' && (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={shopSearch}
                          onChange={(e) => setShopSearch(e.target.value)}
                          placeholder="Filter shops by name, ID, or city..."
                          className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={selectAllFiltered}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-slate-700"
                        >
                          Select All Filtered ({filteredShops.length})
                        </button>
                        <button
                          type="button"
                          onClick={deselectAll}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-slate-700"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    {/* Shop Cards Grid with Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/80">
                      {filteredShops.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-slate-400">
                          No matching stores found for "{shopSearch}"
                        </div>
                      ) : (
                        filteredShops.map((t) => {
                          const isSelected = selectedTenantIds.includes(t.tenant_id);
                          const lic = safeLicenses[t.tenant_id];

                          return (
                            <div
                              key={t.tenant_id}
                              onClick={() => toggleTenant(t.tenant_id)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                                isSelected
                                  ? 'bg-indigo-950/70 border-indigo-500/80 shadow-sm text-slate-100 ring-1 ring-indigo-500/50'
                                  : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={t.logo_url}
                                  alt={t.shop_name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-700 bg-slate-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs truncate flex items-center gap-1.5">
                                    <span>{t.shop_name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate">
                                    <span className="font-mono text-indigo-400">{t.tenant_id}</span> • {t.business_type.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>

                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-500 text-white'
                                    : 'border-slate-700 bg-slate-950 text-transparent'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-UI for Mode: Business Type */}
                {targetType === 'BUSINESS_TYPE' && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-slate-300 font-semibold text-xs whitespace-nowrap">
                      Choose Retail Archetype:
                    </label>
                    <select
                      value={targetBusinessType}
                      onChange={(e) => setTargetBusinessType(e.target.value as BusinessType)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="grocery">🛒 Grocery & Supermarkets ({safeTenants.filter((t) => t.business_type === 'grocery').length} shops)</option>
                      <option value="restaurant">🍽️ Restaurants & Dining ({safeTenants.filter((t) => t.business_type === 'restaurant').length} shops)</option>
                      <option value="hotel">🏨 Hotels & Hospitality ({safeTenants.filter((t) => t.business_type === 'hotel' || t.business_type === 'restaurant_hotel').length} shops)</option>
                      <option value="pharmacy">💊 Pharmacies & Healthcare ({safeTenants.filter((t) => t.business_type === 'pharmacy').length} shops)</option>
                      <option value="hardware">🔧 Hardware & Construction ({safeTenants.filter((t) => t.business_type === 'hardware').length} shops)</option>
                      <option value="automobile_workshop">🚗 Automobile Workshops & Garages ({safeTenants.filter((t) => t.business_type === 'automobile_workshop').length} shops)</option>
                      <option value="motor_parts">⚙️ Automobile Spares & Parts ({safeTenants.filter((t) => t.business_type === 'motor_parts').length} shops)</option>
                      <option value="electronics_mobile">📱 Electronics & Mobile Retail ({safeTenants.filter((t) => t.business_type === 'electronics_mobile').length} shops)</option>
                      <option value="clothing_apparel">👗 Clothing & Apparel Stores ({safeTenants.filter((t) => t.business_type === 'clothing_apparel').length} shops)</option>
                    </select>
                  </div>
                )}

                {/* Sub-UI for Mode: License Status */}
                {targetType === 'LICENSE_STATUS' && (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="text-slate-300 font-semibold text-xs whitespace-nowrap">
                      Target by Subscription Status:
                    </label>
                    <select
                      value={targetLicenseStatus}
                      onChange={(e) => setTargetLicenseStatus(e.target.value as LicenseStatus)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value="ACTIVE">🟢 Active Licensed Stores ({safeTenants.filter((t) => safeLicenses[t.tenant_id]?.status === 'ACTIVE').length} shops)</option>
                      <option value="WARNING">🟡 Warning / Expiring Soon &lt; 7 Days ({safeTenants.filter((t) => safeLicenses[t.tenant_id]?.status === 'WARNING').length} shops)</option>
                      <option value="TEMPORARY_SUSPENDED">🔴 Temporarily Suspended ({safeTenants.filter((t) => safeLicenses[t.tenant_id]?.status === 'TEMPORARY_SUSPENDED').length} shops)</option>
                      <option value="SUSPENDED">⛔ Deactivated / Locked ({safeTenants.filter((t) => safeLicenses[t.tenant_id]?.status === 'SUSPENDED').length} shops)</option>
                    </select>
                  </div>
                )}

                {/* Target Summary Chips */}
                <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
                  <div className="text-slate-400">
                    Target Summary: <span className="font-bold text-slate-200">{resolvedTargetShops.length} Store{resolvedTargetShops.length !== 1 ? 's' : ''} Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-md justify-end truncate">
                    {resolvedTargetShops.slice(0, 3).map((s) => (
                      <span key={s.tenant_id} className="font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] border border-indigo-800/40">
                        {s.shop_name}
                      </span>
                    ))}
                    {resolvedTargetShops.length > 3 && (
                      <span className="text-[10px] text-slate-400">+{resolvedTargetShops.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Message Details */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  2. Message Content & Delivery Attributes:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      Message Category:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MessageCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="GENERAL_ANNOUNCEMENT">📢 General Store Announcement</option>
                      <option value="MAINTENANCE_UPDATE">🛠️ Scheduled System Maintenance</option>
                      <option value="BILLING_INVOICE">💳 Billing, Subscription & Renewal</option>
                      <option value="FEATURE_UPDATE">🚀 Feature Release & Capabilities</option>
                      <option value="SECURITY_ADVISORY">🛡️ Security, Audit & Cloud Backup</option>
                      <option value="DIRECT_INQUIRY">💬 Direct Operational Message</option>
                      <option value="SYSTEM_ALERT">⚠️ Emergency System Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      Delivery Priority & Screen Impact:
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as MessagePriority)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="LOW">🔵 LOW (Background Information Notice)</option>
                      <option value="NORMAL">🟣 NORMAL (Notification Bell Badge)</option>
                      <option value="HIGH">🟡 HIGH (Prominent Orange Ribbon)</option>
                      <option value="URGENT">🔴 URGENT (Immediate Popup Banner on Shop POS)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 text-[10px] uppercase font-semibold">
                      Subject / Header Title:
                    </label>
                    <span className="text-[10px] text-slate-400">{title.length}/100</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Scheduled Cloud Database Indexing Tonight at 12:00 AM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-400 text-[10px] uppercase font-semibold">
                      Message Body & Instructions:
                    </label>
                    <span className="text-[10px] text-slate-400">{message.length}/1000</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide complete operational guidance, maintenance schedules, payment remittance accounts, or feature instructions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      Action Required / Instructions (Optional):
                    </label>
                    <input
                      type="text"
                      value={actionRequired}
                      onChange={(e) => setActionRequired(e.target.value)}
                      placeholder="e.g. Verify morning shift closing or contact support"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
                      Action Button Label / Hotline (Optional):
                    </label>
                    <input
                      type="text"
                      value={actionLabel}
                      onChange={(e) => setActionLabel(e.target.value)}
                      placeholder="e.g. Contact WCS Hotline (+94 11 700 8899)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* Acknowledgment Request Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={requiresAcknowledgment}
                      onChange={(e) => setRequiresAcknowledgment(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                    />
                    <div>
                      <span className="font-bold">Require Store Manager Acknowledgment & Reply Note</span>
                      <p className="text-[11px] text-slate-400">
                        The shop manager will be prompted to acknowledge receipt and can write a confirmation response back to Super Admin HQ.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Section 3: Live Preview & Dispatch Action */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Live Preview (How the Shop Manager & Cashier will see this):
                </span>

                {/* Mock Shop Card Preview */}
                <div className="bg-white text-slate-900 rounded-xl p-4 border border-slate-200 shadow-md space-y-2.5 max-w-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold text-xs">
                        WCS HQ
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">WCS Super Admin Headquarters</div>
                        <div className="text-[10px] text-slate-500">Just now • Platform Operating System</div>
                      </div>
                    </div>
                    <div>
                      {priority === 'URGENT' ? (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                          URGENT NOTICE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                          {category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {title.trim() || 'Notice Subject Title will appear here'}
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed mt-1">
                      {message.trim() ||
                        'Detailed instruction body, maintenance hours, invoice summaries, or operational guidelines will appear in this formatted preview card.'}
                    </p>
                  </div>

                  {actionRequired && (
                    <div className="p-2 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 text-[10px] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{actionRequired}</span>
                    </div>
                  )}

                  {requiresAcknowledgment && (
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[10px]">
                      <span className="text-slate-500">Acknowledgment requested by Super Admin</span>
                      <span className="px-2 py-1 bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1">
                        <CheckCheck className="w-3 h-3 text-emerald-400" /> Acknowledge & Reply
                      </span>
                    </div>
                  )}
                </div>

                {/* Dispatch Trigger */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-slate-400 text-xs">
                    Target: <span className="font-bold text-slate-200">{resolvedTargetShops.length} Store{resolvedTargetShops.length !== 1 ? 's' : ''}</span> will receive this notification.
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {resolvedTargetShops.length > 0
                          ? `Dispatch Message to ${resolvedTargetShops.length} Shop${resolvedTargetShops.length !== 1 ? 's' : ''}`
                          : 'Dispatch Message to Stores'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* OUTBOX TAB */}
          {activeTab === 'OUTBOX' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-100 text-xs flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Sent Message Records & Live Shop Delivery Tracker
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Track read receipts, delivery timestamps, and store manager replies in real-time
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={outboxSearch}
                    onChange={(e) => setOutboxSearch(e.target.value)}
                    placeholder="Search sent messages..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {filteredOutbox.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">No dispatched messages found.</p>
                  <p className="text-xs text-slate-500">
                    Use the "Compose & Send" tab to dispatch your first announcement or direct message.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOutbox.map((msg) => {
                    const readCount = Object.keys(msg.read_by_tenants || {}).length;
                    const ackCount = Object.keys(msg.acknowledged_by_tenants || {}).length;
                    const targetTotal = msg.target_tenant_ids?.includes('ALL')
                      ? safeTenants.length
                      : msg.target_tenant_ids?.length || 1;

                    return (
                      <div
                        key={msg.id}
                        className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-4 transition-all space-y-3 shadow-md"
                      >
                        {/* Message Top Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              #{msg.id}
                            </span>
                            {getCategoryBadge(msg.category)}
                            {getPriorityBadge(msg.priority)}
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Recall / Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete message #${msg.id}?`)) {
                                  deleteAdminShopMessage(msg.id);
                                }
                              }}
                              title="Delete / Recall Message"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Body */}
                        <div>
                          <h4 className="font-bold text-slate-100 text-xs">{msg.title}</h4>
                          <p className="text-slate-300 text-[11px] leading-relaxed mt-1 line-clamp-2">
                            {msg.message}
                          </p>
                        </div>

                        {/* Target & Read Status Badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Target:</span>
                            <span className="font-semibold text-slate-200">
                              {msg.target_type === 'ALL_SHOPS'
                                ? '📢 All Registered Customer Stores'
                                : (msg.target_shop_names || []).join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-slate-300">
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Read by {readCount} of {targetTotal}</span>
                            </div>

                            {msg.requires_acknowledgment && (
                              <div className="flex items-center gap-1 font-bold text-emerald-400">
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{ackCount} Acknowledged</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acknowledgment Replies List */}
                        {msg.acknowledged_by_tenants && Object.keys(msg.acknowledged_by_tenants).length > 0 && (
                          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                              <MessageCircle className="w-3 h-3 text-emerald-400" />
                              Store Manager Responses & Acknowledgment Notes:
                            </span>
                            <div className="space-y-1.5">
                              {Object.entries(msg.acknowledged_by_tenants).map(([tId, rawAck]) => {
                                const ack = rawAck as { acknowledged_at: string; user_name?: string; reply_notes?: string };
                                const shop = safeTenants.find((t) => t.tenant_id === tId);
                                return (
                                  <div
                                    key={tId}
                                    className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-2 text-[11px]"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                        <span>{shop?.shop_name || tId}</span>
                                        <span className="text-[10px] font-normal text-slate-400">
                                          ({ack.user_name || 'Staff'} at {new Date(ack.acknowledged_at).toLocaleTimeString()})
                                        </span>
                                      </div>
                                      <div className="text-slate-300 italic text-[11px] mt-0.5">
                                        "{ack.reply_notes || 'Confirmed and noted.'}"
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                                      CONFIRMED
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
