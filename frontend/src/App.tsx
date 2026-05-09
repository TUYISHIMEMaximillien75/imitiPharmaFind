import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import LandingPage from './pages/patient/LandingPage';
import VerificationPage from './pages/patient/VerificationPage';
import SearchResultsPage from './pages/patient/SearchResultsPage';
import ReservationModal from './components/patient/ReservationModal';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import type { Medicine, Pharmacy, UserMode, PatientView } from './types';
import { prescriptionApi } from './services/prescriptionApi';

function App() {
  const [userMode, setUserMode] = useState<UserMode>('patient');
  const [currentView, setCurrentView] = useState<PatientView>('landing');

  // Verification State
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: '1', name: 'Amoxicillin 500mg' },
    { id: '2', name: 'Paracetamol 1000mg' },
    { id: '3', name: 'Vitamin C 500mg' }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // Time state for Open/Closed logic
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Reservation Modal State
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [reservationStatus, setReservationStatus] = useState<'idle' | 'pending'>('idle');
  const [pharmacistNotes, setPharmacistNotes] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Mock Pharmacies
  const pharmacies: Pharmacy[] = [
    { id: 1, name: 'Kipharma Musanze', distance: 0.8, openTime: 8, closeTime: 22, medsAvailable: 3, medsTotal: 3, priceTotal: 10000, insurancePays: 8500, userPays: 1500 },
    { id: 2, name: 'Vine Pharmacy', distance: 1.2, openTime: 8, closeTime: 20, medsAvailable: 3, medsTotal: 3, priceTotal: 11500, insurancePays: 8500, userPays: 3000 },
    { id: 3, name: 'La Medicale', distance: 2.5, openTime: 0, closeTime: 24, medsAvailable: 2, medsTotal: 3, priceTotal: 5000, insurancePays: 4250, userPays: 750 }
  ];

  const checkIsOpen = (p: Pharmacy) => {
    if (p.openTime === 0 && p.closeTime === 24) return true;
    return currentHour >= p.openTime && currentHour < p.closeTime;
  };

  const handleFileSelected = async (file: File) => {
    setCurrentView('uploading');
    setIsOcrLoading(true);
    try {
      const result = await prescriptionApi.uploadPrescription(file);
      setUploadedImageUrl(`http://localhost:3000${result.imageUrl}`);
      const extracted = result.medicines.map((name, index) => ({
        id: Date.now().toString() + index,
        name
      }));
      setMedicines(extracted);
      setCurrentView('verifying');
      setIsConfirmed(false);
    } catch (error) {
      console.error('Failed to upload', error);
      // Fallback to empty if it fails
      setMedicines([]);
      setUploadedImageUrl(null);
      setCurrentView('verifying');
      setIsConfirmed(false);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (uploadedImageUrl) {
      try {
        await prescriptionApi.savePrescription(medicines.map(m => m.name), uploadedImageUrl.replace('http://localhost:3000', ''));
      } catch (err) {
        console.error('Failed to save prescription', err);
      }
    }
    setCurrentView('results');
  };

  const handleEdit = (med: Medicine) => { setEditingId(med.id); setEditName(med.name); };
  const saveEdit = () => { setMedicines(medicines.map(m => m.id === editingId ? { ...m, name: editName } : m)); setEditingId(null); };
  const handleDelete = (id: string) => setMedicines(medicines.filter(m => m.id !== id));
  const handleAddNew = () => { const newId = Date.now().toString(); setMedicines([...medicines, { id: newId, name: '' }]); setEditingId(newId); setEditName(''); };

  const handleReserveClick = (pharmacy: Pharmacy) => { setSelectedPharmacy(pharmacy); setReservationStatus('idle'); setPharmacistNotes(''); };
  const sendReservationRequest = () => setReservationStatus('pending');
  const closeReservationModal = () => setSelectedPharmacy(null);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-light)] text-[var(--color-text-charcoal)] font-sans selection:bg-sky-200">
      
      <Header userMode={userMode} setUserMode={setUserMode} currentView={currentView} setCurrentView={setCurrentView} />

      {/* DYNAMIC MAIN CONTENT */}
      {userMode === 'admin' ? (
        <AdminDashboard />
      ) : userMode === 'pharmacist' ? (
        <PharmacistDashboard />
      ) : (
        <>
          {currentView === 'landing' && (
            <LandingPage setCurrentView={setCurrentView} onFileSelected={handleFileSelected} />
          )}

          {currentView === 'uploading' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
              <div className="w-24 h-24 border-4 border-sky-100 border-t-[var(--color-brand-blue)] rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing Prescription...</h2>
              <p className="text-slate-500">Extracting medicine names using AI</p>
            </div>
          )}

          {currentView === 'verifying' && (
            <VerificationPage 
              setCurrentView={setCurrentView}
              medicines={medicines}
              editingId={editingId}
              editName={editName} setEditName={setEditName}
              isConfirmed={isConfirmed} setIsConfirmed={setIsConfirmed}
              handleEdit={handleEdit} saveEdit={saveEdit}
              handleDelete={handleDelete} handleAddNew={handleAddNew}
              uploadedImageUrl={uploadedImageUrl}
              handleConfirm={handleConfirmVerification}
            />
          )}

          {currentView === 'results' && (
            <SearchResultsPage 
              setCurrentView={setCurrentView}
              medicines={medicines}
              pharmacies={pharmacies}
              checkIsOpen={checkIsOpen}
              handleReserveClick={handleReserveClick}
            />
          )}
        </>
      )}

      <Footer userMode={userMode} currentView={currentView} />

      <ReservationModal 
        selectedPharmacy={selectedPharmacy}
        closeReservationModal={closeReservationModal}
        reservationStatus={reservationStatus}
        medicines={medicines}
        pharmacistNotes={pharmacistNotes}
        setPharmacistNotes={setPharmacistNotes}
        sendReservationRequest={sendReservationRequest}
      />
    </div>
  );
}

export default App;
