import { Link } from "@tanstack/react-router";
import { Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { useAppPreferences } from "../../../context";
import { useTranslation } from "../../../i18n";

export default function PublicNavbar() {
  const { theme, language, toggleTheme, toggleLanguage } =
    useAppPreferences();

  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: t.public.nav.home, to: "/" },
    { label: t.public.nav.services, to: "/services" },
    { label: t.public.nav.about, to: "/about" },
    { label: t.public.nav.contact, to: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100/90 shadow-sm backdrop-blur-md">
      <div className="navbar mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex-1">
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-bold"
            onClick={() => setIsOpen(false)}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-content">
              A
            </span>

            <span>AutoCare</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="btn btn-ghost rounded-xl"
              activeProps={{
                className: "btn btn-primary rounded-xl",
              }}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/booking"
            className="btn btn-primary rounded-xl"
          >
            {t.public.nav.booking}
          </Link>

          <button
            type="button"
            className="btn btn-ghost btn-circle"
            onClick={toggleLanguage}
            aria-label={t.navbar.language}
            title={t.navbar.language}
          >
            <Languages size={19} />
          </button>

          <span className="text-sm font-semibold">
            {language.toUpperCase()}
          </span>

          <button
            type="button"
            className="btn btn-ghost btn-circle"
            onClick={toggleTheme}
            aria-label={t.navbar.theme}
          >
            {theme === "light" ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </button>
        </nav>

        {/* Mobile Controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={toggleLanguage}
          >
            <Languages size={18} />
            {language.toUpperCase()}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm"
            onClick={() => setIsOpen((previous) => !previous)}
            aria-label="Menu"
          >
            {isOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t border-base-300 bg-base-100 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="btn btn-ghost justify-start rounded-xl"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/booking"
              className="btn btn-primary rounded-xl"
              onClick={() => setIsOpen(false)}
            >
              {t.public.nav.booking}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
