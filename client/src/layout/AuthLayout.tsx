import NavMenu from "@/layout/navigation/NavMenu";
import { Outlet } from "react-router";
import { Toaster } from "sonner";

export default function AuthLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4 max-md:hidden">
        <h1 className="text-2xl font-bold text-gray-500">HydroLogistics</h1>
        <p className="text-xs font-semibold text-gray-500">Servicio ERP</p>
        <hr className="my-5 border-gray-300" />
        <NavMenu />
      </aside>
      <main className="w-full">
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
