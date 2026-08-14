import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enPricing from './locales/en/pricing.json';

import esCommon from './locales/es/common.json';
import esHome from './locales/es/home.json';
import esPricing from './locales/es/pricing.json';

import frCommon from './locales/fr/common.json';
import frHome from './locales/fr/home.json';
import frPricing from './locales/fr/pricing.json';

import deCommon from './locales/de/common.json';
import deHome from './locales/de/home.json';
import dePricing from './locales/de/pricing.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    pricing: enPricing
  },
  es: {
    common: esCommon,
    home: esHome,
    pricing: esPricing
  },
  fr: {
    common: frCommon,
    home: frHome,
    pricing: frPricing
  },
  de: {
    common: deCommon,
    home: deHome,
    pricing: dePricing
  }
};

i18n
  .use(LanguageDetector) // Auto-detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    defaultNS: 'common', // Default namespace
    
    detection: {
      // Order of detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'wp_language',
      // Cache user language
      caches: ['localStorage'],
      // Check all fallback languages
      checkWhitelist: true
    },

    interpolation: {
      escapeValue: false // React already escapes
    },

    // Supported languages
    supportedLngs: ['en', 'es', 'fr', 'de'],
    
    react: {
      useSuspense: false // Disable suspense for now
    }
  });

export default i18n;
