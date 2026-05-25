import { useState, useEffect } from 'react';
import {
  Clock, Shield, User, Save, Plus, Trash2, Pencil,
  CheckCircle, X, AlertCircle, ChevronLeft, ChevronRight, Package,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Insurance {
  id: string;
  providerName: string;
  defaultCoveragePercentage: number;
}

interface PharmacyInsurance {
  id: string;
  insuranceId: string;
  coveragePercentage: number | null;
  insurance: Insurance;
}

interface InvItem {
  id: string;
  stock: number;
  price: number;
  medicine: { id: string; name: string; category: string };
}

type SettingsTab = 'profile' | 'hours' | 'insurance';

const PAGE_SIZE = 8;

export default function PharmacistSettings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<SettingsTab>('profile');

  // Pharmacy state
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  // Profile form
  const [profile, setProfile] = useState({ name: '', address: '', phone: '', description: '' });

  // Hours form
  const [hours, setHours] = useState({ openingTime: 8, closingTime: 20 });

  // Insurance state
  const [allInsurances, setAllInsurances] = useState<Insurance[]>([]);
  const [pharmacyInsurances, setPharmacyInsurances] = useState<PharmacyInsurance[]>([]);
  const [insLoading, setInsLoading] = useState(false);
  const [addingIns, setAddingIns] = useState(false);
  const [newInsId, setNewInsId] = useState('');
  const [newInsCoverage, setNewInsCoverage] = useState<number>(85);
  const [editingInsId, setEditingInsId] = useState<string | null>(null);
  const [editCoverage, setEditCoverage] = useState<number>(85);

  // Per-insurance medicine coverage view
  const [viewingIns, setViewingIns] = useState<PharmacyInsurance | null>(null);
  const [invItems, setInvItems] = useState<InvItem[]>([]);
  const [invPage, setInvPage] = useState(1);
  const [invSearch, setInvSearch] = useState('');

  const pharmacyId = pharmacy?.id ?? user?.pharmacy?.id;

  /* ── Load pharmacy ── */
  useEffect(() => {
    if (!user?.pharmacy?.id) { setLoading(false); return; }
    api.get(`/pharmacies/${user.pharmacy.id}`)
      .then(res => {
        const p = res.data;
        setPharmacy(p);
        setProfile({ name: p.name ?? '', address: p.address ?? '', phone: p.phone ?? '', description: p.description ?? '' });
        setHours({ openingTime: p.openingTime ?? 8, closingTime: p.closingTime ?? 20 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/insurances').then(res => setAllInsurances(res.data)).catch(() => {});
  }, [user?.pharmacy?.id]);

  const loadPharmacyInsurances = async () => {
    if (!pharmacyId) return;
    setInsLoading(true);
    try {
      const res = await api.get(`/pharmacies/${pharmacyId}/insurances`);
      setPharmacyInsurances(res.data);
    } catch { }
    finally { setInsLoading(false); }
  };

  useEffect(() => {
    if (tab === 'insurance') loadPharmacyInsurances();
  }, [tab, pharmacyId]);

  /* ── Save profile ── */
  const saveProfile = async () => {
    setSaving(true); setSaveMsg(''); setSaveError('');
    try {
      await api.patch(`/pharmacies/${pharmacyId}`, profile);
      setSaveMsg(t('settings.profileUpdated', 'Profile updated!'));
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveError(t('settings.saveFailed', 'Failed to save.')); }
    finally { setSaving(false); }
  };

  /* ── Save hours ── */
  const saveHours = async () => {
    setSaving(true); setSaveMsg(''); setSaveError('');
    try {
      await api.patch(`/pharmacies/${pharmacyId}`, hours);
      setSaveMsg(t('settings.hoursUpdated', 'Hours updated!'));
      setTimeout(() => setSaveMsg(''), 3000);
    } catch { setSaveError(t('settings.saveFailed', 'Failed to save.')); }
    finally { setSaving(false); }
  };

  /* ── Insurance CRUD ── */
  const addInsurance = async () => {
    if (!newInsId) return;
    try {
      const res = await api.post(`/pharmacies/${pharmacyId}/insurances`, {
        insuranceId: newInsId,
        coveragePercentage: newInsCoverage,
      });
      setPharmacyInsurances(prev => [...prev, res.data]);
      setNewInsId(''); setNewInsCoverage(85); setAddingIns(false);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to add insurance'); }
  };

  const updateInsurance = async (insuranceId: string) => {
    try {
      await api.patch(`/pharmacies/${pharmacyId}/insurances/${insuranceId}`, { coveragePercentage: editCoverage });
      setPharmacyInsurances(prev => prev.map(pi => pi.insuranceId === insuranceId ? { ...pi, coveragePercentage: editCoverage } : pi));
      setEditingInsId(null);
    } catch { alert('Failed to update coverage'); }
  };

  const removeInsurance = async (insuranceId: string) => {
    if (!confirm(t('settings.removeInsuranceConfirm', 'Remove this insurance from your pharmacy?'))) return;
    try {
      await api.delete(`/pharmacies/${pharmacyId}/insurances/${insuranceId}`);
      setPharmacyInsurances(prev => prev.filter(pi => pi.insuranceId !== insuranceId));
      if (viewingIns?.insuranceId === insuranceId) setViewingIns(null);
    } catch { alert('Failed to remove insurance'); }
  };

  /* ── Per-insurance inventory view ── */
  const openInsuranceView = async (pi: PharmacyInsurance) => {
    setViewingIns(pi);
    setInvPage(1); setInvSearch('');
    try {
      const res = await api.get('/inventory');
      setInvItems(res.data);
    } catch { }
  };

  // Paginated + searched inventory for the insurance detail view
  const filteredInv = invItems.filter(i =>
    i.medicine.name.toLowerCase().includes(invSearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredInv.length / PAGE_SIZE);
  const pagedInv = filteredInv.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE);

  const inputCls = 'w-full border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-gray-800 dark:text-white';

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );

  if (!pharmacy) return (
    <div className="text-center py-16 text-slate-400">{t('common.noResults', 'No pharmacy found for your account.')}</div>
  );

  /* ── Insurance detail modal ── */
  if (viewingIns) {
    const pct = viewingIns.coveragePercentage ?? viewingIns.insurance?.defaultCoveragePercentage ?? 0;
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setViewingIns(null)} className="flex items-center gap-2 text-slate-500 hover:text-sky-600 text-sm font-semibold mb-6 transition-colors">
          <ChevronLeft size={16} /> Back to Insurance List
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <Shield size={20} className="text-sky-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{viewingIns.insurance?.providerName}</h2>
            <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-bold px-2.5 py-1 rounded-full">{pct}% coverage</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400 ml-8">
            Patients pay <strong>{100 - pct}%</strong> out-of-pocket for each medicine below.
          </p>
        </div>

        {/* Search + inventory list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="font-bold text-slate-700 dark:text-gray-200 text-sm uppercase tracking-wider flex items-center gap-2">
              <Package size={15} className="text-sky-500" /> {t('settings.inventoryTitle', 'Medicines in your inventory')}
            </h3>
            <input
              value={invSearch}
              onChange={e => { setInvSearch(e.target.value); setInvPage(1); }}
              placeholder={t('pharmacy.searchMedicines', 'Search medicines...')}
              className="border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white w-44"
            />
          </div>

          <div className="space-y-2">
            {pagedInv.map(inv => {
              const insuredPrice = Math.round(Number(inv.price) * (1 - pct / 100));
              return (
                <div key={inv.id} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{inv.medicine.name}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 capitalize">{inv.medicine.category?.toLowerCase()} · {inv.stock} in stock</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs line-through text-slate-400">{Number(inv.price).toLocaleString()} RWF</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{insuredPrice.toLocaleString()} RWF</p>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500">{pct}% {t('settings.covered', 'covered')}</p>
                  </div>
                </div>
              );
            })}
            {filteredInv.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">{t('pharmacy.noMedicinesFound', 'No medicines found.')}</p>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft size={16} className="text-slate-600 dark:text-gray-400" />
              </button>
              <span className="text-sm text-slate-600 dark:text-gray-400 font-medium">{invPage} / {totalPages}</span>
              <button onClick={() => setInvPage(p => Math.min(totalPages, p + 1))} disabled={invPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                <ChevronRight size={16} className="text-slate-600 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700 mb-6 w-fit">
        {([
          { key: 'profile', label: t('settings.profile', 'Profile'), icon: User },
          { key: 'hours', label: t('settings.hours', 'Hours'), icon: Clock },
          { key: 'insurance', label: t('settings.insurance', 'Insurance'), icon: Shield },
        ] as { key: SettingsTab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => { setTab(key); setSaveMsg(''); setSaveError(''); }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === key ? 'bg-white dark:bg-gray-900 shadow text-sky-600' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {saveMsg && <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl p-3 mb-4 text-sm"><CheckCircle size={15} />{saveMsg}</div>}
      {saveError && <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 mb-4 text-sm"><AlertCircle size={15} />{saveError}</div>}

      {/* ── Profile Tab ── */}
      {tab === 'profile' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">{t('settings.profile', 'Pharmacy Profile')}</h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">{t('settings.pharmacyName', 'Pharmacy Name')}</label>
                <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">{t('settings.phone', 'Phone Number')}</label>
                  <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">{t('settings.address', 'Address')}</label>
                <input value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">{t('settings.description', 'Description')}</label>
                <textarea value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })} className={inputCls} rows={3} />
              </div>

              <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 mt-4">
                <Save size={18} /> {saving ? t('common.saving', 'Saving...') : t('settings.saveProfile', 'Save Profile')}
              </button>
            </div>
        </div>
      )}

      {/* ── Hours Tab ── */}
      {tab === 'hours' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="text-sky-500" /> {t('settings.operatingHours', 'Operating Hours')}
            </h2>
            <div className="grid grid-cols-2 gap-6 max-w-md">
              {(['openingTime', 'closingTime'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 block">
                    {field === 'openingTime' ? t('settings.opensAt', 'Opens at') : t('settings.closesAt', 'Closes at')}
                  </label>
                  <select
                    value={hours[field]}
                    onChange={e => setHours(h => ({ ...h, [field]: +e.target.value }))}
                    className={inputCls}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-4">
              {t('settings.hoursNote', 'Your pharmacy will appear as Open between {{open}}:00 and {{close}}:00.', { open: hours.openingTime, close: hours.closingTime })}
            </p>

            <button onClick={saveHours} disabled={saving} className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center gap-2 mt-6">
              <Save size={18} /> {saving ? t('common.saving', 'Saving...') : t('settings.saveHours', 'Save Hours')}
            </button>
        </div>
      )}

      {/* ── Insurance Tab ── */}
      {tab === 'insurance' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="text-emerald-500" /> {t('settings.acceptedInsurances', 'Accepted Insurances')}
              </h2>
              <button onClick={() => setAddingIns(true)} className="flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/40 px-4 py-2 rounded-xl transition-colors">
                <Plus size={16} /> {t('settings.addInsurance', 'Add Insurance')}
              </button>
            </div>

            {addingIns && (
              <div className="bg-slate-50 dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 mb-6 flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('settings.insuranceProvider', 'Insurance Provider')}</label>
                  <select value={newInsId} onChange={e => setNewInsId(e.target.value)} className={inputCls}>
                    <option value="">{t('common.select', 'Select...')}</option>
                    {allInsurances.filter(ins => !pharmacyInsurances.some(pi => pi.insuranceId === ins.id))
                      .map(ins => <option key={ins.id} value={ins.id}>{ins.providerName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1 block">Coverage % for your pharmacy</label>
                  <input type="number" min="0" max="100" value={newInsCoverage} onChange={e => setNewInsCoverage(+e.target.value)} className={inputCls} />
                </div>
                <div className="flex gap-2">
                    <button onClick={addInsurance} disabled={!newInsId} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-lg text-sm font-semibold transition-colors">Add</button>
                    <button onClick={() => setAddingIns(false)} className="px-4 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                </div>
              </div>
            )}

          {insLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" /></div>
          ) : pharmacyInsurances.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-200 dark:border-gray-800 border-dashed">
                <p className="text-slate-400 dark:text-gray-500 text-sm">{t('settings.noInsurances', 'No insurances added yet. Click "Add Insurance" to get started.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pharmacyInsurances.map(pi => {
                const pct = pi.coveragePercentage ?? pi.insurance?.defaultCoveragePercentage ?? 0;
                const isEditing = editingInsId === pi.insuranceId;
                return (
                  <div key={pi.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center font-bold">
                        {pi.insurance?.providerName.charAt(0)}
                      </div>
                      <button
                        onClick={() => !isEditing && openInsuranceView(pi)}
                        className="text-left"
                      >
                        <h4 className="font-bold text-slate-800 dark:text-gray-200">{pi.insurance?.providerName}</h4>
                        <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1 cursor-pointer hover:text-emerald-500 transition-colors">
                          {t('settings.patientPays', 'Patients pay {{pct}}% out-of-pocket', { pct: 100 - pct })} &bull; <span className="underline">{t('settings.clickForDetails', 'View details')}</span>
                        </p>
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="0" max="100"
                          value={editCoverage}
                          onChange={e => setEditCoverage(+e.target.value)}
                          className="w-20 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                        />
                        <span className="text-xs text-slate-500">%</span>
                        <button onClick={() => updateInsurance(pi.insuranceId)} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"><CheckCircle size={13} /></button>
                        <button onClick={() => setEditingInsId(null)} className="px-2 py-1 border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"><X size={13} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-bold px-2.5 py-1 rounded-full">{pct}%</span>
                        <button onClick={() => { setEditingInsId(pi.insuranceId); setEditCoverage(Number(pct)); }} className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => removeInsurance(pi.insuranceId)} className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
