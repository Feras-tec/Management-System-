import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { getSales, createSale, updateSale, deleteSale } from "../services";

import type { Sale } from "../types";

export const salesQuery = queryOptions({
  queryKey: ["sales"],
  queryFn: getSales,
});

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sale: Omit<Sale, "id">) => createSale(sale),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      });
    },
  });
}

export function useUpdateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sale: Sale) => updateSale(sale),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      });
    },
  });
}

export function useDeleteSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSale(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sales"],
      });
    },
  });
}
