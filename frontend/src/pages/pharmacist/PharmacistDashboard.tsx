import { useState, useEffect, useRef } from 'react';
import { Package, ClipboardList, Plus, Search, Pencil, Trash2, Save, X, CheckCircle, XCircle, AlertCircle, RefreshCw, Bell, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import PharmacistSettings from './PharmacistSettings';
import { useAuth } from '../../context/AuthContext';

/* ─── Types ─── */
interface InvItem {
  id: string;
  stock: number;
  price: number;
  lowStockThreshold: number;
  expiryDate?: string;
  medicine: { id: string; name: string; category: string };
}

interface ReservationItem { id: string; quantity: number; priceAtReservation: number; medicine: { name: string } }
interface Reservation {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  patient: { email: string; firstName?: string; lastName?: string };
  items: ReservationItem[];
}
interface Medicine { id: string; name: string; category: string }

/* ─── Component ─── */
export default function PharmacistDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'inventory' | 'reservations' | 'settings'>('inventory');

  /* Inventory state */
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState('');

  /* Edit / Add state */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ stock: 0, price: 0, lowStockThreshold: 10, expiryDate: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFields, setAddFields] = useState({ medicineId: '', stock: 0, price: 0, expiryDate: '', lowStockThreshold: 10 });
  // For creating a brand-new medicine from the dashboard (Issue #3)
  const [creatingMedicine, setCreatingMedicine] = useState(false);
  const [newMedFields, setNewMedFields] = useState({ name: '', category: 'OTHER', description: '' });
  const [newMedLoading, setNewMedLoading] = useState(false);
  // Per-insurance coverage % map for new medicine creation
  const [newMedInsurances, setNewMedInsurances] = useState<Record<string, number>>({});

  // Pharmacy insurances for coverage assignment in new medicine form
  const [pharmacyInsurances, setPharmacyInsurances] = useState<any[]>([]);

  /* Reservations state */
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resLoading, setResLoading] = useState(true);
  const [resError, setResError] = useState('');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* Pagination */
  const [resPage, setResPage] = useState(1);
  const [hasMoreRes, setHasMoreRes] = useState(true);

  /* Polling ref */
  const knownPendingIds = useRef<Set<string>>(new Set());
  const [newPendingCount, setNewPendingCount] = useState(0);

  /* ── Fetch ── */
  const fetchInventory = async () => {
    setInvLoading(true);
    try {
      const [invRes, medRes] = await Promise.all([api.get('/inventory'), api.get('/medicines')]);
      setInventory(invRes.data);
      setAllMedicines(medRes.data);
    } catch { setInvError('Failed to load inventory'); }
    finally { setInvLoading(false); }
  };

  const fetchReservations = async (page = 1, append = false) => {
    if (page === 1) setResLoading(true);
    try {
      const res = await api.get(`/reservations?page=${page}&limit=10`);
      const incoming: Reservation[] = res.data;

      // Detect new PENDING reservations for notification
      const newPending = incoming.filter(
        r => r.status === 'PENDING' && !knownPendingIds.current.has(r.id),
      );
      newPending.forEach(r => knownPendingIds.current.add(r.id));
      if (newPending.length > 0 && page === 1 && knownPendingIds.current.size > newPending.length) {
        setNewPendingCount(c => c + newPending.length);
      } else {
        // First load — seed the known set silently
        incoming.filter(r => r.status === 'PENDING').forEach(r => knownPendingIds.current.add(r.id));
      }

      setReservations(prev => append ? [...prev, ...incoming] : incoming);
      setHasMoreRes(incoming.length === 10);
    } catch { setResError('Failed to load reservations'); }
    finally { setResLoading(false); }
  };

  useEffect(() => {
    fetchInventory();
    fetchReservations(1);

    // Load pharmacy insurances for the new medicine form
    if (user?.pharmacy?.id) {
      api.get(`/pharmacies/${user.pharmacy.id}/insurances`)
        .then(res => setPharmacyInsurances(res.data))
        .catch(() => {});
    }

    // Poll reservations every 30 s for new PENDING items
    const poll = setInterval(() => fetchReservations(1), 30_000);
    return () => clearInterval(poll);
  }, []);


  const pendingCount = reservations.filter(r => r.status === 'PENDING').length;
  const filtered = inventory.filter(i => i.medicine.name.toLowerCase().includes(searchTerm.toLowerCase()));

  /* ── Inventory actions ── */
  const startEdit = (item: InvItem) => {
    setEditingId(item.id);
    setEditFields({ stock: item.stock, price: item.price, lowStockThreshold: item.lowStockThreshold, expiryDate: item.expiryDate?.split('T')[0] || '' });
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/inventory/${id}`, editFields);
      setInventory(inventory.map(i => i.id === id ? { ...i, ...editFields } : i));
      setEditingId(null);
    } catch { alert('Failed to save'); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Remove this medicine from your inventory?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setInventory(inventory.filter(i => i.id !== id));
    } catch { alert('Failed to remove'); }
  };

  const addItem = async () => {
    try {
      const res = await api.post('/inventory', addFields);
      setInventory([...inventory, res.data]);
      setShowAddForm(false);
      setAddFields({ medicineId: '', stock: 0, price: 0, expiryDate: '', lowStockThreshold: 10 });
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add medicine'); }
  };

  // Issue #3 — create a new medicine in the global catalogue then add to inventory
  const createAndAddMedicine = async () => {
    if (!newMedFields.name.trim()) return;
    setNewMedLoading(true);
    try {
      const medRes = await api.post('/medicines', newMedFields);
      const created = medRes.data;
      // Refresh medicines list
      setAllMedicines(prev => [...prev, created]);
      // Pre-select the new medicine
      setAddFields(f => ({ ...f, medicineId: created.id }));

      // Save per-insurance coverage overrides for this pharmacy
      const pharmacyId = user?.pharmacy?.id;
      if (pharmacyId) {
        const overrides = Object.entries(newMedInsurances);
        await Promise.all(
          overrides.map(([insuranceId, pct]) =>
            api.patch(`/pharmacies/${pharmacyId}/insurances/${insuranceId}`, { coveragePercentage: pct })
          )
        );
      }

      setCreatingMedicine(false);
      setNewMedFields({ name: '', category: 'OTHER', description: '' });
      setNewMedInsurances({});
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to create medicine'); }
    finally { setNewMedLoading(false); }
  };

  /* ── Reservation actions ── */
  const confirmReservation = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/reservations/${id}/confirm`);
      setReservations(reservations.map(r => r.id === id ? { ...r, status: 'CONFIRMED' } : r));
      setSelectedRes(null);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const rejectReservation = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessingId(id);
    try {
      await api.patch(`/reservations/${id}/reject`, { reason: rejectReason });
      setReservations(reservations.map(r => r.id === id ? { ...r, status: 'REJECTED', rejectionReason: rejectReason } : r));
      setRejectingId(null); setSelectedRes(null); setRejectReason('');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const completeReservation = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/reservations/${id}/complete`);
      setReservations(reservations.map(r => r.id === id ? { ...r, status: 'COMPLETED' } : r));
      setSelectedRes(null);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setProcessingId(null); }
  };

  const cellBase = "px-4 py-3 text-sm text-slate-700 dark:text-gray-300";
  const inputClass = "border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-gray-800 dark:text-white";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl border border-slate-200 dark:border-gray-700">
          {(['inventory', 'reservations', 'settings'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 capitalize
                ${activeTab === tab ? 'bg-white dark:bg-gray-900 shadow text-sky-600' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}>
              {tab === 'inventory' ? <Package size={16} /> : tab === 'reservations' ? <ClipboardList size={16} /> : <Settings size={16} />}
              {tab === 'inventory' ? t('dashboard.inventory') : tab === 'reservations' ? t('dashboard.reservations') : t('dashboard.settings')}
              {tab === 'reservations' && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ INVENTORY TAB ═══ */}
      {activeTab === 'inventory' && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('dashboard.searchInventory')} className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
            </div>
            <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors">
              <Plus size={16} /> {t('dashboard.addMedicine')}
            </button>
            <button onClick={fetchInventory} className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Add Medicine Form */}
          {showAddForm && (
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-5 mb-5">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Plus size={16} className="text-sky-500" /> {t('dashboard.addMedicine')}</h3>

              {/* Toggle: pick existing vs create new */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setCreatingMedicine(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !creatingMedicine ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-gray-700'
                  }`}>{t('dashboard.pickExisting')}</button>
                <button onClick={() => setCreatingMedicine(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    creatingMedicine ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-400 border-slate-200 dark:border-gray-700'
                  }`}>+ New Medicine</button>
              </div>

              {creatingMedicine ? (
                // Issue #3 — create new medicine + assign insurance coverage
                <div className="space-y-3 mb-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">Create New Medicine</h4>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Medicine Name *</label>
                    <input value={newMedFields.name} onChange={e => setNewMedFields(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Doxycycline 100mg" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Category</label>
                    <select value={newMedFields.category} onChange={e => setNewMedFields(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                      {['ANTIBIOTIC','PAINKILLER','VITAMIN','ANTIFUNGAL','ANTIVIRAL','CARDIOVASCULAR','DIABETIC','RESPIRATORY','GASTROINTESTINAL','DERMATOLOGICAL','OTHER'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Description (optional)</label>
                    <input value={newMedFields.description} onChange={e => setNewMedFields(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description..." className={inputClass} />
                  </div>

                  {/* Insurance Coverage Assignment */}
                  {pharmacyInsurances.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-gray-700 pt-3">
                      <label className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2 block">Insurance Coverage for this Medicine</label>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500 mb-3">Set the coverage % each of your insurances will cover for this medicine.</p>
                      <div className="space-y-2">
                        {pharmacyInsurances.map(pi => {
                          const defaultPct = pi.coveragePercentage ?? pi.insurance?.defaultCoveragePercentage ?? 0;
                          return (
                            <div key={pi.insuranceId} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-gray-700">
                              <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex-1">{pi.insurance?.providerName}</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number" min="0" max="100"
                                  value={newMedInsurances[pi.insuranceId] ?? defaultPct}
                                  onChange={e => setNewMedInsurances(prev => ({ ...prev, [pi.insuranceId]: +e.target.value }))}
                                  className="w-16 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-gray-800 dark:text-white"
                                />
                                <span className="text-xs text-slate-400">%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button onClick={createAndAddMedicine} disabled={newMedLoading || !newMedFields.name.trim()}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-semibold transition-colors">
                    {newMedLoading ? 'Creating...' : 'Create & Select'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Medicine</label>
                    <select value={addFields.medicineId} onChange={e => setAddFields({ ...addFields, medicineId: e.target.value })} className={inputClass}>
                      <option value="">Select medicine...</option>
                      {allMedicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Stock (units)</label>
                    <input type="number" min="0" value={addFields.stock} onChange={e => setAddFields({ ...addFields, stock: +e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Price (RWF)</label>
                    <input type="number" min="0" value={addFields.price} onChange={e => setAddFields({ ...addFields, price: +e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Expiry Date</label>
                    <input type="date" value={addFields.expiryDate} onChange={e => setAddFields({ ...addFields, expiryDate: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Low Stock Alert</label>
                    <input type="number" min="1" value={addFields.lowStockThreshold} onChange={e => setAddFields({ ...addFields, lowStockThreshold: +e.target.value })} className={inputClass} />
                  </div>
                </div>
              )}

              {!creatingMedicine && (
                <div className="flex gap-2 mt-4">
                  <button onClick={addItem} disabled={!addFields.medicineId} className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white rounded-lg text-sm font-semibold transition-colors">Add to Inventory</button>
                  <button onClick={() => { setShowAddForm(false); setCreatingMedicine(false); }} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                </div>
              )}
              {creatingMedicine && (
                <button onClick={() => { setShowAddForm(false); setCreatingMedicine(false); }} className="mt-2 px-4 py-2 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              )}
            </div>
          )}

          {invError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4"><AlertCircle size={16} />{invError}</div>}

          {invLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-800 text-slate-500 dark:text-gray-500 text-xs uppercase tracking-wider bg-slate-50 dark:bg-gray-800">
                    <th className="p-4">Medicine</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Price (RWF)</th>
                    <th className="p-4">Expiry</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                  {filtered.map(item => {
                    const isLow = item.stock <= item.lowStockThreshold && item.stock > 0;
                    const isOut = item.stock === 0;
                    const editing = editingId === item.id;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${isOut ? 'opacity-60' : ''}`}>
                        <td className={cellBase}>
                          <p className="font-semibold text-slate-800 dark:text-white">{item.medicine.name}</p>
                          <p className="text-xs text-slate-400 dark:text-gray-500 capitalize">{item.medicine.category?.toLowerCase()}</p>
                        </td>
                        <td className={cellBase}>
                          {editing ? (
                            <input type="number" min="0" value={editFields.stock} onChange={e => setEditFields({ ...editFields, stock: +e.target.value })} className={`${inputClass} w-20`} />
                          ) : (
                            <div>
                              <span className={`font-bold text-lg ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-slate-800'}`}>{item.stock}</span>
                              {isLow && !isOut && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">LOW</span>}
                              {isOut && <span className="ml-2 text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">OUT</span>}
                            </div>
                          )}
                        </td>
                        <td className={cellBase}>
                          {editing ? (
                            <input type="number" min="0" value={editFields.price} onChange={e => setEditFields({ ...editFields, price: +e.target.value })} className={`${inputClass} w-24`} />
                          ) : (
                            <span className="font-semibold">{Number(item.price).toLocaleString()}</span>
                          )}
                        </td>
                        <td className={cellBase}>
                          {editing ? (
                            <input type="date" value={editFields.expiryDate} onChange={e => setEditFields({ ...editFields, expiryDate: e.target.value })} className={`${inputClass} w-36`} />
                          ) : item.expiryDate ? (
                            <span className={`text-sm ${new Date(item.expiryDate) < new Date() ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                              {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className={`${cellBase} text-right`}>
                          {editing ? (
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => saveEdit(item.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-colors"><Save size={12} /> Save</button>
                              <button onClick={() => setEditingId(null)} className="px-2 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs hover:bg-slate-50 transition-colors"><X size={12} /></button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => startEdit(item)} className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"><Pencil size={12} /> Edit</button>
                              <button onClick={() => deleteItem(item.id)} className="flex items-center gap-1 px-2 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">No medicines found. Add some to your inventory.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {activeTab === 'settings' && <PharmacistSettings />}

      {/* ═══ RESERVATIONS TAB ═══ */}
      {activeTab === 'reservations' && (
        <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-600 text-sm font-medium">{reservations.length} total reservations</p>
          <div className="flex items-center gap-2">
            {newPendingCount > 0 && (
              <button
                onClick={() => setNewPendingCount(0)}
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold animate-bounce"
              >
                <Bell size={12} />
                {newPendingCount} new reservation{newPendingCount > 1 ? 's' : ''} — tap to dismiss
              </button>
            )}
            <button onClick={() => fetchReservations(1)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

          {resError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4"><AlertCircle size={16} />{resError}</div>}

          {resLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {reservations.map(r => (
                <div key={r.id} onClick={() => { setSelectedRes(r); setRejectingId(null); setRejectReason(''); }}
                  className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md dark:hover:shadow-gray-900/50 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 dark:text-white">{r.patient.firstName || r.patient.email} {r.patient.lastName || ''}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">{r.items.length} medicine(s) · {new Date(r.createdAt).toLocaleString()}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.items.map(i => (
                          <span key={i.id} className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{i.medicine.name} ×{i.quantity}</span>
                        ))}
                      </div>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white shrink-0">{Number(r.totalAmount).toLocaleString()} RWF</p>
                  </div>
                </div>
              ))}
              {reservations.length === 0 && (
                <div className="text-center py-16 text-slate-400">No reservations yet for your pharmacy.</div>
              )}
              {hasMoreRes && reservations.length > 0 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => { const next = resPage + 1; setResPage(next); fetchReservations(next, true); }}
                    className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Reservation Detail Modal ─── */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRes(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-gray-950/80 border border-slate-100 dark:border-gray-800 w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-800">{selectedRes.patient.firstName} {selectedRes.patient.lastName}</p>
                <p className="text-xs text-slate-400">{selectedRes.patient.email}</p>
              </div>
              <button onClick={() => setSelectedRes(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X size={16} /></button>
            </div>

            <StatusBadge status={selectedRes.status} />

            <div className="mt-4 space-y-1.5 mb-4">
              {selectedRes.items.map(i => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-slate-700">{i.medicine.name} ×{i.quantity}</span>
                  <span className="font-semibold">{(i.priceAtReservation * i.quantity).toLocaleString()} RWF</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-sky-600">{Number(selectedRes.totalAmount).toLocaleString()} RWF</span>
              </div>
            </div>

            {selectedRes.notes && (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3 mb-4">📝 {selectedRes.notes}</p>
            )}

            {selectedRes.status === 'PENDING' && (
              rejectingId === selectedRes.id ? (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Explain the rejection reason (required)..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => rejectReservation(selectedRes.id)} disabled={!rejectReason.trim() || processingId === selectedRes.id}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                      {processingId === selectedRes.id ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button onClick={() => setRejectingId(null)} className="px-4 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setRejectingId(selectedRes.id)}
                    className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 font-semibold py-2.5 rounded-xl text-sm transition-all">
                    <XCircle size={16} /> Reject
                  </button>
                  <button onClick={() => confirmReservation(selectedRes.id)} disabled={processingId === selectedRes.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                    <CheckCircle size={16} /> {processingId ? '...' : 'Confirm'}
                  </button>
                </div>
              )
            )}

            {selectedRes.status === 'CONFIRMED' && (
              <button
                onClick={() => completeReservation(selectedRes.id)}
                disabled={processingId === selectedRes.id}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
              >
                <CheckCircle size={16} />
                {processingId === selectedRes.id ? 'Processing...' : 'Mark as Completed (Picked Up)'}
              </button>
            )}

          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:   'bg-amber-50  dark:bg-amber-900/30 border-amber-200  dark:border-amber-800 text-amber-600  dark:text-amber-400',
    CONFIRMED: 'bg-green-50  dark:bg-green-900/30 border-green-200  dark:border-green-800 text-green-600  dark:text-green-400',
    REJECTED:  'bg-red-50    dark:bg-red-900/30   border-red-200    dark:border-red-800   text-red-600    dark:text-red-400',
    COMPLETED: 'bg-sky-50    dark:bg-sky-900/30   border-sky-200    dark:border-sky-800   text-sky-600    dark:text-sky-400',
    CANCELLED: 'bg-slate-50  dark:bg-gray-800     border-slate-200  dark:border-gray-700  text-slate-500  dark:text-gray-500',
  };
  return (
    <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full border ${map[status] || map.PENDING}`}>
      {status}
    </span>
  );
}
