import type { CartItem } from "@/store/useCartStore";
import type { Sale } from "@/types/sale.types";

const API_URL = import.meta.env.VITE_API_URL;

export const saleService = {
  saveSale: async (
    clientId: string,
    items: CartItem[],
    paidStatus = "UNPAID",
    paymentMethodId?: number,
  ) => {
    const itemsPayload = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    const response = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: itemsPayload,
        clientId,
        paidStatus,
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return await response.json();
  },

  getHistory: async (from?: string, to?: string): Promise<Sale[]> => {
    // Construir query string: ?from=2026-01-20&to=2026-01-21
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const res = await fetch(`${API_URL}/sales?${params.toString()}`);
    if (!res.ok) throw new Error("Error al obtener historial");
    return await res.json();
  },

  // Nuevo método
  cancelSale: async (id: string) => {
    const res = await fetch(`${API_URL}/sales/${id}`, {
      method: "DELETE", // Ojo: Express lo manejará como DELETE aunque sea soft delete
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al anular");
    }
  },

  getPaymentMethods: async () => {
    const res = await fetch(`${API_URL}/sales/get-payments-methods`);
    if (!res.ok) throw new Error("Error al obtener los métodos de pago");
    return await res.json();
  },

  paidSale: async (
    id: string,
    paymentMethodId: number,
    shiftId: string,
  ): Promise<Sale> => {
    const res = await fetch(`${API_URL}/sales/${id}/paid-sale`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethodId,
        shiftId,
      }),
    });

    if (!res.ok) {
      throw new Error("Error al actualizar el estado");
    }

    const data = await res.json();

    return data;
  },

  saveInLocalStorage: async (
    clientId: string,
    items: CartItem[],
  ): Promise<boolean> => {
    const itemsPayload = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    localStorage.setItem(
      "pendingOrders",
      JSON.stringify({ items: itemsPayload, clientId: clientId }),
    );

    return true;
  },
};
