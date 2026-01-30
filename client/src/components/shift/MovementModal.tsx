import { shiftService } from "@/services/shift.service";
import { useState } from "react";
import { toast } from "sonner";

export default function MovementModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("OUT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await shiftService.addMovement({
        amount: Number(amount),
        description,
        type,
      });
      toast.success("Movimiento registrado");
      onClose();
    } catch (error) {
      console.error({ error });
      toast.error("Error al registrar");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <header
          className={`p-4 text-white ${type === "OUT" ? "bg-red-600" : "bg-green-600"}`}
        >
          <h2 className="text-xl font-bold">
            {type === "OUT"
              ? "Registrar Gasto / Retiro"
              : "Registrar Ingreso Extra"}
          </h2>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex rounded bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setType("OUT")}
              className={`flex-1 rounded py-1 text-sm font-bold transition ${type === "OUT" ? "bg-white text-red-600 shadow" : "text-gray-500"}`}
            >
              SALIDA (Gasto)
            </button>
            <button
              type="button"
              onClick={() => setType("IN")}
              className={`flex-1 rounded py-1 text-sm font-bold transition ${type === "IN" ? "bg-white text-green-600 shadow" : "text-gray-500"}`}
            >
              ENTRADA (Cambio)
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">Monto</label>
            <input
              type="number"
              required
              className="w-full rounded border p-2 text-xl font-bold"
              placeholder="$ 0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Motivo / Descripción
            </label>
            <textarea
              required
              rows={2}
              className="w-full rounded border p-2"
              placeholder={
                type === "OUT"
                  ? "Ej: Repuesto Canilla, Adelanto Pedro..."
                  : "Ej: Ingreso cambio chico..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border py-2 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 rounded py-2 font-bold text-white ${type === "OUT" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
