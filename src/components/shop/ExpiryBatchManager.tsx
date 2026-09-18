import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { BatchRecord } from '../../types';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface FlatBatch extends BatchRecord {
  product_id: string;
  product_name: string;
  product_sku: string;
  product_unit: string;
}

export const ExpiryBatchManager: React.FC = () => {
  const { products, currentTenant } = useRetail();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'EXPIRED' | '30_DAYS' | '60_DAYS'>('ALL');

  const now = new Date().getTime();

  // Aggregate all batches across all products
  const safeProducts = products || [];
  const allBatches: FlatBatch[] = safeProducts.flatMap((p) =>
    (p.batches || []).map((b) => ({
      ...b,
      product_id: p.id,
      product_name: p.name || 'Unnamed Product',
      product_sku: p.sku || 'N/A',
      product_unit: p.unit || 'units',
    }))
  );

  const getDaysUntilExpiry = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 999;
    const expiryTime = new Date(expiryDateStr).getTime();
    if (isNaN(expiryTime)) return 999;
    return Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
  };

  const filteredBatches = allBatches.filter((b) => {
    const daysLeft = getDaysUntilExpiry(b.expiry_date);

    const matchesSearch =
      (b.batch_no || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.product_sku || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPeriod =
      filterPeriod === 'ALL' ||
      (filterPeriod === 'EXPIRED' && daysLeft < 0) ||
      (filterPeriod === '30_DAYS' && daysLeft >= 0 && daysLeft <= 30) ||
      (filterPeriod === '60_DAYS' && daysLeft >= 0 && daysLeft <= 60);

    return matchesSearch && matchesPeriod;
  });

  const expiredCount = allBatches.filter((b) => getDaysUntilExpiry(b.expiry_date) < 0).length;
  const criticalCount = allBatches.filter((b) => {
    const d = getDaysUntilExpiry(b.expiry_date);
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
              Quality & Loss Prevention
            </span>
            <span className="text-slate-400 text-xs">• {currentTenant?.shop_name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Batch Tracking & Expiry Date Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Monitor approaching shelf life expirations, quarantine obsolete goods, and comply with CDDA / NMRA / Food hygiene standards.
          </p>
        </div>
      </div>

      {/* Expiry Risk Stat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Tracked Batches</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{allBatches.length}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] text-amber-700 font-semibold uppercase block">
            Expiring Within 30 Days (Urgent Clearance)
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{criticalCount}</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] text-rose-700 font-semibold uppercase block">
            Expired Batches (Immediate Quarantine)
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">{expiredCount}</div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch number or drug/product..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Batches' },
              { id: '30_DAYS', label: 'Expiring < 30 Days' },
              { id: '60_DAYS', label: 'Expiring < 60 Days' },
              { id: 'EXPIRED', label: 'Expired' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterPeriod(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterPeriod === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Product / Item</th>
                <th className="py-3 px-4">Remaining Units</th>
                <th className="py-3 px-4">Selling Price</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Shelf-Life Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No batch records found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b, idx) => {
                  const daysLeft = getDaysUntilExpiry(b.expiry_date);
                  const isExpired = daysLeft < 0;
                  const isCritical = daysLeft >= 0 && daysLeft <= 30;

                  return (
                    <tr key={`${b.product_id}-${b.batch_no}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.batch_no}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {b.product_sku}</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-800">
                        {b.quantity} {b.product_unit || 'units'}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-mono font-semibold">
                        {currentTenant?.currency_symbol || 'Rs.'} {(b.selling_price || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {new Date(b.expiry_date).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <ShieldAlert className="w-3 h-3" />
                            Expired ({Math.abs(daysLeft)}d ago)
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            {daysLeft} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Good ({daysLeft} days)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
