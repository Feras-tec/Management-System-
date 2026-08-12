import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useAppPreferences } from "../../context";
import { formatEurMinor } from "../../utils/currency";
import {
  getReportOverview,
  type ReportOverview,
  type ReportRange,
} from "./api";

const rangeLabels = {
  de: {
    today: "Heute",
    last7: "Letzte 7 Tage",
    last30: "Letzte 30 Tage",
    thisMonth: "Dieser Monat",
    custom: "Benutzerdefiniert",
  },
  en: {
    today: "Today",
    last7: "Last 7 days",
    last30: "Last 30 days",
    thisMonth: "This month",
    custom: "Custom",
  },
} as const;

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-xl bg-base-200 p-3 sm:p-4">
      <div className="text-sm opacity-65">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card min-w-0 border border-base-300 bg-base-100">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        {children}
      </div>
    </section>
  );
}
export function reportsErrorMessage(error: Error, de: boolean) {
  return error.message === "REPORTS_FORBIDDEN"
    ? de
      ? "Keine Berechtigung für Berichte."
      : "You do not have permission to view reports."
    : de
      ? "Berichte konnten nicht geladen werden."
      : "Reports could not be loaded.";
}

export function RevenueChart({
  data,
  language,
}: {
  data: ReportOverview["trends"];
  language: string;
}) {
  const max = Math.max(1, ...data.map((point) => point.revenueMinor));
  if (!data.length)
    return <p>{language === "de" ? "Keine Trenddaten." : "No trend data."}</p>;
  return (
    <div
      className="flex h-28 items-end gap-1 sm:h-40"
      aria-label={language === "de" ? "Umsatztrend" : "Revenue trend"}
    >
      {data.map((point) => (
        <div
          key={point.date}
          className="group flex min-w-0 flex-1 flex-col items-center justify-end"
          title={`${point.date}: ${formatEurMinor(point.revenueMinor, language)}`}
        >
          <div
            className="max-h-[84px] w-full rounded-t bg-primary sm:max-h-[120px]"
            style={{
              height: `${Math.max(3, (point.revenueMinor / max) * 120)}px`,
            }}
          />
          <span className="mt-1 hidden text-[10px] opacity-60 sm:block">
            {point.date.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { auth } = useRouteContext({ from: "/admin" });
  const { language } = useAppPreferences();
  const de = language === "de";
  const [range, setRange] = useState<ReportRange>("last30");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const params = new URLSearchParams({
    range,
    ...(range === "custom" && dateFrom && dateTo ? { dateFrom, dateTo } : {}),
  });
  const enabled = range !== "custom" || Boolean(dateFrom && dateTo);
  const report = useQuery({
    queryKey: ["reports-overview", params.toString()],
    queryFn: () => getReportOverview(auth.getAccessToken, params.toString()),
    enabled,
  });
  const data = report.data;

  return (
    <section className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{de ? "Berichte" : "Reports"}</h1>
        <p className="opacity-65">
          {de
            ? "PostgreSQL-Analysen in Geschäftszeit."
            : "PostgreSQL analytics in business time."}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
        <label className="form-control">
          <span className="label-text">{de ? "Zeitraum" : "Date range"}</span>
          <select
            aria-label={de ? "Zeitraum" : "Date range"}
            className="select select-bordered"
            value={range}
            onChange={(event) => setRange(event.target.value as ReportRange)}
          >
            {Object.entries(rangeLabels[language]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {range === "custom" && (
          <>
            <label className="form-control">
              <span className="label-text">{de ? "Von" : "From"}</span>
              <input
                aria-label={de ? "Von" : "From"}
                type="date"
                className="input input-bordered"
                value={dateFrom}
                onInput={(event) => setDateFrom(event.currentTarget.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text">{de ? "Bis" : "To"}</span>
              <input
                aria-label={de ? "Bis" : "To"}
                type="date"
                className="input input-bordered"
                value={dateTo}
                onInput={(event) => setDateTo(event.currentTarget.value)}
              />
            </label>
          </>
        )}
        {data && (
          <span className="text-sm opacity-60">
            {data.range.dateFrom} – {data.range.dateTo} · {data.timezone}
          </span>
        )}
      </div>
      {!enabled && (
        <div className="alert">
          {de
            ? "Bitte Start- und Enddatum wählen."
            : "Choose both start and end dates."}
        </div>
      )}
      {report.isPending && enabled && (
        <div className="flex justify-center p-10">
          <span
            className="loading loading-spinner loading-lg"
            aria-label={de ? "Berichte werden geladen" : "Loading reports"}
          />
        </div>
      )}
      {report.isError && (
        <div className="alert alert-error">
          {reportsErrorMessage(report.error, de)}
        </div>
      )}
      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metric
              label={de ? "Umsatz" : "Revenue"}
              value={formatEurMinor(data.sales.revenueMinor, language)}
            />
            <Metric
              label={de ? "Verkäufe" : "Sales"}
              value={data.sales.completedCount}
            />
            <Metric
              label={de ? "Buchungen" : "Bookings"}
              value={data.bookings.total}
            />
            <Metric
              label={de ? "Kunden" : "Customers"}
              value={data.customers.total}
            />
            <Metric
              label={de ? "Niedriger Bestand" : "Low stock"}
              value={data.products.lowStock}
            />
            <Metric
              label={de ? "Aktive Mitarbeiter" : "Active employees"}
              value={data.employees.byStatus.ACTIVE}
            />
          </div>
          <Section title={de ? "Umsatztrend" : "Revenue trend"}>
            <RevenueChart data={data.trends} language={language} />
          </Section>
          <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-2">
            <Section title={de ? "Verkäufe & Zahlungen" : "Sales & payments"}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label={de ? "Abgeschlossen" : "Completed"}
                  value={data.sales.completedCount}
                />
                <Metric
                  label={de ? "Storniert" : "Cancelled"}
                  value={data.sales.cancelledCount}
                />
                <Metric
                  label={de ? "Brutto-Zwischensumme" : "Gross subtotal"}
                  value={formatEurMinor(
                    data.sales.grossSubtotalMinor,
                    language,
                  )}
                />
                <Metric
                  label={de ? "Rabatte" : "Discounts"}
                  value={formatEurMinor(data.sales.discountsMinor, language)}
                />
                <Metric
                  label={de ? "Steuer" : "Tax"}
                  value={formatEurMinor(data.sales.taxMinor, language)}
                />
                <Metric
                  label={de ? "Produktpositionen" : "Product lines"}
                  value={formatEurMinor(
                    data.sales.productRevenueMinor,
                    language,
                  )}
                />
                <Metric
                  label={de ? "Leistungspositionen" : "Service lines"}
                  value={formatEurMinor(
                    data.sales.serviceRevenueMinor,
                    language,
                  )}
                />
                <Metric
                  label={de ? "Eingenommen" : "Collected"}
                  value={formatEurMinor(data.payments.collectedMinor, language)}
                />
                <Metric
                  label={de ? "Offen" : "Outstanding"}
                  value={formatEurMinor(data.sales.outstandingMinor, language)}
                />
                <Metric
                  label={de ? "Ø Verkauf" : "Average sale"}
                  value={formatEurMinor(data.sales.averageSaleMinor, language)}
                />
                {Object.entries(data.payments.byMethod).map(
                  ([method, amount]) => (
                    <Metric
                      key={method}
                      label={method.replaceAll("_", " ")}
                      value={formatEurMinor(amount, language)}
                    />
                  ),
                )}
              </div>
              <p className="text-sm opacity-65">
                {de
                  ? "Umsatz = Summe abgeschlossener Verkäufe; Einnahmen = nur abgeschlossene manuelle Zahlungen. Produkt-/Leistungspositionen sind vor Rabatt und Steuer."
                  : "Revenue = completed sale totals; collected = completed manual payments only. Product/service lines are before sale-level discount and tax."}
              </p>
            </Section>
            <Section title={de ? "Buchungen" : "Bookings"}>
              <div className="grid gap-3 sm:grid-cols-3">
                {Object.entries(data.bookings.byStatus).map(
                  ([status, count]) => (
                    <Metric
                      key={status}
                      label={status.replaceAll("_", " ")}
                      value={count}
                    />
                  ),
                )}
                <Metric
                  label={de ? "Anstehend" : "Upcoming"}
                  value={data.bookings.upcoming}
                />
                <Metric
                  label={de ? "Abschlussquote" : "Completion rate"}
                  value={
                    data.bookings.completionRatePercent == null
                      ? "—"
                      : `${data.bookings.completionRatePercent}%`
                  }
                />
              </div>
            </Section>
            <Section title={de ? "Produkte & Bestand" : "Products & inventory"}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label={de ? "Aktiv" : "Active"}
                  value={data.products.active}
                />
                <Metric
                  label={de ? "Nicht vorrätig" : "Out of stock"}
                  value={data.products.outOfStock}
                />
                <Metric
                  label={de ? "Einheiten" : "Units in stock"}
                  value={data.products.totalUnitsInStock}
                />
                <Metric
                  label={de ? "Bekannter Kostenwert" : "Known-cost value"}
                  value={formatEurMinor(
                    data.products.knownCostValueMinor,
                    language,
                  )}
                />
                <Metric
                  label={de ? "Ohne Kosten" : "Without cost"}
                  value={data.products.productsWithoutCost}
                />
              </div>
            </Section>
            <Section title={de ? "Kunden" : "Customers"}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label={de ? "Neu im Zeitraum" : "New in range"}
                  value={data.customers.newInRange}
                />
                <Metric
                  label={de ? "Mit Buchungen" : "With bookings"}
                  value={data.customers.withBookings}
                />
                <Metric
                  label={de ? "Mit Verkäufen" : "With sales"}
                  value={data.customers.withCompletedSales}
                />
              </div>
              {data.customers.top.length ? (
                <ul className="mt-3 space-y-2">
                  {data.customers.top.map((customer) => (
                    <li
                      key={customer.id}
                      className="flex justify-between rounded bg-base-200 p-2"
                    >
                      <span>{customer.displayName}</span>
                      <strong>
                        {formatEurMinor(customer.totalSpentMinor, language)}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {de
                    ? "Keine Kundenausgaben im Zeitraum."
                    : "No customer spend in this range."}
                </p>
              )}
            </Section>
            <Section title={de ? "Leistungen" : "Services"}>
              {data.services.length ? (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{de ? "Leistung" : "Service"}</th>
                        <th>{de ? "Buchungen" : "Bookings"}</th>
                        <th>{de ? "Menge" : "Quantity"}</th>
                        <th>{de ? "Umsatz" : "Revenue"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.map((service) => (
                        <tr key={service.id}>
                          <td>{de ? service.nameDe : service.nameEn}</td>
                          <td>
                            {service.bookingCount} /{" "}
                            {service.completedBookingCount}
                          </td>
                          <td>{service.salesQuantity}</td>
                          <td>
                            {formatEurMinor(service.revenueMinor, language)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>{de ? "Keine Leistungen." : "No services."}</p>
              )}
            </Section>
            <Section
              title={de ? "Mitarbeiter & Zugriff" : "Employees & access"}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="ACTIVE" value={data.employees.byStatus.ACTIVE} />
                <Metric
                  label="INACTIVE"
                  value={data.employees.byStatus.INACTIVE}
                />
                <Metric
                  label="ON LEAVE"
                  value={data.employees.byStatus.ON_LEAVE}
                />
                <Metric
                  label={de ? "Verknüpft" : "Linked"}
                  value={data.employees.linkedUsers}
                />
                <Metric
                  label={de ? "Nicht verknüpft" : "Unlinked"}
                  value={data.employees.unlinkedEmployees}
                />
                <Metric
                  label={de ? "Aktiver Zugriff" : "Active access"}
                  value={data.employees.activeSystemAccess}
                />
              </div>
            </Section>
          </div>
        </>
      )}
    </section>
  );
}
