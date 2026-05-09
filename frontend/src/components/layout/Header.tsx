import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ChevronDown, ClipboardList, Package, ShieldCheck, Menu, X, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/system_icon.png';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggle, isDark } = useTheme();
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

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
          <img src={logo} alt="ImitiPharmaFind" className="h-9 w-auto object-contain" />
          <div className="hidden sm:block">
            <span className="text-base font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">
              Imiti<span className="text-sky-500">Pharma</span><span className="text-sky-400">Find</span>
            </span>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium leading-none mt-0.5">Musanze · Rwanda</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {!isAuthenticated && (
            <Link to="/" className={navLinkClass('/')}>Home</Link>
          )}

          {isAuthenticated && user?.role === 'PATIENT' && (
            <>
              <Link to="/" className={navLinkClass('/')}>Find Medicines</Link>
              <Link to="/my-reservations" className={navLinkClass('/my-reservations')}>
                <ClipboardList size={15} /> My Reservations
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'PHARMACIST' && (
            <Link to="/pharmacist" className={navLinkClass('/pharmacist')}>
              <Package size={15} /> Dashboard
            </Link>
          )}

          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" className={navLinkClass('/admin')}>
              <ShieldCheck size={15} /> Admin Portal
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">

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
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-sky-500/30">
                Get Started
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

              {/* Dropdown */}
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
                      <User size={15} className="text-slate-400 dark:text-gray-500" /> My Profile
                    </Link>

                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut size={15} /> Sign Out
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
              <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">Home</Link>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-sky-500 font-semibold rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20">Get Started</Link>
            </>
          )}
          {isAuthenticated && user?.role === 'PATIENT' && (
            <>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">Find Medicines</Link>
              <Link to="/my-reservations" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">My Reservations</Link>
            </>
          )}
          {isAuthenticated && user?.role === 'PHARMACIST' && (
            <Link to="/pharmacist" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">Dashboard</Link>
          )}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800">Admin Portal</Link>
          )}
          {isAuthenticated && (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">Sign Out</button>
          )}
        </div>
      )}
    </header>
  );
}
