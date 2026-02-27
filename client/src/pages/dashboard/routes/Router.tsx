import EditRouteModal from "@/components/EditRouteModal";
import CloseRouteModal from "@/components/routes/CloseRouteModal";

import CreateRouteModal from "@/components/routes/CreateRouteModal";
import EditRouteLoadModal from "@/components/routes/EditRouteLoadModal";
import { useAuth } from "@/hook/useAuth";
import { routeService, type Route } from "@/services/route.service";
import {
  Calendar,
  CheckCircle,
  Edit,
  MoreVertical,
  Package,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [loadingLoadRoute, setLoadingLoadRoute] = useState<Route | null>(null);
  const [closingRoute, setClosingRoute] = useState<Route | null>(null);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error) {
      toast.error("Error cargando rutas");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutesByDriver = async (driverId: string) => {
    try {
      setLoading(true);
      const data = await routeService.getByDriverName(driverId);
      setRoutes(data);
    } catch (error) {
      toast.error("Error cargando rutas del conductor");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (user!.role === "DRIVER") {
      fetchRoutesByDriver(user!.fullName);
    } else {
      fetchRoutes();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar ruta? El stock volverá al depósito.")) return;
    try {
      await routeService.delete(id);
      toast.success("Ruta eliminada");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return DateTime.fromISO(dateString).toFormat("dd/MM HH:mm");
  };

  const permissions =
    user?.role === "ADMIN" ? ["EDIT", "CLOSE", "DELETE"] : ["EDIT", "CLOSE"];

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between max-md:flex-col max-md:gap-4">
        <div className="w-full max-md:text-left">
          <h1 className="text-2xl font-bold text-gray-800">
            Logística y Reparto
          </h1>
          <p className="text-sm text-gray-500">
            Administración de rutas activas e historial
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex w-50 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 max-md:w-full max-md:justify-center"
        >
          <Plus size={20} /> Nueva Salida
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Truck className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">
            No hay viajes registrados.
          </p>
          {permissions.includes("EDIT") && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 text-sm font-bold text-blue-600 hover:underline"
            >
              {user?.role === "DRIVER"
                ? `Crea tu primer viaje ${user.fullName}`
                : "Crear el primer viaje"}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <div
              key={route.id}
              className="relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between rounded-t-2xl border-b border-gray-100 bg-gray-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${route.stockStatus === "CLOSED" ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-600"}`}
                  >
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg leading-tight font-bold text-gray-800">
                      {route.driverName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          route.stockStatus === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : route.paymentStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {route.stockStatus === "OPEN"
                          ? "En curso"
                          : route.paymentStatus === "PENDING"
                            ? "Pendiente de pago"
                            : "Rendido"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                        <Calendar size={10} />
                        {formatDate(route.date)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpenId(menuOpenId === route.id ? null : route.id)
                    }
                    className="rounded-full p-1 transition-colors hover:bg-gray-200"
                  >
                    <MoreVertical size={20} className="text-gray-400" />
                  </button>

                  {menuOpenId === route.id && (
                    <div className="animate-in fade-in zoom-in-95 absolute right-0 z-20 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                      {route.stockStatus !== "CLOSED" && (
                        <button
                          onClick={() => {
                            setLoadingLoadRoute(route);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-3 text-left text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                          <Package size={16} /> Gestionar Carga
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingRoute(route);
                          setMenuOpenId(null);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={16} /> Editar Datos
                      </button>

                      {route.stockStatus !== "CLOSED" &&
                        permissions.includes("CLOSE") && (
                          <button
                            onClick={() => {
                              setClosingRoute(route);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle size={16} /> Finalizar salida
                          </button>
                        )}

                      {permissions.includes("DELETE") && (
                        <button
                          onClick={() => {
                            handleDelete(route.id);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 border-t border-gray-50 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Eliminar el registro
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col p-5">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                    <Package size={14} className="shrink-0" />
                    <span className="font-medium text-gray-500">Carga:</span>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1 font-bold text-gray-900">
                      {route.items.map((item) =>
                        item.initialLoad > 0 ? (
                          <li key={item.id} className="whitespace-nowrap">
                            {item.initialLoad - item.returnedLoad}{" "}
                            {item.product.name}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                  {route.observations && (
                    <p className="line-clamp-2 px-1 text-xs text-gray-400 italic">
                      "{route.observations}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (user?.role === "ADMIN") {
                      if (route.stockStatus === "CLOSED") {
                        toast.info("Ruta finalizada. Solo lectura.");
                      } else {
                        setLoadingLoadRoute(route);
                      }
                    } else {
                      if (route.stockStatus === "CLOSED") {
                        toast.info("Ruta finalizada");
                      } else {
                        setClosingRoute(route);
                      }
                    }
                  }}
                  className={`block w-full rounded-xl border py-2.5 text-center font-bold transition-all active:scale-[0.98] ${
                    route.stockStatus === "CLOSED"
                      ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {route.stockStatus === "CLOSED"
                    ? "Salida Cerrada"
                    : user?.role === "DRIVER"
                      ? "Finalizar Salida"
                      : "Gestionar Carga / Detalles"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreating && (
        <CreateRouteModal
          onClose={() => setIsCreating(false)}
          onSuccess={fetchData}
        />
      )}

      {editingRoute && (
        <EditRouteModal
          route={editingRoute}
          onClose={() => setEditingRoute(null)}
          onSuccess={() => {
            setEditingRoute(null);
            fetchData();
          }}
        />
      )}

      {loadingLoadRoute && (
        <EditRouteLoadModal
          route={loadingLoadRoute}
          onClose={() => setLoadingLoadRoute(null)}
          onSuccess={() => {
            setLoadingLoadRoute(null);
            fetchData();
          }}
        />
      )}

      {closingRoute && (
        <CloseRouteModal
          route={closingRoute}
          onClose={() => setClosingRoute(null)}
          onSuccess={() => {
            setClosingRoute(null);
            fetchData();
          }}
        />
      )}

      {menuOpenId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpenId(null)}
        />
      )}
    </div>
  );
}
