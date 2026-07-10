import type { SaleCardProps } from "./SaleCard.types";

export default function SaleCard({ sale, onDelete, onEdit }: SaleCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">Sale #{sale.id}</h2>

        <p>Customer: {sale.customerId}</p>

        <p>Product: {sale.productId}</p>

        <p>Quantity: {sale.quantity}</p>

        <p>Total: {sale.total}</p>

        <p>Date: {new Date(sale.date).toLocaleDateString()}</p>

        <div className="card-actions justify-end">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEdit(sale)}
          >
            Edit
          </button>

          <button
            className="btn btn-error btn-sm"
            onClick={() => onDelete(sale.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
