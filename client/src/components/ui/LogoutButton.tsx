import { useAuth } from "@/hook/useAuth";

export default function LogoutButton() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={logout}
      className="rounded-md bg-gray-100 px-2 py-2 text-left transition-all hover:border-r-4 hover:border-r-black hover:bg-orange-400 hover:text-white"
    >
      Cerrar sesión
    </button>
  );
}
