import LogoutButton from "@/components/ui/LogoutButton";
import { navigationLinks } from "@/constants/navigation";
import { useAuth } from "@/hook/useAuth";
import { NavLink } from "react-router";

interface NavMenuProps {
  className?: string;
}

export default function NavMenu({ className = "" }: NavMenuProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <nav className={`flex flex-col gap-2 ${className}`}>
        {navigationLinks.map((item) => {
          if (item.type === "private") {
            return null;
          }

          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-all duration-200 ${
                  isActive
                    ? "border-r-4 border-sky-500 bg-sky-100 text-sky-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                } `
              }
            >
              <span>{item.name}</span>
            </NavLink>
          );
        })}
        <LogoutButton />
      </nav>
    );
  }

  return (
    <nav className={`flex flex-col gap-2 ${className}`}>
      {navigationLinks.map((item) => {
        if (item.type === "public") {
          return null;
        }

        if (item.permissions && item.permissions !== user.role) {
          return null;
        }

        return (
          <NavLink
            key={item.url}
            to={item.url}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-all duration-200 ${
                isActive
                  ? "border-r-4 border-sky-500 bg-sky-100 text-sky-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              } `
            }
          >
            <span>{item.name}</span>
          </NavLink>
        );
      })}
      <LogoutButton />
    </nav>
  );
}
