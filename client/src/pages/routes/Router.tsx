import CloseStockModal from "@/components/routes/CloseStockModal";
import CreateRouteModal from "@/components/routes/CreateRouteModal";
import { routeService } from "@/services/route.service";
import type { Route } from "@/types/route.types";
import { useEffect, useState } from "react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [selectedRouteToClose, setSelectedRouteToClose] =
    useState<Route | null>(null);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Control de Rutas</h1>
          <p className="text-gray-500">Tráfico, cargas y devoluciones</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 font-bold text-white shadow hover:bg-blue-700"
        >
          <span>🚚</span> NUEVA SALIDA
        </button>
      </header>

      <div className="grid gap-4">
        {loading && <p>Cargando rutas...</p>}

        {!loading && routes.length === 0 && (
          <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No hay rutas registradas.</p>
          </div>
        )}

        {routes.map((route) => {
          const isStockOpen = route.stockStatus === "OPEN";

          return (
            <div
              key={route.id}
              className={`rounded-lg border-l-4 bg-white shadow ${isStockOpen ? "border-green-500" : "border-gray-400"} flex items-center justify-between p-4 transition hover:shadow-md`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold text-white ${isStockOpen ? "bg-green-500" : "bg-gray-500"}`}
                  >
                    {isStockOpen ? "EN CALLE" : "EN PLANTA"}
                  </span>
                  <span className="font-mono text-sm text-gray-400">
                    {formatDate(route.date)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {route.driverName}
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-bold">Lleva:</span>{" "}
                  {route.items
                    .map((i) => `${i.initialLoad} ${i.product.name}`)
                    .join(", ")}
                </p>
              </div>

              <div>
                {isStockOpen ? (
                  <button
                    onClick={() => setSelectedRouteToClose(route)}
                    className="flex items-center gap-2 rounded border border-green-200 bg-green-100 px-4 py-2 font-bold text-green-700 hover:bg-green-200"
                  >
                    <span>📥</span> REGISTRAR LLEGADA
                  </button>
                ) : (
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase">
                      Estado Financiero
                    </p>
                    <p
                      className={`font-bold ${route.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}
                    >
                      {route.paymentStatus === "PAID"
                        ? "RENDIDO ($)"
                        : "PENDIENTE DE PAGO"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showCreate && (
        <CreateRouteModal
          onClose={() => setShowCreate(false)}
          onSuccess={loadRoutes}
        />
      )}

      {selectedRouteToClose && (
        <CloseStockModal
          route={selectedRouteToClose}
          onClose={() => setSelectedRouteToClose(null)}
          onSuccess={() => {
            setSelectedRouteToClose(null);
            loadRoutes();
          }}
        />
      )}
    </div>
  );
}
