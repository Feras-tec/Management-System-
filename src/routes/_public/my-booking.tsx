import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarSearch, CarFront, Clock3, Search } from "lucide-react";
import { bookingApi, bookingStatusLabel } from "../../features/bookings/api";
import { useAppPreferences } from "../../context";
import { usePageMeta } from "../../utils/usePageMeta";
export const Route = createFileRoute("/_public/my-booking")({
  component: MyBookingPage,
});
function MyBookingPage() {
  const { language } = useAppPreferences();
  const de = language === "de";
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const lookup = useMutation({ mutationFn: bookingApi.lookup });
  usePageMeta(
    de ? "Meine Buchung" : "My booking",
    de
      ? "Termin mit Buchungsnummer und E-Mail-Adresse aufrufen."
      : "Find an appointment using its booking number and email address.",
  );
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <CalendarSearch
        className="mb-4 size-11 text-primary"
        aria-hidden="true"
      />
      <h1 className="text-4xl font-bold">
        {de ? "Meine Buchung" : "My booking"}
      </h1>
      <p className="mt-3 text-base-content/70">
        {de
          ? "Geben Sie die Angaben aus Ihrer Buchungsbestätigung ein."
          : "Enter the details from your booking confirmation."}
      </p>
      <form
        className="card mt-8 space-y-4 border border-base-300 bg-base-100 p-6 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          lookup.mutate({ bookingNumber: number, email });
        }}
      >
        <label htmlFor="booking-number" className="font-medium">
          {de ? "Buchungsnummer" : "Booking number"}
        </label>
        <input
          id="booking-number"
          className="input input-bordered w-full"
          autoComplete="off"
          required
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <label htmlFor="booking-email" className="font-medium">
          {de ? "E-Mail-Adresse" : "Email address"}
        </label>
        <input
          id="booking-email"
          className="input input-bordered w-full"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={!number.trim() || !email.trim() || lookup.isPending}
        >
          {lookup.isPending ? (
            <span
              className="loading loading-spinner"
              aria-label={de ? "Wird geladen" : "Loading"}
            />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          {de ? "Buchung anzeigen" : "Find booking"}
        </button>
      </form>
      {lookup.isError && (
        <div className="alert alert-error mt-6" role="alert">
          {de
            ? "Buchung nicht gefunden. Bitte prüfen Sie Ihre Angaben."
            : "Booking not found. Please check your details."}
        </div>
      )}
      {lookup.data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-8 border border-primary/20 bg-primary/5 shadow-xl"
        >
          <div className="card-body">
            <h2 className="card-title">{lookup.data.bookingNumber}</h2>
            <span className="badge badge-primary">
              {bookingStatusLabel(lookup.data.status, language)}
            </span>
            <p>
              <CarFront
                className="mr-2 inline size-5 text-primary"
                aria-hidden="true"
              />
              {de ? lookup.data.service.nameDe : lookup.data.service.nameEn}
              {(lookup.data.vehicle?.type ?? lookup.data.vehicleType) && (
                <span className="block pl-7 text-sm text-base-content/70">
                  {lookup.data.vehicle?.type ?? lookup.data.vehicleType}
                </span>
              )}
            </p>
            <p>
              <Clock3
                className="mr-2 inline size-5 text-primary"
                aria-hidden="true"
              />
              {new Intl.DateTimeFormat(language, {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: lookup.data.timezone ?? "Europe/Berlin",
              }).format(new Date(lookup.data.startsAt))}
              <span className="block pl-7 text-sm text-base-content/70">
                {lookup.data.timezone ?? "Europe/Berlin"}
              </span>
            </p>
          </div>
        </motion.div>
      )}
    </section>
  );
}
