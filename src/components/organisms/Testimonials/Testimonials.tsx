import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Star } from "lucide-react";

import { Reveal } from "../../motion/Reveal";
import { reviewApi } from "../../../features/reviews/api";
import { ReviewForm } from "../../../features/reviews/ReviewForm";

type Language = "de" | "en";

interface DemoReview {
  quote: string;
  customer: string;
  avatar: string;
}

const demos: Record<Language, DemoReview[]> = {
  de: [
    {
      customer: "Max M.",
      avatar: "/images/avatars/max-demo.webp",
      quote:
        "Die Buchungsstrecke ist klar aufgebaut und zeigt nachvollziehbar, wie ein Termin vorbereitet werden kann.",
    },
    {
      customer: "Anna S.",
      avatar: "/images/avatars/anna-demo.webp",
      quote:
        "Die Leistungsübersicht vermittelt den Ablauf kompakt und verständlich.",
    },
    {
      customer: "Daniel K.",
      avatar: "/images/avatars/daniel-demo.webp",
      quote:
        "Von der Leistungsauswahl bis zur Bestätigung wirkt der Prozess transparent und gut strukturiert.",
    },
  ],
  en: [
    {
      customer: "Max M.",
      avatar: "/images/avatars/max-demo.webp",
      quote:
        "The booking flow is clearly structured and shows exactly how an appointment can be prepared.",
    },
    {
      customer: "Anna S.",
      avatar: "/images/avatars/anna-demo.webp",
      quote:
        "The service overview communicates the process concisely and clearly.",
    },
    {
      customer: "Daniel K.",
      avatar: "/images/avatars/daniel-demo.webp",
      quote:
        "From service selection through confirmation, the process feels transparent and well organised.",
    },
  ],
};

function Stars({
  rating,
  language,
  className = "",
}: {
  rating: number;
  language: Language;
  className?: string;
}) {
  const de = language === "de";

  return (
    <div
      role="img"
      className={"flex gap-0.5 text-[var(--brand-accent)] " + className}
      aria-label={
        de
          ? `Bewertung: ${rating} von 5 Sternen`
          : `Rating: ${rating} out of 5 stars`
      }
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={
            "size-[1.05rem] " + (index < rating ? "fill-current" : "opacity-30")
          }
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function Testimonials({ language }: { language: Language }) {
  const de = language === "de";
  const approved = useQuery({
    queryKey: ["public", "reviews"],
    queryFn: reviewApi.list,
  });

  return (
    <section
      className="border-y border-base-300 bg-base-200/50 py-16 sm:py-20 lg:py-24"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-text)]">
              {de ? "Kundenstimmen" : "Customer voices"}
            </p>
            <h2
              id="testimonials-heading"
              className="mt-3 break-words text-2xl font-black sm:text-4xl"
            >
              {de
                ? "So könnte sich AutoCare anfühlen"
                : "What the AutoCare experience could feel like"}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 opacity-70 sm:text-base sm:leading-7">
              {de
                ? "Ein Einblick in die Rückmeldungen, die unsere Leistungen und der digitale Buchungsablauf ermöglichen."
                : "A glimpse of the feedback our services and digital booking experience are designed to create."}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <p
            id="demo-reviews-note"
            role="note"
            className="mt-5 max-w-2xl text-sm leading-6 text-base-content"
          >
            <strong>{de ? "Fiktive Beispiele:" : "Fictional examples:"}</strong>{" "}
            {de
              ? "Keine echten Kundenbewertungen. Sie zählen nicht zum Bewertungsdurchschnitt."
              : "Not genuine customer reviews. They do not count toward rating averages."}
          </p>
        </Reveal>

        <div
          className="mt-5 grid gap-5 md:grid-cols-3 lg:gap-6"
          role="group"
          aria-label={de ? "Fiktive Beispielbewertungen" : "Fictional example reviews"}
          aria-describedby="demo-reviews-note"
        >
          {demos[language].map((review, index) => (
            <Reveal
              key={review.customer}
              delay={0.08 + index * 0.05}
              className="h-full"
            >
              <article className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:shadow-md">
                <div className="card-body flex h-full flex-col p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      srcSet={[56, 112, 168].map((size) => `${review.avatar.replace(/\.webp$/, `-${size}.webp`)} ${size}w`).concat(`${review.avatar} 256w`).join(", ")}
                      sizes="56px"
                      width="56"
                      height="56"
                      className="size-14 shrink-0 rounded-full object-cover ring-2 ring-base-200"
                      alt={
                        de
                          ? `Demo-Porträt von ${review.customer}`
                          : `Demo portrait of ${review.customer}`
                      }
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{review.customer}</p>
                    </div>
                  </div>

                  <Stars rating={5} language={language} className="mt-5" />

                  <blockquote className="mt-4 flex-1 break-words text-[0.95rem] leading-7 text-base-content/85">
                    {de ? `„${review.quote}“` : `“${review.quote}”`}
                  </blockquote>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {approved.data && approved.data.length > 0 && (
          <section
            className="mt-14 border-t border-base-300 pt-10 sm:mt-16 sm:pt-12"
            aria-labelledby="approved-reviews-heading"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-success-text)]">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  {de ? "Geprüfte Rückmeldungen" : "Verified feedback"}
                </p>
                <h3
                  id="approved-reviews-heading"
                  className="mt-2 text-xl font-bold sm:text-2xl"
                >
                  {de
                    ? "Freigegebene Kundenbewertungen"
                    : "Approved customer reviews"}
                </h3>
              </div>
              <p className="text-xs opacity-60">
                {de
                  ? "Nach Prüfung veröffentlicht"
                  : "Published after moderation"}
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {approved.data.map((review) => (
                <article
                  key={review.id}
                  className="card min-w-0 border border-base-300 bg-base-100 shadow-sm"
                >
                  <div className="card-body p-5 sm:p-6">
                    <Stars rating={review.rating} language={language} />
                    <blockquote className="mt-3 break-words text-[0.95rem] leading-7">
                      {de
                        ? `„${review.message}“`
                        : `“${review.message}”`}
                    </blockquote>
                    <p className="mt-auto border-t border-base-300 pt-3 text-sm font-semibold">
                      {review.customerName}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <ReviewForm language={language} />
      </div>
    </section>
  );
}
