import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import English from './en/translation.json';
import Greek from './el/translation.json';

export const LANGUAGES = ['el', 'en'];

const LOCALES = { el: 'el-GR', en: 'en-GB' };
const DEFAULT_LANGUAGE = 'el';
const STORAGE_KEY = 'language';

const stored = localStorage.getItem(STORAGE_KEY);

// Skip initialization if this has been done from a host
if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
        resources: {
            en: { translation: English },
            el: { translation: Greek },
        },
        lng: LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE,
        fallbackLng: 'en',
        react: {
            useSuspense: false,
        },
        interpolation: {
            prefix: '{',
            suffix: '}',
            escapeValue: false, // react already safes from xss
        },
    });
}

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
});

export const getLocale = () => LOCALES[i18n.language] ?? LOCALES[DEFAULT_LANGUAGE];
export const setLanguage = (lng) => i18n.changeLanguage(lng);

// Non-hook lookup for code outside React components.
export const translate = (key, options) => i18n.t(key, options);

// `prefix` scopes keys to a top-level section of translation.json.
export const useTranslations = (prefix) => {
    const result = useTranslation('translation', prefix ? { keyPrefix: prefix } : undefined);
    const language = result.i18n.language;
    return { ...result, language, locale: LOCALES[language] ?? LOCALES[DEFAULT_LANGUAGE] };
};

export default i18n;
