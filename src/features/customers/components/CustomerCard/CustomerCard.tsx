import type { CustomerCardProps } from "./CustomerCard.types";

export default function CustomerCard({
  customer,
  onDelete,
  onEdit,
}: CustomerCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">
          {customer.firstName} {customer.lastName}
        </h2>

        <p>Email: {customer.email}</p>

        <p>Phone: {customer.phone}</p>

        <p>Company: {customer.company}</p>

        <div className="card-actions justify-end">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEdit(customer)}
          >
            Edit
          </button>

          <button
            className="btn btn-error btn-sm"
            onClick={() => onDelete(customer.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
