import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useForm } from "@tanstack/react-form";
import {
  Mail,
  BriefcaseBusiness,
  DollarSign,
  User,
  Save,
  X,
} from "lucide-react";

import { employeeSchema } from "../../schemas";
import { useTranslation } from "../../../../i18n";

import type { EmployeeFormProps } from "./EmployeeForm.types";

export default function EmployeeForm({
  onSubmit,
  onCancel,
  selectedEmployee,
}: EmployeeFormProps) {
  const { t } = useTranslation();

  const firstInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      position: "",
      salary: 0,
    },

    onSubmit: ({ value }) => {
      const result = employeeSchema.safeParse(value);

      if (!result.success) {
        return;
      }

      onSubmit(result.data);
      form.reset();
    },
  });

  useEffect(() => {
    if (!selectedEmployee) {
      return;
    }

    form.setFieldValue("firstName", selectedEmployee.firstName);
    form.setFieldValue("lastName", selectedEmployee.lastName);
    form.setFieldValue("email", selectedEmployee.email);
    form.setFieldValue("position", selectedEmployee.position);
    form.setFieldValue("salary", selectedEmployee.salary);

    requestAnimationFrame(() => {
      firstInputRef.current?.focus();
    });
  }, [selectedEmployee, form]);

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form
        className="card border border-base-300 bg-base-100 shadow-sm transition-shadow duration-300 hover:shadow-md"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <div className="card-body">
          <div className="mb-2">
            <h2 className="card-title text-xl">
              {selectedEmployee
                ? t.employees.editEmployee
                : t.employees.addEmployee}
            </h2>

            <p className="text-sm text-base-content/60">
              {selectedEmployee
                ? t.employees.editEmployee
                : t.employees.addEmployee}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* First Name */}
            <form.Field
              name="firstName"
              children={(field) => (
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">{t.employees.firstName}</span>
                  </div>

                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
                    />

                    <input
                      ref={firstInputRef}
                      className="input input-bordered w-full pl-10"
                      placeholder={t.employees.firstName}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>

                  {field.state.meta.errors.length > 0 && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {String(field.state.meta.errors[0])}
                      </span>
                    </div>
                  )}
                </label>
              )}
            />

            {/* Last Name */}
            <form.Field
              name="lastName"
              children={(field) => (
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">{t.employees.lastName}</span>
                  </div>

                  <input
                    className="input input-bordered w-full"
                    placeholder={t.employees.lastName}
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />

                  {field.state.meta.errors.length > 0 && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {String(field.state.meta.errors[0])}
                      </span>
                    </div>
                  )}
                </label>
              )}
            />

            {/* Email */}
            <form.Field
              name="email"
              children={(field) => (
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">{t.employees.email}</span>
                  </div>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
                    />

                    <input
                      className="input input-bordered w-full pl-10"
                      type="email"
                      placeholder={t.employees.email}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>

                  {field.state.meta.errors.length > 0 && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {String(field.state.meta.errors[0])}
                      </span>
                    </div>
                  )}
                </label>
              )}
            />

            {/* Position */}
            <form.Field
              name="position"
              children={(field) => (
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text">{t.employees.position}</span>
                  </div>

                  <div className="relative">
                    <BriefcaseBusiness
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
                    />

                    <input
                      className="input input-bordered w-full pl-10"
                      placeholder={t.employees.position}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  </div>

                  {field.state.meta.errors.length > 0 && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {String(field.state.meta.errors[0])}
                      </span>
                    </div>
                  )}
                </label>
              )}
            />

            {/* Salary */}
            <form.Field
              name="salary"
              children={(field) => (
                <label className="form-control w-full md:col-span-2">
                  <div className="label">
                    <span className="label-text">{t.employees.salary}</span>
                  </div>

                  <div className="relative">
                    <DollarSign
                      size={18}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
                    />

                    <input
                      className="input input-bordered w-full pl-10"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder={t.employees.salary}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(Number(event.target.value))
                      }
                    />
                  </div>

                  {field.state.meta.errors.length > 0 && (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {String(field.state.meta.errors[0])}
                      </span>
                    </div>
                  )}
                </label>
              )}
            />
          </div>

          {/* Actions */}
          <div className="card-actions mt-4 flex-col-reverse justify-end gap-2 sm:flex-row">
            {selectedEmployee && (
              <button
                type="button"
                className="btn btn-ghost w-full sm:w-auto"
                onClick={handleCancel}
              >
                <X size={18} />
                {t.common.cancel}
              </button>
            )}

            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              <Save size={18} />

              {selectedEmployee ? t.common.save : t.common.create}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
