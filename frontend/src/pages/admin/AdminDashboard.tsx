import { useState, useEffect } from 'react';
import { ShieldCheck, Building2, FileCheck, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../services/api';

interface Pharmacy {
  id: string;
  name: string;
  licenseNumber: string;
  licenseDocumentUrl?: string;
  address?: string;
  phone?: string;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  createdAt: string;
  owner?: { email: string; firstName?: string; lastName?: string; phone?: string };
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/pharmacies');
      setPharmacies(res.data);
    } catch {
      setError('Failed to load pharmacies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/pharmacies/${id}/approve`);
      setPharmacies(pharmacies.map(p => p.id === id ? { ...p, status: 'ACTIVE' } : p));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally { setProcessingId(null); }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessingId(id);
    try {
      await api.patch(`/pharmacies/${id}/reject`, { reason: rejectReason });
      setPharmacies(pharmacies.map(p => p.id === id ? { ...p, status: 'REJECTED', rejectionReason: rejectReason } : p));
      setRejectingId(null);
      setRejectReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally { setProcessingId(null); }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this pharmacy? It will be hidden from patients.')) return;
    setProcessingId(id);
    try {
      await api.patch(`/pharmacies/${id}/suspend`, { reason: 'Suspended by admin' });
      setPharmacies(pharmacies.map(p => p.id === id ? { ...p, status: 'SUSPENDED' } : p));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend');
    } finally { setProcessingId(null); }
  };

  const handleReactivate = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/pharmacies/${id}/reactivate`);
      setPharmacies(pharmacies.map(p => p.id === id ? { ...p, status: 'ACTIVE' } : p));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reactivate');
    } finally { setProcessingId(null); }
  };

  const pending    = pharmacies.filter(p => p.status === 'PENDING');
  const active     = pharmacies.filter(p => p.status === 'ACTIVE');
  const rejected   = pharmacies.filter(p => p.status === 'REJECTED');
  const suspended  = pharmacies.filter(p => p.status === 'SUSPENDED');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={24} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{t('admin.title')}</h1>
            <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{t('admin.pendingPharmacies')}</p>
          </div>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
          <RefreshCw size={15} /> {t('common.refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: t('reservations.pending'),   count: pending.length,    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
          { label: t('admin.approved'),          count: active.length,     color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
          { label: t('admin.rejected'),          count: rejected.length,   color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
          { label: 'Suspended',                  count: suspended.length,  color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.color}`}>
            <p className="text-3xl font-extrabold">{s.count}</p>
            <p className="text-sm font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 mb-6">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 flex items-center gap-2">
            <Building2 size={18} className="text-slate-500 dark:text-gray-400" />
            <h2 className="font-bold text-slate-800 dark:text-white">All Pharmacies ({pharmacies.length})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Pharmacy</th>
                  <th className="p-4 font-semibold">Owner</th>
                  <th className="p-4 font-semibold">License</th>
                  <th className="p-4 font-semibold">Submitted</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                {pharmacies.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                      {p.address && <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{p.address}</p>}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-gray-400">
                      <p>{p.owner ? `${p.owner.firstName || ''} ${p.owner.lastName || ''}`.trim() || p.owner.email : '—'}</p>
                      {p.owner?.email && <p className="text-xs text-slate-400 dark:text-gray-500">{p.owner.email}</p>}
                      {(p.phone || p.owner?.phone) && <p className="text-xs text-slate-400 dark:text-gray-500">📞 {p.phone || p.owner?.phone}</p>}
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-xs text-slate-600 dark:text-gray-400">{p.licenseNumber}</p>
                      {p.licenseDocumentUrl && (
                        <a
                          href={`${BASE_URL}${p.licenseDocumentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-500 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                        >
                          📄 View License Doc ↗
                        </a>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {p.status === 'PENDING'    && <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-semibold"><Clock size={14} /> {t('reservations.pending')}</span>}
                      {p.status === 'ACTIVE'     && <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-semibold"><CheckCircle size={14} /> {t('admin.approved')}</span>}
                      {p.status === 'REJECTED'   && <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-sm font-semibold"><XCircle size={14} /> {t('admin.rejected')}</span>}
                      {p.status === 'SUSPENDED'  && <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm font-semibold"><XCircle size={14} /> Suspended</span>}
                    </td>
                    <td className="p-4 text-right">
                      {p.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          {rejectingId === p.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t('admin.rejectReason')}
                                className="border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white dark:bg-gray-800 dark:text-white"
                              />
                              <button onClick={() => handleReject(p.id)} disabled={!rejectReason.trim() || processingId === p.id} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm rounded-lg font-semibold transition-colors">
                                {t('common.confirm')}
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-1.5 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 text-sm rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-gray-700">
                                {t('common.cancel')}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => setRejectingId(p.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-gray-700 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-sm transition-colors">
                                <XCircle size={14} /> {t('admin.reject')}
                              </button>
                              <button onClick={() => handleApprove(p.id)} disabled={processingId === p.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-semibold text-sm transition-colors">
                                <FileCheck size={14} /> {processingId === p.id ? '...' : t('admin.approve')}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {p.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleSuspend(p.id)}
                          disabled={processingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold text-sm transition-colors disabled:opacity-50"
                        >
                          <XCircle size={14} /> {processingId === p.id ? '...' : 'Suspend'}
                        </button>
                      )}
                      {p.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handleReactivate(p.id)}
                          disabled={processingId === p.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-semibold text-sm transition-colors"
                        >
                          <CheckCircle size={14} /> {processingId === p.id ? '...' : 'Re-activate'}
                        </button>
                      )}
                      {p.status === 'REJECTED' && <span className="text-slate-400 dark:text-gray-600 text-xs">{p.rejectionReason}</span>}
                      {p.status === 'SUSPENDED' && p.rejectionReason && <span className="text-slate-400 dark:text-gray-600 text-xs">{p.rejectionReason}</span>}
                    </td>
                  </tr>
                ))}
                {pharmacies.length === 0 && (
                  <tr><td colSpan={6} className="p-10 text-center text-slate-400 dark:text-gray-600">{t('admin.noPharmacies')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
