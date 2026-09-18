import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Tenant, LicenseStatus } from '../../types';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  PlusCircle,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Store,
  RefreshCw,
  HardDrive,
  Users,
  Activity,
  Layers,
  ArrowRight,
  Code,
  KeyRound,
  Trash2,
  Zap,
  Infinity as InfinityIcon,
  X,
  AlertCircle,
  Database,
  Download,
  Award,
  Cloud,
  Copy,
  Check,
} from 'lucide-react';
import { LicenseControlModal } from './LicenseControlModal';
import { ModuleConfigModal } from './ModuleConfigModal';
import { CreateShopModal } from './CreateShopModal';
import { RiskAlertsCenter } from './RiskAlertsCenter';
import { SystemUpdatesStudio } from './SystemUpdatesStudio';
import { SuperAdminPasswordModal } from './SuperAdminPasswordModal';
import { AllShopsBackupStudio } from '../common/AllShopsBackupStudio';
import { SuperAdminMessagingStudio } from './SuperAdminMessagingStudio';
import { LicenseCertificateModal } from './LicenseCertificateModal';
import { RemoteSecurityControlModal } from './RemoteSecurityControlModal';
import { DeployShopRemoteModal } from './DeployShopRemoteModal';
import { IssueLicenseKeyModal } from './IssueLicenseKeyModal';

