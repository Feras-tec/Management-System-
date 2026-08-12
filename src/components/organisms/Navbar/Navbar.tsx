import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/clerk-react";

import { useAppPreferences } from "../../../context/AppPreferencesContext";
import { useTranslation } from "../../../i18n";
import { LanguageToggle } from "../../molecules/LanguageToggle";

export default function Navbar() {
  const { theme, toggleTheme } = useAppPreferences();
  const { t } = useTranslation();

  return (
    <header className="navbar sticky top-0 z-50 border-b border-base-300 bg-base-100/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex-1">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary transition-transform duration-200 hover:scale-105"
        >
          <img
            src="/brand/autocare-logo.svg"
            alt="AutoCare"
            className="size-9"
          />
          <span>AutoCare</span>
        </Link>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <LanguageToggle className="btn-sm" />
        <button
          type="button"
          className="btn btn-circle btn-ghost transition-transform duration-200 hover:rotate-12"
          onClick={toggleTheme}
          aria-label={t.navbar.theme}
          title={t.navbar.theme}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <UserButton />
        <SignOutButton redirectUrl="/">
          <button type="button" className="btn btn-ghost rounded-xl">
            {t.navbar.signOut}
          </button>
        </SignOutButton>
      </div>

      <div className="flex items-center gap-1 lg:hidden">
        <LanguageToggle className="btn-sm" />
        <button
          type="button"
          className="btn btn-circle btn-sm btn-ghost"
          onClick={toggleTheme}
          aria-label={t.navbar.theme}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <UserButton />
        <SignOutButton redirectUrl="/">
          <button type="button" className="btn btn-ghost btn-sm rounded-xl">
            {t.navbar.signOut}
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
