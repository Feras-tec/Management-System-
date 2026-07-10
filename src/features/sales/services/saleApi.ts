import type { Sale } from "../types";

const API_URL = "https://dummyjson.com/carts";

export async function getSales(): Promise<Sale[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch sales");
  }

  const data = await response.json();

  return data.carts.flatMap(
    (cart: {
      id: number;
      products: {
        id: number;
        quantity: number;
        price: number;
      }[];
    }) =>
      cart.products.map((product) => ({
        id: `${cart.id}-${product.id}`,
        customerId: String(cart.id),
        productId: String(product.id),
        quantity: product.quantity,
        total: product.price * product.quantity,
        date: new Date().toISOString(),
      })),
  );
}

export async function createSale(sale: Omit<Sale, "id">): Promise<Sale> {
  const response = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sale),
  });

  if (!response.ok) {
    throw new Error("Failed to create sale");
  }

  const data = await response.json();

  return {
    ...sale,
    id: String(data.id),
  };
}

export async function updateSale(sale: Sale): Promise<Sale> {
  const response = await fetch(`${API_URL}/${sale.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sale),
  });

  if (!response.ok) {
    throw new Error("Failed to update sale");
  }

  return sale;
}

export async function deleteSale(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete sale");
  }
}
