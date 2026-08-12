import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { z } from "zod";
import { useAppPreferences } from "../../context";
import {
  bookingApi,
  bookingStatusLabel,
  type VehicleType,
} from "../../features/bookings/api";
import { usePageMeta } from "../../utils/usePageMeta";

export const bookingCustomerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z
    .string()
    .trim()
    .regex(/^[+()0-9\s/-]{6,30}$/),
});
export type BookingContact = z.infer<typeof bookingCustomerSchema>;
export function isContactStepValid(value: unknown) {
  return bookingCustomerSchema.safeParse(value).success;
}
function contactError(name: keyof BookingContact, value: string, de: boolean) {
  if (!value.trim())
    return name === "firstName"
      ? de
        ? "Vorname ist erforderlich."
        : "First name is required."
      : name === "lastName"
        ? de
          ? "Nachname ist erforderlich."
          : "Last name is required."
        : name === "email"
          ? de
            ? "E-Mail-Adresse ist erforderlich."
            : "Email address is required."
          : de
            ? "Telefonnummer ist erforderlich."
            : "Phone number is required.";
  if (name === "email" && !z.string().email().safeParse(value.trim()).success)
    return de
      ? "Bitte geben Sie eine gültige E-Mail-Adresse ein."
      : "Please enter a valid email address.";
  if (name === "phone" && !/^[+()0-9\s/-]{6,30}$/.test(value.trim()))
    return de
      ? "Bitte geben Sie eine gültige Telefonnummer ein."
      : "Please enter a valid phone number.";
  return undefined;
}
export const Route = createFileRoute("/_public/booking")({
  validateSearch: z.object({ service: z.string().optional() }),
  component: BookingRoutePage,
});
function BookingRoutePage() {
  const { service } = Route.useSearch();
  return <BookingPage initialService={service} />;
}
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
const vehicles: VehicleType[] = [
  "SEDAN",
  "SUV",
  "HATCHBACK",
  "VAN",
  "COUPE",
  "WAGON",
  "OTHER",
];

