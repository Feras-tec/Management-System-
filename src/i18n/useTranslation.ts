import { useAppPreferences } from "../context";
import { translations } from "./translations";

export function useTranslation() {
  const { language } = useAppPreferences();

  const t = translations[language];

  return {
    t,
    language,
  };
}
