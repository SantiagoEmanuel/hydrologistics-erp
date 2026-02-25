import { api } from "@/lib/api-client";
import type { CartItem } from "@/store/useCartStore";
import type { Sale } from "@/types/sale.types";

export interface CreateSalePayload {
  items: {
    productId: number;
    quantity: number;
  }[];
  clientId?: string | null;
  paidStatus: "PAID" | "UNPAID";
  paymentMethodId: number;
  newDate?: string;
}

export interface EditSalePayload {
  clientId: string | null;
  paymentMethodId: number;
  paymentStatus: "PAID" | "UNPAID";
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  newDate?: string;
}

export const saleService = {
  /**
   * MÉTODO PRINCIPAL: Registra una venta en una caja específica.
   * Funciona tanto para ventas en vivo (OPEN) como históricas (EDITING).
   */
  createSale: async (shiftId: string, data: CreateSalePayload) => {
    if (!shiftId) {
      throw new Error("Error interno: Falta el ID de la caja (Shift ID).");
    }

    const response = await api(`/sales/save-sale/${shiftId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response;
  },

  /**
   * Método Adaptado (Legacy):
   * Transforma los items del carrito al formato del backend y llama a createSale.
   * NOTA: Ahora requiere shiftId obligatoriamente.
   */
  saveSale: async (
    shiftId: string,
    clientId: string | null,
    items: CartItem[],
    paidStatus: "PAID" | "UNPAID" = "UNPAID",
    paymentMethodId: number,
  ) => {
    const itemsPayload = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    return await saleService.createSale(shiftId, {
      items: itemsPayload,
      clientId,
      paidStatus,
      paymentMethodId,
    });
  },

  update: async (id: string, data: EditSalePayload) => {
    const res = await api(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res;
  },

  getHistory: async (from?: string, to?: string): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const res = await api(`/sales?${params.toString()}`);
    return await res;
  },

  cancelSale: async (id: string) => {
    await api(`/sales/${id}`, {
      method: "DELETE",
    });
  },

  getPaymentMethods: async () => {
    const res = await api(`/sales/get-payments-methods`);
    return res;
  },

  paidSale: async (
    id: string,
    paymentMethodId: number,
    shiftId: string,
  ): Promise<Sale> => {
    const res = await api(`/sales/${id}/paid-sale`, {
      method: "PATCH",
      body: JSON.stringify({
        paymentMethodId,
        shiftId,
      }),
    });

    return res;
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
