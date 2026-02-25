import { clientService } from "@/services/client.service";
import type { Client } from "@/types/client.types";

import { create } from "zustand";

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;

  fetchClients: () => Promise<void>;

  getClientById: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  fetchClients: async () => {
    if (get().clients.length > 0) return;

    set({ isLoading: true, error: null });
    try {
      const data = await clientService.getAll();
      set({ clients: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ error: "No se pudieron cargar los clientes", isLoading: false });
    }
  },

  getClientById: (id) => get().clients.find((c) => c.id === id),
}));
