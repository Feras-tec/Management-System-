import type { Customer } from "../types";
const API_URL = "https://dummyjson.com/users";
export async function getCustomers(): Promise<Customer[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch customers");
  const data = await response.json();
  return data.users.map(
    (user: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      company: { name: string };
    }) => ({
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      company: user.company.name,
    }),
  );
}
export async function createCustomer(
  customer: Omit<Customer, "id">,
): Promise<Customer> {
  const response = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
  if (!response.ok) throw new Error("Failed to create customer");
  const data = await response.json();
  return { ...customer, id: String(data.id) };
}
export async function updateCustomer(customer: Customer): Promise<Customer> {
  const response = await fetch(`${API_URL}/${customer.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
  if (!response.ok) throw new Error("Failed to update customer");
  return customer;
}
export async function deleteCustomer(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete customer");
}
