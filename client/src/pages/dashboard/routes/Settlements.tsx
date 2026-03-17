import SettlementDocument from "@/components/pdf/SettlementDocument";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hook/useAuth";
import { useProducts } from "@/hook/useProducts";
import { clientService } from "@/services/client.service";
import { routeService } from "@/services/route.service";
import type { Client } from "@/types/client.types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SchemeBreakdownItem {
  productId: number;
  productName: string;
  totalSold: number;
  deductions: {
    boleta: number;
    transfer: number;
    exchange: number;
  };
  cashUnits: number;
  basePrice: number;
  bonuses: number;
  voucherCompensation: number;
  finalDebt: number;
}

interface SchemeSummary {
  schemeId: number;
  schemeName: string;
  haveDiscount: boolean;
  discountValue: number;
  totalToPayForScheme: number;
  items: SchemeBreakdownItem[];
  routesIncluded: string[];
}

interface RouteDetail {
  id: string;
  closedAt: string;
  items: {
    productName: string;
    initialLoad: number;
    returnedLoad: number;
    soldCount: number;
  }[];
}

interface SettlementData {
  driverName: string;
  date: string;
  globalStatus: {
    paymentStatus: "PAID" | "PENDING";
    stockStatus: "CLOSED" | "OPEN";
  };
  totalRoutes: number;
  totalToPay: number;
  schemesBreakdown: SchemeSummary[];
  breakdownApplied: boolean;
  routeDetails: RouteDetail[];
}

interface BreakdownItem {
  id: string;
  type: "BOLETA" | "TRANSFER" | "EXCHANGE";
  productId: number;
  productName: string;
  schemeId: number;
  schemeName: string;
  clientId?: string;
  clientName?: string;
  quantity: number;
}

