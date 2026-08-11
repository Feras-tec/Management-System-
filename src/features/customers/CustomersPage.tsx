import { useCallback, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  customersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "./queries";

import { CustomerForm, CustomerList } from "./components";

import {
  SearchInput,
  SelectFilter,
  SortSelect,
} from "../../components/filters";

import type { Customer } from "./types";

import type { CustomerFormData } from "./schemas";

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >();

  const [search, setSearch] = useState("");

  const [company, setCompany] = useState("all");

  const [sort, setSort] = useState("none");

  const { confirm } = useConfirmDialog();

  const { data: customers = [], isLoading, isError } = useQuery(customersQuery);

  const createMutation = useCreateCustomerMutation();

  const updateMutation = useUpdateCustomerMutation();

  const deleteMutation = useDeleteCustomerMutation();

  const companies = useMemo(
    () => ["all", ...new Set(customers.map((customer) => customer.company))],
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) =>
        `${customer.firstName} ${customer.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .filter((customer) =>
        company === "all" ? true : customer.company === company,
      )
      .sort((a, b) => {
        if (sort === "asc") {
          return `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          );
        }

        if (sort === "desc") {
          return `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`,
          );
        }

        return 0;
      });
  }, [customers, search, company, sort]);

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
      <h1 className="text-4xl font-bold">Customers</h1>

      <CustomerForm
        onSubmit={handleSubmit}
        selectedCustomer={selectedCustomer}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customer..."
        />

        <SelectFilter
          value={company}
          options={companies}
          onChange={setCompany}
          label="Company"
        />

        <SortSelect
          value={sort}
          onChange={setSort}
          options={[
            {
              label: "Name A-Z",
              value: "asc",
            },
            {
              label: "Name Z-A",
              value: "desc",
            },
          ]}
        />
      </div>

      <CustomerList
        customers={filteredCustomers}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </section>
  );
}
