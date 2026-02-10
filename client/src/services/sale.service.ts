import { api } from "@/lib/api-client";
import type { CartItem } from "@/store/useCartStore";
import type { Sale } from "@/types/sale.types";

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

    const response = await api(`/sales`, {
      method: "POST",
      body: JSON.stringify({
        items: itemsPayload,
        clientId,
        paidStatus,
        paymentMethodId,
      }),
    });

    return await response;
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
