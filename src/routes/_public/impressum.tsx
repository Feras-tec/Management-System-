import { createFileRoute } from "@tanstack/react-router";
import { Building2, Mail, MapPin, ShieldAlert, UserRound } from "lucide-react";

import { Reveal } from "../../components/motion/Reveal";
import { useAppPreferences } from "../../context";
import { DEMO_BUSINESS, formatDemoAddress } from "../../content/demoBusiness";
import { usePageMeta } from "../../utils/usePageMeta";

export const Route = createFileRoute("/_public/impressum")({
  component: ImpressumPage,
});

function ImpressumPage() {
  const { language } = useAppPreferences();
  const de = language === "de";
  usePageMeta(
    "Impressum",
    de
      ? "Beispielhafte Anbieterinformationen."
      : "Example provider information.",
  );

  const sections = [
    [
      Building2,
      de ? "Angaben gemäß §5 TMG" : "Provider information",
      DEMO_BUSINESS.legalName,
      formatDemoAddress(language),
    ],
    [
      UserRound,
      de ? "Vertreten durch" : "Represented by",
      DEMO_BUSINESS.representative,
      de ? "Geschäftsführung (DEMO)" : "Managing director (DEMO)",
    ],
    [
      Mail,
      de ? "Kontakt" : "Contact",
      DEMO_BUSINESS.phone,
      DEMO_BUSINESS.email,
    ],
    [
      ShieldAlert,
      de ? "Umsatzsteuer" : "VAT",
      de ? "USt-IdNr." : "VAT ID",
      DEMO_BUSINESS.vatId,
    ],
  ] as const;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-3xl">
        <p className="font-semibold text-primary">AutoCare</p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">Impressum</h1>
        <p className="mt-5 text-lg opacity-70">
          {de
            ? "Transparente Beispielangaben für die Entwicklungsumgebung."
            : "Transparent example information for the development environment."}
        </p>
      </div>
      <Reveal className="mt-8 max-w-4xl">
        <div className="alert alert-warning shadow-sm">
          <ShieldAlert className="shrink-0" aria-hidden="true" />
          <span>
            {de
              ? "Beispieldaten für die Entwicklung – vor Veröffentlichung durch verifizierte Unternehmensangaben ersetzen."
              : "Development demo data – replace with verified legal business information before publication."}
          </span>
        </div>
      </Reveal>
      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2">
        {sections.map(([Icon, title, first, second], index) => (
          <Reveal key={title} delay={index * 0.05} className="h-full">
            <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="card-body">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h2 className="card-title mt-3">{title}</h2>
                <p className="font-semibold">{first}</p>
                <p className="flex items-start gap-2 text-sm opacity-70">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {second}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      <p className="mt-10 text-sm opacity-60">
        {de
          ? "Hinweis: Diese Beispielangaben sind nicht zur Veröffentlichung bestimmt und stellen keine vollständige Rechtsberatung dar."
          : "Note: These example details are not for publication and are not complete legal advice."}
      </p>
    </section>
  );
}
