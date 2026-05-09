import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Clock, Package, CheckCircle2,
  XCircle, Loader2, Shield, AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

interface InventoryItem {
  id: string;
  stock: number;
  price: number;
  medicine: { id: string; name: string; category: string };
}

interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  openingTime: number;
  closingTime: number;
  status: string;
  locationProvince?: string;
  locationDistrict?: string;
  locationSector?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  insurances: { id: string; providerName: string }[];
  inventory: InventoryItem[];
}

function formatHour(h: number) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${suffix}`;
}

function isPharmacyOpen(pharmacy: Pharmacy): boolean {
  const h = new Date().getHours();
  if (pharmacy.openingTime <= pharmacy.closingTime) {
    return h >= pharmacy.openingTime && h < pharmacy.closingTime;
  }
  return h >= pharmacy.openingTime || h < pharmacy.closingTime;
}

export default function PharmacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/pharmacies/${id}`)
      .then(res => setPharmacy(res.data))
      .catch(() => setError('Pharmacy not found'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={40} className="text-sky-500 animate-spin" />
      </div>
    );
  }

  if (error || !pharmacy) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Pharmacy not found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const open = isPharmacyOpen(pharmacy);
  const filtered = (pharmacy.inventory || []).filter(
    inv => inv.medicine.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-800">{pharmacy.name}</h1>
              {open ? (
                <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle2 size={12} /> Open Now
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full border border-red-200">
                  <XCircle size={12} /> Closed
                </span>
              )}
            </div>
            {pharmacy.description && (
              <p className="text-slate-500 text-sm leading-relaxed max-w-lg">{pharmacy.description}</p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <Clock size={18} className="text-sky-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Hours</p>
              <p className="text-sm font-bold text-slate-800">{formatHour(pharmacy.openingTime)} – {formatHour(pharmacy.closingTime)}</p>
            </div>
          </div>
          {pharmacy.phone && (
            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <Phone size={18} className="text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">Phone</p>
                <a href={`tel:${pharmacy.phone}`} className="text-sm font-bold text-sky-600 hover:underline">{pharmacy.phone}</a>
              </div>
            </div>
          )}
          {pharmacy.address && (
            <div className="flex items-start gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <MapPin size={18} className="text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">Address</p>
                <p className="text-sm font-bold text-slate-800">{pharmacy.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insurances */}
      {pharmacy.insurances && pharmacy.insurances.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={16} className="text-sky-500" /> Accepted Insurances
          </h2>
          <div className="flex flex-wrap gap-2">
            {pharmacy.insurances.map(ins => (
              <span key={ins.id} className="bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                {ins.providerName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-sky-500" /> Available Medicines ({pharmacy.inventory?.length ?? 0})
          </h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines..."
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 w-48"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No medicines found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(inv => {
              const isOut = inv.stock === 0;
              const isLow = inv.stock > 0 && inv.stock <= 10;
              return (
                <div
                  key={inv.id}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                    isOut
                      ? 'bg-red-50 border-red-100 opacity-60'
                      : isLow
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{inv.medicine.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{inv.medicine.category?.toLowerCase()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-800">{Number(inv.price).toLocaleString()} RWF</p>
                    {isOut ? (
                      <span className="text-[10px] font-bold text-red-500">Out of stock</span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold text-amber-600">{inv.stock} left</span>
                    ) : (
                      <span className="text-[10px] text-slate-400">{inv.stock} in stock</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
