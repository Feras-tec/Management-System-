import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";

import { useTranslation } from "../../../../i18n";

import EmployeeCard from "../EmployeeCard";

import type { EmployeeListProps } from "./EmployeeList.types";

export default function EmployeeList({
  employees,
  onDelete,
  onEdit,
}: EmployeeListProps) {
  const { t } = useTranslation();

  if (employees.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center shadow-sm"
      >
        <div className="mb-4 rounded-full bg-base-200 p-4">
          <UsersRound size={32} className="text-base-content/50" />
        </div>

        <h3 className="text-lg font-semibold">{t.employees.noEmployees}</h3>

        <p className="mt-1 max-w-md text-sm text-base-content/50">
          {t.employees.searchPlaceholder}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div layout className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee, index) => (
        <motion.div
          key={employee.id}
          layout
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
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
    </motion.div>
  );
}
