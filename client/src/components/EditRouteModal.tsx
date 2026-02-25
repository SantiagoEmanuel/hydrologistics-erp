import { routeService } from "@/services/route.service";
import { Calendar, X } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  route: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRouteModal({ route, onClose, onSuccess }: Props) {
  const [driverName, setDriverName] = useState(route.driverName);
  const [observations, setObservations] = useState(route.observations || "");
  const [dateStr, setDateStr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route.date) {
      setDateStr(DateTime.fromISO(route.date).toFormat("yyyy-MM-dd'T'HH:mm"));
    }
  }, [route]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        driverName,
        observations,
        date: dateStr ? DateTime.fromISO(dateStr).toISO()! : undefined,
      };

      await routeService.update(route.id, payload);
      toast.success("Datos actualizados");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <h3 className="font-bold text-gray-800">Editar Ruta</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700">
              <Calendar size={16} className="text-blue-600" /> Fecha/Hora Salida
            </label>
            <input
              type="datetime-local"
              required
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              Chofer
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-gray-700">
              Observaciones
            </label>
            <textarea
              className="h-24 w-full resize-none rounded-xl border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
