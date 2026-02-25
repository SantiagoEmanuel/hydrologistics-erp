import ClientSelector from "@/components/POS/ClientSelector";
import { useProducts } from "@/hook/useProducts";
import { useCartStore } from "@/store/useCartStore";
import {
  ArchiveRestore,
  ChevronUp,
  CreditCard,
  FileText,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { saleService } from "@/services/sale.service";
import { shiftService } from "@/services/shift.service";

import { useShiftStore } from "@/store/useShiftStore";
import {
  motion,
  type PanInfo,
  useAnimation,
  useDragControls,
} from "framer-motion";
import { DateTime } from "luxon";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export default function POS() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const historicalShiftId = searchParams.get("shiftId");
  const isHistoricalMode = !!historicalShiftId;

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
    setItemQuantity,
  } = useCartStore();

  const total = getTotal();
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<number>(1);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [showModalToHourlySale, setShowModalToHourlySale] = useState<{
    show: boolean;
    saleType: "PAID" | "UNPAID";
  }>({ show: false, saleType: "PAID" });
  const [hourlySaleData, setHourlySaleData] = useState<string>("");

  const [isProcessingHistory, setIsProcessingHistory] = useState(false);

  const { currentShift } = useShiftStore();

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const controls = useAnimation();
  const dragControls = useDragControls();

  useEffect(() => {
    getAllPayments();
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      if (isMobileCartOpen) {
        controls.start("open");
      } else {
        controls.start("closed");
      }
    } else {
      controls.set("open");
    }
  }, [isMobileCartOpen, controls, isDesktop]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  const getPrice = (product: any) =>
    selectedClient?.type === "REVENDEDOR"
      ? product.wholesalePrice
      : product.price;

  const handleTransaction = async (status: "PAID" | "UNPAID") => {
    if (items.length === 0) return;

    if (!isHistoricalMode) {
      buyCart(status, paymentMethod, currentShift!.id);
      setIsMobileCartOpen(false);
      return;
    }

    if (!historicalShiftId) return;

    setShowModalToHourlySale({ show: true, saleType: status });
    setIsProcessingHistory(true);
  };

  const handleFinalizeTransaction = async () => {
    if (!hourlySaleData) {
      toast.error("Debe seleccionar la fecha y hora de la venta histórica.");
      setIsProcessingHistory(false);
      return;
    }
    if (!historicalShiftId) {
      toast.error("ID de turno histórico no encontrado.");
      setIsProcessingHistory(false);
      return;
    }

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        clientId: selectedClient?.id,
        paidStatus: showModalToHourlySale.saleType,
        paymentMethodId: paymentMethod,
        newDate: DateTime.fromISO(hourlySaleData).toUTC().toISO()!,
      };

      await saleService.createSale(historicalShiftId, payload);

      toast.success("Venta histórica registrada");
      clearCart();
      setIsMobileCartOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al registrar venta histórica");
    } finally {
      setIsProcessingHistory(false);
      setPaymentMethod(1);
      setShowModalToHourlySale({ show: false, saleType: "PAID" });
    }
  };

  const handleFinalizeHistory = async () => {
    if (!historicalShiftId) return;

    if (
      !confirm(
        "¿Estás seguro de que terminaste de cargar TODAS las ventas de ese turno? Esta acción cerrará la caja definitivamente.",
      )
    ) {
      return;
    }
    setIsProcessingHistory(true);
    try {
      await shiftService.closeEditing(historicalShiftId);

      toast.success("Carga histórica finalizada correctamente.");
      navigate("/dashboard/admin/reports");
    } catch (error: any) {
      toast.error("Error al cerrar la carga histórica.");
    } finally {
      setIsProcessingHistory(false);
    }
  };

  const drawerVariants = {
    open: { y: -50 },
    closed: { y: "calc(100% - 135px)" },
  };

  const onDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.y > threshold) setIsMobileCartOpen(false);
    else if (info.offset.y < -threshold) setIsMobileCartOpen(true);
    else controls.start(isMobileCartOpen ? "open" : "closed");
  };

  return (
    <div className="relative flex h-[calc(100vh-110px)] w-full flex-col overflow-hidden bg-gray-100 md:flex-row">
      <section className="flex h-full flex-1 flex-col overflow-hidden">
        {isHistoricalMode && (
          <div className="z-20 flex flex-col items-center justify-between gap-3 border-b border-orange-200 bg-orange-100 px-4 py-3 text-orange-900 shadow-sm sm:flex-row">
            <div className="flex animate-pulse items-center gap-2 font-bold">
              <ArchiveRestore className="h-5 w-5" />
              <span>MODO HISTÓRICO: Editando caja pasada</span>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => navigate("/dashboard/admin/reports")}
                className="flex-1 rounded border border-orange-300 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-200 sm:flex-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizeHistory}
                disabled={isProcessingHistory}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 sm:flex-none"
              >
                {isProcessingHistory ? "Procesando..." : "FINALIZAR CARGA"}
              </button>
            </div>
          </div>
        )}

        <div className="z-10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isHistoricalMode ? "Carga de Ventas" : "Punto de Venta"}
              </h1>
              <p className="text-xs text-gray-500">
                {selectedClient
                  ? `Precios Mayoristas para: ${selectedClient.name}`
                  : "Precios Público General"}
              </p>
            </div>
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 pb-22 sm:grid-cols-3 md:pb-4 lg:grid-cols-4 xl:grid-cols-5">
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

      <aside className="fixed inset-x-0 bottom-0 z-30 flex h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] max-md:hidden md:static md:h-full md:max-w-96 md:translate-y-0 md:rounded-none md:border-l md:border-gray-200 md:shadow-none">
        <header>
          <div className="hidden items-center justify-between border-b border-gray-100 p-4 md:flex">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
              <ShoppingCart className="h-5 w-5" />
              {isHistoricalMode ? "Ticket Histórico" : "Ticket Actual"}
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
        </header>
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
                      onClick={() => decreaseItem(Number(product.id))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-red-500 transition-all hover:bg-red-50 active:scale-90"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value);
                        if (!isNaN(qty) && qty > 0)
                          setItemQuantity(product.id, qty);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="h-8 w-14 rounded-md border border-gray-200 text-center text-sm font-bold text-gray-900 outline-none focus:border-blue-500"
                    />

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
                disabled={items.length === 0 || isBuying || isProcessingHistory}
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
                disabled={items.length === 0 || isBuying || isProcessingHistory}
                onClick={() => handleTransaction("PAID")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isHistoricalMode
                    ? "bg-orange-600 shadow-orange-200 hover:bg-orange-700"
                    : "bg-green-600 shadow-green-200 hover:bg-green-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {isHistoricalMode ? "GUARDAR" : "COBRAR"}
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  {isHistoricalMode ? "Cargar en Historial" : "Cerrar y Cobrar"}
                </span>
              </button>

              <button
                disabled={items.length === 0 || isBuying || isProcessingHistory}
                onClick={() => handleTransaction("UNPAID")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gray-500 py-3 font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-gray-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {isHistoricalMode ? "PENDIENTE" : "TOMAR"}
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Guardar s/Pago
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isMobileCartOpen && !isDesktop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileCartOpen(false)}
        />
      )}

      <motion.aside
        animate={isDesktop ? undefined : controls}
        variants={isDesktop ? undefined : drawerVariants}
        initial={isDesktop ? false : "closed"}
        style={{ transform: isDesktop ? "none" : undefined }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        drag={isDesktop ? false : "y"}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        className="fixed inset-x-0 bottom-0 z-30 flex h-[85vh] flex-col rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:static md:hidden md:h-full md:w-96 md:translate-y-0 md:rounded-none md:border-l md:border-gray-200 md:shadow-none"
      >
        <div
          className="flex cursor-grab flex-col items-center rounded-t-2xl border-b border-gray-100 bg-white pt-2 pb-4 active:cursor-grabbing md:hidden"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
          style={{ touchAction: "none" }}
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

            <div>
              <button
                onClick={() => {
                  clearCart();
                }}
                disabled={items.length === 0 || isBuying || isProcessingHistory}
              >
                <Trash2
                  className={`size-7 rounded-xl bg-red-500 p-1 text-white transition-colors ${
                    items.length === 0 ? "pointer-events-none" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden items-center justify-between border-b border-gray-100 p-4 md:flex">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <ShoppingCart className="h-5 w-5" />
            {isHistoricalMode ? "Ticket Histórico" : "Ticket Actual"}
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
                      onClick={() => decreaseItem(Number(product.id))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-red-500 transition-all hover:bg-red-50 active:scale-90"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value);
                        if (!isNaN(qty) && qty > 0)
                          setItemQuantity(product.id, qty);
                      }}
                      onFocus={(e) => e.target.select()}
                      className="h-8 w-14 rounded-md border border-gray-200 text-center text-sm font-bold text-gray-900 outline-none focus:border-blue-500"
                    />

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
                disabled={items.length === 0 || isBuying || isProcessingHistory}
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
                disabled={items.length === 0 || isBuying || isProcessingHistory}
                onClick={() => handleTransaction("PAID")}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 font-bold text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isHistoricalMode
                    ? "bg-orange-600 shadow-orange-200 hover:bg-orange-700"
                    : "bg-green-600 shadow-green-200 hover:bg-green-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {isHistoricalMode ? "GUARDAR" : "COBRAR"}
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  {isHistoricalMode ? "Cargar en Historial" : "Cerrar y Cobrar"}
                </span>
              </button>

              <button
                disabled={items.length === 0 || isBuying || isProcessingHistory}
                onClick={() => handleTransaction("UNPAID")}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-gray-500 py-3 font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-gray-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {isHistoricalMode ? "PENDIENTE" : "TOMAR"}
                </div>
                <span className="text-[10px] font-normal opacity-80">
                  Guardar s/Pago
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
      {showModalToHourlySale.show && (
        <ModalToHourlySale
          onChange={(hour) => {
            setHourlySaleData(hour);
          }}
          onSubmit={handleFinalizeTransaction}
          cancel={() => {
            setShowModalToHourlySale({
              ...showModalToHourlySale,
              show: false,
            });
            setIsProcessingHistory(false);
          }}
        />
      )}
    </div>
  );
}

function ModalToHourlySale({
  onChange,
  onSubmit,
  cancel,
}: {
  onChange: (hour: string) => void;
  onSubmit: () => void;
  cancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-lg bg-white p-6">
        <button
          className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-red-500 text-white"
          onClick={cancel}
        >
          <XIcon />
        </button>
        <ArchiveRestore className="h-10 w-10 text-orange-500" />
        <h3 className="animate-pulse text-center text-lg font-bold text-gray-800">
          Registrando Venta Histórica...
        </h3>
        <input
          type="datetime-local"
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          onClick={onSubmit}
          className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
        >
          Confirmar
        </button>
        <p className="text-center text-sm text-gray-500">
          Esto puede tardar unos segundos. Por favor, no cierres esta ventana.
        </p>
      </div>
    </div>
  );
}
