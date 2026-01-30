import { useCartStore } from "@/store/useCartStore";

export default function CartMenu({
  setShowCart,
}: {
  setShowCart: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { items, removeItem, clearCart, buyCart } = useCartStore();

  return (
    <aside className="absolute top-0 right-0 h-dvh w-76 rounded-l-xl border-l border-gray-300 bg-gray-200 p-4 shadow-md">
      <h2 className="text-xl font-bold">Tu Carrito</h2>
      <button
        className="absolute top-4 right-4 rounded-xl border border-red-500 bg-gray-100 px-4 py-1 font-bold text-red-400 transition-colors hover:bg-red-500 hover:text-white"
        onClick={() => setShowCart(false)}
      >
        close
      </button>
      <div className="mt-20 flex flex-col gap-4">
        {items.map(({ product, quantity }) => (
          <article
            key={product.id}
            className="relative border-b border-gray-400 py-2"
          >
            <p>Producto:{product.name}</p>
            <p>Cantidad:{quantity}</p>
            <button
              className="absolute top-3 right-0 flex size-5 items-center justify-center rounded-full bg-red-500"
              onClick={() => removeItem(product.id)}
            >
              x
            </button>
          </article>
        ))}
      </div>
      {items.length !== 0 && (
        <div className="flex justify-between gap-4 py-2">
          <button
            className="cursor-pointer rounded-md bg-red-500 px-2 py-1 font-semibold text-white"
            onClick={clearCart}
          >
            Borrar carrito
          </button>
          <button
            className="cursor-pointer rounded-md bg-blue-400 px-2 py-1 font-semibold text-white"
            onClick={() => buyCart("", items)}
          >
            Comprar carrito
          </button>
        </div>
      )}
    </aside>
  );
}
