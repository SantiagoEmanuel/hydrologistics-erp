import ClientHistoryDrawer from "@/components/ClientHistoryDrawer";
import { accountService } from "@/services/account.service";
import type { Debtor } from "@/types/account.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AccountsReceivable() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedClient, setSelectedClient] = useState<Debtor | null>(null);

  const loadDebtors = async () => {
    setLoading(true);
    try {
      const data = await accountService.getDebtors();
      setDebtors(data);
    } catch (error) {
      toast.error("Error cargando deudores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebtors();
  }, []);

  const filteredDebtors = debtors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalDebt = debtors.reduce((acc, d) => acc + d.debt, 0);
  const totalDebtors = debtors.length;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(val);

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cuentas Corrientes</h1>
        <p className="text-gray-500">Gestión de Cobranzas y Deudores</p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border-l-4 border-red-500 bg-white p-4 shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Total por Cobrar
          </p>
          <p className="text-3xl font-bold text-gray-800">
            {formatMoney(totalDebt)}
          </p>
        </div>
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
          <p className="text-xs font-bold text-gray-400 uppercase">
            Clientes Deudores
          </p>
          <p className="text-3xl font-bold text-gray-800">{totalDebtors}</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar cliente..."
          className="w-full max-w-md rounded border p-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="p-4">Cliente</th>
              <th className="p-4">Tipo</th>
              <th className="p-4 text-right">Deuda Total</th>
              <th className="p-4 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Cargando radar de deudas...
                </td>
              </tr>
            ) : filteredDebtors.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  ¡Todo limpio! No hay deudores (o no coinciden con la
                  búsqueda).
                </td>
              </tr>
            ) : (
              filteredDebtors.map((debtor) => (
                <tr
                  key={debtor.id}
                  className="cursor-pointer transition hover:bg-gray-50"
                  onClick={() => setSelectedClient(debtor)}
                >
                  <td className="p-4 font-medium text-gray-800">
                    {debtor.name}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {debtor.type}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono text-lg font-bold text-red-600">
                      {formatMoney(debtor.debt)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className="text-sm font-bold text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(debtor);
                      }}
                    >
                      VER FICHA →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ClientHistoryDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdate={loadDebtors}
      />
    </div>
  );
}
