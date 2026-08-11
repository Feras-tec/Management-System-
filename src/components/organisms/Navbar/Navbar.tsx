import { Link } from "@tanstack/react-router";
import { Languages, Moon, Sun } from "lucide-react";

import { useAppPreferences } from "../../../context/AppPreferencesContext";
import { useTranslation } from "../../../i18n";

import type { NavItem } from "./Navbar.types";

export default function Navbar() {
  const { theme, language, toggleTheme, toggleLanguage } = useAppPreferences();

  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { label: t.navbar.dashboard, to: "/admin" },
    { label: t.navbar.employees, to: "/admin/employees" },
    { label: t.navbar.products, to: "/admin/products" },
    { label: t.navbar.customers, to: "/admin/customers" },
    { label: t.navbar.sales, to: "/admin/sales" },
    { label: t.navbar.reports, to: "/admin/reports" },
  ];

  return (
    <header className="navbar sticky top-0 z-50 border-b border-base-300 bg-base-100/95 px-4 shadow-sm backdrop-blur-md sm:px-6">
      {/* Logo */}
      <div className="flex-1">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-primary transition-transform duration-200 hover:scale-105"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-content">
            B
          </span>

          <span className="hidden sm:inline">{t.common.appName}</span>

          <span className="sm:hidden">BMS</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden items-center gap-2 lg:flex">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="btn btn-ghost rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            activeProps={{
              className: "btn btn-primary rounded-xl shadow-md",
            }}
          >
            {item.label}
          </Link>
        ))}

        {/* Language Switcher */}
        <button
          type="button"
          className="btn btn-ghost gap-2 rounded-xl"
          onClick={toggleLanguage}
          aria-label={t.navbar.language}
          title={t.navbar.language}
        >
          <Languages size={19} />

          <span className="font-semibold">{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="btn btn-circle btn-ghost transition-transform duration-200 hover:rotate-12"
          onClick={toggleTheme}
          aria-label={t.navbar.theme}
          title={t.navbar.theme}
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Mobile Actions */}
      <div className="flex items-center gap-1 lg:hidden">
        {/* Language */}
        <button
          type="button"
          className="btn btn-sm btn-ghost gap-1 rounded-xl"
          onClick={toggleLanguage}
          aria-label={t.navbar.language}
        >
          <Languages size={17} />

          <span className="font-semibold">{language.toUpperCase()}</span>
        </button>

        {/* Theme */}
        <button
          type="button"
          className="btn btn-circle btn-sm btn-ghost"
          onClick={toggleTheme}
          aria-label={t.navbar.theme}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Mobile Menu */}
        <div className="dropdown dropdown-end">
          <button
            type="button"
            tabIndex={0}
            className="btn btn-circle btn-ghost"
            aria-label="Open navigation menu"
          >
            ☰
          </button>

          <ul
            tabIndex={0}
            className="menu dropdown-content z-60 mt-3 w-56 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
          >
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="rounded-xl">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
