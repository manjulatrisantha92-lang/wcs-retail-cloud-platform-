import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  Store,
  Printer,
  Image,
  Upload,
  CheckCircle2,
  Radio,
  Save,
  Trash2,
  Sparkles,
  FileSpreadsheet,
  UtensilsCrossed,
  Award,
  UserCheck,
  Code,
  Terminal,
  Database,
  Download,
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Key,
  Calendar,
} from 'lucide-react';
import { SystemUpdatesStudio } from '../superadmin/SystemUpdatesStudio';
import { ShopBackupStudio } from '../common/ShopBackupStudio';
import { RenewLicenseKeyModal } from './RenewLicenseKeyModal';
import { SuperAdminLoginModal } from '../superadmin/SuperAdminLoginModal';

export const ShopSettingsStudio: React.FC = () => {
  const {
    currentTenant,
    currentTenantId,
    currentLicense,
    currentSettings,
    products,
    customers,
    categories,
    sales,
    expenses,
    exportShopDatabaseJson,
    updateSettings,
    updateTenantDetails,
    updateTenantModules,
    deleteTenantShop,
    setCurrentTenantId,
  } = useRetail();

  const [isUpdatesStudioOpen, setIsUpdatesStudioOpen] = useState(false);
  const [isBackupStudioOpen, setIsBackupStudioOpen] = useState(false);
  const [isRenewKeyModalOpen, setIsRenewKeyModalOpen] = useState(false);
  const [isSuperAdminLoginOpen, setIsSuperAdminLoginOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  const [shopName, setShopName] = useState(currentTenant?.shop_name || '');
  const [companyName, setCompanyName] = useState(currentTenant?.company_name || '');
  const [address, setAddress] = useState(currentTenant?.address || '');
  const [phone, setPhone] = useState(currentTenant?.phone || '');
  const [email, setEmail] = useState(currentTenant?.email || '');
  const [brNumber, setBrNumber] = useState(currentTenant?.br_number || '');
  const [vatNumber, setVatNumber] = useState(currentTenant?.vat_number || '');
  const [logoUrl, setLogoUrl] = useState(currentTenant?.logo_url || '');

  // Settings
  const [receiptHeader, setReceiptHeader] = useState(
    currentSettings?.invoice_header || 'Welcome to our store - Quality Guaranteed!'
  );
  const [receiptFooter, setReceiptFooter] = useState(
    currentSettings?.invoice_footer || 'Items once sold can be exchanged within 7 days with original receipt.'
  );
  const [thankYouMsg, setThankYouMsg] = useState(
    currentSettings?.thank_you_message || 'Thank you for shopping with us! Visit again.'
  );
  const [defaultReceiptFormat, setDefaultReceiptFormat] = useState<'80mm' | '58mm' | 'a4'>(
    (currentSettings?.default_receipt_type as any) || '80mm'
  );
  const [showLogoOnBill, setShowLogoOnBill] = useState<boolean>(
    currentSettings?.show_logo_on_bill ?? true
  );
  const [showAssociateOnBill, setShowAssociateOnBill] = useState<boolean>(
    currentSettings?.show_associate_on_bill ?? true
  );
  const [associateTitleLabel, setAssociateTitleLabel] = useState<string>(
    currentSettings?.associate_title_label || 'Sales Associate'
  );
  const [showLogoOnReports, setShowLogoOnReports] = useState<boolean>(true);
  const [taxPercentage, setTaxPercentage] = useState<number>(
    currentSettings?.default_tax_rate || 0
  );
  const [enableRestaurantKot, setEnableRestaurantKot] = useState<boolean>(
    currentSettings?.enabled_modules?.restaurant_kot ?? false
  );
  const [showSavedToast, setShowSavedToast] = useState(false);

  // File Upload Handler for Logo JPG/PNG
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller image file.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setLogoUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    // Update Tenant Details
    updateTenantDetails({
      shop_name: shopName,
      company_name: companyName,
      address,
      phone,
      email,
      br_number: brNumber,
      vat_number: vatNumber,
      logo_url: logoUrl,
    });

    // Update Tenant Settings
    updateSettings({
      invoice_header: receiptHeader,
      invoice_footer: receiptFooter,
      thank_you_message: thankYouMsg,
      default_receipt_type: defaultReceiptFormat,
      show_logo_on_bill: showLogoOnBill,
      show_associate_on_bill: showAssociateOnBill,
      associate_title_label: associateTitleLabel,
      default_tax_rate: Number(taxPercentage),
    });

    // Update Modules (KOT etc.)
    updateTenantModules(currentTenantId, {
      restaurant_kot: enableRestaurantKot,
    });

    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const presetLogos = [
    { label: 'Supermarket Logo', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80' },
    { label: 'Auto Spares Hub', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80' },
    { label: 'Bistro & Restaurant', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80' },
    { label: 'Pharmacy Care', url: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=200&auto=format&fit=crop&q=80' },
    { label: 'Wholesale Trade', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Tenant Configuration
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Shop Profile, Brand Logo & Receipt Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Upload your shop logo (JPG/PNG), configure bill/receipt print headers & footers, tax rates, and reports branding.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {showSavedToast && (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved Successfully!</span>
            </div>
          )}

          {/* Optional Renew License Key Button */}
          <button
            type="button"
            onClick={() => setIsRenewKeyModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-500/40"
            title="Renew or extend your store license validity"
          >
            <KeyRound className="w-4 h-4 text-emerald-200" />
            <span>Renew License Key</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Section 1: Shop Logo & Branding */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4 text-indigo-600" />
              1. Shop Brand Logo (JPG / PNG for Bill Head & Reports)
            </h3>
            <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Used in Thermal Receipts & Report Headers
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Logo Upload & URL Box (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* File Upload Trigger */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Upload Logo File (JPG, PNG, WebP):
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center gap-2 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Choose JPG/PNG from Computer...</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports high-resolution JPG or PNG. Image will be automatically embedded in receipts and report headers.
                </p>
              </div>

              {/* Or Direct Image URL */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Or Paste Public Image URL:
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/shop-logo.jpg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
                />
              </div>

              {/* Preset Sample Logos */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Quick Presets for Testing:
                </span>
                <div className="flex flex-wrap gap-2">
                  {presetLogos.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLogoUrl(preset.url)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium border border-slate-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogoOnBill}
                    onChange={(e) => setShowLogoOnBill(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-slate-800 font-semibold">
                    Print Shop Logo at Top of Bills / Receipts (58mm, 80mm & A4)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogoOnReports}
                    onChange={(e) => setShowLogoOnReports(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-slate-800 font-semibold">
                    Include Shop Logo on Business Reports & Sales Analytics Headers
                  </span>
                </label>
              </div>
            </div>

            {/* Live Logo Preview Box (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Live Logo Bill & Report Preview
              </span>
              {logoUrl ? (
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs w-full max-w-[240px] flex flex-col items-center">
                  <img
                    src={logoUrl}
                    alt="Shop Logo"
                    className="h-14 max-w-full object-contain rounded-md mb-2"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as any).src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                    }}
                  />
                  <div className="text-[11px] font-bold text-slate-900 uppercase">{shopName || 'Your Shop Name'}</div>
                  <div className="text-[9px] text-slate-500 font-mono">{phone || 'Tel: +94 11 000 0000'}</div>
                  <div className="mt-2 text-[9px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    Active on Bill & Report Headers
                  </div>
                </div>
              ) : (
                <div className="py-8 text-slate-400 space-y-1">
                  <Image className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">No Logo Uploaded Yet</p>
                  <p className="text-[10px]">Select a file above or pick a sample preset</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Shop Profile Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-600" />
            2. Business Details & Tax Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Store / Trading Name:</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company / Legal Entity Name:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Address:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Hotline / Telephone:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">BR Registration Number:</label>
              <input
                type="text"
                value={brNumber}
                onChange={(e) => setBrNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">VAT / SVAT Tax ID:</label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: WCS Cloud Subscription & License Key Renewal */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 rounded-2xl p-6 border border-indigo-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                <KeyRound className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                    3. WCS Cloud Subscription & License Status
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentLicense?.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {currentLicense?.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  Manage your software activation terms, view current package tier, expiration dates, and apply 01M, 03M, 06M, or 12M renewal keys.
                </p>
              </div>
            </div>

            {/* Optional Key Renew Button */}
            <button
              type="button"
              onClick={() => setIsRenewKeyModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/30 shrink-0"
            >
              <KeyRound className="w-4 h-4 text-emerald-200" />
              <span>Renew Subscription Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Package Tier</div>
              <div className="font-bold text-sm text-indigo-300 mt-0.5">
                {currentLicense?.package_tier || 'PROFESSIONAL'} Plan
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Unlimited Catalog & POS Terminals</div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">License Validity</div>
              <div className="font-bold text-sm text-slate-100 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>
                  {currentLicense?.valid_until
                    ? new Date(currentLicense.valid_until).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Annual / Lifetime'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                {currentLicense?.valid_until
                  ? `${Math.max(0, Math.ceil((new Date(currentLicense.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days Remaining`
                  : 'Active'}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Active License Key</div>
              <div className="font-mono font-bold text-xs text-emerald-300 mt-1 truncate">
                {currentLicense?.license_key || 'WCS-PRO-12M-ACTIVE'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Super Admin Cloud Verified</div>
            </div>
          </div>
        </div>

        {/* Section 4: Thermal Receipt Customization */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-600" />
            4. Thermal Receipt Template & Default Page Format
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: '58mm', label: '58mm Thermal Receipt', desc: 'Compact mini mobile/USB slip' },
              { id: '80mm', label: '80mm Thermal Receipt (Standard)', desc: 'Standard high-speed POS printer' },
              { id: 'a4', label: 'A4 / Full Page Invoice', desc: 'Laser / Inkjet tax invoice' },
            ].map((fmt) => (
              <div
                key={fmt.id}
                onClick={() => setDefaultReceiptFormat(fmt.id as any)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  defaultReceiptFormat === fmt.id
                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">{fmt.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{fmt.desc}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receipt Top Header Note:</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="e.g. Welcome to Lanka Fresh Mart"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receipt Bottom Footer Note:</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="e.g. Exchange within 7 days with original receipt"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer Thank You Message:</label>
              <input
                type="text"
                value={thankYouMsg}
                onChange={(e) => setThankYouMsg(e.target.value)}
                placeholder="e.g. Thank you for shopping with us!"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">VAT / Tax Rate (%):</label>
              <input
                type="number"
                step="any"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Sales Associate on Bill Configuration */}
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Print Sales Associate Details on Customer Bills</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        showAssociateOnBill
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {showAssociateOnBill ? 'Always Print' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically print sales associate / floor staff name, employee code (e.g. [SA-01]), and designation on thermal receipts (80mm/58mm) and A4 tax invoices.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={showAssociateOnBill}
                  onChange={(e) => setShowAssociateOnBill(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {showAssociateOnBill && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    Associate Label Header on Receipt:
                  </label>
                  <input
                    type="text"
                    value={associateTitleLabel}
                    onChange={(e) => setAssociateTitleLabel(e.target.value)}
                    placeholder="e.g. Sales Associate, Served By, Sales Person"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">
                    Display name shown above or before the associate name on printed bills.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Restaurant KOT Toggle Option */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Restaurant Kitchen Order Ticket (KOT) & Table Mode</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        enableRestaurantKot
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {enableRestaurantKot ? 'Enabled' : 'Disabled (Without KOT Bill)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {enableRestaurantKot
                      ? 'Checkout prompts for Dine-in Table numbers and dispatches KOT kitchen slips along with customer sales bills.'
                      : 'Standard Retail Mode: Checkout issues direct customer sales receipts without KOT kitchen slips or table prompts.'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={enableRestaurantKot}
                  onChange={(e) => setEnableRestaurantKot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: WCS Local Print Agent Status */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              WCS Hardware Print Bridge (ESC/POS Silent Integration)
            </h3>
            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-mono border border-emerald-500/40">
              AGENT PORT: 9100 / ONLINE
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The WCS Print Bridge allows this cloud app to dispatch raw ESC/POS byte streams and cut commands directly to local USB / Ethernet receipt printers (Epson, Citizen, Bixolon, Xprinter) without showing browser print previews.
          </p>
        </div>

        {/* Section 5: Store Data Backup & Restore (Current Shop Scoped) */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 rounded-2xl p-6 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                    Store Data Backup & Restore
                  </h3>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 text-[10px] rounded font-mono border border-indigo-500/30">
                    {currentTenant?.shop_name || 'Active Shop'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Export and restore backup data specifically for <strong>{currentTenant?.shop_name}</strong>. Download single-shop JSON snapshots, Excel master workbooks, or restore point-in-time states safely without modifying other stores.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {products.length} Products
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {categories.length} Categories
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {customers.length} Customers
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    {sales.length} Sales
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBackupStudioOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Open Shop Backup Studio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 6: Master Platform Super Admin HQ Access */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 rounded-2xl p-6 border border-purple-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Super Admin Platform Headquarters</span>
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-300 text-[10px] rounded font-mono border border-purple-500/30">
                    Master HQ
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Access platform-level license management, multi-tenant controls, security parameters, and cross-shop diagnostics via the master Super Admin portal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSuperAdminLoginOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-purple-400/30"
            >
              <ShieldCheck className="w-4 h-4 text-purple-200" />
              <span>Super Admin Panel Login</span>
            </button>
          </div>
        </div>

        {/* Section 7: System Updates & Future Code Modifications */}
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 rounded-2xl p-6 border border-purple-500/30 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>System Updates & Future Code Modifications</span>
                  <span className="px-2 py-0.5 bg-purple-950 text-purple-300 text-[10px] rounded font-mono border border-purple-500/30">
                    Developer Studio
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate AI prompts, add custom retail features, run safe schema migrations, execute runtime patches, and export full system backups.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUpdatesStudioOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Code Updates Studio</span>
            </button>
          </div>
        </div>

        {/* Section 6: Danger Zone - Decommission & Delete Store */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-rose-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Danger Zone: Decommission & Delete Store</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded font-bold">
                    Irreversible
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Permanently delete this shop instance (<strong>{currentTenant?.shop_name}</strong> - <span className="font-mono">{currentTenantId}</span>). This will wipe all inventory items, sales records, customer ledgers, and staff accounts associated with this store.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteErrorMsg(null);
                setDeleteConfirmText('');
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Decommission & Delete Store</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Shop Preferences & Logo</span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Decommission & Delete Store</h3>
                <p className="text-xs text-rose-600 font-mono font-semibold">
                  {currentTenantId} • {currentTenant?.shop_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action is <strong className="text-rose-600">permanent and cannot be undone</strong>. All products, category setups, sales histories, supplier balances, staff accounts, and receipts for <strong>{currentTenant?.shop_name}</strong> will be permanently wiped.
            </p>

            {deleteErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                Type <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE</span> to confirm decommissioning:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteErrorMsg(null);
                }}
                placeholder="DELETE"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                  setDeleteErrorMsg(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  if (deleteConfirmText !== 'DELETE') return;
                  const res = deleteTenantShop(currentTenantId);
                  if (res.success) {
                    setIsDeleteModalOpen(false);
                    alert(res.message);
                  } else {
                    setDeleteErrorMsg(res.message);
                  }
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Store</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Updates & Code Modification Modal */}
      <SystemUpdatesStudio
        isOpen={isUpdatesStudioOpen}
        onClose={() => setIsUpdatesStudioOpen(false)}
      />

      {/* Shop Backup & Data Migration Studio Modal (Current Shop Scoped) */}
      <ShopBackupStudio
        isOpen={isBackupStudioOpen}
        isModal={true}
        onClose={() => setIsBackupStudioOpen(false)}
      />

      {/* Renew License Key Modal */}
      {isRenewKeyModalOpen && (
        <RenewLicenseKeyModal
          isOpen={isRenewKeyModalOpen}
          onClose={() => setIsRenewKeyModalOpen(false)}
        />
      )}

      {/* Super Admin Master Login Modal */}
      {isSuperAdminLoginOpen && (
        <SuperAdminLoginModal
          isOpen={isSuperAdminLoginOpen}
          onClose={() => setIsSuperAdminLoginOpen(false)}
          onSuccess={() => {
            setIsSuperAdminLoginOpen(false);
            setCurrentTenantId('SUPER_ADMIN');
          }}
        />
      )}
    </div>
  );
};
