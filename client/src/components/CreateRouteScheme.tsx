import { useProducts } from "@/hook/useProducts";
import { routeService } from "@/services/route.service";
import { InfinityIcon, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface TierLocal {
  id: string;
  productId: number | "";
  minVolume: number | "";
  maxVolume: number | "";
  renderPrice: number | "";
}

export function CreateRouteSchemeModal({ onClose, onSuccess }: Props) {
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [haveDiscount, setHaveDiscount] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tiers, setTiers] = useState<TierLocal[]>([]);

  const handleAddTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        minVolume: 1,
        maxVolume: "",
        renderPrice: "",
      },
    ]);
  };

  const handleRemoveTier = (id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTierChange = (id: string, field: keyof TierLocal, value: any) => {
    setTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)),
    );
  };

  const handleSave = async () => {
    if (!name.trim())
      return toast.error("El nombre del esquema es obligatorio.");
    if (tiers.length === 0)
      return toast.error("Debes agregar al menos un rango de precio.");

    for (const tier of tiers) {
      if (!tier.productId)
        return toast.error(
          "Todos los rangos deben tener un producto seleccionado.",
        );
      if (tier.minVolume === "" || Number(tier.minVolume) < 0)
        return toast.error("Revisa los volúmenes mínimos.");
      if (tier.renderPrice === "" || Number(tier.renderPrice) < 0)
        return toast.error("Los precios de rendición no pueden estar vacíos.");
      if (
        tier.maxVolume !== "" &&
        Number(tier.maxVolume) <= Number(tier.minVolume)
      ) {
        return toast.error("El volumen máximo debe ser mayor al mínimo.");
      }
    }

    setLoading(true);
    try {
      const payload = {
        name,
        isActive,
        haveDiscount,
        discount,
        tiers: tiers.map((t) => ({
          id: t.id,
          productId: Number(t.productId),
          minVolume: Number(t.minVolume),
          maxVolume: t.maxVolume === "" ? null : Number(t.maxVolume),
          renderPrice: Number(t.renderPrice),
        })),
      };

      await routeService.createSchema(payload);

      toast.success("Esquema creado correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el esquema");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-800">
              Nuevo Esquema de Precios
            </h2>
            <p className="text-sm text-gray-500">
              Configura reglas de rendición por volumen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-bold tracking-wide text-gray-700 uppercase">
                Nombre del Esquema
              </label>
              <input
                autoFocus
                type="text"
                placeholder="Ej: Zona Sur - Mayoristas"
                className="w-full rounded-xl border border-gray-300 p-3 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className="peer h-7 w-14 rounded-full bg-gray-200 peer-checked:bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                <span className="ml-3 text-sm font-bold text-gray-700 uppercase">
                  {isActive ? "Activo" : "Inactivo"}
                </span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-bold tracking-wide text-gray-700 uppercase">
                Descuento aplicable al esquema
              </label>
              <input
                disabled={!haveDiscount}
                type="number"
                name="discount"
                className="w-full rounded-xl border border-gray-300 p-3 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={discount}
                onChange={(e) => {
                  if (e.target.value.split("")[0] === "0") {
                    const arr = e.target.value.split("");
                    arr.shift();
                    setDiscount(Number(arr.toString().replaceAll(",", "")));
                    return;
                  } else {
                    setDiscount(Number(e.target.value));
                    return;
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={haveDiscount}
                  onChange={(e) => setHaveDiscount(e.target.checked)}
                />
                <div className="peer h-7 w-14 rounded-full bg-gray-200 peer-checked:bg-green-500 peer-focus:ring-4 peer-focus:ring-green-300 peer-focus:outline-none after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                <span className="ml-3 text-sm font-bold text-gray-700 uppercase">
                  {haveDiscount ? "Con descuento" : "Sin descuento"}
                </span>
              </label>
            </div>
          </div>

          <hr className="border-gray-100" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-wide text-gray-800 uppercase">
                  Rangos de Precio (Tiers)
                </h3>
                <p className="text-xs text-gray-500">
                  Deja el "Volumen Máx." vacío para indicar infinito (∞).
                </p>
              </div>
              <button
                onClick={handleAddTier}
                className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Plus size={16} /> Agregar Rango
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {tiers.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <p className="text-sm italic">
                    No hay rangos configurados. Haz clic en "Agregar Rango" para
                    comenzar.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  <div className="hidden grid-cols-12 gap-4 bg-gray-100/50 px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase md:grid">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-2 text-center">Vol. Mínimo</div>
                    <div className="col-span-2 text-center">Vol. Máximo</div>
                    <div className="col-span-3 text-right">
                      Precio a Rendir ($)
                    </div>
                    <div className="col-span-1"></div>
                  </div>

                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className="grid grid-cols-1 items-center gap-4 bg-white p-4 transition-colors hover:bg-blue-50/30 md:grid-cols-12"
                    >
                      <div className="col-span-1 md:col-span-4">
                        <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase md:hidden">
                          Producto
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={tier.productId}
                          onChange={(e) =>
                            handleTierChange(
                              tier.id,
                              "productId",
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Seleccionar...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase md:hidden">
                          Vol. Mínimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-center font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={tier.minVolume}
                          onChange={(e) =>
                            handleTierChange(
                              tier.id,
                              "minVolume",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="relative col-span-1 md:col-span-2">
                        <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase md:hidden">
                          Vol. Máximo
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="∞"
                          className="w-full rounded-lg border border-gray-300 p-2.5 text-center font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={tier.maxVolume}
                          onChange={(e) =>
                            handleTierChange(
                              tier.id,
                              "maxVolume",
                              e.target.value,
                            )
                          }
                        />
                        {tier.maxVolume === "" && (
                          <InfinityIcon
                            size={14}
                            className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 text-gray-400 md:top-1/2 md:block"
                          />
                        )}
                      </div>

                      <div className="relative col-span-1 md:col-span-3">
                        <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase md:hidden">
                          Precio Rendición
                        </label>
                        <span className="absolute top-8.5 left-3 -translate-y-1/2 font-bold text-gray-500 md:top-1/2">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded-lg border border-gray-300 p-2.5 pl-7 text-right text-sm font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={tier.renderPrice}
                          onChange={(e) =>
                            handleTierChange(
                              tier.id,
                              "renderPrice",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="col-span-1 mt-2 flex justify-end md:mt-0 md:justify-center">
                        <button
                          onClick={() => handleRemoveTier(tier.id)}
                          className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Eliminar rango"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 p-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              "Guardando..."
            ) : (
              <>
                <Save size={18} /> Guardar Esquema
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
