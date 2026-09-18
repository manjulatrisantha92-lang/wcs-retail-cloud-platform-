import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Category } from '../../types';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  Tag,
  Palette,
  Sparkles,
  Infinity as InfinityIcon,
  Zap,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';
import { ExcelDataStudio } from './ExcelDataStudio';

const CATEGORY_COLORS = [
  '#4f46e5', // Indigo
  '#059669', // Emerald
  '#0284c7', // Sky
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#475569', // Slate
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#16a34a', // Green
  '#9333ea', // Deep Purple
];

const PRESET_PACKS: {
  packName: string;
  icon: string;
  categories: { name: string; name_si: string; name_ta: string; color: string }[];
}[] = [
  {
    packName: 'Grocery & Supermarket Pack',
    icon: '🛒',
    categories: [
      { name: 'Fresh Produce & Fruits', name_si: 'එළවළු සහ පලතුරු', name_ta: 'காய்கறிகள் மற்றும் பழங்கள்', color: '#16a34a' },
      { name: 'Dairy & Eggs', name_si: 'කිරි නිෂ්පාදන සහ බිත්තර', name_ta: 'பால் பொருட்கள் & முட்டை', color: '#0284c7' },
      { name: 'Beverages & Soft Drinks', name_si: 'බීම වර්ග', name_ta: 'குளிர்பானங்கள்', color: '#ea580c' },
      { name: 'Snacks & Confectionery', name_si: 'කෙටි කෑම සහ රසකැවිලි', name_ta: 'சிற்றுண்டிகள்', color: '#db2777' },
      { name: 'Rice, Grains & Flours', name_si: 'සහල්, ධාන්‍ය සහ පිටි', name_ta: 'அரிசி & தானியங்கள்', color: '#d97706' },
      { name: 'Spices & Condiments', name_si: 'කුළුබඩු වර්ග', name_ta: 'மசாலாப் பொருட்கள்', color: '#dc2626' },
      { name: 'Bakery & Bread', name_si: 'බේකරි නිෂ්පාදන', name_ta: 'பேக்கரி பொருட்கள்', color: '#d97706' },
      { name: 'Canned & Packaged Foods', name_si: 'ටින් සහ ඇසුරුම් ආහාර', name_ta: 'டின்களில் அடைக்கப்பட்டவை', color: '#4f46e5' },
      { name: 'Personal Care & Hygiene', name_si: 'පුද්ගලික සනීපාරක්ෂක', name_ta: 'தனிப்பட்ட பராமரிப்பு', color: '#0d9488' },
      { name: 'Household & Cleaning', name_si: 'ගෘහස්ථ පිරිසිදුකාරක', name_ta: 'வீட்டு உபயோகம்', color: '#7c3aed' },
    ],
  },
  {
    packName: 'Mobile & Electronics Pack',
    icon: '📱',
    categories: [
      { name: 'Smartphones & Handsets', name_si: 'ස්මාර්ට්ෆෝන්', name_ta: 'ஸ்மார்ட்போன்கள்', color: '#4f46e5' },
      { name: 'Charging Cables & Adapters', name_si: 'චාජර් සහ කේබල්', name_ta: 'சார்ஜர்கள் & கேபிள்கள்', color: '#0284c7' },
      { name: 'Tempered Glass & Covers', name_si: 'කවර සහ ටෙම්පර්ඩ් ග්ලාස්', name_ta: 'கவர்கள் & கண்ணாடி', color: '#db2777' },
      { name: 'Audio, Headphones & Earbuds', name_si: 'හෙඩ්ෆෝන් සහ ශබ්ද උපකරණ', name_ta: 'ஹெட்போன்கள்', color: '#7c3aed' },
      { name: 'Power Banks & Batteries', name_si: 'පවර් බෑන්ක් සහ බැටරි', name_ta: 'பவர் பேங்க் & பேட்டரிகள்', color: '#ea580c' },
      { name: 'Smart Watches & Wearables', name_si: 'ස්මාර්ට් ඔරලෝසු', name_ta: 'ஸ்மார்ட் வாட்ச்கள்', color: '#059669' },
      { name: 'Replacement Parts & Screens', name_si: 'ඩිස්ප්ලේ සහ අමතර කොටස්', name_ta: 'திரை மற்றும் உதிரிபாகங்கள்', color: '#dc2626' },
    ],
  },
  {
    packName: 'Computer & Hardware Pack',
    icon: '💻',
    categories: [
      { name: 'Laptops & Desktop PCs', name_si: 'ලැප්ටොප් සහ පරිගණක', name_ta: 'மடிக்கணினிகள் & பிசி', color: '#4f46e5' },
      { name: 'PC Components & RAM/SSD', name_si: 'රැම්, එස්එස්ඩී සහ උපාංග', name_ta: 'ரேம், எஸ்எஸ்டி உதிரிபாகங்கள்', color: '#0284c7' },
      { name: 'Monitors & Displays', name_si: 'මොනිටර් සහ තිර', name_ta: 'மானிட்டர்கள்', color: '#7c3aed' },
      { name: 'Keyboards, Mice & Peripherals', name_si: 'යතුරුපුවරු සහ මවුස්', name_ta: 'விசைப்பலகை & சுட்டி', color: '#059669' },
      { name: 'Printers, Inks & Toners', name_si: 'මුද්‍රණ යන්ත්‍ර සහ තීන්ත', name_ta: 'பிரிண்டர்கள் & மை', color: '#d97706' },
      { name: 'Networking, Routers & Cables', name_si: 'රවුටර් සහ ජාලකරණ කේබල්', name_ta: 'திசைவிகள் & கேபிள்கள்', color: '#0d9488' },
    ],
  },
];

