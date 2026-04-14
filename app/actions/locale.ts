'use server';

import { cookies } from 'next/headers';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/locale';

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  if (SUPPORTED_LOCALES.includes(locale)) {
    cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
}
