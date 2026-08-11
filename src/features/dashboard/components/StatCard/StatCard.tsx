import type { StatCardProps } from "./StatCard.types";

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="card-body p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-content/60">
              {title}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {value}
            </p>
          </div>

          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              <span aria-hidden="true">{icon}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
