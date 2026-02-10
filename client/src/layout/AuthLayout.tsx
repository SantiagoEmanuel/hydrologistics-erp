import NavMenu from "@/components/layout/navigation/NavMenu";
import { Outlet } from "react-router";
import { Toaster } from "sonner";

export default function AuthLayout() {
  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-gray-50 p-8">
      <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white max-md:hidden">
        <h1 className="text-2xl font-bold text-gray-500">HydroLogistics</h1>
        <p className="text-xs font-semibold text-gray-500">Servicio ERP</p>
        <hr className="my-5 border-gray-300" />
        <NavMenu />
      </aside>
      <main className="relative h-full flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
