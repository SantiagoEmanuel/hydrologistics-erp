import ShiftGuard from "@/components/layout/ShiftGuard";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/hook/useAuth";
import { Navigate, Outlet } from "react-router";
import { Toaster } from "sonner";

export default function MainLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/"} />;
  }

  return (
    <ShiftGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white max-sm:hidden">
          <Sidebar />
        </aside>
        <main className="relative h-full flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </ShiftGuard>
  );
}
