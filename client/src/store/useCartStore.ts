import { saleService } from "@/services/sale.service";
import type { Client } from "@/types/client.types";
import type { Product } from "@/types/product.types";
import type { Sale } from "@/types/sale.types";
import { toast } from "sonner";
import { create } from "zustand";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: number;
  name: string;
  isActive: boolean;
}

interface CartState {
  items: CartItem[];
  selectedClient: Client | null;
  isBuying: boolean;
  paymentMethods: PaymentMethod[];

  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  decreaseItem: (productId: number) => void;
  clearCart: () => void;
  buyCart: (paymentStatus: string, paymentMethodId: number) => Promise<void>;
  paidSale: (
    id: string,
    paymentMethodId: number,
    shiftId: string,
  ) => Promise<Sale | null>;
  getAllPayments: () => Promise<void>;
  setCartPending: () => Promise<void>;

  selectClient: (client: Client | null) => void;

  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isBuying: false,
  selectedClient: null,
  paymentMethods: [],

  selectClient: (client) => set({ selectedClient: client }),
  addItem: (product) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.product.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },
  clearCart: () => set({ items: [] }),
  buyCart: async (paymentStatus, paymentMethodId) => {
    const { selectedClient, items } = get();
    set({ isBuying: true });
    try {
      const clientId = selectedClient?.id || "";

      const sale = await saleService.saveSale(
        clientId,
        items,
        paymentStatus,
        paymentMethodId,
      );

      toast.success(`Venta registrada correctamente`, {
        description: `Ticket #${sale.ticketCode} - Total: $${sale.totalAmount}`,
        duration: 5000,
      });
      set({ items: [], selectedClient: null });
      get().clearCart();
    } catch (error) {
      toast.error("Error al procesar la venta", {
        description: `${error.message}`,
      });
    } finally {
      set({ isBuying: false });
    }
  },
  paidSale: async (id, paymentMethodId, shiftId) => {
    if (!id || !paymentMethodId || !shiftId) {
      toast.error("Datos inválidos", {
        description:
          "Se necesita el producto y el método de pago para continuar",
      });
      return null;
    }

    try {
      const sale = await saleService.paidSale(id, paymentMethodId, shiftId);

      if (!sale) {
        toast.error("Error al pagar", {
          description: "Inténtalo más tarde",
        });
        return null;
      }

      toast.success("Pago exitoso", {
        description: "Se ha registrado el pago correctamente",
      });
      return sale;
    } catch (error) {
      toast.error("Error al pagar", {
        description: `${error.message}`,
      });
      return null;
    }
  },
  getAllPayments: async () => {
    const paymentsMethod = await saleService.getPaymentMethods();
    set(() => ({
      paymentMethods: paymentsMethod,
    }));
    return;
  },
  decreaseItem: (productId) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === productId,
      );
      if (!existingItem) return state;
      if (existingItem.quantity === 1) {
        return {
          items: state.items.filter((item) => item.product.id !== productId),
        };
      }

      return {
        items: state.items.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      };
    });
  },

  setCartPending: async () => {
    const { selectedClient, items } = get();

    if (items.length === 0) {
      toast.error("Error", {
        description: "El carrito no puede estar vacío",
      });
      return;
    }

    const clientId = selectedClient?.id || "";

    const result = await saleService.saveInLocalStorage(clientId, items);

    if (!result) {
      toast.error("Orden no tomada", {
        description: "No se pudo tomar el pedido",
      });
      return;
    }

    get().clearCart();
    toast.success("Pedido tomado", {
      description: "El pedido se guardó correctamente",
    });
    return;
  },

  getTotal: () => {
    const { items, selectedClient } = get();
    const isWholesale = selectedClient?.type === "REVENDEDOR";

    return items.reduce((total, item) => {
      const finalPrice =
        isWholesale && item.product.wholesalePrice
          ? item.product.wholesalePrice
          : item.product.price;

      return total + finalPrice * item.quantity;
    }, 0);
  },
}));
