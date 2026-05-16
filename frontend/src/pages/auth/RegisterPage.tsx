import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, User, Mail, Lock, Phone, Building2, FileText, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

type Role = 'PATIENT' | 'PHARMACIST';
type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>('PATIENT');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pharmacyName: '',
    licenseNumber: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Issue #8 — show password toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (form.password.length < 6) {
      setError(t('auth.passwordShort'));
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role,
        ...(role === 'PHARMACIST' && {
          pharmacyName: form.pharmacyName,
          licenseNumber: form.licenseNumber,
          address: form.address,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
          {role === 'PHARMACIST' ? (
            <p className="text-slate-400 mb-6">Your pharmacy registration is pending admin approval. You'll be able to access your dashboard once approved.</p>
          ) : (
            <p className="text-slate-400 mb-6">Your account is ready. Sign in to start finding medicines near you.</p>
          )}
          <button onClick={() => navigate('/login')} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-all">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-sky-500 text-white p-3 rounded-2xl shadow-lg shadow-sky-500/30">
              <Pill size={28} />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Imiti<span className="text-sky-400">PharmaFind</span>
            </span>
          </div>
          <p className="text-slate-400">Create your account to get started</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6 px-2">
          {[1, 2, ...(role === 'PHARMACIST' ? [3] : [])].map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-sky-500 text-white' : 'bg-white/10 text-slate-500'}`}>{s}</div>
              {i < arr.length - 1 && <div className={`h-0.5 flex-1 transition-all ${step > s ? 'bg-sky-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Who are you?</h2>
              <p className="text-slate-400 text-sm mb-6">Select your role to set up the right account type</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {(['PATIENT', 'PHARMACIST'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${role === r ? 'border-sky-500 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === r ? 'bg-sky-500' : 'bg-white/10'}`}>
                      {r === 'PATIENT' ? <User size={22} className="text-white" /> : <Building2 size={22} className="text-white" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white text-sm">{r === 'PATIENT' ? 'Patient' : 'Pharmacist'}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{r === 'PATIENT' ? 'Find medicines near you' : 'Manage your pharmacy'}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                Continue <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Personal Details</h2>
              <p className="text-slate-400 text-sm mb-6">Tell us a bit about yourself</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input id="reg-firstname" type="text" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Jean" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input id="reg-lastname" type="text" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Dupont" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}><Mail size={14} className="inline mr-1" />Email</label>
                  <input id="reg-email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><Phone size={14} className="inline mr-1" />Phone (optional)</label>
                  <input id="reg-phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+250 7XX XXX XXX" className={inputClass} />
                </div>

                {/* Issue #8 — Password with show/hide toggle */}
                <div>
                  <label className={labelClass}><Lock size={14} className="inline mr-1" />Password</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min 6 characters"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                {role === 'PHARMACIST' ? (
                  <button
                    onClick={() => {
                      if (!form.firstName || !form.email || !form.password) { setError('Please fill all required fields'); return; }
                      setError(''); setStep(3);
                    }}
                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Pharmacy Info */}
          {step === 3 && role === 'PHARMACIST' && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Pharmacy Details</h2>
              <p className="text-slate-400 text-sm mb-6">Your pharmacy will be reviewed by an admin before going live</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}><Building2 size={14} className="inline mr-1" />Pharmacy Name</label>
                  <input id="reg-pharmacy-name" type="text" required value={form.pharmacyName} onChange={(e) => update('pharmacyName', e.target.value)} placeholder="Belyse Pharmacy Musanze" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}><FileText size={14} className="inline mr-1" />License Number</label>
                  <input id="reg-license" type="text" required value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} placeholder="RWA-PH-2026-XXX" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Address / Location</label>
                  <input id="reg-address" type="text" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="KN 5 Rd, Musanze" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                <button onClick={handleSubmit} disabled={isLoading || !form.pharmacyName || !form.licenseNumber} className="flex-1 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Registration'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
