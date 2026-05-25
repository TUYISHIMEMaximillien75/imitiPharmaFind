import { Link } from 'react-router-dom';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const homeLink = user?.role === 'ADMIN' ? '/admin' : user?.role === 'PHARMACIST' ? '/pharmacist' : '/';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={48} className="text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">{t('unauthorized.title', 'Access Denied')}</h1>
        <p className="text-slate-500 dark:text-gray-400 mb-8">
          {t('unauthorized.description', "You don't have permission to view this page. This area is restricted to a specific role.")}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-300 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 font-semibold transition-colors">
            <ArrowLeft size={18} /> {t('common.back', 'Go Back')}
          </button>
          <Link to={homeLink} className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-semibold transition-colors">
            <Home size={18} /> {t('unauthorized.dashboard', 'My Dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
