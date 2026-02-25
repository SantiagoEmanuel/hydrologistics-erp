import CloseShiftDocument from "@/components/pdf/CloseShiftDocument";
import { shiftService } from "@/services/shift.service";
import { useShiftStore } from "@/store/useShiftStore";
import type { Sale } from "@/types/sale.types";
import type { CashMovement } from "@/types/shift.types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useState } from "react";
import { toast } from "sonner";

interface ShiftReportData {
  id: string;
  openedAt: string;
  closedAt?: string;
  operatorName: string;
  initialAmount: number;
  finalAmount?: number;
  sales: Sale[];
  movements: CashMovement[];
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseShiftModal({ onClose, onSuccess }: Props) {
  const { currentShift } = useShiftStore();

  const [step, setStep] = useState<"INPUT" | "SUCCESS">("INPUT");
  const [finalAmount, setFinalAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [observations, setObservations] = useState("");

  const [reportData, setReportData] = useState<ShiftReportData | null>(null);

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    setLoading(true);
    try {
      const response = await shiftService.closeShift({
        shiftId: currentShift.id,
        finalAmount: Number(finalAmount),
        observations,
      });

      setReportData(response);
      toast.success("Caja cerrada correctamente");
      setStep("SUCCESS");
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar caja");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const getSafeFileName = () => {
    if (!reportData || !reportData.id) return "Reporte_Caja.pdf";
    const shortId = reportData.id.slice(-6);
    const date = new Date().toISOString().split("T")[0];
    return `Cierre_Caja_${shortId}_${date}.pdf`;
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {step === "INPUT" && (
          <form onSubmit={handleCloseShift} className="p-6">
            <div className="mb-6 flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 p-3 text-2xl">🔒</div>
              <h2 className="text-xl font-bold">Cerrar Caja</h2>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Dinero Físico en Cajón (Arqueo)
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  autoFocus
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-2 border-red-100 py-2 pr-4 pl-8 text-lg font-bold focus:border-red-500 focus:outline-none"
                  placeholder="0.00"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Cuenta solo los billetes y monedas. No incluyas comprobantes.
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-bold text-gray-700">
                Observaciones (Opcional)
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                rows={2}
                placeholder="Ej: Faltan $50, sobraron monedas..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg py-3 font-bold text-gray-500 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !finalAmount}
                className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Cerrando..." : "CONFIRMAR CIERRE"}
              </button>
            </div>
          </form>
        )}

        {step === "SUCCESS" && reportData && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600 shadow-inner">
              ✅
            </div>
            <h2 className="mb-2 text-2xl font-black text-gray-800">
              ¡Turno Cerrado!
            </h2>
            <p className="mb-8 text-gray-500">
              El sistema ha procesado el cierre. Descarga el reporte para la
              auditoría física.
            </p>

            <div className="flex flex-col gap-3">
              <PDFDownloadLink
                document={<CloseShiftDocument data={reportData} />}
                fileName={getSafeFileName()}
                className="flex w-full transform items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-transform hover:bg-blue-700 active:scale-95"
              >
                {({ loading }) =>
                  loading ? "Generando PDF..." : "📄 DESCARGAR REPORTE"
                }
              </PDFDownloadLink>

              <button
                onClick={handleFinish}
                className="w-full py-3 font-medium text-gray-400 hover:text-gray-600"
              >
                Cerrar y Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
