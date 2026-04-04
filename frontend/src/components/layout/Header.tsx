import { Pill } from 'lucide-react';
import type { UserMode, PatientView } from '../../types';

interface HeaderProps {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  currentView: PatientView;
  setCurrentView: (view: PatientView) => void;
}

export default function Header({ userMode, setUserMode, currentView, setCurrentView }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105" 
          onClick={() => {
             setCurrentView('landing');
             setUserMode('patient');
          }}
        >
          <div className="bg-[var(--color-brand-blue)] text-white p-2 rounded-lg">
            <Pill size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--color-text-charcoal)]">
            PharmaLocate <span className="text-[var(--color-brand-blue)]">Musanze</span>
          </span>
        </div>

        {/* Toggle Roles */}
        {currentView === 'landing' && (
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
            <button
              onClick={() => setUserMode('patient')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                userMode === 'patient'
                  ? 'bg-white shadow-md text-[var(--color-brand-blue)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => setUserMode('pharmacist')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                userMode === 'pharmacist'
                  ? 'bg-white shadow-md text-[var(--color-brand-blue)]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pharmacist
            </button>
            <button
              onClick={() => setUserMode('admin')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                userMode === 'admin'
                  ? 'bg-amber-50 shadow-md text-amber-600 border border-amber-200'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              Admin
            </button>
          </div>
        )}
        
      </div>
    </header>
  );
}
