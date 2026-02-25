import { useClient } from "@/hook/useClient";
import { clientService } from "@/services/client.service";
import { useCartStore } from "@/store/useCartStore";
import type { Client } from "@/types/client.types";
import { PlusIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

export default function ClientSelector() {
  const { clients } = useClient();
  const { selectedClient, selectClient } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newClient, setNewClient] = useState(false);
  const [client, setClient] = useState({
    name: "",
    type: "",
  });

  const filteredClients = useMemo(() => {
    if (!search) return clients.slice(0, 5);
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dni?.includes(search),
    );
  }, [clients, search]);

  const handleSelect = (client: Client) => {
    selectClient(client);
    setIsOpen(false);
    setSearch("");
  };

  const clearSelection = () => {
    selectClient(null);
    setSearch("");
  };

  const handleNewClient = async () => {
    const response = await clientService.create(client);
    handleSelect(response);
    setNewClient(false);
  };

  return (
    <div className="relative mb-4">
      <label className="mb-1 block text-sm font-semibold text-gray-600">
        Cliente
      </label>
      {selectedClient ? (
        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3">
          <div>
            <p className="font-bold text-blue-900">{selectedClient.name}</p>
            <p className="text-xs text-blue-600">
              {selectedClient.type === "REVENDEDOR"
                ? "⭐ Mayorista"
                : "👤 Consumidor Final"}
            </p>
          </div>
          <button
            onClick={clearSelection}
            className="px-2 font-bold text-blue-400 hover:text-blue-600"
          >
            ✕
          </button>
        </div>
      ) : (
        <div>
          <div className="relative w-full">
            <div className="flex gap-2">
              {newClient && (
                <button
                  className="absolute top-3 right-1 size-5 cursor-pointer rounded-full bg-blue-500 text-white"
                  onClick={() => setNewClient(false)}
                >
                  <XIcon className="h-full w-full" />
                </button>
              )}
              <div className="flex flex-1 flex-col gap-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full rounded-md border border-gray-300 p-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={search}
                  onChange={(e) => {
                    if (!newClient) {
                      setSearch(e.target.value);
                      setIsOpen(true);
                      return;
                    }
                    setSearch(e.target.value);
                    setClient((prev) => {
                      return {
                        ...prev,
                        name: e.target.value,
                      };
                    });
                  }}
                  onFocus={() => setIsOpen(true)}
                />
                {newClient && (
                  <select
                    value={client.type}
                    onChange={(e) =>
                      setClient((prev) => {
                        return {
                          ...prev,
                          type: e.target.value,
                        };
                      })
                    }
                    className="rounded border border-gray-300 bg-gray-200 py-2"
                  >
                    <option value="FINAL">Consumidor Final</option>
                    <option value="REVENDEDOR">Revendedor</option>
                  </select>
                )}
              </div>
              <button
                className={`rounded-md border border-gray-300 px-2 text-green-500 shadow-sm transition-colors hover:bg-green-500 hover:text-white ${newClient && "hidden"}`}
                onClick={() => setNewClient(true)}
              >
                <PlusIcon className="size-5" />
              </button>
            </div>
            {newClient && (
              <button
                className="mt-4 w-full rounded bg-sky-500 py-2 text-center text-white"
                onClick={handleNewClient}
              >
                Crear cliente
              </button>
            )}
          </div>

          {isOpen && !newClient && (
            <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
              <li
                className="cursor-pointer border-b border-gray-100 p-2 text-gray-500 italic hover:bg-gray-100"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                -- Consumidor Final (Anónimo) --
              </li>

              {filteredClients.map((client) => (
                <li
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className="cursor-pointer border-b border-gray-50 p-2 last:border-none hover:bg-blue-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{client.name}</span>
                    {client.type === "REVENDEDOR" && (
                      <span className="rounded bg-yellow-100 px-1 text-xs text-yellow-800">
                        MAY
                      </span>
                    )}
                  </div>
                  {client.dni && (
                    <p className="text-xs text-gray-400">DNI: {client.dni}</p>
                  )}
                </li>
              ))}

              {filteredClients.length === 0 && (
                <li className="p-3 text-center text-sm text-gray-400">
                  No se encontraron clientes
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
