import type { Locale } from './locale';

export async function getMessages(locale: Locale) {
  return (await import(`../locales/${locale}.json`)).default;
}
