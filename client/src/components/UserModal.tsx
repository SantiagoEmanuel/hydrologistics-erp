import type { User } from "@/services/auth.service";
import { CarIcon, Shield, User as UserIcon, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: Partial<User> | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    username: user?.username || "",
    role: user?.role || "EMPLOYEE",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.username)
      return toast.error("Completa los campos obligatorios");
    if (!user && !formData.password)
      return toast.error("La contraseña es obligatoria para nuevos usuarios");

    onSave(formData);
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800">
            {user ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre Completo
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej: Juan Pérez"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value.trim() })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre de Usuario
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej: juanp"
              value={formData.username}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  username: e.target.value.trim().toLocaleLowerCase(),
                })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Contraseña{" "}
              {user && (
                <span className="font-normal text-gray-400">
                  (Dejar en blanco para mantener)
                </span>
              )}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value.trim() })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Rol
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "EMPLOYEE" })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  formData.role === "EMPLOYEE"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Empleado</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  formData.role === "ADMIN"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Administrador</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "DRIVER" })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  formData.role === "DRIVER"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <CarIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Conductor</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
