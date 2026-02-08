import arErrors from './ar/errors.json';
import enErrors from './en/errors.json';

type Locale = 'ar' | 'en';
type MessageKey = keyof typeof arErrors;

const messages = {
    ar: { errors: arErrors },
    en: { errors: enErrors }
};

export const t = (key: MessageKey, locale: string = 'ar'): string => {
    const safeLocale = (['ar', 'en'].includes(locale) ? locale : 'ar') as Locale;
    return messages[safeLocale].errors[key] || messages['en'].errors[key] || key;
};

export const getErrorResponse = (key: MessageKey, locale: string = 'ar', details?: any) => {
    const message = t(key, locale);
    return {
        success: false,
        error_code: key,
        message,
        locale,
        ...(details ? { details } : {})
    };
};
