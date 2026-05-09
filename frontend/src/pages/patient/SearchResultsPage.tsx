import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Filter, CheckCircle2, XCircle, Clock,
  Pill, ChevronRight, AlertCircle, Loader2, X, Map
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PharmacyMap = lazy(() => import('../../components/patient/PharmacyMap'));

interface PharmacyResult {
  id: string;
  name: string;
  distance: number;
  address?: string;
  phone?: string;
  openingTime: number;
  closingTime: number;
  availableMeds: { medicineId: string; name: string; price: number; stock: number }[];
  totalPrice: number;
  isOpen: boolean;
}

interface ReservationItem {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Insurance {
  id: string;
  providerName: string;
  defaultCoveragePercentage: number;
}

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const state = location.state as { medicines?: string[] } | null;

  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');

  // Insurance filter
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState('');

  // Reservation modal
  const [reservingPharmacy, setReservingPharmacy] = useState<PharmacyResult | null>(null);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [reservationNote, setReservationNote] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  // Map state
  const [showMap, setShowMap] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: -1.5, lng: 29.6 });

  const medicines = state?.medicines || [];

  useEffect(() => {
    // Load insurance providers for the filter
    api.get('/insurances').then(res => setInsurances(res.data)).catch(() => {});
    if (medicines.length === 0) { setIsLoading(false); return; }
    searchPharmacies();
  }, []);

  const searchPharmacies = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Get user's position
      let latitude = -1.5; // Musanze default
      let longitude = 29.6;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
        setUserCoords({ lat: latitude, lng: longitude });
      } catch { /* use defaults */ }

      const res = await api.post('/search', {
        medicineNames: medicines,
        latitude,
        longitude,
        ...(selectedInsuranceId ? { insuranceId: selectedInsuranceId } : {}),
      });
      setResults(res.data);
    } catch (err: any) {
      // If API not ready yet, show friendly message
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sorted = [...results].sort((a, b) => sortBy === 'distance' ? a.distance - b.distance : a.totalPrice - b.totalPrice);

  const openReservationModal = (pharmacy: PharmacyResult) => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location } }); return; }
    setReservingPharmacy(pharmacy);
    setReservationItems(pharmacy.availableMeds.map(m => ({ medicineId: m.medicineId, name: m.name, price: m.price, quantity: 1 })));
    setReservationNote('');
    setReservationSuccess(false);
  };

  const sendReservation = async () => {
    if (!reservingPharmacy) return;
    setIsReserving(true);
    try {
      await api.post('/reservations', {
        pharmacyId: reservingPharmacy.id,
        items: reservationItems.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
        notes: reservationNote,
      });
      setReservationSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Reservation failed. The pharmacy may not have real inventory set up yet.');
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-sky-600 mb-2 font-semibold transition-colors text-sm"
          >
            <ArrowLeft size={16} /> New Search
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Search Results</h1>
          <p className="text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin size={16} /> Nearest Pharmacies in Musanze
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2 shadow-sm text-sm">
          <Filter size={16} className="text-sky-500" />
          <span className="text-slate-500 dark:text-gray-400 font-medium">Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-transparent dark:text-gray-200 text-slate-700 font-semibold focus:outline-none cursor-pointer">
            <option value="distance">Distance</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Insurance filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
        <span className="text-sm font-semibold text-slate-600 dark:text-gray-300 flex items-center gap-1.5">
          <Filter size={15} className="text-sky-500" /> Insurance Filter:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedInsuranceId(''); searchPharmacies(); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !selectedInsuranceId
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
            }`}
          >
            Any Insurance
          </button>
          {insurances.map(ins => (
            <button
              key={ins.id}
              onClick={() => { setSelectedInsuranceId(ins.id); searchPharmacies(); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedInsuranceId === ins.id
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
              }`}
            >
              {ins.providerName}
            </button>
          ))}
        </div>
      </div>

      {/* Medicine tags */}
      <div className="flex flex-wrap gap-2 mb-6 bg-sky-50 border border-sky-100 rounded-2xl p-4">
        <span className="text-slate-600 text-sm font-semibold mr-1">Searching for:</span>
        {medicines.map((m, i) => (
          <span key={i} className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{m}</span>
        ))}
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={48} className="text-sky-500 animate-spin" />
          <p className="text-slate-600 font-medium">Finding pharmacies near you...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 w-full">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
          <button onClick={searchPharmacies} className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Pill size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No pharmacies found</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">No nearby pharmacy has all the requested medicines in stock and open right now.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors">
            Try Different Medicines
          </button>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && sorted.length > 0 && (
        <div className="grid gap-6">
          {/* Sort + Map toggle bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-500 text-sm font-medium">
              <span className="font-bold text-slate-800">{sorted.length}</span> pharmacie{sorted.length !== 1 ? 's' : ''} found
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort:</span>
              {(['distance', 'price'] as const).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                    sortBy === opt ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                  }`}>
                  {opt}
                </button>
              ))}
              <button
                onClick={() => setShowMap(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  showMap ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                }`}
              >
                <Map size={13} /> {showMap ? 'Hide Map' : 'Map View'}
              </button>
            </div>
          </div>

          {/* Leaflet Map Panel */}
          {showMap && (
            <Suspense fallback={<div className="h-96 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200"><Loader2 size={32} className="animate-spin text-sky-500" /></div>}>
              <PharmacyMap
                userLat={userCoords.lat}
                userLng={userCoords.lng}
                pharmacies={sorted.map(p => ({
                  id: p.id,
                  name: p.name,
                  distance: p.distance,
                  isOpen: p.isOpen,
                  totalPrice: p.totalPrice,
                }))}
              />
            </Suspense>
          )}

          {sorted.map(pharmacy => (
            <div key={pharmacy.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-gray-950/40 border border-slate-100 dark:border-gray-800 hover:border-sky-200 dark:hover:border-sky-700 hover:-translate-y-1 transition-all">
              <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between mb-6 border-b border-slate-100 dark:border-gray-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{pharmacy.name}</h2>
                    {pharmacy.isOpen ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 uppercase">
                        <CheckCircle2 size={12} /> Open
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full flex items-center gap-1 uppercase">
                        <XCircle size={12} /> Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {pharmacy.distance?.toFixed(1) ?? '?'} km</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {pharmacy.openingTime}:00 – {pharmacy.closingTime}:00</span>
                    {pharmacy.address && <span className="text-slate-400">{pharmacy.address}</span>}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 shrink-0 border border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Pill size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Available</p>
                    <p className="text-xl font-bold text-green-600">{pharmacy.availableMeds?.length || 0}/{medicines.length}</p>
                  </div>
                </div>
              </div>

              {/* Medicine list */}
              {pharmacy.availableMeds && pharmacy.availableMeds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {pharmacy.availableMeds.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 rounded-xl px-3 py-1.5 text-sm font-medium">
                      <CheckCircle2 size={13} />
                      {m.name}
                      <span className="text-green-500 font-bold">{Number(m.price).toLocaleString()} RWF</span>
                      {m.stock <= 10 && m.stock > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{m.stock} left</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {pharmacy.totalPrice > 0 && (
                  <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 text-sm font-mono">
                    <span className="text-slate-500">Total: </span>
                    <span className="font-bold text-slate-800 text-base">{Number(pharmacy.totalPrice).toLocaleString()} RWF</span>
                  </div>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    to={`/pharmacy/${pharmacy.id}`}
                    className="flex-1 sm:flex-none text-center border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 px-5 py-3.5 rounded-2xl font-semibold transition-all text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => openReservationModal(pharmacy)}
                    className="flex-1 sm:flex-none shrink-0 bg-slate-800 hover:bg-sky-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-md text-sm"
                  >
                    Reserve <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reservation Modal */}
      {reservingPharmacy && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setReservingPharmacy(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-gray-950/80 border border-slate-100 dark:border-gray-800 w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            {reservationSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Reservation Sent!</h2>
                <p className="text-slate-500 text-sm mb-4">The pharmacy will review and respond to your request. Check your reservations for updates.</p>
                <button onClick={() => navigate('/my-reservations')} className="w-full bg-sky-500 text-white font-semibold py-3 rounded-xl hover:bg-sky-600 transition-colors">
                  View My Reservations
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-white text-lg">Reserve from {reservingPharmacy.name}</h2>
                    <p className="text-xs text-slate-400 dark:text-gray-500">{reservingPharmacy.address}</p>
                  </div>
                  <button onClick={() => setReservingPharmacy(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-gray-800">
                    <X size={16} className="text-slate-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {reservationItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                      <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{item.name}</span>
                      <span className="text-sm font-bold text-sky-600">{Number(item.price).toLocaleString()} RWF</span>
                    </div>
                  ))}
                </div>

                <textarea
                  value={reservationNote}
                  onChange={e => setReservationNote(e.target.value)}
                  placeholder="Add a note (e.g. generic substitute OK)..."
                  rows={2}
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none mb-4 bg-slate-50 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                />

                <button
                  onClick={sendReservation}
                  disabled={isReserving}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  {isReserving ? 'Sending...' : 'Send Reservation Request'}
                </button>
                <p className="text-xs text-slate-400 dark:text-gray-600 text-center mt-2">The pharmacist must confirm before medicines are prepared</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
