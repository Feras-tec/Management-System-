import { useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";

import { employeeSchema } from "../../schemas";

import type { EmployeeFormProps } from "./EmployeeForm.types";

export default function EmployeeForm({
  onSubmit,
  selectedEmployee,
}: EmployeeFormProps) {
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
    if (selectedEmployee) {
      form.setFieldValue("firstName", selectedEmployee.firstName);
      form.setFieldValue("lastName", selectedEmployee.lastName);
      form.setFieldValue("email", selectedEmployee.email);
      form.setFieldValue("position", selectedEmployee.position);
      form.setFieldValue("salary", selectedEmployee.salary);

      firstInputRef.current?.focus();
    }
  }, [selectedEmployee, form]);

  return (
    <form
      className="card bg-base-100 shadow p-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <h2 className="text-2xl font-bold">
        {selectedEmployee ? "Edit Employee" : "Add Employee"}
      </h2>

      <form.Field
        name="firstName"
        children={(field) => (
          <input
            ref={firstInputRef}
            className="input input-bordered w-full"
            placeholder="First name"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="lastName"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Last name"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Email"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="position"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Position"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="salary"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            type="number"
            placeholder="Salary"
            value={field.state.value}
            onChange={(event) => field.handleChange(Number(event.target.value))}
          />
        )}
      />

      <button className="btn btn-primary" type="submit">
        {selectedEmployee ? "Save Changes" : "Add Employee"}
      </button>
    </form>
  );
}
