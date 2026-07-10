import EmployeeCard from "../EmployeeCard";
import { motion } from "framer-motion";
import type { EmployeeListProps } from "./EmployeeList.types";

export default function EmployeeList({
  employees,
  onDelete,
  onEdit,
}: EmployeeListProps) {
  if (employees.length === 0) {
    return <div className="alert">No employees found.</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee, index) => (
        <motion.div
          key={employee.id}
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
          <EmployeeCard
            employee={employee}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </motion.div>
      ))}
    </div>
  );
}
