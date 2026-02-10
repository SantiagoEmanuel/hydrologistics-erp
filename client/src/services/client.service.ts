import { api } from "@/lib/api-client";
import type { Client } from "@/types/client.types";

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const response = await api(`/clients`);
    return response;
  },
  create: async ({
    name,
    type,
  }: {
    name: string;
    type?: string;
  }): Promise<Client> => {
    const response = await api(`/clients`, {
      method: "POST",
      body: JSON.stringify({ name, type }),
    });

    return response;
  },
};
