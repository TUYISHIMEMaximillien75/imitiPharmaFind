import { X, Stethoscope, FileText, Send, Hourglass } from 'lucide-react';
import type { Medicine, Pharmacy } from '../../types';

interface ReservationModalProps {
  selectedPharmacy: Pharmacy | null;
  closeReservationModal: () => void;
  reservationStatus: 'idle' | 'pending';
  medicines: Medicine[];
  pharmacistNotes: string;
  setPharmacistNotes: (notes: string) => void;
  sendReservationRequest: () => void;
}

export default function ReservationModal({
  selectedPharmacy, closeReservationModal, reservationStatus, medicines,
  pharmacistNotes, setPharmacistNotes, sendReservationRequest
}: ReservationModalProps) {
  if (!selectedPharmacy) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeReservationModal}></div>
      <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {reservationStatus === 'idle' ? (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Reservation Detail</h2>
              <button 
                onClick={closeReservationModal} 
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
                title="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white p-2 rounded-xl text-[var(--color-brand-blue)] shadow-sm">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedPharmacy.name}</p>
                  <p className="text-sm text-slate-500">Pick up in store</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500">Items Requested</span>
                <span className="font-bold text-slate-800">{medicines.length} Medicines</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500">Selected Insurance</span>
                <span className="font-bold text-[var(--color-brand-blue)]">RSSB (Mutuelle)</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-500">Estimated Total (You Pay)</span>
                <span className="font-bold text-xl text-slate-800">{selectedPharmacy.userPays.toLocaleString()} RWF</span>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText size={16} /> Notes to Pharmacist (Optional)
              </label>
              <textarea 
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                className="block w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-[var(--color-brand-blue)] focus:bg-white resize-none"
                rows={3}
                placeholder="e.g. Any specific brands preferred, or timing of pickup"
              ></textarea>
            </div>

            <button 
              onClick={sendReservationRequest}
              className="w-full bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all"
            >
              <Send size={20} /> Send Reservation Request
            </button>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[var(--color-brand-blue)] border-t-transparent animate-spin"></div>
              <Hourglass className="text-[var(--color-brand-blue)] animate-pulse" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Pending</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Your request is being reviewed by <b>{selectedPharmacy.name}</b>. Payment and final verification happen at the pharmacy.
            </p>
            <button 
              onClick={closeReservationModal}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl transition-colors"
            >
              Back to Search Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
