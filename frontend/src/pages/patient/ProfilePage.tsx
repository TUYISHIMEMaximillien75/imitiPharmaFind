import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, Loader2, CheckCircle2, Shield, HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    insuranceProviderId: user?.insuranceProviderId || '',
    insuranceNumber: user?.insuranceNumber || '',
  });
  const [insurances, setInsurances] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.patch('/users/me', form);
      updateUser({ ...user!, ...res.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchInsurances = async () => {
      try {
        const res = await api.get('/insurances');
        setInsurances(res.data);
      } catch (err) {
        console.error('Failed to load insurances', err);
      }
    };
    fetchInsurances();
  }, []);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // First save to make sure backend has latest provider and number
      await api.patch('/users/me', form);
      const res = await api.post('/users/me/insurance/verify');
      updateUser({ ...user!, ...res.data });
      alert('Insurance Verified Successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to verify insurance');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
          <User size={32} className="text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{t('profile.title')}</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">{t('profile.subtitle')}</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
        <Shield size={12} />
        {user?.role}
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 mb-6">
        <h2 className="font-bold text-slate-700 dark:text-gray-300 mb-5 text-sm uppercase tracking-wider">{t('profile.personalInfo')}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('profile.firstName')}</label>
            <input
              id="profile-firstName"
              type="text"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 transition-all"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('profile.lastName')}</label>
            <input
              id="profile-lastName"
              type="text"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 transition-all"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <Phone size={11} /> {t('profile.phone')}
          </label>
          <input
            id="profile-phone"
            type="tel"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 transition-all"
            placeholder="e.g. 0780000000"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <Mail size={11} /> {t('profile.email')}
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full border border-slate-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">{t('profile.emailNote')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          id="profile-save-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3 rounded-xl transition-all"
        >
          {isSaving ? (
            <><Loader2 size={16} className="animate-spin" /> {t('common.saving')}</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> {t('profile.saved')}</>
          ) : (
            <><Save size={16} /> {t('profile.saveChanges')}</>
          )}
        </button>
      </div>

      {user?.role === 'PATIENT' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <HeartPulse className="text-pink-500" size={20} />
            <h2 className="font-bold text-slate-700 dark:text-gray-300 text-sm uppercase tracking-wider">Health Insurance</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Insurance Provider</label>
              <select
                value={form.insuranceProviderId}
                onChange={e => setForm({ ...form, insuranceProviderId: e.target.value })}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-slate-50 dark:bg-gray-800 dark:text-white transition-all"
              >
                <option value="">Select Provider...</option>
                {insurances.map(ins => (
                  <option key={ins.id} value={ins.id}>{ins.providerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Insurance Number</label>
              <input
                type="text"
                value={form.insuranceNumber}
                onChange={e => setForm({ ...form, insuranceNumber: e.target.value })}
                className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-slate-50 dark:bg-gray-800 dark:text-white transition-all"
                placeholder="e.g. 123456789"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-600 dark:text-gray-400">Status:</span>
              {user.isInsuranceVerified ? (
                <span className="flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={14} /> Verified
                </span>
              ) : (
                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md">
                  Unverified
                </span>
              )}
            </div>
            
            <button
              onClick={handleVerify}
              disabled={isVerifying || !form.insuranceProviderId || !form.insuranceNumber}
              className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-2 px-6 rounded-xl transition-all"
            >
              {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              Verify Now
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
