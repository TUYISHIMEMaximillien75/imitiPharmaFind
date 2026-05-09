import { useState, useEffect } from 'react';
import { ClipboardList, Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, X } from 'lucide-react';
import api from '../../services/api';

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
  totalAmount: number;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  pharmacy: { id: string; name: string; phone?: string; address?: string };
  items: ReservationItem[];
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200',  icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    icon: XCircle },
  COMPLETED: { label: 'Completed', color: 'text-sky-600',    bg: 'bg-sky-50    border-sky-200',    icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-500',  bg: 'bg-slate-50  border-slate-200',  icon: X },
};

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchReservations = async (p = 1, append = false) => {
    try {
      const res = await api.get(`/reservations?page=${p}&limit=10`);
      const data: Reservation[] = res.data;
      setReservations(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === 10);
    } catch {
      setError('Failed to load reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReservations(1); }, []);

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

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center">
          <ClipboardList size={24} className="text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">My Reservations</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">Track all your medicine reservation requests</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {!isLoading && !error && reservations.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-slate-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-gray-200 mb-1">No reservations yet</h3>
          <p className="text-slate-400 dark:text-gray-500 text-sm">Search for medicines and reserve from a pharmacy near you.</p>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map((r) => {
          const cfg = STATUS_CONFIG[r.status];
          const Icon = cfg.icon;
          return (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelected(r)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{r.pharmacy.name}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">
                    {r.items.length} medicine{r.items.length !== 1 ? 's' : ''} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.items.slice(0, 3).map((item) => (
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
                  <p className="font-bold text-slate-800 dark:text-white">{Number(r.totalAmount).toLocaleString()} RWF</p>
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
            Load More
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-gray-950/80 border border-slate-100 dark:border-gray-800 w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800 dark:text-white text-lg">{selected.pharmacy.name}</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
                <X size={18} className="text-slate-500 dark:text-gray-400" />
              </button>
            </div>

            <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border mb-4 ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
              {selected.status}
            </div>

            <div className="space-y-2 mb-4">
              {selected.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-gray-300">{item.medicine.name} × {item.quantity}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{(item.priceAtReservation * item.quantity).toLocaleString()} RWF</span>
                </div>
              ))}
              <div className="border-t dark:border-gray-700 pt-2 flex justify-between font-bold">
                <span className="text-slate-800 dark:text-white">Total</span>
                <span className="text-sky-600">{Number(selected.totalAmount).toLocaleString()} RWF</span>
              </div>
            </div>

            {selected.status === 'REJECTED' && selected.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-400">
                <strong>Rejection reason:</strong> {selected.rejectionReason}
              </div>
            )}

            {selected.pharmacy.phone && (
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">📞 {selected.pharmacy.phone}</p>
            )}

            {selected.status === 'PENDING' && (
              <button
                onClick={() => handleCancel(selected.id)}
                disabled={cancelling === selected.id}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                {cancelling === selected.id ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
