import { useShift } from "@/hook/useShift";
import { useState, type ReactNode } from "react";

export default function ShiftGuard({ children }: { children: ReactNode }) {
  const { currentShift, isShiftLoading, openShift } = useShift();

  const [amount, setAmount] = useState("");
  const [operator, setOperator] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isShiftLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">
        Cargando sistema...
      </div>
    );
  }

  if (currentShift) {
    return <>{children}</>;
  }

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await openShift(Number(amount), operator || "Cajero");
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-900 p-4 text-white">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-slate-900 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Caja Cerrada</h1>
          <p className="text-slate-500">
            Inicie una sesión para comenzar a vender
          </p>
        </div>

        <form onSubmit={handleOpen} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Operador</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 p-3"
              placeholder="Tu nombre (ej: Juan)"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Fondo Inicial ($)
            </label>
            <input
              type="number"
              className="w-full rounded border border-gray-300 p-3 font-mono text-2xl"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Dinero en cambio disponible en el cajón.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full rounded bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Abriendo..." : "ABRIR CAJA"}
          </button>
        </form>
      </div>
    </div>
  );
}
