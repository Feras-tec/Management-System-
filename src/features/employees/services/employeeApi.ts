import type { Employee } from "../types";

const API_URL = "https://dummyjson.com/users";

export async function getEmployees(): Promise<Employee[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch employees.");
  }

  const data = await response.json();

  return data.users.map(
    (user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    }) => ({
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      position: "Developer",
      salary: 3000,
    }),
  );
}

export async function createEmployee(
  employee: Omit<Employee, "id">,
): Promise<Employee> {
  const response = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    throw new Error("Failed to create employee.");
  }

  const data = await response.json();

  return {
    ...employee,
    id: String(data.id),
  };
}

export async function updateEmployee(employee: Employee): Promise<Employee> {
  const response = await fetch(`${API_URL}/${employee.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employee),
  });

  if (!response.ok) {
    throw new Error("Failed to update employee.");
  }

  return employee;
}

export async function deleteEmployee(id: string): Promise<string> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete employee.");
  }

  return id;
}