export const SuperAdminDashboard: React.FC = () => {
  const {
    allTenants,
    allLicenses,
    allLicensesList,
    allSettings,
    allRiskAlerts,
    setCurrentTenantId,
    setLicenseStatus,
    lockSuperAdmin,
    deleteTenantShop,
    cloudSyncStatus,
    lastCloudSync,
    cloudVersion,
    connectedClientsCount,
    forceCloudSync,
    remoteDevices,
  } = useRetail();

  const safeAllTenants = allTenants || [];
  const safeAllLicenses = allLicenses || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('ALL');

  // Modals state
  const [isRemoteSecurityModalOpen, setIsRemoteSecurityModalOpen] = useState(false);
  const [isIssueKeyModalOpen, setIsIssueKeyModalOpen] = useState(false);
  const [issueKeyTargetShopId, setIssueKeyTargetShopId] = useState<string | undefined>(undefined);
  const [selectedTenantForLicense, setSelectedTenantForLicense] = useState<Tenant | null>(null);
  const [selectedTenantForCertificate, setSelectedTenantForCertificate] = useState<Tenant | null>(null);
  const [selectedTenantForModules, setSelectedTenantForModules] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAlertsCenterOpen, setIsAlertsCenterOpen] = useState(false);
  const [isMessagingStudioOpen, setIsMessagingStudioOpen] = useState(false);
  const [messagingTargetTenantId, setMessagingTargetTenantId] = useState<string | null>(null);
  const [isUpdatesStudioOpen, setIsUpdatesStudioOpen] = useState(false);
  const [isBackupStudioOpen, setIsBackupStudioOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployTargetTenantId, setDeployTargetTenantId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedShopId, setCopiedShopId] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleCopyShopLink = (tenantId: string) => {
    const url = `${window.location.origin}?tenant=${tenantId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedShopId(tenantId);
    setActionNotice(`Direct URL copied for ${tenantId}. Open this URL on any other computer to work simultaneously!`);
    setTimeout(() => {
      setCopiedShopId(null);
    }, 3000);
  };

  // Statistics
  const totalTenants = safeAllTenants.length;
  const activeTenants = safeAllTenants.filter((t) => safeAllLicenses[t.tenant_id]?.status === 'ACTIVE').length;
  const warningTenants = safeAllTenants.filter((t) => safeAllLicenses[t.tenant_id]?.status === 'WARNING').length;
  const suspendedTenants = safeAllTenants.filter(
    (t) =>
      safeAllLicenses[t.tenant_id]?.status === 'TEMPORARY_SUSPENDED' ||
      safeAllLicenses[t.tenant_id]?.status === 'SUSPENDED' ||
      safeAllLicenses[t.tenant_id]?.status === 'DEACTIVATED'
  ).length;

  const filteredTenants = safeAllTenants.filter((t) => {
    const lic = safeAllLicenses[t.tenant_id];
    const matchesSearch =
      t.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenant_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.business_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.company_name && t.company_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && lic?.status === 'ACTIVE') ||
      (statusFilter === 'WARNING' && lic?.status === 'WARNING') ||
      (statusFilter === 'SUSPENDED' &&
        (lic?.status === 'TEMPORARY_SUSPENDED' || lic?.status === 'SUSPENDED' || lic?.status === 'DEACTIVATED'));

    const matchesArchetype =
      archetypeFilter === 'ALL' ||
      t.business_type === archetypeFilter ||
      (archetypeFilter === 'restaurant' && (t.business_type === 'restaurant' || t.business_type === 'restaurant_hotel')) ||
      (archetypeFilter === 'hotel' && (t.business_type === 'hotel' || t.business_type === 'restaurant_hotel'));

    return matchesSearch && matchesStatus && matchesArchetype;
  });

  const getStatusBadge = (status?: LicenseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      case 'TEMPORARY_SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-950/60 text-orange-300 border border-orange-500/40">
            <Lock className="w-3 h-3 text-orange-400" />
            TEMP LOCK
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            SUSPENDED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            EXPIRED
          </span>
        );
      case 'DEACTIVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-800/40">
            DEACTIVATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
            PENDING
          </span>
        );
    }
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    const res = deleteTenantShop(tenant.tenant_id);
    if (res.success) {
      setActionNotice(res.message);
      setTenantToDelete(null);
      setDeleteConfirmText('');
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-16">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-950/90 border border-emerald-500 rounded-2xl shadow-2xl text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="ml-2 text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Super Admin Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl text-white shadow-xl shadow-indigo-900/40">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-100">
                  WCS Super Admin Headquarters
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  v2.6 Enterprise Cloud
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3" />
                  Unlimited Capacity
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Master Multi-Tenant Control Hub & Licensing Operations
              </p>
            </div>
          </div>

          {/* Super Admin Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setIssueKeyTargetShopId(undefined);
                setIsIssueKeyModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
            >
              <KeyRound className="w-4 h-4 text-emerald-200" />
              <span>Issue Valid Key / Disable Devices</span>
            </button>



            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>Admin Password</span>
            </button>

            <button
              onClick={() => setIsUpdatesStudioOpen(true)}
              className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>System & Schema</span>
            </button>

            <button
              onClick={() => setIsBackupStudioOpen(true)}
              className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>All Shops Backup (Import / Export)</span>
            </button>

            <button
              onClick={() => setIsAlertsCenterOpen(true)}
              className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Risk Broadcast ({allRiskAlerts.length})</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Shop (Single / Batch)</span>
            </button>

            <button
              onClick={lockSuperAdmin}
              title="Lock Super Admin Portal session and return to tenant store"
              className="px-3 py-2 bg-slate-900/80 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Lock HQ</span>
            </button>
          </div>
        </div>

        {/* 4 Stat KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Tenant Shops</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-slate-100">{totalTenants}</span>
              <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                <InfinityIcon className="w-2.5 h-2.5" /> Unlimited Scale
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Active Software Licenses</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-emerald-400">{activeTenants}</span>
              <span className="text-[10px] text-emerald-500/80">Online & Verified</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Renewal Warnings</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-amber-400">{warningTenants}</span>
              <span className="text-[10px] text-amber-300">Expiring &lt; 7 Days</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Suspended / Deactivated</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-rose-400">{suspendedTenants}</span>
              <span className="text-[10px] text-rose-300">POS Locked</span>
            </div>
          </div>
        </div>

        {/* Multi-Computer Cloud Synchronization Status Banner */}
        <div className="mt-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-indigo-950/90 border border-indigo-500/40 rounded-xl text-indigo-400 shrink-0">
              <Cloud className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-100">Multi-Computer Real-Time Cloud Sync:</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    cloudSyncStatus === 'connected'
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : cloudSyncStatus === 'syncing'
                      ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                      : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {cloudSyncStatus === 'connected' ? '● Online & Synchronized' : cloudSyncStatus === 'syncing' ? '● Syncing...' : '● Offline Mode'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  Revision #{cloudVersion || 1}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {connectedClientsCount} Connected {connectedClientsCount === 1 ? 'Device' : 'Devices'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Any shop created here can be opened on another computer. All sales, purchases, and stock updates recorded on other computers automatically reflect in this Super Admin portal in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={async () => {
                setIsManualSyncing(true);
                await forceCloudSync();
                setTimeout(() => setIsManualSyncing(false), 500);
              }}
              disabled={isManualSyncing}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tenant Directory & Remote Operations Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-indigo-400" />
              Tenant Shops Directory ({filteredTenants.length})
            </h2>
            <p className="text-xs text-slate-400">
              Isolated databases per shop with unified remote licensing, module toggles & deletion controls
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shop, tenant ID, branch..."
                className="w-56 bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses ({totalTenants})</option>
              <option value="ACTIVE">Active Licenses ({activeTenants})</option>
              <option value="WARNING">Warnings ({warningTenants})</option>
              <option value="SUSPENDED">Suspended ({suspendedTenants})</option>
            </select>

            {/* Archetype Filter */}
            <select
              value={archetypeFilter}
              onChange={(e) => setArchetypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Archetypes</option>
              <option value="restaurant">🍽️ Restaurant & Dining</option>
              <option value="hotel">🏨 Hotel & Resort</option>
              <option value="grocery">🛒 Grocery & Mart</option>
              <option value="pharmacy">💊 Pharmacy & Medical</option>
              <option value="motor_parts">🚗 Motor Spare Parts</option>
              <option value="wholesale">📦 Wholesale Trade</option>
              <option value="computer_shop">💻 Computer & Laptop</option>
              <option value="phone_shop">📱 Mobile Phones</option>
              <option value="vehicle_service">🔧 Vehicle Service</option>
            </select>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Shop</span>
            </button>
          </div>
        </div>

        {/* Tenant Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Store Identity & Tenant ID</th>
                <th className="py-3 px-4">Business Archetype</th>
                <th className="py-3 px-4">Package & SKUs</th>
                <th className="py-3 px-4">License Status</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-right">Remote Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching retail tenant stores found.
                  </td>
                </tr>
              ) : null}

              {filteredTenants.map((t) => {
                const lic = safeAllLicenses[t.tenant_id];

                return (
                  <tr key={t.tenant_id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Store Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.logo_url}
                          alt={t.shop_name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 bg-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                            <span>{t.shop_name}</span>
                            <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-500/20">
                              {t.tenant_id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.company_name}</div>
                          <div className="text-[10px] text-slate-400">{t.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Business Archetype */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                        <span>
                          {t.business_type === 'restaurant'
                            ? '🍽️'
                            : t.business_type === 'hotel' || t.business_type === 'restaurant_hotel'
                            ? '🏨'
                            : t.business_type === 'grocery'
                            ? '🛒'
                            : t.business_type === 'pharmacy'
                            ? '💊'
                            : t.business_type === 'motor_parts'
                            ? '🚗'
                            : t.business_type === 'phone_shop'
                            ? '📱'
                            : t.business_type === 'computer_shop'
                            ? '💻'
                            : t.business_type === 'vehicle_service'
                            ? '🔧'
                            : '🏪'}
                        </span>
                        <span className="capitalize font-semibold text-slate-200">
                          {t.business_type === 'hotel'
                            ? 'Hotel & Resort'
                            : t.business_type === 'restaurant'
                            ? 'Restaurant & Dining'
                            : t.business_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Branch: {t.branch_name}</div>
                    </td>

                    {/* Package & SKU limit */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{lic?.package_tier || 'STARTER'}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40 font-mono">
                          ∞ Unlimited
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Max {lic?.max_branches || 1} Br / {lic?.max_users || 3} Users
                      </div>
                    </td>

                    {/* License Status */}
                    <td className="py-3 px-4">{getStatusBadge(lic?.status)}</td>

                    {/* Expiry Date */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-300">
                        {lic ? new Date(lic.valid_until).toLocaleDateString() : 'N/A'}
                      </div>
                      {lic?.warning_message && (
                        <div className="text-[10px] text-amber-400 truncate max-w-[140px]" title={lic.warning_message}>
                          ⚠️ {lic.warning_message}
                        </div>
                      )}
                    </td>

                    {/* Remote Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Modules Config Button */}
                        <button
                          onClick={() => setSelectedTenantForModules(t)}
                          title="Configure Specialized Business Modules"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>

                        {/* License Certificate Button */}
                        <button
                          onClick={() => setSelectedTenantForCertificate(t)}
                          title="View, Print, WhatsApp & Email Official License Certificate"
                          className="p-1.5 bg-slate-800 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-amber-400" />
                        </button>



                        {/* Delete Shop Button */}
                        <button
                          onClick={() => {
                            setTenantToDelete(t);
                            setDeleteConfirmText('');
                          }}
                          title="Decommission & Delete Store"
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Direct Issue Key & Device Control */}
                        <button
                          onClick={() => {
                            setIssueKeyTargetShopId(t.tenant_id);
                            setIsIssueKeyModalOpen(true);
                          }}
                          title="Issue 01M, 03M, 06M, 12M Valid Key or Disable Operating Device"
                          className="px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/50 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] hidden sm:inline">Issue Key</span>
                        </button>





                        {/* Quick Log into Shop Workspace */}
                        <button
                          onClick={() => setCurrentTenantId(t.tenant_id)}
                          className="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <span>Open Shop</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Tenant Architectural Reference Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
        <div className="font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Multi-Tenant Cloud Data Isolation Active:</span>
        </div>
        <p className="leading-relaxed">
          Every transaction, inventory item, customer credit record, custom field, and report is strictly indexed and isolated by{' '}
          <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">tenant_id</code> and{' '}
          <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300 font-mono">branch_id</code>. Shop A cannot see Shop B's records under any circumstances.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Decommission & Delete Store?</h3>
                <p className="text-xs text-rose-300/80 font-mono">{tenantToDelete.tenant_id} - {tenantToDelete.shop_name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action is <strong className="text-rose-400">permanent</strong>. All products, sales records, customer ledgers, user accounts, and license data for <strong>{tenantToDelete.shop_name}</strong> will be permanently wiped from the fleet.
            </p>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Type <span className="text-rose-400 font-bold font-mono">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTenantToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => handleDeleteTenant(tenantToDelete)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Store</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedTenantForLicense && (
        <LicenseControlModal
          tenant={selectedTenantForLicense}
          license={safeAllLicenses[selectedTenantForLicense.tenant_id]}
          isOpen={true}
          onClose={() => setSelectedTenantForLicense(null)}
        />
      )}

      {selectedTenantForCertificate && (
        <LicenseCertificateModal
          tenant={selectedTenantForCertificate}
          license={safeAllLicenses[selectedTenantForCertificate.tenant_id]}
          isOpen={true}
          onClose={() => setSelectedTenantForCertificate(null)}
        />
      )}

      {selectedTenantForModules && (
        <ModuleConfigModal
          tenant={selectedTenantForModules}
          settings={allSettings?.[selectedTenantForModules.tenant_id] || ({} as any)}
          isOpen={true}
          onClose={() => setSelectedTenantForModules(null)}
        />
      )}

      <CreateShopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <RiskAlertsCenter isOpen={isAlertsCenterOpen} onClose={() => setIsAlertsCenterOpen(false)} />
      <SuperAdminMessagingStudio
        isOpen={isMessagingStudioOpen}
        onClose={() => {
          setIsMessagingStudioOpen(false);
          setMessagingTargetTenantId(null);
        }}
        initialSelectedTenantId={messagingTargetTenantId}
      />
      <SystemUpdatesStudio isOpen={isUpdatesStudioOpen} onClose={() => setIsUpdatesStudioOpen(false)} />
      <SuperAdminPasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <AllShopsBackupStudio isOpen={isBackupStudioOpen} isModal={true} onClose={() => setIsBackupStudioOpen(false)} />
      <RemoteSecurityControlModal isOpen={isRemoteSecurityModalOpen} onClose={() => setIsRemoteSecurityModalOpen(false)} />
      <DeployShopRemoteModal
        isOpen={isDeployModalOpen}
        onClose={() => {
          setIsDeployModalOpen(false);
          setDeployTargetTenantId(null);
        }}
        initialTenantId={deployTargetTenantId || undefined}
      />
      {isIssueKeyModalOpen && (
        <IssueLicenseKeyModal
          isOpen={isIssueKeyModalOpen}
          onClose={() => {
            setIsIssueKeyModalOpen(false);
            setIssueKeyTargetShopId(undefined);
          }}
          targetShopId={issueKeyTargetShopId}
        />
      )}
    </div>
  );
};
