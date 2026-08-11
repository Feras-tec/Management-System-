import { useCallback, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  salesQuery,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useUpdateSaleMutation,
} from "./queries";

import { customersQuery } from "../customers/queries";

import { productsQuery } from "../products/queries";

import { SaleForm, SaleList } from "./components";

import {
  SearchInput,
  SelectFilter,
  SortSelect,
} from "../../components/filters";

import type { Sale } from "./types";

import type { SaleFormData } from "./schemas";

export default function SalesPage() {
  const [selectedSale, setSelectedSale] = useState<Sale | undefined>();

  const [search, setSearch] = useState("");

  const [customerFilter, setCustomerFilter] = useState("all");

  const [productFilter, setProductFilter] = useState("all");

  const [sortBy, setSortBy] = useState("none");

  const { confirm } = useConfirmDialog();

  const { data: sales = [], isLoading, isError } = useQuery(salesQuery);

  const { data: customers = [] } = useQuery(customersQuery);

  const { data: products = [] } = useQuery(productsQuery);

  const createMutation = useCreateSaleMutation();

  const updateMutation = useUpdateSaleMutation();

  const deleteMutation = useDeleteSaleMutation();

  const filteredSales = useMemo(() => {
    return [...sales]

      .filter((sale) => {
        const customer = customers.find((item) => item.id === sale.customerId);

        const product = products.find((item) => item.id === sale.productId);

        const text = `
            ${customer?.firstName}
            ${customer?.lastName}
            ${product?.name}
            `.toLowerCase();

        return text.includes(search.toLowerCase());
      })

      .filter((sale) =>
        customerFilter === "all" ? true : sale.customerId === customerFilter,
      )

      .filter((sale) =>
        productFilter === "all" ? true : sale.productId === productFilter,
      )

      .sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }

        if (sortBy === "total") {
          return b.total - a.total;
        }

        return 0;
      });
  }, [
    sales,
    customers,
    products,
    search,
    customerFilter,
    productFilter,
    sortBy,
  ]);

  const handleSubmit = useCallback(
    (sale: SaleFormData) => {
      if (selectedSale) {
        updateMutation.mutate({
          id: selectedSale.id,
          ...sale,
        });

        setSelectedSale(undefined);

        return;
      }

      createMutation.mutate(sale);
    },
    [selectedSale, createMutation, updateMutation],
  );

  const handleEdit = useCallback((sale: Sale) => {
    setSelectedSale(sale);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const shouldDelete = await confirm({
        title: "Delete Sale",

        message: "Do you really want to delete this sale?",

        confirmText: "Delete",

        cancelText: "Cancel",
      });

      if (!shouldDelete) {
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
    return <div className="alert alert-error">Failed to load sales.</div>;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Sales</h1>

      <SaleForm onSubmit={handleSubmit} selectedSale={selectedSale} />

      <div className="grid gap-4 md:grid-cols-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search customer or product..."
        />

        <SelectFilter
          value={customerFilter}

          onChange={setCustomerFilter}

          options={["all", ...customers.map((customer) => customer.id)]}

          label="Customer"
        />

        <SelectFilter
          value={productFilter}

          onChange={setProductFilter}

          options={["all", ...products.map((product) => product.id)]}

          label="Product"
        />

        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            {
              label: "Newest",
              value: "date",
            },
            {
              label: "Highest Total",
              value: "total",
            },
          ]}
        />
      </div>

      <SaleList
        sales={filteredSales}

        onDelete={handleDelete}

        onEdit={handleEdit}
      />
    </section>
  );
}
