import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import rw from './locales/rw.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

/** Languages that read right-to-left */
export const RTL_LANGUAGES = new Set(['ar']);

/** Apply or remove RTL direction on <html> */
export function applyDirection(lang: string) {
  const dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
}

i18n
  .use(LanguageDetector)       // auto-detect from localStorage → browser
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      rw: { translation: rw },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,      // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ipf_lang',
    },
  });

// Apply direction immediately on load
i18n.on('initialized', () => applyDirection(i18n.language?.slice(0, 2) || 'en'));

export default i18n;
