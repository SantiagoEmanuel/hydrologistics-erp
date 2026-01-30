import { useShiftStore } from "@/store/useShiftStore";
import { useState } from "react";

export default function CloseShiftModal({ onClose }: { onClose: () => void }) {
  const { currentShift, closeShift } = useShiftStore();
  const [countedAmount, setCountedAmount] = useState("");
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    setIsSubmitting(true);
    try {
      await closeShift(Number(countedAmount), observations);
      onClose();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <header className="bg-red-600 p-4 text-white">
          <h2 className="text-xl font-bold">Cerrar Caja</h2>
          <p className="text-sm text-red-100">
            Esta acción finalizará tu turno.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm text-gray-500">Operador Actual:</p>
            <p className="font-bold text-gray-800">
              {currentShift?.operatorName}
            </p>
            <p className="mt-1 text-sm text-gray-500">Fondo Inicial:</p>
            <p className="font-mono font-bold text-gray-800">
              ${currentShift?.initialAmount}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Dinero en Caja (Real)
            </label>
            <input
              type="number"
              required
              className="w-full rounded border border-gray-300 p-3 text-xl font-bold outline-none focus:ring-2 focus:ring-red-500"
              placeholder="$ 0.00"
              value={countedAmount}
              onChange={(e) => setCountedAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Cuenta todo el efectivo (incluyendo el cambio inicial).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Observaciones
            </label>
            <textarea
              className="w-full rounded border border-gray-300 p-2"
              rows={3}
              placeholder="Ej: Retiré $500 para comprar lavandina..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded border border-gray-300 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded bg-red-600 py-2 font-bold text-white shadow-md hover:bg-red-700"
            >
              {isSubmitting ? "Cerrando..." : "CONFIRMAR CIERRE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
