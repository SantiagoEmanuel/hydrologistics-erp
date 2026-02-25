import { useProducts } from "@/hook/useProducts";
import { saleService, type EditSalePayload } from "@/services/sale.service";
import type { Sale } from "@/types/sale.types";
import { Minus, Plus, Save, Search, Trash2, X } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface Props {
  sale: Sale;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSaleModal({ sale, onClose, onSuccess }: Props) {
  const { products } = useProducts();
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">(
    sale.paymentStatus as "PAID" | "UNPAID",
  );

  const [selectedDate, setSelectedDate] = useState(sale.createdAt);
  const [paymentMethodId] = useState(sale.paymentMethods?.id);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (sale?.items) {
      setItems(
        sale.items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.price,
          quantity: i.quantity,
          stock: i.product.stock + i.quantity,
        })),
      );
    }
  }, [sale]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5);
  }, [products, searchTerm]);

  const handleAddItem = (product: any) => {
    const exists = items.find((i) => i.productId === product.id);
    if (exists) {
      handleUpdateQuantity(product.id, 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ]);
    }
    setSearchTerm("");
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;
          return { ...item, quantity: newQty };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleNewDate = (dateString: string) => {
    if (dateString) {
      const isoDate = DateTime.fromISO(dateString).toISO();

      if (isoDate) setSelectedDate(isoDate);
    }
  };

  const total = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handleSave = async () => {
    if (items.length === 0) return toast.error("La venta no puede estar vacía");

    setLoading(true);
    try {
      const payload: EditSalePayload = {
        clientId: sale.client?.id || null,
        paymentMethodId: Number(paymentMethodId),
        paymentStatus,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        newDate: selectedDate,
      };

      await saleService.update(sale.id, payload);
      toast.success("Venta actualizada");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Editar Venta #{sale.ticketCode}
            </h2>
            <p className="text-xs text-gray-500">
              Cliente: {sale.client?.name || "Consumidor Final"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">
              Fecha de la Venta
            </label>
            <input
              type="datetime-local"
              defaultValue={
                sale.createdAt
                  ? DateTime.fromISO(sale.createdAt).toFormat(
                      "yyyy-MM-dd'T'HH:mm",
                    )
                  : ""
              }
              onChange={(e) => handleNewDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-2 text-sm"
            />
          </div>

          <div className="relative mb-6">
            <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">
              Agregar Producto
            </label>
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar para agregar..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {filteredProducts.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {filteredProducts.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => handleAddItem(p)}
                    className="flex cursor-pointer items-center justify-between border-b p-3 last:border-0 hover:bg-blue-50"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="text-xs text-gray-500">
                      Stock: {p.stock} |{" "}
                      <span className="font-bold text-blue-600">
                        ${p.price}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-6 space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase">
              Productos en la Venta
            </label>
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price} c/u</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, -1)}
                      className="rounded p-1 shadow-sm hover:bg-white disabled:opacity-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, 1)}
                      className="rounded p-1 text-blue-600 shadow-sm hover:bg-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="w-20 text-right text-sm font-bold text-gray-900">
                    ${(item.price * item.quantity).toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">
                Carrito vacío
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">
                Estado Pago
              </label>
              <select
                value={paymentStatus}
                onChange={(e) =>
                  setPaymentStatus(e.target.value as "UNPAID" | "PAID")
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-2 text-sm"
              >
                <option value="PAID">Pagado</option>
                <option value="UNPAID">Pendiente</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-medium text-gray-500">Nuevo Total</span>
            <span className="text-2xl font-black text-gray-900">
              ${total.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              "Guardando..."
            ) : (
              <>
                <Save size={18} /> Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