export function BookingPage({
  initialService = "",
}: {
  initialService?: string;
}) {
  const { language } = useAppPreferences();
  const de = language === "de";
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [service, setService] = useState(initialService);
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState("");
  const [confirmation, setConfirmation] = useState<{
    bookingNumber: string;
    status: string;
    startsAt: string;
    service: { nameDe: string; nameEn: string };
  } | null>(null);
  usePageMeta(
    de ? "Termin buchen" : "Book an appointment",
    de
      ? "Wählen Sie Leistung, Fahrzeug und Wunschtermin."
      : "Choose a service, vehicle and preferred appointment time.",
  );
  const services = useQuery({
    queryKey: ["public-services-booking"],
    queryFn: bookingApi.services,
  });
  const availability = useQuery({
    queryKey: ["availability", service, date],
    queryFn: () => bookingApi.availability(service, date),
    enabled: Boolean(service && date && step >= 2),
    retry: false,
  });
  const create = useMutation({
    mutationFn: bookingApi.create,
    onSuccess: (data) => {
      setConfirmation(data as typeof confirmation);
      sessionStorage.setItem("lastBookingNumber", data.bookingNumber);
    },
  });
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      carType: "SEDAN" as VehicleType,
      notes: "",
    },
    onSubmit: async ({ value }) => {
      if (!service || !date || !time || !isContactStepValid(value)) return;
      try {
        await create.mutateAsync({
          ...value,
          serviceSlug: service,
          date,
          time,
        });
      } catch {
        /* Mutation state renders the localized error without clearing form data. */
      }
    },
  });
  const formValues = useStore(form.store, (state) => state.values);
  const nextAllowed =
    step === 0
      ? Boolean(service)
      : step === 1
        ? Boolean(date)
        : step === 2
          ? Boolean(time)
          : step === 3
            ? isContactStepValid(formValues)
            : true;
  const labels = {
    title: de ? "Termin buchen" : "Book an appointment",
    next: de ? "Weiter" : "Next",
    back: de ? "Zurück" : "Back",
    submit: de ? "Termin verbindlich anfragen" : "Request appointment",
    steps: de
      ? ["Leistung & Fahrzeug", "Datum", "Uhrzeit", "Kontaktdaten", "Prüfen"]
      : ["Service & vehicle", "Date", "Time", "Contact details", "Review"],
  };
  if (confirmation)
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-success/10 shadow-xl"
        >
          <div className="card-body">
            <h1 className="card-title text-3xl">
              {de
                ? "Ihre Buchung wurde gespeichert."
                : "Your booking was saved."}
            </h1>
            <p>
              {de ? "Buchungsnummer" : "Booking number"}:{" "}
              <strong className="font-mono">
                {confirmation.bookingNumber}
              </strong>
            </p>
            <p>
              {de ? "Status" : "Status"}:{" "}
              {bookingStatusLabel(
                confirmation.status as import("../../features/bookings/api").BookingStatus,
                language,
              )}
            </p>
            <p>
              {de ? confirmation.service.nameDe : confirmation.service.nameEn}
            </p>
            <p>
              {new Intl.DateTimeFormat(language, {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "Europe/Berlin",
              }).format(new Date(confirmation.startsAt))}
            </p>
            <a href="/my-booking" className="btn btn-primary mt-3">
              {de ? "Meine Buchung öffnen" : "Open my booking"}
            </a>
          </div>
        </motion.div>
      </section>
    );
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold">{labels.title}</h1>
      <ol
        className="steps steps-horizontal mt-8 w-full overflow-x-auto"
        aria-label={de ? "Buchungsschritte" : "Booking steps"}
      >
        {labels.steps.map((label, index) => (
          <li
            key={label}
            className={"step " + (index <= step ? "step-primary" : "")}
            aria-current={index === step ? "step" : undefined}
          >
            {label}
          </li>
        ))}
      </ol>
      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 3 && !isContactStepValid(formValues)) return;
          if (step < 4) setStep(step + 1);
          else void form.handleSubmit();
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduced ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: -20 }}
            className="rounded-2xl bg-base-200 p-6"
          >
            {step === 0 && (
              <div className="grid gap-5 md:grid-cols-2">
                <label>
                  <span className="mb-2 block">
                    {de ? "Leistung" : "Service"}
                  </span>
                  <select
                    className="select select-bordered w-full"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    <option value="">—</option>
                    {services.data?.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {de ? s.nameDe : s.nameEn}
                      </option>
                    ))}
                  </select>
                </label>
                <form.Field name="carType">
                  {(field) => (
                    <label>
                      <span className="mb-2 block">
                        {de ? "Fahrzeugtyp" : "Vehicle type"}
                      </span>
                      <select
                        className="select select-bordered w-full"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value as VehicleType)
                        }
                      >
                        {vehicles.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </form.Field>
              </div>
            )}
            {step === 1 && (
              <label>
                <span className="mb-2 block">{de ? "Datum" : "Date"}</span>
                <input
                  className="input input-bordered w-full"
                  type="date"
                  min={tomorrow()}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                />
              </label>
            )}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold">
                  {de ? "Verfügbare Uhrzeiten" : "Available times"}
                </h2>
                {availability.isFetching && (
                  <span className="loading loading-spinner mt-4" />
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {availability.data?.slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.time}
                      className={
                        "btn " +
                        (time === slot.time ? "btn-primary" : "btn-outline")
                      }
                      onClick={() => setTime(slot.time)}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
                {availability.data?.slots.length === 0 && (
                  <p className="mt-4">
                    {de ? "Keine freien Termine." : "No available slots."}
                  </p>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="grid gap-4 md:grid-cols-2">
                {(["firstName", "lastName", "email", "phone"] as const).map(
                  (name) => (
                    <form.Field
                      key={name}
                      name={name}
                      validators={{
                        onChange: ({ value }) => contactError(name, value, de),
                        onBlur: ({ value }) => contactError(name, value, de),
                      }}
                    >
                      {(field) => (
                        <label>
                          <span className="mb-2 block">
                            {name === "firstName"
                              ? de
                                ? "Vorname"
                                : "First name"
                              : name === "lastName"
                                ? de
                                  ? "Nachname"
                                  : "Last name"
                                : name === "phone"
                                  ? de
                                    ? "Telefon"
                                    : "Phone"
                                  : "Email"}
                          </span>
                          <input
                            className="input input-bordered w-full"
                            type={name === "email" ? "email" : "text"}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          {field.state.meta.errors[0] && (
                            <span className="text-error text-sm">
                              {String(field.state.meta.errors[0])}
                            </span>
                          )}
                        </label>
                      )}
                    </form.Field>
                  ),
                )}
                <form.Field name="notes">
                  {(field) => (
                    <label className="md:col-span-2">
                      <span className="mb-2 block">
                        {de ? "Notizen (optional)" : "Notes (optional)"}
                      </span>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        maxLength={1000}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </label>
                  )}
                </form.Field>
              </div>
            )}
            {step === 4 && (
              <form.Subscribe selector={(state) => state.values}>
                {(value) => (
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">
                      {de ? "Buchung prüfen" : "Review booking"}
                    </h2>
                    <p>
                      <strong>{de ? "Leistung" : "Service"}:</strong>{" "}
                      {de
                        ? services.data?.find((s) => s.slug === service)?.nameDe
                        : services.data?.find((s) => s.slug === service)
                            ?.nameEn}
                    </p>
                    <p>
                      <strong>{de ? "Fahrzeug" : "Vehicle"}:</strong>{" "}
                      {value.carType}
                    </p>
                    <p>
                      <strong>{de ? "Termin" : "Appointment"}:</strong> {date} ·{" "}
                      {time}
                    </p>
                    <p>
                      <strong>{de ? "Kunde" : "Customer"}:</strong>{" "}
                      {value.firstName} {value.lastName} · {value.email} ·{" "}
                      {value.phone}
                    </p>
                    {value.notes && (
                      <p>
                        <strong>{de ? "Notizen" : "Notes"}:</strong>{" "}
                        {value.notes}
                      </p>
                    )}
                  </div>
                )}
              </form.Subscribe>
            )}
          </motion.div>
        </AnimatePresence>
        {create.isError && (
          <div className="alert alert-error mt-5">
            {create.error.message === "BOOKING_SLOT_UNAVAILABLE"
              ? de
                ? "Dieser Termin ist nicht mehr verfügbar."
                : "This slot is no longer available."
              : de
                ? "Die Buchung konnte nicht gespeichert werden."
                : "The booking could not be saved."}
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
          >
            {labels.back}
          </button>
          <button
            className="btn btn-primary"
            disabled={!nextAllowed || create.isPending}
          >
            {create.isPending ? (
              <span className="loading loading-spinner" />
            ) : step === 4 ? (
              labels.submit
            ) : (
              labels.next
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
