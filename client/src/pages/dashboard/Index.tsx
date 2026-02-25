import EditSaleModal from "@/components/EditSalemodal";
import PendingSaleCard from "@/components/PendingSaleCard";
import CloseShiftModal from "@/components/shift/CloseShiftModal";
import MovementModal from "@/components/shift/MovementModal";
import { useAuth } from "@/hook/useAuth";
import { shiftService } from "@/services/shift.service";
import { useCartStore } from "@/store/useCartStore";
import { useShiftStore } from "@/store/useShiftStore";
import type { Sale } from "@/types/sale.types";
import type { CashMovement } from "@/types/shift.types";
import {
  ArrowDown,
  DollarSign,
  Edit3,
  InfoIcon,
  Lock,
  Menu,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const { currentShift } = useShiftStore();
  const { paidSale, paymentMethods, getAllPayments, deleteSale } =
    useCartStore();

  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const canEdit = useMemo(() => {
    return ["ADMIN", "ENCARGADO"].includes(user?.role || "");
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const shiftData = await shiftService.getCurrent();

      if (shiftData.status === "OPEN" && shiftData.shift) {
        const uniqueSales = Array.from(
          new Map(
            (shiftData.shift.sales || []).map((sale: Sale) => [sale.id, sale]),
          ).values(),
        );

        uniqueSales.sort(
          (a, b) =>
            DateTime.fromISO(b.createdAt).toMillis() -
            DateTime.fromISO(a.createdAt).toMillis(),
        );

        setSales(uniqueSales);
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
    const paidSales = sales.filter(
      (s) => s.paymentStatus === "PAID" || s.paymentStatus === "BOLETA",
    );
    const pendingSales = sales.filter((s) => s.paymentStatus === "UNPAID");

    const totalSalesMoney = paidSales
      .filter((s) => {
        const method = s.paymentMethods?.name?.toUpperCase();
        return (
          !method ||
          method.includes("EFECTIVO") ||
          method.includes("DONACION") ||
          method === "CASH"
        );
      })
      .reduce((acc, s) => acc + s.totalAmount, 0);

    const totalOut = movements
      .filter((m) => m.type === "OUT")
      .reduce((acc, m) => acc + m.amount, 0);

    const totalIn = movements
      .filter((m) => m.type === "IN")
      .reduce((acc, m) => acc + m.amount, 0);

    const initial = currentShift?.initialAmount || 0;

    const theoreticalCash = initial + totalSalesMoney + totalIn - totalOut;

    const amount = { revendedor: 0, final: 0 };

    paidSales.forEach((sale) => {
      if (sale.paymentMethods?.name?.toUpperCase() !== "EFECTIVO") return;

      const itemCount = sale.items.reduce(
        (prev, curr) => curr.quantity + prev,
        0,
      );

      if (sale.client?.type == "REVENDEDOR") {
        amount.revendedor += itemCount;
      } else {
        amount.final += itemCount;
      }
    });

    return {
      money: { totalSales: totalSalesMoney, totalOut, theoreticalCash },
      counts: {
        paid: paidSales.length,
        pending: pendingSales.length,
        resellers: amount.revendedor,
        final: amount.final,
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
      toast.success("Pedido cobrado");
    } catch (error) {
      console.error(error);
    }
  };

  const handleMovementSaved = () => {
    setShowMovementModal(false);
    loadDashboardData();
    toast.success("Movimiento registrado correctamente");
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatTime = (dateString: string) => {
    if (!dateString) return "--:--";
    return DateTime.fromISO(dateString).toFormat("HH:mm");
  };

  if (loading)
    return (
      <div className="flex h-[80vh] items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="animate-pulse text-sm font-medium">Sincronizando...</p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Panel de Control
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${currentShift ? "animate-pulse bg-green-500" : "bg-red-500"}`}
            />
            <p className="text-sm font-medium text-gray-500">
              {currentShift
                ? `Turno Abierto: ${formatTime(currentShift.openedAt)} hs`
                : "Caja Cerrada"}
            </p>
          </div>
        </div>

        {currentShift && (
          <button
            onClick={() => setShowCloseModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-gray-800 active:scale-95 sm:w-auto"
          >
            <Lock size={18} /> CERRAR CAJA
          </button>
        )}
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Ventas totales
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-gray-800">
                {formatMoney(stats.money.totalSales)}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                Gastos registrados
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-red-500">
                - {formatMoney(stats.money.totalOut)}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
              <ArrowDown size={24} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 text-white shadow-xl shadow-gray-200 sm:col-span-2 lg:col-span-1">
          <button
            className="absolute top-5.5 left-33 z-20 size-4 cursor-pointer rounded-full transition-colors hover:bg-gray-500"
            onClick={() => setShowAlert(!showAlert)}
          >
            <InfoIcon className="size-4 text-white" />
          </button>
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Efectivo total
                </p>
                <p className="mt-2 text-4xl font-black tracking-tight text-green-400">
                  {formatMoney(stats.money.theoreticalCash)}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
                <Wallet size={24} className="text-green-400" />
              </div>
            </div>

            <button
              onClick={() => setShowMovementModal(true)}
              className="mt-6 w-full rounded-lg border border-white/10 bg-white/10 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
            >
              + REGISTRAR GASTO / RETIRO
            </button>
          </div>
          {showAlert && (
            <div className="absolute top-8 left-38 z-20 max-w-47 rounded-xl rounded-tl-none bg-white p-2 font-medium">
              <p className="text-xs text-gray-500">
                El "Efectivo Total" es la suma de ventas y rendiciones
              </p>
            </div>
          )}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl"></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Tickets Pagos", val: stats.counts.paid, color: "blue" },
          { label: "Pendientes", val: stats.counts.pending, color: "yellow" },
          {
            label: "Revendedores",
            val: stats.counts.resellers,
            color: "purple",
          },
          { label: "Consumidor Final", val: stats.counts.final, color: "gray" },
        ].map((m, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center rounded-xl border p-3 bg-${m.color}-50 border-${m.color}-100`}
          >
            <span className={`text-2xl font-black text-${m.color}-700`}>
              {m.val}
            </span>
            <span
              className={`text-[10px] font-bold uppercase text-${m.color}-400 text-center`}
            >
              {m.label}
            </span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <DollarSign size={20} className="text-green-600" /> Historial de
            Ventas
          </h3>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* // Mobile view */}
            <div className="block divide-y divide-gray-100 md:hidden">
              {sales.filter(
                (s) =>
                  s.paymentStatus === "PAID" || s.paymentStatus === "BOLETA",
              ).length === 0 && (
                <p className="p-8 text-center text-sm text-gray-400">
                  Sin ventas registradas hoy.
                </p>
              )}
              {sales
                .filter(
                  (s) =>
                    s.paymentStatus === "PAID" || s.paymentStatus === "BOLETA",
                )
                .map((sale) => (
                  <div key={sale.id} className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="mb-0.5 block text-xs font-bold text-gray-400">
                          {formatTime(sale.createdAt)}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          #{sale.ticketCode}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-black text-gray-900">
                          {formatMoney(sale.totalAmount)}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${paymentStatusColor(
                            sale.paymentMethods.name,
                          )}`}
                        >
                          {sale.paymentMethods?.name || "Efectivo"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                      <p className="mb-1 font-bold text-gray-800">
                        {sale.client?.name || "Consumidor Final"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {sale.items.map((item) => (
                          <span
                            key={item.id}
                            className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs"
                          >
                            {item.quantity} x {item.product.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {canEdit && (
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 active:scale-95"
                        >
                          <Edit3 size={14} /> Editar
                        </button>
                        <button
                          onClick={() =>
                            confirm("¿Eliminar Venta?") &&
                            deleteSale(sale.id).then(() => loadDashboardData())
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 py-2 text-sm font-bold text-red-600 hover:bg-red-50 active:scale-95"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
            {/* // Desktop view */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                      Hora
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                      Ticket
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                      Detalle
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-xs font-bold tracking-wider uppercase">
                      Pago
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold tracking-wider uppercase">
                      Total
                    </th>
                    {canEdit && <th className="px-6 py-4"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.filter(
                    (s) =>
                      s.paymentStatus === "PAID" ||
                      s.paymentStatus === "BOLETA",
                  ).length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-gray-400 italic"
                      >
                        Sin ventas cobradas en este turno.
                      </td>
                    </tr>
                  ) : (
                    sales
                      .filter(
                        (s) =>
                          s.paymentStatus === "PAID" ||
                          s.paymentStatus === "BOLETA",
                      )
                      .map((sale) => (
                        <tr
                          key={sale.id}
                          className="transition-colors hover:bg-gray-50/80"
                        >
                          <td className="px-6 py-4 font-mono text-gray-500">
                            {formatTime(sale.createdAt)}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-800">
                            #{sale.ticketCode}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {sale.items.slice(0, 2).map((item) => (
                                <span
                                  key={item.id}
                                  className="text-xs text-gray-600"
                                >
                                  {item.quantity} x{" "}
                                  <span className="font-medium text-gray-800">
                                    {item.product.name}
                                  </span>
                                </span>
                              ))}
                              {sale.items.length > 2 && (
                                <span className="text-[10px] text-gray-400">
                                  +{sale.items.length - 2} más...
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {sale.client?.name || "Consumidor Final"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${paymentStatusColor(sale.paymentMethods.name)}`}
                            >
                              {sale.paymentMethods?.name || "Efectivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900">
                            {formatMoney(sale.totalAmount)}
                          </td>

                          {canEdit && (
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setEditingSale(sale)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  deleteSale(sale.id).then(() =>
                                    loadDashboardData(),
                                  )
                                }
                                className="ml-2 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="w-full md:mt-11 lg:w-96">
          <div className="sticky top-4 flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-yellow-100 bg-yellow-50 px-6 py-4">
              <h3 className="flex items-center gap-2 font-bold text-yellow-800">
                <Menu size={18} /> Pendientes
              </h3>
              {stats.counts.pending > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-200 text-xs font-bold text-yellow-800">
                  {stats.counts.pending}
                </span>
              )}
            </div>

            <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4">
              {stats.counts.pending === 0 && (
                <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                  <span className="mb-2 text-4xl opacity-50 grayscale">✨</span>
                  <p className="text-sm">No hay pedidos pendientes</p>
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
      {showCloseModal && (
        <CloseShiftModal
          onClose={() => setShowCloseModal(false)}
          onSuccess={() => {
            loadDashboardData();
            setShowCloseModal(false);
            window.location.reload();
          }}
        />
      )}
      {editingSale && canEdit && (
        <EditSaleModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onSuccess={() => {
            loadDashboardData();
            setEditingSale(null);
          }}
        />
      )}
      {showAlert && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowAlert(false)}
        ></div>
      )}
    </div>
  );
}

function paymentStatusColor(status: string) {
  switch (status) {
    case "EFECTIVO":
      return "bg-green-100 text-green-700";
    case "BOLETA":
      return "bg-blue-100 text-blue-700";
    case "DONACION":
      return "bg-yellow-100 text-yellow-700";
    case "TRANSFERENCIA":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }

  return "";
}
