import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock3, Wrench } from "lucide-react";

import { Reveal } from "../../components/motion/Reveal";
import { useAppPreferences } from "../../context";
import { usePublicServices } from "../../features/services/api/queries";
import { getServiceImage } from "../../features/services/serviceImage";
import { formatEurMinor } from "../../utils/currency";
import { usePageMeta } from "../../utils/usePageMeta";

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

      {/* Loading state: reserve roughly the same space as the final cards
          to reduce layout shift while services are fetched. */}
      {services.isPending && (
        <div
          className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          role="status"
          aria-label={
            language === "de" ? "Leistungen werden geladen" : "Loading services"
          }
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={index}
              className="card h-full overflow-hidden border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="skeleton h-48 w-full rounded-none" />

              <div className="card-body">
                <div className="skeleton h-6 w-2/3" />

                <div className="skeleton mt-2 h-4 w-full" />

                <div className="skeleton h-4 w-5/6" />

                <div className="skeleton mt-4 h-4 w-1/2" />

                <div className="mt-4 flex justify-end gap-2">
                  <div className="skeleton h-8 w-20" />
                  <div className="skeleton h-8 w-28" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Error state */}
      {services.isError && (
        <div className="alert alert-error mt-10" role="alert">
          {language === "de"
            ? "Die Leistungen konnten nicht geladen werden."
            : "Services could not be loaded."}
        </div>
      )}

      {/* Empty state */}
      {services.data && services.data.length === 0 && (
        <p className="mt-10 text-base-content/70">
          {language === "de"
            ? "Derzeit sind keine Leistungen verfügbar."
            : "No services are currently available."}
        </p>
      )}

      {/* Services */}
      {services.data && services.data.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.data.map((service, index) => {
            const name = language === "de" ? service.nameDe : service.nameEn;

            const summary =
              language === "de"
                ? service.shortDescriptionDe
                : service.shortDescriptionEn;

            const image = getServiceImage(service.slug, service.imageUrl);

            return (
              <Reveal key={service.id}>
                <article className="group card h-full overflow-hidden border border-base-300 bg-base-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {image ? (
                    <figure className="h-48 overflow-hidden">
                      <img
                        src={image}
                        alt={name}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        width={640}
                        height={192}
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
                        : `${
                            language === "de" ? "Ab" : "From"
                          } ${formatEurMinor(service.priceFrom, language)}`}
                    </p>

                    <div className="card-actions justify-end">
                      <Link
                        className="btn btn-primary btn-sm"
                        to="/services/$slug"
                        params={{
                          slug: service.slug,
                        }}
                      >
                        {language === "de" ? "Details" : "Details"}
                      </Link>

                      <Link
                        className="btn btn-secondary btn-sm"
                        to="/booking"
                        search={{
                          service: service.slug,
                        }}
                      >
                        {language === "de"
                          ? "Termin buchen"
                          : "Book appointment"}
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
