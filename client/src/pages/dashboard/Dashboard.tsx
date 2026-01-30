import MovementModal from "@/components/shift/MovementModal";
import { shiftService } from "@/services/shift.service";
import { useCartStore } from "@/store/useCartStore";
import { useShiftStore } from "@/store/useShiftStore";
import type { Sale } from "@/types/sale.types";
import type { CashMovement } from "@/types/shift.types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { currentShift } = useShiftStore();
  const { paidSale, paymentMethods, getAllPayments } = useCartStore();
  const [paidMethod, setPaidMethod] = useState<number>(1);

  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const shiftData = await shiftService.getCurrent();

      if (shiftData.status === "OPEN" && shiftData.shift) {
        setSales(shiftData.shift.sales || []);
        setMovements(shiftData.shift.movements || []);
      } else {
        setSales([]);
        setMovements([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos del turno");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    getAllPayments();
  }, []);

  const stats = useMemo(() => {
    const paidSales = sales.filter((s) => s.paymentStatus === "PAID");
    const totalSales = paidSales.reduce((acc, s) => acc + s.totalAmount, 0);

    const totalOut = movements
      .filter((m) => m.type === "OUT")
      .reduce((acc, m) => acc + m.amount, 0);

    const totalIn = movements
      .filter((m) => m.type === "IN")
      .reduce((acc, m) => acc + m.amount, 0);

    const initial = currentShift?.initialAmount || 0;

    const cashSales = paidSales
      .filter((s) => {
        const method = s.paymentMethods?.name?.toUpperCase();
        return !method || method === "EFECTIVO" || method === "CASH";
      })
      .reduce((acc, s) => acc + s.totalAmount, 0);

    const theoreticalCash = initial + cashSales + totalIn - totalOut;

    return { totalSales, totalOut, theoreticalCash };
  }, [sales, movements, currentShift]);

  const handlePaidSale = async (id: string, paymentMethodId: number) => {
    try {
      const saleUpdate = await paidSale(id, paymentMethodId, currentShift!.id);

      if (!saleUpdate) return;

      console.log({
        saleUpdate,
        sales,
      });

      setSales((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...saleUpdate } : s)),
      );

      toast.success("Pedido cobrado y actualizado");
    } catch (error) {
      console.error(error);
    }
  };

  const handleMovementSaved = () => {
    setShowMovementModal(false);
    loadDashboardData();
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Cargando tablero...</div>
    );

  return (
    <div className="flex flex-col gap-6 p-2">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
          <p className="text-xs font-bold text-gray-500 uppercase">
            Ventas Totales
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {formatMoney(stats.totalSales)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-lg border-l-4 border-red-500 bg-white p-4 shadow">
          <p className="text-xs font-bold text-red-500 uppercase">
            Gastos / Retiros
          </p>
          <p className="text-2xl font-bold text-red-700">
            - {formatMoney(stats.totalOut)}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border-l-4 border-green-400 bg-gray-800 p-4 text-white shadow md:col-span-2">
          <div>
            <p className="mb-1 text-xs font-bold text-gray-400 uppercase">
              Efectivo en Caja (Teórico)
            </p>
            <p className="font-mono text-3xl font-bold text-green-400">
              {formatMoney(stats.theoreticalCash)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              *Excluye transferencias y cuentas corrientes
            </p>
          </div>
          <button
            onClick={() => setShowMovementModal(true)}
            className="rounded bg-red-600 px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-red-500"
          >
            Registrar Gasto
          </button>
        </div>
      </section>

      <section className="flex w-full gap-4">
        <section className="h-full flex-1 rounded-md bg-white shadow-md">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Hora</th>
                <th className="px-6 py-3">Ticket</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.filter((s) => s.paymentStatus === "PAID").length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No hay ventas cobradas.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  if (sale.paymentStatus !== "PAID") return null;

                  const isTransfer = sale.paymentMethods?.name
                    ?.toUpperCase()
                    .includes("TRANSFER");

                  return (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-mono text-gray-600">
                        {formatTime(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        #{sale.ticketCode}
                      </td>
                      <td className="px-6 py-4">
                        {sale.client ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {sale.client.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Final</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${
                            isTransfer
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {sale.paymentMethods.name || "Efectivo"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatMoney(sale.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <aside className="flex w-full max-w-85 flex-col rounded-md bg-white shadow-md">
          <h2 className="border-b bg-gray-100 px-4 py-4 text-xl font-bold text-gray-700">
            Pedidos Pendientes
          </h2>
          <div className="flex max-h-150 flex-col gap-4 overflow-y-auto p-4">
            {sales.filter((s) => s.paymentStatus === "UNPAID").length === 0 && (
              <p className="py-4 text-center text-gray-400">
                No hay pedidos pendientes.
              </p>
            )}

            {sales.map((sale) => {
              if (sale.paymentStatus !== "UNPAID") return null;
              return (
                <article
                  key={sale.id}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="font-bold text-gray-800">
                      #{sale.ticketCode}
                    </h3>
                    <span className="font-mono text-xs text-gray-500">
                      {formatTime(sale.createdAt)}
                    </span>
                  </div>
                  <ul className="mb-3 list-disc pl-5 text-sm text-gray-600">
                    {sale.items?.map((item) => (
                      <li key={item.id}>
                        {item.product.name}{" "}
                        <span className="font-bold">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatMoney(sale.totalAmount)}
                    </span>
                  </div>

                  <select
                    onChange={(e) =>
                      setPaidMethod(Number(e.currentTarget.value))
                    }
                    className="my-4 w-full bg-white py-2 text-center"
                  >
                    {paymentMethods.map((P) => (
                      <option value={P.id}>{P.name}</option>
                    ))}
                  </select>
                  <button
                    className="w-full rounded-md bg-green-600 py-2 font-bold text-white shadow transition hover:bg-green-700"
                    onClick={() => handlePaidSale(sale.id, paidMethod)}
                  >
                    Marcar Cobrado
                  </button>
                </article>
              );
            })}
          </div>
        </aside>
      </section>

      {showMovementModal && <MovementModal onClose={handleMovementSaved} />}
    </div>
  );
}
