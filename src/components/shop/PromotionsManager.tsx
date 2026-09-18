import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { PromotionCampaign } from '../../types';
import {
  Megaphone,
  Share2,
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  Tag,
  Calendar,
  Percent,
  CheckCircle2,
  Trash2,
  Globe,
  ExternalLink,
  Copy,
  Send,
  Sliders,
  Store,
} from 'lucide-react';
import { sharePromotionViaWhatsApp, sharePromotionViaFacebook } from '../../utils/whatsappReceipt';

export const PromotionsManager: React.FC = () => {
  const {
    promotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    products,
    currentTenant,
    language,
    t,
  } = useRetail();

  const safePromotions = promotions || [];
  const safeProducts = products || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPromoForShare, setSelectedPromoForShare] = useState<PromotionCampaign | null>(null);
  const [sharePhone, setSharePhone] = useState('');
  const [customShareText, setCustomShareText] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New promo form state
  const [title, setTitle] = useState('');
  const [titleSi, setTitleSi] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionSi, setDescriptionSi] = useState('');
  const [descriptionTa, setDescriptionTa] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [featuredProductId, setFeaturedProductId] = useState<string>('');
  const [bannerColor, setBannerColor] = useState<string>('#4f46e5');

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';

  const filteredPromotions = safePromotions.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.title_si && p.title_si.toLowerCase().includes(q)) ||
      (p.title_ta && p.title_ta.toLowerCase().includes(q)) ||
      (p.coupon_code && p.coupon_code.toLowerCase().includes(q))
    );
  });

  const handleOpenShareModal = (promo: PromotionCampaign) => {
    setSelectedPromoForShare(promo);
    const shopName = currentTenant?.shop_name || 'Retail Store';
    const localizedTitle =
      language === 'si' && promo.title_si
        ? promo.title_si
        : language === 'ta' && promo.title_ta
        ? promo.title_ta
        : promo.title;

    const localizedDesc =
      language === 'si' && promo.description_si
        ? promo.description_si
        : language === 'ta' && promo.description_ta
        ? promo.description_ta
        : promo.description || '';

    const discountVal = promo.discount_percentage || 0;
    const text = `🎉 *SPECIAL OFFER from ${shopName.toUpperCase()}!*\n\n🔥 *${localizedTitle}*\n${localizedDesc ? `${localizedDesc}\n` : ''}\n💰 *Discount:* ${discountVal}% OFF\n🏷️ *Promo Code:* ${promo.coupon_code || 'IN-STORE'}\n📅 *Valid Until:* ${promo.valid_until}\n\n📍 Visit ${shopName} today or call ${currentTenant?.phone || ''} to place your order!`;

    setCustomShareText(text);
    setSharePhone('');
  };

  const handleWhatsAppSend = () => {
    if (!customShareText) return;
    sharePromotionViaWhatsApp(customShareText, sharePhone);
  };

  const handleFacebookSend = () => {
    sharePromotionViaFacebook('', customShareText);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreatePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a promotion title.');
      return;
    }

    addPromotion({
      title: title.trim(),
      title_si: titleSi.trim() || undefined,
      title_ta: titleTa.trim() || undefined,
      description: description.trim() || '',
      description_si: descriptionSi.trim() || undefined,
      description_ta: descriptionTa.trim() || undefined,
      coupon_code: promoCode.trim().toUpperCase() || undefined,
      discount_percentage: Number(discountPercent),
      valid_from: startDate,
      valid_until: endDate,
      featured_product_id: featuredProductId || undefined,
      banner_color: bannerColor,
      is_active: true,
    });

    setIsAddModalOpen(false);
    // Reset form
    setTitle('');
    setTitleSi('');
    setTitleTa('');
    setDescription('');
    setDescriptionSi('');
    setDescriptionTa('');
    setPromoCode('');
    setDiscountPercent(10);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-600" />
              Marketing & Social Growth
            </span>
            <span className="text-slate-400 text-xs">• WhatsApp & Facebook Deals</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Promotions, Discount Codes & Social Sharing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Create multilingual marketing campaigns and instantly share promotional deals with customers via WhatsApp broadcast and Facebook.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Promotion</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promotions, codes, titles..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="font-semibold text-slate-700">{filteredPromotions.length} Active Campaigns</span>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPromotions.map((promo) => {
          const isSi = language === 'si';
          const isTa = language === 'ta';
          const displayTitle =
            isSi && promo.title_si ? promo.title_si : isTa && promo.title_ta ? promo.title_ta : promo.title;
          const displayDesc =
            isSi && promo.description_si
              ? promo.description_si
              : isTa && promo.description_ta
              ? promo.description_ta
              : promo.description;

          return (
            <div
              key={promo.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Promo Card Top Header Banner */}
                <div
                  className="p-4 text-white flex items-center justify-between relative overflow-hidden"
                  style={{ backgroundColor: promo.banner_color || '#4f46e5' }}
                >
                  <div className="relative z-10">
                    <span className="px-2 py-0.5 bg-black/20 backdrop-blur-xs rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      {promo.discount_percentage || 0}% DISCOUNT
                    </span>
                    <h3 className="font-bold text-sm text-white mt-1 leading-snug">{displayTitle}</h3>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-white/80" />
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3 text-xs">
                  {displayDesc && (
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">{displayDesc}</p>
                  )}

                  {/* Multilingual preview tags */}
                  <div className="flex flex-wrap gap-1">
                    {promo.title_si && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded font-medium">
                        සිං: {promo.title_si}
                      </span>
                    )}
                    {promo.title_ta && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] rounded font-medium">
                        த: {promo.title_ta}
                      </span>
                    )}
                  </div>

                  {/* Code & Validity */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Coupon Code</div>
                      <div className="font-mono font-bold text-indigo-700 tracking-wider">
                        {promo.coupon_code || 'NO-CODE'}
                      </div>
                    </div>
                    {promo.coupon_code && (
                      <button
                        onClick={() => handleCopyCode(promo.coupon_code!)}
                        className="px-2 py-1 text-[11px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>{copiedCode === promo.coupon_code ? 'Copied!' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Until {promo.valid_until}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        promo.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {promo.is_active ? 'Active' : 'Expired'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Social Share Actions */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenShareModal(promo)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Share</span>
                </button>

                <button
                  onClick={() => {
                    handleOpenShareModal(promo);
                    handleFacebookSend();
                  }}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
                  title="Share on Facebook"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm('Delete this promotion campaign?')) {
                      deletePromotion(promo.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Promotion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal Dialog */}
      {selectedPromoForShare && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Share Promotion Campaign</h3>
                  <p className="text-slate-500 text-[11px]">Instant WhatsApp and Facebook customer outreach</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPromoForShare(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Target Phone */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <span>Customer Mobile Number (Optional for Direct WhatsApp)</span>
                <span className="text-[10px] text-slate-400 font-normal">(e.g. 077 123 4567 or leave blank for broadcast)</span>
              </label>
              <input
                type="text"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                placeholder="0771234567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Editable Message Preview */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Message Text Preview (Editable):</label>
              <textarea
                rows={6}
                value={customShareText}
                onChange={(e) => setCustomShareText(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans text-slate-800 text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleWhatsAppSend}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open WhatsApp Share</span>
              </button>

              <button
                onClick={handleFacebookSend}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share on Facebook</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(customShareText);
                  alert('Promotional message copied to clipboard!');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Promotion Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-xl w-full shadow-2xl space-y-4 text-xs my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  Create New Promotion Campaign
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Configure titles in English, Sinhala, and Tamil for local customers
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromotion} className="space-y-4">
              {/* Title (English) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Promotion Title (English) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekend Mega Grocery Discount"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Multilingual Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-800 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Sinhala Title (සිංහල මාතෘකාව)
                  </label>
                  <input
                    type="text"
                    value={titleSi}
                    onChange={(e) => setTitleSi(e.target.value)}
                    placeholder="උදා: සති අන්ත විශේෂ වට්ටම"
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-800 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Tamil Title (தமிழ் தலைப்பு)
                  </label>
                  <input
                    type="text"
                    value={titleTa}
                    onChange={(e) => setTitleTa(e.target.value)}
                    placeholder="எ.கா: வார இறுதி சிறப்பு தள்ளுபடி"
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Promo Code & Discount % */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Promo / Coupon Code</label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MEGA10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Percentage (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description (English) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Offer Description (English)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Get 10% off when you purchase over Rs. 5,000 this weekend."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Multilingual Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-800">Sinhala Description (සිංහල විස්තරය)</label>
                  <textarea
                    rows={2}
                    value={descriptionSi}
                    onChange={(e) => setDescriptionSi(e.target.value)}
                    placeholder="රු. 5,000 කට වඩා මිලදී ගැනීමේදී 10% ක වට්ටමක් ලබා ගන්න."
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-amber-800">Tamil Description (தமிழ் விவரம்)</label>
                  <textarea
                    rows={2}
                    value={descriptionTa}
                    onChange={(e) => setDescriptionTa(e.target.value)}
                    placeholder="ரூ. 5,000 க்கு மேல் வாங்கும் போது 10% தள்ளுபடியைப் பெறுங்கள்."
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Banner Color Picker */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Theme Color</label>
                <div className="flex items-center gap-2">
                  {['#4f46e5', '#e11d48', '#059669', '#d97706', '#7c3aed', '#0284c7'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setBannerColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        bannerColor === col ? 'scale-110 border-slate-900 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
