import { useCallback, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  productsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "./queries";

import { ProductForm, ProductList } from "./components";

import {
  SearchInput,
  SelectFilter,
  SortSelect,
} from "../../components/filters";

import type { Product } from "./types";

import type { ProductFormData } from "./schemas";

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("all");

  const [sort, setSort] = useState("none");

  const { confirm } = useConfirmDialog();

  const { data: products = [], isLoading, isError } = useQuery(productsQuery);

  const createMutation = useCreateProductMutation();

  const updateMutation = useUpdateProductMutation();

  const deleteMutation = useDeleteProductMutation();

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    return [...products]

      .filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase()),
      )

      .filter((product) =>
        category === "all" ? true : product.category === category,
      )

      .sort((a, b) => {
        if (sort === "asc") {
          return a.name.localeCompare(b.name);
        }

        if (sort === "desc") {
          return b.name.localeCompare(a.name);
        }

        return 0;
      });
  }, [products, search, category, sort]);

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

      <div className="grid gap-4 md:grid-cols-3">
        <SearchInput
          value={search}

          onChange={setSearch}

          placeholder="Search product..."
        />

        <SelectFilter
          value={category}

          options={categories}

          onChange={setCategory}

          label="Category"
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

      <ProductList
        products={filteredProducts}

        onDelete={handleDelete}

        onEdit={handleEdit}
      />
    </section>
  );
}
