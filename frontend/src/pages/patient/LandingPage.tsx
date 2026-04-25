import { Search, Camera, MapPin, Filter, CalendarCheck, Stethoscope } from 'lucide-react';
import type { PatientView } from '../../types';

interface LandingPageProps {
  setCurrentView: (view: PatientView) => void;
  onFileSelected: (file: File) => void;
}

export default function LandingPage({ setCurrentView, onFileSelected }: LandingPageProps) {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 animate-in fade-in duration-500">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-800">
            Find the Medicines You Need, <br className="hidden md:block" />
            <span className="text-[var(--color-brand-blue)]">Fast & Nearby.</span>
          </h1>
          <p className="text-lg text-slate-500 mb-8 leading-relaxed">
            Quickly locate pharmacies in Musanze that have your prescribed medicines in stock, accept your insurance, and are currently open.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center transition-all hover:shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Search className="text-[var(--color-brand-blue)]" size={24} />
              Search by Medicine Name
            </h2>
            <p className="text-slate-500 mb-6 text-sm">Type the names of the medicines you are looking for.</p>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-[var(--color-brand-blue)] transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-32 py-5 border-2 border-slate-200 rounded-2xl leading-5 bg-slate-50 focus:outline-none focus:bg-white focus:ring-0 focus:border-[var(--color-brand-blue)] sm:text-lg transition-all"
                placeholder="e.g. Paracetamol, Amoxicillin..."
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                <button 
                  onClick={() => setCurrentView('results')} 
                  className="bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue-hover)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-sky-500/30"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><MapPin size={14}/> Location Access Required</span>
              <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Stethoscope size={14}/> Insurance Filters Available</span>
            </div>
          </div>

          <div 
            className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center flex flex-col justify-center relative overflow-hidden group hover:border-sky-300 transition-colors cursor-pointer"
            onClick={() => document.getElementById('prescription-upload')?.click()}
          >
            <input 
              type="file" 
              id="prescription-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileSelected(e.target.files[0]);
                }
              }} 
            />
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-sky-100 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="mx-auto bg-sky-50 text-[var(--color-brand-blue)] w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[var(--color-brand-blue)] group-hover:text-white transition-all duration-300 shadow-inner">
              <Camera size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold mb-2">Upload Prescription</h2>
            <p className="text-slate-500 text-sm mb-6 relative z-10">
              Have a doctor's note? Snap a picture and we'll extract the medicines for you.
            </p>
            <div className="w-full bg-slate-800 group-hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl transition-colors relative z-10">
              Choose Image
            </div>
          </div>
        </div>
      </main>

      <section className="bg-white border-t border-slate-100 py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">We make it incredibly simple to find exactly what you need.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <Search className="text-[var(--color-brand-blue)]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Search & Upload</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Type the medicines you need or simply take a photo of your medical prescription.</p>
            </div>
            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <Filter className="text-[var(--color-brand-blue)]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Filter & Compare</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Filter results by nearby open pharmacies, availability, and insurance acceptance.</p>
            </div>
            <div className="text-center group">
              <div className="mx-auto w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <CalendarCheck className="text-[var(--color-brand-blue)]" size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Optional Reservation</h3>
              <p className="text-slate-500 text-sm leading-relaxed">See real-time prices and optionally reserve your medicines to ensure they are waiting.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
