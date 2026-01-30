import { useClientStore } from "@/store/useClientStore";
import { useEffect } from "react";

export function useClient() {
  const { fetchClients, clients, getClientById, isLoading, error } =
    useClientStore();

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, getClientById, isLoading, error };
}
