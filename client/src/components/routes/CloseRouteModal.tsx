import { routeService } from "@/services/route.service";
import type { Route } from "@/types/route.types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  Minus,
  Package,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CloseRouteModal({
  route,
  onClose,
  onSuccess,
}: {
  route: Partial<Route>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [returns, setReturns] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasErrors = useMemo(() => {
    return route.items!.some((item) => {
      const val = returns[item.productId] || 0;
      return val > item.initialLoad || val < 0;
    });
  }, [route.items, returns]);

  const summary = useMemo(() => {
    let totalReturning = 0;
    let totalSold = 0;
    route.items!.forEach((item) => {
      const ret = returns[item.productId] || 0;
      totalReturning += ret;
      totalSold += item.initialLoad - ret;
    });
    return { totalReturning, totalSold };
  }, [route.items, returns]);

  const handleInputChange = (productId: number, value: string) => {
    const num = value === "" ? 0 : parseInt(value);
    if (!isNaN(num)) {
      setReturns((prev) => ({ ...prev, [productId]: num }));
    }
  };

  const handleIncrement = (productId: number, max: number) => {
    setReturns((prev) => {
      const current = prev[productId] || 0;
      if (current >= max) return prev;
      return { ...prev, [productId]: current + 1 };
    });
  };

  const handleDecrement = (productId: number) => {
    setReturns((prev) => {
      const current = prev[productId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [productId]: current - 1 };
    });
  };

  const setAllSold = () => {
    const newReturns: Record<number, number> = {};
    route.items!.forEach((i) => (newReturns[i.productId] = 0));
    setReturns(newReturns);
    toast.info("Se marcó todo como vendido (Llenos/Devueltos: 0)");
  };

  const setAllReturned = () => {
    const newReturns: Record<number, number> = {};
    route.items!.forEach((i) => (newReturns[i.productId] = i.initialLoad));
    setReturns(newReturns);
    toast.info("Se marcó todo como lleno/devuelto (Vendido: 0)");
  };

  const handleSubmit = async () => {
    if (hasErrors) {
      toast.error("Hay cantidades inválidas. Revisa los campos en rojo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsReturn = route.items!.map((item) => ({
        productId: item.productId,
        returnedQuantity: returns[item.productId] || 0,
      }));

      await routeService.closeStock(route.id!, { itemsReturn });

      toast.success("Stock actualizado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al cerrar ruta");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex flex-col gap-4 rounded-t-2xl border-b border-gray-100 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <RotateCcw className="text-blue-600" /> Finalizar salida
            </h2>
            <p className="text-sm text-gray-500">
              Chofer:{" "}
              <span className="font-medium text-gray-800">
                {route.driverName}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={setAllSold}
              className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700 shadow-sm transition-colors hover:bg-green-50"
            >
              Todo Vendido
            </button>
            <button
              onClick={setAllReturned}
              className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm transition-colors hover:bg-orange-50"
            >
              Nada Vendido
            </button>
            <button
              onClick={onClose}
              className="ml-2 rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
          <div className="space-y-3">
            {route.items!.map((item) => {
              const returnedVal = returns[item.productId] || 0;
              const difference = item.initialLoad - returnedVal;
              const isError = returnedVal > item.initialLoad || returnedVal < 0;

              return (
                <div
                  key={item.productId}
                  className={`flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center ${
                    isError
                      ? "border-red-300 ring-1 ring-red-100"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="line-clamp-1 font-bold text-gray-800">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                          Carga: <strong>{item.initialLoad}</strong>
                        </span>
                        {isError && (
                          <span className="flex items-center gap-1 font-bold text-red-500">
                            <AlertTriangle size={12} /> Excede carga registrada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="flex flex-col items-center">
                      <label className="mb-1 text-[10px] font-bold text-gray-400 uppercase">
                        Llenos/Devueltos
                      </label>
                      <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm">
                        <button
                          onClick={() => handleDecrement(item.productId)}
                          className="flex h-10 w-10 items-center justify-center rounded-l-xl border-r border-gray-100 text-gray-500 hover:bg-gray-50 active:bg-gray-100"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={item.initialLoad}
                          className={`h-10 w-16 text-center text-lg font-bold outline-none focus:bg-blue-50 ${isError ? "text-red-600" : "text-gray-800"}`}
                          value={
                            returns[item.productId] !== undefined
                              ? returns[item.productId]
                              : 0
                          }
                          onChange={(e) =>
                            handleInputChange(item.productId, e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                        />
                        <button
                          onClick={() =>
                            handleIncrement(item.productId, item.initialLoad)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-r-xl border-l border-gray-100 text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <ArrowRight className="hidden text-gray-300 sm:block" />

                    <div className="flex min-w-20 flex-col items-center rounded-lg bg-gray-50 p-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Vendido
                      </span>
                      <span
                        className={`text-xl font-black ${difference < 0 ? "text-red-500" : "text-blue-600"}`}
                      >
                        {difference}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between px-2">
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">
                  Total Lleno/Devuelto
                </span>
                <span className="font-bold text-gray-800">
                  {summary.totalReturning} un.
                </span>
              </div>
              <div className="flex flex-col border-l pl-4">
                <span className="text-xs text-gray-500">Total Vendido</span>
                <span className="font-bold text-blue-600">
                  {summary.totalSold} un.
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || hasErrors}
              className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 font-bold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                "Procesando..."
              ) : (
                <>
                  <CheckCheck size={18} /> Confirmar Registro
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
