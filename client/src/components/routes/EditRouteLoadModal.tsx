import { useProducts } from "@/hook/useProducts";
import { routeService } from "@/services/route.service";
import { Minus, Package, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  route: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface RouteItemLocal {
  productId: number;
  name: string;
  quantity: number;
  stock: number;
}

export default function EditRouteLoadModal({
  route,
  onClose,
  onSuccess,
}: Props) {
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<RouteItemLocal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (route.items) {
      setItems(
        route.items.map((ri: any) => ({
          productId: ri.product.id,
          name: ri.product.name,
          quantity: ri.initialLoad,
          stock: ri.product.stock,
        })),
      );
    }
  }, [route]);

  const availableProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products
      .filter(
        (p) =>
          !items.some((i) => i.productId === p.id) &&
          p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .slice(0, 5);
  }, [products, items, searchTerm]);

  const handleAddItem = (product: any) => {
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        stock: product.stock,
      },
    ]);
    setSearchTerm("");
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;

          if (delta > 0 && item.stock <= 0) {
            toast.error("No hay más stock en depósito");
            return item;
          }

          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      await routeService.updateItems(route.id, payload);

      toast.success("Carga actualizada correctamente");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la carga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Gestionar la Carga
            </h3>
            <p className="text-xs text-gray-500">
              Chofer:{" "}
              <span className="font-medium text-gray-900">
                {route.driverName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="relative z-20 mb-8">
            <label className="mb-2 block text-xs font-bold text-gray-500 uppercase">
              Busca un producto para agregar
            </label>
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Escribe para buscar..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 text-sm transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm && availableProducts.length > 0 && (
              <ul className="absolute mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                {availableProducts.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className="flex cursor-pointer items-center justify-between border-b border-gray-50 p-3 transition-colors last:border-0 hover:bg-blue-50"
                  >
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      Stock Depósito: {p.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase">
                Productos registrados
              </label>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {items.length} Productos
              </span>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <Package className="mb-2 h-10 w-10 text-gray-300" />
                <p className="font-medium text-gray-400">
                  No hay productos registrados
                </p>
                <p className="text-xs text-gray-400">
                  Usa el buscador para registrar los productos
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-blue-200"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-500">
                      Stock Extra: {item.stock}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="rounded-md p-1.5 text-gray-600 transition-all hover:bg-white hover:shadow-sm"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="rounded-md p-1.5 text-blue-600 transition-all hover:bg-white hover:shadow-sm"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Quitar de la ruta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              "Actualizando Inventario..."
            ) : (
              <>
                <Save size={20} /> Guardar modificaciones
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
