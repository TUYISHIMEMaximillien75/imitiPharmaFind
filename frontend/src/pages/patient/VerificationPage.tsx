import { Camera, AlertTriangle, ArrowLeft, Save, Trash2, Edit2, PlusCircle, CheckCircle, Search } from 'lucide-react';
import type { Medicine, PatientView } from '../../types';

interface VerificationPageProps {
  setCurrentView: (view: PatientView) => void;
  medicines: Medicine[];
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  isConfirmed: boolean;
  setIsConfirmed: (val: boolean) => void;
  handleEdit: (med: Medicine) => void;
  saveEdit: () => void;
  handleDelete: (id: string) => void;
  handleAddNew: () => void;
  uploadedImageUrl: string | null;
  handleConfirm: () => void;
}

export default function VerificationPage({
  setCurrentView, medicines, editingId,
  editName, setEditName, isConfirmed, setIsConfirmed,
  handleEdit, saveEdit, handleDelete, handleAddNew,
  uploadedImageUrl, handleConfirm
}: VerificationPageProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in zoom-in-95 duration-300">
      <button 
        onClick={() => setCurrentView('landing')}
        className="flex items-center gap-2 text-slate-500 hover:text-[var(--color-brand-blue)] mb-6 font-semibold transition-colors"
      >
        <ArrowLeft size={20} /> Back to Search
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Camera className="text-[var(--color-brand-blue)]" size={24} />
            Uploaded Prescription
          </h2>
          <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative group">
            <img 
              src={uploadedImageUrl || "/mock-prescription.png"} 
              alt="Prescription Scan" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://placehold.co/600x800/e2e8f0/64748b?text=Prescription+Scan';
              }}
            />
            <div className="absolute inset-0 bg-sky-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/90 backdrop-blur text-sm font-semibold px-4 py-2 rounded-full shadow-lg text-slate-700">Scan Analyzed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Extracted Medicines</h2>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 mb-8 shadow-sm">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-amber-900">⚠️ Please verify extracted names</h3>
              <p className="text-sm mt-1 opacity-90">Auto-extraction may have errors due to handwriting. Review and correct the list below.</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {medicines.map((med) => (
              <div key={med.id} className="group bg-slate-50 hover:bg-sky-50 transition-colors border border-slate-200 hover:border-sky-200 rounded-xl p-4 flex items-center justify-between">
                {editingId === med.id ? (
                  <div className="flex-1 flex gap-2 w-full">
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-2 border-2 border-[var(--color-brand-blue)] rounded-lg focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <button onClick={saveEdit} className="bg-[var(--color-brand-blue)] text-white p-2 rounded-lg hover:bg-[var(--color-brand-blue-hover)]">
                      <Save size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center border border-slate-200 text-slate-400">
                        <CheckCircle size={16} />
                      </div>
                      <span className="font-medium text-lg text-slate-700">{med.name || <span className="text-slate-400 italic">Empty Name</span>}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(med)}
                        className="p-2 text-slate-500 hover:text-[var(--color-brand-blue)] hover:bg-sky-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <button 
              onClick={handleAddNew}
              className="w-full mt-4 py-4 border-2 border-dashed border-slate-300 hover:border-[var(--color-brand-blue)] text-slate-500 hover:text-[var(--color-brand-blue)] rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors bg-white hover:bg-sky-50"
            >
              <PlusCircle size={20} /> Add New Medicine
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer group mb-6">
              <div className="relative flex items-center justify-center mt-1">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                />
                <div className="w-6 h-6 border-2 border-slate-300 rounded-md peer-checked:bg-[var(--color-brand-blue)] peer-checked:border-[var(--color-brand-blue)] transition-colors flex items-center justify-center group-hover:border-[var(--color-brand-blue)]">
                  {isConfirmed && <CheckCircle size={16} className="text-white" />}
                </div>
              </div>
              <div>
                <span className="text-slate-800 font-semibold block">I confirm this list matches my prescription</span>
                <span className="text-sm text-slate-500 block">By checking this box, you agree that PharmaLocate Musanze will search for these exact items.</span>
              </div>
            </label>

            <button 
              disabled={!isConfirmed || medicines.length === 0}
              onClick={handleConfirm}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-brand-blue)] text-white hover:bg-[var(--color-brand-blue-hover)] focus:ring-4 focus:ring-sky-200"
            >
              <Search size={20} /> Find Pharmacies Map
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
