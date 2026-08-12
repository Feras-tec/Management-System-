import { Link, createFileRoute } from "@tanstack/react-router";

import { useAppPreferences } from "../../context";
import { formatEurMinor } from "../../utils/currency";
import { usePublicService } from "../../features/services/api/queries";
import { getServiceDetailContent } from "../../features/services/serviceContent";
import { getServiceImage } from "../../features/services/serviceImage";
import { usePageMeta } from "../../utils/usePageMeta";
import { CalendarCheck, CheckCircle2, Clock3, Wrench } from "lucide-react";

export const Route = createFileRoute("/_public/services/$slug")({
  component: ServiceDetailsPage,
});

function ServiceDetailsPage() {
  const { slug } = Route.useParams();
  const { language } = useAppPreferences();
  const service = usePublicService(slug);
  usePageMeta(
    service.data
      ? language === "de"
        ? service.data.nameDe
        : service.data.nameEn
      : language === "de"
        ? "Leistung"
        : "Service",
    language === "de"
      ? "Details und Online-Terminbuchung."
      : "Service details and online booking.",
  );

  if (service.isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (service.isError) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="alert alert-error" role="alert">
          {language === "de"
            ? "Die Leistung konnte nicht geladen werden."
            : "The service could not be loaded."}
        </div>
      </section>
    );
  }

  const name = language === "de" ? service.data.nameDe : service.data.nameEn;
  const detail = getServiceDetailContent(slug);
  const description = detail
    ? language === "de"
      ? detail.descriptionDe
      : detail.descriptionEn
    : language === "de"
      ? service.data.descriptionDe
      : service.data.descriptionEn;
  const bullets = detail
    ? language === "de"
      ? detail.bulletsDe
      : detail.bulletsEn
    : [];

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Link className="link link-primary" to="/services">
        {language === "de" ? "Zurück zu Leistungen" : "Back to services"}
      </Link>
      {getServiceImage(service.data.slug, service.data.imageUrl) ? (
        <img
          src={
            getServiceImage(service.data.slug, service.data.imageUrl) ??
            undefined
          }
          alt={name}
          className="mt-6 h-80 w-full rounded-3xl object-cover shadow-xl"
          onError={(event) => {
            event.currentTarget.src = "/brand/autocare-logo.svg";
          }}
        />
      ) : (
        <div
          className="mt-6 flex h-80 items-center justify-center rounded-3xl bg-base-200"
          aria-label={
            language === "de"
              ? "Leistungsbild folgt"
              : "Service image placeholder"
          }
        >
          <Wrench className="size-20 text-primary" />
        </div>
      )}
      <h1 className="mt-6 text-4xl font-bold">{name}</h1>
      <p className="mt-6 text-lg leading-8">{description}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-base-content/70">
        <span className="badge badge-lg">
          <Clock3 className="mr-1 size-4" />
          {service.data.durationMinutes} min
        </span>
        <span className="badge badge-lg">
          {service.data.priceFrom === 0
            ? language === "de"
              ? "Preis auf Anfrage"
              : "Price on request"
            : `${language === "de" ? "Ab" : "From"} ${formatEurMinor(service.data.priceFrom, language)}`}
        </span>
      </div>
      <div className="mt-8 rounded-2xl bg-base-200 p-5 sm:p-6">
        <h2 className="text-xl font-bold">
          {language === "de" ? "Was Sie erwarten können" : "What to expect"}
        </h2>
        <p className="mt-3 flex gap-2 opacity-70">
          <CheckCircle2 className="shrink-0 text-primary" />
          {language === "de"
            ? "Eine klar beschriebene Leistung und einen transparent gebuchten Termin."
            : "A clearly described service and a transparently booked appointment."}
        </p>
      </div>
      {bullets.length > 0 && (
        <section className="mt-8 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">
            {language === "de" ? "Was wir machen" : "What we do"}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {bullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6"
              >
                <CheckCircle2
                  className="mt-1 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {detail?.legalNoteDe && (
        <div className="alert alert-info mt-6 text-sm">
          <span>
            {language === "de" ? detail.legalNoteDe : detail.legalNoteEn}
          </span>
        </div>
      )}
      <Link
        to="/booking"
        search={{ service: slug }}
        className="btn btn-primary btn-lg mt-10"
      >
        <CalendarCheck />
        {language === "de" ? "Termin buchen" : "Book appointment"}
      </Link>
    </section>
  );
}
