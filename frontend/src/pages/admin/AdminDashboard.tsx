import { useState } from 'react';
import { ShieldCheck, Building2, FileCheck, CheckCircle, Clock } from 'lucide-react';
import type { Registration } from '../../types';

const mockRegistrations: Registration[] = [
  { id: 'REG-201', pharmacyName: 'Kipharma Kigali', licenseNumber: 'RWA-PH-2026-892', submittedAt: '2026-04-03 14:30', status: 'pending' },
  { id: 'REG-202', pharmacyName: 'Belyse Pharmacy Musanze', licenseNumber: 'RWA-PH-2026-893', submittedAt: '2026-04-04 08:15', status: 'pending' },
];

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>(mockRegistrations);

  const handleApprove = (id: string) => {
    setRegistrations(registrations.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-[var(--color-brand-blue)]" size={32} /> 
          Admin Approval Portal
        </h1>
        <p className="text-slate-500 mt-2">Manage and verify new pharmacy registrations before they join the network.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={20} className="text-slate-500" />
            Registration Queue
          </h2>
          <span className="bg-amber-100 text-amber-700 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wide">
            {pendingCount} Pending Verification
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Pharmacy Name</th>
                <th className="p-4 font-semibold">License Number</th>
                <th className="p-4 font-semibold">Submitted</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {registrations.map(reg => (
                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{reg.pharmacyName}</td>
                  <td className="p-4 font-mono text-slate-600 bg-slate-50">{reg.licenseNumber}</td>
                  <td className="p-4 text-sm text-slate-500">{reg.submittedAt}</td>
                  <td className="p-4">
                    {reg.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-amber-600 text-sm font-semibold">
                        <Clock size={16} /> Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <CheckCircle size={16} /> Approved
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {reg.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 font-semibold transition-colors text-sm">
                          <FileCheck size={16} /> Verify License
                        </button>
                        <button 
                          onClick={() => handleApprove(reg.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors text-sm shadow-sm"
                        >
                          <ShieldCheck size={16} /> Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm font-semibold items-center justify-end flex h-10">
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
