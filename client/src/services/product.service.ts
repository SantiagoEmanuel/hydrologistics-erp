import type { Product } from "@/types/product.types";

const API_URL = import.meta.env.VITE_API_URL;

export const productService = {
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
  updateStock: async (id: number, adjustment: number): Promise<void> => {
    const res = await fetch(`${API_URL}/products/${id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustment }),
    });

    if (!res.ok) throw new Error("Error al actualizar stock");
  },
};
