import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { RepairJob, RepairJobStatus } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import {
  Wrench,
  Smartphone,
  Laptop,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  User,
  Shield,
  FileText,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';

export const RepairJobsManager: React.FC = () => {
  const {
    repairJobs,
    addRepairJob,
    updateRepairJob,
    deleteRepairJob,
    currentTenant,
    products,
    createSale,
    queuePrintJob,
    language,
    t,
  } = useRetail();

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';
  const safeRepairJobs = repairJobs || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<RepairJob | null>(null);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<RepairJob | null>(null);

  // Form State for New Repair Job
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    device_type: 'MOBILE_PHONE' as RepairJob['device_type'],
    device_brand: '',
    device_model: '',
    imei_or_serial: '',
    security_lock_pin: '',
    issue_description: '',
    technician_name: 'Nuwan Perera',
    estimated_cost: 0,
    advance_paid: 0,
    labor_charge: 0,
    warranty_period: '3 Months Service Warranty',
    notes: '',
  });

  const filteredJobs = safeRepairJobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.job_no.toLowerCase().includes(q) ||
      job.customer_name.toLowerCase().includes(q) ||
      job.customer_phone.includes(q) ||
      job.device_brand.toLowerCase().includes(q) ||
      job.device_model.toLowerCase().includes(q) ||
      job.imei_or_serial.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.device_model || !formData.issue_description) {
      alert('Please fill in required customer and device details.');
      return;
    }

    const newJob = addRepairJob({
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email || undefined,
      device_type: formData.device_type,
      device_brand: formData.device_brand || 'General',
      device_model: formData.device_model,
      imei_or_serial: formData.imei_or_serial || 'N/A',
      security_lock_pin: formData.security_lock_pin || undefined,
      issue_description: formData.issue_description,
      technician_name: formData.technician_name || 'Master Technician',
      status: 'RECEIVED',
      estimated_cost: Number(formData.estimated_cost) || 0,
      advance_paid: Number(formData.advance_paid) || 0,
      labor_charge: Number(formData.labor_charge) || 0,
      spare_parts_used: [],
      final_amount: Number(formData.estimated_cost) || 0,
      warranty_period: formData.warranty_period,
      notes: formData.notes,
    });

    queuePrintJob(
      'THERMAL_80',
      `Repair Token #${newJob.job_no}`,
      `Token #${newJob.job_no} | ${formData.customer_name} | ${formData.device_model}`
    );

    setIsNewJobModalOpen(false);
    setSelectedJobForPrint(newJob);
    // Reset Form
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      device_type: 'MOBILE_PHONE',
      device_brand: '',
      device_model: '',
      imei_or_serial: '',
      security_lock_pin: '',
      issue_description: '',
      technician_name: 'Nuwan Perera',
      estimated_cost: 0,
      advance_paid: 0,
      labor_charge: 0,
      warranty_period: '3 Months Service Warranty',
      notes: '',
    });
  };

  const handleStatusChange = (jobId: string, newStatus: RepairJobStatus) => {
    updateRepairJob(jobId, {
      status: newStatus,
      completed_at: newStatus === 'READY_FOR_PICKUP' || newStatus === 'DELIVERED' ? new Date().toISOString() : undefined,
    });
  };

  const getStatusBadge = (status: RepairJobStatus) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Received</span>;
      case 'DIAGNOSING':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Diagnosing</span>;
      case 'WAITING_FOR_PARTS':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold rounded-lg flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Parts Waiting</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> In Progress</span>;
      case 'READY_FOR_PICKUP':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready for Pickup</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg flex items-center gap-1">✓ Delivered</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Device Repair & Service Center
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Phone & Computer device check-in, IMEI diagnosis, parts replacement & warranty claims
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Repair Check-In</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Active In-Shop Repairs</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {safeRepairJobs.filter((j) => j && j.status !== 'DELIVERED' && j.status !== 'CANCELLED').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ready for Customer Pickup</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {safeRepairJobs.filter((j) => j && j.status === 'READY_FOR_PICKUP').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Advance Payments Collected</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {safeRepairJobs.reduce((acc, j) => acc + (j && j.advance_paid || 0), 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Completed Jobs</span>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {safeRepairJobs.filter((j) => j && j.status === 'DELIVERED').length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Job #, IMEI, Customer, Model, Phone..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'RECEIVED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {job.job_no}
                </span>
                {getStatusBadge(job.status)}
              </div>

              <div className="flex items-center gap-2 mb-1">
                {job.device_type === 'MOBILE_PHONE' ? (
                  <Smartphone className="w-4 h-4 text-slate-500" />
                ) : (
                  <Laptop className="w-4 h-4 text-slate-500" />
                )}
                <h3 className="font-bold text-slate-900 text-sm">
                  {job.device_brand} {job.device_model}
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 font-mono mb-2">
                IMEI/SN: <span className="text-slate-800 font-semibold">{job.imei_or_serial}</span>
              </p>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 mb-3 space-y-1">
                <p className="font-medium line-clamp-2">
                  <strong className="text-slate-900">Issue:</strong> {job.issue_description}
                </p>
                {job.security_lock_pin && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Lock PIN: <span className="font-bold text-slate-700">{job.security_lock_pin}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-slate-800">{job.customer_name} ({job.customer_phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Technician:</span>
                  <span className="font-medium text-slate-700">{job.technician_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Total:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {(job.estimated_cost || 0).toLocaleString()}</span>
                </div>
                {(job.advance_paid || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Advance Paid:</span>
                    <span>{currencySymbol} {(job.advance_paid || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(job.id, e.target.value as RepairJobStatus)}
                className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="RECEIVED">Received</option>
                <option value="DIAGNOSING">Diagnosing</option>
                <option value="WAITING_FOR_PARTS">Waiting Parts</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="READY_FOR_PICKUP">Ready Pickup</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedJobForPrint(job)}
                  title="Print Job Card / Customer Claim Token"
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Job Check-in Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  New Device Repair Check-In
                </h2>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Customer Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="e.g. Kasun Fernando"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone Number (WhatsApp) *</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="e.g. 077 123 4567"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Device Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Device Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Device Type</label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => setFormData({ ...formData, device_type: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    >
                      <option value="MOBILE_PHONE">Mobile Phone</option>
                      <option value="LAPTOP">Laptop</option>
                      <option value="DESKTOP">Desktop Computer</option>
                      <option value="TABLET">Tablet / iPad</option>
                      <option value="PRINTER">Printer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Brand</label>
                    <input
                      type="text"
                      value={formData.device_brand}
                      onChange={(e) => setFormData({ ...formData, device_brand: e.target.value })}
                      placeholder="e.g. Apple, Samsung, ASUS, Dell"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Model Name / No *</label>
                    <input
                      type="text"
                      required
                      value={formData.device_model}
                      onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                      placeholder="e.g. iPhone 14 Pro / Inspiron 15"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">IMEI or Serial Number</label>
                    <input
                      type="text"
                      value={formData.imei_or_serial}
                      onChange={(e) => setFormData({ ...formData, imei_or_serial: e.target.value })}
                      placeholder="15-digit IMEI or S/N"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Screen Lock PIN / Password</label>
                    <input
                      type="text"
                      value={formData.security_lock_pin}
                      onChange={(e) => setFormData({ ...formData, security_lock_pin: e.target.value })}
                      placeholder="e.g. 1234 or Pattern / None"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Fault / Issue Description *</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.issue_description}
                    onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                    placeholder="Describe problem (e.g. Broken display, no power, motherboard short, battery draining fast...)"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Pricing & Estimation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Estimated Total Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Advance Received ({currencySymbol})</label>
                  <input
                    type="number"
                    value={formData.advance_paid}
                    onChange={(e) => setFormData({ ...formData, advance_paid: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Warranty Period</label>
                  <input
                    type="text"
                    value={formData.warranty_period}
                    onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
                    placeholder="e.g. 3 Months Warranty"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Print Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Repair Job Sheet & Token Modal */}
      {selectedJobForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Customer Claim Token & Job Sheet
              </h3>
              <button
                onClick={() => setSelectedJobForPrint(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-900 bg-slate-50 print:bg-white print:p-0">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none space-y-4">
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  {currentTenant?.logo_url && (
                    <img
                      src={currentTenant.logo_url}
                      alt={currentTenant.shop_name}
                      className="h-12 mx-auto mb-2 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h2 className="font-bold text-sm uppercase text-slate-950">
                    {currentTenant?.shop_name}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-sans">{currentTenant?.address}</p>
                  <p className="text-[10px] text-slate-500 font-sans">Hotline: {currentTenant?.phone}</p>
                  <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold">
                    REPAIR CLAIM TOKEN
                  </div>
                </div>

                {/* Meta */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Job No:</span>
                    <span className="font-bold text-indigo-700">{selectedJobForPrint.job_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date/Time:</span>
                    <span>{new Date(selectedJobForPrint.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-bold">{selectedJobForPrint.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span>{selectedJobForPrint.customer_phone}</span>
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device:</span>
                    <span className="font-bold">{selectedJobForPrint.device_brand} {selectedJobForPrint.device_model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IMEI/Serial:</span>
                    <span>{selectedJobForPrint.imei_or_serial}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-500 block text-[10px]">Reported Issue:</span>
                    <p className="font-sans text-[11px] text-slate-800 bg-slate-50 p-1.5 rounded mt-0.5">
                      {selectedJobForPrint.issue_description}
                    </p>
                  </div>
                </div>

                {/* Financials */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Cost:</span>
                    <span className="font-bold">{currencySymbol} {(selectedJobForPrint.estimated_cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Advance Paid:</span>
                    <span>{currencySymbol} {(selectedJobForPrint.advance_paid || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
                    <span>Balance on Delivery:</span>
                    <span>{currencySymbol} {((selectedJobForPrint.estimated_cost || 0) - (selectedJobForPrint.advance_paid || 0)).toFixed(2)}</span>
                  </div>
                  {selectedJobForPrint.warranty_period && (
                    <div className="text-[10px] text-indigo-700 font-bold pt-1">
                      Warranty: {selectedJobForPrint.warranty_period}
                    </div>
                  )}
                </div>

                {/* Barcode & Terms */}
                <div className="text-center space-y-2 pt-1 font-sans">
                  <div className="flex justify-center">
                    <BarcodeRenderer value={selectedJobForPrint.job_no} height={26} width={1.1} fontSize={9} />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    * Please produce this claim slip when collecting your device.
                    Shop is not liable for software data loss. Backups are customer responsibility.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50 print:hidden">
              <button
                onClick={() => setSelectedJobForPrint(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Job Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
