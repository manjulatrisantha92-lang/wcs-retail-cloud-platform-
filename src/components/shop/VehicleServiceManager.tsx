import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { VehicleServiceJob, VehicleServiceStatus } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import {
  Car,
  Truck,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Wrench,
  Fuel,
  Gauge,
  Calendar,
  Layers,
  X,
  User,
  Shield,
  Phone,
  Sparkles,
} from 'lucide-react';

export const VehicleServiceManager: React.FC = () => {
  const {
    vehicleServiceJobs,
    addVehicleServiceJob,
    updateVehicleServiceJob,
    deleteVehicleServiceJob,
    currentTenant,
    queuePrintJob,
  } = useRetail();

  const currencySymbol = currentTenant?.currency_symbol || 'Rs.';
  const safeVehicleServiceJobs = vehicleServiceJobs || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<VehicleServiceJob | null>(null);

  // Form State for New Vehicle Service
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    vehicle_number: '',
    vehicle_make_model: '',
    vehicle_type: 'CAR' as VehicleServiceJob['vehicle_type'],
    current_mileage_km: 50000,
    technician_or_mechanic: 'Master Chaminda & Asanka',
    service_package: 'FULL_SERVICE' as VehicleServiceJob['service_package'],
    engine_oil_name: 'Mobil 1 Advanced 0W-20 Synthetic (4L)',
    oil_price: 18900,
    oil_filter_price: 2450,
    labor_charge: 5500,
    notes: 'Checked brake fluid and tyre pressures.',
  });

  const filteredJobs = safeVehicleServiceJobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      job.job_card_no.toLowerCase().includes(q) ||
      job.vehicle_number.toLowerCase().includes(q) ||
      job.customer_name.toLowerCase().includes(q) ||
      job.customer_phone.includes(q) ||
      job.vehicle_make_model.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_number || !formData.customer_name) {
      alert('Please provide Vehicle Number and Customer Name.');
      return;
    }

    const currentKm = Number(formData.current_mileage_km) || 0;
    const nextDueKm = currentKm + 5000;
    const nextDueDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const partsTotal = Number(formData.oil_price) + Number(formData.oil_filter_price);
    const laborTotal = Number(formData.labor_charge);
    const grandTotal = partsTotal + laborTotal;

    const newJob = addVehicleServiceJob({
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      vehicle_number: formData.vehicle_number.toUpperCase().trim(),
      vehicle_make_model: formData.vehicle_make_model || 'Standard Vehicle',
      vehicle_type: formData.vehicle_type,
      current_mileage_km: currentKm,
      next_service_due_km: nextDueKm,
      next_service_due_date: nextDueDate,
      technician_or_mechanic: formData.technician_or_mechanic,
      service_package: formData.service_package,
      services_performed: [
        { service_name: `${formData.service_package.replace(/_/g, ' ')} Labor & Check`, labor_cost: laborTotal },
      ],
      parts_and_lubricants: [
        { name: formData.engine_oil_name, quantity: 1, unit_price: Number(formData.oil_price), total: Number(formData.oil_price) },
        { name: 'Genuine Engine Oil Filter Element', quantity: 1, unit_price: Number(formData.oil_filter_price), total: Number(formData.oil_filter_price) },
      ],
      status: 'IN_BAY',
      total_labor: laborTotal,
      total_parts: partsTotal,
      grand_total: grandTotal,
      paid_amount: grandTotal,
      payment_method: 'CASH',
      notes: formData.notes,
    });

    queuePrintJob(
      'THERMAL_80',
      `Vehicle Service Card #${newJob.job_card_no}`,
      `Job #${newJob.job_card_no} | ${newJob.vehicle_number} | Total: ${currencySymbol} ${(grandTotal || 0).toLocaleString()}`
    );

    setIsNewJobModalOpen(false);
    setSelectedJobForPrint(newJob);
    // Reset Form
    setFormData({
      customer_name: '',
      customer_phone: '',
      vehicle_number: '',
      vehicle_make_model: '',
      vehicle_type: 'CAR',
      current_mileage_km: 50000,
      technician_or_mechanic: 'Master Chaminda & Asanka',
      service_package: 'FULL_SERVICE',
      engine_oil_name: 'Mobil 1 Advanced 0W-20 Synthetic (4L)',
      oil_price: 18900,
      oil_filter_price: 2450,
      labor_charge: 5500,
      notes: '',
    });
  };

  const handleStatusChange = (jobId: string, newStatus: VehicleServiceStatus) => {
    updateVehicleServiceJob(jobId, { status: newStatus });
  };

  const getStatusBadge = (status: VehicleServiceStatus) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Received</span>;
      case 'IN_BAY':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> In Service Bay</span>;
      case 'WASHING':
        return <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold rounded-lg flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Wash & Detailing</span>;
      case 'READY':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ready for Delivery</span>;
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
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Vehicle Service Station & Lube Bay
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Vehicle job cards, lubrication maintenance, mileage intervals & service sticker printouts
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewJobModalOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Vehicle Check-In</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicles in Service Bays</span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {safeVehicleServiceJobs.filter((j) => j && (j.status === 'IN_BAY' || j.status === 'WASHING')).length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ready for Customer Pickup</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {safeVehicleServiceJobs.filter((j) => j && j.status === 'READY').length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Service Turnover Revenue</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {currencySymbol} {safeVehicleServiceJobs.reduce((acc, j) => acc + (j && j.grand_total || 0), 0).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Vehicles Serviced</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">
            {safeVehicleServiceJobs.length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Vehicle # (e.g. WP CA-8890), Customer, Model, Job #..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'RECEIVED', 'IN_BAY', 'WASHING', 'READY', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-xs'
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
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                  {job.job_card_no}
                </span>
                {getStatusBadge(job.status)}
              </div>

              <div className="flex items-center justify-between gap-2 mb-2 bg-slate-900 text-amber-400 p-2 rounded-xl font-mono">
                <span className="font-black text-sm tracking-wider">{job.vehicle_number}</span>
                <span className="text-[10px] text-slate-300 font-sans font-semibold">{job.vehicle_make_model}</span>
              </div>

              {/* Mileage block */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Current Odometer</span>
                  <strong className="text-slate-900 font-mono text-xs">{(job.current_mileage_km || 0).toLocaleString()} KM</strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Next Service Due</span>
                  <strong className="text-emerald-700 font-mono text-xs">{(job.next_service_due_km || 0).toLocaleString()} KM</strong>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-slate-800">{job.customer_name} ({job.customer_phone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Package:</span>
                  <span className="font-bold text-slate-700">{job.service_package.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Technician:</span>
                  <span className="text-slate-700">{job.technician_or_mechanic}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span>{currencySymbol} {(job.grand_total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <select
                value={job.status}
                onChange={(e) => handleStatusChange(job.id, e.target.value as VehicleServiceStatus)}
                className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="RECEIVED">Received</option>
                <option value="IN_BAY">In Bay</option>
                <option value="WASHING">Washing</option>
                <option value="READY">Ready</option>
                <option value="DELIVERED">Delivered</option>
              </select>

              <button
                onClick={() => setSelectedJobForPrint(job)}
                title="Print Service Invoice & Windshield Service Sticker"
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Job Card</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Vehicle Check-in Modal */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Car className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">
                  New Vehicle Service Registration
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
              {/* Vehicle & Customer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-600" /> Vehicle Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Vehicle No (Plate) *</label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      placeholder="e.g. WP CA-8890"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold uppercase focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Make & Model</label>
                    <input
                      type="text"
                      value={formData.vehicle_make_model}
                      onChange={(e) => setFormData({ ...formData, vehicle_make_model: e.target.value })}
                      placeholder="e.g. Toyota Prius / Vezel"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Vehicle Type</label>
                    <select
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    >
                      <option value="CAR">Car / Sedan / Hatchback</option>
                      <option value="SUV">SUV / Crossover</option>
                      <option value="VAN">Van / Microbus</option>
                      <option value="BIKE">Motorbike / Scooter</option>
                      <option value="THREE_WHEELER">Three Wheeler (TukTuk)</option>
                      <option value="LORRY">Lorry / Commercial Truck</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Current Odo Mileage (KM)</label>
                    <input
                      type="number"
                      value={formData.current_mileage_km}
                      onChange={(e) => setFormData({ ...formData, current_mileage_km: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="e.g. Rohan Jayatilleke"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Customer Phone (WhatsApp) *</label>
                    <input
                      type="text"
                      required
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="e.g. 077 456 7890"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Service Details & Lubricants */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" /> Lubricants & Package Selection
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Service Package</label>
                    <select
                      value={formData.service_package}
                      onChange={(e) => setFormData({ ...formData, service_package: e.target.value as any })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="FULL_SERVICE">Full Service & 28-Point Safety Check</option>
                      <option value="LUBE_AND_OIL">Lube Service & Engine Oil Flush</option>
                      <option value="WASH_AND_VACUUM">Underbody Wash, Vacuum & Waxing</option>
                      <option value="BRAKE_SERVICE">4-Wheel Brake Pad Clean & Bleed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Engine Oil Grade / Name</label>
                    <input
                      type="text"
                      value={formData.engine_oil_name}
                      onChange={(e) => setFormData({ ...formData, engine_oil_name: e.target.value })}
                      placeholder="e.g. Mobil 1 0W-20 / Castrol 5W-30 (4L)"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Engine Oil Price ({currencySymbol})</label>
                    <input
                      type="number"
                      value={formData.oil_price}
                      onChange={(e) => setFormData({ ...formData, oil_price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Oil Filter Price ({currencySymbol})</label>
                    <input
                      type="number"
                      value={formData.oil_filter_price}
                      onChange={(e) => setFormData({ ...formData, oil_filter_price: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Service Labor Charge ({currencySymbol})</label>
                    <input
                      type="number"
                      value={formData.labor_charge}
                      onChange={(e) => setFormData({ ...formData, labor_charge: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-amber-700"
                    />
                  </div>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register & Print Job Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Vehicle Job Card & Windshield Reminder Sticker */}
      {selectedJobForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-600" />
                Vehicle Service Invoice & Reminder Card
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
                  <div className="mt-2 inline-block px-3 py-0.5 bg-slate-950 text-amber-400 rounded text-xs font-bold font-mono">
                    {selectedJobForPrint.vehicle_number}
                  </div>
                </div>

                {/* Service Meta */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Job Card #:</span>
                    <span className="font-bold text-amber-800">{selectedJobForPrint.job_card_no}</span>
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
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vehicle Model:</span>
                    <span className="font-bold">{selectedJobForPrint.vehicle_make_model}</span>
                  </div>
                </div>

                {/* Next Service Due Sticker Box */}
                <div className="border-2 border-dashed border-amber-400 bg-amber-50/60 p-3 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide block">
                    ★ NEXT SERVICE DUE REMINDER ★
                  </span>
                  <div className="text-base font-black text-amber-950 font-mono">
                    {(selectedJobForPrint.next_service_due_km || 0).toLocaleString()} KM
                  </div>
                  <div className="text-[10px] text-amber-800 font-sans font-semibold">
                    Target Date: {selectedJobForPrint.next_service_due_date || 'In 6 Months'}
                  </div>
                </div>

                {/* Breakdown of services & lubricants */}
                <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="font-bold text-slate-800 uppercase text-[10px]">Services & Lubricants:</div>
                  {(selectedJobForPrint.parts_and_lubricants || []).map((part, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{part.name} (x{part.quantity})</span>
                      <span>{currencySymbol} {(part.total || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  {(selectedJobForPrint.services_performed || []).map((srv, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{srv.service_name}</span>
                      <span>{currencySymbol} {(srv.labor_cost || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between text-sm font-bold text-slate-950">
                    <span>NET TOTAL:</span>
                    <span>{currencySymbol} {(selectedJobForPrint.grand_total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Barcode & Footer */}
                <div className="text-center space-y-2 pt-1 font-sans">
                  <div className="flex justify-center">
                    <BarcodeRenderer value={selectedJobForPrint.job_card_no} height={26} width={1.1} fontSize={9} />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Thank you for trusting our service station with your vehicle maintenance!
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
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-sm flex items-center gap-1.5"
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
