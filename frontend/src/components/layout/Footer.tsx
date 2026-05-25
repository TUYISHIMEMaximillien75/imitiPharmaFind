import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 py-8 text-center text-sm text-slate-400 dark:text-gray-600 mt-auto">
      <p>{t('footer.rights', { year })}</p>
      <p className="mt-1 text-xs">{t('footer.madeWith')}</p>
    </footer>
  );
}
