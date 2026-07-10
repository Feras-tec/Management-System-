import { useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useForm } from "@tanstack/react-form";

import { saleSchema } from "../../schemas";

import { customersQuery } from "../../../customers/queries";

import { productsQuery } from "../../../products/queries";

import type { SaleFormProps } from "./SaleForm.types";

export default function SaleForm({ onSubmit, selectedSale }: SaleFormProps) {
  const { data: customers = [] } = useQuery(customersQuery);

  const { data: products = [] } = useQuery(productsQuery);

  const form = useForm({
    defaultValues: {
      customerId: "",
      productId: "",
      quantity: 1,
      total: 0,
      date: new Date().toISOString(),
    },

    onSubmit: ({ value }) => {
      const result = saleSchema.safeParse(value);

      if (!result.success) {
        return;
      }

      onSubmit(result.data);

      form.reset();
    },
  });

  const selectedProduct = useMemo(
    () =>
      products.find((product) => product.id === form.state.values.productId),
    [products, form.state.values.productId],
  );

  useEffect(() => {
    const total = selectedProduct
      ? selectedProduct.price * form.state.values.quantity
      : 0;

    form.setFieldValue("total", total);
  }, [selectedProduct, form]);

  useEffect(() => {
    if (!selectedSale) {
      return;
    }

    form.setFieldValue("customerId", selectedSale.customerId);

    form.setFieldValue("productId", selectedSale.productId);

    form.setFieldValue("quantity", selectedSale.quantity);

    form.setFieldValue("total", selectedSale.total);
  }, [selectedSale, form]);

  return (
    <form
      className="card bg-base-100 shadow p-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <h2 className="text-2xl font-bold">Add Sale</h2>

      <form.Field
        name="customerId"
        children={(field) => (
          <select
            className="select select-bordered w-full"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          >
            <option value="">Select Customer</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.firstName} {customer.lastName}
              </option>
            ))}
          </select>
        )}
      />

      <form.Field
        name="productId"
        children={(field) => (
          <select
            className="select select-bordered w-full"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        )}
      />

      <form.Field
        name="quantity"
        children={(field) => (
          <input
            className="input input-bordered w-full"
            type="number"
            value={field.state.value}
            onChange={(event) => field.handleChange(Number(event.target.value))}
          />
        )}
      />

      <div className="alert">Total: {form.state.values.total}</div>

      <button className="btn btn-primary" type="submit">
        Save Sale
      </button>
    </form>
  );
}