export const CategoryManager: React.FC = () => {
  const {
    categories,
    products,
    currentTenant,
    addCategory,
    updateCategory,
    deleteCategory,
    updateProduct,
    language,
  } = useRetail();

  const safeCategories = categories || [];
  const safeProducts = products || [];

  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isExcelStudioOpen, setIsExcelStudioOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameSi, setCategoryNameSi] = useState('');
  const [categoryNameTa, setCategoryNameTa] = useState('');
  const [categoryColor, setCategoryColor] = useState('#4f46e5');

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryNameSi('');
    setCategoryNameTa('');
    setCategoryColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryNameSi(cat.name_si || '');
    setCategoryNameTa(cat.name_ta || '');
    setCategoryColor(cat.color || '#4f46e5');
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = categoryName.trim();
    if (!cleanName) {
      showToast('Please enter a category name', 'error');
      return;
    }

    // Check duplicate name
    const isDuplicate = safeCategories.some(
      (c) =>
        c.name.toLowerCase() === cleanName.toLowerCase() &&
        (!editingCategory || c.id !== editingCategory.id)
    );
    if (isDuplicate) {
      showToast(`Category "${cleanName}" already exists.`, 'error');
      return;
    }

    if (editingCategory) {
      const oldName = editingCategory.name;
      updateCategory(editingCategory.id, {
        name: cleanName,
        name_si: categoryNameSi.trim() || undefined,
        name_ta: categoryNameTa.trim() || undefined,
        color: categoryColor,
      });

      // Also update products with old category name
      if (oldName !== cleanName) {
        safeProducts
          .filter((p) => p.category === oldName)
          .forEach((p) => {
            updateProduct(p.id, { category: cleanName });
          });
      }

      showToast(`Category "${cleanName}" updated successfully!`);
    } else {
      addCategory({
        name: cleanName,
        name_si: categoryNameSi.trim() || undefined,
        name_ta: categoryNameTa.trim() || undefined,
        color: categoryColor,
      });
      showToast(`Unlimited Category "${cleanName}" created successfully!`);
    }

    setIsModalOpen(false);
  };

  const handleImportPresetPack = (pack: (typeof PRESET_PACKS)[0]) => {
    let addedCount = 0;
    for (const cat of pack.categories) {
      const exists = safeCategories.some((c) => c.name.toLowerCase() === cat.name.toLowerCase());
      if (!exists) {
        addCategory({
          name: cat.name,
          name_si: cat.name_si,
          name_ta: cat.name_ta,
          color: cat.color,
        });
        addedCount++;
      }
    }

    showToast(`Added ${addedCount} categories from ${pack.packName}!`);
    setIsPresetModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;

    if (safeCategories.length <= 1) {
      showToast('Cannot delete the only remaining category in your shop.', 'error');
      setCategoryToDelete(null);
      return;
    }

    const catName = categoryToDelete.name;
    // Check if products use this category
    const affectedProducts = safeProducts.filter((p) => p.category === catName);

    // Reassign affected products to first available remaining category or 'General'
    const fallbackCategory =
      safeCategories.find((c) => c.id !== categoryToDelete.id)?.name || 'General';

    affectedProducts.forEach((p) => {
      updateProduct(p.id, { category: fallbackCategory });
    });

    deleteCategory(categoryToDelete.id);
    showToast(
      affectedProducts.length > 0
        ? `Category "${catName}" deleted. ${affectedProducts.length} product(s) moved to "${fallbackCategory}".`
        : `Category "${catName}" removed successfully.`
    );
    setCategoryToDelete(null);
  };

  const filteredCategories = safeCategories.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.name_si || '').toLowerCase().includes(q) ||
      (c.name_ta || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div
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

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Catalog Structure
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
              <InfinityIcon className="w-3 h-3 text-emerald-600" />
              Unlimited Categories & Departments
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Product Categories & Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Create unlimited categories, departments, and POS quick-filter tiles with multi-language labels (English, Sinhala, Tamil) and custom color themes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Preset Packs (1-Click)</span>
          </button>

          <button
            onClick={() => setIsExcelStudioOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Import / Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Summary */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories (English, සිංහල, தமிழ்)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>
            Total Categories: <strong className="text-slate-800 font-bold">{safeCategories.length}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Total Items Assigned: <strong className="text-indigo-600 font-bold">{safeProducts.length}</strong>
          </span>
        </div>
      </div>

      {/* Categories Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No categories found matching "{searchQuery}"</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const productCount = safeProducts.filter((p) => p.category === cat.name).length;
            const categoryColor = cat.color || '#4f46e5';

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: categoryColor }}
                />

                <div className="flex items-start justify-between gap-2 mt-1">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border border-current"
                    >
                      <Tag className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                        {cat.name}
                      </h3>
                      {(cat.name_si || cat.name_ta) && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {cat.name_si && <span>{cat.name_si}</span>}
                          {cat.name_si && cat.name_ta && <span> • </span>}
                          {cat.name_ta && <span>{cat.name_ta}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong>{productCount}</strong> {productCount === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      title="Edit Category"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      title="Delete Category"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <InfinityIcon className="w-3 h-3 text-emerald-500" />
                    Unlimited Tile
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: categoryColor }}
                      className="w-3 h-3 rounded-full inline-block shadow-2xs"
                    />
                    <span className="font-mono text-slate-600 uppercase text-[10px]">{categoryColor}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Category Name (English): *
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Beverages, Dairy, Engine Oil, Bakery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Sinhala Name (සිංහල):
                  </label>
                  <input
                    type="text"
                    value={categoryNameSi}
                    onChange={(e) => setCategoryNameSi(e.target.value)}
                    placeholder="උදා: බීම වර්ග"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Tamil Name (தமிழ்):
                  </label>
                  <input
                    type="text"
                    value={categoryNameTa}
                    onChange={(e) => setCategoryNameTa(e.target.value)}
                    placeholder="எ.கா: குளிர்பானங்கள்"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  Category Color Code:
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-xl transition-all shadow-xs cursor-pointer ${
                        categoryColor === color
                          ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preset Packs Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base">
                  1-Click Industry Category Packs
                </h3>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Instantly import complete retail category structures with Sinhala & Tamil names and color palettes for your store.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESET_PACKS.map((pack, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <span className="text-2xl mb-1 block">{pack.icon}</span>
                    <h4 className="font-bold text-xs text-slate-900">{pack.packName}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {pack.categories.length} organized departments
                    </p>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-500 font-mono">
                    {pack.categories.slice(0, 3).map((c, i) => (
                      <div key={i} className="truncate">• {c.name}</div>
                    ))}
                    {pack.categories.length > 3 && (
                      <div className="text-slate-400">+{pack.categories.length - 3} more...</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleImportPresetPack(pack)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                  >
                    Import Pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Remove Category?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete category <strong>"{categoryToDelete.name}"</strong>?
                {safeProducts.filter((p) => p.category === categoryToDelete.name).length > 0 && (
                  <span className="block mt-2 p-2 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                    {safeProducts.filter((p) => p.category === categoryToDelete.name).length} product(s) in this category will be automatically reassigned to "General".
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import / Export Studio Modal */}
      {isExcelStudioOpen && (
        <ExcelDataStudio
          isModal={true}
          initialTab="categories"
          onClose={() => setIsExcelStudioOpen(false)}
        />
      )}
    </div>
  );
};
