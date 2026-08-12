import { Link, createFileRoute } from "@tanstack/react-router";
import { Reveal } from "../../components/motion/Reveal";
import { CalendarCheck, Clock3, Mail, MapPin, Phone } from "lucide-react";

import { useAppPreferences } from "../../context";
import { DEMO_BUSINESS, formatDemoAddress } from "../../content/demoBusiness";
import { usePageMeta } from "../../utils/usePageMeta";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { language } = useAppPreferences();
  const de = language === "de";
  const demoLabel = de
    ? "Beispieldaten für die Entwicklung"
    : "Development demo information";

  usePageMeta(
    de ? "Kontakt" : "Contact",
    de
      ? "Kontakt und Terminbuchung bei AutoCare."
      : "Contact and appointment booking at AutoCare.",
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black sm:text-5xl">
          {de ? "Kontakt" : "Contact"}
        </h1>
        <p className="mt-5 text-lg leading-8 opacity-70">
          {de
            ? "Für Fragen zu unseren Leistungen oder einen Termin sind wir über die folgenden Demo-Kontaktdaten erreichbar."
            : "For questions about our services or an appointment, you can use the following demo contact details."}
        </p>
        <span className="badge badge-outline mt-5">{demoLabel}</span>
      </div>

      <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2">
        <Reveal delay={0.0}>
          <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="card-body">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-6" aria-hidden="true" />
              </span>
              <h2 className="card-title mt-3">{de ? "Adresse" : "Address"}</h2>
              <p className="leading-7">{formatDemoAddress(language)}</p>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.05}>
          <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="card-body">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-6" aria-hidden="true" />
              </span>
              <h2 className="card-title mt-3">{de ? "Telefon" : "Phone"}</h2>
              <a
                className="link link-primary"
                href={`tel:${DEMO_BUSINESS.phone.replaceAll(" ", "")}`}
              >
                {DEMO_BUSINESS.phone}
              </a>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.1}>
          <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="card-body">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-6" aria-hidden="true" />
              </span>
              <h2 className="card-title mt-3">E-Mail</h2>
              <a
                className="link link-primary break-all"
                href={`mailto:${DEMO_BUSINESS.email}`}
              >
                {DEMO_BUSINESS.email}
              </a>
            </div>
          </article>
        </Reveal>
        <Reveal delay={0.15}>
          <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="card-body">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock3 className="size-6" aria-hidden="true" />
              </span>
              <h2 className="card-title mt-3">
                {de ? "Öffnungszeiten" : "Opening hours"}
              </h2>
              <ul className="space-y-1 text-sm">
                {DEMO_BUSINESS.openingHours.map((hours) => (
                  <li key={hours.en}>{de ? hours.de : hours.en}</li>
                ))}
              </ul>
            </div>
          </article>
        </Reveal>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/booking" className="btn btn-primary">
          <CalendarCheck className="size-4" aria-hidden="true" />
          {de ? "Termin buchen" : "Book appointment"}
        </Link>
        <Link to="/services" className="btn btn-outline">
          {de ? "Leistungen ansehen" : "View services"}
        </Link>
      </div>
    </section>
  );
}
