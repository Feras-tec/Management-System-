import { useEffect, useRef } from "react";

import { useForm } from "@tanstack/react-form";

import { customerSchema } from "../../schemas";

import type { CustomerFormProps } from "./CustomerForm.types";

export default function CustomerForm({
  onSubmit,
  selectedCustomer,
}: CustomerFormProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
    },

    onSubmit: ({ value }) => {
      const result = customerSchema.safeParse(value);

      if (!result.success) {
        return;
      }

      onSubmit(result.data);

      form.reset();
    },
  });

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    form.setFieldValue("firstName", selectedCustomer.firstName);
    form.setFieldValue("lastName", selectedCustomer.lastName);
    form.setFieldValue("email", selectedCustomer.email);
    form.setFieldValue("phone", selectedCustomer.phone);
    form.setFieldValue("company", selectedCustomer.company);

    firstInputRef.current?.focus();
  }, [selectedCustomer, form]);

  return (
    <form
      className="card bg-base-100 shadow p-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <h2 className="text-2xl font-bold">Add Customer</h2>

      <form.Field
        name="firstName"
        children={(field) => (
          <input
            ref={firstInputRef}
            className="input input-bordered w-full"
            placeholder="First Name"
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
            placeholder="Last Name"
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
            type="email"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="phone"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Phone"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="company"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Company"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <button type="submit" className="btn btn-primary">
        Save Customer
      </button>
    </form>
  );
}
