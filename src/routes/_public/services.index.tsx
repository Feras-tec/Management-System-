import { Link, createFileRoute } from "@tanstack/react-router";

import { useAppPreferences } from "../../context";
import { formatEurMinor } from "../../utils/currency";
import { usePublicServices } from "../../features/services/api/queries";
import { getServiceImage } from "../../features/services/serviceImage";
import { usePageMeta } from "../../utils/usePageMeta";
import { Reveal } from "../../components/motion/Reveal";
import { Clock3, Wrench } from "lucide-react";

export const Route = createFileRoute("/_public/services/")({
  component: ServicesPage,
});

function ServicesPage() {
  const { language } = useAppPreferences();
  const services = usePublicServices();
  usePageMeta(
    language === "de" ? "Leistungen" : "Services",
    language === "de"
      ? "Alle verfügbaren Fahrzeugservices im Überblick."
      : "Explore all available vehicle services.",
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-semibold text-primary">AutoCare</p>
      <h1 className="mt-2 text-5xl font-black">
        {language === "de" ? "Leistungen" : "Services"}
      </h1>

      {services.isPending && (
        <div className="mt-10 flex justify-center" role="status">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {services.isError && (
        <div className="alert alert-error mt-10" role="alert">
          {language === "de"
            ? "Die Leistungen konnten nicht geladen werden."
            : "Services could not be loaded."}
        </div>
      )}

      {services.data && services.data.length === 0 && (
        <p className="mt-10 text-base-content/70">
          {language === "de"
            ? "Derzeit sind keine Leistungen verfügbar."
            : "No services are currently available."}
        </p>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.data?.map((service) => {
          const name = language === "de" ? service.nameDe : service.nameEn;
          const summary =
            language === "de"
              ? service.shortDescriptionDe
              : service.shortDescriptionEn;

          return (
            <Reveal key={service.id}>
              <article className="group card h-full overflow-hidden border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                {getServiceImage(service.slug, service.imageUrl) ? (
                  <figure>
                    <img
                      src={
                        getServiceImage(service.slug, service.imageUrl) ??
                        undefined
                      }
                      alt={name}
                      className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.src = "/brand/autocare-logo.svg";
                      }}
                    />
                  </figure>
                ) : (
                  <div
                    className="flex h-48 items-center justify-center bg-base-200"
                    aria-label={
                      language === "de"
                        ? "Leistungsbild folgt"
                        : "Service image placeholder"
                    }
                  >
                    <Wrench className="size-14 text-primary" />
                  </div>
                )}
                <div className="card-body">
                  <h2 className="card-title">{name}</h2>
                  <p>{summary}</p>
                  <p className="mt-auto text-sm text-base-content/70">
                    <Clock3 className="mr-1 inline size-4" />
                    {service.durationMinutes} min ·{" "}
                    {service.priceFrom === 0
                      ? language === "de"
                        ? "Preis auf Anfrage"
                        : "Price on request"
                      : `${language === "de" ? "Ab" : "From"} ${formatEurMinor(service.priceFrom, language)}`}
                  </p>
                  <div className="card-actions justify-end">
                    <Link
                      className="btn btn-primary btn-sm"
                      to="/services/$slug"
                      params={{ slug: service.slug }}
                    >
                      {language === "de" ? "Details" : "Details"}
                    </Link>
                    <Link
                      className="btn btn-secondary btn-sm"
                      to="/booking"
                      search={{ service: service.slug }}
                    >
                      {language === "de" ? "Termin buchen" : "Book appointment"}
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
