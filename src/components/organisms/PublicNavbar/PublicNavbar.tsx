import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarCheck, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import { useAppPreferences } from "../../../context";
import { useTranslation } from "../../../i18n";
import { LanguageToggle } from "../../molecules/LanguageToggle";

type AuthControlsProps = {
  mobile: boolean;
  signIn: string;
  signOut: string;
};

export default function PublicNavbar() {
  const { theme, language, toggleTheme } = useAppPreferences();
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const [menu, setMenu] = useState(false);
  const [AuthControls, setAuthControls] =
    useState<ComponentType<AuthControlsProps> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAuthControls = () => {
      void import("./PublicAuthControls").then((module) => {
        if (!cancelled) {
          setAuthControls(() => module.default);
        }
      });
    };

    if (import.meta.env.MODE === "test") {
      loadAuthControls();

      return () => {
        cancelled = true;
      };
    }

    const windowWithIdle = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (windowWithIdle.requestIdleCallback) {
      const idleId = windowWithIdle.requestIdleCallback(loadAuthControls, {
        timeout: 1500,
      });

      return () => {
        cancelled = true;
        windowWithIdle.cancelIdleCallback?.(idleId);
      };
    }

    const timer = window.setTimeout(loadAuthControls, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const authPlaceholder = (mobile: boolean) => (
    <div
      className={mobile ? "h-10 w-full" : "h-8 w-24 shrink-0"}
      aria-hidden="true"
    />
  );

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
            width={40}
            height={40}
            className="size-10 shrink-0"
          />

          <span className="text-xl font-black tracking-tight">AutoCare</span>
        </Link>

        <nav
          aria-label={language === "de" ? "Hauptnavigation" : "Main navigation"}
          className="hidden items-center gap-0 lg:flex"
        >
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="btn btn-ghost btn-sm rounded-xl px-2"
              activeProps={{
                className: "btn btn-soft btn-primary btn-sm rounded-xl",
              }}
            >
              {item.label}
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
            {AuthControls ? (
              <AuthControls
                mobile={false}
                signIn={t.navbar.signIn}
                signOut={t.navbar.signOut}
              />
            ) : (
              authPlaceholder(false)
            )}
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
            onClick={() => setMenu((value) => !value)}
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
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="btn btn-ghost justify-start"
                  activeProps={{
                    className: "btn btn-soft btn-primary justify-start",
                  }}
                  onClick={() => setMenu(false)}
                >
                  {item.label}
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
                {AuthControls ? (
                  <AuthControls
                    mobile
                    signIn={t.navbar.signIn}
                    signOut={t.navbar.signOut}
                  />
                ) : (
                  authPlaceholder(true)
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
