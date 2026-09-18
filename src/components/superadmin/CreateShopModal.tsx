import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { BusinessType } from '../../types';
import {
  Building2,
  X,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Zap,
  Store,
  ArrowRight,
  Infinity as InfinityIcon,
  Check,
  Pin,
  Copy,
  ExternalLink,
  Award,
  FileText,
  Printer,
  Laptop,
  Key,
  KeyRound,
} from 'lucide-react';
import { LicenseCertificateModal } from './LicenseCertificateModal';
import { DeployShopRemoteModal } from './DeployShopRemoteModal';

interface CreateShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    generateLicense,
    activateShopWithLicense,
    batchCreateShops,
    allTenants,
    allLicenses,
    getShopDirectUrl,
    copyShopDirectUrl,
    openShopInAddressBar,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single shop state
  const [shopName, setShopName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('grocery');
  const [address, setAddress] = useState('Colombo, Sri Lanka');
  const [phone, setPhone] = useState('+94 11 234 5678');
  const [email, setEmail] = useState('');
  const [brNumber, setBrNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [packageTier, setPackageTier] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [durationMonths, setDurationMonths] = useState<1 | 3 | 6 | 12>(12);

  // Owner credentials
  const [ownerFullName, setOwnerFullName] = useState('Shop Owner');
  const [ownerUsername, setOwnerUsername] = useState('owner');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  // Batch shop state
  const [batchCount, setBatchCount] = useState<number>(3);
  const [batchBaseName, setBatchBaseName] = useState<string>('Express Retail Hub');
  const [batchBusinessType, setBatchBusinessType] = useState<BusinessType>('grocery');
  const [batchTier, setBatchTier] = useState<'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL');
  const [batchDurationMonths, setBatchDurationMonths] = useState<1 | 3 | 6 | 12>(12);
  const [batchCity, setBatchCity] = useState<string>('Colombo');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);

  // Success summary state for address bar open & pin tag
  const [createdShopData, setCreatedShopData] = useState<{
    tenantId: string;
    shopName: string;
    directUrl: string;
    licenseKey: string;
    durationTag: string;
    validUntil: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSingleSubmit = (keepOpenAfter: boolean = false) => {
    setErrorMsg(null);
    if (!shopName.trim()) {
      setErrorMsg('Please enter a shop name.');
      return;
    }

    // Auto-generate license key with requested duration and unlimited product capacity
    const newLic = generateLicense({
      tier: packageTier,
      clientName: shopName.trim(),
      clientContact: phone.trim(),
      durationMonths: durationMonths,
      maxProducts: 999999, // Unlimited products
      notes: `Valid ${durationMonths}M license provisioned for ${shopName.trim()}`,
    });

    const res = activateShopWithLicense(
      newLic.license_key,
      {
        shop_name: shopName.trim(),
        company_name: companyName.trim() || `${shopName.trim()} (Pvt) Ltd`,
        business_type: businessType,
        address,
        phone,
        email: email || `owner@${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}.lk`,
        br_number: brNumber || `PV-${Math.floor(10000 + Math.random() * 90000)}`,
        vat_number: vatNumber || `VAT-${Math.floor(100000000 + Math.random() * 900000000)}`,
        currency: 'LKR',
        currency_symbol: 'Rs.',
      },
      {
        fullName: ownerFullName.trim() || 'Store Owner',
        username: ownerUsername.trim() || 'owner',
        email: email || `owner@${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}.lk`,
        password: ownerPassword.trim() || 'owner123',
        pin_code: ownerPin.trim() || '1234',
        role: 'OWNER',
      }
    );

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    const createdTenantId = (res as any).tenant?.tenant_id || (res as any).tenant_id || `SHOP${String(allTenants.length + 1).padStart(3, '0')}`;
    const directUrl = getShopDirectUrl(createdTenantId);
    const durationTag = durationMonths === 1 ? '01M' : durationMonths === 3 ? '03M' : durationMonths === 6 ? '06M' : '12M';

    setCreatedShopData({
      tenantId: createdTenantId,
      shopName: shopName.trim(),
      directUrl,
      licenseKey: newLic.license_key,
      durationTag,
      validUntil: newLic.valid_until,
    });

    setSuccessMsg(`Shop "${shopName}" provisioned with ${durationTag} Valid License & Unlimited Catalog capacity!`);
    
    if (keepOpenAfter) {
      // Reset form to easily provision another shop
      setShopName('');
      setCompanyName('');
      setOwnerUsername('');
    }
  };

  const handleBatchSubmit = () => {
    setErrorMsg(null);
    if (!batchBaseName.trim()) {
      setErrorMsg('Please specify a base name for the shops.');
      return;
    }

    const count = Math.min(Math.max(1, batchCount), 50);
    const shopsToMake = Array.from({ length: count }, (_, i) => {
      const branchIndex = i + 1;
      const cleanName = `${batchBaseName.trim()} - Branch ${branchIndex}`;
      const prefix = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
      return {
        shop_name: cleanName,
        company_name: `${batchBaseName.trim()} Network (Pvt) Ltd`,
        business_type: batchBusinessType,
        package_tier: batchTier,
        duration_months: batchDurationMonths,
        address: `${branchIndex * 12}, Main Road, ${batchCity}`,
        phone: `+94 11 ${2000000 + branchIndex * 100}`,
        email: `branch${branchIndex}@${prefix}.lk`,
        owner_full_name: `${cleanName} Administrator`,
        owner_username: `${prefix}_admin${branchIndex}`,
        owner_password: '',
        owner_pin: '',
      };
    });

    const res = batchCreateShops(shopsToMake);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    const batchTag = batchDurationMonths === 1 ? '01M' : batchDurationMonths === 3 ? '03M' : batchDurationMonths === 6 ? '06M' : '12M';
    setSuccessMsg(`Success! ${res.count} stores provisioned simultaneously with ${batchTag} Valid Licenses & Unlimited capacity.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const businessTypes: {
    id: BusinessType;
    label: string;
    desc: string;
    icon: string;
    defaultName: string;
    defaultCompany: string;
    defaultAddress: string;
  }[] = [
    {
      id: 'computer_shop',
      label: 'Computer & Laptop Repair Shop',
      desc: 'PC/Laptop specs, RAM/SSD options, warranty periods & chip repair tickets',
      icon: '💻',
      defaultName: 'TechCore Computer & Laptop Care',
      defaultCompany: 'TechCore Solutions (Pvt) Ltd',
      defaultAddress: 'Shop #18, 2nd Floor, Unity Plaza, Colombo 04',
    },
    {
      id: 'phone_shop',
      label: 'Mobile Phone & Repair Shop',
      desc: 'Smartphones, IMEI tracking, warranty terms, screen/battery repair jobs',
      icon: '📱',
      defaultName: 'CellSmart Mobile & Repair Center',
      defaultCompany: 'CellSmart Mobile Care (Pvt) Ltd',
      defaultAddress: 'Shop #08, 1st Floor, Majestic City, Colombo 04',
    },
    {
      id: 'grocery',
      label: 'Grocery & Supermarket',
      desc: 'Weight scales, barcode items, fast cash register & expiry checks',
      icon: '🛒',
      defaultName: 'City Fresh Supermarket',
      defaultCompany: 'City Fresh Groceries (Pvt) Ltd',
      defaultAddress: 'No. 110 Galle Road, Colombo 03',
    },
    {
      id: 'motor_parts',
      label: 'Motor Spare Parts',
      desc: 'Vehicle brand/model, OEM numbers, part compatibility & lubricants',
      icon: '🚗',
      defaultName: 'SpeedWay Auto Spare Parts',
      defaultCompany: 'SpeedWay Spares & Engineering (Pvt) Ltd',
      defaultAddress: '88 Panchikawatte Road, Colombo 10',
    },
    {
      id: 'restaurant',
      label: 'Restaurant, Cafe & Dining',
      desc: 'Dine-in tables, KOT tickets, kitchen printers, takeaway & delivery options',
      icon: '🍽️',
      defaultName: 'Urban Spice Bistro & Cafe',
      defaultCompany: 'Urban Spice Foods (Pvt) Ltd',
      defaultAddress: '24 Park Street, Colombo 02',
    },
    {
      id: 'hotel',
      label: 'Hotel & Resort / Hospitality',
      desc: 'Guest rooms, room service, dining tables, KOT print, takeaway, delivery & billing',
      icon: '🏨',
      defaultName: 'Grand Horizon Hotel & Restaurant',
      defaultCompany: 'Grand Horizon Hospitality Lanka (Pvt) Ltd',
      defaultAddress: '45 Galle Face Terrace, Colombo 03',
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy & Medical',
      desc: 'Batch tracking, expiry dates, NMRA prescription drugs, dosage strength',
      icon: '💊',
      defaultName: 'CarePlus Family Pharmacy',
      defaultCompany: 'CarePlus Pharmaceuticals Ltd',
      defaultAddress: '15 High Level Road, Maharagama',
    },
    {
      id: 'vehicle_service',
      label: 'Vehicle Service Station',
      desc: 'Job cards, vehicle number plates, lube service, mechanic inspection logs',
      icon: '🔧',
      defaultName: 'AutoCare Express Service Hub',
      defaultCompany: 'AutoCare Service Stations (Pvt) Ltd',
      defaultAddress: '320 Baseline Road, Dematagoda',
    },
    {
      id: 'wholesale',
      label: 'Wholesale & Distribution',
      desc: 'Bulk carton packaging, customer credit ledger, MOQs',
      icon: '📦',
      defaultName: 'Lanka Wholesale Traders',
      defaultCompany: 'Lanka Wholesale Distributions (Pvt) Ltd',
      defaultAddress: '95 4th Cross Street, Pettah, Colombo 11',
    },
    {
      id: 'hardware_shop',
      label: 'Hardware & Building Materials',
      desc: 'Steel, cement, PVC pipes, cut gauge lengths, contractor credit',
      icon: '🏗️',
      defaultName: 'BuildMax Hardware & Steel',
      defaultCompany: 'BuildMax Construction Materials Ltd',
      defaultAddress: '140 Nawala Road, Nugegoda',
    },
    {
      id: 'retail_clothing',
      label: 'Clothing & Fashion',
      desc: 'Size, color, brand variants, barcode price tags',
      icon: '👕',
      defaultName: 'TrendSetters Fashion Studio',
      defaultCompany: 'TrendSetters Apparel Lanka (Pvt) Ltd',
      defaultAddress: '55 Duplication Road, Colombo 04',
    },
    {
      id: 'general',
      label: 'General Retail Store',
      desc: 'Standard retail, electronics, stationery, gift items',
      icon: '🏪',
      defaultName: 'Universal Retail Mart',
      defaultCompany: 'Universal Trading (Pvt) Ltd',
      defaultAddress: '72 Main Street, Negombo',
    },
  ];

  const handleSelectPreset = (preset: (typeof businessTypes)[0]) => {
    setBusinessType(preset.id);
    if (!shopName || businessTypes.some((b) => b.defaultName === shopName)) {
      setShopName(preset.defaultName);
      setCompanyName(preset.defaultCompany);
      setAddress(preset.defaultAddress);
      setOwnerUsername(preset.defaultName.toLowerCase().split(' ')[0] + '_admin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Provision Customer Retail Store</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3" />
                  Unlimited Scale
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Provision single stores or batch-generate unlimited retail locations with isolated databases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('SINGLE')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'SINGLE'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Single Store Provisioning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BATCH')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'BATCH'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Batch Multi-Store Generator (1-Click Unlimited)</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Successfully Created Shop: Browser Address Bar Open & Pin URL Card */}
        {createdShopData && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-indigo-950/90 via-purple-950/80 to-slate-900 border border-indigo-500/60 rounded-2xl space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Store Successfully Created & Licensed!</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                  {createdShopData.durationTag} Key Active
                </span>
                <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/50">
                  {createdShopData.tenantId}
                </span>
              </div>
            </div>

            {/* License Key Badge */}
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-900/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400 text-[11px]">Valid Key:</span>
                <span className="font-mono font-bold text-emerald-300">{createdShopData.licenseKey}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Expires: <strong className="text-white">{new Date(createdShopData.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">{createdShopData.shopName}</span>
                <span className="text-[10px] text-indigo-300 flex items-center gap-1">
                  <Pin className="w-3 h-3 text-indigo-400" />
                  <span>Browser Address Bar Tag: <strong className="font-mono text-white">?shop={createdShopData.tenantId}</strong></span>
                </span>
              </div>

              <div className="bg-slate-950/90 rounded-xl p-2.5 font-mono text-[11px] text-indigo-200 break-all border border-indigo-800/60 flex items-center justify-between gap-2">
                <span className="truncate">{createdShopData.directUrl}</span>
                <button
                  type="button"
                  onClick={() => {
                    copyShopDirectUrl(createdShopData.tenantId);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="shrink-0 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-indigo-900/60">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsCertificateOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 hover:text-amber-200 border border-amber-500/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>View & Print License Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedShopData(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                >
                  + Create Another Shop
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Done (Back to Super Admin)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {successMsg && !createdShopData && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        {activeTab === 'SINGLE' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSingleSubmit(false);
            }}
            className="p-6 space-y-5 text-xs overflow-y-auto flex-1"
          >
            {/* Step 1: Package Tier & Subscription */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-200 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>1. Cloud Package Tier:</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3" />
                  Unlimited Products & SKUs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'STARTER', label: 'Starter Tier', branches: '1 Branch', users: '3 Users' },
                  { id: 'PROFESSIONAL', label: 'Professional Tier', branches: '3 Branches', users: '8 Users' },
                  { id: 'ENTERPRISE', label: 'Enterprise Cloud', branches: '10 Branches', users: '25 Users' },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setPackageTier(tier.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      packageTier === tier.id
                        ? 'border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/30'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-200 text-xs">{tier.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{tier.branches} • {tier.users}</div>
                    <div className="text-[10px] text-purple-300 font-semibold mt-0.5">Unlimited Catalog</div>
                  </div>
                ))}
              </div>
            </div>

            {/* License Validity Duration Selection (01M, 03M, 06M, 12M) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                  2. Select License Validity Term & Key Expiry:
                </label>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-400" />
                  Key Tag: {durationMonths === 1 ? '01M' : durationMonths === 3 ? '03M' : durationMonths === 6 ? '06M' : '12M'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { months: 1, tag: '01M', label: '01 Month', desc: '30 Days Term', badge: 'Monthly' },
                  { months: 3, tag: '03M', label: '03 Months', desc: '90 Days Term', badge: 'Quarterly' },
                  { months: 6, tag: '06M', label: '06 Months', desc: '180 Days Term', badge: 'Half-Year' },
                  { months: 12, tag: '12M', label: '12 Months', desc: '365 Days Term', badge: 'Annual' },
                ].map((dur) => {
                  const isSelected = durationMonths === dur.months;
                  const expDate = new Date();
                  expDate.setMonth(expDate.getMonth() + dur.months);
                  return (
                    <div
                      key={dur.months}
                      onClick={() => setDurationMonths(dur.months as any)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/40 text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-100">{dur.label}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {dur.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{dur.desc}</div>
                      <div className="text-[9px] text-indigo-300 font-mono mt-1">
                        Until {expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Business Model Presets */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2 uppercase text-[11px] tracking-wider">
                3. Select Business Archetype & Template:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {businessTypes.map((bt) => (
                  <div
                    key={bt.id}
                    onClick={() => handleSelectPreset(bt)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      businessType === bt.id
                        ? 'border-indigo-500 bg-indigo-950/50 shadow-md ring-2 ring-indigo-500/40'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-950/70'
                    }`}
                  >
                    <span className="text-xl shrink-0">{bt.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{bt.label}</h4>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{bt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Shop / Store Name: *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (!ownerUsername || ownerUsername === 'owner') {
                      setOwnerUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') + '_admin');
                    }
                  }}
                  placeholder="e.g. Royal Fresh Mart"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Registered Company Legal Name:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Royal Fresh Enterprises (Pvt) Ltd"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Address & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Address / City:
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 102 High Level Road, Nugegoda"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Telephone:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 11 234 5678"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Initial Admin / Owner Account Credentials */}
            <div className="bg-slate-950/70 border border-indigo-900/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <label className="text-slate-200 font-bold uppercase text-[11px] tracking-wider">
                  3. Primary Store Admin / Owner Login Credentials:
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                    placeholder="e.g. Bandara Jayasuriya"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={ownerUsername}
                    onChange={(e) => setOwnerUsername(e.target.value)}
                    placeholder="e.g. bandara_owner"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Login Password (Optional)</label>
                  <input
                    type="text"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Optional (leave blank for no password)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">POS PIN Code (Optional)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={ownerPin}
                    onChange={(e) => setOwnerPin(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 font-mono tracking-widest text-center"
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400">
                Total Stores In Fleet: <strong className="text-slate-200 font-mono">{allTenants.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSingleSubmit(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 rounded-xl font-semibold cursor-pointer border border-indigo-500/30 transition-all text-xs"
                >
                  Provision & Create Another
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Shop</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* BATCH MULTI-STORE GENERATOR */
          <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
            <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-200">
                  Instant Multi-Store Chain Generator
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Generate 2 to 50 retail store locations in 1 single click. Every branch automatically receives an isolated database, unique tenant ID, active unlimited cloud license, and pre-configured store owner credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Number of Stores to Provision:
                </label>
                <div className="flex items-center gap-2">
                  {[3, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBatchCount(num)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        batchCount === num
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num} Stores
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-200 text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Chain / Brand Base Name:
                </label>
                <input
                  type="text"
                  value={batchBaseName}
                  onChange={(e) => setBatchBaseName(e.target.value)}
                  placeholder="e.g. Royal Fresh Mart"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Business Archetype:
                </label>
                <select
                  value={batchBusinessType}
                  onChange={(e) => setBatchBusinessType(e.target.value as BusinessType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-purple-500"
                >
                  {businessTypes.map((bt) => (
                    <option key={bt.id} value={bt.id}>
                      {bt.icon} {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Package Tier:
                </label>
                <select
                  value={batchTier}
                  onChange={(e) => setBatchTier(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-purple-500"
                >
                  <option value="STARTER">Starter Tier (Unlimited SKUs)</option>
                  <option value="PROFESSIONAL">Professional Tier (Unlimited SKUs)</option>
                  <option value="ENTERPRISE">Enterprise Cloud (Unlimited SKUs)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  License Validity Term:
                </label>
                <select
                  value={batchDurationMonths}
                  onChange={(e) => setBatchDurationMonths(Number(e.target.value) as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-purple-500"
                >
                  <option value={1}>01 Month (30 Days - Monthly Term)</option>
                  <option value={3}>03 Months (90 Days - Quarterly Term)</option>
                  <option value={6}>06 Months (180 Days - Half-Year Term)</option>
                  <option value={12}>12 Months (365 Days - 1 Year Annual Term)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-[11px] uppercase">
                  Base City / Region:
                </label>
                <input
                  type="text"
                  value={batchCity}
                  onChange={(e) => setBatchCity(e.target.value)}
                  placeholder="e.g. Colombo / Kandy"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Generated Preview Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Live Preview of Batch Generation:
              </span>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300 max-h-32 overflow-y-auto pr-1">
                {Array.from({ length: Math.min(batchCount, 5) }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className="text-indigo-400 font-semibold">{batchBaseName} - Branch {i + 1}</span>
                    <span className="text-slate-400 text-[10px]">User: {batchBaseName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)}_admin{i + 1}</span>
                    <span className="text-emerald-400 text-[10px]">∞ Unlimited</span>
                  </div>
                ))}
                {batchCount > 5 && (
                  <div className="text-slate-500 text-[10px] text-center pt-1">
                    ... and {batchCount - 5} more stores will be provisioned
                  </div>
                )}
              </div>
            </div>

            {/* Batch Action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Instant Generate {batchCount} Unlimited Stores</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official License Certificate Modal */}
      {isCertificateOpen && createdShopData && (
        <LicenseCertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          tenant={
            allTenants.find((t) => t.tenant_id === createdShopData.tenantId) || ({
              tenant_id: createdShopData.tenantId,
              shop_name: createdShopData.shopName,
              company_name: companyName || `${createdShopData.shopName} (Pvt) Ltd`,
              business_type: businessType,
              address: address,
              phone: phone,
              email: email,
              br_number: brNumber,
              vat_number: vatNumber,
              branch_name: 'Main Branch',
            } as any)
          }
          license={allLicenses?.[createdShopData.tenantId]}
        />
      )}

      {/* Deploy to Remote PC Modal */}
      {isDeployModalOpen && createdShopData && (
        <DeployShopRemoteModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          initialTenantId={createdShopData.tenantId}
        />
      )}
    </div>
  );
};
