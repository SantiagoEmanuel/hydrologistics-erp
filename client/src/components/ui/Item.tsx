import type { Product } from "@/types/product.types";

export default function Item({
  item,
  onClick,
}: {
  item: Product;
  onClick?: () => void;
}) {
  if (!item || !item.isActive) return null;

  return (
    <article
      onClick={onClick}
      className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 bg-white p-2 transition-all duration-200 select-none hover:border-blue-400 hover:shadow-md active:scale-95"
    >
      <img
        src="/img-not-found.png"
        alt="Imagen no encontrada"
        title="Imagen no encontrada"
        className="size-16"
      />
      <div className="flex w-full max-w-xs flex-col items-center justify-center gap-1 px-4">
        <h3 className="uppercase">{item.name}</h3>
        <p>${item.price.toLocaleString()}</p>
      </div>
    </article>
  );
}
