import { CreateRouteSchemeModal } from "@/components/CreateRouteScheme";
import {
  EditRouteSchemeModal,
  type Scheme,
} from "@/components/EditRouteScheme";
import { routeService } from "@/services/route.service";
import {
  CheckCircle2,
  Edit2,
  InfinityIcon,
  MoreVertical,
  Plus,
  Settings2,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface RenderSchema {
  id: number;
  name: string;
  isActive: boolean | null;
  tiers: {
    id: number;
    schemeId: number;
    productId: number;
    minVolume: number;
    maxVolume: number | null;
    renderPrice: number;
    product: {
      id: number;
      name: string;
      isActive: boolean | null;
      price: number;
      wholesalePrice: number | null;
      isRefill: boolean | null;
      stock: number;
      lastResetAt: Date | null;
      trackStock: boolean | null;
      dailyResetStock: number | null;
      isReturnable: boolean | null;
    };
  }[];
}

export default function RoutesManagement() {
  const [schemas, setSchemas] = useState<RenderSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<string | null>();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await routeService.getSchemas();
      setSchemas(response);
    } catch (error) {
      console.error("Error cargando esquemas:", error);
      toast.error("Error al cargar los esquemas de precios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-gray-900">
            <Settings2 className="h-7 w-7 text-blue-600" />
            Esquemas de Precios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de reglas de rendición y precios por volumen para las rutas.
          </p>
        </div>

        <button
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 sm:w-auto"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={18} /> Nuevo Esquema
        </button>
      </header>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="animate-pulse text-sm font-medium">
            Cargando esquemas...
          </p>
        </div>
      ) : schemas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Settings2 className="mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">
            No hay esquemas configurados.
          </p>
          <p className="text-sm text-gray-400">
            Crea el primer esquema para definir los precios de ruta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {schemas.map((schema) => (
            <article
              key={schema.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <header className="relative flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold tracking-wide text-gray-800 uppercase">
                    {schema.name}
                  </h2>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${
                      schema.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {schema.isActive ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {schema.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-medium text-gray-500">
                    ID: {schema.id}
                  </span>
                  <div className="relative">
                    <button
                      className="rounded-full p-1.5 transition-colors hover:bg-gray-200 hover:text-gray-700"
                      onClick={() => setShowMenu(schema.id.toString())}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {showMenu && showMenu === schema.id.toString() && (
                      <menu className="animate-in fade-in zoom-in-95 absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 size={16} /> Editar Datos
                        </button>
                        <button
                          onClick={() => {}}
                          className="flex w-full items-center gap-2 border-t border-gray-50 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </menu>
                    )}
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="border-b border-gray-100 px-5 py-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Producto
                      </th>
                      <th className="border-b border-gray-100 px-5 py-3 text-center text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Rango (Unidades)
                      </th>
                      <th className="border-b border-gray-100 px-5 py-3 text-right text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Precio Rendición
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {schema.tiers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-8 text-center text-sm text-gray-400 italic"
                        >
                          No hay reglas de precios definidas.
                        </td>
                      </tr>
                    ) : (
                      schema.tiers.map((tier) => (
                        <tr
                          key={tier.id}
                          className="transition-colors hover:bg-gray-50/50"
                        >
                          <td className="px-5 py-3 font-medium text-gray-800">
                            {tier.product.name}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1 font-mono text-xs font-bold text-gray-600">
                              <span>{tier.minVolume}</span>
                              <span className="text-gray-400">a</span>
                              <span>
                                {tier.maxVolume ?? (
                                  <InfinityIcon
                                    size={14}
                                    className="inline-block"
                                  />
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-base font-black text-blue-600">
                            {formatMoney(tier.renderPrice)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}

      {isCreating && (
        <CreateRouteSchemeModal
          onClose={() => {
            setIsCreating(false);
            setShowMenu(null);
          }}
          onSuccess={() => {}}
        />
      )}

      {isEditing && (
        <EditRouteSchemeModal
          onClose={() => {
            setIsEditing(false);
            setShowMenu(null);
          }}
          onSuccess={() => {}}
          scheme={
            schemas.filter(
              (s) => s.id.toString() === showMenu,
            )[0] as unknown as Scheme
          }
        />
      )}

      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
      )}
    </div>
  );
}
