import type { SalesSummaryProps } from "./SalesSummary.types";

export default function SalesSummary({
  totalSales,
  totalRevenue,
}: SalesSummaryProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Sales Summary</h2>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Sales</div>

            <div className="stat-value">{totalSales}</div>
          </div>

          <div className="stat">
            <div className="stat-title">Revenue</div>

            <div className="stat-value">${totalRevenue}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
