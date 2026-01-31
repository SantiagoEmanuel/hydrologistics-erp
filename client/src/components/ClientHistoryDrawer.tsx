import { accountService } from "@/services/account.service";
import type { AccountTransaction, Debtor } from "@/types/account.types";
import { PDFDownloadLink } from "@react-pdf/renderer"; // <--- Importar el Link de descarga
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaymentReceiptData } from "./pdf/ClientPaymentRecipt";
import ClientPaymentReceipt from "./pdf/ClientPaymentRecipt";

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

  // Estados de Pago
  const [isPayMode, setIsPayMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // Estado para el Recibo PDF generado
  const [lastReceipt, setLastReceipt] = useState<PaymentReceiptData | null>(
    null,
  );

  useEffect(() => {
    if (client) {
      loadHistory();
      // Reseteamos estados al abrir un cliente nuevo
      setIsPayMode(false);
      setPaymentAmount("");
      setLastReceipt(null);
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

    // 1. Snapshot de la deuda actual antes de que se actualice
    const currentDebt = client.debt;
    const amountVal = Number(paymentAmount);

    setProcessing(true);
    try {
      await accountService.registerPayment(
        client.id,
        amountVal,
        paymentNote || "Pago a cuenta",
      );

      // 2. Generar datos para el Recibo PDF
      const receiptData: PaymentReceiptData = {
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        clientName: client.name,
        clientType: client.type,
        amount: amountVal,
        method: "Efectivo", // Aquí podrías agregar un selector de método si quisieras
        previousBalance: currentDebt,
        newBalance: currentDebt - amountVal,
        notes: paymentNote,
      };

      setLastReceipt(receiptData); // Guardamos el recibo para mostrar la descarga
      toast.success("Pago registrado correctamente");

      // 3. Limpieza y actualización
      setIsPayMode(false);
      setPaymentAmount("");
      setPaymentNote("");
      loadHistory(); // Recargar historial local
      onUpdate(); // Avisar al padre para que actualice el saldo en la lista
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
      {/* OVERLAY */}
      {client && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        />
      )}

      {/* DRAWER */}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md transform flex-col bg-white transition-transform duration-300 ease-in-out ${drawerClasses}`}
      >
        {client && (
          <>
            {/* HEADER */}
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

            {/* SECCIÓN DE COBRO / RECIBO */}
            <div className="border-b bg-gray-50 p-6">
              {lastReceipt ? (
                // --- MODO ÉXITO: MOSTRAR DESCARGA DE PDF ---
                <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <div className="mb-2 text-2xl">✅</div>
                  <h3 className="font-bold text-green-800">Pago Registrado</h3>
                  <p className="mb-4 text-sm text-green-700">
                    El saldo se actualizó correctamente.
                  </p>

                  <div className="flex flex-col gap-2">
                    <PDFDownloadLink
                      document={<ClientPaymentReceipt data={lastReceipt} />}
                      fileName={`Recibo_${client.name.replace(/\s+/g, "_")}_${lastReceipt.date.split("T")[0]}.pdf`}
                      className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      {({ loading }) =>
                        loading ? "Generando PDF..." : "📄 Descargar Recibo"
                      }
                    </PDFDownloadLink>

                    <button
                      onClick={() => setLastReceipt(null)}
                      className="text-xs text-gray-500 underline hover:text-gray-700"
                    >
                      Realizar otro pago
                    </button>
                  </div>
                </div>
              ) : (
                // --- MODO NORMAL: MOSTRAR SALDO Y BOTÓN PAGAR ---
                <>
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

                  {/* FORMULARIO DE PAGO */}
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
                          min="1"
                          step="0.01"
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
                          className="flex-1 rounded bg-green-600 font-bold text-white hover:bg-green-700"
                        >
                          {processing ? "..." : "CONFIRMAR"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {/* TIMELINE (HISTORIAL) */}
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
                              className={`font-bold ${
                                item.type === "PAYMENT"
                                  ? "text-green-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {item.type === "PAYMENT" ? "+" : "-"}{" "}
                              {formatMoney(item.amount)}
                            </p>
                            {item.type === "SALE" && item.status && (
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