export default function Settlements() {
  const { user } = useAuth();

  const [driverName, setDriverName] = useState(
    user?.role === "DRIVER" ? user?.fullName.toLowerCase() : "",
  );
  const [date, setDate] = useState(
    DateTime.now().setZone("America/Argentina/Buenos_Aires").toISODate()!,
  );

  const [preview, setPreview] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);

  const { products } = useProducts();
  const [clients, setClients] = useState<Client[]>([]);

  const [newItemType, setNewItemType] = useState<"BOLETA" | "TRANSFER" | "EXCHANGE">("BOLETA");
  const [newItemScheme, setNewItemScheme] = useState<number | "">("");
  const [newItemProduct, setNewItemProduct] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemClient, setNewItemClient] = useState("");

  const [clientSearch, setClientSearch] = useState("");
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", type: "FINAL" });

  const [isConfirming, setIsConfirming] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<SettlementData | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    clientService.getAll().then(setClients);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 5);
    return clients.filter(
      (c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.dni?.includes(clientSearch)
    );
  }, [clients, clientSearch]);

  const handleSelectClient = (client: Client) => {
    setNewItemClient(client.id);
    setClientSearch("");
    setIsClientOpen(false);
  };

  const handleCreateClient = async () => {
    if (!newClientData.name) return toast.error("Ingresa un nombre");
    try {
      const created = await clientService.create(newClientData);
      setClients((prev) => [...prev, created]);
      handleSelectClient(created);
      setIsCreatingClient(false);
      setNewClientData({ name: "", type: "FINAL" });
      toast.success("Cliente creado");
    } catch (error) {
      toast.error("Error al crear cliente");
    }
  };

  const fetchPreview = async (currentBreakdown: BreakdownItem[]) => {
    if (!driverName) return;

    if (!preview) setLoading(true);
    else setIsRecalculating(true);

    try {
      const backendBreakdown = currentBreakdown.map((item) => ({
        productId: item.productId,
        type: item.type,
        clientId: item.clientId,
        quantity: item.quantity,
        schemeId: item.schemeId,
      }));

      const data = (await routeService.previewSettlement(
        driverName,
        date,
        backendBreakdown as any,
      )) as unknown as SettlementData;

      setPreview(data);
    } catch (error: any) {
      toast.error(error.message || "Error al buscar rendición");
      if (!preview) setPreview(null);
    } finally {
      setLoading(false);
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    if (preview) {
      const timer = setTimeout(() => {
        fetchPreview(breakdown);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [breakdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBreakdown([]);
    setPreview(null);
    fetchPreview([]);
  };

  const handleAddBreakdownItem = () => {
    if (!newItemProduct || !newItemQty || newItemScheme === "") return toast.error("Faltan datos o esquema");
    if ((newItemType === "BOLETA" || newItemType === "TRANSFER") && !newItemClient)
      return toast.error("Selecciona un cliente");

    const prod = products.find((p) => p.id === Number(newItemProduct));
    const cli = clients.find((c) => c.id === newItemClient);
    const scheme = preview?.schemesBreakdown.find((s) => s.schemeId === Number(newItemScheme));

    const newItem: BreakdownItem = {
      id: crypto.randomUUID(),
      type: newItemType,
      productId: Number(newItemProduct),
      productName: prod?.name || "Producto",
      schemeId: Number(newItemScheme),
      schemeName: scheme?.schemeName || "Base",
      clientId: newItemClient,
      clientName: cli?.name || "Cliente",
      quantity: Number(newItemQty),
    };

    setBreakdown((prev) => [...prev, newItem]);
    setNewItemQty("");
    setNewItemClient("");
  };

  const removeBreakdownItem = (id: string) => {
    setBreakdown((prev) => prev.filter((item) => item.id !== id));
  };

  const handleProcessPayment = async () => {
    if (!preview) return;
    setLoading(true);

    try {
      const backendBreakdown = breakdown.map((item) => ({
        productId: item.productId,
        type: item.type,
        clientId: item.clientId,
        quantity: item.quantity,
        schemeId: item.schemeId,
      }));

      await routeService.confirmSettlement(
        preview.driverName,
        preview.date,
        preview.totalToPay,
        backendBreakdown as any,
      );

      setIsConfirming(false);
      setShowSuccessModal(true);
      setLastSettlement(preview);
      setPreview(null);
      setBreakdown([]);
      setDriverName("");
      toast.success("¡Rendición procesada correctamente!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);

  const selectedClientName = clients.find((c) => c.id === newItemClient)?.name;

  if (!user) {
    window.location.replace("/");
  }

  const isAlreadyPaid = preview?.globalStatus?.paymentStatus === "PAID";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 pb-24 md:p-8">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <Wallet className="h-8 w-8 text-blue-600" />
          Rendición de viajes
        </h1>
        <p className="mt-1 text-gray-500">
          Administración financiera y cierre de caja
        </p>
      </header>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 items-end gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="mb-2 block text-xs font-bold text-gray-400 uppercase">Chofer</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 pl-10 font-medium capitalize transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del chofer..."
                value={driverName}
                readOnly={user?.role === "DRIVER"}
                onChange={(e) => setDriverName(e.target.value.toLocaleLowerCase())}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="mb-2 block text-xs font-bold text-gray-400 uppercase">Fecha</label>
            <input
              type="date"
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-medium transition-all outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" disabled={loading} buttonType="submit" textAlign="center">
              {loading ? "Buscando..." : "INICIAR RENDICIÓN"}
            </Button>
          </div>
        </form>
      </section>

      {preview && (
        <div className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 gap-8 duration-500 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            
            {isAlreadyPaid && (
              <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold">Rendición Completada</p>
                  <p className="text-sm">Estos viajes ya fueron rendidos y el dinero ingresó a la caja. Puedes imprimir el comprobante pero no volver a confirmarlo.</p>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between bg-gray-900 p-6 text-white">
                <div>
                  <h2 className="text-xl font-bold max-md:text-base">Resumen a Cobrar</h2>
                  <p className="text-xs text-gray-400">
                    {preview.totalRoutes} Viajes • {DateTime.fromISO(preview.date).toLocaleString(DateTime.DATE_MED)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase">Efectivo a recibir</p>
                  {isRecalculating ? (
                    <p className="animate-pulse text-4xl font-black text-gray-500 max-md:text-3xl">Calculando...</p>
                  ) : (
                    <p className="text-4xl font-black text-green-400 max-md:text-3xl">{formatMoney(preview.totalToPay)}</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 space-y-4">
                {preview.schemesBreakdown.map((scheme) => (
                  <div key={scheme.schemeId} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between bg-gray-100/80 px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 uppercase tracking-wide text-sm">{scheme.schemeName}</span>
                        {scheme.haveDiscount && (
                           <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">DTO ACTIVO</span>
                        )}
                      </div>
                      <span className="font-black text-gray-700">Subtotal: {formatMoney(scheme.totalToPayForScheme)}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-gray-100 bg-white text-gray-400">
                          <tr>
                            <th className="px-4 py-2 text-xs font-semibold uppercase">Producto</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase">Total</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-orange-600 uppercase">Deduc.</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-900 uppercase">Efectivo</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-blue-600 uppercase">Bonif.</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-purple-600 uppercase">Comp.</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase">Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-gray-50 divide-y">
                          {scheme.items.map((item, idx) => {
                            const totalDeductions = item.deductions.boleta + item.deductions.transfer + item.deductions.exchange;
                            return (
                              <tr key={idx} className="transition-colors hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-medium text-gray-800 capitalize">
                                  {item.productName}
                                  <div className="text-[10px] text-gray-400">Base: {formatMoney(item.basePrice)}</div>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-500">{item.totalSold}</td>
                                <td className="bg-orange-50/20 px-4 py-3 text-center font-bold text-orange-600">
                                  {totalDeductions > 0 ? `-${totalDeductions}` : "-"}
                                </td>
                                <td className="bg-gray-50/50 px-4 py-3 text-center font-bold text-gray-900">
                                  {item.cashUnits}
                                </td>
                                <td className="px-4 py-3 text-right text-blue-600">
                                  {item.bonuses > 0 ? `-${formatMoney(item.bonuses)}` : "-"}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-purple-600">
                                  {item.voucherCompensation > 0 ? `-${formatMoney(item.voucherCompensation)}` : "-"}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                  {formatMoney(item.finalDebt)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setPreview(null); setBreakdown([]); }}
                className="flex-1 rounded-xl border border-gray-300 py-4 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100"
              >
                {isAlreadyPaid ? "CERRAR VISTA" : "CANCELAR"}
              </button>
              
              {isAlreadyPaid ? (
                <PDFDownloadLink
                  document={<SettlementDocument data={preview as any} />}
                  fileName={`Rendicion_${preview.driverName}_${DateTime.fromISO(preview.date).toISODate()}.pdf`}
                  className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-95 max-md:text-base"
                >
                  {({ loading }) => loading ? "Generando..." : <><FileText className="size-6" /> DESCARGAR COMPROBANTE</>}
                </PDFDownloadLink>
              ) : (
                <button
                  onClick={() => setIsConfirming(true)}
                  className="flex flex-2 items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-70 max-md:gap-1 max-md:text-base"
                  disabled={!user || user.role !== "ADMIN"}
                >
                  <CheckCircle2 className="size-6 max-md:size-5" /> CONFIRMAR Y CERRAR
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${isAlreadyPaid ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-800">
                <FileText className="h-5 w-5 text-blue-600" />
                Registrar descuentos
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setNewItemType("BOLETA")} className={`rounded-lg border p-2 text-xs font-bold transition-all ${newItemType === "BOLETA" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>BOLETA</button>
                  <button onClick={() => setNewItemType("TRANSFER")} className={`rounded-lg border p-2 text-xs font-bold transition-all ${newItemType === "TRANSFER" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500"}`}>TRANSF.</button>
                  <button onClick={() => setNewItemType("EXCHANGE")} className={`rounded-lg border p-2 text-xs font-bold transition-all ${newItemType === "EXCHANGE" ? "border-orange-200 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500"}`}>CAMBIO</button>
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                    value={newItemScheme}
                    onChange={(e) => setNewItemScheme(e.target.value !== "" ? Number(e.target.value) : "")}
                  >
                    <option value="">Seleccionar Esquema Aplicado...</option>
                    {preview.schemesBreakdown.map((s) => (
                      <option key={s.schemeId} value={s.schemeId}>
                        {s.schemeName}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 rounded-lg border border-gray-300 p-2 text-sm"
                      value={newItemProduct}
                      onChange={(e) => setNewItemProduct(e.target.value)}
                      disabled={newItemScheme === ""}
                    >
                      <option value="">Producto...</option>
                      {newItemScheme !== "" && preview.schemesBreakdown
                        .find((s) => s.schemeId === Number(newItemScheme))
                        ?.items.map((item) => {
                          const prod = products.find((p) => p.id === item.productId);
                          if (!prod) return null;
                          return (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} (Max: {item.totalSold})
                            </option>
                          );
                        })}
                    </select>
                    <input
                      type="number"
                      placeholder="Cant."
                      className="w-20 rounded-lg border border-gray-300 p-2 text-center text-sm font-bold"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                    />
                  </div>
                </div>

                {newItemType !== "EXCHANGE" && (
                  <div className="relative">
                    {newItemClient ? (
                      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-bold text-blue-900">{selectedClientName}</p>
                        </div>
                        <button onClick={() => setNewItemClient("")} className="ml-2 rounded p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          {!isCreatingClient ? (
                            <>
                              <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Buscar cliente..."
                                  className="w-full rounded-lg border border-gray-300 p-2 pl-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  value={clientSearch}
                                  onChange={(e) => { setClientSearch(e.target.value); setIsClientOpen(true); }}
                                  onFocus={() => setIsClientOpen(true)}
                                />
                              </div>
                              <button onClick={() => setIsCreatingClient(true)} className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-green-600 hover:border-green-300 hover:bg-green-50" title="Nuevo Cliente"><Plus className="h-5 w-5" /></button>
                            </>
                          ) : (
                            <div className="flex flex-1 flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500">Nuevo Cliente</span>
                                <button onClick={() => setIsCreatingClient(false)}><X className="h-4 w-4 text-gray-400" /></button>
                              </div>
                              <input autoFocus placeholder="Nombre" className="w-full rounded border border-gray-300 p-1.5 text-sm" value={newClientData.name} onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value }) } />
                              <select className="w-full rounded border border-gray-300 p-1.5 text-sm" value={newClientData.type} onChange={(e) => setNewClientData({ ...newClientData, type: e.target.value }) } >
                                <option value="FINAL">Consumidor Final</option>
                                <option value="REVENDEDOR">Revendedor</option>
                              </select>
                              <button onClick={handleCreateClient} className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-green-500 py-1.5 text-xs font-bold text-white hover:bg-green-600"><Check className="h-3 w-3" /> Crear</button>
                            </div>
                          )}
                        </div>

                        {isClientOpen && !isCreatingClient && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsClientOpen(false)} />
                            <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                              {filteredClients.map((c) => (
                                <li key={c.id} onClick={() => handleSelectClient(c)} className="cursor-pointer border-b border-gray-50 px-3 py-2 text-sm hover:bg-blue-50">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-700">{c.name}</span>
                                    {c.type === "REVENDEDOR" && <span className="rounded bg-yellow-100 px-1 text-[10px] text-yellow-800">MAY</span>}
                                  </div>
                                </li>
                              ))}
                              {filteredClients.length === 0 && <li className="p-3 text-center text-xs text-gray-400">No encontrado</li>}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleAddBreakdownItem}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2 font-bold text-white transition-colors hover:bg-black"
                >
                  <Plus className="h-4 w-4" /> AGREGAR AL DESGLOSE
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-hidden overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50">
              {breakdown.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-sm">No hay descuentos registrados.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {breakdown.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 hover:bg-gray-50">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${item.type === "BOLETA" ? "bg-blue-100 text-blue-700" : item.type === "TRANSFER" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                            {item.type}
                          </span>
                          <span className="text-sm font-bold text-gray-800">
                            {item.quantity} x {item.productName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                           <span className="font-bold text-gray-700">{item.schemeName}</span>
                           {item.clientName ? ` • ${item.clientName}` : ""}
                        </p>
                      </div>
                      <button onClick={() => removeBreakdownItem(item.id)} disabled={isAlreadyPaid} className={`rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 ${isAlreadyPaid ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 xl:col-span-3">
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">🚛</span>
              Auditoría de Viajes
            </h3>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {preview.routeDetails.map((route, index) => (
                <article key={route.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <header className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">Viaje #{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                      <Clock className="h-3 w-3" />
                      {DateTime.fromISO(route.closedAt).toLocaleString(DateTime.TIME_SIMPLE).toLowerCase().replace(" ", "")}
                    </div>
                  </header>

                  <div className="flex-1 p-4">
                    <ul className="space-y-3">
                      {route.items.map((item, idx) => (
                        <li key={idx} className="text-sm">
                          <div className="mb-1 flex justify-between font-bold text-gray-800">
                            <span>{item.productName}</span>
                            <span className="text-blue-600">{item.soldCount} u. vendió</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-900">{item.initialLoad}</span>
                              <span className="text-[10px] tracking-wide text-gray-400 uppercase">Cargó</span>
                            </div>
                            <div className="mx-2 h-px flex-1 bg-gray-200"></div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] tracking-wide text-gray-400 uppercase">Devolvió</span>
                              <span className="font-medium text-gray-900">{item.returnedLoad}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-center text-xs text-gray-400">
                    ID: {route.id.slice(0, 8)}...
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      )}

      {isConfirming && preview && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-green-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">💰</div>
              <h3 className="text-xl font-bold text-gray-900">Confirmar el ingreso de dinero</h3>
              <p className="mt-2 text-sm text-gray-600">Verifica que tienes el dinero físico en mano.</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase">Total de efectivo a recibir</p>
                <p className="mt-1 text-4xl font-black text-green-600">{formatMoney(preview.totalToPay)}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsConfirming(false)} className="flex-1 rounded-xl border border-gray-300 py-3 font-bold text-gray-600 hover:bg-gray-100">Revisar</button>
                <button onClick={handleProcessPayment} disabled={loading} className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white shadow-lg hover:bg-green-700">
                  {loading ? "Procesando..." : "CONFIRMAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && lastSettlement && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">✅</div>
            <h2 className="mb-2 text-2xl font-black text-gray-800">¡Rendición Exitosa!</h2>
            <p className="mb-8 text-gray-500">El dinero ha ingresado a caja.</p>
            <div className="flex flex-col gap-3">
              <PDFDownloadLink
                document={<SettlementDocument data={lastSettlement as any} />}
                fileName={`Rendicion_${lastSettlement.driverName}_${DateTime.fromJSDate(new Date()).toLocal()}.pdf`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg hover:bg-blue-700"
              >
                {({ loading }) => loading ? "Generando PDF..." : <><FileText className="h-5 w-5" /> Descargar Comprobante</>}
              </PDFDownloadLink>
              <button onClick={() => setShowSuccessModal(false)} className="w-full rounded-xl py-3 font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600">Cerrar Ventana</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}