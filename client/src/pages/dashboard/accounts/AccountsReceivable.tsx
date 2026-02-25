import ClientHistoryDrawer from "@/components/shift/ClientHistoryDrawer";
import { accountService } from "@/services/account.service";
import type { Debtor } from "@/types/account.types";
import { Package, Search, User, Wallet } from "lucide-react";
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
    } catch {
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

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="rounded-2xl bg-white px-4 py-6 shadow-sm md:px-8">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Wallet className="h-8 w-8 text-blue-600" />
            Cuentas Corrientes
          </h1>
          <p className="text-sm text-gray-500">Control de saldos</p>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-bold tracking-wider text-red-400 uppercase">
              Valor estimado de cuentas
            </p>
            <p className="mt-1 text-3xl font-black text-red-600">
              {formatMoney(totalDebt)}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Clientes con deuda
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {debtors.length}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
              <User className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-4 pl-10 text-base outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="p-4 md:p-8">
        {loading ? (
          <div className="py-10 text-center text-gray-400">Cargando...</div>
        ) : filteredDebtors.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
            No hay deudores registrados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDebtors.map((debtor) => (
              <div
                key={debtor.id}
                onClick={() => setSelectedClient(debtor)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md active:scale-95"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <span className="mb-1 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
                      {debtor.type}
                    </span>
                    <h3 className="line-clamp-1 text-lg font-bold text-gray-800 capitalize">
                      {debtor.name.toLocaleLowerCase()}
                    </h3>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <p className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase">
                    <Package className="h-3 w-3" /> Adeuda:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {debtor.productsOwed.slice(0, 3).map((prod, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                      >
                        {prod.quantity} {prod.name}
                      </span>
                    ))}
                    {debtor.productsOwed.length > 3 && (
                      <span className="px-1 text-xs font-medium text-gray-400">
                        +{debtor.productsOwed.length - 3} más
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">Saldo aprox.</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(debtor.debt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientHistoryDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onUpdate={loadDebtors}
      />
    </div>
  );
}
