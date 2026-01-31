import PendingSaleCard from "@/components/PendingSaleCard";
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
    const pendingSales = sales.filter((s) => s.paymentStatus === "UNPAID");

    const totalSalesMoney = paidSales.reduce(
      (acc, s) => acc + s.totalAmount,
      0,
    );
    const totalOut = movements
      .filter((m) => m.type === "OUT")
      .reduce((acc, m) => acc + m.amount, 0);
    const totalIn = movements
      .filter((m) => m.type === "IN")
      .reduce((acc, m) => acc + m.amount, 0);

    const initial = currentShift?.initialAmount || 0;
    const cashSalesMoney = paidSales
      .filter((s) => {
        const method = s.paymentMethods?.name?.toUpperCase();
        return !method || method === "EFECTIVO";
      })
      .reduce((acc, s) => acc + s.totalAmount, 0);

    const theoreticalCash = initial + cashSalesMoney + totalIn - totalOut;

    const countResellers = paidSales.filter(
      (s) => s.client?.type === "REVENDEDOR",
    ).length;
    const countFinal = paidSales.length - countResellers;

    return {
      money: {
        totalSales: totalSalesMoney,
        totalOut,
        theoreticalCash,
      },
      counts: {
        paid: paidSales.length,
        pending: pendingSales.length,
        resellers: countResellers,
        final: countFinal,
      },
    };
  }, [sales, movements, currentShift]);

  const handlePaidSale = async (id: string, paymentMethodId: number) => {
    try {
      const saleUpdate = await paidSale(id, paymentMethodId, currentShift!.id);

      if (!saleUpdate) return;

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
      maximumFractionDigits: 0,
    }).format(amount);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="mb-2 animate-spin text-2xl">⏳</div>
          <p>Sincronizando caja...</p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                Ventas Totales
              </p>
              <p className="mt-1 text-2xl font-black text-gray-800">
                {formatMoney(stats.money.totalSales)}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-2 text-blue-500">💵</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider text-red-400 uppercase">
                Salidas de Caja
              </p>
              <p className="mt-1 text-2xl font-black text-red-600">
                - {formatMoney(stats.money.totalOut)}
              </p>
            </div>
            <div className="rounded-full bg-red-50 p-2 text-red-500">📉</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gray-900 p-5 text-white shadow-lg shadow-gray-200">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">
                Efectivo en Caja
              </p>
              <p className="mt-1 text-3xl font-black text-green-400">
                {formatMoney(stats.money.theoreticalCash)}
              </p>
            </div>
            <button
              onClick={() => setShowMovementModal(true)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500"
            >
              Registrar Gasto
            </button>
          </div>
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/5 blur-xl"></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col items-center rounded-lg border border-blue-100 bg-blue-50 py-2">
          <span className="text-xl font-bold text-blue-700">
            {stats.counts.paid}
          </span>
          <span className="text-[10px] font-bold text-blue-400 uppercase">
            Tickets Pagos
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-yellow-100 bg-yellow-50 py-2">
          <span className="text-xl font-bold text-yellow-700">
            {stats.counts.pending}
          </span>
          <span className="text-[10px] font-bold text-yellow-400 uppercase">
            Pendientes
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-purple-100 bg-purple-50 py-2">
          <span className="text-xl font-bold text-purple-700">
            {stats.counts.resellers}
          </span>
          <span className="text-[10px] font-bold text-purple-400 uppercase">
            Revendedores
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg border border-gray-100 bg-gray-50 py-2">
          <span className="text-xl font-bold text-gray-600">
            {stats.counts.final}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Consumidor Final
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h3 className="font-bold text-gray-700">Historial del Turno</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-white text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">Hora</th>
                  <th className="px-6 py-3 font-semibold">Ticket</th>
                  <th className="px-6 py-3 font-semibold">Detalle</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Método</th>
                  <th className="px-6 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.filter((s) => s.paymentStatus === "PAID").length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-400 italic"
                    >
                      La caja está abierta, pero aún no hay ventas cobradas.
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
                        <td className="px-6 py-3 font-mono text-gray-500">
                          {formatTime(sale.createdAt)}
                        </td>
                        <td className="px-6 py-3 font-bold text-gray-800">
                          #{sale.ticketCode}
                        </td>
                        <td className="px-6 py-3 font-bold text-gray-800">
                          {sale.items.map((item) => (
                            <span>
                              {item.product.name} x {item.quantity}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-3">
                          {sale.client ? (
                            <span className="font-medium text-gray-900">
                              {sale.client.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Consumidor Final
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                              isTransfer
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {sale.paymentMethods?.name || "Efectivo"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-gray-900">
                          {formatMoney(sale.totalAmount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="w-full lg:w-96">
          <div className="flex h-full flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-yellow-50 px-6 py-4">
              <h3 className="font-bold text-yellow-800">Pedidos Pendientes</h3>
              {stats.counts.pending > 0 && (
                <span className="rounded-full bg-yellow-200 px-2 py-1 text-xs font-bold text-yellow-800">
                  {stats.counts.pending}
                </span>
              )}
            </div>

            <div className="max-h-150 flex-1 space-y-4 overflow-y-auto bg-gray-50/50 p-4">
              {stats.counts.pending === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <span className="mb-2 text-4xl">✨</span>
                  <p>Todo al día</p>
                </div>
              )}

              {sales.map((sale) => {
                if (sale.paymentStatus !== "UNPAID") return null;
                return (
                  <PendingSaleCard
                    key={sale.id}
                    sale={sale}
                    paymentMethods={paymentMethods}
                    onPay={handlePaidSale}
                  />
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      {showMovementModal && <MovementModal onClose={handleMovementSaved} />}
    </div>
  );
}
