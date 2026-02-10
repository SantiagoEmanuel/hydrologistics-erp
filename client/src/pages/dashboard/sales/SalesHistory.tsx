import { saleService } from "@/services/sale.service"; // Asumo que agregarás los métodos aquí
import type { Sale } from "@/types/sale.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [dateFrom, setDateFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const loadSales = async () => {
    setLoading(true);
    try {
      // Necesitarás actualizar tu saleService para aceptar params
      const data = await saleService.getHistory(dateFrom, dateTo);
      setSales(data);
    } catch (error) {
      toast.error("Error cargando ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [dateFrom, dateTo]); // Recargar automático al cambiar fechas

  const handleAnnullSale = async (sale: Sale) => {
    if (
      !confirm(
        `¿Estás seguro de anular el Ticket #${sale.ticketCode}? El stock será devuelto.`,
      )
    )
      return;

    try {
      await saleService.cancelSale(sale.id);
      toast.success("Venta anulada correctamente");
      loadSales(); // Recargar tabla
    } catch (error: any) {
      toast.error(error.message || "No se pudo anular");
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  // Cálculos de resumen
  const totalPeriodo = sales
    .filter((s) => s.paymentStatus !== "CANCELLED")
    .reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex flex-col items-end justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historial de Ventas
          </h1>
          <p className="text-gray-500">Consulta y anulación de comprobantes</p>
        </div>

        {/* KPI Rápido */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <p className="text-xs font-bold text-blue-600 uppercase">
            Total en este periodo
          </p>
          <p className="text-2xl font-bold text-blue-800">
            {formatMoney(totalPeriodo)}
          </p>
        </div>
      </header>

      {/* BARRA DE FILTROS */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-4 shadow">
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-500">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-500">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border p-2"
          />
        </div>
        <button
          onClick={loadSales}
          className="rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-gray-700"
        >
          Refrescar
        </button>
      </div>

      {/* TABLA */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase">
            <tr>
              <th className="p-4">Fecha/Hora</th>
              <th className="p-4">Ticket</th>
              <th className="p-4">Detalle</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Monto</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  Cargando...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  No hay ventas en este rango.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const isCancelled = sale.paymentStatus === "CANCELLED";
                return (
                  <tr
                    key={sale.id}
                    className={
                      isCancelled ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                    }
                  >
                    <td className="p-4">
                      {new Date(sale.createdAt).toLocaleDateString()} <br />
                      <span className="text-xs text-gray-500">
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold">
                      #{sale.ticketCode}
                    </td>
                    <td className="flex w-full flex-col items-start justify-center gap-2 p-4 font-mono">
                      {sale.items.map((item) => (
                        <span className="font-black text-gray-400">
                          {item.product.name}x{item.quantity}
                        </span>
                      ))}
                    </td>
                    <td className="p-4">
                      {sale.client?.name || (
                        <span className="text-gray-400 italic">
                          Consumidor Final
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-xs font-bold ${
                          isCancelled
                            ? "bg-red-100 text-red-600"
                            : sale.paymentStatus === "PAID"
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                        }`}
                      >
                        {isCancelled ? "ANULADO" : sale.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      {isCancelled ? (
                        <span className="text-gray-400 line-through">
                          {formatMoney(sale.totalAmount)}
                        </span>
                      ) : (
                        formatMoney(sale.totalAmount)
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {!isCancelled && (
                        <button
                          onClick={() => handleAnnullSale(sale)}
                          className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-500 transition hover:bg-red-100 hover:text-red-700"
                          title="Anular venta y devolver stock"
                        >
                          ANULAR
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
