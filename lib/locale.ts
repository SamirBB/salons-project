export const SUPPORTED_LOCALES = ['bs', 'hr', 'en', 'sl', 'it', 'es'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'bs';
