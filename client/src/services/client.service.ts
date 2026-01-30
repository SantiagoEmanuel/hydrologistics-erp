import type { Client } from "@/types/client.types";

const API_URL = import.meta.env.VITE_API_URL;

export const clientService = {
  getAll: async (): Promise<Client[]> => {
    const response = await fetch(`${API_URL}/clients`);
    if (!response.ok) {
      throw new Error("Error al obtener clientes");
    }
    return await response.json();
  },
  create: async ({
    name,
    type,
  }: {
    name: string;
    type?: string;
  }): Promise<Client> => {
    const response = await fetch(`${API_URL}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, type }),
    });

    if (!response.ok) {
      throw new Error("Error al crear cliente");
    }

    return await response.json();
  },
};
