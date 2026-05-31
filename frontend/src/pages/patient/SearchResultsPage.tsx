import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Filter, CheckCircle2, XCircle, Clock,
  Pill, ChevronRight, AlertCircle, Loader2, X, Map, Shield,
  Minus, Plus, Camera, Upload
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { BASE_URL } from '../../services/api';
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
  offersDelivery?: boolean;
  availableMeds: {
    medicineId: string; name: string; price: number; stock: number;
    imageUrl?: string; patientPays?: number; insurancePays?: number; coveragePercentage?: number;
  }[];
  totalPrice: number;
  isOpen: boolean;
  insurances?: { id: string; providerName: string; coveragePercentage: number }[];
}

interface ReservationItem {
  medicineId: string;
  name: string;
  price: number;
  fullPrice: number;
  quantity: number;
  maxStock: number;
}

interface Insurance {
  id: string;
  providerName: string;
  defaultCoveragePercentage: number;
}

export default function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const prescFileRef = useRef<HTMLInputElement>(null);

  const state = location.state as {
    medicines?: string[];
    locationNodeId?: string;
    prescriptionImageUrl?: string;
    latitude?: number;
    longitude?: number;
  } | null;

  const [results, setResults] = useState<PharmacyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');

  // Insurance filter
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState('');

  // Prescription from verification flow
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState(state?.prescriptionImageUrl || '');

  // Reservation modal
  const [reservingPharmacy, setReservingPharmacy] = useState<PharmacyResult | null>(null);
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [reservationNote, setReservationNote] = useState('');
  const [isReserving, setIsReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<'PICKUP' | 'HOME_DELIVERY'>('PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<'PAY_AT_PHARMACY' | 'PAY_ONLINE'>('PAY_AT_PHARMACY');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Insurance in modal
  const [useInsurance, setUseInsurance] = useState(false);
  const [modalPrescUrl, setModalPrescUrl] = useState('');
  const [uploadingPresc, setUploadingPresc] = useState(false);

  // Map state
  const [showMap, setShowMap] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: state?.latitude || -1.5, lng: state?.longitude || 29.6 });

  const medicines = state?.medicines || [];
  const initialLocationNodeId = state?.locationNodeId || '';

  useEffect(() => {
    api.get('/insurances').then(res => setInsurances(res.data)).catch(() => {});
    if (medicines.length === 0) { setIsLoading(false); return; }
    searchPharmacies();
  }, []);

  // Sync prescription from state
  useEffect(() => {
    if (state?.prescriptionImageUrl) {
      setPrescriptionImageUrl(state.prescriptionImageUrl);
      setModalPrescUrl(state.prescriptionImageUrl);
    }
  }, [state?.prescriptionImageUrl]);

  const searchPharmacies = async (insId?: string) => {
    setIsLoading(true);
    setError('');
    try {
      let latitude = state?.latitude || -1.5;
      let longitude = state?.longitude || 29.6;

      if (!state?.latitude) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          setUserCoords({ lat: latitude, lng: longitude });
        } catch { /* use defaults */ }
      }

      const res = await api.post('/search', {
        medicineNames: medicines,
        latitude,
        longitude,
        locationNodeId: initialLocationNodeId || undefined,
        ...((insId ?? selectedInsuranceId) ? { insuranceId: insId ?? selectedInsuranceId } : {}),
      });
      setResults(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '';
      if (err.response?.status === 429 || msg.toLowerCase().includes('throttle')) {
        setError('Too many searches. Please wait a moment and try again.');
      } else {
        setError(msg || 'Search failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sorted = [...results].sort((a, b) =>
    sortBy === 'distance' ? a.distance - b.distance : a.totalPrice - b.totalPrice
  );

  const selectedInsuranceName = insurances.find(i => i.id === selectedInsuranceId)?.providerName || '';

  const openReservationModal = (pharmacy: PharmacyResult) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: {
            pathname: '/search',
            state: { medicines, locationNodeId: initialLocationNodeId, prescriptionImageUrl }
          }
        }
      });
      return;
    }
    setReservingPharmacy(pharmacy);
    setReservationItems(pharmacy.availableMeds.map(m => ({
      medicineId: m.medicineId,
      name: m.name,
      fullPrice: m.price,
      price: m.price,
      quantity: 1,
      maxStock: m.stock,
    })));
    setReservationNote('');
    setReservationSuccess(false);
    setDeliveryOption('PICKUP');
    setPaymentMethod('PAY_AT_PHARMACY');
    setDeliveryAddress('');
    setUseInsurance(false);
    setModalPrescUrl(prescriptionImageUrl);
  };

  // Pharmacy has patient's selected insurance?
  const pharmacyHasSelectedInsurance = (pharmacy: PharmacyResult | null) =>
    !!pharmacy?.insurances?.some(i => i.id === selectedInsuranceId);

  const pharmacyCoverageForInsurance = (pharmacy: PharmacyResult | null) =>
    pharmacy?.insurances?.find(i => i.id === selectedInsuranceId)?.coveragePercentage ?? 0;

  // Computed totals in modal
  const getItemPrice = (item: ReservationItem) => {
    if (!reservingPharmacy) return item.fullPrice;
    if (useInsurance && modalPrescUrl && pharmacyHasSelectedInsurance(reservingPharmacy)) {
      const pct = pharmacyCoverageForInsurance(reservingPharmacy);
      return item.fullPrice * (1 - pct / 100);
    }
    return item.fullPrice;
  };

  const fullTotal = reservationItems.reduce((s, i) => s + i.fullPrice * i.quantity, 0);
  const insuredTotal = (() => {
    if (!reservingPharmacy || !useInsurance || !modalPrescUrl || !pharmacyHasSelectedInsurance(reservingPharmacy)) return fullTotal;
    const pct = pharmacyCoverageForInsurance(reservingPharmacy);
    return fullTotal * (1 - pct / 100);
  })();
  const insuranceSaves = fullTotal - insuredTotal;
  const deliveryFee = deliveryOption === 'HOME_DELIVERY'
    ? (reservingPharmacy?.distance ?? 0) <= 2 ? 500 : (reservingPharmacy?.distance ?? 0) <= 5 ? 1000 : 1500
    : 0;

  const uploadPrescriptionForInsurance = async (file: File) => {
    setUploadingPresc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/prescriptions/temp-verify', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.imageUrl?.startsWith('http')
        ? res.data.imageUrl
        : `${BASE_URL}${res.data.imageUrl}`;
      setModalPrescUrl(url);
      setPrescriptionImageUrl(url);
    } catch {
      alert('Could not upload prescription. Please try again.');
    } finally {
      setUploadingPresc(false);
    }
  };

  const sendReservation = async () => {
    if (!reservingPharmacy) return;
    setIsReserving(true);
    try {
      await api.post('/reservations', {
        pharmacyId: reservingPharmacy.id,
        items: reservationItems.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
        notes: reservationNote,
        paymentMethod,
        deliveryOption,
        deliveryAddress,
        deliveryDistanceKm: reservingPharmacy.distance,
        ...(modalPrescUrl ? { prescriptionImageUrl: modalPrescUrl } : {}),
        ...(useInsurance && selectedInsuranceId ? { insuranceId: selectedInsuranceId } : {}),
        ...(useInsurance && user?.insuranceNumber ? { insuranceNumber: user.insuranceNumber } : {}),
        ...(useInsurance && modalPrescUrl ? { insurancePrescriptionUrl: modalPrescUrl } : {}),
      });
      setReservationSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Reservation failed. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  const maskInsuranceNumber = (num?: string | null) => {
    if (!num) return '—';
    if (num.length <= 4) return num;
    return num.slice(0, -4).replace(/./g, '*') + num.slice(-4);
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
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{t('search.title')}</h1>
          <p className="text-slate-500 dark:text-gray-400 flex items-center gap-1 mt-1 font-medium">
            <MapPin size={16} /> {t('search.subtitle')}
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
          <Filter size={15} className="text-sky-500" /> {t('search.filterInsurance')}:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedInsuranceId(''); searchPharmacies(''); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !selectedInsuranceId ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
            }`}
          >
            {t('search.allInsurances')}
          </button>
          {insurances.map(ins => (
            <button
              key={ins.id}
              onClick={() => { setSelectedInsuranceId(ins.id); searchPharmacies(ins.id); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedInsuranceId === ins.id
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
              }`}
            >
              {ins.providerName}
            </button>
          ))}
        </div>
        {selectedInsuranceId && (
          <p className="text-xs text-sky-600 dark:text-sky-400 ml-auto font-medium">
            <Shield size={12} className="inline mr-1" />
            Showing pharmacies that accept {selectedInsuranceName}
          </p>
        )}
      </div>

      {/* Medicine tags */}
      <div className="flex flex-wrap gap-2 mb-6 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-4">
        <span className="text-slate-600 dark:text-gray-300 text-sm font-semibold mr-1">{t('search.yourMedicines')}:</span>
        {medicines.map((m, i) => (
          <span key={i} className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{m}</span>
        ))}
        {prescriptionImageUrl && (
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Camera size={11} /> Prescription attached
          </span>
        )}
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={48} className="text-sky-500 animate-spin" />
          <p className="text-slate-600 dark:text-gray-400 font-medium">{t('search.searching')}</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 w-full">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
          <button onClick={() => searchPharmacies()} className="px-6 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors">
            {t('common.refresh')}
          </button>
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Pill size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-gray-300 mb-2">{t('search.noResults')}</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">{t('search.noResultsSubtitle')}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors">
            Try Different Medicines
          </button>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && sorted.length > 0 && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
              <span className="font-bold text-slate-800 dark:text-white">{sorted.length}</span>{' '}
              {sorted.length !== 1 ? 'pharmacies found' : 'pharmacy found'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort:</span>
              {(['distance', 'price'] as const).map(opt => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
                    sortBy === opt ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
                  }`}>
                  {opt}
                </button>
              ))}
              <button
                onClick={() => setShowMap(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  showMap ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-sky-300'
                }`}
              >
                <Map size={13} /> {showMap ? 'Hide Map' : 'Map View'}
              </button>
            </div>
          </div>

          {showMap && (
            <Suspense fallback={<div className="h-96 flex items-center justify-center bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700"><Loader2 size={32} className="animate-spin text-sky-500" /></div>}>
              <PharmacyMap
                userLat={userCoords.lat}
                userLng={userCoords.lng}
                pharmacies={sorted.map(p => ({ id: p.id, name: p.name, distance: p.distance, isOpen: p.isOpen, totalPrice: p.totalPrice }))}
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
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1 uppercase">
                        <CheckCircle2 size={12} /> Open
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full flex items-center gap-1 uppercase">
                        <XCircle size={12} /> Closed
                      </span>
                    )}
                    {pharmacy.offersDelivery && (
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">🚚 Delivery</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-gray-400 text-sm font-medium flex-wrap">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {pharmacy.distance?.toFixed(1) ?? '?'} km</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {pharmacy.openingTime}:00 – {pharmacy.closingTime}:00</span>
                    {pharmacy.address && <span className="text-slate-400">{pharmacy.address}</span>}
                  </div>
                  {/* Insurance badges */}
                  {pharmacy.insurances && pharmacy.insurances.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pharmacy.insurances.map(ins => (
                        <span key={ins.id} className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                          <Shield size={9} /> {ins.providerName} {ins.coveragePercentage}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-4 shrink-0 border border-slate-100 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                    <Pill size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Available</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{pharmacy.availableMeds?.length || 0}/{medicines.length}</p>
                  </div>
                </div>
              </div>

              {/* Medicine list */}
              {pharmacy.availableMeds && pharmacy.availableMeds.length > 0 && (
                <div className="flex flex-col gap-2 mb-5">
                  {pharmacy.availableMeds.map((m, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium">
                      <div className="flex items-center gap-3">
                        {m.imageUrl && (
                          <img src={m.imageUrl} alt={m.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-gray-600"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-slate-700 dark:text-gray-200">{m.name}</span>
                        {m.stock <= 10 && m.stock > 0 && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{m.stock} left</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {m.coveragePercentage ? (
                          <>
                            <span className="text-xs text-slate-400 line-through">{Number(m.price).toLocaleString()} RWF</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 rounded">-{m.coveragePercentage}% ins</span>
                              <span className="text-sky-600 dark:text-sky-400 font-bold">{Number(m.patientPays).toLocaleString()} RWF</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-700 dark:text-gray-200 font-bold">{Number(m.price).toLocaleString()} RWF</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {pharmacy.totalPrice > 0 && (
                  <div className="bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-gray-700 text-sm font-mono">
                    <span className="text-slate-500">Total: </span>
                    <span className="font-bold text-slate-800 dark:text-white text-base">{Number(pharmacy.totalPrice).toLocaleString()} RWF</span>
                  </div>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link
                    to={`/pharmacy/${pharmacy.id}`}
                    className="flex-1 sm:flex-none text-center border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:border-sky-300 hover:text-sky-600 px-5 py-3.5 rounded-2xl font-semibold transition-all text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => openReservationModal(pharmacy)}
                    className="flex-1 sm:flex-none shrink-0 bg-slate-800 hover:bg-sky-500 dark:bg-sky-600 dark:hover:bg-sky-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-md text-sm"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { if (!reservationSuccess) setReservingPharmacy(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl dark:shadow-gray-950/80 border border-slate-100 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>

            {reservationSuccess ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Reservation Sent! 🎉</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">The pharmacy will review your request. Check reservations for updates.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setReservationSuccess(false); setReservingPharmacy(null); }}
                    className="flex-1 border border-sky-500 text-sky-600 dark:text-sky-400 font-semibold py-3 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors text-sm"
                  >
                    Reserve from Another
                  </button>
                  <button
                    onClick={() => navigate('/my-reservations')}
                    className="flex-1 bg-sky-500 text-white font-semibold py-3 rounded-xl hover:bg-sky-600 transition-colors text-sm"
                  >
                    My Reservations
                  </button>
                </div>
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

                {/* Insurance Toggle */}
                {selectedInsuranceId && (
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2">Payment Type</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUseInsurance(false)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${!useInsurance ? 'bg-slate-800 dark:bg-sky-600 text-white border-slate-800 dark:border-sky-600' : 'bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600'}`}
                      >
                        💰 Full Price
                      </button>
                      <button
                        onClick={() => setUseInsurance(true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${useInsurance ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600'}`}
                      >
                        <Shield size={11} className="inline mr-1" /> Use {selectedInsuranceName}
                      </button>
                    </div>

                    {useInsurance && (
                      <div className="mt-3 space-y-2">
                        {user?.insuranceNumber && (
                          <p className="text-xs text-slate-600 dark:text-gray-300 flex items-center gap-1">
                            <Shield size={11} className="text-sky-500" />
                            Insurance #: <span className="font-mono font-bold">{maskInsuranceNumber(user.insuranceNumber)}</span>
                          </p>
                        )}

                        {!pharmacyHasSelectedInsurance(reservingPharmacy) && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-2">
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">⚠️ This pharmacy does not accept {selectedInsuranceName}. You will be charged full price.</p>
                          </div>
                        )}

                        {pharmacyHasSelectedInsurance(reservingPharmacy) && (
                          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-2">
                            <p className="text-xs text-sky-700 dark:text-sky-400 font-semibold">
                              ℹ️ Insurance only applies to medicines prescribed by a doctor. A prescription is required.
                            </p>
                          </div>
                        )}

                        {/* Prescription section */}
                        {modalPrescUrl ? (
                          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                            <span className="text-xs text-green-700 dark:text-green-400 font-semibold flex-1">✓ Prescription attached</span>
                            <button onClick={() => window.open(modalPrescUrl, '_blank')} className="text-xs text-green-600 underline">View</button>
                          </div>
                        ) : (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ Upload your medical prescription to use insurance coverage.</p>
                            <input ref={prescFileRef} type="file" accept="image/*,.pdf" className="hidden"
                              onChange={e => e.target.files?.[0] && uploadPrescriptionForInsurance(e.target.files[0])} />
                            <button
                              onClick={() => prescFileRef.current?.click()}
                              disabled={uploadingPresc}
                              className="flex items-center gap-1.5 text-xs bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-50 transition-colors"
                            >
                              {uploadingPresc ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                              {uploadingPresc ? 'Uploading...' : 'Upload Prescription'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Medicines with quantity controls */}
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                  {reservationItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-gray-300 truncate">{item.name}</p>
                        {useInsurance && modalPrescUrl && pharmacyHasSelectedInsurance(reservingPharmacy) && (
                          <p className="text-xs text-slate-400 line-through">{Number(item.fullPrice * item.quantity).toLocaleString()} RWF</p>
                        )}
                        <p className="text-xs font-bold text-sky-600 dark:text-sky-400">{Number(getItemPrice(item) * item.quantity).toLocaleString()} RWF</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setReservationItems(its => its.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it))}
                          className="w-7 h-7 rounded-full border border-slate-200 dark:border-gray-600 flex items-center justify-center text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-bold w-5 text-center text-slate-800 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => setReservationItems(its => its.map((it, idx) => idx === i ? { ...it, quantity: Math.min(it.maxStock, it.quantity + 1) } : it))}
                          disabled={item.quantity >= item.maxStock}
                          className="w-7 h-7 rounded-full border border-slate-200 dark:border-gray-600 flex items-center justify-center text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price summary */}
                <div className="mb-4 bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-slate-100 dark:border-gray-700 text-sm space-y-1">
                  {useInsurance && modalPrescUrl && pharmacyHasSelectedInsurance(reservingPharmacy) && insuranceSaves > 0 ? (
                    <>
                      <div className="flex justify-between text-slate-500 dark:text-gray-400">
                        <span>Full price</span>
                        <span className="line-through">{Number(fullTotal).toLocaleString()} RWF</span>
                      </div>
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Insurance covers ({pharmacyCoverageForInsurance(reservingPharmacy)}%)</span>
                        <span>-{Number(insuranceSaves).toLocaleString()} RWF</span>
                      </div>
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-slate-500 dark:text-gray-400">
                          <span>Delivery fee</span>
                          <span>+{deliveryFee.toLocaleString()} RWF</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800 dark:text-white border-t border-slate-200 dark:border-gray-700 pt-1 mt-1">
                        <span>You pay</span>
                        <span className="text-sky-600 dark:text-sky-400">{Number(insuredTotal + deliveryFee).toLocaleString()} RWF</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-slate-500 dark:text-gray-400">
                          <span>Delivery fee</span>
                          <span>+{deliveryFee.toLocaleString()} RWF</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-800 dark:text-white">
                        <span>Total</span>
                        <span>{Number(fullTotal + deliveryFee).toLocaleString()} RWF</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Delivery Option */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Delivery Option</label>
                  {reservingPharmacy.offersDelivery ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeliveryOption('PICKUP')}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${deliveryOption === 'PICKUP' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}
                      >
                        Pickup
                      </button>
                      <button
                        onClick={() => setDeliveryOption('HOME_DELIVERY')}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${deliveryOption === 'HOME_DELIVERY' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700'}`}
                      >
                        🚚 Home Delivery
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">This pharmacy does not offer home delivery. Please pick up at the pharmacy.</p>
                    </div>
                  )}
                </div>

                {deliveryOption === 'HOME_DELIVERY' && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Delivery Address / Sector</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Muhoza, close to market"
                      className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium">
                      Delivery fee: {deliveryFee.toLocaleString()} RWF
                      ({(reservingPharmacy.distance ?? 0).toFixed(1)} km)
                    </p>
                  </div>
                )}

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-slate-50 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="PAY_AT_PHARMACY">Pay at Pharmacy</option>
                    <option value="PAY_ONLINE">Pay Online (MoMo)</option>
                  </select>
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
