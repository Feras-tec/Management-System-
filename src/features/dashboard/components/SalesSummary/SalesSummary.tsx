import { useTranslation } from "../../../../i18n";
import { useAppPreferences } from "../../../../context";
import { formatEurMinor } from "../../../../utils/currency";

import type { SalesSummaryProps } from "./SalesSummary.types";

export default function SalesSummary({
  totalSales,
  totalRevenue,
}: SalesSummaryProps) {
  const { t } = useTranslation();
  const { language } = useAppPreferences();

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="card-title text-xl">{t.dashboard.salesSummary}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="stat rounded-2xl bg-base-200">
            <div className="stat-title">{t.dashboard.totalSales}</div>

            <div className="stat-value text-primary">{totalSales}</div>
          </div>

          <div className="stat rounded-2xl bg-base-200">
            <div className="stat-title">{t.dashboard.totalRevenue}</div>

            <div className="stat-value text-secondary">
              {formatEurMinor(Math.round(totalRevenue * 100), language)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
