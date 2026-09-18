import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { CustomFieldDefinition } from '../../types';
import { FormInput, Plus, Trash2, Edit2, Check, Sparkles, AlertCircle, Layers } from 'lucide-react';

export const CustomFieldsStudio: React.FC = () => {
  const { customFields, addCustomField, deleteCustomField, currentTenant } = useRetail();

  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<CustomFieldDefinition['field_type']>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [showInPos, setShowInPos] = useState(true);
  const [showInInvoice, setShowInInvoice] = useState(true);
  const [placeholder, setPlaceholder] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel.trim()) return;

    const fieldKey = fieldLabel
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_');

    const options =
      fieldType === 'select'
        ? optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    addCustomField({
      field_key: fieldKey,
      field_label: fieldLabel.trim(),
      field_type: fieldType,
      options,
      is_required: isRequired,
      show_in_pos: showInPos,
      show_in_invoice: showInInvoice,
      placeholder: placeholder.trim() || undefined,
    });

    setFieldLabel('');
    setOptionsStr('');
    setPlaceholder('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Dynamic Metadata Engine
            </span>
            <span className="text-slate-400 text-xs">• Zero Schema Changes Required</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Shop Custom Fields Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Add custom attributes for your products (such as Vehicle Model & OEM for Motor Spares, Generic Name & Batch for Pharmacy, or Spiciness & Cooking Station for Restaurants) without altering the central database.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Custom Field</span>
        </button>
      </div>

      {/* Add Field Modal / Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500/40 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <FormInput className="w-4 h-4 text-indigo-600" />
              Define New Product Custom Field
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateField} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Field Label / Title: *</label>
                <input
                  type="text"
                  required
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="e.g. Compatible Vehicle Models"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Input Data Type:</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                >
                  <option value="text">Text (Single Line / String)</option>
                  <option value="number">Number (Integer / Decimal)</option>
                  <option value="select">Dropdown Select (Predefined Options)</option>
                  <option value="date">Date Picker</option>
                  <option value="boolean">Checkbox / Boolean (Yes/No)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Placeholder Text (Optional):</label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="e.g. Prius NHW20 / Aqua NHP10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {fieldType === 'select' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Dropdown Options (Comma separated list):
                </label>
                <input
                  type="text"
                  required
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="Toyota, Honda, Nissan, Suzuki, Mitsubishi, Universal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Mandatory / Required Field</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInPos}
                  onChange={(e) => setShowInPos(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Display on Cashier POS Search</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInInvoice}
                  onChange={(e) => setShowInInvoice(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-slate-700 font-medium">Print on Thermal Receipt & Invoice</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm"
              >
                Save Custom Field
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Defined Custom Fields List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Active Product Fields for {currentTenant?.shop_name} ({customFields.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Tenant ID: {currentTenant?.tenant_id}
          </span>
        </div>

        {customFields.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs">No custom fields defined yet for this shop.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Add your first custom field
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customFields.map((cf) => (
              <div key={cf.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{cf.field_label}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      key: {cf.field_key}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase">
                      {cf.field_type}
                    </span>
                    {cf.is_required && (
                      <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>
                      POS Display: <strong className={cf.show_in_pos ? 'text-emerald-600' : 'text-slate-400'}>{cf.show_in_pos ? 'Yes' : 'No'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Invoice Print: <strong className={cf.show_in_invoice ? 'text-emerald-600' : 'text-slate-400'}>{cf.show_in_invoice ? 'Yes' : 'No'}</strong>
                    </span>
                    {cf.options && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-md">Options: {cf.options.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteCustomField(cf.id)}
                  title="Remove this custom field"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JSON Schema Preview Example for Developer Trust */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span>Underlying Dynamic Storage Structure (MongoDB JSON Document):</span>
        </div>
        <pre className="font-mono text-[11px] bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto">
{`{
  "tenant_id": "${currentTenant?.tenant_id}",
  "product_id": "PR1001",
  "name": "Keeri Samba Supreme / Oil Filter",
  "custom_fields": {
${customFields.map((cf) => `    "${cf.field_key}": "${cf.options ? cf.options[0] : 'Custom Value'}"`).join(',\n')}
  }
}`}
        </pre>
      </div>
    </div>
  );
};
