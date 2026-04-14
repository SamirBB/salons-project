import type { Locale } from './locale';

export async function getMessages(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default;
}
