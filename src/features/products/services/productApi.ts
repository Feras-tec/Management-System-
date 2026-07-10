import type { Product } from "../types";

const API_URL = "https://dummyjson.com/products";

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await response.json();

  return data.products.map(
    (product: {
      id: number;
      title: string;
      description: string;
      category: string;
      price: number;
      stock: number;
    }) => ({
      id: String(product.id),
      name: product.title,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
    }),
  );
}

export async function createProduct(
  product: Omit<Product, "id">,
): Promise<Product> {
  const response = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("Failed to create product");
  }

  const data = await response.json();

  return {
    ...product,
    id: String(data.id),
  };
}

export async function updateProduct(product: Product): Promise<Product> {
  const response = await fetch(`${API_URL}/${product.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }
}
