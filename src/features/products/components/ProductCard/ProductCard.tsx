import type { ProductCardProps } from "./ProductCard.types";

export default function ProductCard({
  product,
  onDelete,
  onEdit,
}: ProductCardProps) {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h2 className="card-title">{product.name}</h2>

        <p>{product.description}</p>

        <p>Category: {product.category}</p>

        <p>Price: €{product.price}</p>

        <p>Stock: {product.stock}</p>

        <div className="card-actions justify-end">
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onEdit(product)}
          >
            Edit
          </button>

          <button
            className="btn btn-error btn-sm"
            onClick={() => onDelete(product.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
