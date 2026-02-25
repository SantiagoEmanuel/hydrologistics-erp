import UserModal from "@/components/UserModal";
import { useAuth } from "@/hook/useAuth";
import { api } from "@/lib/api-client";
import {
  CarIcon,
  CheckCircle2,
  Edit2,
  Plus,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UserRole = "ADMIN" | "EMPLOYEE" | "DRIVER";

interface User {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { register, isLoading } = useAuth();

  const getAllUsers = async () => {
    const allUsers = await api("/auth/all");
    setUsers(allUsers);
  };
  useEffect(() => {
    getAllUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenCreate = async () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de desactivar este usuario?")) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
      );
      toast.success("Usuario desactivado correctamente");
    }
  };

  const handleSaveUser = (formData: any) => {
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)),
      );
      toast.success("Usuario actualizado");
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        ...formData,
        isActive: true,
        lastLogin: "Nunca",
      };
      setUsers((prev) => [...prev, newUser]);
      register(formData);
      toast.success("Usuario creado exitosamente");
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-500">
            Administra el acceso y roles del personal
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o usuario..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <p>Cargando usuarios</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-white ${
                              user.role === "ADMIN"
                                ? "bg-purple-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "border-purple-100 bg-purple-50 text-purple-700"
                              : "border-blue-100 bg-blue-50 text-blue-700"
                          }`}
                        >
                          <UserRoleIcon role={user.role} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" /> Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" /> Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="rounded-lg p-2 text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg p-2 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No se encontraron usuarios que coincidan con tu búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

function UserRoleIcon({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return (
      <>
        <Shield className="h-3 w-3" />
        Administrador
      </>
    );
  } else if (role === "EMPLOYEE") {
    return (
      <>
        <UserIcon className="h-3 w-3" /> Empleado
      </>
    );
  } else if (role === "DRIVER") {
    return (
      <>
        <CarIcon className="h-3 w-3" />
        Conductor
      </>
    );
  }
  return null;
}
