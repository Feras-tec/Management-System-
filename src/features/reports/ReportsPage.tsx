import { useQuery } from "@tanstack/react-query";

import { ReportCard, SalesReport } from "./components";

import { salesQuery } from "../sales/queries";
import { productsQuery } from "../products/queries";
import { customersQuery } from "../customers/queries";

export default function ReportsPage() {
  const { data: sales = [] } = useQuery(salesQuery);

  const { data: products = [] } = useQuery(productsQuery);

  const { data: customers = [] } = useQuery(customersQuery);

  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);

  const averageSale = sales.length > 0 ? revenue / sales.length : 0;

  const bestProduct = products
    .map((product) => {
      const sold = sales
        .filter((sale) => sale.productId === product.id)
        .reduce((sum, sale) => sum + sale.quantity, 0);

      return {
        name: product.name,
        sold,
      };
    })
    .sort((a, b) => b.sold - a.sold)[0];

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Reports</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard
          title="Customers"
          value={customers.length}
          description="Registered customers"
        />

        <ReportCard
          title="Products"
          value={products.length}
          description="Available products"
        />

        <ReportCard
          title="Revenue"
          value={`$${revenue}`}
          description="Total revenue"
        />
      </div>

      <SalesReport
        totalSales={sales.length}
        revenue={revenue}
        averageSale={averageSale}
      />

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Best Product</h2>

          <p>
            {bestProduct
              ? `${bestProduct.name} (${bestProduct.sold} sold)`
              : "No sales yet"}
          </p>
        </div>
      </div>
    </section>
  );
}
