import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, MapPin, Filter, CalendarCheck, Stethoscope, Plus, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchText, setSearchText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addTag = () => {
    const val = searchText.trim();
    if (val && !tags.includes(val)) setTags([...tags, val]);
    setSearchText('');
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  };

  const handleSearch = () => {
    const allMeds = [...tags, ...(searchText.trim() ? [searchText.trim()] : [])];
    if (allMeds.length === 0) return;
    navigate('/search', { state: { medicines: allMeds } });
  };

  const handleFileSelected = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/prescriptions/temp-verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/verify', {
        state: {
          medicines: res.data.medicines.map((name: string, i: number) => ({ id: `${Date.now()}-${i}`, name })),
          imageUrl: `http://localhost:3000${res.data.imageUrl}`,
        },
      });
    } catch {
      alert('Could not process prescription. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 animate-in fade-in duration-500">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-800 dark:text-white">
            Find the Medicines You Need,{' '}
            <br className="hidden md:block" />
            <span className="text-sky-500">Fast &amp; Nearby.</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
            Locate pharmacies in Musanze with your medicines in stock, open right now, and accepting your insurance.
          </p>
          {!isAuthenticated && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate('/register')} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20">
                Get Started Free
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-3 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all">
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Search Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Text Search */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-gray-950/40 border border-slate-100 dark:border-gray-800 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
              <Search className="text-sky-500" size={24} /> Search by Medicine Name
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mb-5 text-sm">Type medicine names (press Enter after each) and hit Search.</p>

            {/* Tag input */}
            <div className="border-2 border-slate-200 dark:border-gray-700 focus-within:border-sky-500 rounded-2xl bg-slate-50 dark:bg-gray-800 focus-within:bg-white dark:focus-within:bg-gray-900 transition-all p-3 min-h-14">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 text-sm px-3 py-1 rounded-full font-medium">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-sky-900 dark:hover:text-sky-200"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="medicine-search-input"
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tags.length === 0 ? 'e.g. Paracetamol, Amoxicillin...' : 'Add another...'}
                  className="flex-1 bg-transparent outline-none text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 text-sm"
                />
                {searchText && (
                  <button onClick={addTag} className="text-sky-500 hover:text-sky-700 text-xs font-bold flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                id="search-btn"
                onClick={handleSearch}
                disabled={tags.length === 0 && !searchText.trim()}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 py-3 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/20"
              >
                Search Nearby Pharmacies
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-gray-500">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <MapPin size={13} /> Auto-detect location
              </span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Stethoscope size={13} /> Insurance filters
              </span>
            </div>
          </div>

          {/* Prescription Upload */}
          <div
            className={`bg-gradient-to-br from-white dark:from-gray-900 to-slate-50 dark:to-gray-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-gray-950/40 border border-slate-100 dark:border-gray-800 text-center flex flex-col justify-center relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors ${isUploading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-sky-100 dark:bg-sky-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="mx-auto bg-sky-50 dark:bg-sky-900/30 text-sky-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-inner">
              {isUploading ? (
                <div className="w-8 h-8 border-3 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={36} strokeWidth={2} />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2 relative z-10 text-slate-800 dark:text-white">Upload Prescription</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 relative z-10">
              {isUploading ? 'Analyzing your prescription...' : "Snap a picture of your prescription and we'll extract the medicines automatically."}
            </p>
            <div className="w-full bg-slate-800 dark:bg-gray-700 group-hover:bg-slate-900 dark:group-hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors relative z-10 text-sm">
              {isUploading ? 'Processing...' : 'Choose Image'}
            </div>
          </div>
        </div>
      </main>

      {/* How It Works section */}
      <section className="bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">How It Works</h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">Find medicines fast — no more driving from pharmacy to pharmacy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Search size={28} />, title: '1. Search & Upload', desc: 'Type medicine names or photograph your prescription for automatic extraction.' },
              { icon: <Filter size={28} />, title: '2. Filter & Compare', desc: 'See which nearby pharmacies have all your medicines, are open, and accept your insurance.' },
              { icon: <CalendarCheck size={28} />, title: '3. Reserve & Go', desc: 'Reserve your medicines online or simply walk in — the choice is yours.' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="mx-auto w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-6 text-sky-500 group-hover:-translate-y-2 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-white">{item.title}</h3>
                <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
