import { useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import AuthGuard from "./components/AuthGuard";
import { useAuth } from "./hook/useAuth";
import AuthLayout from "./layout/AuthLayout";
import MainLayout from "./layout/MainLayout";
import AccountsReceivable from "./pages/accounts/AccountsReceivable";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/dashboard/admin/AdminDashboard";
import UserManagement from "./pages/dashboard/admin/UserManagement";
import Dashboard from "./pages/dashboard/Index";
import Inventory from "./pages/dashboard/Inventory/Inventory";
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
      Component: AuthGuard,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: "dashboard",
          Component: MainLayout,
          children: [
            { index: true, Component: Dashboard },
            { path: "pos", Component: POS },
            { path: "sales-history", Component: SalesHistory },
            { path: "routes", Component: RoutesPage },
            { path: "settlement", Component: Settlements },
            { path: "accounts-receivable", Component: AccountsReceivable },
            { path: "admin/dashboard", Component: AdminDashboard },
            {
              path: "admin/dashboard/users",
              Component: UserManagement,
            },
            {
              path: "admin/dashboard/inventory",
              Component: Inventory,
            },
          ],
        },
      ],
    },

    { path: "*", element: <Navigate to="/auth/login" replace /> },
  ]);

  return <RouterProvider router={router} />;
}
