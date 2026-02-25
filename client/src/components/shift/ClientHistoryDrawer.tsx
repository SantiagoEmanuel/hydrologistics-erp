import { accountService } from "@/services/account.service";
import { saleService } from "@/services/sale.service";
import type { AccountTransaction, Debtor } from "@/types/account.types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaymentReceiptData } from "../pdf/ClientPaymentRecipt";
import ClientPaymentReceipt from "../pdf/ClientPaymentRecipt";

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
  const [lastReceipt, setLastReceipt] = useState<PaymentReceiptData | null>(
    null,
  );
  const [receiptMethod, setReceiptMethod] = useState<string>("Efectivo");
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; name: string; isActive: boolean }[]
  >([]);

  const getPaymentMethod = async () => {
    const methods = await saleService.getPaymentMethods();

    setPaymentMethods(methods);
  };

  useEffect(() => {
    if (client) {
      loadHistory();

      setIsPayMode(false);
      setPaymentAmount("");
      setPaymentNote("");
      setLastReceipt(null);
    }
    getPaymentMethod();
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

    const amountVal = Number(paymentAmount);
    setProcessing(true);

    try {
      await accountService.registerPayment(
        client.id,
        amountVal,
        paymentNote || "Pago a cuenta",
      );

      const receiptData: PaymentReceiptData = {
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        clientName: client.name,
        clientType: client.type,
        amount: amountVal,
        method: receiptMethod ?? "Efectivo",
        previousBalance: client.debt,
        newBalance: client.debt - amountVal,
        notes: paymentNote,
      };

      setLastReceipt(receiptData);
      toast.success("Pago registrado correctamente");

      loadHistory();
      onUpdate();
      setIsPayMode(false);
      setPaymentAmount("");
      setPaymentNote("");
    } catch (error: any) {
      toast.error("Error al registrar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      time: d.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const drawerClasses = client ? "translate-x-0" : "translate-x-full";

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
          client ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 md:max-w-md ${drawerClasses}`}
      >
        {client && (
          <>
            <header className="flex items-center justify-between border-b border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 md:hidden">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h2 className="text-lg leading-tight font-bold text-gray-900">
                    Cliente {client.name}
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {client.type}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="hidden p-2 md:block">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="bg-blue-600 p-6 text-white shadow-inner">
              <div className="mb-4 flex items-start justify-between">
                <p className="mb-2 text-xs font-bold tracking-wider text-blue-100 uppercase">
                  Deuda Pendiente
                </p>
                <div className="text-right">
                  <p className="text-xs text-blue-200">Saldo Monetario</p>
                  <p className="font-mono text-2xl font-bold">
                    $ {client.debt.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {client.productsOwed.length > 0 ? (
                  client.productsOwed.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-500/40 px-3 py-1.5 backdrop-blur-sm"
                    >
                      <span className="text-xl font-bold">{p.quantity}</span>
                      <span className="text-sm font-medium opacity-90">
                        {p.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-blue-200 italic">
                    Sin productos pendientes.
                  </span>
                )}
              </div>
            </div>

            <div className="border-b border-gray-200 bg-gray-100 p-4">
              {lastReceipt ? (
                <div className="animate-in zoom-in-95 rounded-xl border border-green-200 bg-green-50 p-4 text-center duration-300">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-green-800">
                    ¡Pago Registrado!
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    <PDFDownloadLink
                      document={<ClientPaymentReceipt data={lastReceipt} />}
                      fileName={`Recibo_${lastReceipt.receiptNumber}.pdf`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white shadow-sm hover:bg-blue-700"
                    >
                      {({ loading }) =>
                        loading ? "Generando..." : "Descargar Comprobante"
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
              ) : isPayMode ? (
                <form
                  onSubmit={handlePayment}
                  className="animate-in slide-in-from-top-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold text-gray-700">
                      <Banknote className="h-4 w-4 text-green-600" /> Nuevo
                      Ingreso
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsPayMode(false)}
                      className="text-gray-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Monto ($)
                    </label>
                    <input
                      autoFocus
                      type="number"
                      required
                      min="1"
                      placeholder="0"
                      className="w-full border-b-2 border-green-500 py-1 text-3xl font-bold text-gray-800 placeholder:text-gray-200 focus:outline-none"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">
                      Método de Pago
                    </label>
                    <select
                      className="w-full border-b border-gray-200 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={receiptMethod}
                      onChange={(e) => setReceiptMethod(e.target.value)}
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.name}>
                          {method.name} {method.isActive ? "" : "(Inactivo)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Nota (Opcional)"
                      className="w-full border-b border-gray-200 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPayMode(false)}
                      className="flex-1 rounded-lg bg-gray-50 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-bold text-white shadow-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? "..." : "CONFIRMAR"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsPayMode(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-green-500 bg-white py-3 font-bold text-green-600 shadow-sm transition-all hover:bg-green-50 active:scale-95"
                >
                  <Banknote className="h-5 w-5" /> INGRESAR PAGO
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <CalendarDays className="h-4 w-4" /> Movimientos
              </h3>

              <div className="space-y-4">
                {!loading &&
                  history.map((tx) => {
                    const dt = formatDate(tx.date);
                    const isPayment = tx.type === "PAYMENT";
                    const isDriver = !!tx.driverName;

                    return (
                      <div key={tx.id} className="relative flex gap-3">
                        <div
                          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm ${
                            isPayment
                              ? "border-green-200 bg-green-100 text-green-600"
                              : isDriver
                                ? "border-gray-200 bg-white text-blue-600"
                                : "border-purple-200 bg-purple-100 text-purple-600"
                          }`}
                        >
                          {isPayment ? (
                            <span>$</span>
                          ) : isDriver ? (
                            <Truck className="h-4 w-4" />
                          ) : (
                            <Store className="h-4 w-4" />
                          )}
                        </div>

                        <div className="flex-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <p className="mb-0.5 text-xs font-bold text-gray-400 uppercase">
                                {isPayment
                                  ? "Cobranza"
                                  : isDriver
                                    ? "Entrega Reparto"
                                    : "Retiro en Planta"}
                              </p>
                              <p className="text-sm font-bold text-gray-800">
                                {isDriver
                                  ? tx.driverName
                                  : isPayment
                                    ? "Pago en Caja"
                                    : "Mostrador"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">{dt.date}</p>
                              <p className="text-[10px] text-gray-300">
                                {dt.time}
                              </p>
                            </div>
                          </div>

                          {!isPayment && tx.items && tx.items.length > 0 ? (
                            <div className="mt-2 space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-2">
                              {tx.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-gray-600">
                                    {item.productName}
                                  </span>
                                  <span className="rounded border border-gray-200 bg-white px-2 py-0.5 font-bold text-gray-900 shadow-sm">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : isPayment ? (
                            <div className="mt-1 text-lg font-bold text-green-600">
                              + $ {tx.amount.toLocaleString("es-AR")}
                            </div>
                          ) : null}

                          {!isPayment && tx.status === "UNPAID" && (
                            <div className="mt-2 flex justify-end">
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                IMPAGO
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
