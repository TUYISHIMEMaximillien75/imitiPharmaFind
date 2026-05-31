import { useEffect, useState, useRef } from 'react';
import { Clock, Building2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

type PharmacyStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export default function PendingApprovalPage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [status, setStatus] = useState<PharmacyStatus>(
    (user?.pharmacy?.status as PharmacyStatus) ?? 'PENDING'
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState(new Date());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pharmacyId = user?.pharmacy?.id;

  const checkStatus = async () => {
    if (!pharmacyId) return;
    try {
      const res = await api.get(`/pharmacies/${pharmacyId}/status`);
      const newStatus: PharmacyStatus = res.data.status;
      setStatus(newStatus);
      setRejectionReason(res.data.rejectionReason ?? null);
      setLastChecked(new Date());

      if (newStatus === 'ACTIVE') {
        // Refresh user object so the PharmacistGate redirects to dashboard
        if (pollRef.current) clearInterval(pollRef.current);
        try {
          const profileRes = await api.get('/auth/me');
          // refresh() returns { access_token, user }
          if (profileRes.data.user) {
            localStorage.setItem('pharma_token', profileRes.data.access_token);
            updateUser(profileRes.data.user);
          }
        } catch { /* silent */ }
        window.location.reload();
      }
    } catch {
      // Silently ignore polling errors
    }
  };

  useEffect(() => {
    checkStatus();
    pollRef.current = setInterval(checkStatus, 10_000); // Poll every 10 s
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pharmacyId]);

  const isRejected = status === 'REJECTED';

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="relative mb-8 inline-block">
          <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto border-2 ${
            isRejected
              ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <Building2 size={52} className={isRejected ? 'text-red-500' : 'text-amber-500 dark:text-amber-400'} />
          </div>
          <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 shadow-md ${
            isRejected ? 'bg-red-500' : 'bg-amber-400'
          }`}>
            {isRejected
              ? <XCircle size={18} className="text-white" />
              : <Clock size={18} className="text-white" />}
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3">
          {isRejected ? t('pending.rejectedTitle') : t('pending.title')}
        </h1>

        <p className="text-slate-500 dark:text-gray-400 leading-relaxed mb-6">
          {isRejected ? t('pending.rejectedSubtitle') : t('pending.subtitle')}
        </p>

        {isRejected && rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">{t('pending.rejectionReason')}</p>
            <p className="text-sm text-red-600 dark:text-red-300">{rejectionReason}</p>
          </div>
        )}

        {!isRejected && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left space-y-2 mb-6">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">{t('pending.whatNext')}</p>
            <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 list-disc list-inside">
              <li>{t('pending.step1')}</li>
              <li>{t('pending.step2')}</li>
              <li>{t('pending.step3')}</li>
            </ul>
          </div>
        )}

        {/* Live status indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-gray-600 mb-4">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isRejected ? 'bg-red-400' : 'bg-amber-400'}`} />
          <span>
            {t('pending.status')}: <strong className={isRejected ? 'text-red-500' : 'text-amber-500'}>{status}</strong>
            {' · '}{t('pending.lastChecked')}: {lastChecked.toLocaleTimeString()}
          </span>
        </div>

        <button
          onClick={checkStatus}
          className="flex items-center gap-2 mx-auto text-sm text-slate-500 dark:text-gray-400 hover:text-sky-500 transition-colors"
        >
          <RefreshCw size={14} /> {t('pending.checkNow')}
        </button>

        {isRejected && (
          <div className="mt-6">
            <a
              href="mailto:umuhirebelyse23@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              <CheckCircle size={16} /> {t('pending.contactSupport')}
            </a>
          </div>
        )}

        <p className="text-slate-400 dark:text-gray-600 text-sm mt-6">
          {t('pending.needHelp')}{' '}
          <a href="mailto:umuhirebelyse23@gmail.com" className="text-sky-500 hover:underline">umuhirebelyse23@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
