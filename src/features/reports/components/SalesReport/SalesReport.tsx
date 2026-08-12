import { useAppPreferences } from "../../../../context";
import { formatEurMinor } from "../../../../utils/currency";
import type { SalesReportProps } from "./SalesReport.types";

export default function SalesReport({
  totalSales,
  revenue,
  averageSale,
}: SalesReportProps) {
  const { language } = useAppPreferences();
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Sales Report</h2>

        <div className="space-y-3">
          <p>
            Total Sales: <strong>{totalSales}</strong>
          </p>

          <p>
            Revenue: <strong>{formatEurMinor(Math.round(revenue * 100), language)}</strong>
          </p>

          <p>
            Average Sale: <strong>{formatEurMinor(Math.round(averageSale * 100), language)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
