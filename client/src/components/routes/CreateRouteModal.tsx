import { useAuth } from "@/hook/useAuth";
import { useProducts } from "@/hook/useProducts";
import { routeService } from "@/services/route.service";
import { Plus, Save, Trash2, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreateRouteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { products } = useProducts();
  const { user } = useAuth();

  const [driverName, setDriverName] = useState(
    user?.role === "DRIVER" ? user.fullName : "",
  );
  const [observations, setObservations] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("1");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loadItems, setLoadItems] = useState<
    { productId: number; name: string; quantity: number }[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [schemas, setSchemas] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    routeService
      .getSchemas()
      .then((data) => setSchemas(data))
      .catch((err) => {
        toast.error(err.message || "Error al cargar esquemas de precios");
      });
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) return;

    const prod = products.find((p) => p.id === Number(selectedProduct));
    if (!prod) return;

    if (prod.trackStock && prod.stock < Number(quantity)) {
      toast.error(
        `Solo hay ${prod.stock} unidades disponibles de ${prod.name}`,
      );
      return;
    }

    setLoadItems((prev) => {
      const exists = prev.find((i) => i.productId === Number(prod.id));
      if (exists) {
        return prev.map((i) =>
          i.productId === Number(prod.id)
            ? { ...i, quantity: i.quantity + Number(quantity) }
            : i,
        );
      }
      return [
        ...prev,
        { productId: prod.id, name: prod.name, quantity: Number(quantity) },
      ];
    });
    setQuantity("");
    setSelectedProduct("");
  };

  const handleRemoveItem = (productId: number) => {
    setLoadItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleCreate = async () => {
    if (!driverName.trim()) {
      toast.error("El nombre del chofer es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      await routeService.create({
        driverName,
        observations,
        pricingSchemeId: Number(selectedScheme),
        items: loadItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      toast.success("Ruta creada y cargada correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear ruta");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-gray-50 p-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nueva Salida</h2>
            <p className="text-xs text-gray-500">
              Configuración inicial y carga
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Truck size={16} className="text-blue-600" /> Chofer
              </label>
              <input
                autoFocus
                className="w-full rounded-xl border border-gray-300 p-3 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del conductor..."
                value={driverName}
                readOnly={user?.role === "DRIVER"}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700">
                  Tipo de Servicio
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value)}
                >
                  {schemas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
                  <FileText size={16} className="text-gray-400" /> Observaciones
                </label>
                <input
                  className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Opcional..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div> */}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="text-xs font-bold tracking-wide text-blue-700 uppercase">
              {user?.role === "ADMIN"
                ? "Registra los productos de la salida"
                : "Registra los productos de tu carga"}
            </h3>

            <div className="flex flex-col gap-3">
              <select
                className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Seleccionar Producto...</option>
                {products.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    disabled={p.trackStock && p.stock <= 0}
                  >
                    {p.name} {p.trackStock ? `(Stock: ${p.stock})` : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  className="w-28 rounded-xl border border-gray-300 p-3 text-center font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Cant."
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                />
                <button
                  onClick={handleAddItem}
                  disabled={!selectedProduct || !quantity}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" /> AGREGAR
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase">
                Resumen de Carga
              </p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                {loadItems.length} Productos
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              {loadItems.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400 italic">
                    El registro de carga está vacío.
                  </p>
                </div>
              ) : (
                loadItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-gray-100 p-3 transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        {item.quantity} un.
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 p-5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-gray-300 bg-white py-3 font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting || loadItems.length === 0}
            className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              "Procesando..."
            ) : (
              <>
                <Save size={18} /> CONFIRMAR SALIDA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
