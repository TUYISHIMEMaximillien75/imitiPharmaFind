import { ArrowLeft, MapPin, Filter, CheckCircle2, XCircle, Clock, Pill, CreditCard, ChevronRight } from 'lucide-react';
import type { Medicine, Pharmacy, PatientView } from '../../types';

interface SearchResultsPageProps {
  setCurrentView: (view: PatientView) => void;
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  checkIsOpen: (p: Pharmacy) => boolean;
  handleReserveClick: (pharmacy: Pharmacy) => void;
}

export default function SearchResultsPage({
  setCurrentView, medicines, pharmacies, checkIsOpen, handleReserveClick
}: SearchResultsPageProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in slide-in-from-bottom flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <button 
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 text-slate-500 hover:text-[var(--color-brand-blue)] mb-2 font-semibold transition-colors text-sm"
          >
            <ArrowLeft size={16} /> New Search
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Search Results</h1>
          <p className="text-slate-500 flex items-center gap-1 mt-1 font-medium">
            <MapPin size={16} /> Top 3 Nearest Pharmacies in Musanze
          </p>
        </div>
        
        <div className="hidden sm:flex items-center gap-4 text-sm font-semibold bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200">
           <span className="flex items-center gap-2 text-slate-600"><Filter size={18} className="text-[var(--color-brand-blue)]" /> Filter By:</span>
           <select className="bg-transparent text-slate-800 focus:outline-none cursor-pointer">
             <option>Distance</option>
             <option>Price</option>
             <option>Availability</option>
           </select>
        </div>
      </div>

      <div className="flex justify-between items-center bg-sky-50 p-4 rounded-2xl border border-sky-100">
        <span className="text-slate-700 font-semibold">Medicines Searched:</span>
        <span className="text-[var(--color-brand-blue)] font-bold">{medicines.length} Item(s)</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pharmacies.map((pharmacy) => {
          const isOpen = checkIsOpen(pharmacy);
          return (
            <div key={pharmacy.id} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 hover:border-sky-200 transition-all hover:-translate-y-1">
              
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between mb-6 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-800">{pharmacy.name}</h2>
                    {isOpen ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wide">
                        <CheckCircle2 size={14} /> Open
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wide">
                        <XCircle size={14} /> Closed
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium flex items-center gap-1">
                    <MapPin size={16} className="text-slate-400" /> {pharmacy.distance} km away
                    <span className="mx-2 text-slate-300">|</span>
                    <Clock size={16} className="text-slate-400" /> {pharmacy.openTime === 0 && pharmacy.closeTime === 24 ? '24/7' : `${pharmacy.openTime}:00 - ${pharmacy.closeTime}:00`}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-inner">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${pharmacy.medsAvailable === pharmacy.medsTotal ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Pill size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Medicine Match</span>
                    <span className={`text-xl font-bold ${pharmacy.medsAvailable === pharmacy.medsTotal ? 'text-green-600' : 'text-amber-600'}`}>
                      {pharmacy.medsAvailable}/{pharmacy.medsTotal} Available
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-full sm:w-auto">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Estimated Co-payment
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-sm bg-slate-50 py-3 px-4 rounded-xl border border-slate-100/50">
                    <span className="text-slate-600">Price: <b className="text-slate-800">{pharmacy.priceTotal.toLocaleString()} RWF</b></span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="text-green-600">Insurance Pays: <b>{pharmacy.insurancePays.toLocaleString()} RWF</b></span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="text-[var(--color-brand-blue)]">You Pay: <b className="text-lg">{pharmacy.userPays.toLocaleString()} RWF</b></span>
                  </div>
                </div>

                <button 
                  onClick={() => handleReserveClick(pharmacy)}
                  className="w-full sm:w-auto shrink-0 bg-slate-800 hover:bg-[var(--color-brand-blue)] text-white px-8 py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  Reserve Items <ChevronRight size={20} />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </main>
  );
}
