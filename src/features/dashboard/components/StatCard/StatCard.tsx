import type { StatCardProps } from "./StatCard.types";

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="card-body p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-content/60">
              {title}
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight sm:mt-2 sm:text-4xl">
              {value}
            </p>
          </div>

          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
              <span aria-hidden="true">{icon}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
