import { AlertCircle, Package, Clock, Search, Edit3, Save } from 'lucide-react';
import type { InventoryItem } from '../../../types';

interface InventoryTabProps {
  inventory: InventoryItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  editingId: string | null;
  editPrice: number;
  setEditPrice: (p: number) => void;
  editStock: number;
  setEditStock: (s: number) => void;
  startEdit: (item: InventoryItem) => void;
  saveEdit: (id: string) => void;
}

export default function InventoryTab({
  inventory, searchTerm, setSearchTerm, editingId,
  editPrice, setEditPrice, editStock, setEditStock,
  startEdit, saveEdit
}: InventoryTabProps) {
  const lowStockItems = inventory.filter(item => item.stock < 10);
  const expiringItems = inventory.filter(item => item.expiryDays <= 30);
  
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* ALERTS DASHBOARD */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <AlertCircle className="text-[var(--color-brand-blue)]" /> Alerts Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        
        {/* Low Stock Widget */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-bold text-amber-900">Low Stock Warning (&lt; 10 Units)</h3>
          </div>
          {lowStockItems.length > 0 ? (
            <ul className="space-y-3">
              {lowStockItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-white/60 px-4 py-2 rounded-xl border border-amber-200">
                  <span className="font-semibold text-amber-900">{item.name}</span>
                  <span className="font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full text-sm">
                    {item.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-amber-700">All items are sufficiently stocked.</p>
          )}
        </div>

        {/* Expiry Watch Widget */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-red-900">Expiry Watch (&le; 30 Days)</h3>
          </div>
          {expiringItems.length > 0 ? (
            <ul className="space-y-3">
              {expiringItems.map(item => (
                <li key={item.id} className="flex justify-between items-center bg-white/60 px-4 py-2 rounded-xl border border-red-200">
                  <span className="font-semibold text-red-900">{item.name}</span>
                  <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm">
                    {item.expiryDays} days
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-700">No items expiring soon.</p>
          )}
        </div>

      </div>

      {/* ACTIVE INVENTORY */}
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-slate-800">Active Inventory</h2>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400" size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)]"
            placeholder="Search medicine name..."
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Medicine Name</th>
                <th className="p-4 font-semibold">Stock Quantity</th>
                <th className="p-4 font-semibold">Expiry (Days)</th>
                <th className="p-4 font-semibold">Price (RWF)</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInventory.length > 0 ? (
                filteredInventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-medium">{item.name}</td>
                    
                    {/* Stock Column */}
                    <td className="p-4">
                      {editingId === item.id ? (
                        <input 
                          type="number" 
                          value={editStock} 
                          onChange={e => setEditStock(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-slate-300 rounded-md focus:border-[var(--color-brand-blue)] outline-none"
                        />
                      ) : (
                        <span className={`font-semibold ${item.stock < 10 ? 'text-amber-600' : ''}`}>
                          {item.stock}
                        </span>
                      )}
                    </td>

                    {/* Expiry Column */}
                    <td className="p-4">
                      <span className={`font-semibold ${item.expiryDays <= 30 ? 'text-red-500' : ''}`}>
                        {item.expiryDays}
                      </span>
                    </td>

                    {/* Price Column */}
                    <td className="p-4 font-mono">
                      {editingId === item.id ? (
                        <input 
                          type="number" 
                          value={editPrice} 
                          onChange={e => setEditPrice(Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-slate-300 rounded-md focus:border-[var(--color-brand-blue)] outline-none"
                        />
                      ) : (
                        <span>{item.price.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="p-4 text-right">
                      {editingId === item.id ? (
                        <button 
                          onClick={() => saveEdit(item.id)}
                          className="text-[var(--color-brand-blue)] hover:text-[var(--color-brand-blue-hover)] bg-sky-50 p-2 rounded-lg transition-colors font-semibold flex items-center gap-1 inline-flex"
                        >
                          <Save size={16} /> Save
                        </button>
                      ) : (
                        <button 
                          onClick={() => startEdit(item)}
                          className="text-slate-400 hover:text-[var(--color-brand-blue)] p-2 rounded-lg transition-colors inline-flex opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Edit3 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No medicines found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
