import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 py-8 text-center text-sm text-slate-400 dark:text-gray-600 mt-auto">
      <p>{t('footer.rights', { year })}</p>
      <p className="mt-1 text-xs">{t('footer.madeWith')}</p>
      <a
        href="mailto:umuhirebelyse23@gmail.com"
        className="inline-flex items-center gap-1.5 mt-2 text-xs text-sky-500 hover:text-sky-400 hover:underline transition-colors"
      >
        <Mail size={12} /> {t('footer.contactSupport', 'Contact Support')}
      </a>
    </footer>
  );
}
