import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services";

import type { Customer } from "../types";

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: getCustomers,
});

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Omit<Customer, "id">) => createCustomer(customer),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: Customer) => updateCustomer(customer),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customers"],
      });
    },
  });
}
