import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, Loader2, CheckCircle2, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Insurance {
  id: string;
  providerName: string;
  defaultCoveragePercentage: number;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/insurances').then(res => setInsurances(res.data)).catch(() => {});
  }, []);

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

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
          <User size={32} className="text-sky-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">My Profile</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-0.5">Manage your personal information</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
        <Shield size={12} />
        {user?.role}
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 sm:p-8 mb-6">
        <h2 className="font-bold text-slate-700 dark:text-gray-300 mb-5 text-sm uppercase tracking-wider">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">First Name</label>
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
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Last Name</label>
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
            <Phone size={11} /> Phone Number
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
            <Mail size={11} /> Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full border border-slate-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">Email cannot be changed</p>
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
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>

      {/* Insurance info card */}
      {insurances.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 sm:p-8">
          <h2 className="font-bold text-slate-700 dark:text-gray-300 mb-1 text-sm uppercase tracking-wider">Accepted Insurances in Musanze</h2>
          <p className="text-xs text-slate-400 dark:text-gray-600 mb-5">Pharmacies that accept these insurances will appear first in your search results.</p>
          <div className="space-y-2">
            {insurances.map(ins => (
              <div key={ins.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-200">{ins.providerName}</span>
                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 px-2 py-0.5 rounded-full">
                  {ins.defaultCoveragePercentage}% covered
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
