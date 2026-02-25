import type { Sale } from "@/types/sale.types";
import { useState } from "react";

export default function PendingSaleCard({
  sale,
  paymentMethods,
  onPay,
}: {
  sale: Sale;
  paymentMethods: any[];
  onPay: (id: string, methodId: number) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<number>(
    paymentMethods[0]?.id || 1,
  );

  return (
    <article className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-bold text-gray-800">#{sale.ticketCode}</h3>
        <span className="font-mono text-xs text-gray-500">
          {new Date(sale.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <ul className="mb-3 list-disc pl-5 text-sm text-gray-600">
        {sale.items?.map((item) => (
          <li key={item.id}>
            {item.product.name}{" "}
            <span className="font-bold">x{item.quantity}</span>
          </li>
        ))}
      </ul>
      <div className="mb-3 flex items-center justify-between border-t border-yellow-200 pt-2">
        <span className="text-sm text-gray-500">Total:</span>
        <span className="text-lg font-bold text-gray-900">
          {new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
          }).format(sale.totalAmount)}
        </span>
      </div>

      <div className="flex gap-2">
        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(Number(e.target.value))}
          className="w-full rounded border border-gray-300 bg-white py-2 text-center text-sm"
        >
          {paymentMethods.map((P) => (
            <option key={P.id} value={P.id}>
              {P.name}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-green-600 px-3 py-2 text-sm font-bold whitespace-nowrap text-white shadow transition hover:bg-green-700 active:scale-95"
          onClick={() => onPay(sale.id, selectedMethod)}
        >
          Cobrar
        </button>
      </div>
    </article>
  );
}
