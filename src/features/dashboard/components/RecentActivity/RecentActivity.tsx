import { useTranslation } from "../../../../i18n";

import type { RecentActivityProps } from "./RecentActivity.types";

export default function RecentActivity({ items }: RecentActivityProps) {
  const { t } = useTranslation();

  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="card-title text-xl">{t.dashboard.recentActivity}</h2>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-base-200 p-6 text-center">
            <p className="text-base-content/60">
              {t.dashboard.noRecentActivity}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-base-200"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    💰
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.title}</p>

                    <p className="mt-1 text-sm text-base-content/60">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
