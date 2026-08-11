import { useQuery } from "@tanstack/react-query";

import { FadeIn, ScaleIn } from "../../components/animations";
import { useTranslation } from "../../i18n";

import { employeesQuery } from "../employees/queries";
import { productsQuery } from "../products/queries";
import { customersQuery } from "../customers/queries";
import { salesQuery } from "../sales/queries";

import { StatCard, SalesSummary, RecentActivity } from "./components";

export default function Dashboard() {
  const { t } = useTranslation();

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
      title: `${t.dashboard.sale} ${sale.id} ${t.dashboard.completed}`,
      date: sale.date,
    }));

  return (
    <section className="space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t.dashboard.title}
          </h1>

          <p className="text-base-content/60">{t.dashboard.subtitle}</p>
        </div>
      </FadeIn>

      {/* Statistics */}
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScaleIn>
            <StatCard
              title={t.dashboard.employees}
              value={employees.length}
              icon="👨‍💼"
            />
          </ScaleIn>

          <ScaleIn>
            <StatCard
              title={t.dashboard.products}
              value={products.length}
              icon="📦"
            />
          </ScaleIn>

          <ScaleIn>
            <StatCard
              title={t.dashboard.customers}
              value={customers.length}
              icon="👥"
            />
          </ScaleIn>

          <ScaleIn>
            <StatCard
              title={t.dashboard.sales}
              value={sales.length}
              icon="💰"
            />
          </ScaleIn>
        </div>
      </FadeIn>

      {/* Sales Summary */}
      <FadeIn>
        <SalesSummary totalSales={sales.length} totalRevenue={totalRevenue} />
      </FadeIn>

      {/* Recent Activity */}
      <FadeIn>
        <RecentActivity items={recentActivities} />
      </FadeIn>
    </section>
  );
}
