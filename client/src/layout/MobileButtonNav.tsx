import { MAX_BEFORE_MORE } from "@/constants/maxMobileNavSize";
import { navigationLinks } from "@/constants/navigation";
import { useAuth } from "@/hook/useAuth";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router";

export default function MobileBottomNav() {
  const { user, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const allowedItems = navigationLinks.filter((item) => {
    if (item.type === "public") return false;
    if (item.permissions && !item.permissions.includes(user.role)) {
      return false;
    }
    return true;
  });

  const showMoreButton = allowedItems.length > MAX_BEFORE_MORE;

  const primaryItems = showMoreButton
    ? allowedItems.slice(0, MAX_BEFORE_MORE)
    : allowedItems;

  const secondaryItems = showMoreButton
    ? allowedItems.slice(MAX_BEFORE_MORE)
    : [];

  return (
    <>
      {isMoreOpen && showMoreButton && (
        <>
          <div
            className="animate-in fade-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />

          <div
            ref={menuRef}
            className="animate-in slide-in-from-bottom-5 fixed right-4 bottom-20 left-4 z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl duration-200"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="text-sm font-bold text-gray-500">
                Más opciones
              </span>
              <button onClick={() => setIsMoreOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="grid max-h-[60vh] grid-cols-1 gap-1 overflow-y-auto p-2">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    onClick={() => setIsMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                        isActive
                          ? "bg-blue-50 font-bold text-blue-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`
                    }
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                );
              })}

              <hr className="my-1 border-gray-100" />

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}

      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.03)] md:hidden">
        <div className="flex h-16 items-center justify-around px-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const shortName = item.name.split(" ")[0];

            return (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={() => setIsMoreOpen(false)}
                className={({ isActive }) =>
                  `flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-400"
                  }`
                }
              >
                <div className="relative">
                  {Icon && <Icon className="h-6 w-6" />}
                  <div
                    className={
                      window.location.pathname === item.url
                        ? "absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-600"
                        : "hidden"
                    }
                  />
                </div>
                <span className="max-w-16 truncate text-center text-[10px] leading-none font-medium">
                  {shortName}
                </span>
              </NavLink>
            );
          })}

          {showMoreButton ? (
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex h-full w-full flex-col items-center justify-center gap-1 transition-colors ${
                isMoreOpen ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div className="relative rounded-lg p-1">
                <MoreHorizontal className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium">Más</span>
            </button>
          ) : (
            <button
              onClick={logout}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-red-400 transition-colors hover:text-red-600"
            >
              <div className="relative p-1">
                <LogOut className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium">Salir</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
