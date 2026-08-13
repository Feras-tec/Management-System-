import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { z } from "zod";
import { useAppPreferences } from "../../context";
import {
  percentToBps,
  settingsApi,
  weekdays,
  type BusinessSettings,
  type SettingsInput,
} from "./api";
const clock = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const schema = z
  .object({
    name: z.string().trim().min(1),
    locale: z.enum(["de", "en"]),
    timezone: z.literal("Europe/Berlin"),
    taxRateBps: z.number().int().min(0).max(10000),
    openingHours: z
      .array(
        z.object({
          dayOfWeek: z.enum(weekdays),
          isOpen: z.boolean(),
          openTime: z.string().nullable(),
          closeTime: z.string().nullable(),
        }),
      )
      .length(7),
  })
  .refine(({ openingHours }) =>
    openingHours.every(
      (h) =>
        !h.isOpen ||
        Boolean(
          h.openTime &&
          h.closeTime &&
          clock.test(h.openTime) &&
          clock.test(h.closeTime) &&
          h.openTime < h.closeTime,
        ),
    ),
  );
const labels = {
  de: [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ],
  en: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
} as const;

export function SettingsForm({
  initial,
  token,
  language,
}: {
  initial: BusinessSettings;
  token: () => Promise<string | null>;
  language: "de" | "en";
}) {
  const de = language === "de";
  const client = useQueryClient();
  const [notice, setNotice] = useState("");
  const [tax, setTax] = useState((initial.taxRateBps / 100).toFixed(2));
  const { currency, canEdit, ...initialValues } = initial;
  void currency;
  const save = useMutation({
    mutationFn: (input: SettingsInput) => settingsApi.update(token, input),
    onSuccess: async () => {
      setNotice(de ? "Einstellungen gespeichert." : "Settings saved.");
      await client.invalidateQueries({ queryKey: ["business-settings"] });
    },
    onError: () =>
      setNotice(
        de
          ? "Einstellungen konnten nicht gespeichert werden."
          : "Settings could not be saved.",
      ),
  });
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      const taxRateBps = percentToBps(tax);
      const parsed = schema.safeParse({ ...value, taxRateBps });
      if (!parsed.success) {
        setNotice(
          de
            ? "Bitte Name, Steuersatz und Öffnungszeiten prüfen."
            : "Check the name, tax rate, and opening hours.",
        );
        return;
      }
      await save.mutateAsync(parsed.data);
    },
  });
  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="wrap-break-word text-3xl font-bold sm:text-4xl">
          {de ? "Geschäftseinstellungen" : "Business settings"}
        </h1>
        <p className="opacity-65">
          {de
            ? "Stammdaten, Steuer und buchbare Öffnungszeiten."
            : "Business details, tax, and bookable opening hours."}
        </p>
      </div>
      {!canEdit && (
        <div className="alert">
          {de
            ? "Nur Administratoren können Änderungen speichern."
            : "Only administrators can save changes."}
        </div>
      )}
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body grid gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-2">
            <h2 className="card-title md:col-span-2">
              {de ? "Allgemein" : "General"}
            </h2>
            <form.Field name="name">
              {(f) => (
                <label className="form-control">
                  <span className="label-text">
                    {de ? "Geschäftsname" : "Business name"}
                  </span>
                  <input
                    aria-label={de ? "Geschäftsname" : "Business name"}
                    className="input input-bordered w-full min-w-0"
                    disabled={!canEdit}
                    value={f.state.value}
                    onChange={(e) => f.handleChange(e.target.value)}
                  />
                </label>
              )}
            </form.Field>
            <form.Field name="locale">
              {(f) => (
                <label className="form-control">
                  <span className="label-text">
                    {de ? "Geschäftssprache" : "Business locale"}
                  </span>
                  <select
                    aria-label={de ? "Geschäftssprache" : "Business locale"}
                    className="select select-bordered w-full min-w-0"
                    disabled={!canEdit}
                    value={f.state.value}
                    onChange={(e) =>
                      f.handleChange(e.target.value as "de" | "en")
                    }
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                  </select>
                </label>
              )}
            </form.Field>
            <label className="form-control">
              <span className="label-text">{de ? "Währung" : "Currency"}</span>
              <input
                aria-label={de ? "Währung" : "Currency"}
                className="input input-bordered w-full min-w-0"
                readOnly
                value="EUR"
              />
            </label>
            <label className="form-control">
              <span className="label-text">{de ? "Zeitzone" : "Timezone"}</span>
              <input
                aria-label={de ? "Zeitzone" : "Timezone"}
                className="input input-bordered w-full min-w-0"
                readOnly
                value="Europe/Berlin"
              />
            </label>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">{de ? "Steuer" : "Tax"}</h2>
            <label className="form-control max-w-xs">
              <span className="label-text">
                {de ? "Steuersatz (%)" : "Tax rate (%)"}
              </span>
              <input
                aria-label={de ? "Steuersatz" : "Tax rate"}
                className="input input-bordered w-full min-w-0"
                inputMode="decimal"
                disabled={!canEdit}
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </label>
            <p className="text-sm opacity-65">
              {de
                ? "Entwürfe verwenden beim Abschluss den aktuellen Satz. Abgeschlossene Verkäufe bleiben unverändert."
                : "Drafts use the current rate at completion. Completed sales stay unchanged."}
            </p>
          </div>
        </div>
        <div className="card border border-base-300 bg-base-100">
          <div className="card-body">
            <h2 className="card-title">
              {de ? "Öffnungszeiten" : "Opening hours"}
            </h2>
            <form.Subscribe selector={(state) => state.values.openingHours}>
              {(hours) => (
                <div className="space-y-3">
                  {hours.map((hour, index) => {
                    const replace = (update: Partial<typeof hour>) =>
                      form.setFieldValue(
                        "openingHours",
                        hours.map((item, i) =>
                          i === index ? { ...item, ...update } : item,
                        ),
                      );
                    return (
                      <div
                        key={hour.dayOfWeek}
                        className="grid items-center gap-2 rounded-xl bg-base-200 p-3 sm:grid-cols-[9rem_7rem_1fr_1fr]"
                      >
                        <strong>{labels[language][index]}</strong>
                        <label className="flex items-center gap-2">
                          <input
                            aria-label={`${labels[language][index]} ${de ? "geöffnet" : "open"}`}
                            type="checkbox"
                            className="toggle toggle-sm"
                            disabled={!canEdit}
                            checked={hour.isOpen}
                            onChange={(e) =>
                              replace({
                                isOpen: e.target.checked,
                                openTime: e.target.checked
                                  ? (hour.openTime ?? "08:00")
                                  : null,
                                closeTime: e.target.checked
                                  ? (hour.closeTime ?? "18:00")
                                  : null,
                              })
                            }
                          />
                          {hour.isOpen
                            ? de
                              ? "Offen"
                              : "Open"
                            : de
                              ? "Geschlossen"
                              : "Closed"}
                        </label>
                        <input
                          aria-label={`${labels[language][index]} ${de ? "von" : "from"}`}
                          type="time"
                          className="input input-bordered w-full min-w-0"
                          disabled={!canEdit || !hour.isOpen}
                          value={hour.openTime ?? ""}
                          onChange={(e) =>
                            replace({ openTime: e.target.value })
                          }
                        />
                        <input
                          aria-label={`${labels[language][index]} ${de ? "bis" : "to"}`}
                          type="time"
                          className="input input-bordered w-full min-w-0"
                          disabled={!canEdit || !hour.isOpen}
                          value={hour.closeTime ?? ""}
                          onChange={(e) =>
                            replace({ closeTime: e.target.value })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </form.Subscribe>
          </div>
        </div>
        {notice && (
          <div
            className={`alert ${save.isError ? "alert-error" : "alert-success"}`}
          >
            {notice}
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canEdit || save.isPending}
          onClick={() => {
            setNotice(
              de ? "Einstellungen werden gespeichert…" : "Saving settings…",
            );
            void form.handleSubmit();
          }}
        >
          {save.isPending
            ? de
              ? "Speichern…"
              : "Saving…"
            : de
              ? "Einstellungen speichern"
              : "Save settings"}
        </button>
      </form>
    </section>
  );
}

export default function SettingsPage() {
  const { auth } = useRouteContext({ from: "/admin" });
  const { language } = useAppPreferences();
  const query = useQuery({
    queryKey: ["business-settings"],
    queryFn: () => settingsApi.get(auth.getAccessToken),
  });
  if (query.isPending)
    return (
      <span role="status" className="loading loading-spinner loading-lg" />
    );
  if (query.isError)
    return (
      <div className="alert alert-error">
        {language === "de"
          ? "Einstellungen konnten nicht geladen werden."
          : "Settings could not be loaded."}
      </div>
    );
  return (
    <SettingsForm
      key={`${query.data.name}-${query.data.taxRateBps}-${query.data.locale}`}
      initial={query.data}
      token={auth.getAccessToken}
      language={language}
    />
  );
}
