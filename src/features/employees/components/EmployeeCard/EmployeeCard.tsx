import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  DollarSign,
  Mail,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";

import { useTranslation } from "../../../../i18n";

import type { EmployeeCardProps } from "./EmployeeCard.types";

export default function EmployeeCard({
  employee,
  onDelete,
  onEdit,
}: EmployeeCardProps) {
  const { t } = useTranslation();

  const initials =
    `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card h-full border border-base-300 bg-base-100 shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="avatar placeholder">
              <div className="w-12 rounded-full bg-primary text-primary-content">
                <span className="text-lg font-semibold">{initials}</span>
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">
                {employee.firstName} {employee.lastName}
              </h2>

              <span className="badge badge-primary badge-outline mt-1">
                {employee.position}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <UserRound size={20} />
          </div>
        </div>

        <div className="divider my-1" />

        {/* Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-base-200 p-2">
              <Mail size={17} className="text-base-content/60" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-base-content/50">
                {t.employees.email}
              </p>

              <p className="truncate text-sm font-medium">{employee.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-base-200 p-2">
              <BriefcaseBusiness size={17} className="text-base-content/60" />
            </div>

            <div>
              <p className="text-xs text-base-content/50">
                {t.employees.position}
              </p>

              <p className="text-sm font-medium">{employee.position}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-base-200 p-2">
              <DollarSign size={17} className="text-base-content/60" />
            </div>

            <div>
              <p className="text-xs text-base-content/50">
                {t.employees.salary}
              </p>

              <p className="text-sm font-semibold">
                €{employee.salary.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card-actions mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn btn-outline btn-warning btn-sm"
            onClick={() => onEdit(employee)}
          >
            <Pencil size={16} />
            {t.common.edit}
          </button>

          <button
            type="button"
            className="btn btn-outline btn-error btn-sm"
            onClick={() => onDelete(employee.id)}
          >
            <Trash2 size={16} />
            {t.common.delete}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
