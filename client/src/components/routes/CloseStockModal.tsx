import { clientService } from "@/services/client.service";
import { routeService } from "@/services/route.service";
import type { Client } from "@/types/client.types";
import type { Route } from "@/types/route.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Voucher {
  productId: number;
  productName: string;
  clientId: string;
  clientName: string;
  quantity: number;
}

export default function CloseStockModal({
  route,
  onClose,
  onSuccess,
}: {
  route: Route;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);

  const [inputs, setInputs] = useState<
    Record<number, { returned: string; credits: string }>
  >({});

  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  const [selectedProductForVoucher, setSelectedProductForVoucher] = useState<
    number | null
  >(null);
  const [voucherClient, setVoucherClient] = useState("");
  const [voucherQty, setVoucherQty] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [isSavingClient, setIsSavingClient] = useState(false);

  useEffect(() => {
    clientService.getAll().then(setClients);
  }, []);

  const handleInputChange = (
    productId: number,
    field: "returned" | "credits",
    value: string,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleAddVoucher = () => {
    if (!selectedProductForVoucher || !voucherClient || !voucherQty) return;

    const product = route.items.find(
      (i) => i.productId === selectedProductForVoucher,
    );
    const client = clients.find((c) => c.id === voucherClient);

    if (!product || !client) return;

    setVouchers((prev) => [
      ...prev,
      {
        productId: product.productId,
        productName: product.product.name,
        clientId: client.id,
        clientName: client.name,
        quantity: Number(voucherQty),
      },
    ]);

    setVoucherQty("");
    setVoucherClient("");
  };

  const removeVoucher = (index: number) => {
    setVouchers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      for (const item of route.items) {
        const declaredCredits = Number(inputs[item.productId]?.credits || 0);

        const vouchersTotal = vouchers
          .filter((v) => v.productId === item.productId)
          .reduce((acc, v) => acc + v.quantity, 0);

        if (declaredCredits > 0 && declaredCredits !== vouchersTotal) {
          throw new Error(
            `En ${item.product.name}: Declaraste ${declaredCredits} fiados, pero detallaste ${vouchersTotal}. Deben coincidir.`,
          );
        }
      }

      const itemsReturn = route.items.map((item) => ({
        productId: item.productId,
        returnedQuantity: Number(inputs[item.productId]?.returned || 0),
        creditQuantity: Number(inputs[item.productId]?.credits || 0),
      }));

      await routeService.closeStock(route.id, { itemsReturn, vouchers });
      toast.success("Ruta cerrada y deudas registradas.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
      setIsSubmitting(false);
    }
  };

  const needsVouchers = Object.values(inputs).some(
    (i) => Number(i.credits) > 0,
  );

  const handleQuickCreateClient = async () => {
    if (!newClientName.trim()) return;
    setIsSavingClient(true);
    try {
      const newClient = await clientService.create({
        name: newClientName,
        type: "FINAL",
      });

      setClients((prev) => [...prev, newClient]);

      setVoucherClient(newClient.id);

      setIsCreatingClient(false);
      setNewClientName("");
      toast.success(`Cliente "${newClient.name}" creado`);
    } catch (error) {
      toast.error("Error al crear cliente");
    } finally {
      setIsSavingClient(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-8 w-full max-w-5xl rounded-lg bg-white shadow-xl">
        <header className="flex justify-between rounded-t-lg bg-green-700 p-4 text-white">
          <h2 className="text-xl font-bold">
            Cierre de Ruta: {route.driverName}
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="mb-4 font-bold text-gray-700">
              1. Balance de Carga
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="p-2">Producto</th>
                  <th className="p-2 text-center">Carga</th>
                  <th className="w-24 bg-blue-50 p-2 text-center">Volvió</th>
                  <th className="w-24 bg-orange-50 p-2 text-center">Boletas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {route.items.map((item) => {
                  const vals = inputs[item.productId] || {
                    returned: "",
                    credits: "",
                  };
                  return (
                    <tr key={item.id}>
                      <td className="p-2 font-medium">{item.product.name}</td>
                      <td className="p-2 text-center">{item.initialLoad}</td>
                      <td className="bg-blue-50 p-2">
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded border p-1 text-center"
                          value={vals.returned}
                          onChange={(e) =>
                            handleInputChange(
                              item.productId,
                              "returned",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="bg-orange-50 p-2">
                        <input
                          type="number"
                          min="0"
                          className="w-full rounded border p-1 text-center font-bold text-orange-700"
                          value={vals.credits}
                          onChange={(e) =>
                            handleInputChange(
                              item.productId,
                              "credits",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded border bg-gray-50 p-4">
            <h3 className="mb-4 font-bold text-gray-700">
              2. Detalle de Fiados
            </h3>

            {!needsVouchers ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No hay productos marcados como "Boletas".
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-2 rounded border bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Nuevo Detalle
                  </p>

                  <select
                    className="w-full rounded border p-1 text-sm"
                    value={selectedProductForVoucher || ""}
                    onChange={(e) =>
                      setSelectedProductForVoucher(Number(e.target.value))
                    }
                  >
                    <option value="">Producto...</option>
                    {route.items.map((i) => {
                      const declared = Number(
                        inputs[i.productId]?.credits || 0,
                      );
                      if (declared === 0) return null;
                      return (
                        <option key={i.productId} value={i.productId}>
                          {i.product.name}
                        </option>
                      );
                    })}
                  </select>

                  <div className="flex items-center gap-2">
                    {isCreatingClient ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nombre del nuevo cliente..."
                          className="flex-1 rounded border border-blue-500 p-1 text-sm ring-1 ring-blue-200"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleQuickCreateClient();
                            if (e.key === "Escape") setIsCreatingClient(false);
                          }}
                        />
                        <button
                          onClick={handleQuickCreateClient}
                          disabled={isSavingClient}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setIsCreatingClient(false)}
                          className="px-1 text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <select
                          className="flex-1 rounded border p-1 text-sm"
                          value={voucherClient}
                          onChange={(e) => setVoucherClient(e.target.value)}
                        >
                          <option value="">Cliente Deudor...</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setIsCreatingClient(true)}
                          className="rounded bg-gray-200 px-2 py-1 text-sm font-bold text-gray-600 hover:bg-gray-300"
                          title="Crear nuevo cliente"
                        >
                          +
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Cant."
                      className="w-20 rounded border p-1 text-sm"
                      value={voucherQty}
                      onChange={(e) => setVoucherQty(e.target.value)}
                    />
                    <button
                      onClick={handleAddVoucher}
                      className="flex-1 rounded bg-orange-600 text-sm font-bold text-white hover:bg-orange-700"
                    >
                      AGREGAR
                    </button>
                  </div>
                </div>

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {vouchers.map((v, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded border bg-white p-2 text-sm shadow-sm"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {v.clientName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {v.quantity} x {v.productName}
                        </p>
                      </div>
                      <button
                        onClick={() => removeVoucher(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {route.items.map((i) => {
                    const declared = Number(inputs[i.productId]?.credits || 0);
                    if (declared === 0) return null;
                    const current = vouchers
                      .filter((v) => v.productId === i.productId)
                      .reduce((a, b) => a + b.quantity, 0);
                    const diff = declared - current;

                    return (
                      <div
                        key={i.productId}
                        className={`flex justify-between ${diff === 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        <span>{i.product.name}:</span>
                        <span>
                          {current} / {declared} detallados
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 rounded-b-lg bg-gray-100 p-4">
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-gray-600 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded bg-green-700 px-6 py-2 font-bold text-white shadow hover:bg-green-800"
          >
            CONFIRMAR Y CERRAR
          </button>
        </div>
      </div>
    </div>
  );
}
