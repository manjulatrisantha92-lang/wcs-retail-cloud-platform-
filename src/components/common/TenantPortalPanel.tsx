import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Tenant, BusinessType, LicenseStatus } from '../../types';
import {
  ShieldCheck,
  Store,
  Search,
  X,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  SlidersHorizontal,
  Building2,
  Sparkles,
  MapPin,
  Phone,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { CreateShopModal } from '../superadmin/CreateShopModal';
import { SuperAdminLoginModal } from '../superadmin/SuperAdminLoginModal';
import { SuperAdminPasswordModal } from '../superadmin/SuperAdminPasswordModal';

interface TenantPortalPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantPortalPanel: React.FC<TenantPortalPanelProps> = ({ isOpen, onClose }) => {
  const {
    allTenants,
    allLicenses,
    currentTenantId,
    setCurrentTenantId,
    isSuperAdminMode,
    isSuperAdminAuthenticated,
    deleteTenantShop,
  } = useRetail();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSuperAdminLoginOpen, setIsSuperAdminLoginOpen] = useState(false);
  const [isSuperAdminPasswordOpen, setIsSuperAdminPasswordOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const businessTypeConfigs: Record<
    string,
    { label: string; icon: string; color: string; bg: string; border: string }
  > = {
    computer_shop: {
      label: 'Computer & Laptop Repair',
      icon: '💻',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40',
      border: 'border-cyan-500/30',
    },
    phone_shop: {
      label: 'Mobile Phone & Repair',
      icon: '📱',
      color: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-500/30',
    },
    grocery: {
      label: 'Grocery & Supermarket',
      icon: '🛒',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/30',
    },
    motor_parts: {
      label: 'Motor Spare Parts',
      icon: '🚗',
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/30',
    },
    restaurant: {
      label: 'Restaurant & Cafe',
      icon: '🍽️',
      color: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/30',
    },
    pharmacy: {
      label: 'Pharmacy & Medical',
      icon: '💊',
      color: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-500/30',
    },
    wholesale: {
      label: 'Wholesale & Distribution',
      icon: '📦',
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-500/30',
    },
    hardware_shop: {
      label: 'Hardware & Steel',
      icon: '🏗️',
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-500/30',
    },
    vehicle_service: {
      label: 'Vehicle Service Hub',
      icon: '🔧',
      color: 'text-purple-400',
      bg: 'bg-purple-950/40',
      border: 'border-purple-500/30',
    },
    retail_clothing: {
      label: 'Clothing & Fashion',
      icon: '👕',
      color: 'text-pink-400',
      bg: 'bg-pink-950/40',
      border: 'border-pink-500/30',
    },
    general: {
      label: 'General Retail Store',
      icon: '🏪',
      color: 'text-slate-300',
      bg: 'bg-slate-800/40',
      border: 'border-slate-700',
    },
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Shops', icon: '🏬', count: allTenants.length },
    {
      id: 'TECH',
      label: 'Computers & Phones',
      icon: '💻',
      count: allTenants.filter(
        (t) => t.business_type === 'computer_shop' || t.business_type === 'phone_shop'
      ).length,
    },
    {
      id: 'AUTO',
      label: 'Motor & Service Hubs',
      icon: '🚗',
      count: allTenants.filter(
        (t) => t.business_type === 'motor_parts' || t.business_type === 'vehicle_service'
      ).length,
    },
    {
      id: 'RETAIL',
      label: 'Grocery & Pharmacy & Cafe',
      icon: '🛒',
      count: allTenants.filter(
        (t) =>
          t.business_type === 'grocery' ||
          t.business_type === 'pharmacy' ||
          t.business_type === 'restaurant'
      ).length,
    },
    {
      id: 'WHOLESALE_HARDWARE',
      label: 'Wholesale & Hardware',
      icon: '📦',
      count: allTenants.filter(
        (t) => t.business_type === 'wholesale' || t.business_type === 'hardware_shop'
      ).length,
    },
  ];

  const filteredTenants = useMemo(() => {
    return allTenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.shop_name.toLowerCase().includes(q) ||
        t.tenant_id.toLowerCase().includes(q) ||
        t.business_type.toLowerCase().includes(q) ||
        (t.branch_name && t.branch_name.toLowerCase().includes(q)) ||
        (t.address && t.address.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedType === 'ALL') return true;
      if (selectedType === 'TECH') {
        return t.business_type === 'computer_shop' || t.business_type === 'phone_shop';
      }
      if (selectedType === 'AUTO') {
        return t.business_type === 'motor_parts' || t.business_type === 'vehicle_service';
      }
      if (selectedType === 'RETAIL') {
        return (
          t.business_type === 'grocery' ||
          t.business_type === 'pharmacy' ||
          t.business_type === 'restaurant'
        );
      }
      if (selectedType === 'WHOLESALE_HARDWARE') {
        return t.business_type === 'wholesale' || t.business_type === 'hardware_shop';
      }
      return t.business_type === selectedType;
    });
  }, [allTenants, searchQuery, selectedType]);

  if (!isOpen) return null;

  const handleSelectShop = (tenantId: string) => {
    if (tenantId === 'SUPER_ADMIN') {
      if (isSuperAdminAuthenticated) {
        setCurrentTenantId('SUPER_ADMIN');
        onClose();
      } else {
        setIsSuperAdminLoginOpen(true);
      }
    } else {
      setCurrentTenantId(tenantId);
      onClose();
    }
  };

  const getStatusIndicator = (status?: LicenseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            EXPIRING
          </span>
        );
      case 'TEMPORARY_SUSPENDED':
      case 'SUSPENDED':
      case 'DEACTIVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <Lock className="w-2.5 h-2.5 text-rose-400" />
            SUSPENDED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
            TRIAL
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                  Select Business Tenant / Portal
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {allTenants.length} Shops Registered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch instantly between retail customer shops or access the Super Admin Headquarters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Provision Shop</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shop by name, tenant ID (e.g. SHOP007), archetype, branch or address..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {filterTabs.map((tab) => {
              const isActive = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/70 hover:text-slate-100 border border-slate-700/50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content: Super Admin Banner + All Shops Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Super Admin Portal Card */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Platform Administration</span>
            </div>

            <div
              onClick={() => handleSelectShop('SUPER_ADMIN')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSuperAdminMode
                  ? 'bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-purple-950/70 border-purple-500/60 ring-2 ring-purple-500/30 shadow-lg'
                  : 'bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-purple-200">
                      WCS Super Admin Portal
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Headquarters
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized tenant license controls, remote kill-switch, module configuration & risk broadcasting.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {isSuperAdminMode ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white font-bold text-xs shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Currently Active
                  </span>
                ) : (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-purple-100 font-semibold text-xs border border-purple-400/30 transition-colors cursor-pointer">
                    <span>Enter Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Registered Shops List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Customer Business Tenants ({filteredTenants.length})</span>
              </span>
              <span className="text-[10px] lowercase font-normal text-slate-500">
                click any shop to switch session
              </span>
            </div>

            {filteredTenants.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                <Store className="w-8 h-8 mx-auto text-slate-600" />
                <div className="font-semibold text-sm text-slate-300">No shops match your search</div>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query or switch back to the "All Shops" tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredTenants.map((tenant) => {
                  const isSelected = !isSuperAdminMode && tenant.tenant_id === currentTenantId;
                  const lic = allLicenses[tenant.tenant_id];
                  const cfg =
                    businessTypeConfigs[tenant.business_type] || businessTypeConfigs.general;

                  return (
                    <div
                      key={tenant.tenant_id}
                      onClick={() => handleSelectShop(tenant.tenant_id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden group ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                          : 'bg-slate-950/40 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950/70'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                          <div className="bg-indigo-500 text-white text-[8px] font-bold py-0.5 text-center transform rotate-45 translate-x-3 translate-y-1 shadow-sm">
                            LIVE
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${cfg.bg} ${cfg.border} border flex items-center justify-center text-xl shrink-0 shadow-inner`}
                        >
                          {cfg.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                              {tenant.tenant_id}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-100 truncate mt-1 group-hover:text-indigo-200 transition-colors">
                            {tenant.shop_name}
                          </h3>

                          {tenant.branch_name && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0 text-slate-500" />
                              <span className="truncate">{tenant.branch_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIndicator(lic?.status)}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lic?.package_tier || 'PRO'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {tenant.currency} ({tenant.currency_symbol})
                          </span>

                          <button
                            type="button"
                            title={`Delete store ${tenant.shop_name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmText('');
                              setDeleteErrorMsg(null);
                              setTenantToDelete(tenant);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 flex items-center gap-0.5">
                              <span>Select</span>
                              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All shop data isolated by Tenant ID & synchronized via LocalStorage</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create & Provision New Shop</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Tenant Shop Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-rose-950/50 border border-rose-500/30 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Store</h3>
                <p className="text-xs text-rose-400 font-mono">
                  {tenantToDelete.tenant_id} • {tenantToDelete.shop_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{tenantToDelete.shop_name}</strong>? This action is <span className="text-rose-400 font-bold">permanent</span> and will completely erase all products, categories, sales receipts, and customer ledgers for this store.
            </p>

            {deleteErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                Type <span className="font-mono font-bold text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded border border-rose-500/30">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteErrorMsg(null);
                }}
                placeholder="DELETE"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTenantToDelete(null);
                  setDeleteConfirmText('');
                  setDeleteErrorMsg(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  if (deleteConfirmText !== 'DELETE') return;
                  const res = deleteTenantShop(tenantToDelete.tenant_id);
                  if (res.success) {
                    setTenantToDelete(null);
                    setDeleteConfirmText('');
                  } else {
                    setDeleteErrorMsg(res.message);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Create Shop Modal */}
      {isCreateModalOpen && (
        <CreateShopModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            onClose();
          }}
        />
      )}

      {/* Super Admin Login Modal */}
      <SuperAdminLoginModal
        isOpen={isSuperAdminLoginOpen}
        onClose={() => setIsSuperAdminLoginOpen(false)}
        onOpenPasswordStudio={() => setIsSuperAdminPasswordOpen(true)}
        onSuccess={() => {
          setCurrentTenantId('SUPER_ADMIN');
          onClose();
        }}
      />

      {/* Super Admin Password Studio Modal */}
      <SuperAdminPasswordModal
        isOpen={isSuperAdminPasswordOpen}
        onClose={() => setIsSuperAdminPasswordOpen(false)}
      />
    </div>
  );
};
