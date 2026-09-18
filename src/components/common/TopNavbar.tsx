import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { UserRole, Language } from '../../types';
import {
  Building2,
  Store,
  ShieldCheck,
  CreditCard,
  Printer,
  RotateCcw,
  Download,
  ChevronDown,
  User,
  Radio,
  Globe,
  Maximize2,
  Minimize2,
  Search,
  ExternalLink,
  CheckCircle2,
  Code,
  Lock,
  KeyRound,
  LogOut,
  Sparkles,
  Key,
  Sun,
  AlertTriangle,
  Network,
  Monitor,
  Bell,
  MessageSquare,
  Pin,
  Bookmark,
  Copy,
  Check,
  Cloud,
  Laptop,
  RefreshCw,
  X,
} from 'lucide-react';
import { TenantPortalPanel } from './TenantPortalPanel';
import { SystemUpdatesStudio } from '../superadmin/SystemUpdatesStudio';
import { SuperAdminLoginModal } from '../superadmin/SuperAdminLoginModal';
import { SuperAdminPasswordModal } from '../superadmin/SuperAdminPasswordModal';
import { MultiTenantAuthGate } from '../auth/MultiTenantAuthGate';
import { ShopBackupStudio } from './ShopBackupStudio';
import { DailyOpeningBriefingModal } from './DailyOpeningBriefingModal';
import { ShopMessagesModal } from './ShopMessagesModal';

