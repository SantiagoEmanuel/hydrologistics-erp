import { shiftService, type DailyReportItem } from "@/services/shift.service";
import {
  AlertCircle,
  ArchiveRestore,
  Calendar,
  Clock,
  PlayCircle,
  PlusCircle,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function CashReports() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [shifts, setShifts] = useState<DailyReportItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historicalData, setHistoricalData] = useState({
    shiftType: "MORNING",
    operatorName: "",
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await shiftService.getDailyReport(date);
      setShifts(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar reportes");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [date]);

  const handleCreateHistorical = async () => {
    if (!historicalData.operatorName.trim()) {
      return toast.error("El nombre del operador es obligatorio");
    }

    try {
      const newShift = await shiftService.createHistorical({
        targetDate: date,
        shiftType: historicalData.shiftType,
        operatorName: historicalData.operatorName,
      });

      toast.success("Turno histórico preparado para carga");
      setIsModalOpen(false);

      navigate(`/dashboard/pos?shiftId=${newShift.id}`);
    } catch (error: any) {
      toast.error(error.message || "Error al crear turno histórico");
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte de Cajas</h1>
          <p className="mt-1 text-gray-500">
            Resumen detallado de turnos Mañana, Tarde e Históricos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
          >
            <PlusCircle size={20} />
            Registrar Caja Pasada
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Viendo fecha
              </span>
              <input
                type="date"
                className="bg-transparent text-lg font-bold text-gray-900 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Carga Histórica
                </h2>
                <p className="text-sm text-gray-500">Fecha: {date}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                <X className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Seleccionar Turno
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {["MORNING", "AFTERNOON"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setHistoricalData({ ...historicalData, shiftType: t })
                      }
                      className={`rounded-2xl border-2 py-4 font-bold transition-all ${
                        historicalData.shiftType === t
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-gray-100 bg-gray-50 text-gray-400"
                      }`}
                    >
                      {t === "MORNING" ? "☀️ Mañana" : "🌇 Tarde"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Nombre del Operador
                </label>
                <input
                  type="text"
                  placeholder="Nombre del responsable..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-blue-500"
                  value={historicalData.operatorName}
                  onChange={(e) =>
                    setHistoricalData({
                      ...historicalData,
                      operatorName: e.target.value,
                    })
                  }
                />
              </div>

              <button
                onClick={handleCreateHistorical}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 font-bold text-white shadow-xl transition-all hover:bg-black active:scale-95"
              >
                <PlayCircle size={20} />
                Comenzar Registro de Ventas
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 w-full animate-pulse items-center justify-center rounded-3xl bg-gray-50 text-lg text-gray-400">
          Cargando datos de los turnos...
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
          <ArchiveRestore className="mb-3 h-12 w-12 opacity-20" />
          <p>No hay cajas registradas en esta fecha.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`flex min-h-[500px] flex-col overflow-hidden rounded-3xl border transition-all hover:shadow-xl ${
                shift.status === "EDITING"
                  ? "border-orange-300 ring-2 shadow-orange-100 ring-orange-100"
                  : "border-gray-200 bg-white shadow-lg"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b border-gray-100 p-6 ${
                  shift.status === "EDITING" ? "bg-orange-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md ${
                      shift.status === "EDITING"
                        ? "bg-orange-500 shadow-orange-200"
                        : "bg-blue-600 shadow-blue-200"
                    }`}
                  >
                    <User size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 capitalize">
                      {shift.userName || "Sin Operador"}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Clock size={16} />
                      <span className="rounded-md bg-white px-2 py-0.5 shadow-sm">
                        {new Date(shift.openedAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {shift.closedAt
                          ? new Date(shift.closedAt).toLocaleTimeString(
                              "es-AR",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : " ..."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`rounded-xl px-4 py-2 text-xs font-black tracking-widest uppercase shadow-sm ${
                      shift.status === "CLOSED"
                        ? "bg-green-100 text-green-800"
                        : shift.status === "EDITING"
                          ? "bg-orange-200 text-orange-900"
                          : "animate-pulse bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {shift.status === "CLOSED"
                      ? "CERRADO"
                      : shift.status === "EDITING"
                        ? "EN EDICIÓN"
                        : "EN CURSO"}
                  </div>

                  {shift.status === "EDITING" && (
                    <button
                      onClick={() =>
                        navigate(`/dashboard/pos?shiftId=${shift.id}`)
                      }
                      className="flex items-center gap-1 text-[10px] font-bold text-orange-700 hover:underline"
                    >
                      <PlayCircle size={12} /> CONTINUAR CARGA
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-x-auto p-2">
                {shift.items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-gray-400">
                    <AlertCircle className="h-10 w-10 opacity-30" />
                    <p>Aún no hay ventas registradas en este turno.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="text-xs tracking-wider text-gray-400 uppercase">
                      <tr>
                        <th className="px-6 py-4 font-bold">Producto</th>
                        <th className="px-6 py-4 text-center font-bold">
                          Tipo Cliente
                        </th>
                        <th className="px-6 py-4 text-right font-bold">
                          Cant.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {shift.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="group transition-colors hover:bg-blue-50/50"
                        >
                          <td className="px-6 py-5">
                            <span className="block text-lg font-bold text-gray-800 group-hover:text-blue-700">
                              {item.productName}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold tracking-wide uppercase ${
                                item.clientType === "REVENDEDOR"
                                  ? "border-purple-200 bg-purple-100 text-purple-700"
                                  : "border-gray-200 bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.clientType === "REVENDEDOR"
                                ? "👑 Mayorista"
                                : "👤 Final"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="inline-block text-2xl font-black text-gray-900 transition-transform group-hover:scale-110">
                              {item.quantity}
                            </span>
                            <span className="ml-1 text-xs font-medium text-gray-400">
                              unid.
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div
                className={`${shift.status === "EDITING" ? "bg-orange-950" : "bg-gray-900"} p-6 text-white`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div
                      className={`${shift.status === "EDITING" ? "bg-orange-900" : "bg-gray-800"} rounded-lg p-2`}
                    >
                      <Wallet
                        className={`h-6 w-6 ${shift.status === "EDITING" ? "text-orange-400" : "text-green-400"}`}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase">
                        Total Recaudado
                      </p>
                      <p className="text-xs">
                        {shift.status === "EDITING"
                          ? "Monto provisional"
                          : "Dinero físico en caja"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-mono text-4xl font-black tracking-tight ${shift.status === "EDITING" ? "text-orange-400" : "text-green-400"}`}
                    >
                      ${" "}
                      {shift.finalBalance
                        ? shift.finalBalance.toLocaleString("es-AR")
                        : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-20 md:hidden" />
    </div>
  );
}
