import type { ReportCardProps } from "./ReportCard.types";

export default function ReportCard({
  title,
  value,
  description,
}: ReportCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">{title}</h2>

        <p className="text-4xl font-bold">{value}</p>

        {description && <p className="text-sm opacity-70">{description}</p>}
      </div>
    </div>
  );
}
