import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList, Package, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, X, Bell, CreditCard, Shield, Smartphone, CheckCircle2,
  Banknote, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../services/api';

interface ReservationItem {
  id: string;
  quantity: number;
  priceAtReservation: number;
  medicine: { id: string; name: string };
}

interface Reservation {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: 'PAY_AT_PHARMACY' | 'PAY_ONLINE';
  totalAmount: number;
  patientPays?: number;
  insurancePays?: number;
  insuranceNumber?: string;
  prescriptionImageUrl?: string;
  deliveryOption?: 'PICKUP' | 'HOME_DELIVERY';
  deliveryFee?: number;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  pharmacy: { id: string; name: string; phone?: string; address?: string };
  items: ReservationItem[];
}

const STATUS_CONFIG = {
  PENDING:   { labelKey: 'reservations.pending',   color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',  icon: Clock },
  CONFIRMED: { labelKey: 'reservations.confirmed', color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',  icon: CheckCircle },
  REJECTED:  { labelKey: 'reservations.rejected',  color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',          icon: XCircle },
  COMPLETED: { labelKey: 'reservations.completed', color: 'text-sky-600 dark:text-sky-400',      bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',          icon: CheckCircle },
  CANCELLED: { labelKey: 'reservations.cancelled', color: 'text-slate-500 dark:text-gray-400',   bg: 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700',       icon: X },
};

const PAYMENT_BADGE = {
  UNPAID: { label: '🔴 Payment Pending', cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  PAID:   { label: '🟢 Paid',            cls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
};

export default function MyReservationsPage() {
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Mock payment state
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payStep, setPayStep] = useState<'confirm' | 'processing' | 'done'>('confirm');
  const [isPaying, setIsPaying] = useState(false);

  // Real-time status notifications
  const [changedIds, setChangedIds] = useState<{ id: string; newStatus: string }[]>([]);
  const knownStatuses = useRef<Map<string, string>>(new Map());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReservations = async (p = 1, append = false, silent = false) => {
    if (!silent) setError('');
    try {
      const res = await api.get(`/reservations?page=${p}&limit=10`);
      const data: Reservation[] = res.data;

      const changes: { id: string; newStatus: string }[] = [];
      if (knownStatuses.current.size > 0) {
        data.forEach(r => {
          const prev = knownStatuses.current.get(r.id);
          if (prev && prev !== r.status && (r.status === 'CONFIRMED' || r.status === 'REJECTED')) {
            changes.push({ id: r.id, newStatus: r.status });
          }
        });
      }
      data.forEach(r => knownStatuses.current.set(r.id, r.status));
      if (changes.length > 0) setChangedIds(prev => [...prev, ...changes]);

      setError('');
      setReservations(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === 10);
    } catch {
      if (!silent) setError('Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations(1);
    pollRef.current = setInterval(() => fetchReservations(1, false, true), 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await api.patch(`/reservations/${id}/cancel`);
      await fetchReservations(1);
      setPage(1);
      setSelected(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const handlePayOnline = async (reservationId: string) => {
    setPayStep('processing');
    setIsPaying(true);
    try {
      await api.post(`/reservations/${reservationId}/pay-online`);
      // Simulate a brief processing delay for realism
      await new Promise(r => setTimeout(r, 1800));
      setPayStep('done');
      await fetchReservations(1, false, true);
      setSelected(prev => prev && prev.id === reservationId ? { ...prev, paymentStatus: 'PAID' } : prev);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment confirmation failed. Please try again.');
      setPayStep('confirm');
    } finally {
      setIsPaying(false);
    }
  };

  const openPayModal = (id: string) => {
    setPayingId(id);
    setPayStep('confirm');
  };

  const closePayModal = () => {
    setPayingId(null);
    setPayStep('confirm');
  };

  const payingReservation = reservations.find(r => r.id === payingId);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center">
          <ClipboardList size={24} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{t('reservations.title')}</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{t('reservations.subtitle')}</p>
        </div>
      </div>

      {/* Status change notifications */}
      {changedIds.length > 0 && (
        <div className="mb-6 space-y-2">
          {changedIds.map((c, i) => {
            const r = reservations.find(x => x.id === c.id);
            return (
              <div key={i} className={`flex items-center justify-between gap-3 rounded-2xl p-4 border text-sm font-medium ${
                c.newStatus === 'CONFIRMED'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}>
                <span className="flex items-center gap-2">
                  <Bell size={15} />
                  {r ? r.pharmacy.name : 'A pharmacy'} has {c.newStatus === 'CONFIRMED' ? 'confirmed' : 'rejected'} your reservation
                </span>
                <button onClick={() => setChangedIds(prev => prev.filter((_, j) => j !== i))} className="shrink-0 opacity-60 hover:opacity-100">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!isLoading && !error && reservations.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-slate-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-200 mb-1">{t('reservations.empty')}</h3>
          <p className="text-slate-400 dark:text-gray-500 text-sm">{t('reservations.emptySubtitle')}</p>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map(r => {
          const cfg = STATUS_CONFIG[r.status];
          const Icon = cfg.icon;
          const isNew = changedIds.some(c => c.id === r.id);
          const needsPayment = r.status === 'CONFIRMED' && r.paymentMethod === 'PAY_ONLINE' && r.paymentStatus !== 'PAID';
          return (
            <div
              key={r.id}
              className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isNew ? 'border-sky-400 dark:border-sky-600 ring-2 ring-sky-200 dark:ring-sky-800' : 'border-slate-200 dark:border-gray-800'
              }`}
              onClick={() => setSelected(r)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{r.pharmacy.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      <Icon size={11} /> {t(cfg.labelKey)}
                    </span>
                    {isNew && <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">{t('reservations.newBadge')}</span>}
                    {needsPayment && (
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">💳 Pay Now</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">
                    {r.items.length} medicine{r.items.length !== 1 ? 's' : ''} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.items.slice(0, 3).map(item => (
                      <span key={item.id} className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                        {item.medicine.name}
                      </span>
                    ))}
                    {r.items.length > 3 && (
                      <span className="bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 text-xs px-2 py-0.5 rounded-full">+{r.items.length - 3} more</span>
                    )}
                  </div>
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <p className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-1.5">
                      Reason: {r.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {r.insurancePays && Number(r.insurancePays) > 0 ? (
                    <div>
                      <p className="text-xs text-slate-400 line-through">{Number(r.totalAmount).toLocaleString()} RWF</p>
                      <p className="font-bold text-sky-600 dark:text-sky-400">{Number(r.patientPays).toLocaleString()} RWF</p>
                      <p className="text-[10px] text-green-600 dark:text-green-400">Ins: -{Number(r.insurancePays).toLocaleString()} RWF</p>
                    </div>
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white">{Number(r.totalAmount).toLocaleString()} RWF</p>
                  )}
                  <ChevronRight size={18} className="text-slate-400 dark:text-gray-600 mt-1 ml-auto" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && !isLoading && (
        <div className="text-center mt-6">
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchReservations(next, true); }}
            className="px-8 py-3 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            {t('common.loadMore')}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-gray-950/80 border border-slate-100 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">{selected.pharmacy.name}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
                <X size={18} className="text-slate-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Status */}
            <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border mb-4 ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
              {t(STATUS_CONFIG[selected.status].labelKey)}
            </div>

            {/* Payment badge */}
            {selected.paymentMethod === 'PAY_ONLINE' && (
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 mb-4 ${PAYMENT_BADGE[selected.paymentStatus]?.cls || ''}`}>
                <CreditCard size={11} />
                {PAYMENT_BADGE[selected.paymentStatus]?.label || selected.paymentStatus}
              </div>
            )}
            {selected.paymentMethod === 'PAY_AT_PHARMACY' && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 mb-4 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                🏪 Pay at Pharmacy
              </div>
            )}

            {/* Items */}
            <div className="space-y-2 mb-4">
              {selected.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-gray-300">{item.medicine.name} × {item.quantity}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{(item.priceAtReservation * item.quantity).toLocaleString()} RWF</span>
                </div>
              ))}

              {/* Price breakdown */}
              <div className="border-t dark:border-gray-700 pt-2 space-y-1">
                {Number(selected.insurancePays) > 0 ? (
                  <>
                    <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                      <span>Full price</span>
                      <span className="line-through">{Number(selected.totalAmount).toLocaleString()} RWF</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1"><Shield size={12} /> Insurance pays</span>
                      <span>-{Number(selected.insurancePays).toLocaleString()} RWF</span>
                    </div>
                    {Number(selected.deliveryFee) > 0 && (
                      <div className="flex justify-between text-sm text-slate-500 dark:text-gray-400">
                        <span>Delivery fee</span>
                        <span>+{Number(selected.deliveryFee).toLocaleString()} RWF</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base">
                      <span className="text-slate-800 dark:text-white">You pay</span>
                      <span className="text-sky-600 dark:text-sky-400">{Number(selected.patientPays).toLocaleString()} RWF</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-800 dark:text-white">{t('reservations.total')}</span>
                    <span className="text-sky-600 dark:text-sky-400">{Number(selected.totalAmount).toLocaleString()} RWF</span>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance info (visible to patient) */}
            {selected.insuranceNumber && (
              <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl px-3 py-2 mb-4 text-xs text-sky-700 dark:text-sky-400 flex items-center gap-2">
                <Shield size={13} /> Insurance #: <span className="font-mono font-bold">{selected.insuranceNumber}</span>
              </div>
            )}

            {/* Prescription link */}
            {selected.prescriptionImageUrl && (
              <div className="mb-4">
                <a href={`${BASE_URL}${selected.prescriptionImageUrl}`} target="_blank" rel="noreferrer"
                  className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold">
                  📎 View attached prescription
                </a>
              </div>
            )}

            {/* Rejection reason */}
            {selected.status === 'REJECTED' && selected.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-400">
                <strong>{t('reservations.rejectionReason')}</strong> {selected.rejectionReason}
              </div>
            )}

            {selected.pharmacy.phone && (
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">📞 {selected.pharmacy.phone}</p>
            )}

            {/* Pay Now button */}
            {selected.status === 'CONFIRMED' && selected.paymentMethod === 'PAY_ONLINE' && selected.paymentStatus !== 'PAID' && (
              <button
                onClick={() => openPayModal(selected.id)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl transition-all mb-3 flex items-center justify-center gap-2"
              >
                <Banknote size={18} /> Pay Now — {Number(selected.patientPays ?? selected.totalAmount).toLocaleString()} RWF
              </button>
            )}

            {/* Cancel button */}
            {selected.status === 'PENDING' && (
              <button
                onClick={() => handleCancel(selected.id)}
                disabled={cancelling === selected.id}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                {cancelling === selected.id ? t('reservations.cancelling') : t('reservations.cancelBtn')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mock Payment Modal */}
      {payingId && payingReservation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">

            {/* ── Step 1: Confirm ── */}
            {payStep === 'confirm' && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 pt-6 pb-8 text-white relative">
                  <button onClick={closePayModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30">
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold opacity-75 uppercase tracking-widest">Mobile Money</p>
                      <h3 className="text-lg font-bold">Confirm Payment</h3>
                    </div>
                  </div>
                </div>

                {/* Transaction details card */}
                <div className="-mt-4 mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Pay to</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{payingReservation.pharmacy.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Medicines</span>
                    <span className="text-sm text-slate-700 dark:text-gray-300">{payingReservation.items.length} item{payingReservation.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {payingReservation.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-1.5 border-t border-slate-50 dark:border-gray-700">
                      <span className="text-xs text-slate-600 dark:text-gray-400">{item.medicine.name} ×{item.quantity}</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">{(item.priceAtReservation * item.quantity).toLocaleString()} RWF</span>
                    </div>
                  ))}
                  {Number(payingReservation.insurancePays) > 0 && (
                    <div className="flex justify-between items-center py-1.5 border-t border-slate-50 dark:border-gray-700">
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Shield size={10} /> Insurance covers</span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">-{Number(payingReservation.insurancePays).toLocaleString()} RWF</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100 dark:border-gray-700 mt-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-200">Total to Pay</span>
                    <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400">{Number(payingReservation.patientPays ?? payingReservation.totalAmount).toLocaleString()} RWF</span>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                    <Lock size={12} className="text-green-500 shrink-0" />
                    This is a simulated payment. No real money will be charged.
                  </div>
                  <button
                    onClick={() => handlePayOnline(payingId)}
                    className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30"
                  >
                    <Smartphone size={18} /> Confirm & Pay
                  </button>
                  <button onClick={closePayModal} className="w-full text-slate-500 dark:text-gray-400 text-sm py-2 hover:text-slate-700 dark:hover:text-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2: Processing ── */}
            {payStep === 'processing' && (
              <div className="p-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-100 dark:border-sky-900" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
                  <div className="absolute inset-2 bg-sky-50 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
                    <Smartphone size={24} className="text-sky-500" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Processing Payment…</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">Please wait while we process your payment securely.</p>
              </div>
            )}

            {/* ── Step 3: Success ── */}
            {payStep === 'done' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Payment Successful! 🎉</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-2">
                  {Number(payingReservation.patientPays ?? payingReservation.totalAmount).toLocaleString()} RWF paid to {payingReservation.pharmacy.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mb-6">The pharmacy has been notified and will prepare your medicines.</p>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Transaction Details</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Ref: TXN-{Date.now().toString(36).toUpperCase()}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Date: {new Date().toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Status: PAID ✓</p>
                </div>
                <button
                  onClick={closePayModal}
                  className="w-full bg-sky-500 text-white font-bold py-3 rounded-2xl hover:bg-sky-600 transition-colors"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}
