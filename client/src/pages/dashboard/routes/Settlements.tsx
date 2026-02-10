import SettlementDocument from "@/components/pdf/SettlementDocument";
import { routeService, type SettlementPreview } from "@/services/route.service";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useState } from "react";
import { toast } from "sonner";

export default function Settlements() {
  const [driverName, setDriverName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para modales
  const [isConfirming, setIsConfirming] = useState(false); // Nuevo: Modal de confirmación previa
  const [lastSettlement, setLastSettlement] =
    useState<SettlementPreview | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName) return;

    setLoading(true);
    setPreview(null);
    try {
      const data = await routeService.previewSettlement(driverName, date);
      setPreview(data);
    } catch (error: any) {
      toast.error(error.message || "Error al buscar rendición");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!preview) return;
    setLoading(true);

    try {
      await routeService.confirmSettlement(
        preview.driverName,
        preview.date,
        preview.totalToPay,
      );

      // Cerrar modal de confirmación y abrir el de éxito
      setIsConfirming(false);
      setShowSuccessModal(true);
      setLastSettlement(preview);
      setPreview(null); // Limpiar pantalla de fondo
      setDriverName("");

      toast.success("¡Rendición procesada correctamente!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(val);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* HEADER */}
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Rendición de Rutas
          </h1>
          <p className="text-gray-500">
            Administración y cierre de caja de choferes
          </p>
        </div>
      </header>

      {/* SEARCH BAR */}
      <section className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
              Chofer
            </label>
            <input
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Ej: José Castillo"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
              Fecha
            </label>
            <input
              type="date"
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex items-end md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95 disabled:bg-gray-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                  ></svg>{" "}
                  Buscando...
                </span>
              ) : (
                "🔍 CALCULAR"
              )}
            </button>
          </div>
        </form>
      </section>

      {/* PREVIEW SECTION */}
      {preview && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
          {/* 1. RESUMEN FINANCIERO (TICKET) */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {/* Header del Ticket */}
            <div className="flex flex-col justify-between border-b bg-gray-50 p-6 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pre-Liquidación
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                    {preview.routesIncluded} Viajes
                  </span>
                  <span>•</span>
                  <span>{new Date(preview.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 text-right md:mt-0">
                <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                  Total a Recibir (Efectivo)
                </p>
                <p className="font-mono text-4xl font-extrabold text-green-600">
                  {formatMoney(preview.totalToPay)}
                </p>
              </div>
            </div>

            {/* Tabla Principal */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-white text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Producto</th>
                    <th className="px-6 py-4 text-center font-semibold">
                      Total Vendido
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-orange-600">
                      Boletas
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">
                      Neto Efectivo
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-blue-600">
                      Bonificación
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-blue-600">
                      Ganancia por boletas
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.summary.map((item, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.totalSold}
                      </td>
                      <td className="bg-orange-50/50 px-6 py-4 text-center font-bold text-orange-600">
                        {item.credits > 0 ? item.credits : "-"}
                      </td>
                      <td className="bg-green-50/30 px-6 py-4 text-center font-bold text-gray-900">
                        {item.cashUnits}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-blue-600">
                        {item.bonuses > 0
                          ? `- ${formatMoney(item.bonuses)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-blue-600">
                        {item.voucherCompensation > 0
                          ? `- ${formatMoney(item.voucherCompensation)}`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatMoney(item.finalDebt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-4 border-t bg-gray-50 p-6">
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg px-6 py-2 font-bold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsConfirming(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 hover:shadow-xl active:scale-95"
              >
                <span>✅</span> CONFIRMAR RENDICIÓN
              </button>
            </div>
          </section>

          {/* 2. DETALLE DE VIAJES (AUDITORÍA) */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-700">
              <span className="text-xl">🚛</span> Auditoría de Viajes
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {preview.routeDetails?.map((route, idx: number) => (
                <article
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <header className="mb-3 flex items-center justify-between border-b pb-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">
                      Viaje #{idx + 1}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {route.closedAt ? formatTime(route.closedAt) : "--:--"}
                    </span>
                  </header>

                  <div className="space-y-3">
                    {route.items.map((item, i: number) => (
                      <div key={i} className="text-sm">
                        <div className="flex justify-between font-medium text-gray-900">
                          <span>{item.productName}</span>
                          <span>{item.soldCount} Vendidos</span>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>
                            Carga: <b>{item.initialLoad}</b> / Volvió:{" "}
                            <b>{item.returnedLoad}</b>
                          </span>
                          {item.creditCount > 0 && (
                            <span className="font-bold text-orange-600">
                              (Fiado: {item.creditCount})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN --- */}
      {isConfirming && preview && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-green-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                💸
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Confirmar Ingreso
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Estás a punto de registrar la rendición de{" "}
                <span className="font-bold text-gray-900">
                  {preview.driverName}
                </span>
                .
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase">
                  Monto a ingresar a caja
                </p>
                <p className="font-mono text-3xl font-black text-green-600">
                  {formatMoney(preview.totalToPay)}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-3 font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-600 py-3 font-bold text-white shadow-lg hover:bg-green-700"
                >
                  {loading ? "Procesando..." : "CONFIRMAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ÉXITO --- */}
      {showSuccessModal && lastSettlement && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600 shadow-inner">
              ✅
            </div>
            <h2 className="mb-2 text-2xl font-black text-gray-800">
              ¡Excelente!
            </h2>
            <p className="mb-8 text-gray-500">
              La rendición se guardó correctamente y el dinero ya está en caja.
            </p>

            <div className="flex flex-col gap-3">
              <PDFDownloadLink
                document={
                  <SettlementDocument
                    data={lastSettlement}
                    receiptNumber={`REC-${Date.now().toString().slice(-6)}`}
                  />
                }
                fileName={`Rendicion_${lastSettlement.driverName}_${lastSettlement.date}.pdf`}
                className="flex items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
              >
                {({ loading }) =>
                  loading ? (
                    "Generando PDF..."
                  ) : (
                    <>
                      <span>📄</span> Descargar Comprobante
                    </>
                  )
                }
              </PDFDownloadLink>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola ${lastSettlement.driverName}, rendición aceptada por $${lastSettlement.totalToPay}. Fecha: ${lastSettlement.date}.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-xl bg-green-500 py-4 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-600 active:scale-95"
              >
                <span>📱</span> Enviar por WhatsApp
              </a>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                }}
                className="mt-2 rounded-xl py-3 font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
