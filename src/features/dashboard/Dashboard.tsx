import { useQuery } from "@tanstack/react-query";

import { FadeIn, ScaleIn } from "../../components/animations";
import { StatCard, SalesSummary, RecentActivity } from "./components";

import { employeesQuery } from "../employees/queries";
import { productsQuery } from "../products/queries";
import { customersQuery } from "../customers/queries";
import { salesQuery } from "../sales/queries";

export default function Dashboard() {
  const { data: employees = [] } = useQuery(employeesQuery);

  const { data: products = [] } = useQuery(productsQuery);

  const { data: customers = [] } = useQuery(customersQuery);

  const { data: sales = [] } = useQuery(salesQuery);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

  const recentActivities = sales
    .slice(-5)
    .reverse()
    .map((sale) => ({
      id: sale.id,
      title: `Sale ${sale.id} completed`,
      date: sale.date,
    }));

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <FadeIn>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ScaleIn>
            <StatCard title="Employees" value={employees.length} icon="👨‍💼" />
          </ScaleIn>

          <ScaleIn>
            <StatCard title="Products" value={products.length} icon="📦" />
          </ScaleIn>

          <ScaleIn>
            <StatCard title="Customers" value={customers.length} icon="👥" />
          </ScaleIn>

          <ScaleIn>
            <StatCard title="Sales" value={sales.length} icon="💰" />
          </ScaleIn>
        </div>
      </FadeIn>

      <SalesSummary totalSales={sales.length} totalRevenue={totalRevenue} />

      <RecentActivity items={recentActivities} />
    </section>
  );
}
