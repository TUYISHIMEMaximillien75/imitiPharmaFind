import { CheckCircle, CheckCircle2, User, Loader2, FileImage, XCircle, ClipboardList } from 'lucide-react';
import type { Reservation } from '../../../types';

interface ReservationsTabProps {
  activeReservations: Reservation[];
  selectedReservation: Reservation | undefined;
  selectedReviewId: string | null;
  setSelectedReviewId: (id: string | null) => void;
  rejectingId: string | null;
  setRejectingId: (id: string | null) => void;
  rejectReason: string;
  setRejectReason: (r: string) => void;
  handleConfirmReservation: (id: string) => void;
  handleRejectAction: (id: string) => void;
  submitRejection: (id: string) => void;
}

export default function ReservationsTab({
  activeReservations, selectedReservation, selectedReviewId, setSelectedReviewId,
  rejectingId, setRejectingId, rejectReason, setRejectReason,
  handleConfirmReservation, handleRejectAction, submitRejection
}: ReservationsTabProps) {
  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List of Pending Reservations */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-800 pb-2 border-b border-slate-200">Pending Requests</h2>
        {activeReservations.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
            <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
            No pending reservations.
          </div>
        ) : (
          activeReservations.map(res => (
            <div 
              key={res.id} 
              onClick={() => { setSelectedReviewId(res.id); setRejectingId(null); }}
              className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedReviewId === res.id ? 'bg-sky-50 border-[var(--color-brand-blue)]' : 'bg-white border-slate-100 hover:border-sky-200'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-slate-800 flex items-center gap-2"><User size={16} className="text-slate-400"/> {res.patientName}</span>
                <span className="text-xs font-mono text-slate-400">{res.id}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2 truncate">{res.items.join(', ')}</p>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded inline-flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Requires Review
              </span>
            </div>
          ))
        )}
      </div>

      {/* Reservation Detail/Action Section */}
      <div className="lg:col-span-8">
        {selectedReservation ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Reviewing: {selectedReservation.id}
              </h2>
              <span className="text-sm font-semibold text-slate-500">
                Patient: {selectedReservation.patientName}
              </span>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              
              {/* Left: Image Box */}
              <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden h-96 relative flex items-center justify-center">
                <img 
                  src="/mock-prescription.png" 
                  alt="Prescription" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/400x600/e2e8f0/64748b?text=Prescription+Scan';
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm">
                  <FileImage size={14} /> Uploaded Slip
                </div>
              </div>

              {/* Right: Items and Actions */}
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-700 mb-4 px-2 tracking-wide uppercase text-xs">Requested Medicines</h3>
                <ul className="mb-6 space-y-2">
                  {selectedReservation.items.map((item, idx) => (
                    <li key={idx} className="bg-sky-50 px-4 py-3 rounded-lg text-slate-700 font-medium border border-sky-100 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500" /> {item}
                    </li>
                  ))}
                </ul>
                
                {selectedReservation.notes && (
                  <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 block mb-1">Patient Notes</span>
                    <p className="text-sm text-slate-700 italic">"{selectedReservation.notes}"</p>
                  </div>
                )}

                <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-3">
                  {rejectingId === selectedReservation.id ? (
                    <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in">
                      <label className="text-sm font-semibold text-slate-700">Reason for Rejection</label>
                      <select 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="bg-white border-2 border-red-200 focus:border-red-500 rounded-lg p-2 outline-none text-slate-700"
                      >
                        <option value="" disabled>Select a reason...</option>
                        <option value="Incorrect Details">Incorrect Details</option>
                        <option value="Prescription Expired">Prescription Expired</option>
                        <option value="Unreadable Image">Unreadable Image</option>
                        <option value="Items Out of Stock">Items Out of Stock</option>
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setRejectingId(null)} 
                          className="flex-1 bg-white border border-slate-300 text-slate-600 font-bold py-2 rounded-lg hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button 
                          disabled={!rejectReason}
                          onClick={() => submitRejection(selectedReservation.id)}
                          className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all flex justify-center items-center gap-1"
                        >
                          <XCircle size={18} /> Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => handleRejectAction(selectedReservation.id)}
                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle size={18} /> Reject
                      </button>
                      <button 
                        onClick={() => handleConfirmReservation(selectedReservation.id)}
                        className="flex-2 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
                      >
                        <CheckCircle size={18} /> Confirm Order
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white border border-slate-200 rounded-2xl border-dashed">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p>Select a pending reservation to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
