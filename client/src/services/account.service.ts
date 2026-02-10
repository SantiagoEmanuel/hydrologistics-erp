import { api } from "@/lib/api-client";
import type { AccountTransaction, Debtor } from "@/types/account.types";

export const accountService = {
  getDebtors: async (): Promise<Debtor[]> => {
    const res = await api(`/accounts/debtors`);
    return res;
  },

  getHistory: async (clientId: string): Promise<AccountTransaction[]> => {
    const res = await api(`/accounts/${clientId}/history`);
    return res;
  },

  registerPayment: async (clientId: string, amount: number, notes?: string) => {
    const res = await api(`/accounts/${clientId}/pay`, {
      method: "POST",
      body: JSON.stringify({ amount, notes }),
    });
    return res;
  },
};