interface TopNavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenPos: () => void;
  onOpenDailyBriefing?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeView,
  setActiveView,
  onOpenPos,
  onOpenDailyBriefing,
}) => {
  const {
    currentTenantId,
    setCurrentTenantId,
    allTenants,
    allLicenses,
    currentTenant,
    currentLicense,
    currentUser,
    setCurrentUser,
    users,
    tenantUsers,
    isSuperAdminMode,
    isSuperAdminAuthenticated,
    authSession,
    logoutSession,
    lockSuperAdmin,
    resetToDemoData,
    exportDatabaseJson,
    language,
    setLanguage,
    t,
    isFullscreen,
    toggleFullscreen,
    products,
    customers,
    terminalStation,
    unreadTenantMessagesCount,
    tenantMessages,
    copyShopDirectUrl,
    getShopDirectUrl,
    cloudSyncStatus,
    lastCloudSync,
    cloudVersion,
    connectedClientsCount,
    forceCloudSync,
  } = useRetail();

  const [copiedShopUrl, setCopiedShopUrl] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [copiedCloudUrl, setCopiedCloudUrl] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isUpdatesStudioOpen, setIsUpdatesStudioOpen] = useState(false);
  const [isBackupStudioOpen, setIsBackupStudioOpen] = useState(false);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);
  const [isShopMessagesOpen, setIsShopMessagesOpen] = useState(false);
  const [isSuperAdminLoginOpen, setIsSuperAdminLoginOpen] = useState(false);
  const [isSuperAdminPasswordOpen, setIsSuperAdminPasswordOpen] = useState(false);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Low stock and Debtor alert counts for top bar badge
  const lowStockCount = (products || []).filter((p) => p.stock_quantity <= (p.reorder_level ?? 10)).length;
  const debtorCount = (customers || []).filter((c) => (c.current_balance || 0) > 0).length;
  const totalDailyAlerts = lowStockCount + debtorCount;

  const isSuperAdminAccess = (isSuperAdminMode && isSuperAdminAuthenticated) || (authSession?.authType === 'SUPER_ADMIN' && isSuperAdminAuthenticated);

  const getShopEmoji = (type?: string) => {
    switch (type) {
      case 'computer_shop': return '💻';
      case 'phone_shop': return '📱';
      case 'grocery': return '🛒';
      case 'motor_parts': return '🚗';
      case 'restaurant': return '🍽️';
      case 'pharmacy': return '💊';
      case 'wholesale': return '📦';
      case 'hardware_shop': return '🏗️';
      case 'vehicle_service': return '🔧';
      case 'retail_clothing': return '👕';
      default: return '🏪';
    }
  };

  const languages: { code: Language; label: string; native: string; flag: string }[] = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'si', label: 'Sinhala', native: 'සිංහල', flag: '🇱🇰' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇱🇰' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  const handleSelectTenant = (id: string) => {
    setShowTenantDropdown(false);
    if (id === 'SUPER_ADMIN') {
      if (isSuperAdminAuthenticated) {
        setCurrentTenantId('SUPER_ADMIN');
      } else {
        setIsSuperAdminLoginOpen(true);
      }
    } else {
      setCurrentTenantId(id);
    }
  };

  const filteredDropdownTenants = allTenants.filter((t) => {
    if (!dropdownSearch.trim()) return true;
    const q = dropdownSearch.toLowerCase();
    return (
      t.shop_name.toLowerCase().includes(q) ||
      t.tenant_id.toLowerCase().includes(q) ||
      t.business_type.toLowerCase().includes(q) ||
      (t.branch_name && t.branch_name.toLowerCase().includes(q))
    );
  });

  const handleSelectRole = (role: UserRole) => {
    const targetUser = (tenantUsers || []).find((u) => u.role === role) || {
      id: `USER_${currentTenantId}_${role.toLowerCase()}`,
      tenant_id: currentTenantId,
      username: role.toLowerCase(),
      full_name: `${role.replace('_', ' ')} Staff`,
      email: `${role.toLowerCase()}@${currentTenantId.toLowerCase()}.lk`,
      role: role,
      pin_code: '1234',
      is_active: true,
      avatar_color: '#4f46e5',
    };
    setCurrentUser(targetUser);
    setShowRoleDropdown(false);
  };

  const handleExport = () => {
    const jsonStr = exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wcs_retail_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 select-none shadow-md">
      {/* Top Primary Bar: Branding, Shop Switcher, User Role, Language, and POS Terminal CTA */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Tenant Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-white text-sm shadow-inner shadow-indigo-400/30 shrink-0">
              WCS
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>Retail Cloud</span>
                <span className="text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-400/20">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Multi-Tenant Platform</p>
            </div>
          </div>

          {/* Tenant / Shop Display & Dropdown */}
          <div className="relative shrink-0">
            {isSuperAdminMode ? (
              /* Super Admin Master Portal Button & Dropdown */
              <>
                <button
                  onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer bg-purple-950/70 border-purple-500/40 text-purple-200 hover:bg-purple-900/80 shadow-xs whitespace-nowrap"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-purple-300">WCS Super Admin Portal</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-900/90 text-purple-300 rounded font-bold">
                    HQ
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                </button>

                {showTenantDropdown && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Tenant Directory & Switcher</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {allTenants.length} registered business stores available
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowTenantDropdown(false);
                          setIsTenantModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/30 transition-colors cursor-pointer"
                      >
                        <span>Expand All</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Dropdown Search Bar */}
                    <div className="p-2 border-b border-slate-800/80 bg-slate-900">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={dropdownSearch}
                          onChange={(e) => setDropdownSearch(e.target.value)}
                          placeholder="Search shop name, ID or type..."
                          className="w-full bg-slate-950/60 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="p-1.5 space-y-1 max-h-80 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Customer Stores ({filteredDropdownTenants.length})</span>
                      </div>

                      {/* Customer Shops List for Super Admin */}
                      {filteredDropdownTenants.map((t) => {
                        const lic = allLicenses[t.tenant_id];
                        return (
                          <button
                            key={t.tenant_id}
                            onClick={() => handleSelectTenant(t.tenant_id)}
                            className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer text-slate-300 hover:bg-slate-800/70"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl shrink-0">{getShopEmoji(t.business_type)}</span>
                              <div className="min-w-0">
                                <div className="truncate text-slate-100 font-medium">{t.shop_name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                                  <span className="font-mono text-indigo-300">{t.tenant_id}</span>
                                  <span>•</span>
                                  <span className="capitalize truncate">
                                    {t.branch_name || t.business_type.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              {lic?.status === 'ACTIVE' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active License" />
                              ) : lic?.status === 'WARNING' ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400" title="Expiring License" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-rose-400" title="Suspended" />
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {t.currency}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setShowTenantDropdown(false);
                          setIsTenantModalOpen(true);
                        }}
                        className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold rounded-lg text-xs border border-indigo-500/30 transition-colors text-center cursor-pointer"
                      >
                        Open Full Tenant & Portal Directory ({allTenants.length} Shops)
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Isolated Shop Mode: ONLY display current shop details with no cross-tenant leaking */
              <>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700/80 text-xs font-medium transition-all cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span className="text-base leading-none">{getShopEmoji(currentTenant?.business_type)}</span>
                    <span className="font-bold text-slate-100 max-w-[130px] sm:max-w-[180px] lg:max-w-[240px] truncate">
                      {currentTenant?.shop_name || 'Store'}
                    </span>
                    <span className="hidden md:inline-block text-[10px] text-indigo-300 font-mono px-1 rounded bg-slate-900/70">
                      {currentTenantId}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  {/* Browser Address Bar Direct URL Pin & Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      copyShopDirectUrl();
                      setCopiedShopUrl(true);
                      setTimeout(() => setCopiedShopUrl(false), 2500);
                    }}
                    title="Pin / Copy Browser Address Bar Link for this shop"
                    className={`hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                      copiedShopUrl
                        ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    {copiedShopUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] whitespace-nowrap">URL Copied!</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[11px] font-mono text-indigo-300 whitespace-nowrap">?shop={currentTenantId}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Isolated Shop Info Drawer */}
                {showTenantDropdown && (
                  <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl shrink-0">
                        {getShopEmoji(currentTenant?.business_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-100 truncate">{currentTenant?.shop_name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{currentTenant?.company_name || currentTenant?.shop_name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300 border border-slate-700">
                            {currentTenantId}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {currentTenant?.business_type?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Browser Address Bar Pin URL Card */}
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-300 flex items-center gap-1">
                          <Pin className="w-3 h-3 text-indigo-400" />
                          <span>Browser Address Bar URL</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            copyShopDirectUrl();
                            setCopiedShopUrl(true);
                            setTimeout(() => setCopiedShopUrl(false), 2500);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-200 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedShopUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedShopUrl ? 'Copied' : 'Copy Direct Link'}</span>
                        </button>
                      </div>
                      <div className="bg-slate-950/90 rounded-lg p-2 font-mono text-[10px] text-indigo-200 break-all border border-indigo-900/50">
                        {getShopDirectUrl()}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        Save or bookmark this URL in your browser address bar to directly open this shop next time.
                      </p>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Store Branch:</span>
                        <span className="font-medium text-slate-200">{currentTenant?.branch_name || 'Main Branch'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Currency:</span>
                        <span className="font-mono font-semibold text-slate-200">{currentTenant?.currency || 'LKR'} ({currentTenant?.currency_symbol || 'Rs.'})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>License Status:</span>
                        <span className="font-bold text-emerald-400">● {currentLicense?.status || 'ACTIVE'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Tier Package:</span>
                        <span className="font-semibold text-purple-300">{currentLicense?.package_tier || 'PROFESSIONAL'}</span>
                      </div>
                    </div>

                    <div className="pt-1 space-y-2">
                      {/* Special Super Admin Panel Login Button */}
                      <button
                        onClick={() => {
                          setShowTenantDropdown(false);
                          setIsSuperAdminLoginOpen(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 hover:from-purple-900 hover:to-indigo-900 text-purple-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-purple-500/40 shadow-sm transition-all"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Super Admin Panel Login</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowTenantDropdown(false);
                          setIsAuthGateOpen(true);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Exit Shop</span>
                      </button>

                      <p className="text-[10px] text-center text-slate-500">
                        Isolated store environment. Contact administration for account changes.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* License Status Pill */}
          {!isSuperAdminMode && currentLicense && (
            <div className="hidden xl:flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border whitespace-nowrap ${
                  currentLicense.status === 'ACTIVE'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                    : currentLicense.status === 'WARNING'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                }`}
              >
                ● {currentLicense.status}
              </span>
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                {currentLicense.package_tier}
              </span>
            </div>
          )}
        </div>

        {/* Right: Language Switcher, Fullscreen, Role Switcher, and Primary POS CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              title="Change Language (English / සිංහල / தமிழ்)"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold text-[11px] flex items-center gap-1 whitespace-nowrap">
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.native}</span>
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 p-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>Language / භාෂාව</span>
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      language === l.code
                        ? 'bg-cyan-600/30 text-cyan-200 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <div>
                        <div className="font-semibold">{l.native}</div>
                        <div className="text-[10px] text-slate-400">{l.label}</div>
                      </div>
                    </div>
                    {language === l.code && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Mode Toggle Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen POS Mode'}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
              isFullscreen
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/70 shadow-inner'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Active Role Switcher */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="text-left hidden md:block max-w-[120px] lg:max-w-[150px] truncate">
                <span className="text-[11px] font-medium text-slate-300 truncate block">{currentUser?.full_name || 'Staff User'}</span>
                <span className="text-[9px] text-indigo-300 block leading-none font-bold uppercase truncate">
                  {(currentUser?.role || 'CASHIER').replace('_', ' ')}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                  <span>{isSuperAdminMode ? 'Super Admin HQ' : `${currentTenant?.shop_name || 'Shop'} Staff`}</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded font-mono">
                    {currentTenantId}
                  </span>
                </div>

                {isSuperAdminMode ? (
                  <div className="py-1 space-y-1 text-xs">
                    <div className="px-3 py-1.5 text-purple-300 font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Super Administrator</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsSuperAdminPasswordOpen(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                      <span>Change Master Password</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        lockSuperAdmin();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-300 hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lock Super Admin HQ</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-1 space-y-1">
                    {/* List of active staff accounts for this specific shop */}
                    {(tenantUsers && tenantUsers.length > 0 ? tenantUsers : (currentUser ? [currentUser] : [])).map((u) => {
                      const isSelected = currentUser?.id === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0"
                              style={{ backgroundColor: u.avatar_color || '#4f46e5' }}
                            >
                              {u.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="truncate min-w-0">
                              <div className="truncate">{u.full_name}</div>
                              <div className="text-[9px] opacity-75 font-mono capitalize">
                                {u.role.toLowerCase().replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}

                    {(currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN') && (
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          setActiveView('USERS');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-indigo-300 hover:bg-indigo-950/40 flex items-center gap-2 cursor-pointer transition-colors mt-1 border-t border-slate-800/80 pt-2"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Manage Staff & PINs</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-800 my-1 pt-1 space-y-1">
                  {!isSuperAdminMode && (
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setIsSuperAdminLoginOpen(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-purple-300 hover:bg-purple-950/60 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Super Admin Panel Login</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setIsAuthGateOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/50 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out / Switch Shop</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* POS Terminal Mode Button (Available for Shop Staff) */}
          {!isSuperAdminMode && (
            <button
              onClick={onOpenPos}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.openPos || 'POS Terminal'}</span>
              <span className="sm:hidden">POS</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Operation Toolbar (Next Line / Sub-Bar): Station Status, Bridge, HQ Messages, Briefing & Utilities */}
      <div className="border-t border-slate-800/90 bg-slate-950/90 px-3 sm:px-6 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          {/* Left Operations Group: Counter station, Print Bridge, Headquarter Notices, Daily Briefing */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Terminal Station Mode Indicator / Counter Network Trigger */}
            {!isSuperAdminMode && (
              <button
                onClick={() => setActiveView('COUNTERS_NETWORK')}
                title={`Device Station: ${terminalStation?.role === 'ADMIN_WORKSTATION' ? 'Admin Workstation (Full Office Control)' : `Cashier Billing Counter (${terminalStation?.counter_name || 'CTR-01'})`}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
                  terminalStation?.role === 'ADMIN_WORKSTATION'
                    ? 'bg-purple-950/60 border-purple-500/40 text-purple-200 hover:bg-purple-900/60'
                    : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/60'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="whitespace-nowrap max-w-[140px] sm:max-w-[200px] truncate">
                  {terminalStation?.role === 'ADMIN_WORKSTATION' ? 'Admin Station' : `${terminalStation?.counter_name || 'Counter 01'}`}
                </span>
                <span className="text-[10px] text-slate-400 hidden lg:inline whitespace-nowrap">
                  (Barcode Scan)
                </span>
              </button>
            )}

            {/* Print Bridge Indicator */}
            <div
              title="WCS Print Bridge: Connected for silent ESC/POS printing"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] text-slate-300 whitespace-nowrap shrink-0"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
              <Printer className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">Bridge Online</span>
            </div>

            {/* Multi-PC Real-Time Cloud Sync Button */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              title="Multi-PC Cloud Sync: Real-time data sync across different computers & Super Admin"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
                cloudSyncStatus === 'connected'
                  ? 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-indigo-950/70 hover:bg-indigo-900 border-indigo-500/40 text-indigo-300'
                  : 'bg-amber-950/70 hover:bg-amber-900 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-indigo-400 animate-ping'
                    : 'bg-amber-400'
                }`}
              />
              <Cloud className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="whitespace-nowrap">
                {cloudSyncStatus === 'connected'
                  ? 'Multi-PC Sync'
                  : cloudSyncStatus === 'syncing'
                  ? 'Syncing...'
                  : 'Offline Mode'}
              </span>
              <span className="px-1.5 py-0.2 bg-slate-900/80 border border-slate-700 text-[10px] rounded text-slate-300 font-mono">
                v{cloudVersion || 1}
              </span>
            </button>

            {/* Headquarter Direct Messages & Notices (For Shop Managers / Cashiers) */}
            {!isSuperAdminMode && (
              <button
                onClick={() => setIsShopMessagesOpen(true)}
                title={`WCS Headquarter Direct Messages & Notices (${unreadTenantMessagesCount} unread)`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
                  unreadTenantMessagesCount > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white animate-pulse'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 shrink-0 ${unreadTenantMessagesCount > 0 ? 'text-white' : 'text-slate-400'}`} />
                <span className="hidden sm:inline whitespace-nowrap">HQ Notices</span>
                {unreadTenantMessagesCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[10px] rounded-full shadow-xs">
                    {unreadTenantMessagesCount}
                  </span>
                )}
              </button>
            )}

            {/* Daily Store Opening Briefing & Alerts (Low Stock & Customer Credit) */}
            {!isSuperAdminMode && (
              <button
                onClick={() => {
                  if (onOpenDailyBriefing) {
                    onOpenDailyBriefing();
                  } else {
                    setIsDailyBriefingOpen(true);
                  }
                }}
                title="Daily Store Opening Briefing & Health Check (Low Stock & Debtors)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
                  totalDailyAlerts > 0
                    ? 'bg-amber-950/70 hover:bg-amber-900 border-amber-500/50 text-amber-200'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <Sun className={`w-3.5 h-3.5 shrink-0 ${totalDailyAlerts > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <span className="hidden sm:inline whitespace-nowrap">Daily Briefing</span>
                {totalDailyAlerts > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[10px] rounded-full">
                    {totalDailyAlerts}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Right Tools Group: Backup, Code Studio, Super Admin Shortcuts, Reset Demo */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Special Super Admin Panel Login Button (Displayed in Open Shop Only) */}
            {!isSuperAdminMode && (
              <button
                onClick={() => setIsSuperAdminLoginOpen(true)}
                title="Super Admin Panel Login (Master Platform HQ Controls)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/40 hover:border-purple-400 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Super Admin Panel</span>
                <span className="sm:hidden whitespace-nowrap">Admin HQ</span>
                <span className="text-[9px] px-1 py-0.2 bg-purple-900/90 text-purple-300 rounded font-mono font-semibold">
                  HQ
                </span>
              </button>
            )}

            {/* Super Admin Security Shortcut Controls */}
            {isSuperAdminMode && (
              <>
                <button
                  onClick={() => setIsSuperAdminPasswordOpen(true)}
                  title="Super Admin Master Password & Security Settings"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-400/40 text-purple-200 text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">HQ Password</span>
                </button>

                <button
                  onClick={() => setIsUpdatesStudioOpen(true)}
                  title="System Updates, Code Modification & AI Blueprint Studio"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Code className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-[11px] font-bold hidden sm:inline whitespace-nowrap">Code Studio</span>
                </button>

                <button
                  onClick={lockSuperAdmin}
                  title="Lock Super Admin Portal session"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">Lock</span>
                </button>
              </>
            )}

            {/* Shop Backup Data (Import & Export) */}
            <button
              onClick={() => setIsBackupStudioOpen(true)}
              title={`Shop Backup Data (Import & Export for ${currentTenant?.shop_name || 'Current Shop'})`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Shop Backup</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset to Fresh Seed Data"
              className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700 text-xs whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline text-[11px] whitespace-nowrap">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Store Opening Briefing Modal */}
      <DailyOpeningBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        onNavigateTab={(tab) => {
          setActiveView(tab);
          setIsDailyBriefingOpen(false);
        }}
        onOpenPos={() => {
          setIsDailyBriefingOpen(false);
          onOpenPos();
        }}
      />

      {/* Headquarter Direct Messages & Notices Modal */}
      <ShopMessagesModal
        isOpen={isShopMessagesOpen}
        onClose={() => setIsShopMessagesOpen(false)}
      />

      {/* Shop Backup Data Studio Modal (Current Shop Scoped) */}
      <ShopBackupStudio
        isOpen={isBackupStudioOpen}
        isModal={true}
        onClose={() => setIsBackupStudioOpen(false)}
      />

      {/* System Updates & Code Modification Studio Modal */}
      <SystemUpdatesStudio
        isOpen={isUpdatesStudioOpen}
        onClose={() => setIsUpdatesStudioOpen(false)}
      />

      {/* Full Tenant & Portal Directory Modal */}
      {isTenantModalOpen && (
        <TenantPortalPanel
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
        />
      )}

      {/* Super Admin Login / Gate Modal */}
      <SuperAdminLoginModal
        isOpen={isSuperAdminLoginOpen}
        onClose={() => setIsSuperAdminLoginOpen(false)}
        onOpenPasswordStudio={() => setIsSuperAdminPasswordOpen(true)}
        onSuccess={() => setCurrentTenantId('SUPER_ADMIN')}
      />

      {/* Super Admin Password Studio Modal */}
      <SuperAdminPasswordModal
        isOpen={isSuperAdminPasswordOpen}
        onClose={() => setIsSuperAdminPasswordOpen(false)}
      />

      {/* Multi-Tenant Auth Gate & Activation Modal */}
      <MultiTenantAuthGate
        isOpen={isAuthGateOpen}
        onClose={() => setIsAuthGateOpen(false)}
        onPostLoginAction={(destination) => {
          setIsAuthGateOpen(false);
          if (destination === 'POS') {
            if (onOpenPos) onOpenPos();
          } else if (destination === 'SALES') {
            setActiveView('SALES');
          } else if (destination === 'PRODUCTS') {
            setActiveView('PRODUCTS');
          } else {
            setActiveView('DASHBOARD');
          }
        }}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full text-slate-200 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Reset Database to Demo?
            </h3>
            <p className="text-xs text-slate-400">
              This will restore the original Sri Lankan business demo tenants, products, custom fields, and transactions.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToDemoData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 font-bold text-white rounded-lg cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Computer Cloud Synchronization Control Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-indigo-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Multi-Computer Real-Time Cloud Sync</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        cloudSyncStatus === 'connected'
                          ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                          : cloudSyncStatus === 'syncing'
                          ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300'
                          : 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                      }`}
                    >
                      {cloudSyncStatus === 'connected'
                        ? '● Online'
                        : cloudSyncStatus === 'syncing'
                        ? '● Syncing'
                        : '● Offline'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Centralized database keeps all shops and devices 100% synchronized
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sync KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Clients</div>
                <div className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <Laptop className="w-4 h-4" />
                  <span>{connectedClientsCount} {connectedClientsCount === 1 ? 'Device' : 'Devices'}</span>
                </div>
                <div className="text-[9px] text-slate-500">Connected</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Cloud Version</div>
                <div className="text-lg font-bold text-indigo-300 font-mono mt-0.5">
                  #{cloudVersion || 1}
                </div>
                <div className="text-[9px] text-slate-500">Database Revision</div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Synced</div>
                <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                  {lastCloudSync || 'Active now'}
                </div>
                <div className="text-[9px] text-emerald-400/80">Auto-push active</div>
              </div>
            </div>

            {/* Share / Open on Other Computers */}
            <div className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span>Open This Shop on Other Computers</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isSuperAdminMode ? 'SUPER_ADMIN' : currentTenantId}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Copy and open this link in the web browser on any other computer, laptop, or cashier terminal.
                All recorded sales, purchases, and customer balances synchronize back to this Super Admin portal in real time.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}${isSuperAdminMode ? '' : `?tenant=${currentTenantId}`}`
                      : ''
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-hidden select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = typeof window !== 'undefined'
                      ? `${window.location.origin}${isSuperAdminMode ? '' : `?tenant=${currentTenantId}`}`
                      : '';
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url);
                      setCopiedCloudUrl(true);
                      setTimeout(() => setCopiedCloudUrl(false), 2500);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm ${
                    copiedCloudUrl
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {copiedCloudUrl ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sync Actions & Manual Refresh */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isManualSyncing}
                onClick={async () => {
                  setIsManualSyncing(true);
                  await forceCloudSync();
                  setTimeout(() => setIsManualSyncing(false), 600);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Synchronizing...' : 'Force Sync Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCloudModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
