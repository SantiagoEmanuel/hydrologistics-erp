import ClientSelector from "@/components/POS/ClientSelector";
import Item from "@/components/ui/Item";
import { useProducts } from "@/hook/useProducts";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

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

  const [paymentMethod, setPaymentMethod] = useState<number>(1);

  useEffect(() => {
    getAllPayments();
  }, []);

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden">
      <section className="flex-1 overflow-y-auto rounded-md bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
          <p className="text-sm text-gray-500">
            Seleccione los productos para agregar
          </p>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <Item
              key={product.id}
              item={product}
              onClick={() => addItem(product)}
            />
          ))}
        </section>
      </section>
      <aside className="flex h-full w-96 flex-col rounded-md border-l border-gray-100 bg-white shadow-md">
        <div className="flex flex-col justify-between border-b border-gray-100 p-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800">Ticket Actual</h2>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 underline hover:text-red-700"
              >
                Vaciar
              </button>
            )}
          </div>
          <div>
            <ClientSelector />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <img src="empty.png" alt="Vacío" className="size-42" />
              <p>Carrito Vacío</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <article
                key={product.id}
                className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-2"
              >
                <div className="flex flex-col">
                  <span
                    className="w-32 truncate text-sm font-medium text-gray-800"
                    title={product.name}
                  >
                    {product.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    $
                    {selectedClient === null
                      ? product.price
                      : product.wholesalePrice}{" "}
                    x {quantity}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decreaseItem(product.id)}
                    className="flex size-6 items-center justify-center rounded border border-gray-300 bg-white text-red-500 hover:bg-red-50"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => addItem(product)}
                    className="flex size-6 items-center justify-center rounded border border-gray-300 bg-white text-green-600 hover:bg-green-50"
                  >
                    +
                  </button>
                </div>

                <div className="w-16 text-right font-bold text-gray-700">
                  $
                  {(
                    (selectedClient === null
                      ? product.price
                      : product.wholesalePrice) * quantity
                  ).toLocaleString()}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between text-xl">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-gray-900">
              ${total.toLocaleString()}
            </span>
          </div>

          <div>
            <select
              className="mb-4 w-full rounded-md border border-gray-400 px-4 py-3 text-center font-bold disabled:border-none disabled:bg-gray-300 disabled:text-white"
              disabled={items.length === 0 || isBuying}
              onChange={(e) => {
                setPaymentMethod(Number(e.currentTarget.value));
              }}
            >
              {paymentMethods.map((pm) => (
                <option value={pm.id} key={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <button
              disabled={items.length === 0 || isBuying}
              className={`w-full rounded-lg py-3 font-bold text-white transition-all ${
                items.length === 0
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-blue-600 shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95"
              } `}
              onClick={() => buyCart("PAID", paymentMethod)}
            >
              COBRAR
            </button>
            <button
              disabled={items.length === 0 || isBuying}
              className={`w-full rounded-lg py-3 font-bold text-white transition-all ${
                items.length === 0
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-orange-600 shadow-lg hover:bg-orange-700 hover:shadow-xl active:scale-95"
              } `}
              onClick={() => buyCart("UNPAID", paymentMethod)}
            >
              TOMAR PEDIDO
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
