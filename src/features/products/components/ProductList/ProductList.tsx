import ProductCard from "../ProductCard";
import { motion } from "framer-motion";
import type { ProductListProps } from "./ProductList.types";

export default function ProductList({
  products,
  onDelete,
  onEdit,
}: ProductListProps) {
  if (products.length === 0) {
    return <div className="alert">No products found.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: index * 0.05,
          }}
        >
          <ProductCard product={product} onDelete={onDelete} onEdit={onEdit} />
        </motion.div>
      ))}
    </div>
  );
}
