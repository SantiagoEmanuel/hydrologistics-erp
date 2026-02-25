import { useProducts } from "@/hook/useProducts";
import type { Product } from "@/types/product.types";
import {
  Edit2,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventory() {
  const {
    products,
    updateProductStock,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "¿Estás seguro de eliminar este producto? Esto no borrará el historial de ventas.",
      )
    ) {
      await deleteProduct(id);
    }
  };

  const handleQuickStock = async (product: Product, amount: number) => {
    try {
      await updateProductStock(Number(product.id), amount);
      toast.success(
        `Stock actualizado: ${amount > 0 ? "+" : ""}${amount} unidades`,
      );
    } catch {
      toast.error("Error al actualizar stock");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            <Package className="h-8 w-8 text-blue-600" />
            Inventario y Productos
          </h1>
          <p className="text-gray-500">Gestiona precios, stock y catálogo.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </button>
      </div>

      <div className="sticky top-0 z-10 mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => handleOpenEdit(product)}
            onDelete={() => handleDelete(product.id.toString())}
            onQuickStock={handleQuickStock}
          />
        ))}

        {filteredProducts.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">
            No se encontraron productos.
          </div>
        )}
      </div>

      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={editingProduct ? updateProduct : createProduct}
        />
      )}
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, onQuickStock }: any) {
  const [manualAmount, setManualAmount] = useState("");

  const handleManualSubmit = () => {
    const val = Number(manualAmount);
    if (!val || val === 0) return;
    onQuickStock(product, val);
    setManualAmount("");
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row">
      <div className="min-w-0 flex-1 text-center md:text-left">
        <div className="mb-1 flex items-center justify-center gap-2 md:justify-start">
          <h3 className="truncate text-lg font-bold text-gray-800 capitalize">
            {product.name}
          </h3>
          {!product.isActive && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
              Inactivo
            </span>
          )}
        </div>

        <div className="mb-2 flex flex-wrap justify-center gap-2 text-xs text-gray-500 md:justify-start">
          <span className="rounded bg-gray-100 px-2 py-1">
            Precio: <b>${product.price}</b>
          </span>
          {product.isRefill && (
            <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-blue-700">
              <RefreshCw className="h-3 w-3" /> Recarga
            </span>
          )}
          {product.trackStock ? (
            <span
              className={`rounded px-2 py-1 font-bold ${product.stock < 10 ? "bg-red-100 text-red-700" : "bg-green-50 text-green-700"}`}
            >
              Stock: {product.stock}
            </span>
          ) : (
            <span className="rounded bg-purple-50 px-2 py-1 text-purple-700">
              Servicio (Sin Stock)
            </span>
          )}
        </div>
      </div>

      {product.trackStock && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-gray-50 p-2 sm:flex-row">
          <div className="flex gap-1">
            <button
              onClick={() => onQuickStock(product, 10)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-green-600 transition-colors hover:bg-green-50"
            >
              +10
            </button>
            <button
              onClick={() => onQuickStock(product, 50)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-green-600 transition-colors hover:bg-green-50"
            >
              +50
            </button>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
              placeholder="+/-"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            />
            <button
              onClick={handleManualSubmit}
              className="rounded bg-gray-800 p-1.5 text-white transition-colors hover:bg-gray-700"
              title="Aplicar ajuste"
            >
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex w-full items-center justify-center gap-2 border-l border-gray-100 pt-4 pl-0 md:w-auto md:justify-end md:pt-0 md:pl-4">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
          title="Editar detalles"
        >
          <Edit2 className="h-5 w-5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Eliminar producto"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product?: Product | null;
  onClose: () => void;
  onSave: Function;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || "",
    price: product?.price || 0,
    wholesalePrice: product?.wholesalePrice || 0,
    stock: product?.stock || 0,
    trackStock: product?.trackStock ?? true,
    isRefill: product?.isRefill ?? false,
    isActive: product?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      await onSave(product.id, formData);
    } else {
      await onSave(formData);
    }
    toast.success(product ? "Producto actualizado" : "Producto creado");
    onClose();
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-6">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre del Producto
            </label>
            <input
              required
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Bidón 20L"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Precio Público ($)
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-blue-700">
                Precio Revendedor ($)
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full rounded-lg border border-blue-200 bg-blue-50/50 py-2 pr-3 pl-7 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={formData.wholesalePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wholesalePrice: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {product ? "Stock Actual (Ajuste manual)" : "Stock Inicial"}
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-400"
              value={formData.stock}
              disabled={!formData.trackStock && !product}
              onChange={(e) =>
                setFormData({ ...formData, stock: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">
              Configuración
            </p>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-50">
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
                checked={formData.trackStock}
                onChange={(e) =>
                  setFormData({ ...formData, trackStock: e.target.checked })
                }
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-800">
                  Controlar Stock
                </span>
                <span className="block text-xs text-gray-500">
                  Desactívalo para servicios o items infinitos.
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-50">
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
                checked={formData.isRefill}
                onChange={(e) =>
                  setFormData({ ...formData, isRefill: e.target.checked })
                }
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-800">
                  Es una Recarga
                </span>
                <span className="block text-xs text-gray-500">
                  Marcar si es agua/soda (afecta reportes de litros).
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-50">
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-blue-600 accent-blue-600 focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-800">
                  Producto Activo
                </span>
                <span className="block text-xs text-gray-500">
                  Si lo desactivas, no aparecerá en ventas.
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
