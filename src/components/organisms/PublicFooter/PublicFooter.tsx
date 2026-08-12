import { Link } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { useAppPreferences } from "../../../context";
export default function PublicFooter() {
  const { language } = useAppPreferences();
  const de = language === "de";
  return (
    <footer className="border-t border-base-300 bg-base-200/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 text-xl font-black">
            <img
              src="/brand/autocare-logo.svg"
              alt="AutoCare"
              className="size-10"
            />
            <span>AutoCare</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 opacity-70">
            {de
              ? "Professionelle Fahrzeugpflege und spezialisierte Leistungen mit einem einfachen, transparenten Buchungsablauf."
              : "Professional vehicle care and specialist services with a simple, transparent booking experience."}
          </p>
        </div>
        <nav aria-label={de ? "Fußzeilen-Navigation" : "Footer navigation"}>
          <h2 className="font-bold">{de ? "Entdecken" : "Explore"}</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <Link to="/services" className="link-hover">
              {de ? "Leistungen" : "Services"}
            </Link>
            <Link to="/booking" className="link-hover">
              {de ? "Termin buchen" : "Book appointment"}
            </Link>
            <Link to="/my-booking" className="link-hover">
              {de ? "Meine Buchung" : "My booking"}
            </Link>
          </div>
        </nav>
        <nav aria-label={de ? "Unternehmen" : "Company"}>
          <h2 className="font-bold">{de ? "Unternehmen" : "Company"}</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <Link to="/about" className="link-hover">
              {de ? "Über uns" : "About"}
            </Link>
            <Link to="/contact" className="link-hover">
              {de ? "Kontakt" : "Contact"}
            </Link>
            <Link to="/impressum" className="link-hover">
              Impressum
            </Link>
            <Link
              to="/booking"
              className="btn btn-primary btn-sm mt-2 w-fit gap-2"
            >
              <CalendarCheck size={17} />
              {de ? "Termin buchen" : "Book now"}
            </Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-base-300 px-4 py-5 text-center text-sm opacity-60">
        © {new Date().getFullYear()} AutoCare.{" "}
        {de ? "Alle Rechte vorbehalten." : "All rights reserved."}
      </div>
    </footer>
  );
}
