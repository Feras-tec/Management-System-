import { useCallback, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  salesQuery,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useUpdateSaleMutation,
} from "./queries";

import { SaleForm, SaleList } from "./components";

import type { Sale } from "./types";

import type { SaleFormData } from "./schemas";

export default function SalesPage() {
  const [selectedSale, setSelectedSale] = useState<Sale | undefined>();

  const { confirm } = useConfirmDialog();

  const { data: sales = [], isLoading, isError } = useQuery(salesQuery);

  const createMutation = useCreateSaleMutation();

  const updateMutation = useUpdateSaleMutation();

  const deleteMutation = useDeleteSaleMutation();

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
      const confirmDelete = await confirm({
        title: "Delete Sale",
        message: "Do you really want to delete this sale?",
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
    return <div className="alert alert-error">Failed to load sales.</div>;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Sales</h1>

      <SaleForm onSubmit={handleSubmit} selectedSale={selectedSale} />

      <SaleList sales={sales} onDelete={handleDelete} onEdit={handleEdit} />
    </section>
  );
}
