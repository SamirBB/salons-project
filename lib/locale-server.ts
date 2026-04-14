import { cookies } from 'next/headers';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from './locale';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value as Locale;
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}
