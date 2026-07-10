import { useEffect, useRef } from "react";

import { useForm } from "@tanstack/react-form";

import { productSchema } from "../../schemas";

import type { ProductFormProps } from "./ProductForm.types";

export default function ProductForm({
  onSubmit,
  selectedProduct,
}: ProductFormProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: 0,
      stock: 0,
    },

    onSubmit: ({ value }) => {
      const result = productSchema.safeParse(value);

      if (!result.success) {
        return;
      }

      onSubmit(result.data);

      form.reset();
    },
  });

  useEffect(() => {
    if (selectedProduct) {
      form.setFieldValue("name", selectedProduct.name);

      form.setFieldValue("description", selectedProduct.description);

      form.setFieldValue("category", selectedProduct.category);

      form.setFieldValue("price", selectedProduct.price);

      form.setFieldValue("stock", selectedProduct.stock);

      firstInputRef.current?.focus();
    }
  }, [selectedProduct, form]);

  return (
    <form
      className="card bg-base-100 shadow p-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <h2 className="text-2xl font-bold">Add Product</h2>

      <form.Field
        name="name"
        children={(field) => (
          <input
            ref={firstInputRef}
            className="input input-bordered w-full"
            placeholder="Product name"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="description"
        children={(field) => (
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Description"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="category"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            placeholder="Category"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      />

      <form.Field
        name="price"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            type="number"
            placeholder="Price"
            value={field.state.value}
            onChange={(event) => field.handleChange(Number(event.target.value))}
          />
        )}
      />

      <form.Field
        name="stock"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            type="number"
            placeholder="Stock"
            value={field.state.value}
            onChange={(event) => field.handleChange(Number(event.target.value))}
          />
        )}
      />

      <button type="submit" className="btn btn-primary">
        Save Product
      </button>
    </form>
  );
}
