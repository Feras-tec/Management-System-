import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Clock3,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Reveal } from "../../components/motion/Reveal";
import { useAppPreferences } from "../../context";
import { DEMO_ABOUT_CONTENT } from "../../content/aboutContent";
import { usePageMeta } from "../../utils/usePageMeta";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
});

function AboutPage() {
  const { language } = useAppPreferences();
  const de = language === "de";
  const stats = [
    {
      icon: Clock3,
      value: DEMO_ABOUT_CONTENT.founded,
      label: de ? "Seit 2012" : "Founded in 2012",
    },
    {
      icon: Sparkles,
      value: de
        ? DEMO_ABOUT_CONTENT.experienceDe
        : DEMO_ABOUT_CONTENT.experienceEn,
      label: de ? "Erfahrung" : "Experience",
    },
    {
      icon: Wrench,
      value: "6",
      label: de ? "Spezialisierte Leistungen" : "Specialist services",
    },
    {
      icon: CarFront,
      value: de ? "1.000+" : "1,000+",
      label: de ? "Betreute Fahrzeuge" : "Vehicles cared for",
    },
  ];
  const values = de ? DEMO_ABOUT_CONTENT.valuesDe : DEMO_ABOUT_CONTENT.valuesEn;

  usePageMeta(
    de ? "Über uns" : "About AutoCare",
    de
      ? "Unser Ansatz für professionelle Fahrzeugpflege."
      : "Our approach to professional vehicle care.",
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <Reveal>
        <p className="font-semibold text-primary">AutoCare</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">
          {de ? "Über AutoCare" : "About AutoCare"}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 opacity-70">
          {de
            ? "Seit 2012 steht AutoCare für sorgfältige Fahrzeugpflege, spezialisierte Schutzleistungen und eine einfache digitale Terminbuchung."
            : "Since 2012, AutoCare has focused on careful vehicle care, specialist protection services, and a simple digital booking experience."}
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <Reveal
            key={label}
            delay={stats.findIndex((stat) => stat.label === label) * 0.05}
          >
            <article className="flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xl font-black sm:text-2xl">{value}</p>
              <p className="mt-1 text-sm opacity-70">{label}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 rounded-3xl bg-base-200 p-6 sm:mt-14 sm:p-10">
        <h2 className="text-2xl font-black sm:text-3xl">
          {de ? "Unsere Geschichte" : "Our story"}
        </h2>
        <p className="mt-4 max-w-4xl leading-7 opacity-75">
          {de
            ? "Mit mehr als 14 Jahren Erfahrung konzentrieren wir uns auf professionelle Fahrzeugaufbereitung, Innenraumreinigung, Fahrzeugfolierung, Scheibentönung sowie Unterboden- und Rostschutz. Unser Ziel ist eine klare, nachvollziehbare Betreuung – von der Auswahl der passenden Leistung bis zum bestätigten Termin."
            : "With more than 14 years of experience, we focus on professional detailing, interior cleaning, vehicle wrapping, window tinting, underbody protection, and rust protection. Our goal is to provide a clear and transparent customer experience—from choosing the right service to confirming an appointment."}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2 sm:mt-14">
        <Reveal className="flex h-full rounded-3xl border border-base-300 bg-base-100 p-6 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md sm:p-8">
          <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black">
            {de ? "Unsere Werte" : "Our values"}
          </h2>
          <ul className="mt-5 grid gap-3">
            {values.map((value) => (
              <li key={value} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-1 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="flex h-full rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm transition-shadow duration-200 hover:-translate-y-1 hover:shadow-md sm:p-8">
          <CalendarCheck className="size-8 text-primary" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-black">
            {de ? "Einfach planen" : "Plan with ease"}
          </h2>
          <p className="mt-4 leading-7 opacity-75">
            {de
              ? "Leistung auswählen, Fahrzeugtyp angeben und einen passenden Termin online anfragen."
              : "Choose a service, provide your vehicle type, and request a suitable appointment online."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
