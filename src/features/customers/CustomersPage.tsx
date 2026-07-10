import { useCallback, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  customersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "./queries";

import { CustomerForm, CustomerList } from "./components";

import type { Customer } from "./types";

import type { CustomerFormData } from "./schemas";

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();

  const { confirm } = useConfirmDialog();

  const { data: customers = [], isLoading, isError } = useQuery(customersQuery);

  const createMutation = useCreateCustomerMutation();

  const updateMutation = useUpdateCustomerMutation();

  const deleteMutation = useDeleteCustomerMutation();

  const handleSubmit = useCallback(
    (customer: CustomerFormData) => {
      if (selectedCustomer) {
        updateMutation.mutate({
          id: selectedCustomer.id,
          ...customer,
        });

        setSelectedCustomer(undefined);

        return;
      }

      createMutation.mutate(customer);
    },
    [selectedCustomer, createMutation, updateMutation],
  );

  const handleEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        title: "Delete Customer",
        message: "Do you really want to delete this customer?",
        confirmText: "Delete",
        cancelText: "Cancel",
      });

      if (!confirmDelete) {
        return;
      }

      deleteMutation.mutate(id);
    },
    [confirm, deleteMutation],
  );

  if (isLoading) {
    return <div className="loading loading-spinner" />;
  }

  if (isError) {
    return <div className="alert alert-error">Failed to load customers.</div>;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl bold">Customers</h1>

      <CustomerForm
        onSubmit={handleSubmit}
        selectedCustomer={selectedCustomer}
      />

      <CustomerList
        customers={customers}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </section>
  );
}
