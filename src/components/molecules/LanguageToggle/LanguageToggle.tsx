import { Languages } from "lucide-react";

import { useAppPreferences } from "../../../context";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { language, setLanguage } = useAppPreferences();
  const nextLanguage = language === "de" ? "en" : "de";

  return (
    <button
      type="button"
      className={"btn btn-ghost gap-2 rounded-xl " + className}
      onClick={() => setLanguage(nextLanguage)}
      aria-label={
        language === "de" ? "Switch to English" : "Auf Deutsch wechseln"
      }
      title={language === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      <Languages size={18} aria-hidden="true" />
      <span className="font-semibold">{nextLanguage.toUpperCase()}</span>
    </button>
  );
}
