import type { AccountTransaction, Debtor } from "@/types/account.types";

const API_URL = import.meta.env.VITE_API_URL;

export const accountService = {
  getDebtors: async (): Promise<Debtor[]> => {
    const res = await fetch(`${API_URL}/accounts/debtors`);
    if (!res.ok) throw new Error("Error al cargar deudores");
    return await res.json();
  },

  getHistory: async (clientId: string): Promise<AccountTransaction[]> => {
    const res = await fetch(`${API_URL}/accounts/${clientId}/history`);
    if (!res.ok) throw new Error("Error al cargar historial");
    return await res.json();
  },

  registerPayment: async (clientId: string, amount: number, notes?: string) => {
    const res = await fetch(`${API_URL}/accounts/${clientId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, notes }),
    });
    if (!res.ok) throw new Error("Error al registrar pago");
    return await res.json();
  },
};
