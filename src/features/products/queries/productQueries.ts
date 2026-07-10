import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services";

import type { Product } from "../types";

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: getProducts,
});

export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Omit<Product, "id">) => createProduct(product),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Product) => updateProduct(product),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
    },
  });
}
