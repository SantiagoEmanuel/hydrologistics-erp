import { useProductStore } from "@/store/useProductStore";
import { useEffect } from "react";

export function useProducts() {
  const { products, fetchProducts, isLoading, error, updateProductStock } =
    useProductStore();
  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, isLoading, error, updateProductStock };
}
