import { useState } from 'react';
import { Package, ClipboardList } from 'lucide-react';
import type { InventoryItem, Reservation } from '../../types';
import InventoryTab from './components/InventoryTab';
import ReservationsTab from './components/ReservationsTab';

const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Amoxicillin 500mg', stock: 154, expiryDays: 120, price: 1500 },
  { id: '2', name: 'Paracetamol 1000mg', stock: 8, expiryDays: 300, price: 500 },
  { id: '3', name: 'Vitamin C 500mg', stock: 45, expiryDays: 14, price: 2000 },
  { id: '4', name: 'Ibuprofen 400mg', stock: 12, expiryDays: 45, price: 800 },
  { id: '5', name: 'Azithromycin 250mg', stock: 5, expiryDays: 60, price: 3500 },
  { id: '6', name: 'Omeprazole 20mg', stock: 89, expiryDays: 20, price: 1200 },
];

const mockReservations: Reservation[] = [
  { id: 'RES-001', patientName: 'John Doe', items: ['Amoxicillin 500mg', 'Paracetamol 1000mg'], status: 'pending', notes: 'Please ensure generic substitute if out of stock.' },
  { id: 'RES-002', patientName: 'Marie Claire', items: ['Ibuprofen 400mg'], status: 'pending' },
];

export default function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'reservations'>('inventory');
  
  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditStock(item.stock);
  };

  const saveEdit = (id: string) => {
    setInventory(inventory.map(item => 
      item.id === id ? { ...item, price: editPrice, stock: editStock } : item
    ));
    setEditingId(null);
  };

  // Reservation Review State
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const activeReservations = reservations.filter(r => r.status === 'pending');
  const selectedReservation = reservations.find(r => r.id === selectedReviewId);

  const handleConfirmReservation = (id: string) => {
    setReservations(reservations.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
    setSelectedReviewId(null);
  };

  const handleRejectAction = (id: string) => {
    setRejectingId(id);
    setRejectReason(''); // reset reason
  };

  const submitRejection = (id: string) => {
    if (!rejectReason) return;
    setReservations(reservations.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
    setRejectingId(null);
    setSelectedReviewId(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Pharmacist Command Center</h1>
          <p className="text-slate-500 mt-2">Manage your inventory, reservations, and updates.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white shadow relative text-[var(--color-brand-blue)]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={18} /> Inventory
          </button>
          <button 
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'reservations' ? 'bg-white shadow relative text-[var(--color-brand-blue)]' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('reservations')}
          >
            <ClipboardList size={18} /> Reservations
            {activeReservations.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1 animate-pulse">
                {activeReservations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <InventoryTab 
          inventory={inventory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          editingId={editingId}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          editStock={editStock}
          setEditStock={setEditStock}
          startEdit={startEdit}
          saveEdit={saveEdit}
        />
      )}

      {activeTab === 'reservations' && (
        <ReservationsTab 
          activeReservations={activeReservations}
          selectedReservation={selectedReservation}
          selectedReviewId={selectedReviewId}
          setSelectedReviewId={setSelectedReviewId}
          rejectingId={rejectingId}
          setRejectingId={setRejectingId}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          handleConfirmReservation={handleConfirmReservation}
          handleRejectAction={handleRejectAction}
          submitRejection={submitRejection}
        />
      )}

    </main>
  );
}
