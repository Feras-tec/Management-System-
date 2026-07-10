import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services";

import type { Employee } from "../types";

export const employeesQuery = queryOptions({
  queryKey: ["employees"],
  queryFn: getEmployees,
});

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Omit<Employee, "id">) => createEmployee(employee),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    },
  });
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employee: Employee) => updateEmployee(employee),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
    },
  });
}
