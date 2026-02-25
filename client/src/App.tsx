import { useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import AuthGuard from "./guards/Auth";
import ShiftGuard from "./guards/Shift";
import { useAuth } from "./hook/useAuth";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import Login from "./pages/auth/Login";
import AccountsReceivable from "./pages/dashboard/accounts/AccountsReceivable";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import CashReports from "./pages/dashboard/admin/CashReports";
import Inventory from "./pages/dashboard/admin/InventoryManagement";
import RoutesManagement from "./pages/dashboard/admin/RoutesManagement";
import UserManagement from "./pages/dashboard/admin/UserManagement";
import Dashboard from "./pages/dashboard/Index";
import POS from "./pages/dashboard/POS/POS";
import RoutesPage from "./pages/dashboard/routes/Router";
import Settlements from "./pages/dashboard/routes/Settlements";
import SalesHistory from "./pages/dashboard/sales/SalesHistory";

export default function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  const router = createBrowserRouter([
    {
      path: "/auth",
      Component: AuthLayout,
      children: [{ path: "login", Component: Login }],
    },
    {
      path: "/",
      element: <AuthGuard />,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: "dashboard",
          Component: MainLayout,
          children: [
            {
              index: true,
              element: <DashboardIndex />,
            },
            {
              element: (
                <AuthGuard allowedRoles={["ADMIN", "MANAGER", "EMPLOYEE"]} />
              ),
              children: [
                {
                  path: "pos",
                  element: (
                    <ShiftGuard>
                      <POS />
                    </ShiftGuard>
                  ),
                },
              ],
            },
            {
              element: (
                <AuthGuard allowedRoles={["ADMIN", "MANAGER", "DRIVER"]} />
              ),
              children: [
                { path: "routes", Component: RoutesPage },
                { path: "settlement", Component: Settlements },
              ],
            },
            {
              element: <AuthGuard allowedRoles={["ADMIN", "MANAGER"]} />,
              children: [
                {
                  path: "accounts-receivable",
                  element: (
                    <ShiftGuard>
                      <AccountsReceivable />
                    </ShiftGuard>
                  ),
                },
                { path: "sales-history", Component: SalesHistory },
              ],
            },
            {
              element: <AuthGuard allowedRoles={["ADMIN"]} />,
              children: [
                { path: "admin/dashboard", Component: AdminDashboard },
                { path: "admin/dashboard/users", Component: UserManagement },
                { path: "admin/dashboard/inventory", Component: Inventory },
                { path: "admin/dashboard/reports", Component: CashReports },
                {
                  path: "admin/dashboard/new-routes",
                  Component: RoutesManagement,
                },
              ],
            },
          ],
        },
      ],
    },
    { path: "*", element: <Navigate to="/auth/login" replace /> },
  ]);

  return <RouterProvider router={router} />;
}

function DashboardIndex() {
  const { user } = useAuth();

  if (user?.role === "DRIVER")
    return <Navigate to="/dashboard/routes" replace />;
  if (user?.role === "EMPLOYEE")
    return <Navigate to="/dashboard/pos" replace />;

  return (
    <ShiftGuard>
      <Dashboard />
    </ShiftGuard>
  );
}
