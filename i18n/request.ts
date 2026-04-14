import { getRequestConfig } from "next-intl/server";
import { getLocale } from "@/lib/locale-server";
import { getMessages } from "@/lib/i18n";

export default getRequestConfig(async () => {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return {
    locale,
    messages,
  };
});
