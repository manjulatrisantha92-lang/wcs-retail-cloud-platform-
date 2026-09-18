import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { TenantLicense } from '../../types';
import {
  Key,
  PlusCircle,
  X,
  Check,
  Copy,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Sparkles,
  Search,
  ExternalLink,
  Store,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface LicenseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLicenseForShop?: (license: TenantLicense) => void;
}

export const LicenseGeneratorModal: React.FC<LicenseGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectLicenseForShop,
}) => {
  const { allLicensesList, generateLicense, allTenants } = useRetail();

  const [activeTab, setActiveTab] = useState<'LIST' | 'GENERATE'>('LIST');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNASSIGNED' | 'PROVISIONED'>('ALL');

  // Generator form state
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [tier, setTier] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [customKey, setCustomKey] = useState('');
  const [maxBranches, setMaxBranches] = useState<number>(3);
  const [maxUsers, setMaxUsers] = useState<number>(8);
  const [maxProducts, setMaxProducts] = useState<number>(999999);
  const [isUnlimitedProducts, setIsUnlimitedProducts] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [generatedResult, setGeneratedResult] = useState<TenantLicense | null>(null);

  if (!isOpen) return null;

  const handleTierChange = (newTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    setTier(newTier);
    if (newTier === 'STARTER') {
      setMaxBranches(1);
      setMaxUsers(3);
      setMaxProducts(999999);
    } else if (newTier === 'PROFESSIONAL') {
      setMaxBranches(3);
      setMaxUsers(8);
      setMaxProducts(999999);
    } else if (newTier === 'ENTERPRISE') {
      setMaxBranches(10);
      setMaxUsers(25);
      setMaxProducts(999999);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newLic = generateLicense({
      tier,
      clientName: clientName.trim(),
      clientContact: clientContact.trim(),
      customKey: customKey.trim() || undefined,
      durationMonths,
      maxBranches,
      maxUsers,
      maxProducts: isUnlimitedProducts ? 999999 : maxProducts,
      notes: notes.trim() || `License issued for ${clientName.trim()}`,
    });

    setGeneratedResult(newLic);
    setClientName('');
    setClientContact('');
    setCustomKey('');
    setNotes('');
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredLicenses = (allLicensesList || []).filter((lic) => {
    if (!lic) return false;
    const q = searchQuery.toLowerCase();
    const keyMatch = lic.license_key?.toLowerCase().includes(q);
    const clientMatch = lic.issued_to_client?.toLowerCase().includes(q);
    const shopMatch = lic.assigned_shop_name?.toLowerCase().includes(q) || lic.tenant_id?.toLowerCase().includes(q);

    const matchesSearch = !q || keyMatch || clientMatch || shopMatch;
    const matchesTier = filterTier === 'ALL' || lic.package_tier === filterTier;
    const isProv = lic.is_provisioned && lic.tenant_id && lic.tenant_id !== 'UNASSIGNED';
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'UNASSIGNED' && !isProv) ||
      (filterStatus === 'PROVISIONED' && isProv);

    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">WCS License Generator & Registry</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                  Super Admin HQ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate separate cryptographic licenses for customer retail stores with custom tiers and quotas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => {
                  setActiveTab('LIST');
                  setGeneratedResult(null);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'LIST'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                License Registry ({allLicensesList?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('GENERATE')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'GENERATE'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Issue New License</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'GENERATE' ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {generatedResult ? (
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-200">
                      New Customer License Generated Successfully!
                    </h3>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      Issued to <strong className="text-white">{generatedResult.issued_to_client}</strong> ({generatedResult.package_tier} Tier)
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="text-left font-mono">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
                        License Activation Key:
                      </div>
                      <div className="text-sm font-bold text-purple-300 tracking-wider">
                        {generatedResult.license_key}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(generatedResult.license_key)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                    >
                      {copiedKey === generatedResult.license_key ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {onSelectLicenseForShop && (
                      <button
                        onClick={() => {
                          onSelectLicenseForShop(generatedResult);
                          onClose();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Store className="w-4 h-4" />
                        <span>Provision Customer Shop with this License Now</span>
                      </button>
                    )}
                    <button
                      onClick={() => setGeneratedResult(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Issue Another License
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerate} className="space-y-5 text-xs">
                  {/* Tier Selection */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-2 uppercase text-[11px] tracking-wider">
                      1. Select License Subscription Tier:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {
                          id: 'STARTER',
                          name: 'Starter Tier',
                          desc: '1 Branch • 3 Users • 1,500 Items',
                          badge: 'Basic Retail',
                          color: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
                          activeColor: 'border-blue-500 bg-blue-950/70 ring-2 ring-blue-500/40 text-blue-200',
                        },
                        {
                          id: 'PROFESSIONAL',
                          name: 'Professional Tier',
                          desc: '3 Branches • 8 Users • 5,000 Items',
                          badge: 'Most Popular',
                          color: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
                          activeColor: 'border-purple-500 bg-purple-950/70 ring-2 ring-purple-500/40 text-purple-200',
                        },
                        {
                          id: 'ENTERPRISE',
                          name: 'Enterprise Cloud',
                          desc: '10 Branches • 25 Users • 25,000 Items',
                          badge: 'Supermarket / Chain',
                          color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
                          activeColor: 'border-amber-500 bg-amber-950/70 ring-2 ring-amber-500/40 text-amber-200',
                        },
                      ].map((t) => (
                        <div
                          key={t.id}
                          onClick={() => handleTierChange(t.id as any)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            tier === t.id ? t.activeColor : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{t.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                                {t.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{t.desc}</p>
                          </div>
                          {tier === t.id && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-purple-400">
                              <Check className="w-3 h-3" /> Selected Tier
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Issued To Client / Business Name: *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Nawaloka Supermarket & Pharmacy"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Client Phone / Contact:
                      </label>
                      <input
                        type="text"
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        placeholder="e.g. +94 77 123 4567"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Duration & Custom Key */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        License Validity Duration:
                      </label>
                      <select
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500 cursor-pointer"
                      >
                        <option value={1}>1 Month (Trial Evaluation)</option>
                        <option value={3}>3 Months (Quarterly)</option>
                        <option value={6}>6 Months (Half-Yearly)</option>
                        <option value={12}>1 Year (Annual Standard)</option>
                        <option value={24}>2 Years (Biannual Enterprise)</option>
                        <option value={36}>3 Years (Long-Term Partner)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                        Custom License Key (Optional):
                      </label>
                      <input
                        type="text"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                        placeholder="Leave blank for auto-generated key"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Quota Limits */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Tenant Quotas & Limits:
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Max Branches</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={maxBranches}
                          onChange={(e) => setMaxBranches(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-1">Max Staff Users</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={maxUsers}
                          onChange={(e) => setMaxUsers(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-slate-400 text-[10px]">Product Catalog Limit</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUnlimitedProducts(!isUnlimitedProducts);
                              if (!isUnlimitedProducts) setMaxProducts(999999);
                            }}
                            className="text-[9px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                          >
                            {isUnlimitedProducts ? 'Custom Limit' : 'Set Unlimited'}
                          </button>
                        </div>
                        {isUnlimitedProducts ? (
                          <div className="w-full bg-purple-950/60 border border-purple-600/40 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-semibold flex items-center justify-between">
                            <span>Unlimited Products</span>
                            <span className="text-[10px] bg-purple-900/80 px-1.5 py-0.5 rounded text-purple-200">∞ SKUs</span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min={100}
                            max={1000000}
                            step={500}
                            value={maxProducts}
                            onChange={(e) => setMaxProducts(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                      Internal Admin Notes:
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Settle balance on invoice #INV-2026-90"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('LIST')}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Customer License Key</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by license key, client name, or shop ID..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Tiers</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UNASSIGNED">Ready for Activation (Unassigned)</option>
                    <option value="PROVISIONED">Provisioned to Active Shop</option>
                  </select>
                </div>
              </div>

              {/* License Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredLicenses.map((lic) => {
                  const isProvisioned = Boolean(lic.is_provisioned && lic.tenant_id && lic.tenant_id !== 'UNASSIGNED');
                  const assignedShop = allTenants.find((t) => t.tenant_id === lic.tenant_id);

                  return (
                    <div
                      key={lic.license_key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isProvisioned
                          ? 'border-slate-800 bg-slate-950/60'
                          : 'border-purple-500/40 bg-purple-950/20 shadow-md ring-1 ring-purple-500/20'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  lic.package_tier === 'ENTERPRISE'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                                    : lic.package_tier === 'PROFESSIONAL'
                                    ? 'bg-purple-950/80 text-purple-300 border border-purple-600/40'
                                    : 'bg-blue-950/80 text-blue-300 border border-blue-600/40'
                                }`}
                              >
                                {lic.package_tier}
                              </span>

                              {isProvisioned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PROVISIONED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500 animate-pulse">
                                  <Sparkles className="w-3 h-3" />
                                  READY FOR ACTIVATION
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-100 mt-1">
                              {lic.issued_to_client || lic.assigned_shop_name || 'Customer License'}
                            </h4>
                            {lic.client_contact && (
                              <p className="text-[10px] text-slate-400">{lic.client_contact}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleCopy(lic.license_key)}
                            title="Copy License Key"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {copiedKey === lic.license_key ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Key Box */}
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-[11px] text-purple-300 flex items-center justify-between">
                          <span className="font-semibold">{lic.license_key}</span>
                          <span className="text-[9px] font-sans text-slate-500">
                            Valid: {new Date(lic.valid_until).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-xl border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Branches</span>
                            <span className="font-semibold text-slate-300">{lic.max_branches} Store(s)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Users</span>
                            <span className="font-semibold text-slate-300">{lic.max_users} Staff</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Products</span>
                            <span className="font-semibold text-slate-300">
                              {lic.max_products >= 50000 || !lic.max_products ? 'Unlimited' : `${lic.max_products.toLocaleString()} SKUs`}
                            </span>
                          </div>
                        </div>

                        {isProvisioned && assignedShop && (
                          <div className="text-[10px] text-slate-300 bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-xl flex items-center gap-2">
                            <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              Active in: <strong className="text-emerald-200">{assignedShop.shop_name}</strong> ({assignedShop.tenant_id})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      {!isProvisioned && onSelectLicenseForShop && (
                        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-purple-300">Unused license token</span>
                          <button
                            onClick={() => {
                              onSelectLicenseForShop(lic);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <span>Provision Shop</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredLicenses.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Key className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">No licenses found matching your filters.</p>
                  <button
                    onClick={() => setActiveTab('GENERATE')}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Generate a New License
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Total Registry: <strong>{allLicensesList?.length || 0}</strong> licenses (
            {allLicensesList?.filter((l) => !l.is_provisioned || l.tenant_id === 'UNASSIGNED').length || 0} unassigned)
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
