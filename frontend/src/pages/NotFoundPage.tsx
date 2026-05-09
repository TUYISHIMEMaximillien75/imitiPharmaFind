import { useNavigate } from 'react-router-dom';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mb-2 mx-auto">
          <SearchX size={56} className="text-sky-300 dark:text-sky-500" />
        </div>
        <span className="absolute -top-2 -right-2 text-6xl font-black text-slate-100 dark:text-gray-800 select-none leading-none">
          404
        </span>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">Page not found</h1>
      <p className="text-slate-500 dark:text-gray-400 max-w-sm mb-8 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          id="not-found-back-btn"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 font-semibold rounded-xl transition-all text-sm"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
        <button
          id="not-found-home-btn"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-sky-500/30"
        >
          <Home size={16} /> Back to Home
        </button>
      </div>
    </main>
  );
}
