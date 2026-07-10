import CustomerCard from "../CustomerCard";
import { motion } from "framer-motion";
import type { CustomerListProps } from "./CustomerList.types";

export default function CustomerList({
  customers,
  onDelete,
  onEdit,
}: CustomerListProps) {
  if (customers.length === 0) {
    return <div className="alert">No customers found.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {customers.map((customer, index) => (
        <motion.div
          key={customer.id}
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
          <CustomerCard
            customer={customer}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </motion.div>
      ))}
    </div>
  );
}
