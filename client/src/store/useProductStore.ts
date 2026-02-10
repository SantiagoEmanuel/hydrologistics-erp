import { productService } from "@/services/product.service";
import type { Product } from "@/types/product.types";
import { toast } from "sonner";
import { create } from "zustand";

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;

  createProduct: (product: Product) => Promise<void>;
  updateProduct: () => Promise<void>;
  deleteProduct: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  updateProductStock: (id: number, adjustment: number) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  createProduct: async (product) => {
    set(() => ({
      isLoading: true,
    }));
    if (!product) {
      toast.error("Producto inválido");
      set(() => ({
        isLoading: false,
      }));
      return;
    }

    try {
      const res = await productService.create(product);
      if (!res) {
        toast.error("No se pudo crear el producto");
        throw new Error("No se pudo crear el producto");
      }
    } catch {
      throw new Error("No se pudo crear el producto");
    } finally {
      set(() => ({
        isLoading: false,
      }));
    }
  },
  updateProduct: async () => {},
  deleteProduct: async () => {},
  fetchProducts: async () => {
    const currentProducts = get().products;
    if (currentProducts.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      const data = await productService.getAll();
      set({ products: data, isLoading: false });
    } catch (err) {
      console.log({ err });
      set({ error: "No se pudieron cargar los productos", isLoading: false });
    }
  },
  updateProductStock: async (id: number, adjustment: number) => {
    try {
      await productService.updateStock(id, adjustment);

      set((state) => ({
        products: state.products.map((p) =>
          p.id === id.toString() ? { ...p, stock: p.stock + adjustment } : p,
        ),
      }));

      toast.success("Stock actualizado correctamente");
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Error al actualizar stock");
    }
  },
}));
