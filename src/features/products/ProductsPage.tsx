import { useCallback, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  productsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "./queries";

import { ProductForm, ProductList } from "./components";

import type { Product } from "./types";

import type { ProductFormData } from "./schemas";

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const { confirm } = useConfirmDialog();

  const { data: products = [], isLoading, isError } = useQuery(productsQuery);

  const createMutation = useCreateProductMutation();

  const updateMutation = useUpdateProductMutation();

  const deleteMutation = useDeleteProductMutation();

  const handleSubmit = useCallback(
    (product: ProductFormData) => {
      if (selectedProduct) {
        updateMutation.mutate({
          id: selectedProduct.id,
          ...product,
        });

        setSelectedProduct(undefined);

        return;
      }

      createMutation.mutate(product);
    },
    [selectedProduct, createMutation, updateMutation],
  );

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const shouldDelete = await confirm({
        title: "Delete Product",
        message: "Do you really want to delete this product?",
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
    return <div className="alert alert-error">Failed to load products.</div>;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Products</h1>

      <ProductForm onSubmit={handleSubmit} selectedProduct={selectedProduct} />

      <ProductList
        products={products}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </section>
  );
}
