import type { RecentActivityProps } from "./RecentActivity.types";

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Recent Activity</h2>

        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border-b pb-2">
              <p className="font-semibold">{item.title}</p>

              <small>{new Date(item.date).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
