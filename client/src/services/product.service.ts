import { api } from "@/lib/api-client";
import type { Product } from "@/types/product.types";

export const productService = {
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await api(`/products`);

      return response;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
  updateStock: async (id: number, adjustment: number): Promise<void> => {
    const res = await api(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ adjustment }),
    });
    return res;
  },
  create: async (product: Product) => {
    try {
      const response: Product = await api("/products", {
        method: "POST",
        body: JSON.stringify(product),
      });

      return response;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
