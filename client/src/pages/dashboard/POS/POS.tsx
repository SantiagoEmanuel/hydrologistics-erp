import ClientSelector from "@/components/POS/ClientSelector";
import { useProducts } from "@/hook/useProducts";
import { useCartStore } from "@/store/useCartStore";
import {
  ChevronUp,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function POS() {
  const { products } = useProducts();
  const {
    items,
    addItem,
    clearCart,
    getTotal,
    decreaseItem,
    isBuying,
    buyCart,
    selectedClient,
    paymentMethods,
    getAllPayments,
  } = useCartStore();

  const total = getTotal();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<number>(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    getAllPayments();
  }, []);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  // Helper para precio dinámico
  const getPrice = (product: any) =>
    selectedClient?.type === "REVENDEDOR"
      ? product.wholesalePrice
      : product.price;

  return (
    <div className="relative flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-gray-100 md:flex-row">
      {/* --- SECCIÓN IZQUIERDA: CATÁLOGO --- */}
      <section className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Header y Buscador */}
        <div className="z-10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Punto de Venta
              </h1>
              <p className="text-xs text-gray-500">
                {selectedClient
                  ? `Precios Mayoristas para: ${selectedClient.name}`
                  : "Precios Público General"}
              </p>
            </div>
            {/* Selector de Cliente Móvil/Desktop */}
            <div className="w-full sm:w-64">
              <ClientSelector />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-4 pl-10 transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 pb-24 sm:grid-cols-3 md:pb-4 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="group flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md active:scale-95"
              >
                <div className="w-full">
                  <div className="mb-1 line-clamp-2 text-sm font-bold text-gray-800 capitalize sm:text-base">
                    {product.name}
                  </div>
                  <div className="mb-2 text-xs text-gray-400">
                    Stock: {product.stock}
                  </div>
                </div>

                <div className="mt-2 flex w-full items-center justify-between">
                  <span className="text-lg font-black text-blue-600">
                    ${getPrice(product)}
                  </span>
                  <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECCIÓN DERECHA: CARRITO (Desktop Sidebar / Mobile Drawer) --- */}

      {/* Overlay para móvil */}
      {isMobileCartOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileCartOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-x-0 bottom-0 z-30 flex h-[85vh] flex-col rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out md:static md:h-full md:w-96 md:transform-none md:rounded-none md:border-l md:border-gray-200 md:shadow-none ${isMobileCartOpen ? "translate-y-0" : "translate-y-[calc(100%-80px)] md:translate-y-0"} `}
      >
        {/* Barra Superior Móvil (Handle) */}
        <div
          className="flex cursor-pointer flex-col items-center rounded-t-2xl border-b border-gray-100 bg-white pt-2 pb-4 md:hidden"
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
        >
          <div className="mb-3 h-1.5 w-12 rounded-full bg-gray-300" />
          <div className="flex w-full items-center justify-between px-6">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <ShoppingCart className="h-5 w-5" />
              <span>{items.length} items</span>
            </div>
            <div className="text-xl font-black text-blue-600">
              ${total.toLocaleString()}
            </div>
            <ChevronUp
              className={`h-5 w-5 text-gray-400 transition-transform ${isMobileCartOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden items-center justify-between border-b border-gray-100 p-4 md:flex">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <ShoppingCart className="h-5 w-5" /> Ticket Actual
          </h2>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" /> Vaciar
            </button>
          )}
        </div>

        {/* Lista de Items */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400 opacity-60">
              <ShoppingCart className="mb-2 h-16 w-16" />
              <p>Carrito Vacío</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <span className="line-clamp-2 w-3/4 text-sm font-medium text-gray-800">
                    {product.name}
                  </span>
                  <span className="font-bold text-gray-900">
                    ${(getPrice(product) * quantity).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    ${getPrice(product)} c/u
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decreaseItem(product.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-red-500 transition-all hover:bg-red-50 active:scale-90"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-4 text-center font-bold">
                      {quantity}
                    </span>
                    <button
                      onClick={() => addItem(product)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-green-600 transition-all hover:bg-green-50 active:scale-90"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        <div className="border-t border-gray-200 bg-white p-4 pb-8 md:pb-4">
          <div className="mb-4 flex items-end justify-between">
            <span className="text-gray-500">Total a Pagar</span>
            <span className="text-3xl font-black text-gray-900">
              ${total.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <select
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-8 leading-tight text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                disabled={items.length === 0 || isBuying}
                onChange={(e) =>
                  setPaymentMethod(Number(e.currentTarget.value))
                }
                value={paymentMethod}
              >
                {paymentMethods.map((pm) => (
                  <option value={pm.id} key={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronUp className="h-4 w-4 rotate-180" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={items.length === 0 || isBuying}
                onClick={() => buyCart("PAID", paymentMethod)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> COBRAR
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Cerrar y Cobrar
                </span>
              </button>

              <button
                disabled={items.length === 0 || isBuying}
                onClick={() => buyCart("UNPAID", paymentMethod)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-orange-500 py-3 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Tomar
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Guardar pedido
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
