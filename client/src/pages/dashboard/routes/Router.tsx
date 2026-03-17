import EditRouteModal from "@/components/EditRouteModal";
import CloseRouteModal from "@/components/routes/CloseRouteModal";
import CreateRouteModal from "@/components/routes/CreateRouteModal";
import EditRouteLoadModal from "@/components/routes/EditRouteLoadModal";
import { useAuth } from "@/hook/useAuth";
import { routeService, type Route } from "@/services/route.service";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  MoreVertical,
  Package,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
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
    return DateTime.fromISO(dateString).toFormat("HH:mm"); // Solo la hora, el día ya está en el grupo
  };

  // --- LÓGICA SENIOR: AGRUPACIÓN POR DÍA ---
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, Route[]> = {};
    const zone = "America/Argentina/Buenos_Aires";
    const today = DateTime.now().setZone(zone).toISODate();
    const yesterday = DateTime.now()
      .setZone(zone)
      .minus({ days: 1 })
      .toISODate();

    // 1. Agrupar
    routes.forEach((route) => {
      if (!route.date) return;
      const dateKey = DateTime.fromISO(route.date).setZone(zone).toISODate();
      if (!dateKey) return;

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(route);
    });

    // 2. Ordenar claves de más reciente a más antiguo y mapear
    return Object.keys(groups)
      .sort(
        (a, b) =>
          DateTime.fromISO(b).toMillis() - DateTime.fromISO(a).toMillis(),
      )
      .map((dateKey) => {
        let label = "";
        if (dateKey === today) {
          label = "Hoy";
        } else if (dateKey === yesterday) {
          label = "Ayer";
        } else {
          // Formato ej: "Lunes, 15 de marzo"
          const dt = DateTime.fromISO(dateKey).setZone(zone).setLocale("es");
          label = dt.toFormat("EEEE, d 'de' MMMM");
          label = label.charAt(0).toUpperCase() + label.slice(1); // Capitalizar
        }

        return {
          dateKey,
          label,
          routes: groups[dateKey],
        };
      });
  }, [routes]);

  const permissions =
    user?.role === "ADMIN" ? ["EDIT", "CLOSE", "DELETE"] : ["EDIT", "CLOSE"];

  return (
    <div className="mx-auto max-w-7xl p-6 pb-24">
      <div className="mb-8 flex items-center justify-between max-md:flex-col max-md:gap-4">
        <div className="w-full max-md:text-left">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Logística y Reparto
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Administración de rutas activas e historial de viajes
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex w-50 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 max-md:w-full max-md:justify-center"
        >
          <Plus size={20} /> Nueva Salida
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="animate-pulse text-sm font-bold text-gray-400">
            Cargando viajes...
          </p>
        </div>
      ) : routes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Truck className="mb-4 h-16 w-16 text-gray-300" />
          <p className="text-lg font-bold text-gray-600">
            No hay viajes registrados.
          </p>
          <p className="text-sm text-gray-400">
            Las salidas de los choferes aparecerán aquí.
          </p>
          {permissions.includes("EDIT") && (
            <button
              onClick={() => setIsCreating(true)}
              className="mt-6 rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-bold text-blue-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              {user?.role === "DRIVER"
                ? `Crear mi primer viaje`
                : "Crear el primer viaje"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* --- RENDERIZADO POR GRUPOS --- */}
          {groupedRoutes.map((group) => (
            <section
              key={group.dateKey}
              className="animate-in fade-in slide-in-from-bottom-4"
            >
              {/* HEADER DEL DÍA */}
              <header className="mb-5 flex items-center gap-3 border-b border-gray-200 pb-3">
                <Calendar className="text-blue-600" size={24} />
                <h2 className="text-xl font-black text-gray-800">
                  {group.label}
                </h2>
                <span className="ml-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {group.routes.length}{" "}
                  {group.routes.length === 1 ? "viaje" : "viajes"}
                </span>
              </header>

              {/* GRID DE TARJETAS PARA ESE DÍA */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.routes.map((route) => (
                  <div
                    key={route.id}
                    className="relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between rounded-t-2xl border-b border-gray-100 bg-gray-50/50 p-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-xl p-2.5 ${route.stockStatus === "CLOSED" ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-blue-600 shadow-inner"}`}
                        >
                          <Truck size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg leading-tight font-black tracking-tight text-gray-800 uppercase">
                            {route.driverName}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
                                  ? "Pendiente Cobro"
                                  : "Rendido"}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                              <Clock size={12} />
                              {formatDate(route.date)} hs
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === route.id ? null : route.id,
                            )
                          }
                          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {menuOpenId === route.id && (
                          <menu className="animate-in fade-in zoom-in-95 absolute right-0 z-20 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                            {route.stockStatus !== "CLOSED" && (
                              <button
                                onClick={() => {
                                  setLoadingLoadRoute(route);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 border-b border-gray-50 px-4 py-3 text-left text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
                              >
                                <Package size={16} /> Gestionar Carga
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingRoute(route);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-green-600 transition-colors hover:bg-green-50"
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
                                className="flex w-full items-center gap-2 border-t border-gray-50 px-4 py-3 text-left text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                              >
                                <Trash2 size={16} /> Eliminar Registro
                              </button>
                            )}
                          </menu>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col p-5">
                      <div className="mb-5 space-y-3">
                        <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                          <Package
                            size={16}
                            className="mt-0.5 shrink-0 text-gray-400"
                          />
                          <div>
                            <span className="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                              Carga Actual
                            </span>
                            <ul className="flex flex-wrap gap-x-3 gap-y-1 font-bold text-gray-800">
                              {route.items.map((item) =>
                                item.initialLoad > 0 ? (
                                  <li
                                    key={item.id}
                                    className="whitespace-nowrap"
                                  >
                                    {item.initialLoad - item.returnedLoad}{" "}
                                    {item.product.name}
                                  </li>
                                ) : null,
                              )}
                            </ul>
                          </div>
                        </div>
                        {route.observations && (
                          <p className="line-clamp-2 border-l-2 border-gray-200 px-1 pl-2 text-xs text-gray-500 italic">
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
                        className={`block w-full rounded-xl border py-3 text-center font-bold transition-all active:scale-[0.98] ${
                          route.stockStatus === "CLOSED"
                            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                            : "border-blue-200 bg-blue-50 text-blue-700 shadow-sm hover:border-blue-300 hover:bg-blue-100"
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
            </section>
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
