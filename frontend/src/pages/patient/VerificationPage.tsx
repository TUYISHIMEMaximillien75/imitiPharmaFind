import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Pencil, Trash2, Plus, Save, X, AlertCircle, ArrowLeft, ImageOff } from 'lucide-react';
import api, { BASE_URL } from '../../services/api';

interface Medicine { id: string; name: string }

export default function VerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { medicines?: Medicine[]; imageUrl?: string } | null;

  const [medicines, setMedicines] = useState<Medicine[]>(state?.medicines || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!state?.medicines) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-amber-500" />
        <p className="text-slate-600">No prescription data found. Please go back and upload one.</p>
        <Link to="/" className="px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold">Back to Search</Link>
      </div>
    );
  }

  const startEdit = (med: Medicine) => { setEditingId(med.id); setEditName(med.name); };
  const saveEdit = () => {
    setMedicines(medicines.map(m => m.id === editingId ? { ...m, name: editName } : m));
    setEditingId(null);
  };
  const deleteMed = (id: string) => setMedicines(medicines.filter(m => m.id !== id));
  const addMed = () => {
    const id = Date.now().toString();
    setMedicines([...medicines, { id, name: '' }]);
    setEditingId(id);
    setEditName('');
  };

  const handleConfirm = async () => {
    const validMeds = medicines.filter(m => m.name.trim());
    if (validMeds.length === 0) return;
    setIsSaving(true);
    try {
      if (state?.imageUrl) {
        await api.post('/prescriptions', {
          medicines: validMeds.map(m => m.name),
          imageUrl: state.imageUrl.replace(BASE_URL, ''),
        });
      }
    } catch { /* non-blocking */ }
    navigate('/search', { state: { medicines: validMeds.map(m => m.name) } });
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-500">
      <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-sky-600 mb-6 font-semibold transition-colors text-sm">
        <ArrowLeft size={16} /> Back to Search
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Verify Extracted Medicines</h1>
        <p className="text-slate-500 mt-2">We extracted these medicines from your prescription. Review and correct before searching.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prescription preview */}
        {state?.imageUrl && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-slate-200 dark:border-gray-800 shadow-sm">
            <h2 className="font-bold text-slate-700 dark:text-gray-300 mb-4 text-sm uppercase tracking-wider">Your Prescription</h2>
            <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 min-h-32 flex items-center justify-center">
              {imgError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-slate-400 dark:text-gray-500">
                  <ImageOff size={40} />
                  <p className="text-sm">Could not load prescription image.</p>
                  <a
                    href={state.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-sky-500 underline"
                  >
                    Open directly
                  </a>
                </div>
              ) : (
                <img
                  src={state.imageUrl}
                  alt="Prescription"
                  className="w-full object-contain max-h-80"
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Medicine list editor */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h2 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Extracted Medicines ({medicines.length})</h2>

          <div className="flex-1 space-y-2 mb-4">
            {medicines.map(med => (
              <div key={med.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 group hover:border-sky-200 transition-all">
                {editingId === med.id ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      className="flex-1 bg-transparent outline-none text-slate-800 text-sm"
                      placeholder="Medicine name..."
                    />
                    <button onClick={saveEdit} className="text-green-500 hover:text-green-700"><Save size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="text-sky-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-slate-800">{med.name || <em className="text-slate-400">Unnamed</em>}</span>
                    <button onClick={() => startEdit(med)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-500 transition-all"><Pencil size={14} /></button>
                    <button onClick={() => deleteMed(med.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}

            {medicines.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No medicines extracted. Add them manually below.
              </div>
            )}
          </div>

          <button
            onClick={addMed}
            className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-semibold mb-4 transition-colors"
          >
            <Plus size={16} /> Add medicine manually
          </button>

          <button
            id="confirm-verify-btn"
            onClick={handleConfirm}
            disabled={medicines.filter(m => m.name.trim()).length === 0 || isSaving}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle size={18} /> Confirm & Search Pharmacies</>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
