import { useAuth } from "@/hook/useAuth";
import MobileBottomNav from "@/layout/MobileButtonNav";
import Sidebar from "@/layout/Sidebar";
import { Navigate, Outlet } from "react-router";
import { Toaster } from "sonner";

export default function MainLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 md:flex-row">
      <aside className="hidden h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white md:block">
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      <MobileBottomNav />

      <Toaster richColors position="top-right" />
    </div>
  );
}
