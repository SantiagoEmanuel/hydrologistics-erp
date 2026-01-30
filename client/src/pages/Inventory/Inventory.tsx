import { useProducts } from "@/hook/useProducts";
import type { Product } from "@/types/product.types";

export default function Inventory() {
  const { products, updateProductStock } = useProducts();

  const stockProducts = products.filter((p) => p.trackStock);

  const handleQuickAdd = async (product: Product, amount: number) => {
    if (confirm(`¿Confirmas agregar ${amount} unidades a ${product.name}?`)) {
      await updateProductStock(product.id, amount);
    }
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestión de Inventario
        </h1>
        <p className="text-gray-500">Ajuste de stock manual y producción</p>
      </header>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Producto</th>
              <th className="p-4 font-semibold text-gray-600">Stock Actual</th>
              <th className="p-4 text-center font-semibold text-gray-600">
                Producción Rápida
              </th>
              <th className="p-4 text-right font-semibold text-gray-600">
                Ajuste Manual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stockProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{product.name}</p>
                  {product.dailyResetStock && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      Auto-Reset: {product.dailyResetStock}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`font-mono text-lg font-bold ${product.stock < 10 ? "text-red-500" : "text-green-600"}`}
                  >
                    {product.stock}
                  </span>
                </td>

                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleQuickAdd(product, 10)}
                      className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition hover:bg-green-200"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleQuickAdd(product, 50)}
                      className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition hover:bg-green-200"
                    >
                      +50
                    </button>
                  </div>
                </td>

                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <input
                      type="number"
                      placeholder="+ / -"
                      className="w-20 rounded border px-2 py-1 text-sm"
                      id={`input-${product.id}`}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById(
                          `input-${product.id}`,
                        ) as HTMLInputElement;
                        const val = Number(input.value);
                        if (val !== 0) updateProductStock(product.id, val);
                        input.value = "";
                      }}
                      className="rounded bg-gray-800 px-3 py-1 text-sm text-white hover:bg-gray-700"
                    >
                      Aplicar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
