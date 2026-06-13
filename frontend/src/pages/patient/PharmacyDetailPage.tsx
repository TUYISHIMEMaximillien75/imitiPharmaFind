import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Clock, Package, CheckCircle2,
  XCircle, Loader2, Shield, AlertCircle, Calendar, Info, Pill,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface InventoryItem {
  id: string;
  stock: number;
  price: number;
  expiryDate?: string;
  medicine: { id: string; name: string; category: string; description?: string; requiresPrescription?: boolean; imageUrl?: string };
}

interface PharmacyInsurance {
  id: string;
  insuranceId: string;
  coveragePercentage: number | null;
  insurance: { id: string; providerName: string; defaultCoveragePercentage: number };
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
  pharmacyInsurances: PharmacyInsurance[];
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
  const { t } = useTranslation();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    // Issue #1 fix: endpoint is now public (no auth guard on backend)
    api.get(`/pharmacies/${id}`)
      .then(res => setPharmacy(res.data))
      .catch(() => setError(t('pharmacy.notFound')))
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
        <h2 className="text-xl font-bold text-slate-700 mb-2">{t('pharmacy.notFound')}</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors text-sm">
          {t('pharmacy.goBack')}
        </button>
      </div>
    );
  }

  const open = isPharmacyOpen(pharmacy);
  const filtered = (pharmacy.inventory || []).filter(
    inv => inv.medicine.name.toLowerCase().includes(search.toLowerCase())
  );

  // Find the selected insurance coverage
  const selectedInsurance = selectedInsuranceId
    ? pharmacy.pharmacyInsurances?.find(pi => pi.insuranceId === selectedInsuranceId || pi.insurance?.id === selectedInsuranceId)
    : null;
  const coveragePct = selectedInsurance
    ? (selectedInsurance.coveragePercentage ?? selectedInsurance.insurance?.defaultCoveragePercentage ?? 0)
    : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> {t('common.back')}
      </button>

      {/* Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{pharmacy.name}</h1>
              {open ? (
                <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                  <CheckCircle2 size={12} /> {t('pharmacy.openNow')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-3 py-1 rounded-full border border-red-200">
                  <XCircle size={12} /> {t('pharmacy.closed')}
                </span>
              )}
            </div>
            {pharmacy.description && (
              <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed max-w-lg">{pharmacy.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 border border-slate-100 dark:border-gray-700">
            <Clock size={18} className="text-sky-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-0.5">{t('pharmacy.hours')}</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{formatHour(pharmacy.openingTime)} – {formatHour(pharmacy.closingTime)}</p>
            </div>
          </div>
          {pharmacy.phone && (
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 border border-slate-100 dark:border-gray-700">
              <Phone size={18} className="text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-0.5">{t('pharmacy.phone')}</p>
                <a href={`tel:${pharmacy.phone}`} className="text-sm font-bold text-sky-600 hover:underline">{pharmacy.phone}</a>
              </div>
            </div>
          )}
          {pharmacy.address && (
            <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 border border-slate-100 dark:border-gray-700">
              <MapPin size={18} className="text-sky-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-0.5">{t('pharmacy.address')}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{pharmacy.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insurances — Issue #11: select an insurance to see discounted prices */}
      {pharmacy.pharmacyInsurances && pharmacy.pharmacyInsurances.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-slate-700 dark:text-gray-200 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={16} className="text-sky-500" /> {t('pharmacy.insurance')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">{t('pharmacy.insuranceSelectHint')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedInsuranceId('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !selectedInsuranceId ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
              }`}
            >
              {t('pharmacy.noInsurance')}
            </button>
            {pharmacy.pharmacyInsurances.map(pi => {
              const pct = pi.coveragePercentage ?? pi.insurance?.defaultCoveragePercentage ?? 0;
              const insId = pi.insurance?.id ?? pi.insuranceId;
              return (
                <button
                  key={pi.id}
                  onClick={() => setSelectedInsuranceId(insId)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    selectedInsuranceId === insId
                      ? 'bg-sky-500 text-white border-sky-500'
                      : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
                  }`}
                >
                  {pi.insurance?.providerName} · {pct}%
                </button>
              );
            })}
          </div>
          {selectedInsurance && (
            <p className="mt-3 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              ✅ {t('pharmacy.coverageNote', { provider: selectedInsurance.insurance?.providerName, pct: coveragePct, rest: 100 - coveragePct })}
            </p>
          )}
        </div>
      )}

      {/* Inventory — Issue #11: show insurance price alongside full price */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <h2 className="font-bold text-slate-700 dark:text-gray-200 text-sm uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-sky-500" /> {t('pharmacy.availableMedicines', { count: pharmacy.inventory?.length ?? 0 })}
          </h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pharmacy.searchMedicines')}
            className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white w-48"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">{t('pharmacy.noMedicinesFound')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(inv => {
              const isOut = inv.stock === 0;
              const isLow = inv.stock > 0 && inv.stock <= 10;
              const fullPrice = Number(inv.price);
              const insuredPrice = selectedInsurance
                ? Math.round(fullPrice * (1 - coveragePct / 100))
                : null;
              const savings = insuredPrice !== null ? fullPrice - insuredPrice : 0;

              const isExpired = inv.expiryDate ? new Date(inv.expiryDate) < new Date() : false;
              const isNearExpiry = inv.expiryDate && !isExpired
                ? (new Date(inv.expiryDate).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000
                : false;

              return (
                <div
                  key={inv.id}
                  className={`rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                    isOut || isExpired
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900 opacity-70'
                      : isLow
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900'
                      : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700'
                  }`}
                >
                  {/* Medicine Header */}
                  <div className="flex items-start gap-3 p-4 border-b border-slate-100 dark:border-gray-700">
                    <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center shrink-0">
                      {inv.medicine.imageUrl
                        ? <img src={inv.medicine.imageUrl} alt={inv.medicine.name} className="w-full h-full object-cover rounded-xl" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        : <Pill size={18} className="text-sky-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{inv.medicine.name}</p>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {isOut ? (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">{t('common.outOfStock')}</span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Expired</span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">{t('common.lowStock', { count: inv.stock })}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">{inv.stock} {t('common.inStock')}</span>
                          )}
                          {inv.medicine.requiresPrescription && (
                            <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">Rx Required</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">{inv.medicine.category?.toLowerCase()}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {inv.medicine.description && (
                    <div className="px-4 pt-3 flex items-start gap-2">
                      <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">{inv.medicine.description}</p>
                    </div>
                  )}

                  {/* Expiry Date */}
                  {inv.expiryDate && (
                    <div className={`mx-4 mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isExpired
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : isNearExpiry
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400'
                    }`}>
                      <Calendar size={12} />
                      {isExpired ? 'Expired: ' : isNearExpiry ? 'Expires soon: ' : 'Expires: '}
                      {new Date(inv.expiryDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Pricing Section */}
                  <div className="p-4 mt-1">
                    {insuredPrice !== null ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 dark:text-gray-400">Full price</span>
                          <span className="text-xs text-slate-400 dark:text-gray-500 line-through">{fullPrice.toLocaleString()} RWF</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Shield size={10} /> Insurance covers {coveragePct}%
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">-{savings.toLocaleString()} RWF</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-gray-700 pt-1.5">
                          <span className="text-sm font-bold text-slate-700 dark:text-gray-200">You pay</span>
                          <span className="text-base font-extrabold text-sky-600 dark:text-sky-400">{insuredPrice.toLocaleString()} RWF</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-gray-400">Price</span>
                        <span className="text-base font-extrabold text-slate-800 dark:text-white">{fullPrice.toLocaleString()} RWF</span>
                      </div>
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
