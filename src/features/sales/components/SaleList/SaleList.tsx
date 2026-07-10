import SaleCard from "../SaleCard";
import { motion } from "framer-motion";
import type { SaleListProps } from "./SaleList.types";

export default function SaleList({ sales, onDelete, onEdit }: SaleListProps) {
  if (sales.length === 0) {
    return <div className="alert">No sales found.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sales.map((sale, index) => (
        <motion.div
          key={sale.id}
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
          <SaleCard sale={sale} onDelete={onDelete} onEdit={onEdit} />
        </motion.div>
      ))}
    </div>
  );
}
