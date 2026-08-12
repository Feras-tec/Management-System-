import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";
import { useAppPreferences } from "../../../context";
import { LanguageToggle } from "../../molecules/LanguageToggle";
import { useTranslation } from "../../../i18n";
export default function PublicNavbar() {
  const { theme, language, toggleTheme } = useAppPreferences();
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const links = [
    { label: t.public.nav.home, to: "/" },
    { label: t.public.nav.services, to: "/services" },
    { label: t.public.nav.booking, to: "/booking" },
    { label: t.public.nav.myBooking, to: "/my-booking" },
    { label: t.public.nav.about, to: "/about" },
    { label: t.public.nav.contact, to: "/contact" },
  ] as const;
  return (
    <header className="sticky top-0 z-50 border-b border-base-300/70 bg-base-100/90 backdrop-blur-xl">
      <div className="navbar mx-auto max-w-7xl px-3 sm:px-4 lg:px-2 xl:px-6">
        <Link
          to="/"
          className="flex flex-1 items-center gap-3"
          onClick={() => setMenu(false)}
        >
          <img
            src="/brand/autocare-logo.svg"
            alt="AutoCare"
            className="size-10 shrink-0"
          />
          <span className="text-xl font-black tracking-tight">AutoCare</span>
        </Link>
        <nav
          aria-label={language === "de" ? "Hauptnavigation" : "Main navigation"}
          className="hidden items-center gap-0 lg:flex"
        >
          {links.map((x) => (
            <Link
              key={x.to}
              to={x.to}
              className="btn btn-ghost btn-sm rounded-xl px-2"
              activeProps={{
                className: "btn btn-soft btn-primary btn-sm rounded-xl",
              }}
            >
              {x.label}
            </Link>
          ))}
        </nav>
        <div className="ml-1 hidden items-center gap-0 lg:flex">
          <LanguageToggle className="btn-sm" />
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={toggleTheme}
            aria-label={t.navbar.theme}
          >
            {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <Link
            to="/booking"
            className="btn btn-primary btn-sm ml-0 gap-1 whitespace-nowrap px-2"
          >
            <CalendarCheck size={18} />
            {language === "de" ? "Termin buchen" : "Book appointment"}
          </Link>
          <div
            className="ml-1 flex items-center gap-1"
            data-testid="desktop-auth-controls"
          >
            <SignedOut>
              <Link to="/sign-in" className="btn btn-outline btn-sm">
                {t.navbar.signIn}
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <SignOutButton redirectUrl="/">
                <button type="button" className="btn btn-ghost btn-sm">
                  {t.navbar.signOut}
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <LanguageToggle className="btn-sm" />
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={toggleTheme}
            aria-label={t.navbar.theme}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            aria-label={
              menu
                ? language === "de"
                  ? "Menü schließen"
                  : "Close menu"
                : language === "de"
                  ? "Menü öffnen"
                  : "Open menu"
            }
            aria-expanded={menu}
            aria-controls="public-mobile-menu"
            onClick={() => setMenu((x) => !x)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.nav
            id="public-mobile-menu"
            aria-label={
              language === "de" ? "Mobile Navigation" : "Mobile navigation"
            }
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? undefined : { opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-base-300 bg-base-100 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-1 p-4">
              {links.map((x) => (
                <Link
                  key={x.to}
                  to={x.to}
                  className="btn btn-ghost justify-start"
                  activeProps={{
                    className: "btn btn-soft btn-primary justify-start",
                  }}
                  onClick={() => setMenu(false)}
                >
                  {x.label}
                </Link>
              ))}
              <Link
                to="/booking"
                className="btn btn-primary mt-2"
                onClick={() => setMenu(false)}
              >
                {language === "de" ? "Termin buchen" : "Book appointment"}
              </Link>
              <div
                className="mt-1 grid gap-1"
                data-testid="mobile-auth-controls"
              >
                <SignedOut>
                  <Link
                    to="/sign-in"
                    className="btn btn-outline justify-start"
                    onClick={() => setMenu(false)}
                  >
                    {t.navbar.signIn}
                  </Link>
                </SignedOut>
                <SignedIn>
                  <div className="px-4 py-2">
                    <UserButton />
                  </div>
                  <SignOutButton redirectUrl="/">
                    <button
                      type="button"
                      className="btn btn-ghost justify-start"
                    >
                      {t.navbar.signOut}
                    </button>
                  </SignOutButton>
                </SignedIn>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
