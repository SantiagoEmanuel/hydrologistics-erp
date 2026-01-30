import { accountService } from "@/services/account.service";
import type { AccountTransaction, Debtor } from "@/types/account.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  client: Debtor | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ClientHistoryDrawer({
  client,
  onClose,
  onUpdate,
}: Props) {
  const [history, setHistory] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [isPayMode, setIsPayMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (client) {
      loadHistory();
      setIsPayMode(false);
      setPaymentAmount("");
    }
  }, [client]);

  const loadHistory = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const data = await accountService.getHistory(client.id);
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !paymentAmount) return;

    setProcessing(true);
    try {
      await accountService.registerPayment(
        client.id,
        Number(paymentAmount),
        paymentNote,
      );
      toast.success("Pago registrado correctamente");
      setIsPayMode(false);
      setPaymentAmount("");
      setPaymentNote("");
      loadHistory();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const drawerClasses = client
    ? "translate-x-0 shadow-2xl"
    : "translate-x-full shadow-none";

  return (
    <>
      {client && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md transform flex-col bg-white transition-transform duration-300 ease-in-out ${drawerClasses}`}
      >
        {client && (
          <>
            <header className="flex items-start justify-between bg-gray-900 p-6 text-white">
              <div>
                <h2 className="text-xl font-bold">{client.name}</h2>
                <p className="text-sm text-gray-400">{client.type}</p>
              </div>
              <button
                onClick={onClose}
                className="text-2xl text-gray-400 hover:text-white"
              >
                ×
              </button>
            </header>

            <div className="border-b bg-gray-50 p-6">
              <p className="mb-1 text-xs font-bold text-gray-500 uppercase">
                Saldo Deudor Actual
              </p>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-red-600">
                  {formatMoney(client.debt)}
                </p>

                {!isPayMode && (
                  <button
                    onClick={() => setIsPayMode(true)}
                    className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 font-bold text-white shadow hover:bg-green-700"
                  >
                    <span>💸</span> REGISTRAR PAGO
                  </button>
                )}
              </div>

              {isPayMode && (
                <form
                  onSubmit={handlePayment}
                  className="animate-in fade-in slide-in-from-top-2 mt-4 rounded border border-green-200 bg-white p-4 shadow-sm"
                >
                  <h3 className="mb-2 text-sm font-bold text-green-800">
                    Nuevo Ingreso
                  </h3>
                  <div className="mb-3">
                    <label className="text-xs font-bold text-gray-500">
                      Monto a cobrar
                    </label>
                    <input
                      autoFocus
                      type="number"
                      required
                      className="w-full rounded border border-green-300 p-2 text-xl font-bold outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="$ 0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs font-bold text-gray-500">
                      Notas (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded border p-2 text-sm"
                      placeholder="Ej: Transferencia, Pago parcial..."
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPayMode(false)}
                      className="flex-1 rounded py-2 text-sm font-bold text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 rounded bg-green-600 py-2 font-bold text-white hover:bg-green-700"
                    >
                      {processing ? "Procesando..." : "CONFIRMAR INGRESO"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <h3 className="mb-4 text-sm font-bold text-gray-500 uppercase">
                Movimientos Recientes
              </h3>

              {loading ? (
                <p className="text-center text-gray-400">
                  Cargando movimientos...
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          item.type === "PAYMENT"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.type === "PAYMENT" ? "💰" : "📦"}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-gray-800">
                              {item.type === "PAYMENT"
                                ? "Pago Recibido"
                                : "Compra / Fiado"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(item.date)}
                            </p>
                            {item.ticketCode && (
                              <span className="rounded bg-gray-200 px-1 text-xs">
                                #{item.ticketCode.slice(-6)}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold ${item.type === "PAYMENT" ? "text-green-600" : "text-gray-800"}`}
                            >
                              {item.type === "PAYMENT" ? "+" : "-"}{" "}
                              {formatMoney(item.amount)}
                            </p>
                            {item.type === "SALE" && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  item.status === "PAID"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "PARTIAL"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {item.status === "UNPAID"
                                  ? "IMPAGO"
                                  : item.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {history.length === 0 && (
                    <div className="py-10 text-center text-gray-400">
                      <p>No hay movimientos registrados.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
