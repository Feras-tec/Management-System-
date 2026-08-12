import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { FadeIn, ScaleIn } from "../../components/animations";
import { useAppPreferences } from "../../context";
import { formatEurMinor } from "../../utils/currency";
import { getReportOverview } from "../reports/api";
import { StatCard } from "./components";

export function dashboardErrorMessage(error: Error, de: boolean) {
  return error.message === "REPORTS_FORBIDDEN"
    ? de
      ? "Diese Übersicht ist für Manager und Administratoren verfügbar."
      : "This overview is available to managers and administrators."
    : de
      ? "Dashboard konnte nicht geladen werden."
      : "Dashboard could not be loaded.";
}

export default function Dashboard() {
  const { auth } = useRouteContext({ from: "/admin" });
  const { language } = useAppPreferences();
  const de = language === "de";
  const report = useQuery({
    queryKey: ["dashboard-overview", "last30"],
    queryFn: () => getReportOverview(auth.getAccessToken, "range=last30"),
  });
  const data = report.data;
  return (
    <section className="space-y-5 sm:space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-bold sm:text-4xl">Dashboard</h1>
          <p className="opacity-60">
            {de
              ? "Betriebsübersicht der letzten 30 Tage"
              : "Business snapshot for the last 30 days"}
          </p>
        </div>
      </FadeIn>
      {report.isPending && (
        <div className="flex justify-center p-12">
          <span
            className="loading loading-spinner loading-lg"
            aria-label={de ? "Dashboard wird geladen" : "Loading dashboard"}
          />
        </div>
      )}
      {report.isError && (
        <div className="alert alert-error">
          {dashboardErrorMessage(report.error, de)}
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              [
                de ? "Umsatz" : "Revenue",
                formatEurMinor(data.sales.revenueMinor, language),
                "💶",
              ],
              [de ? "Verkäufe" : "Sales", data.sales.completedCount, "🧾"],
              [de ? "Buchungen" : "Bookings", data.bookings.total, "📅"],
              [de ? "Kunden" : "Customers", data.customers.total, "👥"],
              [
                de ? "Niedriger Bestand" : "Low stock",
                data.products.lowStock,
                "📦",
              ],
              [
                de ? "Aktive Mitarbeiter" : "Active employees",
                data.employees.byStatus.ACTIVE,
                "👨‍💼",
              ],
            ].map(([title, value, icon]) => (
              <ScaleIn key={String(title)}>
                <StatCard
                  title={String(title)}
                  value={value as string | number}
                  icon={String(icon)}
                />
              </ScaleIn>
            ))}
          </div>
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
            <div className="card border border-base-300 bg-base-100">
              <div className="card-body">
                <h2 className="card-title">
                  {de ? "Zahlungsstatus" : "Payment status"}
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="stat bg-base-200">
                    <div className="stat-title">
                      {de ? "Eingenommen" : "Collected"}
                    </div>
                    <div className="stat-value text-xl">
                      {formatEurMinor(data.payments.collectedMinor, language)}
                    </div>
                  </div>
                  <div className="stat bg-base-200">
                    <div className="stat-title">
                      {de ? "Offen" : "Outstanding"}
                    </div>
                    <div className="stat-value text-xl">
                      {formatEurMinor(data.sales.outstandingMinor, language)}
                    </div>
                  </div>
                  <div className="stat bg-base-200">
                    <div className="stat-title">
                      {de ? "Anstehende Buchungen" : "Upcoming bookings"}
                    </div>
                    <div className="stat-value text-xl">
                      {data.bookings.upcoming}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card border border-base-300 bg-base-100">
              <div className="card-body">
                <h2 className="card-title">{de ? "Bestand" : "Inventory"}</h2>
                <p>
                  {de ? "Nicht vorrätig" : "Out of stock"}:{" "}
                  <strong>{data.products.outOfStock}</strong>
                </p>
                <p>
                  {de ? "Einheiten auf Lager" : "Units in stock"}:{" "}
                  <strong>{data.products.totalUnitsInStock}</strong>
                </p>
                <a className="link link-primary" href="/admin/reports">
                  {de ? "Alle Berichte öffnen" : "Open all reports"}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
