import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, MapPin, Filter, CalendarCheck, Stethoscope, Plus, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MedicineSuggestion {
  id: string;
  name: string;
  category: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // GPS Detection
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Locations
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // Issue #10 — autocomplete
  const [allMedicines, setAllMedicines] = useState<MedicineSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    api.get('/medicines').then(res => setAllMedicines(res.data)).catch(() => {});
    api.get('/locations/all').then(res => {
      // Only show locations that have valid latitude/longitude for calculating distance
      const withCoords = res.data.filter((loc: any) => loc.latitude && loc.longitude);
      setLocations(withCoords);
    }).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = searchText.trim()
    ? allMedicines
        .filter(m =>
          m.name.toLowerCase().includes(searchText.toLowerCase()) &&
          !tags.includes(m.name)
        )
        .slice(0, 8)
    : [];

  const addTag = (val?: string) => {
    const name = (val ?? searchText).trim();
    if (name && !tags.includes(name)) setTags([...tags, name]);
    setSearchText('');
    setShowSuggestions(false);
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleSearch = () => {
    const allMeds = [...tags, ...(searchText.trim() ? [searchText.trim()] : [])];
    if (allMeds.length === 0) return;
    navigate('/search', {
      state: {
        medicines: allMeds,
        locationNodeId: detectedCoords ? '' : selectedLocationId,
        latitude: detectedCoords?.lat,
        longitude: detectedCoords?.lng,
      }
    });
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
          imageUrl: `${BASE_URL}${res.data.imageUrl}`,
          rawImageUrl: res.data.imageUrl, // relative path for passing to search
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
            {t('landing.title')}{' '}
            <br className="hidden md:block" />
            <span className="text-sky-500">{t('landing.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
            {t('landing.subtitle')}
          </p>
          {!isAuthenticated && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate('/register')} className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20">
                {t('common.getStarted')}
              </button>
              <button onClick={() => navigate('/login')} className="px-6 py-3 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all">
                {t('common.signIn')}
              </button>
            </div>
          )}
        </div>

        {/* Search Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Text Search with Autocomplete */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-gray-950/40 border border-slate-100 dark:border-gray-800 hover:shadow-lg transition-all">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white">
              <Search className="text-sky-500" size={24} /> {t('landing.searchTitle')}
            </h2>
            <p className="text-slate-500 dark:text-gray-400 mb-5 text-sm">{t('landing.searchSubtitle')}</p>

            {/* Tag input with autocomplete */}
            <div className="relative" ref={suggestionRef}>
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
                    onChange={e => { setSearchText(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchText && setShowSuggestions(true)}
                    placeholder={tags.length === 0 ? t('landing.searchPlaceholder') : t('landing.searchMore')}
                    className="flex-1 bg-transparent outline-none text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 text-sm"
                    autoComplete="off"
                  />
                  {searchText.trim() && (
                    <button onClick={() => addTag()} className="text-sky-500 hover:text-sky-700 text-xs font-bold flex items-center gap-1">
                      <Plus size={14} /> {t('landing.addTag')}
                    </button>
                  )}
                </div>
              </div>

              {/* Autocomplete dropdown */}
              {showSuggestions && filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                  {filtered.map(m => (
                    <button
                      key={m.id}
                      onMouseDown={() => addTag(m.name)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-left transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-800 dark:text-gray-200 group-hover:text-sky-600">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full capitalize">
                        {m.category?.toLowerCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Selector */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Search Location (Optional)</label>
              <select
                value={selectedLocationId}
                onChange={e => { setSelectedLocationId(e.target.value); setDetectedCoords(null); setLocationStatus('idle'); }}
                disabled={locationStatus === 'detected'}
                className="w-full border-2 border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 bg-slate-50 dark:bg-gray-800 dark:text-white transition-all disabled:opacity-50"
              >
                <option value="">Select a location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                ))}
              </select>

              {/* GPS detection */}
              <button
                type="button"
                onClick={async () => {
                  setLocationStatus('detecting');
                  try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) =>
                      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
                    );
                    setDetectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setSelectedLocationId('');
                    setLocationStatus('detected');
                  } catch {
                    setLocationStatus('error');
                  }
                }}
                className="flex items-center gap-2 mt-2 text-sm font-semibold transition-colors"
                style={{ color: locationStatus === 'detected' ? '#16a34a' : locationStatus === 'error' ? '#dc2626' : '#0ea5e9' }}
              >
                {locationStatus === 'detecting'
                  ? <Loader2 size={14} className="animate-spin" />
                  : locationStatus === 'detected'
                  ? <CheckCircle2 size={14} />
                  : <MapPin size={14} />}
                {locationStatus === 'detecting' ? 'Detecting...' :
                 locationStatus === 'detected' ? '✓ Location detected — using GPS coordinates' :
                 locationStatus === 'error' ? '⚠ Could not detect. Use dropdown above.' :
                 t('landing.autoDetect')}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                id="search-btn"
                onClick={handleSearch}
                disabled={tags.length === 0 && !searchText.trim()}
                className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 py-3 px-6 rounded-xl font-semibold transition-all shadow-lg shadow-sky-500/20"
              >
                {t('landing.searchBtn')}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 dark:text-gray-500">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <MapPin size={13} /> {t('landing.autoDetect')}
              </span>
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <Stethoscope size={13} /> {t('landing.insuranceFilters')}
              </span>
            </div>
          </div>

          {/* Prescription Upload */}
          <div
            className={`bg-gradient-to-br from-white dark:from-gray-900 to-slate-50 dark:to-gray-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-gray-950/40 border border-slate-100 dark:border-gray-800 text-center flex flex-col justify-center relative overflow-hidden group hover:border-sky-300 dark:hover:border-sky-700 transition-colors ${isUploading ? 'cursor-wait opacity-80' : 'cursor-pointer'}`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])} />
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-sky-100 dark:bg-sky-900/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="mx-auto bg-sky-50 dark:bg-sky-900/30 text-sky-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300 shadow-inner">
              {isUploading ? (
                <div className="w-8 h-8 border-3 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={36} strokeWidth={2} />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2 relative z-10 text-slate-800 dark:text-white">{t('landing.uploadTitle')}</h2>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6 relative z-10">
              {isUploading ? t('landing.uploading') : t('landing.uploadSubtitle')}
            </p>
            <div className="w-full bg-slate-800 dark:bg-gray-700 group-hover:bg-slate-900 dark:group-hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors relative z-10 text-sm">
              {isUploading ? t('landing.uploadProcessing') : t('landing.uploadBtn')}
            </div>
          </div>
        </div>
      </main>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{t('landing.howItWorks')}</h2>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">{t('landing.howSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: <Search size={28} />, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
              { icon: <Filter size={28} />, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
              { icon: <CalendarCheck size={28} />, title: t('landing.step3Title'), desc: t('landing.step3Desc') },
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
