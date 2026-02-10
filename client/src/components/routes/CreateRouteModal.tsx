import { useProducts } from "@/hook/useProducts";
import { routeService } from "@/services/route.service";
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

  const [driverName, setDriverName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loadItems, setLoadItems] = useState<
    { productId: number; name: string; quantity: number }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [schemes, setSchemes] = useState<{ id: number; name: string }[]>([]);
  const [selectedScheme, setSelectedScheme] = useState("1");

  useEffect(() => {
    setSchemes([
      { id: 1, name: "Oficial (Incentivos)" },
      { id: 2, name: "Negocios (Fijo)" },
      { id: 3, name: "Rayo Pub Dance" },
    ]);
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity) return;
    const prod = products.find((p) => p.id === Number(selectedProduct));
    if (!prod) return;

    setLoadItems((prev) => {
      const exists = prev.find((i) => i.productId === prod.id);
      if (exists) {
        return prev.map((i) =>
          i.productId === prod.id
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
  };

  const handleCreate = async () => {
    if (!driverName || loadItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await routeService.create({
        driverName,
        pricingSchemeId: Number(selectedScheme),
        items: loadItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      toast.success("Ruta creada. Camión en salida.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <header className="rounded-t-lg bg-blue-600 p-4 text-white">
          <h2 className="text-xl font-bold">Nueva Hoja de Ruta (Salida)</h2>
        </header>

        <div className="flex flex-col gap-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Nombre del Chofer
            </label>
            <input
              className="w-full rounded border p-2"
              placeholder="Ej: José Castillo"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold">
              Tipo de Ruta
            </label>
            <select
              className="w-full rounded border p-2"
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
            >
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded border bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-gray-700">
              Cargar Camioneta
            </h3>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded border p-2"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Seleccionar Producto...</option>
                {products
                  .filter((p) => p.trackStock)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
              </select>
              <input
                type="number"
                className="w-20 rounded border p-2"
                placeholder="Cant."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <button
                onClick={handleAddItem}
                className="rounded bg-blue-600 px-3 text-white hover:bg-blue-700"
              >
                +
              </button>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto">
            {loadItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border-b py-2 text-sm"
              >
                <span>{item.name}</span>
                <span className="font-bold">{item.quantity} un.</span>
              </div>
            ))}
            {loadItems.length === 0 && (
              <p className="text-center text-sm text-gray-400">
                Sin carga asignada
              </p>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={isSubmitting || loadItems.length === 0}
            className="w-full rounded bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Procesando..." : "CONFIRMAR SALIDA"}
          </button>
        </div>
      </div>
    </div>
  );
}
