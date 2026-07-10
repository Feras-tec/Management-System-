import { useCallback, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useConfirmDialog } from "../../providers";

import {
  SearchInput,
  SelectFilter,
  SortSelect,
} from "../../components/filters";

import {
  employeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from "./queries";

import { EmployeeForm, EmployeeList } from "./components";

import { EmployeePosition } from "./types";

import type { Employee } from "./types";

import type { EmployeeFormData } from "./schemas";

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<
    Employee | undefined
  >();

  const [search, setSearch] = useState("");

  const [positionFilter, setPositionFilter] = useState("all");

  const [sort, setSort] = useState("none");

  const { confirm } = useConfirmDialog();

  const { data: employees = [], isLoading, isError } = useQuery(employeesQuery);

  const createMutation = useCreateEmployeeMutation();

  const updateMutation = useUpdateEmployeeMutation();

  const deleteMutation = useDeleteEmployeeMutation();

  const handleSubmit = useCallback(
    (employee: EmployeeFormData) => {
      if (selectedEmployee) {
        updateMutation.mutate({
          id: selectedEmployee.id,
          ...employee,
        });

        setSelectedEmployee(undefined);

        return;
      }

      createMutation.mutate(employee);
    },
    [selectedEmployee, createMutation, updateMutation],
  );

  const handleEdit = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmDelete = await confirm({
        title: "Delete Employee",
        message: "Do you really want to delete this employee?",
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

  const filteredEmployees = employees
    .filter((employee) => {
      const matchesSearch = `${employee.firstName} ${employee.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesPosition =
        positionFilter === "all" || employee.position === positionFilter;

      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;

      if (sort === "asc") {
        return nameA.localeCompare(nameB);
      }

      if (sort === "desc") {
        return nameB.localeCompare(nameA);
      }

      return 0;
    });

  if (isLoading) {
    return <div className="loading loading-spinner" />;
  }

  if (isError) {
    return <div className="alert alert-error">Failed to load employees.</div>;
  }

  return (
    <section className="space-y-8">
      <h1 className="text-4xl font-bold">Employees</h1>

      <EmployeeForm
        onSubmit={handleSubmit}
        selectedEmployee={selectedEmployee}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search employee..."
        />

        <SelectFilter
          value={positionFilter}
          options={Object.values(EmployeePosition)}
          onChange={setPositionFilter}
          label="All Positions"
        />

        <SortSelect value={sort} onChange={setSort} />
      </div>

      <EmployeeList
        employees={filteredEmployees}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </section>
  );
}
