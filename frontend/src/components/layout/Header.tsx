import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown, ClipboardList, Package, ShieldCheck, Menu, X, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { applyDirection } from '../../i18n';
import logo from '../../assets/system_icon.png';

function LeafIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-sky-400" aria-hidden="true">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c9 0 11-11 11-11s-1.55 1.07-3 1.82A4.5 4.5 0 0 0 17 8z" />
    </svg>
  );
}

function Wordmark() {
  return (
    <span className="flex items-baseline gap-0 leading-none select-none">
      <span className="font-extrabold tracking-tight text-slate-800 dark:text-white text-[15px]">Im</span>
      <span className="relative inline-block font-extrabold tracking-tight text-sky-500 dark:text-sky-400 text-[15px]" style={{ paddingTop: '6px' }}>
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1" style={{ lineHeight: 0 }}>
          <LeafIcon size={11} />
        </span>
        i
      </span>
      <span className="font-extrabold tracking-tight text-slate-800 dark:text-white text-[15px]">ti</span>
      <span className="font-extrabold tracking-tight text-sky-500 text-[15px]">Pharma</span>
      <span className="font-extrabold tracking-tight text-slate-600 dark:text-gray-300 text-[15px]">Find</span>
    </span>
  );
}

const LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'rw', label: 'RW', flag: '🇷🇼' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
];

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === i18n.language?.slice(0, 2)) ?? LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Change language"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-gray-300"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-950/60 border border-slate-200 dark:border-gray-700 py-1.5 z-20">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); applyDirection(lang.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 font-bold'
                    : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="font-semibold">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggle, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinkClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? 'text-sky-500 bg-sky-500/10'
        : 'text-slate-500 dark:text-gray-400 hover:text-sky-500 hover:bg-sky-500/10'
    }`;

  const displayName = user
    ? (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email)
    : '';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo + Wordmark */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-sky-400/20 scale-0 group-hover:scale-110 transition-transform duration-300" />
            <img src={logo} alt="ImitiPharmaFind logo" className="h-9 w-9 object-contain relative z-10 drop-shadow-sm" />
          </div>
          <div className="hidden sm:flex flex-col gap-0.5">
            <Wordmark />
            {user?.role === 'PHARMACIST' && user.pharmacy?.name ? (
              <p className="text-[10px] text-sky-500 dark:text-sky-300/50 font-semibold tracking-wide leading-none pl-0.5 truncate max-w-[160px]">
                {user.pharmacy.name}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 dark:text-gray-600 font-medium tracking-wide leading-none pl-0.5">
                Musanze · Rwanda
              </p>
            )}
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {!isAuthenticated && (
            <Link to="/" className={navLinkClass('/')}>{t('nav.home')}</Link>
          )}
          {isAuthenticated && user?.role === 'PATIENT' && (
            <>
              <Link to="/" className={navLinkClass('/')}>{t('nav.findMedicines')}</Link>
              <Link to="/my-reservations" className={navLinkClass('/my-reservations')}>
                <ClipboardList size={15} /> {t('nav.myReservations')}
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'PHARMACIST' && (
            <Link to="/pharmacist" className={navLinkClass('/pharmacist')}>
              <Package size={15} /> {t('nav.dashboard')}
            </Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" className={navLinkClass('/admin')}>
              <ShieldCheck size={15} /> {t('nav.adminPortal')}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block px-4 py-2 text-sm font-semibold text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-white transition-colors">
                {t('common.signIn')}
              </Link>
              <Link to="/register" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-sky-500/30">
                {t('common.getStarted')}
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/20 dark:bg-sky-400/20 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-sm">
                  {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-gray-200 max-w-28 truncate">{displayName}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-950/60 border border-slate-200 dark:border-gray-700 py-2 z-20">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-800 mb-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${user?.role === 'ADMIN' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                          user?.role === 'PHARMACIST' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400' :
                          'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400'}`}>
                        {user?.role}
                      </span>
                    </div>

                    <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                      <User size={15} className="text-slate-400 dark:text-gray-500" /> {t('nav.myProfile')}
                    </Link>

                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut size={15} /> {t('common.signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-slate-600 dark:text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          {!isAuthenticated && (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('nav.home')}</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('common.signIn')}</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-sky-500 font-semibold rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20">{t('common.getStarted')}</Link>
            </>
          )}
          {isAuthenticated && user?.role === 'PATIENT' && (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('nav.findMedicines')}</Link>
              <Link to="/my-reservations" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('nav.myReservations')}</Link>
            </>
          )}
          {isAuthenticated && user?.role === 'PHARMACIST' && (
            <Link to="/pharmacist" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('nav.dashboard')}</Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">{t('nav.adminPortal')}</Link>
          )}
          {isAuthenticated && (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">{t('common.signOut')}</button>
          )}
          {/* Language switcher in mobile menu */}
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-gray-800 mt-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); applyDirection(lang.code); setMenuOpen(false); }}
                className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800"
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

