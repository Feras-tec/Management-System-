import type { SalesReportProps } from "./SalesReport.types";

export default function SalesReport({
  totalSales,
  revenue,
  averageSale,
}: SalesReportProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Sales Report</h2>

        <div className="space-y-3">
          <p>
            Total Sales: <strong>{totalSales}</strong>
          </p>

          <p>
            Revenue: <strong>${revenue}</strong>
          </p>

          <p>
            Average Sale: <strong>${averageSale.toFixed(2)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
