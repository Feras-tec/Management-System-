import type { StatCardProps } from "./StatCard.types";

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>

          {icon && <span className="text-2xl">{icon}</span>}
        </div>

        <p className="text-4xl font-bold">{value}</p>
      </div>
    </div>
  );
}
