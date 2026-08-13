import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Reveal } from "../../components/motion/Reveal";
import { useAppPreferences } from "../../context";
import { usePublicServices } from "../../features/services/api/queries";
import {
  getServiceImage,
  getServicePreviewImage,
  getServicePreviewImageSrcSet,
} from "../../features/services/serviceImage";
import { formatEurMinor } from "../../utils/currency";
import { usePageMeta } from "../../utils/usePageMeta";
export const Route = createFileRoute("/_public/")({
  component: PublicHomePage,
});
function PublicHomePage() {
  const { language } = useAppPreferences();
  const de = language === "de";
  const q = usePublicServices();
  const reduced = useReducedMotion();
  usePageMeta(
    de ? "Fahrzeugpflege & Services" : "Vehicle care & services",
    de
      ? "Professionelle Fahrzeugpflege und einfache Online-Terminbuchung."
      : "Professional vehicle care with simple online appointment booking.",
  );
  const benefits = [
    [ShieldCheck, de ? "Sorgfältige Ausführung" : "Careful workmanship"],
    [Sparkles, de ? "Moderne Materialien" : "Modern materials"],
    [CheckCircle2, de ? "Klarer Buchungsablauf" : "Clear booking flow"],
    [Wrench, de ? "Spezialisierte Services" : "Specialist services"],
  ] as const;
  const steps = de
    ? [
        "Leistung wählen",
        "Fahrzeug wählen",
        "Datum und Uhrzeit",
        "Kontaktdaten",
        "Bestätigen",
      ]
    : [
        "Choose a service",
        "Choose your vehicle",
        "Pick date and time",
        "Enter details",
        "Confirm",
      ];
  return (
    <>
      <section className="relative overflow-hidden border-b border-base-300 bg-base-200/50">
        <div className="relative mx-auto grid min-h-[36rem] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="flex items-center gap-2 font-semibold text-primary">
              <Sparkles size={18} />
              {de
                ? "Pflege, Schutz und Präzision"
                : "Care, protection and precision"}
            </p>
            <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              {de
                ? "Professionelle Pflege für jedes Detail Ihres Fahrzeugs."
                : "Professional care for every detail of your vehicle."}
            </h1>
            <p className="mt-6 text-lg leading-8 opacity-70">
              {de
                ? "Spezialisierte Fahrzeugservices mit einem transparenten digitalen Buchungsablauf."
                : "Specialist automotive services with a clear digital booking experience."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="btn btn-primary btn-lg">
                <CalendarCheck />
                {de ? "Termin buchen" : "Book appointment"}
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg">
                {de ? "Leistungen" : "Services"}
                <ChevronRight />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
              {[
                de ? "Professionelle Qualität" : "Professional Quality",
                de ? "Einfache Online-Buchung" : "Easy Online Booking",
                de ? "Transparenter Ablauf" : "Transparent Process",
              ].map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-base-300 bg-base-100/70 px-3 py-2 font-semibold shadow-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="relative">
            <motion.div
              className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-2xl transition-shadow duration-300 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)]"
              whileHover={reduced ? undefined : { y: -3 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <motion.img
                src="/images/services/autocare-hero-640.webp"
                srcSet="/images/services/autocare-hero-640.webp 640w, /images/services/autocare-hero-960.webp 960w, /images/services/autocare-hero-1280.webp 1280w, /images/services/autocare-hero-1920.webp 1920w"
                sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc(100vw - 3rem), 592px"
                width={1280}
                height={800}
                fetchPriority="high"
                alt={
                  de
                    ? "Premium Fahrzeugpflege in einer modernen Werkstatt"
                    : "Premium vehicle care in a modern workshop"
                }
                className="h-full w-full object-cover"
                whileHover={reduced ? undefined : { scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              <div className="absolute bottom-5 left-5 rounded-2xl bg-neutral/90 p-4 text-neutral-content shadow-xl backdrop-blur">
                <p className="text-sm opacity-70">
                  {de ? "Online buchbar" : "Book online"}
                </p>
                <strong>
                  {de ? "In fünf klaren Schritten" : "In five clear steps"}
                </strong>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-semibold text-primary">
                {de ? "Unsere Leistungen" : "Our services"}
              </p>
              <h2 className="mt-2 text-4xl font-black">
                {de
                  ? "Spezialisierte Fahrzeugpflege"
                  : "Specialist vehicle care"}
              </h2>
            </div>
            <Link to="/services" className="btn btn-ghost">
              {de ? "Alle ansehen" : "View all"}
              <ChevronRight />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {q.isPending
            ? [0, 1, 2].map((x) => (
                <div key={x} className="skeleton h-80 rounded-2xl" />
              ))
            : q.data?.slice(0, 3).map((s, i) => (
                <Reveal key={s.id} delay={i * 0.05}>
                  <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    {getServiceImage(s.slug, s.imageUrl) ? (
                      <figure>
                        <img
                          src={getServicePreviewImage(s.slug, s.imageUrl) ?? undefined}
                          srcSet={getServicePreviewImageSrcSet(
                            s.slug,
                            s.imageUrl,
                          )}
                          sizes="(max-width: 767px) calc(100vw - 2rem), (max-width: 1023px) calc((100vw - 6rem) / 3), 395px"
                          alt={de ? s.nameDe : s.nameEn}
                          className="h-44 w-full object-cover"
                          width={840}
                          height={561}
                          loading="lazy"
                          decoding="async"
                          onError={(event) => {
                            event.currentTarget.src =
                              "/brand/autocare-logo.svg";
                          }}
                        />
                      </figure>
                    ) : (
                      <div className="grid h-44 place-items-center bg-base-200">
                        <Wrench className="size-14 text-primary" />
                      </div>
                    )}
                    <div className="card-body">
                      <h3 className="card-title">{de ? s.nameDe : s.nameEn}</h3>
                      <p className="opacity-70">
                        {de ? s.shortDescriptionDe : s.shortDescriptionEn}
                      </p>
                      <p className="mt-auto text-sm font-semibold">
                        <Clock3 className="mr-1 inline size-4" />
                        {s.durationMinutes} min ·{" "}
                        {s.priceFrom
                          ? `${de ? "ab" : "from"} ${formatEurMinor(s.priceFrom, language)}`
                          : de
                            ? "Preis auf Anfrage"
                            : "Price on request"}
                      </p>
                      <Link
                        to="/services/$slug"
                        params={{ slug: s.slug }}
                        className="btn btn-primary btn-sm mt-2"
                      >
                        {de ? "Details" : "Details"}
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
        </div>
      </section>
      <section className="bg-neutral py-20 text-neutral-content">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-black">
              {de ? "Warum AutoCare?" : "Why AutoCare?"}
            </h2>
            <p className="mt-4 max-w-xl text-neutral-content/70">
              {de
                ? "Sorgfältige Arbeit, klare Abläufe und moderne Pflege für Ihr Fahrzeug."
                : "Careful workmanship, clear steps, and modern care for your vehicle."}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {benefits.map(([Icon, label]) => (
                <div key={label} className="flex gap-3">
                  <Icon className="text-primary" />
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <h2 className="text-3xl font-black">
              {de ? "So funktioniert die Buchung" : "How booking works"}
            </h2>
            <ol className="mt-6 space-y-3">
              {steps.map((x, i) => (
                <li
                  key={x}
                  className="flex items-center gap-4 rounded-xl bg-neutral-content/5 p-3"
                >
                  <span className="grid size-8 place-items-center rounded-full bg-primary font-bold text-primary-content">
                    {i + 1}
                  </span>
                  {x}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Reveal>
          <h2 className="text-4xl font-black">
            {de
              ? "Bereit für Ihren nächsten Termin?"
              : "Ready for your next appointment?"}
          </h2>
          <p className="mt-4 opacity-70">
            {de
              ? "Wählen Sie die passende Leistung und einen verfügbaren Termin."
              : "Choose the right service and an available time."}
          </p>
          <Link to="/booking" className="btn btn-primary btn-lg mt-8">
            <CalendarCheck />
            {de ? "Jetzt buchen" : "Book now"}
          </Link>
        </Reveal>
      </section>
    </>
  );
}
