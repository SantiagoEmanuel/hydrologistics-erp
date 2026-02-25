import Button from "@/components/ui/Button";
import { navigationLinks } from "@/constants/navigation";
import { useAuth } from "@/hook/useAuth";
import { LogOut } from "lucide-react";
import { NavLink } from "react-router";

export default function NavMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const visibleLinks = navigationLinks.filter((item) => {
    if (item.type === "public") return false;

    if (!item.permissions) return true;

    return item.permissions.includes(user.role);
  });

  return (
    <nav className="flex flex-col gap-2">
      {visibleLinks.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            {Icon && (
              <Icon
                className={`size-5 transition-colors ${"text-gray-400 group-hover:text-gray-600"}`}
              />
            )}
            <span>{item.name}</span>
          </NavLink>
        );
      })}
      <hr className="my-2 border-gray-300" />

      <div className="">
        <Button
          className="group flex items-center justify-start gap-2"
          onClick={logout}
          buttonType="secondary"
          textAlign="left"
        >
          <LogOut className="size-5 text-gray-400 transition-colors group-hover:text-gray-600" />
          Cerrar Sesión
        </Button>
      </div>
    </nav>
  );
}
